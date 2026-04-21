const mongoose = require('mongoose');

const healthReadingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deviceType: { type: String, default: 'Smart Watch' },
    heartRate: Number,
    spo2: Number,
    steps: Number,
    sleepHours: Number,
    caloriesBurned: Number,
    exerciseMinutes: Number,
    womenHealth: {
        cycleLength: Number,
        lastPeriodDate: Date
    },
    recordedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HealthReading', healthReadingSchema);
