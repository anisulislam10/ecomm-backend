const express = require('express');
const router = express.Router();
const returnController = require('../controllers/returnController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, returnController.createReturnRequest);
router.get('/my-returns', protect, returnController.getMyReturns);

// Admin routes
router.get('/', protect, authorize('admin'), returnController.getAllReturns);
router.put('/:id/status', protect, authorize('admin'), returnController.updateReturnStatus);

module.exports = router;
