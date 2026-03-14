const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.get('/stats', protect, authorize('admin'), adminController.getStats);
router.get('/analytics', protect, authorize('admin'), adminController.getAnalytics);

module.exports = router;
