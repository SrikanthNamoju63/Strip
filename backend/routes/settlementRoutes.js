const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const settlementController = require('../controllers/finance/settlementController');

// Require authentication for all settlement routes
router.use(protect);

// Admin-only routes
router.get('/', authorize('ADMIN'), settlementController.getSettlements);
router.post('/process', authorize('ADMIN'), settlementController.processSettlements);
router.post('/:settlementId/initiate', authorize('ADMIN'), settlementController.initiateSettlementPayout);
router.get('/report/analytics', authorize('ADMIN'), settlementController.getSettlementReports);

// Doctor (or Admin) accessible routes
router.get('/doctor/:doctorId', authorize('ADMIN','DOCTOR'), settlementController.getDoctorSettlements);

module.exports = router;
