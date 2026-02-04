const express = require('express');
const router = express.Router();
const testimonialController = require('../controllers/testimonialController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', testimonialController.getAllTestimonials);
router.get('/:id', testimonialController.getTestimonial);

// Admin routes
router.post('/', protect, authorize('admin'), testimonialController.createTestimonial);
router.put('/:id', protect, authorize('admin'), testimonialController.updateTestimonial);
router.delete('/:id', protect, authorize('admin'), testimonialController.deleteTestimonial);

module.exports = router;
