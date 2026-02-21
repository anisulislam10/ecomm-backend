const Stripe = require('stripe');
const GatewaySetting = require('../models/GatewaySetting');
const ApiError = require('../utils/ApiError');

/**
 * @desc    Get active Stripe instance
 */
const getStripeInstance = async () => {
    const setting = await GatewaySetting.findOne({ gateway: 'stripe', isActive: true });
    if (!setting) {
        throw new ApiError(400, 'Stripe payment gateway is not configured or active');
    }

    const secretKey = setting.mode === 'live' ? setting.liveSecretKey : setting.testSecretKey;
    if (!secretKey) {
        throw new ApiError(400, `Stripe ${setting.mode} secret key is missing`);
    }

    return new Stripe(secretKey);
};

/**
 * @desc    Create payment intent
 */
exports.createPaymentIntent = async (amount, currency = 'usd') => {
    try {
        const stripe = await getStripeInstance();
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency,
            payment_method_types: ['card']
        });

        return paymentIntent;
    } catch (error) {
        console.error('Stripe Payment Intent Error:', error.message);
        throw new ApiError(error.statusCode || 500, error.message || 'Failed to create payment intent');
    }
};

/**
 * @desc    Confirm payment
 */
exports.confirmPayment = async (paymentIntentId) => {
    try {
        const stripe = await getStripeInstance();
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        return paymentIntent;
    } catch (error) {
        console.error('Stripe Payment Retrieve Error:', error.message);
        throw new ApiError(error.statusCode || 500, error.message || 'Failed to confirm payment');
    }
};

/**
 * @desc    Create refund
 */
exports.createRefund = async (paymentIntentId, amount) => {
    try {
        const stripe = await getStripeInstance();
        const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: amount ? Math.round(amount * 100) : undefined
        });

        return refund;
    } catch (error) {
        console.error('Stripe Refund Error:', error.message);
        throw new ApiError(error.statusCode || 500, error.message || 'Failed to create refund');
    }
};

/**
 * @desc    Handle Stripe webhooks
 */
exports.handleWebhook = async (body, signature) => {
    try {
        const setting = await GatewaySetting.findOne({ gateway: 'stripe', isActive: true });
        if (!setting) {
            throw new ApiError(400, 'Stripe gateway not active');
        }

        const stripe = new Stripe(setting.mode === 'live' ? setting.liveSecretKey : setting.testSecretKey);
        const webhookSecret = setting.mode === 'live' ? setting.liveWebhookSecret : setting.testWebhookSecret;

        if (!webhookSecret) {
            console.warn(`Protocol Warning: No webhook secret found for ${setting.mode} mode. Falling back to ENV.`);
        }

        const event = stripe.webhooks.constructEvent(
            body,
            signature,
            webhookSecret || process.env.STRIPE_WEBHOOK_SECRET
        );

        return event;
    } catch (error) {
        throw new ApiError(400, `Webhook signature verification failed: ${error.message}`);
    }
};
