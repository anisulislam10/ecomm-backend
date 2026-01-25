const Ad = require('../models/Ad');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/apiResponse');
const { uploadSingleImage, deleteImage } = require('../services/fileUploadService');

/**
 * @desc    Get all ads (Admin)
 */
exports.getAds = asyncHandler(async (req, res, next) => {
    const ads = await Ad.find().sort('-createdAt');
    res.status(200).json(new ApiResponse(200, { ads }));
});

/**
 * @desc    Get active ads (Public)
 */
exports.getActiveAds = asyncHandler(async (req, res, next) => {
    const ads = await Ad.find({ isActive: true });
    res.status(200).json(new ApiResponse(200, { ads }));
});

/**
 * @desc    Create new ad
 */
exports.createAd = asyncHandler(async (req, res, next) => {
    if (!req.file) {
        return next(new ApiError(400, 'Please upload an ad image'));
    }

    const { title, description, link, type, isActive, displayFrequency } = req.body;

    // Upload to Cloudinary using service
    const imageInfo = await uploadSingleImage(req.file, 'ads');

    const ad = await Ad.create({
        title,
        description,
        link,
        type,
        isActive: isActive === 'true' || isActive === true,
        displayFrequency: Number(displayFrequency) || 1,
        image: imageInfo,
        user: req.user._id
    });

    res.status(201).json(new ApiResponse(201, { ad }, 'Ad created successfully'));
});

/**
 * @desc    Update ad
 */
exports.updateAd = asyncHandler(async (req, res, next) => {
    let ad = await Ad.findById(req.params.id);

    if (!ad) {
        return next(new ApiError(404, 'Ad not found'));
    }

    const { title, description, link, type, isActive, displayFrequency } = req.body;

    const updateData = {
        title: title || ad.title,
        description: description || ad.description,
        link: link || ad.link,
        type: type || ad.type,
        isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : ad.isActive,
        displayFrequency: displayFrequency !== undefined ? Number(displayFrequency) : ad.displayFrequency
    };

    if (req.file) {
        // Delete old image using service
        await deleteImage(ad.image.public_id);

        // Upload new image using service
        updateData.image = await uploadSingleImage(req.file, 'ads');
    }

    ad = await Ad.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true
    });

    res.status(200).json(new ApiResponse(200, { ad }, 'Ad updated successfully'));
});

/**
 * @desc    Delete ad
 */
exports.deleteAd = asyncHandler(async (req, res, next) => {
    const ad = await Ad.findById(req.params.id);

    if (!ad) {
        return next(new ApiError(404, 'Ad not found'));
    }

    // Delete image using service
    await deleteImage(ad.image.public_id);

    await ad.deleteOne();

    res.status(200).json(new ApiResponse(200, null, 'Ad deleted successfully'));
});
