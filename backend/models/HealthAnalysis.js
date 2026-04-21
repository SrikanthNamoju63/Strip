const mongoose = require('mongoose');

const healthAnalysisSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    generatedAt: { type: Date, default: Date.now },
    analysisText: String,
    riskLevel: { type: String, enum: ['Low', 'Moderate', 'High', 'Critical'], default: 'Low' },
    recommendations: [String],
    sourceDataStart: Date,
    sourceDataEnd: Date
});

module.exports = mongoose.model('HealthAnalysis', healthAnalysisSchema);
