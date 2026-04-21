/**
 * Campaign Model
 * Email and SMS marketing campaigns
 */

const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  // Campaign Basics
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },

  campaignCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },

  // Campaign Type
  type: {
    type: String,
    enum: ['EMAIL', 'SMS', 'PUSH', 'WHATSAPP'],
    required: true
  },

  // Campaign Purpose
  purpose: {
    type: String,
    enum: ['PROMOTION', 'ANNOUNCEMENT', 'REMINDER', 'NEWSLETTER', 'WELCOME', 'RE_ENGAGEMENT', 'TRANSACTIONAL'],
    required: true
  },

  // Content
  subject: {
    type: String,
    required: true,
    maxlength: 200
  },

  content: {
    type: String,
    required: true
  },

  contentHtml: {
    type: String
  },

  // For SMS (shorter content)
  smsContent: {
    type: String,
    maxlength: 1600
  },

  // Media
  attachments: [{
    name: String,
    url: String,
    type: String
  }],

  // Target Audience
  targetAudience: {
    userType: {
      type: String,
      enum: ['ALL', 'USERS', 'DOCTORS', 'ADMINS'],
      default: 'ALL'
    },
    filters: {
      location: { type: String },
      registrationDateFrom: { type: Date },
      registrationDateTo: { type: Date },
      lastActiveFrom: { type: Date },
      lastActiveTo: { type: Date },
      minAppointments: { type: Number },
      maxAppointments: { type: Number },
      specificUserIds: [{ type: mongoose.Schema.Types.ObjectId }]
    }
  },

  // Scheduling
  status: {
    type: String,
    enum: ['DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'PAUSED', 'CANCELLED'],
    default: 'DRAFT'
  },

  scheduledAt: {
    type: Date
  },

  sentAt: {
    type: Date
  },

  completedAt: {
    type: Date
  },

  // Statistics
  stats: {
    totalRecipients: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    bounced: { type: Number, default: 0 },
    unsubscribed: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    openRate: { type: Number, default: 0 },
    clickRate: { type: Number, default: 0 }
  },

  // A/B Testing
  abTesting: {
    isEnabled: { type: Boolean, default: false },
    variants: [{
      name: { type: String },
      subject: { type: String },
      content: { type: String },
      percentage: { type: Number },
      stats: {
        sent: { type: Number, default: 0 },
        opened: { type: Number, default: 0 },
        clicked: { type: Number, default: 0 }
      }
    }],
    winningVariant: { type: String }
  },

  // Tracking
  tracking: {
    utmSource: { type: String, default: 'platform' },
    utmMedium: { type: String },
    utmCampaign: { type: String },
    trackOpens: { type: Boolean, default: true },
    trackClicks: { type: Boolean, default: true }
  },

  // Reply handling
  replyTo: {
    type: String
  },

  fromName: {
    type: String
  },

  fromEmail: {
    type: String
  },

  // Throttling
  throttle: {
    enabled: { type: Boolean, default: false },
    emailsPerHour: { type: Number, default: 1000 },
    delayBetweenSends: { type: Number, default: 100 } // milliseconds
  },

  // Recipients List (populated when sending)
  recipients: [{
    userId: { type: mongoose.Schema.Types.ObjectId },
    userType: { type: String, enum: ['USER', 'DOCTOR', 'ADMIN'] },
    email: { type: String },
    phone: { type: String },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'FAILED'],
      default: 'PENDING'
    },
    sentAt: { type: Date },
    deliveredAt: { type: Date },
    openedAt: { type: Date },
    clickedAt: { type: Date },
    failedReason: { type: String }
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

  // Notes
  notes: {
    type: String
  }

}, { timestamps: true });

// Indexes
campaignSchema.index({ status: 1, scheduledAt: 1 });
campaignSchema.index({ type: 1, purpose: 1 });

// Pre-save to generate campaign code
campaignSchema.pre('save', async function (next) {
  if (this.isNew && !this.campaignCode) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.campaignCode = `CMP-${timestamp}-${random}`;
  }
  next();
});

// Method to calculate stats
campaignSchema.methods.calculateStats = function () {
  if (this.stats.sent > 0) {
    this.stats.openRate = (this.stats.opened / this.stats.sent) * 100;
    this.stats.clickRate = (this.stats.clicked / this.stats.sent) * 100;
  }
};

module.exports = mongoose.model('Campaign', campaignSchema);
