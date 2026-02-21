const crypto = require('crypto');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/apiResponse');
const emailService = require('../services/emailService');
const messages = require('../constants/messages');

/**
 * @desc    Register user (email + password only)
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = asyncHandler(async (req, res, next) => {
    const { name, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        return next(new ApiError(400, 'An account with this email already exists'));
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = await User.create({
        name,
        email,
        password,
        verificationToken,
        verificationTokenExpire: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });

    // Send verification email
    try {
        await emailService.sendVerificationEmail(email, verificationToken);
    } catch (error) {
        console.error('Failed to send verification email:', error);
        // Still create account but notify about email failure
    }

    res.status(201).json(
        new ApiResponse(201, { userId: user._id, email: user.email }, 'Account created! Please check your email to verify your account.')
    );
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        return next(new ApiError(401, messages.INVALID_CREDENTIALS));
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
        return next(new ApiError(401, messages.INVALID_CREDENTIALS));
    }

    // Check if email is verified
    if (!user.isVerified) {
        return res.status(403).json(
            new ApiResponse(403, { emailNotVerified: true, email: user.email }, 'Please verify your email before logging in.')
        );
    }

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json(
        new ApiResponse(
            200,
            {
                accessToken,
                refreshToken,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                    phone: user.phone,
                    isVerified: user.isVerified
                }
            },
            messages.LOGIN_SUCCESS
        )
    );
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = asyncHandler(async (req, res, next) => {
    req.user.refreshToken = undefined;
    await req.user.save();

    res.status(200).json(new ApiResponse(200, null, messages.LOGOUT_SUCCESS));
});

/**
 * @desc    Refresh token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
exports.refreshToken = asyncHandler(async (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return next(new ApiError(400, 'Refresh token required'));
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
        return next(new ApiError(401, 'Invalid refresh token'));
    }

    const newAccessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    user.refreshToken = newRefreshToken;
    await user.save();

    res.status(200).json(
        new ApiResponse(200, {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        })
    );
});

/**
 * @desc    Forgot password
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        // Don't reveal if user exists or not
        return res.status(200).json(new ApiResponse(200, null, 'If an account exists with this email, you will receive a password reset link.'));
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
    await user.save();

    try {
        await emailService.sendPasswordResetEmail(email, resetToken);
        res.status(200).json(new ApiResponse(200, null, 'If an account exists with this email, you will receive a password reset link.'));
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        return next(new ApiError(500, 'Email could not be sent. Please try again later.'));
    }
});

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
    const { token, password } = req.body;

    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
        return next(new ApiError(400, 'This password reset link is invalid or has expired.'));
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json(new ApiResponse(200, null, 'Password reset successful! You can now log in with your new password.'));
});

/**
 * @desc    Verify email
 * @route   GET /api/auth/verify-email?token=...
 * @access  Public
 */
exports.verifyEmail = asyncHandler(async (req, res, next) => {
    const { token } = req.query;

    if (!token) {
        return next(new ApiError(400, 'Verification token is required'));
    }

    const user = await User.findOne({
        verificationToken: token,
        verificationTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
        return next(new ApiError(400, 'This verification link is invalid or has expired. Please request a new one.'));
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();

    res.status(200).json(new ApiResponse(200, { email: user.email }, 'Email verified successfully! You can now log in.'));
});

/**
 * @desc    Resend verification email
 * @route   POST /api/auth/resend-verification
 * @access  Public
 */
exports.resendVerification = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return next(new ApiError(400, 'Email is required'));
    }

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(200).json(new ApiResponse(200, null, 'If an account exists with this email, a new verification link has been sent.'));
    }

    if (user.isVerified) {
        return next(new ApiError(400, 'This email is already verified. Please log in.'));
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    user.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    try {
        await emailService.sendVerificationEmail(email, verificationToken);
        res.status(200).json(new ApiResponse(200, null, 'A new verification link has been sent to your email.'));
    } catch (error) {
        return next(new ApiError(500, 'Failed to send email. Please try again later.'));
    }
});
