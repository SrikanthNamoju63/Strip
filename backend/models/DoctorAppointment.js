const mongoose = require('mongoose');

// Connect specifically to HealthPredict_DoctorDashboard
const doctorDbConnection = mongoose.createConnection('mongodb://localhost:27017/HealthPredict_DoctorDashboard');

const doctorAppointmentSchema = new mongoose.Schema({
    doctor_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    patient_name: { type: String, required: true },
    appointment_date: { type: Date, required: true },
    appointment_time: { type: String, required: true }, // "10:00"
    token_number: { type: Number },
    status: { type: String, default: 'Scheduled' }, // Scheduled, Completed, etc.
    appointment_type: { type: String, default: 'consultation' },
    payment_status: { type: String, default: 'UNPAID' },
    checked_in_at: { type: Date }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'doctor_appointments'
});

module.exports = doctorDbConnection.model('DoctorAppointment', doctorAppointmentSchema);
