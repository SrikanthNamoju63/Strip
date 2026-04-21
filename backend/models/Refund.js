const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true, unique: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },

    amount: { type: Number, required: true },
    reason: { type: String, required: true }, // e.g. "User cancelled", "Doctor no-show"

    // Status Flow: PENDING -> APPROVED -> PROCESSING -> COMPLETED (or REJECTED)
    status: { type: String, enum: ['PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'FAILED', 'REJECTED'], default: 'PENDING', index: true },

    // Approval details
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    rejectionReason: { type: String },

    // Gateway details
    // Fix: Add unique and sparse to prevent duplicate refund IDs
    gatewayRefundId: { type: String, unique: true, sparse: true, index: true },
    gatewayResponse: { type: mongoose.Schema.Types.Mixed },

    // Fix: Add idempotency key for preventing duplicate refunds
    idempotencyKey: { type: String, unique: true, sparse: true },

    processedAt: { type: Date },
    completedAt: { type: Date },

}, { timestamps: true });

// Fix: Compound indexes for better query performance
refundSchema.index({ status: 1, createdAt: -1 });
refundSchema.index({ userId: 1, paymentId: 1 });
refundSchema.index({ doctorId: 1, status: 1 });

module.exports = mongoose.model('Refund', refundSchema);
