const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/shipping
 * @access  Public
 */
router.get('/', shippingController.getShippingSettings);

/**
 * @route   POST /api/shipping/settings
 * @access  Private/Admin
 */
router.post('/settings', protect, authorize('admin'), shippingController.updateShippingSettings);

module.exports = router;
