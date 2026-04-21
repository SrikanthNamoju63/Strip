const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Settlement = require('../models/Settlement');
const Doctor = require('../models/Doctor');
require('dotenv').config();

const verifyFinance = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/strip_db', { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('MongoDB Connected');

        // 1. Create a dummy doctor if not exists
        let doctor = await Doctor.findOne({ email: 'financedoc@test.com' });
        if (!doctor) {
            doctor = await Doctor.create({
                name: 'Finance Test Doc',
                email: 'financedoc@test.com',
                passwordHash: 'dummy',
                specialization: 'General',
                experience: 5,
                phone: '9999999999',
                clinicAddress: 'Test Clinic',
                consultationFee: 500,
                isVerified: true
            });
            console.log('Created Test Doctor');
        }

        // 2. Create a mock payment (Captured)
        const payment = await Payment.create({
            appointmentId: new mongoose.Types.ObjectId(), // Fake appointment
            userId: new mongoose.Types.ObjectId(), // Fake user
            doctorId: doctor._id,
            totalAmount: 500,
            consultationFee: 500,
            platformCommission: 50,
            doctorAmount: 450,
            paymentStatus: 'CAPTURED',
            paymentMethod: 'UPI',
            transactionId: 'txn_' + Date.now(),
            razorpayPaymentId: 'pay_' + Date.now(),
            razorpayOrderId: 'order_' + Date.now()
        });
        console.log('Created Mock Payment:', payment._id);

        // 3. Test Refund Flow (Create another payment and refund it)
        const refundPayment = await Payment.create({
            appointmentId: new mongoose.Types.ObjectId(),
            userId: new mongoose.Types.ObjectId(),
            doctorId: doctor._id,
            totalAmount: 1000,
            consultationFee: 1000,
            platformCommission: 100,
            doctorAmount: 900,
            paymentStatus: 'CAPTURED',
            paymentMethod: 'CARD',
            transactionId: 'txn_ref_' + Date.now(),
            razorpayPaymentId: 'pay_ref_' + Date.now(),
            razorpayOrderId: 'order_ref_' + Date.now(),
            refundStatus: 'PENDING',
            refundAmount: 1000,
            refundReason: 'Test Refund'
        });
        console.log('Created Payment for Refund:', refundPayment._id);

        // Note: Real refund logic usually calls Razorpay. We are testing DB status mainly.
        // We can simulate "Approve Refund" by updating status manually or calling controller function if we imported it.
        // For this script, we just verify we can query it.

        const pendingRefunds = await Payment.find({ refundStatus: 'PENDING' });
        console.log(`Found ${pendingRefunds.length} pending refunds.`);

        // 4. Test Settlement Generation
        // This usually runs via cron or admin button
        // Logic: Find all CAPTURED payments for a doctor that are NOT SETTLED

        const unsettlePayments = await Payment.find({
            doctorId: doctor._id,
            paymentStatus: 'CAPTURED',
            isSettled: false,
            refundStatus: 'NONE' // Don't settle refunded ones
        });

        console.log(`Found ${unsettlePayments.length} payments eligible for settlement for Test Doctor.`);

        if (unsettlePayments.length > 0) {
            const totalAmt = unsettlePayments.reduce((acc, p) => acc + p.totalAmount, 0);
            const netAmt = unsettlePayments.reduce((acc, p) => acc + p.doctorAmount, 0);
            const comm = unsettlePayments.reduce((acc, p) => acc + p.platformCommission, 0);

            const settlement = await Settlement.create({
                doctorId: doctor._id,
                totalAmount: totalAmt,
                platformCommission: comm,
                netAmount: netAmt,
                status: 'PENDING',
                settlementPeriod: { startDate: new Date(), endDate: new Date() },
                paymentIds: unsettlePayments.map(p => p._id)
            });
            console.log('Generated Settlement:', settlement._id);

            // Mark payments as settled
            await Payment.updateMany(
                { _id: { $in: unsettlePayments.map(p => p._id) } },
                { $set: { isSettled: true, settlementId: settlement._id } }
            );
            console.log('Marked payments as settled.');
        }

        console.log('Finance Verification Complete.');
        process.exit(0);

    } catch (e) {
        console.error('Verification Failed:', e);
        process.exit(1);
    }
};

verifyFinance();
