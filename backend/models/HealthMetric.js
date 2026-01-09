const mongoose = require('mongoose');

const healthMetricSchema = new mongoose.Schema({
    metric_id: { type: Number, unique: true },
    user_id: { type: Number, ref: 'User', required: true, index: true },
    heart_rate: { type: Number },
    steps_count: { type: Number },
    calories_burned: { type: Number },
    sleep_hours: { type: Number },
    systolic_bp: { type: Number },
    diastolic_bp: { type: Number },
    body_temperature: { type: Number },
    blood_oxygen: { type: Number },
    data_source: { type: String, default: 'manual' },
    ai_analysis: { type: String },
    risk_score: { type: Number },
    recorded_at: { type: Date, default: Date.now, index: true }
}, {
    timestamps: false
});

module.exports = mongoose.model('HealthMetric', healthMetricSchema);
