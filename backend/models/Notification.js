const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipientId: { type: mongoose.Schema.Types.ObjectId, refPath: 'recipientType' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // backward compat
    recipientType: { 
        type: String, 
        enum: ['user', 'doctor', 'admin'],
        default: 'user'
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { 
        type: String, 
        enum: [
            'BLOOD', 'APPOINTMENT', 'MEDICINE', 'HEALTH', 'INFO',
            'APPOINTMENT_CANCELLED', 'APPOINTMENT_RESCHEDULED',
            'PAYMENT', 'SYSTEM', 'WARNING', 'SUCCESS'
        ],
        default: 'INFO'
    },
    read: { type: Boolean, default: false },
    metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: { createdAt: true, updatedAt: false } });

// Index for fast lookups
notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
