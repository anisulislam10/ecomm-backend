const transporter = require('../config/mailer');

const brandColor = '#7C3AED';
const brandName = 'Avenly';

const emailWrapper = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" style="max-width:560px;" cellspacing="0" cellpadding="0" border="0">
          <!-- Header -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#7C3AED,#DB2777);border-radius:16px 16px 0 0;padding:32px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">${brandName}</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;letter-spacing:2px;text-transform:uppercase;">by Huma</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              ${content}
              <!-- Footer -->
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 24px;">
              <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;line-height:1.6;">
                © ${new Date().getFullYear()} ${brandName} by Huma. All rights reserved.<br>
                If you didn't request this email, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * @desc    Send verification email
 */
exports.sendVerificationEmail = async (email, verificationToken) => {
    const verificationUrl = `${process.env.CLIENT_URL}/#/verify-email?token=${verificationToken}`;

    const content = `
      <div style="text-align:center;margin-bottom:32px;">
        <div style="width:64px;height:64px;background:#f3e8ff;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
          <span style="font-size:32px;">✉️</span>
        </div>
        <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">Verify Your Email</h2>
        <p style="margin:0;color:#6b7280;font-size:15px;">Welcome to ${brandName}! Click the button below to activate your account.</p>
      </div>
      <div style="text-align:center;margin:32px 0;">
        <a href="${verificationUrl}"
           style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#DB2777);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
          Verify My Email
        </a>
      </div>
      <p style="color:#6b7280;font-size:13px;text-align:center;margin:0;">
        This link expires in <strong>24 hours</strong>.<br>
        If the button doesn't work, copy and paste this link:<br>
        <a href="${verificationUrl}" style="color:#7C3AED;word-break:break-all;font-size:12px;">${verificationUrl}</a>
      </p>
    `;

    const mailOptions = {
        from: `"${brandName}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Verify your ${brandName} account`,
        html: emailWrapper(content)
    };

    await transporter.sendMail(mailOptions);
};

/**
 * @desc    Send password reset email
 */
exports.sendPasswordResetEmail = async (email, resetToken) => {
    const resetUrl = `${process.env.CLIENT_URL}/#/reset-password?token=${resetToken}`;

    const content = `
      <div style="text-align:center;margin-bottom:32px;">
        <div style="width:64px;height:64px;background:#fef3c7;border-radius:50%;margin:0 auto 16px;">
          <span style="font-size:32px;line-height:64px;">🔑</span>
        </div>
        <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">Reset Your Password</h2>
        <p style="margin:0;color:#6b7280;font-size:15px;">We received a request to reset your password. Click below to choose a new one.</p>
      </div>
      <div style="text-align:center;margin:32px 0;">
        <a href="${resetUrl}"
           style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#DB2777);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:600;">
          Reset Password
        </a>
      </div>
      <p style="color:#6b7280;font-size:13px;text-align:center;margin:0;">
        This link expires in <strong>1 hour</strong>.<br>
        If you didn't request this, please ignore this email — your password won't change.<br><br>
        <a href="${resetUrl}" style="color:#7C3AED;word-break:break-all;font-size:12px;">${resetUrl}</a>
      </p>
    `;

    const mailOptions = {
        from: `"${brandName}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Reset your ${brandName} password`,
        html: emailWrapper(content)
    };

    await transporter.sendMail(mailOptions);
};

/**
 * @desc    Send order confirmation email
 */
exports.sendOrderConfirmationEmail = async (email, order) => {
    const content = `
      <div style="text-align:center;margin-bottom:32px;">
        <div style="width:64px;height:64px;background:#d1fae5;border-radius:50%;margin:0 auto 16px;">
          <span style="font-size:32px;line-height:64px;">✅</span>
        </div>
        <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">Order Confirmed!</h2>
        <p style="margin:0;color:#6b7280;font-size:15px;">Thank you for shopping with ${brandName}.</p>
      </div>
      <div style="background:#f9fafb;border-radius:10px;padding:20px;margin:24px 0;">
        <p style="margin:0 0 8px;color:#374151;font-size:14px;"><strong>Order ID:</strong> ${order._id}</p>
        <p style="margin:0;color:#374151;font-size:14px;"><strong>Total:</strong> $${order.totalPrice}</p>
      </div>
      <p style="color:#6b7280;font-size:13px;text-align:center;">We'll send you another email when your order ships.</p>
    `;

    const mailOptions = {
        from: `"${brandName}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Order Confirmed — ${brandName}`,
        html: emailWrapper(content)
    };

    await transporter.sendMail(mailOptions);
};

/**
 * @desc    Send shipping update email
 */
exports.sendShippingUpdateEmail = async (email, order) => {
    const content = `
      <div style="text-align:center;margin-bottom:32px;">
        <div style="width:64px;height:64px;background:#dbeafe;border-radius:50%;margin:0 auto 16px;">
          <span style="font-size:32px;line-height:64px;">🚚</span>
        </div>
        <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">Your Order Has Shipped!</h2>
        <p style="margin:0;color:#6b7280;font-size:15px;">Great news — your ${brandName} order is on its way.</p>
      </div>
      <div style="background:#f9fafb;border-radius:10px;padding:20px;margin:24px 0;">
        <p style="margin:0 0 8px;color:#374151;font-size:14px;"><strong>Order ID:</strong> ${order._id}</p>
        <p style="margin:0;color:#374151;font-size:14px;"><strong>Tracking:</strong> ${order.trackingNumber || 'N/A'}</p>
      </div>
      <p style="color:#6b7280;font-size:13px;text-align:center;">Thank you for shopping with us. We hope you love your purchase!</p>
    `;

    const mailOptions = {
        from: `"${brandName}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Your ${brandName} order has shipped!`,
        html: emailWrapper(content)
    };

    await transporter.sendMail(mailOptions);
};
