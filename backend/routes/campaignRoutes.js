/**
 * Campaign Routes - Marketing Campaign Management API
 */

const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const { authMiddleware, requireAdmin } = require('../middleware/enhancedAuthMiddleware');

/**
 * @route   GET /api/campaigns
 * @desc    Get all campaigns
 * @access  Admin Only
 */
router.get('/', [authMiddleware, requireAdmin], async (req, res) => {
  try {
    const { type, status, purpose, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (purpose) query.purpose = purpose;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const campaigns = await Campaign.find(query)
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Campaign.countDocuments(query);

    // Get stats
    const stats = await Campaign.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        campaigns,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        stats
      }
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch campaigns' });
  }
});

/**
 * @route   GET /api/campaigns/:id
 * @desc    Get campaign details
 * @access  Admin Only
 */
router.get('/:id', [authMiddleware, requireAdmin], async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email');

    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    res.json({ success: true, data: campaign });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch campaign' });
  }
});

/**
 * @route   POST /api/campaigns
 * @desc    Create new campaign
 * @access  Admin Only
 */
router.post('/', [authMiddleware, requireAdmin], async (req, res) => {
  try {
    const campaignData = {
      ...req.body,
      createdBy: req.user.id,
      status: req.body.scheduledAt ? 'SCHEDULED' : 'DRAFT'
    };

    const campaign = new Campaign(campaignData);
    await campaign.save();

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: campaign
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ success: false, error: 'Failed to create campaign' });
  }
});

/**
 * @route   PUT /api/campaigns/:id
 * @desc    Update campaign
 * @access  Admin Only
 */
router.put('/:id', [authMiddleware, requireAdmin], async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    // Prevent editing sent campaigns
    if (campaign.status === 'SENT') {
      return res.status(400).json({ success: false, error: 'Cannot edit sent campaign' });
    }

    Object.assign(campaign, req.body, { updatedBy: req.user.id });
    
    // Update status based on schedule
    if (req.body.scheduledAt && campaign.status === 'DRAFT') {
      campaign.status = 'SCHEDULED';
    }
    
    await campaign.save();

    res.json({
      success: true,
      message: 'Campaign updated successfully',
      data: campaign
    });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({ success: false, error: 'Failed to update campaign' });
  }
});

/**
 * @route   POST /api/campaigns/:id/send
 * @desc    Send campaign immediately
 * @access  Admin Only
 */
router.post('/:id/send', [authMiddleware, requireAdmin], async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    if (campaign.status === 'SENT') {
      return res.status(400).json({ success: false, error: 'Campaign already sent' });
    }

    // Build recipient list
    const recipients = await buildRecipientList(campaign.targetAudience);
    
    campaign.recipients = recipients.map(r => ({
      userId: r._id,
      userType: r.type,
      email: r.email,
      phone: r.phone,
      status: 'PENDING'
    }));
    
    campaign.stats.totalRecipients = recipients.length;
    campaign.status = 'SENDING';
    campaign.sentAt = new Date();
    await campaign.save();

    // Start sending process (async)
    processCampaignSending(campaign._id);

    res.json({
      success: true,
      message: `Campaign queued for sending to ${recipients.length} recipients`,
      data: campaign
    });
  } catch (error) {
    console.error('Send campaign error:', error);
    res.status(500).json({ success: false, error: 'Failed to send campaign' });
  }
});

/**
 * @route   POST /api/campaigns/:id/preview
 * @desc    Preview campaign (send to admin only)
 * @access  Admin Only
 */
router.post('/:id/preview', [authMiddleware, requireAdmin], async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    // TODO: Send preview to admin email
    console.log(`[PREVIEW] Campaign: ${campaign.name}, To: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Preview sent to your email'
    });
  } catch (error) {
    console.error('Preview campaign error:', error);
    res.status(500).json({ success: false, error: 'Failed to send preview' });
  }
});

/**
 * @route   POST /api/campaigns/:id/duplicate
 * @desc    Duplicate campaign
 * @access  Admin Only
 */
router.post('/:id/duplicate', [authMiddleware, requireAdmin], async (req, res) => {
  try {
    const original = await Campaign.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    const duplicateData = original.toObject();
    delete duplicateData._id;
    delete duplicateData.createdAt;
    delete duplicateData.updatedAt;
    delete duplicateData.sentAt;
    delete duplicateData.completedAt;
    delete duplicateData.recipients;
    delete duplicateData.stats;
    
    duplicateData.name = `${duplicateData.name} (Copy)`;
    duplicateData.status = 'DRAFT';
    duplicateData.createdBy = req.user.id;

    const duplicate = new Campaign(duplicateData);
    await duplicate.save();

    res.status(201).json({
      success: true,
      message: 'Campaign duplicated successfully',
      data: duplicate
    });
  } catch (error) {
    console.error('Duplicate campaign error:', error);
    res.status(500).json({ success: false, error: 'Failed to duplicate campaign' });
  }
});

/**
 * @route   DELETE /api/campaigns/:id
 * @desc    Delete campaign
 * @access  Admin Only
 */
router.delete('/:id', [authMiddleware, requireAdmin], async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    if (campaign.status === 'SENDING') {
      return res.status(400).json({ success: false, error: 'Cannot delete campaign while sending' });
    }

    await Campaign.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete campaign' });
  }
});

/**
 * @route   GET /api/campaigns/stats/overview
 * @desc    Get campaign statistics
 * @access  Admin Only
 */
router.get('/stats/overview', [authMiddleware, requireAdmin], async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats = await Campaign.aggregate([
      {
        $group: {
          _id: null,
          totalCampaigns: { $sum: 1 },
          totalSent: { $sum: '$stats.sent' },
          totalDelivered: { $sum: '$stats.delivered' },
          totalOpened: { $sum: '$stats.opened' },
          totalClicked: { $sum: '$stats.clicked' }
        }
      }
    ]);

    const recentActivity = await Campaign.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const byType = await Campaign.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {},
        recentActivity,
        byType
      }
    });
  } catch (error) {
    console.error('Get campaign stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
  }
});

// Helper function to build recipient list
async function buildRecipientList(targetAudience) {
  const { userType, filters } = targetAudience;
  let recipients = [];

  if (userType === 'ALL' || userType === 'USERS') {
    const userQuery = {};
    if (filters?.registrationDateFrom) userQuery.createdAt = { $gte: new Date(filters.registrationDateFrom) };
    if (filters?.registrationDateTo) userQuery.createdAt = { ...userQuery.createdAt, $lte: new Date(filters.registrationDateTo) };
    if (filters?.specificUserIds?.length) userQuery._id = { $in: filters.specificUserIds };

    const users = await User.find(userQuery).select('email phone');
    recipients = recipients.concat(users.map(u => ({ ...u.toObject(), type: 'USER' })));
  }

  if (userType === 'ALL' || userType === 'DOCTORS') {
    const doctors = await Doctor.find().select('email phone');
    recipients = recipients.concat(doctors.map(d => ({ ...d.toObject(), type: 'DOCTOR' })));
  }

  return recipients;
}

// Helper function to process campaign sending (async)
async function processCampaignSending(campaignId) {
  // This would be implemented with a queue system (Bull, etc.)
  // For now, just a placeholder
  console.log(`Processing campaign ${campaignId}`);
  
  // Update campaign status when done
  await Campaign.findByIdAndUpdate(campaignId, {
    status: 'SENT',
    completedAt: new Date()
  });
}

module.exports = router;
