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

/**
 * @desc    Get PayPal Access Token
 */
const getPaypalAccessToken = async () => {
    const setting = await GatewaySetting.findOne({ gateway: 'paypal', isActive: true });
    if (!setting) {
        throw new ApiError(400, 'PayPal gateway is not configured or active');
    }

    const clientId = setting.mode === 'live' ? setting.livePublishableKey : setting.testPublishableKey;
    const clientSecret = setting.mode === 'live' ? setting.liveSecretKey : setting.testSecretKey;

    if (!clientId || !clientSecret) {
        throw new ApiError(400, `PayPal ${setting.mode} credentials are missing`);
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const baseUrl = setting.mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    if (!response.ok) {
        console.error('PayPal Auth Error:', data);
        throw new ApiError(response.status, data.message || 'PayPal Authentication failed');
    }

    return data.access_token;
};

/**
 * @desc    Create PayPal Order
 */
exports.createPaypalOrder = async (amount, currency = 'USD') => {
    const accessToken = await getPaypalAccessToken();
    const setting = await GatewaySetting.findOne({ gateway: 'paypal' });
    const baseUrl = setting.mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

    const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            intent: 'CAPTURE',
            purchase_units: [
                {
                    amount: {
                        currency_code: currency,
                        value: amount.toFixed(2)
                    }
                }
            ]
        })
    });

    const data = await response.json();
    if (!response.ok) {
        console.error('PayPal Order Creation Error:', data);
        throw new ApiError(response.status, data.message || 'Failed to create PayPal order');
    }

    return data;
};

/**
 * @desc    Capture PayPal Order
 */
exports.capturePaypalOrder = async (paypalOrderId) => {
    const accessToken = await getPaypalAccessToken();
    const setting = await GatewaySetting.findOne({ gateway: 'paypal' });
    const baseUrl = setting.mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

    const response = await fetch(`${baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });

    const data = await response.json();
    if (!response.ok) {
        console.error('PayPal Capture Error:', data);
        throw new ApiError(response.status, data.message || 'Failed to capture PayPal order');
    }

    return data;
};

/**
 * @desc    Get PayPal Order Details
 */
const getPaypalOrderDetails = async (orderId) => {
    const accessToken = await getPaypalAccessToken();
    const setting = await GatewaySetting.findOne({ gateway: 'paypal' });
    const baseUrl = setting.mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

    const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });

    const data = await response.json();
    if (!response.ok) {
        throw new ApiError(response.status, data.message || 'Failed to fetch PayPal order details');
    }
    return data;
};

/**
 * @desc    Refund PayPal Order
 */
exports.refundPaypalOrder = async (id, amount, currency = 'USD') => {
    const accessToken = await getPaypalAccessToken();
    const setting = await GatewaySetting.findOne({ gateway: 'paypal' });
    const baseUrl = setting.mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

    const body = amount ? {
        amount: {
            value: amount.toFixed(2),
            currency_code: currency
        }
    } : {};

    const performRefund = async (captureId) => {
        return await fetch(`${baseUrl}/v2/payments/captures/${captureId}/refund`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
    };

    // Initial attempt
    let response = await performRefund(id);
    let data = await response.json();

    // Recovery logic for old orders (if ID is an Order ID instead of a Capture ID)
    if (!response.ok && (response.status === 404 || data.name === 'RESOURCE_NOT_FOUND')) {
        console.warn(`PayPal Refund: ID ${id} not found as Capture. Attempting recovery from Order details...`);
        try {
            const orderDetails = await getPaypalOrderDetails(id);
            const recoveredCaptureId = orderDetails.purchase_units?.[0]?.payments?.captures?.[0]?.id;

            if (recoveredCaptureId) {
                console.info(`PayPal Refund Recovery: Success. Using Capture ID ${recoveredCaptureId}`);
                response = await performRefund(recoveredCaptureId);
                data = await response.json();
            }
        } catch (recoveryError) {
            console.error('PayPal Refund Recovery Protocol Failed:', recoveryError.message);
        }
    }

    if (!response.ok) {
        console.error('PayPal Refund Error:', data);
        throw new ApiError(response.status, data.message || 'Failed to process PayPal refund');
    }

    return data;
};

