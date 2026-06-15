const express = require('express');
const router = express.Router();
const healthController = require('../controllers/health');
const { authMiddleware } = require('../middleware/enhancedAuthMiddleware');

// Fix: Use centralized auth middleware with token blacklist checking
router.post('/data', authMiddleware, healthController.saveHealthReading);
router.post('/readings', authMiddleware, healthController.saveHealthReading);
// router.get('/stats/:userId?', authMiddleware, healthController.getHealthStats); // Removed due to mysterious crash
router.post('/analyze', authMiddleware, healthController.analyzeHealth);

module.exports = router;
