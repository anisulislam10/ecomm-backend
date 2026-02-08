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

    // Handle Hero (Legacy)
    if (req.body.hero) {
        const heroData = parseJSON(req.body.hero);
        if (typeof heroData === 'object') {
            content.hero = { ...content.hero, ...heroData };
        }
    }

    // Handle Hero Slides (Dynamic)
    if (req.body.heroSlides) {
        content.heroSlides = parseJSON(req.body.heroSlides);
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
        // Normalize req.files to an object if it's an array (from upload.any())
        const filesObj = {};
        if (Array.isArray(req.files)) {
            req.files.forEach(file => {
                filesObj[file.fieldname] = [file];
            });
        } else {
            Object.assign(filesObj, req.files);
        }

        // 1. Hero Image (mapped from 'image' field)
        if (filesObj['image']) {
            const result = await uploadSingleImage(filesObj['image'][0], 'content');
            if (!content.hero) content.hero = {};
            content.hero.image = result.url;

            // Also update collectiveIndex for legacy compatibility if needed
            if (content.collectiveIndex) content.collectiveIndex.image = result.url;
        }

        // 2. Impact Image
        if (filesObj['impactImage']) {
            const result = await uploadSingleImage(filesObj['impactImage'][0], 'content');
            if (!content.impact) content.impact = {};
            content.impact.image = result.url;
        }

        // 3. Logo
        if (filesObj['logo']) {
            const result = await uploadSingleImage(filesObj['logo'][0], 'content');
            if (!content.siteSettings) content.siteSettings = {};
            content.siteSettings.logoUrl = result.url;
        }

        // 4. Hero Slides Images (Handles slideImage0, slideImage1, etc.)
        const slideUploads = Object.keys(filesObj)
            .filter(f => f.startsWith('slideImage'))
            .map(async (fieldName) => {
                const index = parseInt(fieldName.replace('slideImage', ''));
                if (!isNaN(index) && content.heroSlides && content.heroSlides[index]) {
                    const result = await uploadSingleImage(filesObj[fieldName][0], 'content');
                    content.heroSlides[index].image = result.url;
                }
            });
        await Promise.all(slideUploads);
    }

    await content.save();

    res.status(200).json(new ApiResponse(200, { content }, 'Content updated successfully'));
});
