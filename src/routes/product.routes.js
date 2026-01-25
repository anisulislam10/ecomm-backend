const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createProductSchema, updateProductSchema } = require('../validations/productValidation');
const { upload } = require('../services/fileUploadService');

// Public routes - specific routes before parameterized routes
router.get('/categories', productController.getCategories);
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProduct);

// Admin routes
// Middleware to parse JSON fields from FormData
const parseProductData = (req, res, next) => {
    if (req.body.specifications && typeof req.body.specifications === 'string') {
        try {
            req.body.specifications = JSON.parse(req.body.specifications);
        } catch (e) {
            return next(new ApiError(400, 'Invalid specifications JSON'));
        }
    }
    next();
};

// Admin routes
router.post(
    '/',
    protect,
    authorize('admin'),
    upload.array('images', 5),
    parseProductData,
    validate(createProductSchema),
    productController.createProduct
);

router.put(
    '/:id',
    protect,
    authorize('admin'),
    upload.array('images', 5),
    parseProductData,
    validate(updateProductSchema),
    productController.updateProduct
);

router.delete('/:id', protect, authorize('admin'), productController.deleteProduct);

// Category Admin routes
router.post('/categories', protect, authorize('admin'), productController.createCategory);
router.put('/categories/:id', protect, authorize('admin'), productController.updateCategory);
router.delete('/categories/:id', protect, authorize('admin'), productController.deleteCategory);

module.exports = router;
