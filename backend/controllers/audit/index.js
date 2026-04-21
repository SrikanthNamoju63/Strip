/**
 * Audit Controller
 * Handles audit log business logic
 */

const AuditLog = require('../../models/AuditLog');

/**
 * Create audit log entry (helper function)
 */
const createAuditLog = async ({
  module,
  action,
  performedBy,
  targetId,
  targetModel,
  beforeValue,
  afterValue,
  ipAddress,
  deviceInfo,
  metadata
}) => {
  try {
    const log = new AuditLog({
      module,
      action,
      performedBy,
      targetId,
      targetModel,
      beforeValue,
      afterValue,
      ipAddress,
      deviceInfo,
      metadata
    });

    await log.save();
    return log;
  } catch (error) {
    console.error('Create audit log error:', error);
    return null;
  }
};

/**
 * Get admin activity summary
 */
const getAdminActivitySummary = async (req, res) => {
  try {
    const { adminId, period = '30d' } = req.query;
    const days = parseInt(period) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const matchStage = {
      createdAt: { $gte: startDate }
    };
    if (adminId) matchStage.performedBy = adminId;

    const activity = await AuditLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            admin: '$performedBy',
            module: '$module'
          },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'admins',
          localField: '_id.admin',
          foreignField: '_id',
          as: 'adminInfo'
        }
      },
      {
        $project: {
          adminId: '$_id.admin',
          module: '$_id.module',
          count: 1,
          adminEmail: { $arrayElemAt: ['$adminInfo.email', 0] },
          adminRole: { $arrayElemAt: ['$adminInfo.role', 0] }
        }
      }
    ]);

    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Get admin activity error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch activity summary' });
  }
};

/**
 * Get suspicious activity report
 */
const getSuspiciousActivityReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Find multiple failed actions by same admin
    const suspiciousPatterns = await AuditLog.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            admin: '$performedBy',
            action: '$action',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          count: { $sum: 1 },
          ips: { $addToSet: '$ipAddress' }
        }
      },
      { $match: { count: { $gt: 10 } } },
      { $sort: { count: -1 } },
      { $limit: 50 }
    ]);

    // Find actions outside business hours
    const afterHoursActivity = await AuditLog.aggregate([
      {
        $match: {
          ...dateFilter,
          $expr: {
            $or: [
              { $lt: [{ $hour: '$createdAt' }, 6] },
              { $gt: [{ $hour: '$createdAt' }, 22] }
            ]
          }
        }
      },
      {
        $group: {
          _id: '$performedBy',
          count: { $sum: 1 }
        }
      },
      { $match: { count: { $gt: 5 } } }
    ]);

    res.json({
      success: true,
      data: {
        suspiciousPatterns,
        afterHoursActivity
      }
    });
  } catch (error) {
    console.error('Get suspicious activity error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
};

/**
 * Get compliance report
 */
const getComplianceReport = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const monthlyStats = await AuditLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfYear, $lte: endOfYear }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            module: '$module'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.month': 1 } }
    ]);

    const dataAccessStats = await AuditLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfYear, $lte: endOfYear },
          $or: [
            { module: 'USER' },
            { action: /VIEW|ACCESS|EXPORT/i }
          ]
        }
      },
      {
        $group: {
          _id: '$performedBy',
          accessCount: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        year,
        monthlyStats,
        dataAccessStats
      }
    });
  } catch (error) {
    console.error('Get compliance report error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate compliance report' });
  }
};

/**
 * Purge old audit logs
 */
const purgeOldLogs = async (req, res) => {
  try {
    const { olderThanDays = 365 } = req.body;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await AuditLog.deleteMany({
      createdAt: { $lt: cutoffDate }
    });

    // Log the purge action
    await createAuditLog({
      module: 'SYSTEM',
      action: 'PURGE_AUDIT_LOGS',
      performedBy: req.user.id,
      metadata: `Purged ${result.deletedCount} logs older than ${olderThanDays} days`,
      ipAddress: req.ip,
      deviceInfo: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: `${result.deletedCount} audit logs purged`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    console.error('Purge logs error:', error);
    res.status(500).json({ success: false, error: 'Failed to purge logs' });
  }
};

module.exports = {
  createAuditLog,
  getAdminActivitySummary,
  getSuspiciousActivityReport,
  getComplianceReport,
  purgeOldLogs
};
