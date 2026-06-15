const request = require('supertest');
const crypto = require('crypto');
const app = require('../server');
const mongoose = require('mongoose');

// Models
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const RevenueLedger = require('../models/RevenueLedger');
const AuditLog = require('../models/AuditLog');

// Mock environmental variables
process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret';
process.env.RAZORPAY_KEY_SECRET = 'test_key_secret';
process.env.RAZORPAY_KEY_ID = 'test_key_id';

describe('Payment Gateway - Automated Tests', () => {
    let testUser, testDoctor, testAppointment, testPayment;

    beforeEach(async () => {
        // Setup base data
        testUser = await User.create({
            name: 'Test Patient',
            email: 'patient@test.com',
            passwordHash: 'hashed_password123',
            phone: '1234567890'
        });

        testDoctor = await Doctor.create({
            name: 'Dr. Test',
            email: 'doctor@test.com',
            passwordHash: 'hashed_password123',
            phone: '0987654321',
            speciality: 'General',
            experience: 5,
            consultationFee: 500,
            medicalCouncil: 'State Medical Council',
            registrationNumber: 'REG123456',
            personalPhone: '9876543210'
        });

        testAppointment = await Appointment.create({
            userId: testUser._id,
            doctorId: testDoctor._id,
            slotDate: '2026-05-25',
            slotTime: '10:00 AM',
            appointmentDate: new Date(),
            appointmentTime: '10:00 AM',
            consultationFee: 500,
            status: 'PENDING',
            paymentStatus: 'PENDING'
        });

        testPayment = await Payment.create({
            appointmentId: testAppointment._id,
            userId: testUser._id,
            doctorId: testDoctor._id,
            consultationFee: 500,
            platformCommission: 20,
            doctorAmount: 430,
            doctorFee: 500,
            platformFee: 50,
            commission: 20,
            doctorPayout: 430,
            totalAmount: 550,
            gatewayFeeEstimate: 10,
            razorpayOrderId: 'order_test123',
            paymentGateway: 'RAZORPAY',
            paymentMethod: 'CARD',
            paymentStatus: 'PENDING'
        });
    });

    const generateSignature = (payload, secret) => {
        return crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
    };

    describe('1. Security Test Cases', () => {
        it('should reject webhook with missing signature', async () => {
            const payload = { event: 'payment.captured' };
            const res = await request(app)
                .post('/api/payments/webhook')
                .send(payload);
            
            expect(res.statusCode).toBe(400); // Or 401/403 depending on implementation
        });

        it('should reject webhook with invalid signature', async () => {
            const payload = { event: 'payment.captured' };
            const signature = 'invalid_signature_hash';
            
            const res = await request(app)
                .post('/api/payments/webhook')
                .set('x-razorpay-signature', signature)
                .send(payload);
            
            expect(res.statusCode).toBe(400); // Invalid signature
        });
    });

    describe('2. Functional Test Cases', () => {
        it('should successfully process valid payment.captured webhook', async () => {
            const payload = {
                event: 'payment.captured',
                id: 'evt_test123',
                payload: {
                    payment: {
                        entity: {
                            id: 'pay_test123',
                            order_id: 'order_test123',
                            amount: 55000,
                            fee: 1000,
                            tax: 150,
                            method: 'card',
                            status: 'captured'
                        }
                    }
                }
            };
            const signature = generateSignature(payload, process.env.RAZORPAY_WEBHOOK_SECRET);

            const res = await request(app)
                .post('/api/payments/webhook')
                .set('x-razorpay-signature', signature)
                .send(payload);

            expect(res.statusCode).toBe(200);

            // Verify Database Updates
            const updatedPayment = await Payment.findById(testPayment._id);
            expect(updatedPayment.paymentStatus).toBe('CAPTURED');
            expect(updatedPayment.razorpayPaymentId).toBe('pay_test123');
            expect(updatedPayment.actualGatewayFee).toBe(10); // 1000 / 100
            
            const updatedAppointment = await Appointment.findById(testAppointment._id);
            expect(updatedAppointment.status).toBe('CONFIRMED');
            expect(updatedAppointment.paymentStatus).toBe('COMPLETED');
        });

        it('should not deduct amount multiple times for duplicate webhooks (Idempotency)', async () => {
            const payload = {
                event: 'payment.captured',
                id: 'evt_test123',
                payload: {
                    payment: {
                        entity: {
                            id: 'pay_test123',
                            order_id: 'order_test123',
                            amount: 55000,
                            status: 'captured'
                        }
                    }
                }
            };
            const signature = generateSignature(payload, process.env.RAZORPAY_WEBHOOK_SECRET);

            // First call
            await request(app).post('/api/payments/webhook').set('x-razorpay-signature', signature).send(payload);
            
            // Second call (Duplicate)
            const res2 = await request(app).post('/api/payments/webhook').set('x-razorpay-signature', signature).send(payload);
            
            expect(res2.statusCode).toBe(200); // Should return 200 OK so gateway stops retrying
            
            // Verify payment is captured, but not duplicated
            const payments = await Payment.find({ razorpayOrderId: 'order_test123' });
            expect(payments.length).toBe(1); // Still only 1 record
            expect(payments[0].paymentStatus).toBe('CAPTURED');
        });

        it('should create Revenue Ledger correctly on transfer.processed', async () => {
            // First mark as captured
            testPayment.paymentStatus = 'CAPTURED';
            testPayment.razorpayPaymentId = 'pay_test123';
            testPayment.actualGatewayFee = 10;
            await testPayment.save();

            const payload = {
                event: 'transfer.processed',
                id: 'evt_test_transfer',
                payload: {
                    transfer: {
                        entity: {
                            id: 'trf_test123',
                            source_payment_id: 'pay_test123',
                            amount: 43000
                        }
                    }
                }
            };
            const signature = generateSignature(payload, process.env.RAZORPAY_WEBHOOK_SECRET);

            const res = await request(app)
                .post('/api/payments/webhook')
                .set('x-razorpay-signature', signature)
                .send(payload);

            expect(res.statusCode).toBe(200);

            // Verify Ledger was created
            const ledger = await RevenueLedger.findOne({ paymentId: testPayment._id });
            expect(ledger).toBeTruthy();
            expect(ledger.grossAmount).toBe(550);
            expect(ledger.doctorPayout).toBe(430);
            expect(ledger.status).toBe('FINAL');
            
            // Verify payment transfer status updated
            const updatedPayment = await Payment.findById(testPayment._id);
            expect(updatedPayment.transferStatus).toBe('PROCESSED');
            expect(updatedPayment.settlementStatus).toBe('SETTLED');
        });
    });
});
