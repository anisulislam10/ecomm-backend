const Return = require('../models/Return');
const Order = require('../models/Order');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/apiResponse');
const paymentService = require('../services/paymentService');

/**
 * @desc    Create new return request
 * @route   POST /api/returns
 * @access  Private
 */
exports.createReturnRequest = asyncHandler(async (req, res, next) => {
    const { orderId, reason, items } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
        return next(new ApiError(404, 'Order not found'));
    }

    // Verify ownership
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return next(new ApiError(403, 'Unauthorized to return this order'));
    }

    // Verify order status is Delivered
    if (order.status !== 'Delivered') {
        return next(new ApiError(400, 'Only delivered orders can be returned'));
    }

    // Verify return window (2 days = 48 hours)
    const deliveryDate = new Date(order.deliveredAt || order.updatedAt);
    const now = new Date();
    const diffInHours = Math.abs(now - deliveryDate) / 36e5;

    if (diffInHours > 48) {
        return next(new ApiError(400, 'Return period (48 hours) has expired'));
    }

    // Calculate refund and validate items
    let totalRefundAmount = 0;
    const validatedItems = [];

    if (items && items.length > 0) {
        for (const item of items) {
            const orderItem = order.items.find(oi => oi.product.toString() === item.product.toString());
            if (!orderItem) {
                return next(new ApiError(400, `Item ${item.product} not found in order`));
            }
            if (item.quantity > orderItem.quantity) {
                return next(new ApiError(400, `Quantity for ${item.product} exceeds order quantity`));
            }

            totalRefundAmount += orderItem.price * item.quantity;
            validatedItems.push({
                product: item.product,
                quantity: item.quantity,
                price: orderItem.price
            });
        }
    } else {
        // Fallback or full return logic if no items provided (legacy/compat)
        totalRefundAmount = order.totalPrice;
        for (const oi of order.items) {
            validatedItems.push({
                product: oi.product,
                quantity: oi.quantity,
                price: oi.price
            });
        }
    }

    const returnRequest = await Return.create({
        order: orderId,
        user: req.user._id,
        reason,
        items: validatedItems,
        totalRefundAmount
    });

    res.status(201).json(new ApiResponse(201, { returnRequest }, 'Return request submitted successfully'));
});

/**
 * @desc    Get user return requests
 * @route   GET /api/returns/my-returns
 * @access  Private
 */
exports.getMyReturns = asyncHandler(async (req, res, next) => {
    const returns = await Return.find({ user: req.user._id })
        .populate('order')
        .sort('-createdAt');

    res.status(200).json(new ApiResponse(200, { returns }));
});

/**
 * @desc    Get all return requests (Admin)
 * @route   GET /api/returns
 * @access  Private/Admin
 */
exports.getAllReturns = asyncHandler(async (req, res, next) => {
    const returns = await Return.find({})
        .populate('user', 'name email phone')
        .populate('items.product')
        .populate({
            path: 'order',
            populate: {
                path: 'items.product'
            }
        })
        .sort('-createdAt');

    res.status(200).json(new ApiResponse(200, { returns }));
});

/**
 * @desc    Update return status (Admin)
 * @route   PUT /api/returns/:id/status
 * @access  Private/Admin
 */
exports.updateReturnStatus = asyncHandler(async (req, res, next) => {
    const { status } = req.body;
    let { adminNotes } = req.body;

    const returnRequest = await Return.findById(req.params.id);

    if (!returnRequest) {
        return next(new ApiError(404, 'Return request not found'));
    }

    // If status is being updated to Approved, restore product stock
    if (status === 'Approved' && returnRequest.status !== 'Approved') {
        const itemsToRestore = returnRequest.items && returnRequest.items.length > 0
            ? returnRequest.items
            : []; // If legacy return without items, we might not know what to restore safely

        for (const item of itemsToRestore) {
            const product = await Product.findById(item.product);
            if (product) {
                product.stock += item.quantity;
                await product.save();
            }
        }
    }

    // Automated Refund Processing
    if (status === 'Refunded' && returnRequest.status !== 'Refunded') {
        const order = await Order.findById(returnRequest.order);
        if (order && order.paymentMethod === 'Stripe' && order.paymentResult?.id) {
            try {
                // Use totalRefundAmount from returnRequest for partial refund
                const refundAmount = returnRequest.totalRefundAmount || order.totalPrice;
                const refund = await paymentService.createRefund(order.paymentResult.id, refundAmount);
                const refundMsg = ` | Integrated Stripe Refund processed: ${refund.id}`;
                adminNotes = adminNotes ? adminNotes + refundMsg : 'Stripe Refund processed.' + refundMsg;
            } catch (refundErr) {
                // Gracefully handle "already refunded" cases to ensure idempotency
                const isAlreadyRefunded = refundErr.message && (
                    refundErr.message.includes('already been refunded') ||
                    refundErr.message.includes('greater than unrefunded amount')
                );

                if (isAlreadyRefunded) {
                    console.log('Stripe Protocol Detail: Refund verified/depleted in Stripe, proceeding with status update.');
                    const idempotencyMsg = ` | Refund verified/already partially processed in Stripe.`;
                    adminNotes = adminNotes ? adminNotes + idempotencyMsg : 'Refund verified in Stripe.' + idempotencyMsg;
                } else {
                    console.error('Automated Refund Protocol Failed:', refundErr.message);
                    return next(new ApiError(500, `Protocol error: Status set to Refunded but Stripe automated refund failed: ${refundErr.message}`));
                }
            }
        }
    }

    returnRequest.status = status;
    if (adminNotes) returnRequest.adminNotes = adminNotes;

    await returnRequest.save();

    res.status(200).json(new ApiResponse(200, { returnRequest }, 'Return status updated successfully'));
});
