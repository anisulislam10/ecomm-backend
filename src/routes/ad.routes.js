const express = require('express');
const router = express.Router();
const adController = require('../controllers/adController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../services/fileUploadService');

// Public route to get active ads
router.get('/active', adController.getActiveAds);

// Admin routes
router.get('/', protect, authorize('admin'), adController.getAds);
router.post('/', protect, authorize('admin'), upload.single('image'), adController.createAd);
router.put('/:id', protect, authorize('admin'), upload.single('image'), adController.updateAd);
router.delete('/:id', protect, authorize('admin'), adController.deleteAd);

module.exports = router;
