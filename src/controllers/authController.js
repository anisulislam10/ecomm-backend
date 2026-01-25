const crypto = require('crypto');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/apiResponse');
const emailService = require('../services/emailService');
const messages = require('../constants/messages');

/**
 * @desc    Register user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = asyncHandler(async (req, res, next) => {
    const { name, email, password, phone } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        return next(new ApiError(400, 'User already exists'));
    }

    // Create user
    const user = await User.create({
        name,
        email,
        password,
        phone
    });

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    await user.save();

    // Send verification email
    try {
        await emailService.sendVerificationEmail(email, verificationToken);
    } catch (error) {
        console.error('Failed to send verification email:', error);
    }

    res.status(201).json(
        new ApiResponse(201, { userId: user._id, email: user.email }, messages.USER_REGISTERED)
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
                    role: user.role
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
    // Clear refresh token
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

    // Generate new tokens
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
        return next(new ApiError(404, messages.USER_NOT_FOUND));
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email
    try {
        await emailService.sendPasswordResetEmail(email, resetToken);
        res.status(200).json(new ApiResponse(200, null, messages.EMAIL_SENT));
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        return next(new ApiError(500, 'Email could not be sent'));
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
        return next(new ApiError(400, 'Invalid or expired token'));
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json(new ApiResponse(200, null, messages.PASSWORD_RESET_SUCCESS));
});

/**
 * @desc    Verify email
 * @route   POST /api/auth/verify-email
 * @access  Public
 */
exports.verifyEmail = asyncHandler(async (req, res, next) => {
    const { token } = req.body;

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
        return next(new ApiError(400, 'Invalid verification token'));
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json(new ApiResponse(200, null, messages.EMAIL_VERIFIED));
});
