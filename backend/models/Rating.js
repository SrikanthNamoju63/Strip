const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Overall rating
    overallRating: { type: Number, required: true, min: 1, max: 5 },

    // Category ratings
    serviceRatings: {
        behavior: { type: Number, min: 1, max: 5 }, // Doctor's behavior/attitude
        professionalism: { type: Number, min: 1, max: 5 }, // Medical knowledge
        hygiene: { type: Number, min: 1, max: 5 }, // Clinic/office cleanliness
        punctuality: { type: Number, min: 1, max: 5 }, // Time management
        communication: { type: Number, min: 1, max: 5 } // Explanation clarity
    },

    // Review text
    title: { type: String }, // e.g., "Excellent Doctor"
    reviewText: { type: String, maxlength: 1000 },

    // Recommendation
    wouldRecommend: { type: Boolean, default: true },

    // Additional info
    visitReason: { type: String }, // Why the patient visited
    consultationType: { type: String, enum: ['ONLINE', 'IN_CLINIC', 'HOME_VISIT'] },

    // Responses
    doctorResponse: {
        text: { type: String },
        respondedAt: { type: Date }
    },

    // Review moderation
    isVerified: { type: Boolean, default: true },
    isHelpful: { type: Number, default: 0 }, // Count of helpful votes
    isFlagged: { type: Boolean, default: false },
    flagReason: { type: String },

    // Metadata
    isAnonymous: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false }, // Admin hide
    attachments: [{ type: String }], // Photos/videos URL

    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now }
});

// Indexes for performance
ratingSchema.index({ doctorId: 1, createdAt: -1 });
ratingSchema.index({ userId: 1, createdAt: -1 });

ratingSchema.index({ isFlagged: 1 }); // For moderation

module.exports = mongoose.model('Rating', ratingSchema);
