const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true, index: true }, // e.g. 'PLATFORM_FEE_FIXED', 'REFUND_WINDOW_HOURS'
    value: { type: mongoose.Schema.Types.Mixed, required: true }, // Can be number, string, boolean, object
    description: { type: String },
    group: { type: String, enum: ['FINANCE', 'APPOINTMENT', 'SYSTEM', 'NOTIFICATION'], default: 'SYSTEM' },
    isPublic: { type: Boolean, default: false }, // If true, can be sent to public APIs
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
