const Stripe = require('stripe');

const key = process.env.STRIPE_SECRET_KEY;
if (key && key.includes('...')) {
    console.error('CRITICAL: Stripe Secret Key contains literal dots (...) and is invalid. Please reveal the full key in your dashboard.');
}

const stripe = new Stripe(key);

module.exports = stripe;
