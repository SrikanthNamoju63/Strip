const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
    appointment_id: { type: Number, ref: 'Appointment', required: true },
    user_id: { type: Number, ref: 'User', required: true },
    reminder_type: {
        type: String,
        enum: ['24_hours', '2_hours', '30_minutes', 'custom'],
        required: true
    },
    reminder_time: { type: Date, required: true, index: true },
    is_sent: { type: Boolean, default: false, index: true },
    sent_at: { type: Date },
    delivery_method: { type: String, enum: ['push', 'sms', 'email', 'all'], default: 'push' }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false }
});

module.exports = mongoose.model('AppointmentReminder', reminderSchema);
