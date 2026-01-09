const mongoose = require('mongoose');

const bloodDonorSchema = new mongoose.Schema({
    donor_id: { type: Number, unique: true, sparse: true }, // Auto-inc logic needed if preserving SQL ID style
    user_id: { type: Number, unique: true, required: true },
    blood_group: { type: String, required: true },
    role: { type: String, enum: ['Donor', 'Receiver', 'Both'], default: 'Donor' },
    is_available: { type: Boolean, default: true, index: true },
    is_eligible: { type: Boolean, default: false },
    last_eligibility_check: { type: Date },
    last_donation_date: { type: Date },
    next_eligible_date: { type: Date, index: true },
    phone: { type: String },
    city: { type: String, index: true },
    state: { type: String },
    pincode: { type: String },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], index: '2dsphere' } // [long, lat]
    },
    willing_to_travel_km: { type: Number, default: 10 },
    preferred_donation_centers: { type: String }, // JSON or TEXT
    blood_group_verified: { type: Boolean, default: false },
    total_donations: { type: Number, default: 0 },
    life_saved_count: { type: Number, default: 0 },
    donor_badge: { type: String, enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'], default: 'Bronze' },
    is_visible_in_search: { type: Boolean, default: true, index: true },
    last_donation_location: { type: String },
    emergency_contact_name: { type: String },
    emergency_contact_phone: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for populating user details using user_id (Number) instead of _id (ObjectId)
bloodDonorSchema.virtual('user_details', {
    ref: 'User',
    localField: 'user_id',
    foreignField: 'user_id',
    justOne: true
});

module.exports = mongoose.model('BloodDonor', bloodDonorSchema);
