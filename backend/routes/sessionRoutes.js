const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const sessionController = require('../controllers/auth/sessionController');

/**
 * Session Management Routes
 * Provides real-time session validation and token refresh
 */

/**
 * @route   GET /api/session/verify
 * @desc    Verify session and get user profile
 * @access  Private (requires token)
 * @returns User profile data
 */
router.get('/verify', authMiddleware, sessionController.verifySession);

/**
 * @route   GET /api/session/check
 * @desc    Lightweight token validity check
 * @access  Private (requires token)
 * @returns Token validity status
 */
router.get('/check', authMiddleware, sessionController.checkTokenValidity);

/**
 * @route   POST /api/session/refresh
 * @desc    Refresh JWT token before expiry
 * @access  Private (requires token)
 * @returns New JWT token
 */
router.post('/refresh', authMiddleware, sessionController.refreshToken);

/**
 * @route   POST /api/session/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private (requires token)
 * @returns Success message
 */
router.post('/logout', authMiddleware, sessionController.logout);

module.exports = router;
