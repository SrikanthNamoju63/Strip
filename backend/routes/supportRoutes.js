/**
 * Support Routes - Support Ticket Management API
 * Handles support tickets for users, doctors, and admins
 */

const express = require('express');
const router = express.Router();
const SupportTicket = require('../models/SupportTicket');
const { authMiddleware, requireAdmin } = require('../middleware/enhancedAuthMiddleware');
const { body, param, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// Generate unique ticket ID
const generateTicketId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `TKT-${timestamp}-${random}`;
};

/**
 * @route   GET /api/support/tickets
 * @desc    Get all tickets (admin) or user's tickets
 * @access  Private
 */
router.get('/tickets', authMiddleware, async (req, res) => {
  try {
    const { status, priority, category, page = 1, limit = 20 } = req.query;
    const query = {};

    // Filter by role
    if (req.user.role === 'USER') {
      query.userId = req.user.id;
    } else if (req.user.role === 'DOCTOR') {
      query.doctorId = req.user.id;
    }
    // Admin can see all tickets

    // Apply filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tickets = await SupportTicket.find(query)
      .populate('userId', 'profile.fullName email phone')
      .populate('doctorId', 'fullName email phone')
      .populate('assignedTo', 'email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SupportTicket.countDocuments(query);

    // Get statistics
    const stats = await SupportTicket.aggregate([
      { $match: req.user.role === 'USER' ? { userId: req.user.id } : req.user.role === 'DOCTOR' ? { doctorId: req.user.id } : {} },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCounts = {
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CLOSED: 0
    };
    stats.forEach(s => { statusCounts[s._id] = s.count; });

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        stats: statusCounts
      }
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tickets' });
  }
});

/**
 * @route   GET /api/support/tickets/:id
 * @desc    Get single ticket details
 * @access  Private
 */
router.get('/tickets/:id', [
  authMiddleware,
  param('id').isMongoId().withMessage('Invalid ticket ID'),
  validate
], async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('userId', 'profile.fullName email phone')
      .populate('doctorId', 'fullName email phone')
      .populate('assignedTo', 'email role')
      .populate('messages.senderId', 'profile.fullName email');

    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    // Check access permissions
    const isAdmin = ['SUPER_ADMIN', 'SUPPORT_ADMIN'].includes(req.user.role);
    const isOwner = ticket.userId?.toString() === req.user.id || 
                    ticket.doctorId?.toString() === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({ success: true, data: ticket });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch ticket' });
  }
});

/**
 * @route   POST /api/support/tickets
 * @desc    Create new support ticket
 * @access  Private
 */
router.post('/tickets', [
  authMiddleware,
  body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 200 }),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').isIn(['PAYMENT', 'APPOINTMENT', 'DOCTOR', 'REFUND', 'BUG', 'OTHER']).withMessage('Invalid category'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']).withMessage('Invalid priority'),
  validate
], async (req, res) => {
  try {
    const { subject, description, category, priority = 'MEDIUM' } = req.body;

    const ticketData = {
      ticketId: generateTicketId(),
      subject,
      description,
      category,
      priority,
      status: 'OPEN',
      messages: [{
        senderId: req.user.id,
        senderRole: req.user.role === 'DOCTOR' ? 'DOCTOR' : 'USER',
        message: description,
        sentAt: new Date()
      }]
    };

    // Set user or doctor reference
    if (req.user.role === 'DOCTOR') {
      ticketData.doctorId = req.user.id;
    } else {
      ticketData.userId = req.user.id;
    }

    const ticket = new SupportTicket(ticketData);
    await ticket.save();

    await ticket.populate('userId', 'profile.fullName email');
    await ticket.populate('doctorId', 'fullName email');

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: ticket
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ success: false, error: 'Failed to create ticket' });
  }
});

/**
 * @route   PUT /api/support/tickets/:id
 * @desc    Update ticket (admin only for status/assignment, owner for adding messages)
 * @access  Private
 */
router.put('/tickets/:id', [
  authMiddleware,
  param('id').isMongoId().withMessage('Invalid ticket ID'),
  validate
], async (req, res) => {
  try {
    const { status, priority, assignedTo, message } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    const isAdmin = ['SUPER_ADMIN', 'SUPPORT_ADMIN'].includes(req.user.role);
    const isOwner = ticket.userId?.toString() === req.user.id || 
                    ticket.doctorId?.toString() === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Admin can update status, priority, assignment
    if (isAdmin) {
      if (status) {
        ticket.status = status;
        if (status === 'RESOLVED') ticket.resolvedAt = new Date();
        if (status === 'CLOSED') ticket.closedAt = new Date();
      }
      if (priority) ticket.priority = priority;
      if (assignedTo) ticket.assignedTo = assignedTo;
    }

    // Anyone with access can add a message
    if (message && message.trim()) {
      ticket.messages.push({
        senderId: req.user.id,
        senderRole: isAdmin ? 'ADMIN' : req.user.role === 'DOCTOR' ? 'DOCTOR' : 'USER',
        message: message.trim(),
        sentAt: new Date()
      });

      // If user/doctor replies and ticket is closed/resolved, reopen it
      if (!isAdmin && ['RESOLVED', 'CLOSED'].includes(ticket.status)) {
        ticket.status = 'IN_PROGRESS';
      }
    }

    await ticket.save();
    await ticket.populate('userId', 'profile.fullName email');
    await ticket.populate('doctorId', 'fullName email');
    await ticket.populate('assignedTo', 'email role');

    res.json({
      success: true,
      message: 'Ticket updated successfully',
      data: ticket
    });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ success: false, error: 'Failed to update ticket' });
  }
});

/**
 * @route   DELETE /api/support/tickets/:id
 * @desc    Delete ticket (admin only)
 * @access  Admin Only
 */
router.delete('/tickets/:id', [
  authMiddleware,
  requireAdmin,
  param('id').isMongoId().withMessage('Invalid ticket ID'),
  validate
], async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndDelete(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    res.json({ success: true, message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete ticket' });
  }
});

/**
 * @route   GET /api/support/stats
 * @desc    Get support statistics (admin only)
 * @access  Admin Only
 */
router.get('/stats', [authMiddleware, requireAdmin], async (req, res) => {
  try {
    const totalTickets = await SupportTicket.countDocuments();
    const openTickets = await SupportTicket.countDocuments({ status: 'OPEN' });
    const inProgressTickets = await SupportTicket.countDocuments({ status: 'IN_PROGRESS' });
    const resolvedTickets = await SupportTicket.countDocuments({ status: 'RESOLVED' });
    const closedTickets = await SupportTicket.countDocuments({ status: 'CLOSED' });

    const categoryStats = await SupportTicket.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityStats = await SupportTicket.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Average resolution time
    const avgResolutionTime = await SupportTicket.aggregate([
      { status: 'RESOLVED', resolvedAt: { $exists: true } },
      {
        $project: {
          resolutionTime: { $subtract: ['$resolvedAt', '$createdAt'] }
        }
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$resolutionTime' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        total: totalTickets,
        byStatus: {
          OPEN: openTickets,
          IN_PROGRESS: inProgressTickets,
          RESOLVED: resolvedTickets,
          CLOSED: closedTickets
        },
        byCategory: categoryStats.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        byPriority: priorityStats.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        avgResolutionTime: avgResolutionTime[0]?.avgTime || 0
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
