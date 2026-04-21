const mongoose = require('mongoose');

const medicineReminderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    medicineName: { type: String, required: true },
    dosage: { type: String },
    times: [{ type: String }],
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    notes: { type: String },
    active: { type: Boolean, default: true }
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.model('MedicineReminder', medicineReminderSchema);
