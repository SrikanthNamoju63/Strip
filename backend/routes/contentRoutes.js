/**
 * Content Routes - CMS Content Management API
 */

const express = require('express');
const router = express.Router();
const Content = require('../models/Content');
const { authMiddleware, requireAdmin } = require('../middleware/enhancedAuthMiddleware');

/**
 * @route   GET /api/content
 * @desc    Get all content (public with filters)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { 
      type, 
      status = 'PUBLISHED', 
      category, 
      tag,
      page = 1, 
      limit = 10,
      search
    } = req.query;

    const query = { status };
    if (type) query.type = type;
    if (category) query.category = category;
    if (tag) query.tags = { $in: [tag] };
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { content: new RegExp(search, 'i') },
        { excerpt: new RegExp(search, 'i') }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const content = await Content.find(query)
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-previousVersions');

    const total = await Content.countDocuments(query);

    res.json({
      success: true,
      data: {
        content,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch content' });
  }
});

/**
 * @route   GET /api/content/slug/:slug
 * @desc    Get content by slug
 * @access  Public
 */
router.get('/slug/:slug', async (req, res) => {
  try {
    const content = await Content.findOne({ 
      slug: req.params.slug,
      status: 'PUBLISHED'
    });

    if (!content) {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }

    // Increment views
    content.views += 1;
    await content.save();

    res.json({ success: true, data: content });
  } catch (error) {
    console.error('Get content by slug error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch content' });
  }
});

/**
 * @route   GET /api/content/types
 * @desc    Get content types and categories
 * @access  Public
 */
router.get('/types/all', async (req, res) => {
  try {
    const types = await Content.distinct('type', { status: 'PUBLISHED' });
    const categories = await Content.distinct('category', { status: 'PUBLISHED' });
    const tags = await Content.distinct('tags', { status: 'PUBLISHED' });

    res.json({
      success: true,
      data: { types, categories, tags: tags.flat() }
    });
  } catch (error) {
    console.error('Get content types error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch content types' });
  }
});

/**
 * @route   GET /api/content/testimonials
 * @desc    Get published testimonials
 * @access  Public
 */
router.get('/testimonials/all', async (req, res) => {
  try {
    const { limit = 10, verified } = req.query;
    
    const query = { 
      type: 'TESTIMONIAL', 
      status: 'PUBLISHED' 
    };
    
    if (verified === 'true') {
      query['testimonialData.isVerified'] = true;
    }

    const testimonials = await Content.find(query)
      .sort({ order: 1, createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, data: testimonials });
  } catch (error) {
    console.error('Get testimonials error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch testimonials' });
  }
});

/**
 * @route   GET /api/content/promotions/active
 * @desc    Get active promotions
 * @access  Public
 */
router.get('/promotions/active', async (req, res) => {
  try {
    const now = new Date();
    
    const promotions = await Content.find({
      type: 'PROMOTION',
      status: 'PUBLISHED',
      'promotionData.validFrom': { $lte: now },
      'promotionData.validUntil': { $gte: now }
    }).sort({ 'promotionData.validUntil': 1 });

    res.json({ success: true, data: promotions });
  } catch (error) {
    console.error('Get promotions error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch promotions' });
  }
});

// Admin Routes

/**
 * @route   GET /api/content/admin/all
 * @desc    Get all content (admin - includes drafts)
 * @access  Admin Only
 */
router.get('/admin/all', [authMiddleware, requireAdmin], async (req, res) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const content = await Content.find(query)
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Content.countDocuments(query);

    // Get stats
    const stats = await Content.aggregate([
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
        content,
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
    console.error('Get admin content error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch content' });
  }
});

/**
 * @route   POST /api/content
 * @desc    Create new content
 * @access  Admin Only
 */
router.post('/', [authMiddleware, requireAdmin], async (req, res) => {
  try {
    const contentData = {
      ...req.body,
      createdBy: req.user.id
    };

    // Auto-generate slug if not provided
    if (!contentData.slug && contentData.title) {
      contentData.slug = contentData.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '') + '-' + Date.now();
    }

    // Set published date if publishing
    if (contentData.status === 'PUBLISHED' && !contentData.publishedAt) {
      contentData.publishedAt = new Date();
    }

    const content = new Content(contentData);
    await content.save();

    res.status(201).json({
      success: true,
      message: 'Content created successfully',
      data: content
    });
  } catch (error) {
    console.error('Create content error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Slug already exists' });
    }
    res.status(500).json({ success: false, error: 'Failed to create content' });
  }
});

/**
 * @route   PUT /api/content/:id
 * @desc    Update content
 * @access  Admin Only
 */
router.put('/:id', [authMiddleware, requireAdmin], async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }

    // Store previous version
    if (req.body.content && req.body.content !== content.content) {
      content.previousVersions.push({
        version: content.version,
        content: content.content,
        updatedAt: content.updatedAt,
        updatedBy: content.updatedBy
      });
      content.version += 1;
    }

    // Set published date if publishing
    if (req.body.status === 'PUBLISHED' && content.status !== 'PUBLISHED') {
      req.body.publishedAt = new Date();
    }

    Object.assign(content, req.body, { updatedBy: req.user.id });
    await content.save();

    res.json({
      success: true,
      message: 'Content updated successfully',
      data: content
    });
  } catch (error) {
    console.error('Update content error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Slug already exists' });
    }
    res.status(500).json({ success: false, error: 'Failed to update content' });
  }
});

/**
 * @route   DELETE /api/content/:id
 * @desc    Delete content
 * @access  Admin Only
 */
router.delete('/:id', [authMiddleware, requireAdmin], async (req, res) => {
  try {
    const content = await Content.findByIdAndDelete(req.params.id);
    if (!content) {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }

    res.json({ success: true, message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete content' });
  }
});

/**
 * @route   POST /api/content/:id/duplicate
 * @desc    Duplicate content
 * @access  Admin Only
 */
router.post('/:id/duplicate', [authMiddleware, requireAdmin], async (req, res) => {
  try {
    const original = await Content.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }

    const duplicateData = original.toObject();
    delete duplicateData._id;
    delete duplicateData.createdAt;
    delete duplicateData.updatedAt;
    
    duplicateData.title = `${duplicateData.title} (Copy)`;
    duplicateData.slug = `${duplicateData.slug}-copy-${Date.now()}`;
    duplicateData.status = 'DRAFT';
    duplicateData.views = 0;
    duplicateData.likes = 0;
    duplicateData.shares = 0;
    duplicateData.createdBy = req.user.id;

    const duplicate = new Content(duplicateData);
    await duplicate.save();

    res.status(201).json({
      success: true,
      message: 'Content duplicated successfully',
      data: duplicate
    });
  } catch (error) {
    console.error('Duplicate content error:', error);
    res.status(500).json({ success: false, error: 'Failed to duplicate content' });
  }
});

module.exports = router;
