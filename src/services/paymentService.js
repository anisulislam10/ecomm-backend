const stripe = require('../config/stripe');
const ApiError = require('../utils/ApiError');

/**
 * @desc    Create payment intent
 */
exports.createPaymentIntent = async (amount, currency = 'usd') => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency,
            payment_method_types: ['card']
        });

        return paymentIntent;
    } catch (error) {
        console.error('Stripe Payment Intent Error:', error.message);
        throw new ApiError(500, error.message || 'Failed to create payment intent');
    }
};

/**
 * @desc    Confirm payment
 */
exports.confirmPayment = async (paymentIntentId) => {
    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        return paymentIntent;
    } catch (error) {
        console.error('Stripe Payment Retrieve Error:', error.message);
        throw new ApiError(500, error.message || 'Failed to confirm payment');
    }
};

/**
 * @desc    Create refund
 */
exports.createRefund = async (paymentIntentId, amount) => {
    try {
        const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: amount ? Math.round(amount * 100) : undefined
        });

        return refund;
    } catch (error) {
        console.error('Stripe Refund Error:', error.message);
        throw new ApiError(500, error.message || 'Failed to create refund');
    }
};

/**
 * @desc    Handle Stripe webhooks
 */
exports.handleWebhook = async (body, signature) => {
    try {
        const event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        return event;
    } catch (error) {
        throw new ApiError(400, 'Webhook signature verification failed');
    }
};
