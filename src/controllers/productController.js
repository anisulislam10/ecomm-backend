const Product = require('../models/Product');
const Category = require('../models/Category');
const Content = require('../models/Content');
const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/apiResponse');
const { uploadMultipleImages, deleteImage } = require('../services/fileUploadService');
const messages = require('../constants/messages');

/**
 * @desc    Get all products
 * @route   GET /api/products
 * @access  Public
 */
exports.getAllProducts = asyncHandler(async (req, res, next) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    // Build query
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Handle category name resolution
    if (req.query.category && !req.query.category.match(/^[0-9a-fA-F]{24}$/)) {
        const category = await Category.findOne({
            name: { $regex: new RegExp(`^${req.query.category}$`, 'i') }
        });
        if (category) {
            queryObj.category = category._id;
        } else {
            // If category not found by name, ensure no products are returned
            queryObj.category = new mongoose.Types.ObjectId();
        }
    }

    // Advanced filtering (price range, ratings)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    let query = Product.find(JSON.parse(queryStr));

    // Search (Improved for partial matches)
    if (req.query.search) {
        const searchRegex = new RegExp(req.query.search, 'i');
        query = query.find({
            $or: [
                { name: { $regex: searchRegex } },
                { description: { $regex: searchRegex } }
            ]
        });
    }

    // Sorting
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt');
    }

    // Pagination
    query = query.skip(skip).limit(limit);

    // Execute query
    let products = await query.populate('category', 'name');
    const total = await Product.countDocuments(JSON.parse(queryStr));

    // --- Flash Sale Logic for Listings ---
    const homeContent = await Content.findOne({ identifier: 'home_page' });
    if (homeContent && homeContent.flashSale && homeContent.flashSale.enabled) {
        const featuredIds = homeContent.flashSale.products.map(id => id.toString());
        const saleDiscount = homeContent.flashSale.discount;

        products = products.map(p => {
            if (featuredIds.includes(p._id.toString()) && (!p.discount || p.discount === 0)) {
                const productObj = p.toObject();
                productObj.discount = saleDiscount;
                return productObj;
            }
            return p;
        });
    }

    res.status(200).json(
        new ApiResponse(200, {
            products,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        })
    );
});

/**
 * @desc    Get single product
 * @route   GET /api/products/:id
 * @access  Public
 */
exports.getProduct = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    let query;

    // Check if id is a valid mongoose ObjectId
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
        query = Product.findById(id);
    } else {
        query = Product.findOne({ slug: id });
    }

    const product = await query.populate('category', 'name');

    if (!product) {
        return next(new ApiError(404, messages.PRODUCT_NOT_FOUND));
    }

    // --- Flash Sale Logic ---
    // If there's an active flash sale and the product is part of it, 
    // we set the discount to the sale percentage if the product has no individual discount.
    const homeContent = await Content.findOne({ identifier: 'home_page' });
    if (homeContent && homeContent.flashSale && homeContent.flashSale.enabled) {
        const isFeatured = homeContent.flashSale.products.some(id => id.toString() === product._id.toString());
        if (isFeatured && (!product.discount || product.discount === 0)) {
            // We don't save this to DB, just return it in the response
            const productObj = product.toObject();
            productObj.discount = homeContent.flashSale.discount;
            return res.status(200).json(new ApiResponse(200, { product: productObj }));
        }
    }

    res.status(200).json(new ApiResponse(200, { product }));
});

/**
 * @desc    Create product
 * @route   POST /api/products
 * @access  Private/Admin
 */
exports.createProduct = asyncHandler(async (req, res, next) => {
    // Add user to req.body
    req.body.user = req.user._id;

    // Handle image uploads
    if (req.files && req.files.length > 0) {
        const images = await uploadMultipleImages(req.files, 'products');
        req.body.images = images;
    }

    const product = await Product.create(req.body);

    res.status(201).json(new ApiResponse(201, { product }, messages.PRODUCT_CREATED));
});

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
exports.updateProduct = asyncHandler(async (req, res, next) => {
    let product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ApiError(404, messages.PRODUCT_NOT_FOUND));
    }

    // Handle image uploads
    if (req.files && req.files.length > 0) {
        // Delete old images
        if (product.images && product.images.length > 0) {
            for (const img of product.images) {
                await deleteImage(img.public_id);
            }
        }

        const images = await uploadMultipleImages(req.files, 'products');
        req.body.images = images;
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json(new ApiResponse(200, { product }, messages.PRODUCT_UPDATED));
});

/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
exports.deleteProduct = asyncHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ApiError(404, messages.PRODUCT_NOT_FOUND));
    }

    // Delete images
    if (product.images && product.images.length > 0) {
        for (const img of product.images) {
            await deleteImage(img.public_id);
        }
    }

    await product.deleteOne();

    res.status(200).json(new ApiResponse(200, null, messages.PRODUCT_DELETED));
});

/**
 * @desc    Get all categories
 * @route   GET /api/products/categories
 * @access  Public
 */
exports.getCategories = asyncHandler(async (req, res, next) => {
    const categories = await Category.find().populate('parentCategory', 'name');

    res.status(200).json(new ApiResponse(200, { categories }));
});

/**
 * @desc    Create category
 * @route   POST /api/products/categories
 * @access  Private/Admin
 */
exports.createCategory = asyncHandler(async (req, res, next) => {
    if (req.body.parentCategory === '') {
        req.body.parentCategory = null;
    }

    if (req.file) {
        const result = await require('../services/fileUploadService').uploadSingleImage(req.file, 'categories');
        req.body.image = result.url;
    }

    const category = await Category.create(req.body);
    res.status(201).json(new ApiResponse(201, { category }, 'Category created'));
});

/**
 * @desc    Update category
 * @route   PUT /api/products/categories/:id
 * @access  Private/Admin
 */
exports.updateCategory = asyncHandler(async (req, res, next) => {
    if (req.body.parentCategory === '') {
        req.body.parentCategory = null;
    }

    if (req.file) {
        const result = await require('../services/fileUploadService').uploadSingleImage(req.file, 'categories');
        req.body.image = result.url;
    }

    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    if (!category) return next(new ApiError(404, 'Category not found'));
    res.status(200).json(new ApiResponse(200, { category }, 'Category updated'));
});

/**
 * @desc    Delete category
 * @route   DELETE /api/products/categories/:id
 * @access  Private/Admin
 */
exports.deleteCategory = asyncHandler(async (req, res, next) => {
    const category = await Category.findById(req.params.id);
    if (!category) return next(new ApiError(404, 'Category not found'));
    await category.deleteOne();
    res.status(200).json(new ApiResponse(200, null, 'Category deleted'));
});
