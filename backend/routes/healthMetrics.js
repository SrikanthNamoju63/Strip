const express = require('express');
const router = express.Router();
const HealthMetric = require('../models/HealthMetric');
const RiskPrediction = require('../models/RiskPrediction');
const { authenticateToken } = require('../middleware/auth');

// Save health metrics
router.post('/save-metrics', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await HealthMetric.create({
            user_id: userId,
            ...req.body,
            data_source: 'device'
        });
        res.json({ success: true, message: 'Saved', metric_id: result.metric_id });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Save analysis
router.post('/save-analysis', authenticateToken, async (req, res) => {
    try {
        const { metrics_id, ai_analysis, risk_prediction } = req.body;
        // In Mongoose we filter by _id (if metric_id is _id) or custom metric_id
        await HealthMetric.findOneAndUpdate(
            { metric_id: metrics_id, user_id: req.user.userId },
            { ai_analysis, risk_score: risk_prediction }
        );
        res.json({ success: true, message: 'Saved' });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Save prediction
router.post('/save-prediction', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { predicted_risks, risk_level, prevention_plan, recommendations } = req.body;

        // Invalidate old
        await RiskPrediction.updateMany({ user_id: userId }, { is_current: false });

        const validUntil = new Date();
        validUntil.setHours(validUntil.getHours() + 12);

        const result = await RiskPrediction.create({
            user_id: userId,
            overall_risk_level: risk_level,
            risk_factors: JSON.stringify(predicted_risks || {}),
            prevention_plan,
            recommendations,
            valid_until: validUntil,
            is_current: true
        });

        res.json({ success: true, message: 'Saved', prediction_id: result.prediction_id });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Get recent metrics
router.get('/recent-metrics', authenticateToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const metrics = await HealthMetric.find({ user_id: req.user.userId })
            .sort({ recorded_at: -1 })
            .limit(limit);
        res.json({ success: true, metrics });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;
