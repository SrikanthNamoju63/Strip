const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    user_id: { type: Number, unique: true }, // Will be auto-incremented or managed manually
    display_id: { type: String, unique: true, required: true },
    full_name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password_hash: { type: String, required: true },
    phone: { type: String, unique: true },
    date_of_birth: { type: Date, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    profile_image: { type: String },
    is_active: { type: Boolean, default: true },
    is_email_verified: { type: Boolean, default: false },
    is_phone_verified: { type: Boolean, default: false },
    fcm_token: { type: String },
    reset_otp: { type: String },
    reset_otp_expiry: { type: Date },
    last_login: { type: Date },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Auto-increment logic for user_id would typically go here using a counter collection
// For simplicity in migration, we might rely on the existing ID strategy or UUIDs
// schema.pre('save', ...);

module.exports = mongoose.model('User', userSchema);
