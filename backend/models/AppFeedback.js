const mongoose = require('mongoose');

const appFeedbackSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    feedbackType: {
        type: String,
        enum: ['BUG', 'FEATURE', 'GENERAL', 'EXPERIENCE'],
        required: true
    },
    feedbackText: {
        type: String,
        required: true,
        maxlength: 1000
    },
    appVersion: {
        type: String,
        default: 'Unknown'
    },
    deviceInfo: {
        type: String,
        default: 'Unknown'
    },
    status: {
        type: String,
        enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'],
        default: 'OPEN'
    },
    adminReply: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('AppFeedback', appFeedbackSchema);
