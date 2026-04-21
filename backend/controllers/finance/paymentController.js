const Payment = require('../../models/Payment');
const Appointment = require('../../models/Appointment');
const Doctor = require('../../models/Doctor');
const User = require('../../models/User');
const Settlement = require('../../models/Settlement'); // Optional if replaced by Ledger
const razorpayService = require('../../services/payment/razorpayService'); // <--- Added

// @desc    Initiate payment for appointment
// @route   POST /api/payments/initiate
// @access  Private (Patient)
// @desc    Initiate payment for appointment
// @route   POST /api/payments/initiate
// @access  Private (Patient)
exports.initiatePayment = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const userId = req.user.id;

        // 1. Verify Appointment
        const appointment = await Appointment.findById(appointmentId).populate('doctorId');
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
        if (appointment.userId.toString() !== userId.toString()) return res.status(403).json({ message: 'Not authorized' });
        if (appointment.paymentStatus === 'COMPLETED') return res.status(400).json({ message: 'Already paid' });

        const doctor = appointment.doctorId;

        // 2.1 Critical: Doctor Activation Gate
        // Payment must NOT proceed if doctor KYC not active
        if (doctor.bankDetails?.kycStatus !== 'ACTIVE' && process.env.NODE_ENV === 'production') {
            return res.status(403).json({
                message: 'Doctor is not currently eligible to receive payments. KYC is pending.',
                details: { kycStatus: doctor.bankDetails?.kycStatus }
            });
        }

        // 2. Fetch Fee Configuration from System Settings
        const SystemSetting = require('../../models/SystemSetting');
        const settings = await SystemSetting.find({
            key: { $in: ['PLATFORM_FEE_FIXED', 'PLATFORM_FEE_PERCENTAGE'] }
        });

        const configMap = {};
        settings.forEach(s => configMap[s.key] = s.value);

        // Defaults if not set
        const platformFeeFixed = Number(configMap['PLATFORM_FEE_FIXED']) || 50;
        const commissionType = 'PERCENT'; // Enforcing percent based on System Settings UI
        const commissionValue = Number(configMap['PLATFORM_FEE_PERCENTAGE']) || 10;

        // 3. Calculate Financials
        const doctorFee = doctor.consultationFee;

        // Commission Logic: "Doctor pays commission"
        // So Doctor Payout = Doctor Fee - Commission
        let commissionAmount = 0;
        if (commissionType === 'PERCENT') {
            commissionAmount = Math.ceil((doctorFee * commissionValue) / 100);
        } else {
            commissionAmount = commissionValue;
        }

        const doctorPayout = doctorFee - commissionAmount;

        // Platform Total Revenue = Platform Fee + Commission
        // But for calculation of "What user pays":
        // User Pays = Doctor Fee + Platform Fee + Gateway Fee

        const subTotal = doctorFee + platformFeeFixed;

        // Estimate Gateway Fee (approx 2.36% for standard razorpay)
        // This is an estimate for display, actual is charged by razorpay on capture
        const estimatedGatewayFee = Math.ceil(subTotal * 0.0236);

        const totalPayable = subTotal + estimatedGatewayFee;

        // 3.1 Critical: Lock Slot
        // Prevent double booking by locking the slot for 10 minutes
        appointment.status = 'LOCKED';
        appointment.paymentExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
        await appointment.save();

        // 4. Create Razorpay Order with Split
        // We need the doctor's linked account ID
        if (!doctor.bankDetails?.razorpayAccountId) {
            // Fallback: If doctor not onboarded, we take everything and settle manually
            console.warn(`Doctor ${doctor._id} has no linked Razorpay account. Payment will be held in Platform.`);
        }

        const breakdown = {
            doctorFee,
            platformFee: platformFeeFixed,
            commission: commissionAmount,
            doctorPayout,
            gatewayFeeEstimate: estimatedGatewayFee,
            totalAmount: totalPayable
        };

        const result = await razorpayService.createOrder(
            appointmentId,
            userId,
            doctor._id,
            breakdown,
            doctor.bankDetails?.razorpayAccountId // Can be undefined
        );

        res.json({
            success: true,
            data: {
                ...result, // paymentId, orderId, amount, currency, keyId
                breakdown // Send breakdown to frontend for transparency
            }
        });

    } catch (error) {
        console.error('Payment initiation error:', error);
        res.status(500).json({ message: error.message || 'Error initiating payment' });
    }
};

