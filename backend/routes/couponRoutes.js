const express = require('express');
const router = express.Router();

const adminCouponController = require('../controllers/admin/couponController');
const userCouponController = require('../controllers/user/couponController');
const auth = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/adminAuth');

// --- User Routes ---
// Get Welcome Coupon
router.get('/welcome', auth, userCouponController.getWelcomeCoupon);
// Validate Coupon (during booking)
router.post('/validate', auth, userCouponController.validateCoupon);

// --- Admin Routes --- // Requires admin auth
router.post('/', isAdmin, adminCouponController.createCoupon);
router.get('/', isAdmin, adminCouponController.getAllCoupons);
router.put('/:id', isAdmin, adminCouponController.updateCoupon);
router.delete('/:id', isAdmin, adminCouponController.deleteCoupon);

module.exports = router;
