const Review = require('../models/Review');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/apiResponse');
const { uploadMultipleImages } = require('../services/fileUploadService');
const messages = require('../constants/messages');

/**
 * @desc    Get product reviews
 * @route   GET /api/reviews/product/:productId
 * @access  Public
 */
exports.getProductReviews = asyncHandler(async (req, res, next) => {
    let productId = req.params.productId;
    let isValidObjectId = productId.match(/^[0-9a-fA-F]{24}$/);

    // Resolve slug to productId if it's not a valid ObjectId
    if (!isValidObjectId) {
        const product = await Product.findOne({ slug: productId });
        if (product) {
            productId = product._id;
            isValidObjectId = true;
        }
    }

    // If still not a valid ObjectId (product not found by slug), return empty reviews
    if (!isValidObjectId) {
        return res.status(200).json(new ApiResponse(200, { reviews: [] }));
    }

    const reviews = await Review.find({ product: productId })
        .populate('user', 'name avatar')
        .sort('-createdAt');

    res.status(200).json(new ApiResponse(200, { reviews }));
});

/**
 * @desc    Create review
 * @route   POST /api/reviews
 * @access  Private
 */
exports.createReview = asyncHandler(async (req, res, next) => {
    const { product, rating, comment } = req.body;

    // Check if product exists
    const productExists = await Product.findById(product);
    if (!productExists) {
        return next(new ApiError(404, messages.PRODUCT_NOT_FOUND));
    }

    // Check if user already reviewed
    const alreadyReviewed = await Review.findOne({
        user: req.user._id,
        product
    });

    if (alreadyReviewed) {
        return next(new ApiError(400, 'Product already reviewed'));
    }

    const reviewData = {
        user: req.user._id,
        product,
        rating,
        comment
    };

    // Handle image uploads
    if (req.files && req.files.length > 0) {
        const images = await uploadMultipleImages(req.files, 'reviews');
        reviewData.images = images;
    }

    const review = await Review.create(reviewData);

    // Update product ratings
    const reviews = await Review.find({ product });
    const numOfReviews = reviews.length;
    const ratings = reviews.reduce((acc, item) => item.rating + acc, 0) / numOfReviews;

    productExists.ratings = ratings;
    productExists.numOfReviews = numOfReviews;
    await productExists.save();

    res.status(201).json(new ApiResponse(201, { review }, messages.REVIEW_ADDED));
});

/**
 * @desc    Update review
 * @route   PUT /api/reviews/:id
 * @access  Private
 */
exports.updateReview = asyncHandler(async (req, res, next) => {
    let review = await Review.findById(req.params.id);

    if (!review) {
        return next(new ApiError(404, 'Review not found'));
    }

    // Make sure user owns this review
    if (review.user.toString() !== req.user._id.toString()) {
        return next(new ApiError(403, messages.FORBIDDEN));
    }

    const { rating, comment } = req.body;

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;

    // Handle image uploads
    if (req.files && req.files.length > 0) {
        const images = await uploadMultipleImages(req.files, 'reviews');
        review.images = images;
    }

    await review.save();

    // Update product ratings
    const reviews = await Review.find({ product: review.product });
    const numOfReviews = reviews.length;
    const ratings = reviews.reduce((acc, item) => item.rating + acc, 0) / numOfReviews;

    const product = await Product.findById(review.product);
    product.ratings = ratings;
    product.numOfReviews = numOfReviews;
    await product.save();

    res.status(200).json(new ApiResponse(200, { review }, messages.REVIEW_UPDATED));
});

/**
 * @desc    Delete review
 * @route   DELETE /api/reviews/:id
 * @access  Private
 */
exports.deleteReview = asyncHandler(async (req, res, next) => {
    const review = await Review.findById(req.params.id);

    if (!review) {
        return next(new ApiError(404, 'Review not found'));
    }

    // Make sure user owns this review or is admin
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return next(new ApiError(403, messages.FORBIDDEN));
    }

    const productId = review.product;
    await review.deleteOne();

    // Update product ratings
    const reviews = await Review.find({ product: productId });
    const numOfReviews = reviews.length;
    const ratings = numOfReviews > 0
        ? reviews.reduce((acc, item) => item.rating + acc, 0) / numOfReviews
        : 0;

    const product = await Product.findById(productId);
    product.ratings = ratings;
    product.numOfReviews = numOfReviews;
    await product.save();

    res.status(200).json(new ApiResponse(200, null, messages.REVIEW_DELETED));
});

/**
 * @desc    Get all reviews (Admin)
 * @route   GET /api/reviews
 * @access  Private/Admin
 */
exports.getAllReviews = asyncHandler(async (req, res, next) => {
    const reviews = await Review.find({})
        .populate('user', 'name email avatar')
        .populate('product', 'name images image')
        .sort('-createdAt');

    res.status(200).json(new ApiResponse(200, { reviews }));
});
