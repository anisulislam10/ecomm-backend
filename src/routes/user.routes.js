const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../services/fileUploadService');

router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, upload.single('avatar'), userController.updateProfile);
router.get('/addresses', protect, userController.getAddresses);
router.post('/address', protect, userController.addAddress);
router.put('/address/:id', protect, userController.updateAddress);
router.delete('/address/:id', protect, userController.deleteAddress);
router.put('/change-password', protect, userController.changePassword);

// Wishlist routes
router.post('/wishlist/:productId', protect, userController.toggleWishlist);
router.get('/wishlist', protect, userController.getWishlist);
router.get('/admin/wishlist-stats', protect, authorize('admin'), userController.getWishlistStats);

router.get('/', protect, authorize('admin'), userController.getAllUsers);

module.exports = router;
