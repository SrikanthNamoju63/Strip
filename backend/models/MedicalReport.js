const mongoose = require('mongoose');

const medicalReportSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    reportType: {
        type: String,
        enum: ['BLOOD_TEST', 'X_RAY', 'ECG', 'ULTRASOUND', 'MRI', 'CT_SCAN', 'OTHER'],
        default: 'OTHER'
    },
    testName: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
        index: true
    },
    filePath: {
        type: String,
        required: true
    },
    notes: String,
    uploadedBy: {
        type: String,
        enum: ['USER', 'DOCTOR', 'ADMIN'],
        default: 'USER'
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor'
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

module.exports = mongoose.model('MedicalReport', medicalReportSchema);
