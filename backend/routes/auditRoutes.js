/**
 * Audit Routes - Audit Log Management API
 * Tracks all administrative actions for compliance and security
 */

const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { authMiddleware, requireAdmin } = require('../middleware/enhancedAuthMiddleware');
const { body, param, query, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

/**
 * @route   GET /api/audit/logs
 * @desc    Get all audit logs with filtering
 * @access  Admin Only
 */
router.get('/logs', [
  authMiddleware,
  requireAdmin,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('module').optional().isString(),
  query('action').optional().isString(),
  query('performedBy').optional().isMongoId(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  validate
], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      module,
      action,
      performedBy,
      targetId,
      startDate,
      endDate,
      search
    } = req.query;

    const query = {};

    // Apply filters
    if (module) query.module = module.toUpperCase();
    if (action) query.action = new RegExp(action, 'i');
    if (performedBy) query.performedBy = performedBy;
    if (targetId) query.targetId = targetId;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Search in metadata
    if (search) {
      query.$or = [
        { metadata: new RegExp(search, 'i') },
        { action: new RegExp(search, 'i') }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await AuditLog.find(query)
      .populate('performedBy', 'email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments(query);

    // Get module statistics
    const moduleStats = await AuditLog.aggregate([
      {
        $group: {
          _id: '$module',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get action statistics for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentStats = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        stats: {
          byModule: moduleStats,
          dailyActivity: recentStats
        }
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
  }
});

/**
 * @route   GET /api/audit/logs/:id
 * @desc    Get single audit log details
 * @access  Admin Only
 */
router.get('/logs/:id', [
  authMiddleware,
  requireAdmin,
  param('id').isMongoId().withMessage('Invalid log ID'),
  validate
], async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id)
      .populate('performedBy', 'email role');

    if (!log) {
      return res.status(404).json({ success: false, error: 'Audit log not found' });
    }

    res.json({ success: true, data: log });
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch audit log' });
  }
});

/**
 * @route   POST /api/audit/logs
 * @desc    Create new audit log entry
 * @access  Admin Only (usually called internally by services)
 */
router.post('/logs', [
  authMiddleware,
  requireAdmin,
  body('module').notEmpty().isIn(['DOCTOR', 'FINANCE', 'SETTINGS', 'USER', 'APPOINTMENT', 'PAYMENT', 'SYSTEM', 'SECURITY']),
  body('action').notEmpty().trim(),
  body('targetId').optional().isMongoId(),
  body('targetModel').optional().isString(),
  body('beforeValue').optional(),
  body('afterValue').optional(),
  body('metadata').optional().trim(),
  validate
], async (req, res) => {
  try {
    const {
      module,
      action,
      targetId,
      targetModel,
      beforeValue,
      afterValue,
      metadata
    } = req.body;

    const log = new AuditLog({
      module,
      action,
      performedBy: req.user.id,
      targetId,
      targetModel,
      beforeValue,
      afterValue,
      ipAddress: req.ip,
      deviceInfo: req.headers['user-agent'],
      metadata
    });

    await log.save();
    await log.populate('performedBy', 'email role');

    res.status(201).json({
      success: true,
      message: 'Audit log created',
      data: log
    });
  } catch (error) {
    console.error('Create audit log error:', error);
    res.status(500).json({ success: false, error: 'Failed to create audit log' });
  }
});

/**
 * @route   GET /api/audit/stats
 * @desc    Get audit statistics dashboard
 * @access  Admin Only
 */
router.get('/stats', [authMiddleware, requireAdmin], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
    }

    // Total actions
    const totalActions = await AuditLog.countDocuments(dateFilter);

    // Actions by module
    const moduleStats = await AuditLog.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$module',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Top performers (admins with most actions)
    const topPerformers = await AuditLog.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$performedBy',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'admins',
          localField: '_id',
          foreignField: '_id',
          as: 'admin'
        }
      },
      {
        $project: {
          count: 1,
          adminEmail: { $arrayElemAt: ['$admin.email', 0] },
          adminRole: { $arrayElemAt: ['$admin.role', 0] }
        }
      }
    ]);

    // Recent activity trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyTrend = await AuditLog.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            module: '$module'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Security events (login failures, permission changes)
    const securityEvents = await AuditLog.countDocuments({
      ...dateFilter,
      $or: [
        { module: 'SECURITY' },
        { action: /LOGIN|LOGOUT|PASSWORD|PERMISSION/i }
      ]
    });

    res.json({
      success: true,
      data: {
        totalActions,
        byModule: moduleStats,
        topPerformers,
        weeklyTrend,
        securityEvents
      }
    });
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch audit statistics' });
  }
});

/**
 * @route   GET /api/audit/export
 * @desc    Export audit logs (CSV/JSON)
 * @access  Admin Only
 */
router.get('/export', [
  authMiddleware,
  requireAdmin,
  query('format').optional().isIn(['json', 'csv']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  validate
], async (req, res) => {
  try {
    const { format = 'json', startDate, endDate } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .populate('performedBy', 'email role')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      // Simple CSV conversion
      const headers = ['Timestamp', 'Module', 'Action', 'Performed By', 'Target ID', 'Target Model', 'IP Address', 'Metadata'];
      const rows = logs.map(log => [
        log.createdAt.toISOString(),
        log.module,
        log.action,
        log.performedBy?.email || 'Unknown',
        log.targetId || '',
        log.targetModel || '',
        log.ipAddress || '',
        log.metadata || ''
      ].map(field => `"${String(field).replace(/"/g, '""')}"`));

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
      return res.send(csv);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.json`);
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Export audit logs error:', error);
    res.status(500).json({ success: false, error: 'Failed to export audit logs' });
  }
});

module.exports = router;
