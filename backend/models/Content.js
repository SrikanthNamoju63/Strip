/**
 * Content Model
 * CMS content for company website (articles, blogs, testimonials)
 */

const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  // Content identification
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Content type
  type: {
    type: String,
    enum: ['ARTICLE', 'BLOG', 'TESTIMONIAL', 'FAQ', 'PAGE', 'BANNER', 'PROMOTION'],
    required: true,
    index: true
  },

  // Content status
  status: {
    type: String,
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
    default: 'DRAFT',
    index: true
  },

  // Content data
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  subtitle: {
    type: String,
    maxlength: 300
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    maxlength: 500
  },

  // Media
  featuredImage: {
    type: String
  },
  images: [{
    type: String
  }],
  videoUrl: {
    type: String
  },

  // SEO
  metaTitle: {
    type: String,
    maxlength: 70
  },
  metaDescription: {
    type: String,
    maxlength: 160
  },
  keywords: [{
    type: String
  }],

  // Categorization
  category: {
    type: String,
    index: true
  },
  tags: [{
    type: String,
    index: true
  }],

  // Author information
  author: {
    name: { type: String, required: true },
    email: { type: String },
    avatar: { type: String },
    bio: { type: String }
  },

  // Publishing
  publishedAt: {
    type: Date,
    index: true
  },
  scheduledAt: {
    type: Date
  },

  // Engagement
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },

  // For testimonials
  testimonialData: {
    authorName: { type: String },
    authorRole: { type: String },
    authorImage: { type: String },
    rating: { type: Number, min: 1, max: 5 },
    isVerified: { type: Boolean, default: false },
    treatmentType: { type: String }
  },

  // For promotions
  promotionData: {
    discountPercentage: { type: Number },
    discountAmount: { type: Number },
    validFrom: { type: Date },
    validUntil: { type: Date },
    code: { type: String },
    usageLimit: { type: Number },
    usageCount: { type: Number, default: 0 },
    applicableTo: [{ type: String }],
    minimumOrder: { type: Number, default: 0 }
  },

  // Versioning
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    version: Number,
    content: String,
    updatedAt: Date,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
  }],

  // Management
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },

  // Sorting
  order: {
    type: Number,
    default: 0
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
contentSchema.index({ type: 1, status: 1, publishedAt: -1 });
contentSchema.index({ category: 1, status: 1 });
contentSchema.index({ 'promotionData.validUntil': 1 });

// Virtual for read time (for articles)
contentSchema.virtual('readTime').get(function () {
  const wordsPerMinute = 200;
  const wordCount = this.content ? this.content.split(/\s+/).length : 0;
  return Math.ceil(wordCount / wordsPerMinute);
});

// Virtual for promotion status
contentSchema.virtual('isPromotionActive').get(function () {
  if (this.type !== 'PROMOTION' || !this.promotionData) return false;
  const now = new Date();
  return (
    this.status === 'PUBLISHED' &&
    this.promotionData.validFrom <= now &&
    this.promotionData.validUntil >= now &&
    (!this.promotionData.usageLimit || this.promotionData.usageCount < this.promotionData.usageLimit)
  );
});

// Pre-save middleware to update excerpt
contentSchema.pre('save', function (next) {
  if (this.isModified('content') && !this.excerpt) {
    this.excerpt = this.content.substring(0, 200).replace(/<[^>]*>/g, '') + '...';
  }
  if (this.isModified('title') && !this.metaTitle) {
    this.metaTitle = this.title.substring(0, 70);
  }
  next();
});

module.exports = mongoose.model('Content', contentSchema);