// @desc    Verify and capture payment
// @route   POST /api/payments/verify
// @access  Private
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

        // 1. Verify Signature
        razorpayService.verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

        // 2. Fetch Payment Details from Razorpay (to get actual fees)
        const paymentEntity = await razorpayService.razorpay.payments.fetch(razorpayPaymentId);

        // 2.1 Critical: Fraud / Mismatch Protection
        // Verify that the amount paid on Razorpay matches what we have in DB
        const paymentRecord = await Payment.findOne({ razorpayOrderId });
        if (!paymentRecord) return res.status(404).json({ message: 'Payment record not found' });

        const expectedAmountPaise = Math.round(paymentRecord.totalAmount * 100);
        if (paymentEntity.amount !== expectedAmountPaise) {
            console.error(`CRITICAL FRAUD ALERT: Amount mismatch. Expected ${expectedAmountPaise}, Received ${paymentEntity.amount}`);

            // Block appointment and alert (Audit Log)
            const AuditLog = require('../../models/AuditLog');
            await AuditLog.create({
                module: 'PAYMENT',
                action: 'FRAUD_MISMATCH',
                targetId: paymentRecord._id,
                metadata: { expected: expectedAmountPaise, received: paymentEntity.amount, razorpayPaymentId }
            });

            paymentRecord.paymentStatus = 'FAILED';
            paymentRecord.notes = 'System flagged: Amount mismatch. Possible tampering.';
            await paymentRecord.save();

            // Unlock appointment or mark as failed
            const appointment = await Appointment.findById(paymentRecord.appointmentId);
            if (appointment) {
                appointment.status = 'PAYMENT_FAILED';
                await appointment.save();
            }

            return res.status(400).json({ message: 'Payment verification failed: Amount mismatch' });
        }

        // 3. Process via Service (Shared logic with Webhook)
        // This ensures Revenue Ledger and Status are updated consistently
        await razorpayService.handlePaymentCaptured(paymentEntity, `api_verify_${Date.now()}`);

        res.json({
            success: true,
            message: 'Payment verified and captured',
            data: {
                paymentId: razorpayPaymentId,
                status: 'CAPTURED'
            }
        });

    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ message: error.message || 'Error verifying payment' });
    }
};

// @desc    Onboard Doctor to Razorpay (Linked Account)
// @route   POST /api/payments/doctor/onboard
// @access  Private (Doctor/Admin)
exports.onboardDoctor = async (req, res) => {
    try {
        const doctorId = req.user.role === 'DOCTOR' ? req.user.id : req.body.doctorId;

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        // User must check if bank details exist
        if (!doctor.bankDetails?.accountNumber || !doctor.bankDetails?.ifscCode) {
            return res.status(400).json({ message: 'Bank details required before onboarding' });
        }

        // if (doctor.bankDetails.razorpayAccountId) {
        //     return res.status(400).json({ message: 'Doctor already onboarded', accountId: doctor.bankDetails.razorpayAccountId });
        // }

        // Create Account
        const accountId = await razorpayService.createLinkedAccount(doctor);

        // Update Doctor
        doctor.bankDetails.razorpayAccountId = accountId;
        doctor.bankDetails.accountActivationStatus = 'PENDING'; // Route accounts might need activation/KYC
        doctor.bankDetails.kycStatus = 'PENDING';

        await doctor.save();

        res.json({
            success: true,
            message: 'Doctor onboarded to Razorpay',
            data: {
                razorpayAccountId: accountId
            }
        });

    } catch (error) {
        console.error('Doctor onboarding error:', error);
        res.status(500).json({ message: error.message || 'Error onboarding doctor' });
    }
};

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private
exports.getPaymentHistory = async (req, res) => {
    try {
        const { role } = req.user;
        const { page = 1, limit = 10, status, sortBy = 'recent' } = req.query;
        const skip = (page - 1) * limit;

        let query = {};
        let sortOption = { createdAt: -1 };

        if (role === 'PATIENT') {
            query.userId = req.user.id;
        } else if (role === 'DOCTOR') {
            query.doctorId = req.user.id;
        } else if (role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (status) query.paymentStatus = status;
        if (sortBy === 'amount') sortOption = { totalAmount: -1 };
        if (sortBy === 'oldest') sortOption = { createdAt: 1 };

        const payments = await Payment.find(query)
            .populate('appointmentId', 'appointmentDate appointmentTime')
            .populate('userId', 'firstName lastName email')
            .populate('doctorId', 'name specialization')
            .sort(sortOption)
            .limit(parseInt(limit))
            .skip(skip)
            .exec();

        const totalCount = await Payment.countDocuments(query);

        // Summary stats
        const stats = await Payment.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$paymentStatus',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                payments: payments.map(p => ({
                    id: p._id,
                    appointmentDate: p.appointmentId?.appointmentDate,
                    appointmentTime: p.appointmentId?.appointmentTime,
                    doctor: role === 'PATIENT' ? {
                        name: p.doctorId?.name,
                        specialization: p.doctorId?.specialization
                    } : null,
                    patient: role === 'DOCTOR' ? {
                        name: p.userId?.firstName + ' ' + p.userId?.lastName,
                        email: p.userId?.email
                    } : null,
                    amount: p.totalAmount,
                    doctorReceives: p.doctorAmount,
                    adminCommission: p.platformCommission,
                    status: p.paymentStatus,
                    transactionId: p.transactionId,
                    date: p.paidAt || p.createdAt
                })),
                stats,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalCount / limit),
                    totalPayments: totalCount
                }
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message || 'Error fetching payment history' });
    }
};

