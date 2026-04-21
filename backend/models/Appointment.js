const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },

    // Appointment details
    diseaseKeyword: { type: String },
    appointmentDate: { type: Date, required: true, index: true },
    appointmentTime: { type: String, required: true },
    duration: { type: Number, default: 30 }, // Minutes
    consultationType: { type: String, enum: ['ONLINE', 'IN_CLINIC', 'HOME_VISIT'], default: 'ONLINE' },
    tokenNumber: { type: Number, index: true }, // Daily sequence number

    // Patient information
    patientDetails: {
        name: String,
        age: Number,
        gender: String,
        contact: String,
        medicalHistory: String,
        currentSymptoms: String
    },

    // Medical consultation
    consultationNotes: { type: String },
    prescriptions: [
        {
            medicineName: String,
            dosage: String,
            frequency: String,
            duration: String,
            notes: String
        }
    ],

    // Payment reference
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },

    // Fee Breakdown (Immutable Snapshot)
    fees: {
        consultationFee: { type: Number }, // Doctor set fee
        platformFee: { type: Number },     // Admin set fee
        commissionType: { type: String, enum: ['PERCENT', 'FIXED'] },
        commissionValue: { type: Number },
        commissionFee: { type: Number },   // Calculated commission
        couponCode: { type: String },
        discountAmount: { type: Number, default: 0 },
        totalPaid: { type: Number },       // consultationFee + platformFee - discountAmount
        doctorReceivable: { type: Number },// consultationFee - commissionFee
        adminProfit: { type: Number }      // platformFee + commissionFee
    },

    consultationFee: { type: Number }, // Keep for backward compatibility / quick access
    paymentStatus: { type: String, enum: ['PENDING', 'COMPLETED', 'REFUNDED'], default: 'PENDING' },

    // Appointment status tracking
    status: { type: String, enum: ['PENDING_PAYMENT', 'LOCKED', 'PAID', 'PENDING', 'CONFIRMED', 'RESCHEDULED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED_BY_USER', 'CANCELLED_BY_DOCTOR', 'CANCELLED_BY_ADMIN', 'NO_SHOW', 'CANCELLED', 'PAYMENT_FAILED'], default: 'PENDING_PAYMENT', index: true },
    paymentExpiry: { type: Date }, // For locking mechanism
    cancelledBy: { type: String, enum: ['PATIENT', 'DOCTOR', 'ADMIN', 'USER'] },
    cancellationReason: { type: String },

    // Cancellation & Refund Details
    cancellation: {
        cancelledAt: { type: Date },
        reason: { type: String },
        refundAmount: { type: Number },
        refundPercent: { type: Number }, // 0, 50, or 100
        refundStatus: { type: String, enum: ['PENDING', 'REFUNDED', 'FAILED', 'NA', 'FORFEITED'] },
        refundId: { type: String }
    },

    // Rating reference (populated after appointment completion)
    ratingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rating' },
    isRated: { type: Boolean, default: false },
    ratedAt: { type: Date },

    // QR code for check-in
    qrCode: { type: String },
    checkInTime: { type: Date },
    startTime: { type: Date },
    endTime: { type: Date },

    // Follow-up
    followUpRequired: { type: Boolean, default: false },
    followUpDate: { type: Date },

    // Reminders sent
    reminderSent: { type: Boolean, default: false },
    reminderSentAt: { type: Date },

    // Reschedule Tracking
    rescheduleHistory: [{
        previousDate: { type: Date },
        previousTime: { type: String },
        previousToken: { type: Number },
        rescheduledBy: { type: String, enum: ['PATIENT', 'DOCTOR', 'ADMIN'] },
        rescheduledAt: { type: Date, default: Date.now },
        reason: { type: String }
    }],
    rescheduledCount: { type: Number, default: 0 },
    lastAction: { type: String },

    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now }
});

// Indexes for performance
appointmentSchema.index({ userId: 1, status: 1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });

appointmentSchema.index({ status: 1, isRated: 1 }); // For pending ratings
appointmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
