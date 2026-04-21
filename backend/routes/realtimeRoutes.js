/**
 * Real-Time Routes
 * REST endpoints for real-time data (fallback for Socket.IO)
 */

const express = require('express');
const router = express.Router();
const {
    getLiveStats,
    getTickerData,
    getSystemStatus
} = require('../controllers/realtime/realtimeController');

// GET /api/realtime/stats - Full stats snapshot
router.get('/stats', getLiveStats);

// GET /api/realtime/ticker - Ticker data only
router.get('/ticker', getTickerData);

// GET /api/realtime/status - System status
router.get('/status', getSystemStatus);

module.exports = router;
