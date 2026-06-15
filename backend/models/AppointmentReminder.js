const mongoose = require('mongoose');

/**
 * AppointmentReminder Model
 * Manages reminder notifications for appointments
 * Tracks reminder delivery status and schedules
 */
const appointmentReminderSchema = new mongoose.Schema({
    appointmentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Appointment', 
        required: true,
        index: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true,
        index: true
    },

    // Reminder Type
    reminderType: {
        type: String,
        enum: ['PRE_APPOINTMENT', 'FOLLOW_UP', 'PRESCRIPTION_REMINDER', 'PAYMENT_REMINDER', 'CUSTOM'],
        required: true,
        index: true
    },

    // Reminder Timing
    reminderTime: {
        type: Date,
        required: true,
        index: true
    },

    offsetDays: {
        type: Number,
        description: 'Days before appointment (-7 = 7 days before, 1 = 1 day after)'
    },

    offsetHours: {
        type: Number,
        default: 24,
        min: 1,
        max: 72
    },

    // Communication Channels
    channels: [{
        type: {
            type: String,
            enum: ['SMS', 'EMAIL', 'PUSH_NOTIFICATION', 'WHATSAPP', 'CALL'],
            required: true
        },
        isEnabled: {
            type: Boolean,
            default: true
        },
        preferences: mongoose.Schema.Types.Mixed
    }],

    // Reminder Content
    reminderContent: {
        subject: {
            type: String,
            maxlength: 200
        },
        message: {
            type: String,
            maxlength: 1000,
            required: true
        },
        actionUrl: String,
        customData: mongoose.Schema.Types.Mixed
    },

    // Delivery Status
    deliveryStatus: {
        type: String,
        enum: ['PENDING', 'SCHEDULED', 'SENT', 'FAILED', 'CANCELLED', 'BOUNCED'],
        default: 'PENDING',
        index: true
    },

    // Delivery Details for Each Channel
    deliveryLog: [{
        channel: {
            type: String,
            enum: ['SMS', 'EMAIL', 'PUSH_NOTIFICATION', 'WHATSAPP', 'CALL']
        },
        status: {
            type: String,
            enum: ['PENDING', 'SENT', 'FAILED', 'BOUNCED', 'CANCELLED']
        },
        sentAt: Date,
        gatewayReference: String,
        errorMessage: String,
        retryCount: {
            type: Number,
            default: 0
        },
        deliveredAt: Date,
        readAt: Date,
        openedAt: Date,
        clickedAt: Date
    }],

    // User Engagement
    userInteraction: {
        opened: {
            type: Boolean,
            default: false
        },
        openedAt: Date,
        clicked: {
            type: Boolean,
            default: false
        },
        clickedAt: Date,
        actionTaken: {
            type: String,
            enum: ['CONFIRMED', 'CANCELLED', 'RESCHEDULED', 'IGNORED']
        },
        actionTakenAt: Date
    },

    // Scheduling Configuration
    schedulingConfig: {
        isAutomatic: {
            type: Boolean,
            default: true
        },
        frequency: {
            type: String,
            enum: ['ONCE', 'DAILY', 'WEEKLY'],
            default: 'ONCE'
        },
        maxRetries: {
            type: Number,
            default: 3,
            min: 0,
            max: 10
        },
        retryInterval: {
            type: Number,
            description: 'Minutes between retries'
        }
    },

    // Template Information
    templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ReminderTemplate',
        sparse: true
    },

    customizationNotes: {
        type: String,
        maxlength: 500
    },

    // User Preferences
    userPreferences: {
        muteReminders: {
            type: Boolean,
            default: false
        },
        preferredChannels: [String],
        preferredTimeWindow: {
            startTime: String,
            endTime: String
        },
        doNotDisturbPeriod: {
            startTime: String,
            endTime: String
        }
    },

    // Metadata
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'MEDIUM'
    },

    tags: [String],

    // Status Tracking
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },

    isSent: {
        type: Boolean,
        default: false,
        index: true
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },

    updatedAt: {
        type: Date,
        default: Date.now
    },

    expiryDate: {
        type: Date,
        description: 'Auto-delete reminder after this date'
    },

    // Notes
    notes: {
        type: String,
        maxlength: 1000
    }

}, { 
    timestamps: true,
    collection: 'appointment_reminders'
});

// Indexes for production performance
appointmentReminderSchema.index({ appointmentId: 1, reminderType: 1 });
appointmentReminderSchema.index({ userId: 1, deliveryStatus: 1 });
appointmentReminderSchema.index({ doctorId: 1, createdAt: -1 });
appointmentReminderSchema.index({ reminderTime: 1, deliveryStatus: 1 });
appointmentReminderSchema.index({ isActive: 1, isSent: 1 });
appointmentReminderSchema.index({ createdAt: -1 });

// TTL Index - Auto-delete after 1 year
appointmentReminderSchema.index({ expiryDate: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AppointmentReminder', appointmentReminderSchema);
