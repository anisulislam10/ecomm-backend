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

    // Helper to safety parsing JSON
    const parseJSON = (field) => {
        if (typeof field === 'string') {
            try { return JSON.parse(field); } catch (e) { return field; }
        }
        return field;
    };

    // --- Dynamic Field Handling ---
    // Handle Header
    if (req.body.header) {
        const headerData = parseJSON(req.body.header);
        content.header = { ...content.header, ...headerData };
    }

    // Handle Hero
    // Note: If sent as individually appended "hero[title]" fields, standard parsing might leave them as body keys or nested object depending on config.
    // We assume extended parsing or we handle `req.body.hero` if it's an object.
    if (req.body.hero) {
        // If it's a string (JSON) or object
        const heroData = parseJSON(req.body.hero);
        // If it's an object, merge. 
        if (typeof heroData === 'object') {
            content.hero = { ...content.hero, ...heroData };
        }
    }

    // Handle Impact
    if (req.body.impact) {
        const impactData = parseJSON(req.body.impact);
        if (typeof impactData === 'object') {
            content.impact = { ...content.impact, ...impactData };
        }
    }

    // Handle USPs
    if (req.body.usps) {
        content.usps = parseJSON(req.body.usps);
    }

    // Handle Legacy/Existing Sections
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
        if (flashData.products) {
            content.flashSale.products = flashData.products;
        }
    }
    if (req.body.footer) {
        content.footer = { ...content.footer, ...parseJSON(req.body.footer) };
    }

    // --- Image Uploads ---
    if (req.files) {
        // 1. Hero Image (mapped from 'image' field)
        if (req.files['image']) {
            const result = await uploadSingleImage(req.files['image'][0], 'content');
            if (!content.hero) content.hero = {};
            content.hero.image = result.url;

            // Also update collectiveIndex for legacy compatibility if needed
            if (content.collectiveIndex) content.collectiveIndex.image = result.url;
        }

        // 2. Impact Image
        if (req.files['impactImage']) {
            const result = await uploadSingleImage(req.files['impactImage'][0], 'content');
            if (!content.impact) content.impact = {};
            content.impact.image = result.url;
        }

        // 3. Logo
        if (req.files['logo']) {
            const result = await uploadSingleImage(req.files['logo'][0], 'content');
            if (!content.siteSettings) content.siteSettings = {};
            content.siteSettings.logoUrl = result.url;
        }
    }

    await content.save();

    res.status(200).json(new ApiResponse(200, { content }, 'Content updated successfully'));
});
