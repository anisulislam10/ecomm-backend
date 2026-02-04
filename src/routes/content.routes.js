const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../services/fileUploadService');

// Public get
router.get('/:identifier', contentController.getContent);

// Admin update
// Using 'upload.fields' for multiple image handling.
router.put('/:identifier', protect, authorize('admin'), upload.fields([{ name: 'image', maxCount: 1 }, { name: 'logo', maxCount: 1 }, { name: 'impactImage', maxCount: 1 }]), contentController.updateContent);

module.exports = router;
