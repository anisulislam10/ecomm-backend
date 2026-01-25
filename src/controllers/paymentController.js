const Payment = require('../models/Payment');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/apiResponse');
const paymentService = require('../services/paymentService');
const messages = require('../constants/messages');

/**
 * @desc    Create payment intent
 * @route   POST /api/payment/create-intent
 * @access  Private
 */
exports.createPaymentIntent = asyncHandler(async (req, res, next) => {
    const { amount, orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
        return next(new ApiError(404, messages.ORDER_NOT_FOUND));
    }

    const paymentIntent = await paymentService.createPaymentIntent(amount);

    // Save payment record
    await Payment.create({
        user: req.user._id,
        order: orderId,
        paymentIntentId: paymentIntent.id,
        amount: amount,
        status: 'pending'
    });

    res.status(200).json(
        new ApiResponse(
            200,
            {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id
            },
            messages.PAYMENT_INTENT_CREATED
        )
    );
});

/**
 * @desc    Confirm payment
 * @route   POST /api/payment/confirm
 * @access  Private
 */
exports.confirmPayment = asyncHandler(async (req, res, next) => {
    const { paymentIntentId } = req.body;

    const paymentIntent = await paymentService.confirmPayment(paymentIntentId);

    // Update payment record
    const payment = await Payment.findOne({ paymentIntentId });
    if (payment) {
        payment.status = paymentIntent.status;
        await payment.save();
    }

    res.status(200).json(
        new ApiResponse(200, { status: paymentIntent.status }, messages.PAYMENT_CONFIRMED)
    );
});

/**
 * @desc    Handle Stripe webhook
 * @route   POST /api/payment/webhook
 * @access  Public (Stripe only)
 */
exports.handleWebhook = asyncHandler(async (req, res, next) => {
    const signature = req.headers['stripe-signature'];

    const event = await paymentService.handleWebhook(req.body, signature);

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            // Update payment and order
            const payment = await Payment.findOne({ paymentIntentId: paymentIntent.id });
            if (payment) {
                payment.status = 'succeeded';
                await payment.save();

                // Update order
                const order = await Order.findById(payment.order);
                if (order) {
                    order.isPaid = true;
                    order.paidAt = Date.now();
                    order.status = 'Processing';
                    await order.save();
                }
            }
            break;

        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            const failedPaymentRecord = await Payment.findOne({
                paymentIntentId: failedPayment.id
            });
            if (failedPaymentRecord) {
                failedPaymentRecord.status = 'failed';
                await failedPaymentRecord.save();
            }
            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

/**
 * @desc    Create refund
 * @route   POST /api/payment/refund
 * @access  Private/Admin
 */
exports.createRefund = asyncHandler(async (req, res, next) => {
    const { paymentIntentId, amount } = req.body;

    const refund = await paymentService.createRefund(paymentIntentId, amount);

    res.status(200).json(new ApiResponse(200, { refund }, messages.REFUND_PROCESSED));
});
