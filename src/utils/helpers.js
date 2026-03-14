/**
 * Format price to 2 decimal places
 */
exports.formatPrice = (price) => {
    return parseFloat(price).toFixed(2);
};

/**
 * Generate random string
 */
exports.generateRandomString = (length = 32) => {
    return require('crypto').randomBytes(length).toString('hex');
};

/**
 * Calculate tax (10%)
 */
exports.calculateTax = (price) => {
    return parseFloat((price * 0.1).toFixed(2));
};

/**
 * Calculate shipping price
 */
exports.calculateShippingPrice = (itemsPrice) => {
    if (itemsPrice > 100) {
        return 0; // Free shipping over $100
    }
    return 10; // $10 flat rate
};

/**
 * Generate tracking number
 */
exports.generateTrackingNumber = () => {
    const prefix = 'TRK';
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}${timestamp}${random}`;
};
