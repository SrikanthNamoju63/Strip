const mongoose = require('mongoose');

// Use the same connection as Doctor model (HealthPredict_DoctorDashboard)
// We need to access the connection from Doctor model or create new one.
// Creating new one is safer to rely on independent file execution.
const doctorDbConnection = mongoose.createConnection('mongodb://localhost:27017/HealthPredict_DoctorDashboard');

const availabilitySchema = new mongoose.Schema({
    doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    day_of_week: { type: String, required: true }, // Monday, Tuesday...
    start_time: { type: String, required: true }, // "09:00"
    end_time: { type: String, required: true },   // "17:00"
    slot_duration_mins: { type: Number, default: 30 },
    is_active: { type: Boolean, default: true } // Assuming schema might have this or implies existence = active
}, {
    timestamps: true,
    collection: 'weekly_availability'
});

module.exports = doctorDbConnection.model('WeeklyAvailability', availabilitySchema);
