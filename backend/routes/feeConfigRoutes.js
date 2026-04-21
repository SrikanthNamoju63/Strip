const express = require('express');
const router = express.Router();
const feeController = require('../controllers/admin/feeController');
const { authMiddleware, requireAdmin } = require('../middleware/enhancedAuthMiddleware');

// @route   GET api/fees
// @desc    Get fee configuration
// @access  Public (or Admin only?) - Let's make it Protected Admin for now, maybe Public for getting platform fee
router.get('/', authMiddleware, requireAdmin, feeController.getFeeConfig);

// @route   PUT api/fees
// @desc    Update fee configuration
// @access  Private (Admin)
router.put('/', authMiddleware, requireAdmin, feeController.updateFeeConfig);

module.exports = router;
