const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.get('/active', protect, paymentController.getActiveGateways);
router.post('/create-intent', protect, paymentController.createPaymentIntent);
router.post('/confirm', protect, paymentController.confirmPayment);
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);
router.post('/refund', protect, authorize('admin'), paymentController.createRefund);

router.get('/settings', protect, authorize('admin'), paymentController.getGatewaySettings);
router.post('/settings', protect, authorize('admin'), paymentController.updateGatewaySettings);

module.exports = router;
