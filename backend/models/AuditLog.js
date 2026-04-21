const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    module: { type: String, required: true, index: true }, // e.g., 'DOCTOR', 'FINANCE', 'SETTINGS'
    action: { type: String, required: true }, // e.g., 'VERIFY', 'APPROVE_REFUND', 'UPDATE_FEE'
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, index: true }, // The ID of the object being modified (DoctorId, TranscationId)
    targetModel: { type: String }, // e.g., 'Doctor', 'Payment'

    // Changes tracking
    beforeValue: { type: mongoose.Schema.Types.Mixed }, // Snapshot before change
    afterValue: { type: mongoose.Schema.Types.Mixed }, // Snapshot after change

    ipAddress: { type: String },
    deviceInfo: { type: String },

    metadata: { type: String }, // Extra text info e.g. "Reason for rejection: Invalid docs"

}, { timestamps: { createdAt: true, updatedAt: false } });

// Index for chronological queries and filtering by module
auditLogSchema.index({ module: 1, createdAt: -1 });
auditLogSchema.index({ performedBy: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
