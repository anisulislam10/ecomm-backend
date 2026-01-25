const Content = require('../models/Content');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const { uploadSingleImage, deleteImage } = require('../services/fileUploadService');

/**
 * @desc    Get content by identifier
 * @route   GET /api/content/:identifier
 * @access  Public
 */
exports.getContent = asyncHandler(async (req, res) => {
    const { identifier } = req.params;
    let content = await Content.findOne({ identifier }).populate('flashSale.products');

    if (!content) {
        // Create default if not exists
        content = await Content.create({ identifier });
    }

    res.status(200).json(new ApiResponse(200, { content }));
});

/**
 * @desc    Update content
 * @route   PUT /api/content/:identifier
 * @access  Private/Admin
 */
exports.updateContent = asyncHandler(async (req, res) => {
    const { identifier } = req.params;
    let content = await Content.findOne({ identifier });

    if (!content) {
        content = new Content({ identifier });
    }

    // deep merge or specific update logic
    // Helper to parse JSON from FormData
    const parseJSON = (field) => {
        if (typeof field === 'string') {
            try { return JSON.parse(field); } catch (e) { return field; }
        }
        return field;
    };

    if (req.body.collectiveIndex) {
        content.collectiveIndex = { ...content.collectiveIndex, ...parseJSON(req.body.collectiveIndex) };
    }
    if (req.body.siteSettings) {
        content.siteSettings = { ...content.siteSettings, ...parseJSON(req.body.siteSettings) };
    }
    if (req.body.latestAdditions) {
        content.latestAdditions = { ...content.latestAdditions, ...parseJSON(req.body.latestAdditions) };
    }
    if (req.body.flashSale) {
        const flashData = parseJSON(req.body.flashSale);
        content.flashSale = { ...content.flashSale, ...flashData };
        // Ensure products array is set correctly (if sent as array of IDs)
        if (flashData.products) {
            content.flashSale.products = flashData.products;
        }
    }
    if (req.body.footer) {
        content.footer = { ...content.footer, ...parseJSON(req.body.footer) };
    }

    // Handle image uploads
    // We expect fields: 'image' (collective index) or 'logo' (site logo)
    // multer upload.fields([{ name: 'image', maxCount: 1 }, { name: 'logo', maxCount: 1 }])

    if (req.files) {
        if (req.files['image']) {
            const result = await uploadSingleImage(req.files['image'][0], 'content');
            content.collectiveIndex.image = result.url;
        }
        if (req.files['logo']) {
            const result = await uploadSingleImage(req.files['logo'][0], 'content');
            content.siteSettings.logoUrl = result.url;
        }
    }

    await content.save();

    res.status(200).json(new ApiResponse(200, { content }, 'Content updated successfully'));
});
