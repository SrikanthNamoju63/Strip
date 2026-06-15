const mongoose = require('mongoose');

/**
 * UserActivity Model
 * Tracks all user actions and interactions for analytics and auditing
 * Production-grade implementation with detailed logging
 */
const userActivitySchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        index: true
    },

    // Activity Type Classification
    activityType: {
        type: String,
        enum: [
            'LOGIN',
            'LOGOUT',
            'PROFILE_UPDATE',
            'PROFILE_VIEW',
            'DOCTOR_SEARCH',
            'DOCTOR_VIEW',
            'APPOINTMENT_BOOK',
            'APPOINTMENT_CANCEL',
            'APPOINTMENT_RESCHEDULE',
            'APPOINTMENT_ATTENDED',
            'APPOINTMENT_MISSED',
            'PAYMENT_INITIATED',
            'PAYMENT_SUCCESS',
            'PAYMENT_FAILED',
            'REFUND_REQUESTED',
            'REFUND_COMPLETED',
            'RATING_SUBMITTED',
            'FEEDBACK_SUBMITTED',
            'PRESCRIPTION_VIEW',
            'MEDICAL_REPORT_DOWNLOAD',
            'BLOOD_DONATION_REQUESTED',
            'BLOOD_REQUEST_CREATED',
            'NOTIFICATION_READ',
            'SUPPORT_TICKET_CREATED',
            'SUPPORT_TICKET_UPDATED',
            'PASSWORD_CHANGE',
            'EMAIL_CHANGE',
            'PHONE_CHANGE',
            'DEVICE_LOGIN',
            'SUSPICIOUS_ACTIVITY',
            'SESSION_TIMEOUT',
            'ACCOUNT_DEACTIVATED',
            'ACCOUNT_REACTIVATED'
        ],
        required: true,
        index: true
    },

    // Resource Information
    resourceType: {
        type: String,
        enum: [
            'USER',
            'DOCTOR',
            'APPOINTMENT',
            'PAYMENT',
            'REFUND',
            'FEEDBACK',
            'RATING',
            'PRESCRIPTION',
            'MEDICAL_REPORT',
            'BLOOD_REQUEST',
            'SUPPORT_TICKET',
            'ACCOUNT',
            'AUTHENTICATION'
        ]
    },

    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        index: true
    },

    // Action Details
    actionDescription: {
        type: String,
        maxlength: 500
    },

    // Status of Activity
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILURE', 'PENDING', 'CANCELLED'],
        default: 'SUCCESS',
        index: true
    },

    // Error/Result Information
    errorMessage: String,

    resultData: mongoose.Schema.Types.Mixed,

    // Device and Session Information
    ipAddress: {
        type: String,
        index: true
    },

    deviceInfo: {
        userAgent: String,
        platform: String,
        browser: String,
        browserVersion: String,
        os: String,
        osVersion: String,
        deviceType: {
            type: String,
            enum: ['MOBILE', 'TABLET', 'DESKTOP', 'UNKNOWN']
        },
        deviceId: String
    },

    // Location Information (if available)
    location: {
        latitude: Number,
        longitude: Number,
        country: String,
        state: String,
        city: String,
        timezone: String
    },

    // Session Information
    sessionId: {
        type: String,
        index: true
    },

    duration: {
        type: Number,
        description: 'Duration of activity in milliseconds'
    },

    // Related Records
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        sparse: true
    },

    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        sparse: true
    },

    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        sparse: true
    },

    supportTicketId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SupportTicket',
        sparse: true
    },

    // Analytics Tags
    tags: [{
        type: String
    }],

    // Performance Metrics
    performanceMetrics: {
        responseTime: Number,
        errorRate: Number,
        retryCount: {
            type: Number,
            default: 0
        }
    },

    // Priority for anomaly detection
    anomalyScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },

    isAnomalous: {
        type: Boolean,
        default: false,
        index: true
    },

    anomalyReason: String

}, { 
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'user_activities'
});

// Indexes for production performance
userActivitySchema.index({ userId: 1, createdAt: -1 });
userActivitySchema.index({ activityType: 1, createdAt: -1 });
userActivitySchema.index({ status: 1, createdAt: -1 });
userActivitySchema.index({ ipAddress: 1, createdAt: -1 });
userActivitySchema.index({ resourceType: 1, resourceId: 1 });
userActivitySchema.index({ isAnomalous: 1, createdAt: -1 });
userActivitySchema.index({ createdAt: -1 });
userActivitySchema.index({ userId: 1, activityType: 1, createdAt: -1 });

// TTL Index - Auto-delete after 1 year
userActivitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

module.exports = mongoose.model('UserActivity', userActivitySchema);
