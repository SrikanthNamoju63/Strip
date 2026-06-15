const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    name: { type: String, required: true },
    staffId: { type: String, unique: true, sparse: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    phone: { type: String, required: true },
    passwordHash: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['RECEPTIONIST', 'NURSE'], 
        default: 'RECEPTIONIST' 
    },
    doctorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Doctor', 
        required: true, 
        index: true 
    },
    permissions: [{ 
        type: String, 
        default: ['MANAGE_APPOINTMENTS', 'MANAGE_QUEUE', 'VIEW_PATIENTS'] 
    }],
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Staff', staffSchema);
