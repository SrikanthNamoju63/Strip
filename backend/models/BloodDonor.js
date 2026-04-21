const mongoose = require('mongoose');

const bloodDonorSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bloodGroup: { type: String, required: true, index: true },
    age: { type: Number },
    weight: { type: Number },
    lastDonationDate: { type: Date },
    alcoholic: { type: Boolean, default: false },
    smoking: { type: Boolean, default: false },
    isEligible: { type: Boolean, default: false },
    eligibilityReason: { type: String },
    available: { type: Boolean, default: true }
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.model('BloodDonor', bloodDonorSchema);
