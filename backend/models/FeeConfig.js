const mongoose = require('mongoose');

const feeConfigSchema = new mongoose.Schema({
    platformFee: {
        type: Number,
        required: true,
        default: 0
    },
    commissionType: {
        type: String,
        enum: ['PERCENT', 'FIXED'],
        required: true,
        default: 'PERCENT'
    },
    commissionValue: {
        type: Number,
        required: true,
        default: 0
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
}, { timestamps: true });

// We only need one config document usually, but this is a standard model.
module.exports = mongoose.model('FeeConfig', feeConfigSchema);
