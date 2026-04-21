const express = require('express');
const router = express.Router();
const {
    submitFeedback,
    getAllFeedback,
    updateFeedbackStatus,
    replyToFeedback
} = require('../controllers/feedback');
const { authMiddleware, requireAdmin } = require('../middleware/enhancedAuthMiddleware');

// User routes - requires authentication
router.post('/submit', authMiddleware, submitFeedback);

// Admin routes - requires admin access with token blacklist check
router.get('/', authMiddleware, requireAdmin, getAllFeedback);
router.put('/:id/status', authMiddleware, requireAdmin, updateFeedbackStatus);
router.put('/:id/reply', authMiddleware, requireAdmin, replyToFeedback);

module.exports = router;
