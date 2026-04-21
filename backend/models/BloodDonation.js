const mongoose = require('mongoose');

const bloodDonationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    donationDate: { type: Date, default: Date.now },
    location: { type: String, required: true },
    units: { type: Number, default: 1 },
    bloodGroup: { type: String },
    status: { type: String, enum: ['COMPLETED', 'SCHEDULED'], default: 'COMPLETED' },
    notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('BloodDonation', bloodDonationSchema);
