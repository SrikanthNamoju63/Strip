const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, unique: true, sparse: true }, // Optional for now, but good for recovery
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['SUPER_ADMIN', 'VERIFICATION_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'], default: 'SUPER_ADMIN' },
    permissions: [{ type: String }], // explicit permissions e.g. ['VIEW_DOCTORS', 'APPROVE_REFUNDS']
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    lastLogin: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
