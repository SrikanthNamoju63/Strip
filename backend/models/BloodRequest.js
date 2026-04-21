const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
    requesterUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patientName: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    unitsRequired: { type: Number, required: true },
    hospitalName: { type: String, required: true },
    location: { type: String, required: true },
    urgencyLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
    status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'FULFILLED', 'CANCELLED'], default: 'OPEN', index: true },
    matchedDonorId: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodDonor' },
    adminNotes: { type: String }
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
