const Testimonial = require('../models/Testimonial');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Get all active testimonials
 * @route   GET /api/testimonials
 * @access  Public
 */
exports.getAllTestimonials = asyncHandler(async (req, res, next) => {
    const testimonials = await Testimonial.find({ isActive: true }).sort('-createdAt');

    res.status(200).json(
        new ApiResponse(200, { testimonials, count: testimonials.length })
    );
});

/**
 * @desc    Get single testimonial
 * @route   GET /api/testimonials/:id
 * @access  Public
 */
exports.getTestimonial = asyncHandler(async (req, res, next) => {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
        return next(new ApiError(404, 'Testimonial not found'));
    }

    res.status(200).json(new ApiResponse(200, { testimonial }));
});

/**
 * @desc    Create testimonial
 * @route   POST /api/testimonials
 * @access  Private/Admin
 */
exports.createTestimonial = asyncHandler(async (req, res, next) => {
    const testimonial = await Testimonial.create(req.body);

    res.status(201).json(
        new ApiResponse(201, { testimonial }, 'Testimonial created successfully')
    );
});

/**
 * @desc    Update testimonial
 * @route   PUT /api/testimonials/:id
 * @access  Private/Admin
 */
exports.updateTestimonial = asyncHandler(async (req, res, next) => {
    const testimonial = await Testimonial.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true
        }
    );

    if (!testimonial) {
        return next(new ApiError(404, 'Testimonial not found'));
    }

    res.status(200).json(
        new ApiResponse(200, { testimonial }, 'Testimonial updated successfully')
    );
});

/**
 * @desc    Delete testimonial
 * @route   DELETE /api/testimonials/:id
 * @access  Private/Admin
 */
exports.deleteTestimonial = asyncHandler(async (req, res, next) => {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
        return next(new ApiError(404, 'Testimonial not found'));
    }

    await testimonial.deleteOne();

    res.status(200).json(
        new ApiResponse(200, null, 'Testimonial deleted successfully')
    );
});
