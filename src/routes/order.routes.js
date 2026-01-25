const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createOrderSchema } = require('../validations/orderValidation');

router.post('/', protect, validate(createOrderSchema), orderController.createOrder);
router.get('/my-orders', protect, orderController.getMyOrders);
router.get('/:id', protect, orderController.getOrderById);
router.put('/:id/pay', protect, orderController.updateOrderToPaid);
router.put('/:id/cancel', protect, orderController.cancelOrder);
router.put('/:id/deliver', protect, authorize('admin'), orderController.updateOrderToDelivered);
router.put('/:id/status', protect, authorize('admin'), orderController.updateOrderStatus);
// Public route for tracking
router.post('/track', orderController.trackOrder);

router.get('/', protect, authorize('admin'), orderController.getAllOrders);

module.exports = router;
