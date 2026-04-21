const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    
    // Settlement period
    settlementPeriod: {
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true }
    },
    
    // Financial details
    totalAmount: { type: Number, required: true }, // Total to settle
    grossEarnings: { type: Number, required: true }, // Total consultation fees
    platformCommission: { type: Number, default: 0 }, // Admin fees
    deductions: { type: Number, default: 0 }, // Refunds, disputes, etc.
    netAmount: { type: Number, required: true }, // Amount paid to doctor
    
    // Payment details
    paymentMethod: { type: String, enum: ['BANK_TRANSFER', 'UPI', 'WALLET'], default: 'BANK_TRANSFER' },
    transactionId: { type: String, unique: true },
    referenceNumber: { type: String },
    
    // Bank details snapshot (to handle changes)
    bankDetails: {
        accountHolderName: String,
        accountNumber: String,
        ifscCode: String,
        bankName: String
    },
    
    // Status tracking
    status: { type: String, enum: ['PENDING', 'INITIATED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'], default: 'PENDING', index: true },
    initiatedAt: { type: Date },
    completedAt: { type: Date },
    failureReason: { type: String },
    
    // Related payments
    paymentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }],
    appointmentCount: { type: Number, default: 0 },
    
    // Notes
    notes: { type: String },
    adminNotes: { type: String },
    
    // Approval
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    approvedAt: { type: Date },
    
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now }
});

// Indexes for performance
settlementSchema.index({ doctorId: 1, createdAt: -1 });
settlementSchema.index({ status: 1, createdAt: -1 });
settlementSchema.index({ 'settlementPeriod.endDate': -1 });

module.exports = mongoose.model('Settlement', settlementSchema);
