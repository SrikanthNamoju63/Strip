const mongoose = require('mongoose');

const riskPredictionSchema = new mongoose.Schema({
    prediction_id: { type: Number, unique: true },
    user_id: { type: Number, ref: 'User', required: true, index: true },
    overall_risk_level: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'] },
    risk_factors: { type: String }, // JSON string
    predicted_conditions: { type: String }, // JSON string
    prevention_plan: { type: String },
    recommendations: { type: String },
    valid_until: { type: Date },
    is_current: { type: Boolean, default: true, index: true },
    predicted_at: { type: Date, default: Date.now }
}, {
    timestamps: false
});

module.exports = mongoose.model('RiskPrediction', riskPredictionSchema);