// @desc    Get payment receipt
// @route   GET /api/payments/:paymentId/receipt
// @access  Private
exports.getPaymentReceipt = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const userId = req.user.id;

        const payment = await Payment.findById(paymentId)
            .populate('appointmentId')
            .populate('userId')
            .populate('doctorId');

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        // Verify ownership
        if (payment.userId._id.toString() !== userId.toString() && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Generate receipt (can be PDF in production)
        const receipt = {
            receiptNumber: `RCP_${payment.transactionId}`,
            date: payment.paidAt || payment.createdAt,
            patient: {
                name: payment.userId.firstName + ' ' + payment.userId.lastName,
                email: payment.userId.email,
                phone: payment.userId.phone
            },
            doctor: {
                name: payment.doctorId.name,
                specialization: payment.doctorId.specialization,
                email: payment.doctorId.email
            },
            appointment: {
                date: payment.appointmentId.appointmentDate,
                time: payment.appointmentId.appointmentTime,
                type: payment.appointmentId.consultationType
            },
            charges: {
                consultationFee: payment.consultationFee,
                adminCommission: payment.platformCommission,
                netToDedicated: payment.doctorAmount
            },
            totalAmount: payment.totalAmount,
            paymentMethod: payment.paymentMethod,
            transactionId: payment.transactionId,
            status: payment.paymentStatus
        };

        res.json({
            success: true,
            data: receipt
        });

    } catch (error) {
        res.status(500).json({ message: error.message || 'Error fetching receipt' });
    }
};

// @desc    Refund payment
// @route   POST /api/payments/:paymentId/refund
// @access  Private (Admin/Doctor)
exports.refundPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { reason, refundAmount, idempotencyKey } = req.body;

        // Fix: Add idempotency check to prevent duplicate refunds
        if (idempotencyKey) {
            const existingRefund = await Payment.findOne({
                _id: paymentId,
                'refund.idempotencyKey': idempotencyKey
            });
            if (existingRefund) {
                return res.status(409).json({ message: 'Refund already processed for this request' });
            }
        }

        const payment = await Payment.findById(paymentId);

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        if (payment.paymentStatus === 'REFUNDED') {
            return res.status(400).json({ message: 'Payment already refunded' });
        }

        if (payment.paymentStatus !== 'CAPTURED') {
            return res.status(400).json({ message: 'Can only refund captured payments' });
        }

        // TODO: Process refund with payment gateway
        // For Stripe: refund intent
        // For Razorpay: create refund

        const refundAmt = refundAmount || payment.totalAmount;

        // Fix: Validate appointment exists before updating
        const appointment = await Appointment.findById(payment.appointmentId);
        if (!appointment) {
            console.error(`CRITICAL: Appointment ${payment.appointmentId} not found for refund`);
            return res.status(500).json({ message: 'Appointment record deleted or corrupted' });
        }

        // Fix: Validate doctor exists before updating
        const doctor = await Doctor.findById(payment.doctorId);
        if (!doctor) {
            console.error(`CRITICAL: Doctor ${payment.doctorId} not found for refund`);
            return res.status(500).json({ message: 'Doctor record deleted or corrupted' });
        }

        payment.paymentStatus = 'REFUNDED';
        payment.refundReason = reason;
        payment.refundAmount = refundAmt;
        payment.refundedAt = new Date();
        if (idempotencyKey) {
            payment.refund = { idempotencyKey, processedAt: new Date() };
        }

        await payment.save();

        // Update appointment
        const updateResult = await Appointment.findByIdAndUpdate(
            payment.appointmentId,
            { paymentStatus: 'REFUNDED' },
            { new: true }
        );

        if (!updateResult) {
            throw new Error('Failed to update appointment during refund');
        }

        // Update doctor earnings
        const deduction = (refundAmt * 0.90); // Doctor loses their share
        const doctorUpdateResult = await Doctor.findByIdAndUpdate(
            payment.doctorId,
            {
                $inc: {
                    'earnings.pendingSettlement': -deduction
                }
            },
            { new: true }
        );

        if (!doctorUpdateResult) {
            throw new Error('Failed to update doctor earnings during refund');
        }

        res.json({
            success: true,
            message: 'Refund processed successfully',
            data: {
                paymentId: payment._id,
                refundAmount: refundAmt,
                status: payment.paymentStatus
            }
        });

    } catch (error) {
        console.error('Refund error:', error);
        res.status(500).json({ message: error.message || 'Error processing refund' });
    }
};

