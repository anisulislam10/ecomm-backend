const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../services/fileUploadService');

// Public get
router.get('/:identifier', contentController.getContent);

// Admin update
// Using 'upload.any' for dynamic multiple image handling (slides, logo, impact, etc).
router.put('/:identifier', protect, authorize('admin'), upload.any(), contentController.updateContent);

module.exports = router;
