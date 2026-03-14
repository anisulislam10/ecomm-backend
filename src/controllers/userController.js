const User = require('../models/User');
const Address = require('../models/Address');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/apiResponse');
const { uploadSingleImage } = require('../services/fileUploadService');
const messages = require('../constants/messages');

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
exports.getProfile = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user._id);

    res.status(200).json(new ApiResponse(200, { user }));
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
exports.updateProfile = asyncHandler(async (req, res, next) => {
    const { name, phone } = req.body;

    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone) user.phone = phone;

    // Handle avatar upload if file is present
    if (req.file) {
        const result = await uploadSingleImage(req.file, 'avatars');
        user.avatar = result.url;
    }

    await user.save();

    res.status(200).json(new ApiResponse(200, { user }, messages.PROFILE_UPDATED));
});

/**
 * @desc    Get user addresses
 * @route   GET /api/users/addresses
 * @access  Private
 */
exports.getAddresses = asyncHandler(async (req, res, next) => {
    const addresses = await Address.find({ user: req.user._id });

    res.status(200).json(new ApiResponse(200, { addresses }));
});

/**
 * @desc    Add address
 * @route   POST /api/users/address
 * @access  Private
 */
exports.addAddress = asyncHandler(async (req, res, next) => {
    const { fullName, phoneNumber, streetAddress, city, state, postalCode, country, isDefault } = req.body;

    // If this is set as default, unset other default addresses
    if (isDefault) {
        await Address.updateMany(
            { user: req.user._id, isDefault: true },
            { isDefault: false }
        );
    }

    const address = await Address.create({
        user: req.user._id,
        fullName,
        phoneNumber,
        streetAddress,
        city,
        state,
        postalCode,
        country,
        isDefault
    });

    res.status(201).json(new ApiResponse(201, { address }, messages.ADDRESS_ADDED));
});

/**
 * @desc    Update address
 * @route   PUT /api/users/address/:id
 * @access  Private
 */
exports.updateAddress = asyncHandler(async (req, res, next) => {
    const address = await Address.findOne({
        _id: req.params.id,
        user: req.user._id
    });

    if (!address) {
        return next(new ApiError(404, 'Address not found'));
    }

    // If setting as default, unset other default addresses
    if (req.body.isDefault) {
        await Address.updateMany(
            { user: req.user._id, isDefault: true, _id: { $ne: address._id } },
            { isDefault: false }
        );
    }

    Object.assign(address, req.body);
    await address.save();

    res.status(200).json(new ApiResponse(200, { address }, messages.ADDRESS_UPDATED));
});

/**
 * @desc    Delete address
 * @route   DELETE /api/users/address/:id
 * @access  Private
 */
exports.deleteAddress = asyncHandler(async (req, res, next) => {
    const address = await Address.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id
    });

    if (!address) {
        return next(new ApiError(404, 'Address not found'));
    }

    res.status(200).json(new ApiResponse(200, null, messages.ADDRESS_DELETED));
});

/**
 * @desc    Change password
 * @route   PUT /api/users/change-password
 * @access  Private
 */
exports.changePassword = asyncHandler(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.matchPassword(currentPassword))) {
        return next(new ApiError(401, 'Current password is incorrect'));
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json(new ApiResponse(200, null, 'Password updated successfully'));
});

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private/Admin
 */
/**
 * @desc    Toggle wishlist item
 * @route   POST /api/users/wishlist/:productId
 * @access  Private
 */
exports.toggleWishlist = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    const productId = req.params.productId;

    const isWishlisted = user.wishlist.includes(productId);

    if (isWishlisted) {
        user.wishlist = user.wishlist.filter(id => id.toString() !== productId.toString());
    } else {
        user.wishlist.push(productId);
    }

    await user.save();

    res.status(200).json(new ApiResponse(200, { wishlist: user.wishlist }, isWishlisted ? 'Removed from wishlist' : 'Added to wishlist'));
});

/**
 * @desc    Get user wishlist
 * @route   GET /api/users/wishlist
 * @access  Private
 */
exports.getWishlist = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user._id).populate('wishlist');

    res.status(200).json(new ApiResponse(200, { wishlist: user.wishlist }));
});

/**
 * @desc    Get wishlist stats (Admin)
 * @route   GET /api/users/admin/wishlist-stats
 * @access  Private/Admin
 */
exports.getWishlistStats = asyncHandler(async (req, res, next) => {
    // Aggregate most wishlisted products
    const stats = await User.aggregate([
        { $unwind: '$wishlist' },
        {
            $group: {
                _id: '$wishlist',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
            $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: '_id',
                as: 'product'
            }
        },
        { $unwind: '$product' }
    ]);

    res.status(200).json(new ApiResponse(200, { stats }));
});

exports.getAllUsers = asyncHandler(async (req, res, next) => {
    const users = await User.find({}).sort('-createdAt');
    res.status(200).json(new ApiResponse(200, { users }));
});
