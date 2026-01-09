const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
    user_id: { type: Number, ref: 'User', unique: true, required: true }, // Referencing User by Number ID
    blood_group: { type: String, maxlength: 5 },
    height_cm: { type: Number },
    weight_kg: { type: Number },
    address_line1: { type: String },
    address_line2: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    country: { type: String, default: 'India' },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], index: '2dsphere' } // [longitude, latitude]
    },
    emergency_contact_name: { type: String },
    emergency_contact_phone: { type: String },
    emergency_contact_relation: { type: String },
    health_insurance_number: { type: String },
    health_insurance_provider: { type: String },
    preferred_language: { type: String, default: 'English' }
}, {
    timestamps: true
});

module.exports = mongoose.model('UserProfile', userProfileSchema);
