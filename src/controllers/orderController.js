const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/apiResponse');
const emailService = require('../services/emailService');
const messages = require('../constants/messages');

/**
 * @desc    Create new order
 * @route   POST /api/orders
 * @access  Private
 */
exports.createOrder = asyncHandler(async (req, res, next) => {
    const {
        items,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice
    } = req.body;

    if (!items || items.length === 0) {
        return next(new ApiError(400, 'No order items'));
    }

    // Verify and Update product stock
    for (const item of items) {
        const product = await Product.findById(item.product);
        if (!product) {
            return next(new ApiError(404, `Product not found: ${item.product}`));
        }
        if (product.stock < item.quantity) {
            return next(new ApiError(400, `Insufficient stock for product: ${product.name}. Available: ${product.stock}`));
        }
        product.stock -= item.quantity;
        await product.save();
    }

    const order = await Order.create({
        user: req.user._id,
        items,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice
    });

    // Send order confirmation email
    try {
        await emailService.sendOrderConfirmationEmail(req.user.email, order);
    } catch (error) {
        console.error('Failed to send order confirmation email:', error);
    }

    res.status(201).json(new ApiResponse(201, { order }, messages.ORDER_CREATED));
});

/**
 * @desc    Get user orders
 * @route   GET /api/orders/my-orders
 * @access  Private
 */
exports.getMyOrders = asyncHandler(async (req, res, next) => {
    const orders = await Order.find({ user: req.user._id })
        .populate('items.product')
        .sort('-createdAt');

    res.status(200).json(new ApiResponse(200, { orders }));
});

/**
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
exports.getOrderById = asyncHandler(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ApiError(400, 'Invalid order ID format'));
    }
    const order = await Order.findById(req.params.id)
        .populate('user', 'name email')
        .populate('items.product');

    if (!order) {
        return next(new ApiError(404, messages.ORDER_NOT_FOUND));
    }

    // Make sure user owns this order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return next(new ApiError(403, messages.FORBIDDEN));
    }

    res.status(200).json(new ApiResponse(200, { order }));
});

/**
 * @desc    Update order to paid
 * @route   PUT /api/orders/:id/pay
 * @access  Private
 */
exports.updateOrderToPaid = asyncHandler(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ApiError(400, 'Invalid order ID format'));
    }
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ApiError(404, messages.ORDER_NOT_FOUND));
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.email_address
    };
    order.status = 'Processing';

    const updatedOrder = await order.save();

    res.status(200).json(new ApiResponse(200, { order: updatedOrder }, messages.ORDER_UPDATED));
});

/**
 * @desc    Cancel order
 * @route   PUT /api/orders/:id/cancel
 * @access  Private
 */
exports.cancelOrder = asyncHandler(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ApiError(400, 'Invalid order ID format'));
    }
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ApiError(404, messages.ORDER_NOT_FOUND));
    }

    // Make sure user owns this order
    if (order.user.toString() !== req.user._id.toString()) {
        return next(new ApiError(403, messages.FORBIDDEN));
    }

    // Can only cancel if not shipped
    if (order.status === 'Shipped' || order.status === 'Delivered') {
        return next(new ApiError(400, 'Cannot cancel shipped or delivered orders'));
    }

    order.status = 'Cancelled';

    // Restore product stock
    for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
            product.stock += item.quantity;
            await product.save();
        }
    }

    await order.save();

    res.status(200).json(new ApiResponse(200, { order }, messages.ORDER_CANCELLED));
});

/**
 * @desc    Update order to delivered
 * @route   PUT /api/orders/:id/deliver
 * @access  Private/Admin
 */
exports.updateOrderToDelivered = asyncHandler(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ApiError(400, 'Invalid order ID format'));
    }
    const order = await Order.findById(req.params.id).populate('user', 'email');

    if (!order) {
        return next(new ApiError(404, messages.ORDER_NOT_FOUND));
    }

    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.status = 'Delivered';

    const updatedOrder = await order.save();

    res.status(200).json(new ApiResponse(200, { order: updatedOrder }, messages.ORDER_UPDATED));
});

/**
 * @desc    Update order status (for shipping)
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 */
exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ApiError(400, 'Invalid order ID format'));
    }
    const { status, trackingNumber } = req.body;

    const order = await Order.findById(req.params.id).populate('user', 'email');

    if (!order) {
        return next(new ApiError(404, messages.ORDER_NOT_FOUND));
    }

    order.status = status;
    if (trackingNumber) {
        order.trackingNumber = trackingNumber;
    }

    // Send shipping email if status is shipped
    if (status === 'Shipped') {
        try {
            await emailService.sendShippingUpdateEmail(order.user.email, order);
        } catch (error) {
            console.error('Failed to send shipping email:', error);
        }
    }

    await order.save();

    res.status(200).json(new ApiResponse(200, { order }, messages.ORDER_UPDATED));
});

/**
 * @desc    Get all orders
 * @route   GET /api/orders
 * @access  Private/Admin
 */
exports.getAllOrders = asyncHandler(async (req, res, next) => {
    const orders = await Order.find({})
        .populate('user', 'name email phone')
        .populate('items.product')
        .sort('-createdAt');

    res.status(200).json(new ApiResponse(200, { orders }));
});

/**
 * @desc    Track order public
 * @route   POST /api/orders/track
 * @access  Public
 */
exports.trackOrder = asyncHandler(async (req, res, next) => {
    const { orderId } = req.body;

    if (!orderId) {
        return next(new ApiError(400, 'Please provide order ID'));
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return next(new ApiError(400, 'Invalid order ID format. Please provide the full 24-character Order ID.'));
    }

    const order = await Order.findById(orderId)
        .select('status createdAt totalPrice isDelivered isPaid trackingNumber items')
        .populate('items.product', 'name price image images');

    if (!order) {
        return next(new ApiError(404, messages.ORDER_NOT_FOUND));
    }

    res.status(200).json(new ApiResponse(200, { order }));
});
