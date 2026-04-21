const mongoose = require('mongoose');

const revenueLedgerSchema = new mongoose.Schema({
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true, index: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true, unique: true },

    // Money In
    grossAmount: { type: Number, required: true }, // Total Paid by User

    // Money Out / Costs
    gatewayFee: { type: Number, required: true }, // Actual Razorpay Fee
    taxOnGatewayFee: { type: Number, required: true }, // GST on Fee

    // Splits
    platformRevenue: { type: Number, required: true }, // (Platform Fee + Commission) - (Costs if Platform bears them)
    doctorPayout: { type: Number, required: true }, // Actual Transfer Amount

    // Net
    netProfit: { type: Number, required: true }, // Final Platform Profit

    currency: { type: String, default: 'INR' },

    status: { type: String, enum: ['FINAL', 'ADJUSTED', 'REFUNDED'], default: 'FINAL' },

    transactionDate: { type: Date, default: Date.now }
}, { timestamps: true });

// Analysis Indexes
revenueLedgerSchema.index({ transactionDate: 1 });
revenueLedgerSchema.index({ netProfit: -1 });

module.exports = mongoose.model('RevenueLedger', revenueLedgerSchema);
