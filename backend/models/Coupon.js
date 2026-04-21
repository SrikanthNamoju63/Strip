const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: { 
        type: String, 
        required: true, 
        unique: true, 
        uppercase: true, 
        trim: true,
        index: true
    },
    discountType: { 
        type: String, 
        enum: ['PERCENTAGE', 'FLAT'], 
        required: true 
    },
    discountValue: { 
        type: Number, 
        required: true,
        min: 0
    },
    maxDiscount: { 
        type: Number, 
        default: 0 // 0 means no limit
    },
    expiryDate: { 
        type: Date, 
        required: true 
    },
    usageLimit: { 
        type: Number, 
        default: null // null means unlimited uses across all users
    },
    usedCount: { 
        type: Number, 
        default: 0 
    },
    userSpecific: { 
        type: Boolean, 
        default: false 
    },
    isWelcomeCoupon: { 
        type: Boolean, 
        default: false 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
