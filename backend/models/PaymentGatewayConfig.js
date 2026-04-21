const mongoose = require('mongoose');

const paymentGatewayConfigSchema = new mongoose.Schema({
    gatewayName: { type: String, enum: ['RAZORPAY', 'STRIPE'], required: true, unique: true },
    keyId: { type: String, required: true },
    keySecret: { type: String, required: true }, // Encrypt this in production if possible, or use env vars preferred
    environment: { type: String, enum: ['TEST', 'LIVE'], default: 'TEST' },
    isActive: { type: Boolean, default: true },

    // Additional settings
    webhookSecret: { type: String },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

module.exports = mongoose.model('PaymentGatewayConfig', paymentGatewayConfigSchema);
