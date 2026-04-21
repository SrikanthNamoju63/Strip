const HealthReading = require('../../models/HealthReading');
const HealthAnalysis = require('../../models/HealthAnalysis');
const User = require('../../models/User');

// Mock function for OpenRouter call
async function callOpenRouterAI(profile, readings) {
    const prompt = `
    User Profile: Age ${profile.age}, Gender ${profile.gender}, Height ${profile.height}, Weight ${profile.weight}.
    Recent Health Data (Last 5+ hours):
    Average Heart Rate: ${readings.avgHeartRate} bpm
    Average SpO2: ${readings.avgSpo2}%
    Total Steps: ${readings.totalSteps}
    Sleep: ${readings.totalSleep} hours
    
    Analyze this data for future disease risks, health alerts, and recommendations. Provide output in JSON format.
    `;

    // Mock Response
    return {
        analysisText: "Based on the consistent heart rate and activity levels, cardiovascular health appears stable.",
        riskLevel: "Low",
        recommendations: ["Increase daily steps", "Maintain hydration"]
    };
}

const saveHealthReading = async (req, res) => {
    try {
        const { heartRate, spo2, steps, sleepHours, caloriesBurned, exerciseMinutes, womenHealth } = req.body;
        const userId = req.user ? req.user.id : req.body.userId;

        if (!userId) return res.status(401).json({ message: 'User not authenticated' });

        const reading = new HealthReading({
            userId,
            heartRate,
            spo2,
            steps,
            sleepHours,
            caloriesBurned,
            exerciseMinutes,
            womenHealth,
            recordedAt: new Date()
        });

        await reading.save();
        res.status(201).json({ message: 'Reading saved', reading });
    } catch (error) {
        console.error('Error saving reading:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getHealthStats = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : req.params.userId;
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const readings = await HealthReading.find({
            userId,
            recordedAt: { $gte: startOfDay }
        }).sort({ recordedAt: -1 });

        const latest = readings.length > 0 ? readings[0] : null;

        res.json({
            latest,
            count: readings.length,
            history: readings.slice(0, 20)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const analyzeHealth = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : req.body.userId;
        const readings = await HealthReading.find({ userId }).sort({ recordedAt: 1 });

        if (readings.length === 0) return res.status(400).json({ message: 'No health data available.' });

        const firstReading = readings[0];
        const lastReading = readings[readings.length - 1];
        const hoursDiff = (new Date(lastReading.recordedAt) - new Date(firstReading.recordedAt)) / (1000 * 60 * 60);

        if (hoursDiff < 5) {
            return res.status(200).json({
                canAnalyze: false,
                message: `Need at least 5 hours of data. Currently have ${(hoursDiff).toFixed(1)} hours.`
            });
        }

        const avgHeartRate = readings.reduce((sum, r) => sum + (r.heartRate || 0), 0) / readings.length;
        const avgSpo2 = readings.reduce((sum, r) => sum + (r.spo2 || 0), 0) / readings.length;
        const profile = await User.findById(userId);

        const aiData = {
            avgHeartRate: Math.round(avgHeartRate),
            avgSpo2: Math.round(avgSpo2),
            totalSteps: 5432,
            totalSleep: 7
        };

        const analysisResult = await callOpenRouterAI(profile || {}, aiData);

        const analysis = new HealthAnalysis({
            userId,
            analysisText: analysisResult.analysisText,
            riskLevel: analysisResult.riskLevel,
            recommendations: analysisResult.recommendations,
            sourceDataStart: firstReading.recordedAt,
            sourceDataEnd: lastReading.recordedAt
        });

        await analysis.save();

        res.json({ canAnalyze: true, analysis });

    } catch (error) {
        res.status(500).json({ message: 'Analysis failed' });
    }
};

module.exports = { saveHealthReading, getHealthStats, analyzeHealth };
