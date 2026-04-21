/**
 * Insurance Partner Model
 * Manages insurance company partnerships
 */

const mongoose = require('mongoose');

const insurancePartnerSchema = new mongoose.Schema({
  // Basic Information
  companyName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },

  companyCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },

  // Contact Information
  contactPerson: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    designation: { type: String }
  },

  companyAddress: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String, default: 'India' },
    zipCode: { type: String }
  },

  // Company Details
  website: {
    type: String
  },

  logo: {
    type: String
  },

  description: {
    type: String,
    maxlength: 1000
  },

  // Partnership Status
  status: {
    type: String,
    enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'TERMINATED'],
    default: 'PENDING',
    index: true
  },

  // Partnership Dates
  partnershipStartDate: {
    type: Date
  },

  partnershipEndDate: {
    type: Date
  },

  // Coverage Details
  coverageTypes: [{
    type: String,
    enum: ['CONSULTATION', 'DIAGNOSTICS', 'PHARMACY', 'HOSPITALIZATION', 'SURGERY', 'EMERGENCY']
  }],

  // Plans offered
  plans: [{
    planCode: { type: String, required: true },
    planName: { type: String, required: true },
    description: { type: String },
    coverageAmount: { type: Number },
    premiumAmount: { type: Number },
    coPayPercentage: { type: Number, default: 0 },
    deductible: { type: Number, default: 0 },
    waitingPeriodDays: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  }],

  // API Integration
  apiConfig: {
    baseUrl: { type: String },
    authType: { type: String, enum: ['API_KEY', 'OAUTH', 'BASIC_AUTH'] },
    apiKey: { type: String },
    apiSecret: { type: String },
    webhookUrl: { type: String },
    isActive: { type: Boolean, default: false }
  },

  // Commission Structure
  commission: {
    percentage: { type: Number, default: 0 },
    flatFee: { type: Number, default: 0 },
    paymentTerms: { type: String, enum: ['MONTHLY', 'QUARTERLY'], default: 'MONTHLY' }
  },

  // Settlement Details
  settlement: {
    bankName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    accountHolderName: { type: String }
  },

  // Documents
  documents: [{
    name: { type: String },
    url: { type: String },
    type: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Statistics
  stats: {
    totalClaims: { type: Number, default: 0 },
    approvedClaims: { type: Number, default: 0 },
    rejectedClaims: { type: Number, default: 0 },
    totalClaimAmount: { type: Number, default: 0 },
    totalPatients: { type: Number, default: 0 }
  },

  // Notes
  internalNotes: {
    type: String
  },

  // Management
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }

}, { timestamps: true });

// Indexes
insurancePartnerSchema.index({ 'coverageTypes': 1 });

// Virtual for active plans count
insurancePartnerSchema.virtual('activePlansCount').get(function () {
  return this.plans ? this.plans.filter(p => p.isActive).length : 0;
});

// Virtual for partnership duration
insurancePartnerSchema.virtual('partnershipDuration').get(function () {
  if (!this.partnershipStartDate) return 0;
  const endDate = this.partnershipEndDate || new Date();
  return Math.floor((endDate - this.partnershipStartDate) / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('InsurancePartner', insurancePartnerSchema);
