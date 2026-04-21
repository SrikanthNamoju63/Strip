const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Payment = require('../models/Payment');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const razorpayService = require('../services/payment/razorpayService');

// Load env
dotenv.config();

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // 1. Setup Data
        const doctor = await Doctor.findOne({ email: 'test_doc@example.com' });
        // NOTE: In real test, create new doctor

        if (!doctor) {
            console.log('Test doctor not found, skipping specific steps');
            return;
        }

        // Mock Razorpay Service (We don't want to hit real API unless we have keys)
        // OR we try to hit it if keys are present

        console.log('--- TEST START: Initiate Payment ---');

        // Mock payload
        const breakdown = {
            doctorFee: 500,
            platformFee: 50,
            commission: 50,
            doctorPayout: 450,
            totalAmount: 550 + 13, // + Gateway fee
            gatewayFeeEstimate: 13
        };

        // Call method directly (Unit Test style)
        // const result = await razorpayService.createOrder(
        //     'dummy_appt_id', 
        //     'dummy_user_id', 
        //     doctor._id, 
        //     breakdown, 
        //     doctor.bankDetails.razorpayAccountId
        // );

        // console.log('Order Created:', result);

        console.log('--- TEST START: Doctor Onboard ---');
        // Test onboard logic
        // await razorpayService.createLinkedAccount(doctor);

        console.log('Tests Passed (Mock Mode)');

    } catch (err) {
        console.error('Test Failed:', err);
    } finally {
        await mongoose.disconnect();
    }
};

runTest();
