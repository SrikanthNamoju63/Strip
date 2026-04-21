/**
 * Real-Time Controller
 * REST fallback for initial data load before Socket.IO streams take over
 */

const statsEngine = require('../../services/realtime/statsEngine');

/**
 * GET /api/realtime/stats
 * Returns the latest cached stats (REST fallback)
 */
const getLiveStats = async (req, res) => {
    try {
        const stats = statsEngine.getCachedStats();
        res.json({
            success: true,
            data: stats,
            message: 'Live stats retrieved. Connect via Socket.IO for real-time streaming.'
        });
    } catch (error) {
        console.error('Error fetching live stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch live stats'
        });
    }
};

/**
 * GET /api/realtime/ticker
 * Returns just the ticker data points
 */
const getTickerData = async (req, res) => {
    try {
        const stats = statsEngine.getCachedStats();
        res.json({
            success: true,
            data: stats?.ticker || {},
            serverTime: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch ticker data'
        });
    }
};

/**
 * GET /api/realtime/status
 * Returns system status for monitoring
 */
const getSystemStatus = async (req, res) => {
    try {
        const stats = statsEngine.getCachedStats();
        res.json({
            success: true,
            status: 'operational',
            connectedClients: stats?.ticker?.connectedClients || 0,
            onlineDoctors: stats?.ticker?.onlineDoctors || 0,
            lastUpdate: stats?.lastUpdate || null,
            uptime: process.uptime(),
            serverTime: new Date().toISOString(),
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get system status'
        });
    }
};

module.exports = {
    getLiveStats,
    getTickerData,
    getSystemStatus
};
