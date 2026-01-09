const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    notification_id: { type: Number, unique: true }, // Auto-increment suggested
    user_id: { type: Number, ref: 'User', required: true, index: true },
    type: {
        type: String,
        enum: ['appointment', 'medication', 'health_alert', 'blood_request', 'system', 'promotion', 'achievement'],
        required: true,
        index: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    action_url: { type: String },
    action_data: { type: Object }, // JSON
    image_url: { type: String },
    is_read: { type: Boolean, default: false, index: true },
    read_at: { type: Date },
    is_deleted: { type: Boolean, default: false },
    scheduled_for: { type: Date, index: true },
    sent_at: { type: Date },
    delivery_status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
    expires_at: { type: Date }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false }
});

module.exports = mongoose.model('Notification', notificationSchema);
