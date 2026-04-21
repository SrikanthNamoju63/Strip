const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },

    // Amount breakdown
    consultationFee: { type: Number, required: true }, // Base fee
    platformCommission: { type: Number, required: true }, // Admin commission (e.g., 10%)
    convenienceFee: { type: Number, default: 0 },
    doctorAmount: { type: Number, required: true }, // Amount doctor receives
    totalAmount: { type: Number, required: true }, // Total paid by patient

    // Payment details
    paymentMethod: { type: String, enum: ['UPI', 'CARD', 'CASH', 'WALLET', 'NETBANKING'], required: true },
    transactionId: { type: String, unique: true, sparse: true }, // Internal Transaction ID

    // Razorpay Identifiers
    razorpayOrderId: { type: String, required: true, index: true },
    razorpayPaymentId: { type: String, index: true },
    razorpaySignature: { type: String },

    // Webhook Idempotency
    webhookEventId: { type: String, unique: true, sparse: true },

    paymentStatus: { type: String, enum: ['PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED'], default: 'PENDING', index: true },
    paidAt: { type: Date },

    // Financial Breakdown (Production Grade)
    doctorFee: { type: Number, required: true },
    platformFee: { type: Number, required: true }, // Flat fee from user
    commission: { type: Number, required: true },  // Commission from doctor
    doctorPayout: { type: Number, required: true }, // Amount to transfer
    gatewayFeeEstimate: { type: Number },
    actualGatewayFee: { type: Number },
    actualGatewayTax: { type: Number },

    // Split / Settlement tracking
    transferId: { type: String },
    transferStatus: { type: String, enum: ['PENDING', 'PROCESSED', 'FAILED', 'REVERSED'], default: 'PENDING', index: true },
    settlementStatus: { type: String, enum: ['PENDING', 'SETTLED'], default: 'PENDING' },
    settlementDate: { type: Date },
    razorpaySettlementId: { type: String }, // From Settlement Webhook
    settlementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Settlement' },

    // Payment gateway details
    paymentGateway: { type: String, enum: ['STRIPE', 'RAZORPAY', 'PAYPAL'], default: 'RAZORPAY' },
    paymentReceiptUrl: { type: String },

    // Metadata
    notes: { type: String },

    // Refund Logic
    refundReason: { type: String },
    refundAmount: { type: Number },
    refundType: { type: String, enum: ['FULL', 'PARTIAL'] },
    refundSource: { type: String, enum: ['USER', 'DOCTOR', 'PLATFORM', 'SHARED'] },
    refundedAt: { type: Date },

    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now }
});

// Index for settlement processing
paymentSchema.index({ paymentStatus: 1, transferStatus: 1 });
paymentSchema.index({ doctorId: 1, transferStatus: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
