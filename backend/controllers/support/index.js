/**
 * Support Controller
 * Handles support ticket business logic
 */

const SupportTicket = require('../../models/SupportTicket');
const User = require('../../models/User');
const Doctor = require('../../models/Doctor');

/**
 * Get ticket statistics for dashboard
 */
const getTicketStats = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const days = parseInt(period) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await SupportTicket.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            status: '$status',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryDistribution = await SupportTicket.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const avgResolutionTime = await SupportTicket.aggregate([
      {
        $match: {
          status: { $in: ['RESOLVED', 'CLOSED'] },
          resolvedAt: { $exists: true },
          createdAt: { $gte: startDate }
        }
      },
      {
        $project: {
          resolutionTime: { $subtract: ['$resolvedAt', '$createdAt'] }
        }
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$resolutionTime' },
          minTime: { $min: '$resolutionTime' },
          maxTime: { $max: '$resolutionTime' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        timeline: stats,
        categories: categoryDistribution,
        resolutionTime: avgResolutionTime[0] || { avgTime: 0, minTime: 0, maxTime: 0 }
      }
    });
  } catch (error) {
    console.error('Get ticket stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
  }
};

/**
 * Assign ticket to admin
 */
const assignTicket = async (req, res) => {
  try {
    const { ticketId, adminId } = req.body;

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    ticket.assignedTo = adminId;
    ticket.status = 'IN_PROGRESS';
    await ticket.save();

    await ticket.populate('assignedTo', 'email role');

    res.json({
      success: true,
      message: 'Ticket assigned successfully',
      data: ticket
    });
  } catch (error) {
    console.error('Assign ticket error:', error);
    res.status(500).json({ success: false, error: 'Failed to assign ticket' });
  }
};

/**
 * Bulk update tickets
 */
const bulkUpdateTickets = async (req, res) => {
  try {
    const { ticketIds, status, priority } = req.body;

    const updateData = {};
    if (status) {
      updateData.status = status;
      if (status === 'RESOLVED') updateData.resolvedAt = new Date();
      if (status === 'CLOSED') updateData.closedAt = new Date();
    }
    if (priority) updateData.priority = priority;

    const result = await SupportTicket.updateMany(
      { _id: { $in: ticketIds } },
      updateData
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} tickets updated`,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ success: false, error: 'Failed to update tickets' });
  }
};

/**
 * Get unassigned tickets
 */
const getUnassignedTickets = async (req, res) => {
  try {
    const { priority, category, page = 1, limit = 20 } = req.query;

    const query = { assignedTo: null, status: 'OPEN' };
    if (priority) query.priority = priority;
    if (category) query.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tickets = await SupportTicket.find(query)
      .populate('userId', 'profile.fullName email')
      .populate('doctorId', 'fullName email')
      .sort({ priority: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SupportTicket.countDocuments(query);

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get unassigned tickets error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tickets' });
  }
};

/**
 * Get ticket activity report
 */
const getTicketActivityReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const dateFormat = groupBy === 'month' ? '%Y-%m' : groupBy === 'week' ? '%Y-W%U' : '%Y-%m-%d';

    const activity = await SupportTicket.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Get activity report error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
};

/**
 * Search tickets
 */
const searchTickets = async (req, res) => {
  try {
    const { q, status, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Search query must be at least 2 characters' });
    }

    const searchRegex = new RegExp(q, 'i');
    const query = {
      $or: [
        { ticketId: searchRegex },
        { subject: searchRegex },
        { description: searchRegex },
        { 'messages.message': searchRegex }
      ]
    };

    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tickets = await SupportTicket.find(query)
      .populate('userId', 'profile.fullName email')
      .populate('doctorId', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SupportTicket.countDocuments(query);

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Search tickets error:', error);
    res.status(500).json({ success: false, error: 'Search failed' });
  }
};

/**
 * Get all tickets
 */
const getTickets = async (req, res) => {
  try {
    const { status, priority, userId, doctorId, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (userId) query.userId = userId;
    if (doctorId) query.doctorId = doctorId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tickets = await SupportTicket.find(query)
      .populate('userId', 'profile.fullName email')
      .populate('doctorId', 'fullName email')
      .populate('assignedTo', 'email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SupportTicket.countDocuments(query);

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tickets' });
  }
};

/**
 * Get ticket by ID
 */
const getTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('userId', 'profile.fullName email')
      .populate('doctorId', 'fullName email')
      .populate('assignedTo', 'email role');

    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    res.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch ticket' });
  }
};

/**
 * Update ticket
 */
const updateTicket = async (req, res) => {
  try {
    const { status, priority, assignedTo } = req.body;
    const updateData = {};

    if (status) {
      updateData.status = status;
      if (status === 'RESOLVED') updateData.resolvedAt = new Date();
      if (status === 'CLOSED') updateData.closedAt = new Date();
    }
    if (priority) updateData.priority = priority;
    if (assignedTo) updateData.assignedTo = assignedTo;

    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    res.json({
      success: true,
      message: 'Ticket updated successfully',
      data: ticket
    });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ success: false, error: 'Failed to update ticket' });
  }
};

/**
 * Reply to ticket
 */
const replyToTicket = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    ticket.messages.push({
      senderId: req.user._id,
      senderRole: 'ADMIN',
      message: message,
      sentAt: new Date()
    });

    await ticket.save();

    res.json({
      success: true,
      message: 'Reply sent successfully',
      data: ticket
    });
  } catch (error) {
    console.error('Reply ticket error:', error);
    res.status(500).json({ success: false, error: 'Failed to reply to ticket' });
  }
};

module.exports = {
  getTickets,
  getTicketStats,
  assignTicket,
  bulkUpdateTickets,
  getUnassignedTickets,
  getTicketActivityReport,
  searchTickets,
  getTicketById,
  updateTicket,
  replyToTicket
};
