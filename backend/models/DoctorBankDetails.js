const mongoose = require('mongoose');

/**
 * DoctorBankDetails Model
 * Securely manages doctor's bank details for settlements and payouts
 * Separated from main Doctor model for security and compliance
 */
const doctorBankDetailsSchema = new mongoose.Schema({
    doctorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Doctor', 
        required: true, 
        index: true,
        unique: true
    },

    // Primary Bank Account Details
    accountHolderName: { 
        type: String, 
        required: true,
        maxlength: 100
    },

    accountNumber: { 
        type: String, 
        required: true,
        maxlength: 20,
        unique: true,
        sparse: true
    },

    ifscCode: { 
        type: String, 
        required: true,
        uppercase: true,
        match: /^[A-Z]{4}[0][A-Z0-9]{6}$/
    },

    bankName: { 
        type: String, 
        required: true,
        maxlength: 100
    },

    branchName: { 
        type: String,
        maxlength: 100
    },

    accountType: { 
        type: String, 
        required: true,
        enum: ['SAVINGS', 'CURRENT'],
        default: 'SAVINGS'
    },

    // PAN Details (Tax Compliance)
    panNumber: { 
        type: String, 
        required: true,
        uppercase: true,
        match: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
        unique: true,
        sparse: true,
        index: true
    },

    panVerificationStatus: {
        type: String,
        enum: ['PENDING', 'VERIFIED', 'FAILED'],
        default: 'PENDING'
    },

    panDocumentUrl: {
        type: String
    },

    // Aadhaar Details (For KYC)
    aadhaarNumber: { 
        type: String,
        match: /^[0-9]{12}$/
    },

    aadhaarVerificationStatus: {
        type: String,
        enum: ['PENDING', 'VERIFIED', 'FAILED'],
        default: 'PENDING'
    },

    // Razorpay Account Details
    razorpayAccountId: { 
        type: String,
        index: true,
        sparse: true
    },

    razorpayKycStatus: { 
        type: String, 
        enum: ['PENDING', 'UNDER_REVIEW', 'ACTIVE', 'REJECTED', 'SUSPENDED'],
        default: 'PENDING',
        index: true
    },

    razorpayActivationStatus: { 
        type: String, 
        default: 'INACTIVE',
        enum: ['INACTIVE', 'ACTIVE', 'SUSPENDED']
    },

    razorpayKycDetails: {
        submittedAt: Date,
        approvedAt: Date,
        rejectionReason: String
    },

    // GST Details (if applicable)
    gstRegistered: {
        type: Boolean,
        default: false
    },

    gstNumber: {
        type: String,
        match: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{3}$/,
        sparse: true
    },

    gstDocumentUrl: {
        type: String
    },

    // Verification & Compliance
    verificationStatus: { 
        type: String, 
        enum: ['PENDING', 'VERIFIED', 'FAILED', 'REJECTED'],
        default: 'PENDING',
        index: true
    },

    isVerified: { 
        type: Boolean, 
        default: false,
        index: true
    },

    verificationDate: Date,

    verificationMethod: {
        type: String,
        enum: ['AUTO', 'MANUAL', 'THIRD_PARTY']
    },

    verifiedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Admin'
    },

    verificationFailureReason: {
        type: String,
        maxlength: 500
    },

    // Settlement Preferences
    settlementFrequency: {
        type: String,
        enum: ['WEEKLY', 'BI_WEEKLY', 'MONTHLY'],
        default: 'MONTHLY'
    },

    minimumSettlementAmount: {
        type: Number,
        default: 1000,
        min: 0
    },

    preferredSettlementDay: {
        type: Number,
        min: 1,
        max: 28,
        default: 1
    },

    // Alternate Bank Account (Optional)
    alternateAccount: {
        accountHolderName: String,
        accountNumber: String,
        ifscCode: String,
        bankName: String,
        accountType: {
            type: String,
            enum: ['SAVINGS', 'CURRENT']
        },
        isPrimary: {
            type: Boolean,
            default: false
        }
    },

    // Compliance Documents
    documents: {
        bankProofUrl: String,
        identityProofUrl: String,
        addressProofUrl: String,
        incomeProofUrl: String
    },

    // Additional Information
    isActive: { 
        type: Boolean, 
        default: true,
        index: true
    },

    notes: { 
        type: String,
        maxlength: 1000
    },

    // Audit Trail
    lastUpdatedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Admin'
    },

    updateHistory: [{
        updatedAt: {
            type: Date,
            default: Date.now
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin'
        },
        changeDescription: String
    }]
}, { 
    timestamps: true,
    collection: 'doctor_bank_details'
});

// Indexes for production performance
doctorBankDetailsSchema.index({ doctorId: 1, isActive: 1 });
doctorBankDetailsSchema.index({ panNumber: 1 });
doctorBankDetailsSchema.index({ razorpayAccountId: 1 });
doctorBankDetailsSchema.index({ verificationStatus: 1 });
doctorBankDetailsSchema.index({ razorpayKycStatus: 1 });
doctorBankDetailsSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('DoctorBankDetails', doctorBankDetailsSchema);
