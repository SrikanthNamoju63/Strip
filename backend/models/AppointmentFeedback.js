const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    appointment_id: { type: Number, ref: 'Appointment', unique: true, required: true },
    user_id: { type: Number, ref: 'User', required: true },
    doctor_id: { type: Number, ref: 'Doctor', required: true },
    rating: { type: Number, min: 1, max: 5, required: true, index: true },
    review_text: { type: String },
    would_recommend: { type: Boolean },
    wait_time_rating: { type: Number, min: 1, max: 5 },
    cleanliness_rating: { type: Number, min: 1, max: 5 },
    staff_behavior_rating: { type: Number, min: 1, max: 5 },
    experience_tags: { type: [String] }, // Helper for JSON tags
    complaints: { type: String },
    suggestions: { type: String },
    is_anonymous: { type: Boolean, default: false }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false }
});

module.exports = mongoose.model('AppointmentFeedback', feedbackSchema);
