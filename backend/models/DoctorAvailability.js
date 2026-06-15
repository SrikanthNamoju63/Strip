const mongoose = require('mongoose');

/**
 * DoctorAvailability Model
 * Manages doctor's availability schedule including weekly slots and special dates
 * Production-grade implementation with proper indexing and validation
 */
const doctorAvailabilitySchema = new mongoose.Schema({
    doctorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Doctor', 
        required: true, 
        index: true,
        unique: true
    },

    // Weekly recurring availability
    weeklyAvailability: [{
        day: { 
            type: String, 
            required: true,
            enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
            index: true
        },
        startTime: { 
            type: String, 
            required: true,
            validate: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
        },
        endTime: { 
            type: String, 
            required: true,
            validate: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
        },
        lunchStart: { 
            type: String,
            default: '13:00',
            validate: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
        },
        lunchEnd: { 
            type: String,
            default: '14:00',
            validate: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
        },
        isOff: { 
            type: Boolean, 
            default: false 
        },
        slotDuration: { 
            type: Number, 
            default: 30,
            min: 15,
            max: 120
        },
        maxAppointmentsPerDay: {
            type: Number,
            default: 20,
            min: 1
        }
    }],

    // Special dates and exceptions
    specialDates: [{
        date: { 
            type: Date, 
            required: true,
            index: true
        },
        isOff: { 
            type: Boolean, 
            default: false 
        },
        reason: { 
            type: String,
            maxlength: 500
        },
        startTime: { 
            type: String,
            validate: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
        },
        endTime: { 
            type: String,
            validate: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
        },
        createdAt: { 
            type: Date, 
            default: Date.now 
        }
    }],

    // Consultation modes and their availability
    consultationModes: [{
        type: {
            type: String,
            enum: ['IN_PERSON', 'ONLINE', 'HOME_VISIT'],
            required: true
        },
        isAvailable: {
            type: Boolean,
            default: true
        },
        maxDailyLimit: {
            type: Number,
            default: 10,
            min: 1
        },
        notes: String
    }],

    // Buffer time between appointments (in minutes)
    bufferTime: {
        type: Number,
        default: 5,
        min: 0,
        max: 30
    },

    // Break times during the day
    breaks: [{
        startTime: {
            type: String,
            required: true,
            validate: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
        },
        endTime: {
            type: String,
            required: true,
            validate: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
        },
        reason: {
            type: String,
            enum: ['LUNCH', 'BREAK', 'MEETING', 'OTHER']
        },
        recurring: {
            type: Boolean,
            default: false
        }
    }],

    // Availability status
    isActive: { 
        type: Boolean, 
        default: true,
        index: true
    },

    // Last updated information
    lastUpdatedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Admin'
    },

    // Notes for availability management
    notes: { 
        type: String,
        maxlength: 1000
    }
}, { timestamps: true });

// Indexes for production performance
doctorAvailabilitySchema.index({ doctorId: 1, isActive: 1 });
doctorAvailabilitySchema.index({ 'weeklyAvailability.day': 1 });
doctorAvailabilitySchema.index({ 'specialDates.date': 1 });
doctorAvailabilitySchema.index({ updatedAt: -1 });

module.exports = mongoose.model('DoctorAvailability', doctorAvailabilitySchema);
