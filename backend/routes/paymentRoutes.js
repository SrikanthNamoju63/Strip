const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const paymentController = require('../controllers/finance/paymentController');

// Private routes (requires authentication)
router.use(protect);

// Patient routes
router.post('/initiate', authorize('USER', 'PATIENT', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN'), paymentController.initiatePayment);
router.post('/verify', paymentController.verifyPayment);
router.post('/webhook', paymentController.handleWebhook); // Public, verify signature inside
router.post('/doctor/onboard', authorize('DOCTOR', 'ADMIN', 'SUPER_ADMIN'), paymentController.onboardDoctor);

router.get('/history', paymentController.getPaymentHistory);
router.get('/:paymentId/receipt', paymentController.getPaymentReceipt);

// Refund (Admin/Doctor)
router.post('/:paymentId/refund', authorize('ADMIN', 'SUPER_ADMIN', 'FINANCE_ADMIN', 'DOCTOR'), paymentController.refundPayment);

// Admin routes
router.get('/analytics/dashboard', authorize('ADMIN', 'SUPER_ADMIN', 'FINANCE_ADMIN'), paymentController.getPaymentAnalytics);
// Refunds (Admin audit)
router.get('/refunds', authorize('ADMIN', 'SUPER_ADMIN', 'FINANCE_ADMIN'), paymentController.getRefunds);

module.exports = router;
