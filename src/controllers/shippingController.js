const ShippingSetting = require('../models/ShippingSetting');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');

/**
 * @desc    Get shipping settings
 * @route   GET /api/shipping
 * @access  Public
 */
exports.getShippingSettings = asyncHandler(async (req, res) => {
    let settings = await ShippingSetting.findOne({ isActive: true });

    if (!settings) {
        // Create default settings if none exist
        settings = await ShippingSetting.create({
            shippingFee: 15,
            freeShippingThreshold: 100,
            isActive: true
        });
    }

    res.status(200).json(new ApiResponse(200, { settings }, 'Shipping settings retrieved successfully'));
});

/**
 * @desc    Update shipping settings
 * @route   PUT /api/shipping
 * @access  Private/Admin
 */
exports.updateShippingSettings = asyncHandler(async (req, res) => {
    const { shippingFee, freeShippingThreshold } = req.body;

    let settings = await ShippingSetting.findOne({ isActive: true });

    if (!settings) {
        settings = new ShippingSetting({ isActive: true });
    }

    if (shippingFee !== undefined) settings.shippingFee = shippingFee;
    if (freeShippingThreshold !== undefined) settings.freeShippingThreshold = freeShippingThreshold;

    await settings.save();

    res.status(200).json(new ApiResponse(200, { settings }, 'Shipping settings updated successfully'));
});