// @desc    Get payment analytics (Admin)
// @route   GET /api/payments/analytics/dashboard
// @access  Private (Admin)
exports.getPaymentAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        // Revenue summary
        const revenueSummary = await Payment.aggregate([
            {
                $match: {
                    paidAt: { $gte: start, $lte: end },
                    paymentStatus: 'CAPTURED'
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalAmount' },
                    adminEarnings: { $sum: '$platformCommission' },
                    doctorPayouts: { $sum: '$doctorAmount' },
                    transactionCount: { $sum: 1 }
                }
            }
        ]);

        // Daily revenue
        const dailyRevenue = await Payment.aggregate([
            {
                $match: {
                    paidAt: { $gte: start, $lte: end },
                    paymentStatus: 'CAPTURED'
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$paidAt' }
                    },
                    revenue: { $sum: '$totalAmount' },
                    commission: { $sum: '$platformCommission' },
                    transactions: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Payment method breakdown
        const paymentMethods = await Payment.aggregate([
            {
                $match: {
                    paidAt: { $gte: start, $lte: end },
                    paymentStatus: 'CAPTURED'
                }
            },
            {
                $group: {
                    _id: '$paymentMethod',
                    count: { $sum: 1 },
                    amount: { $sum: '$totalAmount' }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                period: { startDate: start, endDate: end },
                summary: revenueSummary[0] || { totalRevenue: 0, adminEarnings: 0, doctorPayouts: 0, transactionCount: 0 },
                dailyRevenue,
                paymentMethods
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message || 'Error fetching analytics' });
    }
};

// @desc    Get refunded payments (Admin)
// @route   GET /api/payments/refunds
// @access  Private (Admin)
exports.getRefunds = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const query = { paymentStatus: 'REFUNDED' };

        const refunds = await Payment.find(query)
            .populate('userId', 'firstName lastName email')
            .populate('doctorId', 'name specialization')
            .populate('appointmentId', 'appointmentDate appointmentTime')
            .sort({ refundedAt: -1 })
            .limit(parseInt(limit))
            .skip(skip)
            .exec();

        const totalCount = await Payment.countDocuments(query);

        res.json({
            success: true,
            data: {
                refunds: refunds.map(r => ({
                    id: r._id,
                    appointmentId: r.appointmentId?._id,
                    transactionId: r.transactionId,
                    refundAmount: r.refundAmount,
                    refundReason: r.refundReason,
                    refundedAt: r.refundedAt,
                    user: r.userId,
                    doctor: r.doctorId
                })),
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalCount / limit),
                    totalRefunds: totalCount
                }
            }
        });
    } catch (error) {
        console.error('Error fetching refunds:', error);
        res.status(500).json({ message: error.message || 'Error fetching refunds' });
    }
};

// @desc    Handle Razorpay Webhooks
// @route   POST /api/payments/webhook
// @access  Public (Razorpay Signature Verified)
exports.handleWebhook = async (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        // Use raw body if available, or JSON.stringify if body-parser is used
        // IMPORTANT: Verify that req.body matches the raw signature content. 
        // In production, use 'express.raw({type: "application/json"})' middleware for this route specifically
        const rawBody = JSON.stringify(req.body);

        await razorpayService.handleWebhookEvent(rawBody, signature);

        res.json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ message: 'Webhook failed' });
    }
};
