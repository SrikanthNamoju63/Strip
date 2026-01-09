const mongoose = require('mongoose');

const medicalHistorySchema = new mongoose.Schema({
    history_id: { type: Number, unique: true }, // Auto-inc logic needed if preserving SQL ID style
    user_id: { type: Number, ref: 'User', required: true, index: true },
    condition_type: { type: String, enum: ['chronic', 'acute', 'allergy', 'surgery', 'other'], default: 'other' },
    condition_name: { type: String, required: true },
    icd_code: { type: String },
    severity: { type: String, enum: ['mild', 'moderate', 'severe', 'critical'] },
    diagnosis_date: { type: Date },
    recovery_date: { type: Date },
    is_active: { type: Boolean, default: true },
    notes: { type: String },
    recorded_at: { type: Date, default: Date.now }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false }
});

module.exports = mongoose.model('MedicalHistory', medicalHistorySchema);
