const mongoose = require('mongoose');

const userSessionSchema = new mongoose.Schema({
    user_id: { type: Number, ref: 'User', required: true },
    session_token: { type: String, unique: true, required: true },
    device_id: { type: String },
    device_type: { type: String, enum: ['Android', 'iOS', 'Web'], required: true },
    device_name: { type: String },
    app_version: { type: String },
    os_version: { type: String },
    ip_address: { type: String },
    location: { type: String },
    is_active: { type: Boolean, default: true },
    expires_at: { type: Date, required: true },
    last_activity: { type: Date, default: Date.now }
}, {
    timestamps: true
});

module.exports = mongoose.model('UserSession', userSessionSchema);
