const mongoose = require('mongoose');

const userDeviceSchema = new mongoose.Schema({
    user_id: { type: Number, ref: 'User', required: true },
    device_uuid: { type: String, unique: true, required: true },
    device_type: { type: String, enum: ['Android', 'iOS', 'Web', 'Wearable'], required: true },
    device_name: { type: String },
    device_model: { type: String },
    os_version: { type: String },
    app_version: { type: String },
    fcm_token: { type: String },
    is_active: { type: Boolean, default: true },
    last_synced: { type: Date, default: Date.now }
}, {
    timestamps: { createdAt: 'registered_at', updatedAt: 'last_synced' }
});

module.exports = mongoose.model('UserDevice', userDeviceSchema);
