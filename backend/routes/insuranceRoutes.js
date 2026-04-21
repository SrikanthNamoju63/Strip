/**
 * Insurance Routes - Insurance Partner Management API
 */

const express = require('express');
const router = express.Router();
const InsurancePartner = require('../models/InsurancePartner');
const { authMiddleware, requireAdmin } = require('../middleware/enhancedAuthMiddleware');

/**
 * @route   GET /api/insurance/partners
 * @desc    Get all insurance partners (public - active only)
 * @access  Public
 */
router.get('/partners', async (req, res) => {
  try {
    const { coverageType, page = 1, limit = 20 } = req.query;
    
    const query = { status: 'ACTIVE' };
    if (coverageType) query.coverageTypes = { $in: [coverageType] };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const partners = await InsurancePartner.find(query)
      .select('-apiConfig.apiSecret -settlement -internalNotes -documents')
      .sort({ companyName: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await InsurancePartner.countDocuments(query);

    res.json({
      success: true,
      data: {
        partners,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get insurance partners error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch partners' });
  }
});

/**
 * @route   GET /api/insurance/partners/:id
 * @desc    Get partner details (public - limited info)
 * @access  Public
 */
router.get('/partners/:id/public', async (req, res) => {
  try {
    const partner = await InsurancePartner.findOne({
      _id: req.params.id,
      status: 'ACTIVE'
    }).select('-apiConfig -settlement -internalNotes -documents -stats');

    if (!partner) {
      return res.status(404).json({ success: false, error: 'Partner not found' });
    }

    res.json({ success: true, data: partner });
  } catch (error) {
    console.error('Get partner error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch partner' });
  }
});

/**
 * @route   GET /api/insurance/partners/:id/plans
 * @desc    Get partner plans
 * @access  Public
 */
router.get('/partners/:id/plans', async (req, res) => {
  try {
    const partner = await InsurancePartner.findOne({
      _id: req.params.id,
      status: 'ACTIVE'
    }).select('companyName plans');

    if (!partner) {
      return res.status(404).json({ success: false, error: 'Partner not found' });
    }

    const activePlans = partner.plans.filter(p => p.isActive);

    res.json({
      success: true,
      data: {
        partnerName: partner.companyName,
        plans: activePlans
      }
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch plans' });
  }
});

// Admin Routes

/**
 * @route   GET /api/insurance/admin/partners
 * @desc    Get all partners (admin - full access)
 * @access  Admin Only
 */
router.get('/admin/partners', [authMiddleware, requireAdmin], async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const partners = await InsurancePartner.find(query)
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await InsurancePartner.countDocuments(query);

    // Get stats
    const stats = await InsurancePartner.aggregate([
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
        partners,
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
    console.error('Get admin partners error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch partners' });
  }
});

/**
 * @route   GET /api/insurance/admin/partners/:id
 * @desc    Get partner full details
 * @access  Admin Only
 */
router.get('/admin/partners/:id', [authMiddleware, requireAdmin], async (req, res) => {
  try {
    const partner = await InsurancePartner.findById(req.params.id)
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email');

    if (!partner) {
      return res.status(404).json({ success: false, error: 'Partner not found' });
    }

    res.json({ success: true, data: partner });
  } catch (error) {
    console.error('Get partner details error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch partner' });
  }
});

/**
 * @route   POST /api/insurance/admin/partners
 * @desc    Create new insurance partner
 * @access  Admin Only
 */
router.post('/admin/partners', [authMiddleware, requireAdmin], async (req, res) => {
  try {
    const partnerData = {
      ...req.body,
      createdBy: req.user.id
    };

    // Generate company code if not provided
    if (!partnerData.companyCode) {
      partnerData.companyCode = 'INS-' + Date.now().toString(36).toUpperCase();
    }

    const partner = new InsurancePartner(partnerData);
    await partner.save();

    res.status(201).json({
      success: true,
      message: 'Insurance partner created successfully',
      data: partner
    });
  } catch (error) {
    console.error('Create partner error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Company code already exists' });
    }
    res.status(500).json({ success: false, error: 'Failed to create partner' });
  }
});

/**
 * @route   PUT /api/insurance/admin/partners/:id
 * @desc    Update insurance partner
 * @access  Admin Only
 */
router.put('/admin/partners/:id', [authMiddleware, requireAdmin], async (req, res) => {
  try {
    const partner = await InsurancePartner.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
      { new: true }
    );

    if (!partner) {
      return res.status(404).json({ success: false, error: 'Partner not found' });
    }

    res.json({
      success: true,
      message: 'Partner updated successfully',
      data: partner
    });
  } catch (error) {
    console.error('Update partner error:', error);
    res.status(500).json({ success: false, error: 'Failed to update partner' });
  }
});

/**
 * @route   PUT /api/insurance/admin/partners/:id/status
 * @desc    Update partner status
 * @access  Admin Only
 */
router.put('/admin/partners/:id/status', [authMiddleware, requireAdmin], async (req, res) => {
  try {
    const { status } = req.body;
    
    const updateData = { status, updatedBy: req.user.id };
    
    if (status === 'ACTIVE' && !updateData.partnershipStartDate) {
      updateData.partnershipStartDate = new Date();
    }
    if (status === 'TERMINATED') {
      updateData.partnershipEndDate = new Date();
    }

    const partner = await InsurancePartner.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!partner) {
      return res.status(404).json({ success: false, error: 'Partner not found' });
    }

    res.json({
      success: true,
      message: `Partner status updated to ${status}`,
      data: partner
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
});

/**
 * @route   DELETE /api/insurance/admin/partners/:id
 * @desc    Delete insurance partner
 * @access  Admin Only
 */
router.delete('/admin/partners/:id', [authMiddleware, requireAdmin], async (req, res) => {
  try {
    const partner = await InsurancePartner.findByIdAndDelete(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, error: 'Partner not found' });
    }

    res.json({ success: true, message: 'Partner deleted successfully' });
  } catch (error) {
    console.error('Delete partner error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete partner' });
  }
});

/**
 * @route   GET /api/insurance/admin/stats
 * @desc    Get insurance statistics
 * @access  Admin Only
 */
router.get('/admin/stats', [authMiddleware, requireAdmin], async (req, res) => {
  try {
    const stats = await InsurancePartner.aggregate([
      {
        $group: {
          _id: null,
          totalPartners: { $sum: 1 },
          activePartners: {
            $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] }
          },
          totalPlans: { $sum: { $size: '$plans' } },
          totalClaims: { $sum: '$stats.totalClaims' },
          totalClaimAmount: { $sum: '$stats.totalClaimAmount' }
        }
      }
    ]);

    const coverageStats = await InsurancePartner.aggregate([
      { $unwind: '$coverageTypes' },
      {
        $group: {
          _id: '$coverageTypes',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {},
        coverageDistribution: coverageStats
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
