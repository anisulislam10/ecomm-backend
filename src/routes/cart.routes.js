const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

console.log('Cart Router Loaded');
router.get('/', protect, cartController.getCart);
router.post('/add', protect, cartController.addToCart);
router.put('/:itemId', protect, cartController.updateCartItem);
router.delete('/:itemId', protect, cartController.removeFromCart);

module.exports = router;
