const transporter = require('../config/mailer');

/**
 * @desc    Send verification email
 */
exports.sendVerificationEmail = async (email, verificationToken) => {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

    const mailOptions = {
        from: `"E-commerce" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Email Verification',
        html: `
            <h1>Welcome to E-commerce!</h1>
            <p>Please click the link below to verify your email address:</p>
            <a href="${verificationUrl}">Verify Email</a>
            <p>This link will expire in 24 hours.</p>
        `
    };

    await transporter.sendMail(mailOptions);
};

/**
 * @desc    Send password reset email
 */
exports.sendPasswordResetEmail = async (email, resetToken) => {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
        from: `"E-commerce" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Password Reset Request',
        html: `
            <h1>Password Reset</h1>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <a href="${resetUrl}">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
        `
    };

    await transporter.sendMail(mailOptions);
};

/**
 * @desc    Send order confirmation email
 */
exports.sendOrderConfirmationEmail = async (email, order) => {
    const mailOptions = {
        from: `"E-commerce" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Order Confirmation',
        html: `
            <h1>Order Confirmed!</h1>
            <p>Thank you for your order. Your order ID is: ${order._id}</p>
            <p>Total Amount: $${order.totalPrice}</p>
            <p>We'll send you another email when your order ships.</p>
        `
    };

    await transporter.sendMail(mailOptions);
};

/**
 * @desc    Send shipping update email
 */
exports.sendShippingUpdateEmail = async (email, order) => {
    const mailOptions = {
        from: `"E-commerce" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Order Has Shipped',
        html: `
            <h1>Your Order Has Shipped!</h1>
            <p>Your order (ID: ${order._id}) has been shipped.</p>
            <p>Tracking Number: ${order.trackingNumber || 'N/A'}</p>
            <p>Thank you for shopping with us!</p>
        `
    };

    await transporter.sendMail(mailOptions);
};
