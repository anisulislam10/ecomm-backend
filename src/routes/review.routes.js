const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../services/fileUploadService');

router.get('/product/:productId', reviewController.getProductReviews);
router.post('/', protect, upload.array('images', 3), reviewController.createReview);
router.put('/:id', protect, upload.array('images', 3), reviewController.updateReview);
router.delete('/:id', protect, reviewController.deleteReview);
router.get('/', protect, authorize('admin'), reviewController.getAllReviews);

module.exports = router;
