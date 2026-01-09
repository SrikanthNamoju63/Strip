const mongoose = require('mongoose');

const appointmentSyncSchema = new mongoose.Schema({
    appointment_id: { type: Number, unique: true, required: true }, // Synced ID or auto-gen
    user_id: { type: Number, ref: 'User', required: true, index: true },
    doctor_id: { type: String, ref: 'Doctor', required: true, index: true },
    appointment_date_time: { type: Date, required: true, index: true },
    duration_mins: { type: Number, default: 30 },
    appointment_type: {
        type: String,
        enum: ['consultation', 'follow-up', 'emergency', 'online', 'Hospital Visit', 'Video Consult'],
        default: 'consultation'
    },
    status: {
        type: String,
        enum: ['Confirmed', 'InProgress', 'Completed', 'Cancelled', 'NoShow', 'Expired', 'Scheduled'], // Added 'Scheduled' to match legacy
        default: 'Confirmed',
        index: true
    },
    cancellation_reason: { type: String },
    cancelled_by: { type: String, enum: ['user', 'doctor', 'system'] },
    symptoms: { type: String },
    notes: { type: String }, // Added for legacy compatibility
    token_number: { type: Number },
    queue_position: { type: Number },
    consultation_fee: { type: Number },

    // Payment Details (Embedded to simplify migration)
    payment_status: { type: String, enum: ['Pending', 'Paid', 'Refunded'], default: 'Pending' },
    payment_method: { type: String },
    transaction_id: { type: String },
    amount_paid: { type: Number },
    payment_date: { type: Date },

    prescription_given: { type: Boolean, default: false },
    contacted_at: { type: Date }, // Legacy field
    expires_at: { type: Date },   // Legacy field
    confirmed_at: { type: Date, default: Date.now },
    completed_at: { type: Date },
    last_synced: { type: Date, default: Date.now }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'last_synced' },
    collection: 'user_appointments'
});

module.exports = mongoose.model('Appointment', appointmentSyncSchema);
