const mongoose = require('mongoose');

const healthPredictionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    riskType: { type: String, required: true },
    confidenceScore: Number,
    description: String,
    precautions: [String],
    predictedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HealthPrediction', healthPredictionSchema);
