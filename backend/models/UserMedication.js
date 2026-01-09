const mongoose = require('mongoose');

const userMedicationSchema = new mongoose.Schema({
    medication_id: { type: Number, unique: true },
    user_id: { type: Number, ref: 'User', required: true, index: true },
    medication_name: { type: String, required: true },
    generic_name: { type: String },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true }, // e.g. "Twice Daily"
    route: { type: String }, // e.g. "Oral"
    start_date: { type: Date, required: true },
    end_date: { type: Date },
    prescribed_by: { type: String }, // Doctor Name
    is_active: { type: Boolean, default: true },
    reminder_enabled: { type: Boolean, default: true }
}, {
    timestamps: false
});

module.exports = mongoose.model('UserMedication', userMedicationSchema);
