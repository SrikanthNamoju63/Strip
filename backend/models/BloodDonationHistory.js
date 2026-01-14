const mongoose = require('mongoose');

const bloodDonationHistorySchema = new mongoose.Schema({
    user_id: { type: Number, required: true, ref: 'User' },
    blood_group: { type: String, required: true },
    donated_date: { type: Date, required: true },
    place: { type: String }, // Hospital or Camp
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BloodDonationHistory', bloodDonationHistorySchema);
