const Settlement = require('../../models/Settlement');
const Refund = require('../../models/Refund');
const Payment = require('../../models/Payment');
const AuditLog = require('../../models/AuditLog');
const Doctor = require('../../models/Doctor');

// --- Settlements ---

exports.getSettlements = async (req, res) => {
    try {
        const { status, doctorId } = req.query;
        let query = {};
        if (status) query.status = status;
        if (doctorId) query.doctorId = doctorId;

        const settlements = await Settlement.find(query)
            .populate('doctorId', 'name email personalPhone bankDetails')
            .sort({ createdAt: -1 });
        res.json(settlements);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.generateSettlement = async (req, res) => {
    // This is a manual trigger. Ideally often done via Cron.
    // logic: find all COMPLETED appointments/payments for a doctor that are NOT yet in a settlement.
    // simplified for now: just create a dummy one or aggregate.

    // For this prototype, let's assume we receive a list of paymentIds to settle for a doctor.
    const { doctorId, paymentIds, periodStart, periodEnd } = req.body;

    try {
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) return res.status(404).json({ msg: 'Doctor not found' });

        if (doctor.bankDetails?.verificationStatus !== 'VERIFIED') {
            return res.status(400).json({ msg: 'Payout blocked: Doctor bank details not verified' });
        }

        const payments = await Payment.find({ _id: { $in: paymentIds }, settlementStatus: 'PENDING' });

        if (payments.length === 0) return res.status(400).json({ msg: 'No pending payments found' });

        let totalAmount = 0;
        let platformCommission = 0;
        let netAmount = 0;

        payments.forEach(p => {
            totalAmount += p.totalAmount;
            platformCommission += p.platformCommission;
            netAmount += p.doctorAmount;
        });

        const settlement = new Settlement({
            doctorId,
            settlementPeriod: { startDate: periodStart, endDate: periodEnd },
            totalAmount,
            grossEarnings: totalAmount, // Simplifying
            platformCommission,
            netAmount,
            paymentIds,
            status: 'PENDING',
            appointmentCount: payments.length,
            createdBy: req.admin ? req.admin.id : null
        });

        await settlement.save();

        // Update payments
        await Payment.updateMany(
            { _id: { $in: paymentIds } },
            { $set: { settlementStatus: 'PROCESSED', settlementId: settlement._id } }
        );

        // Log
        if (req.admin) {
            await AuditLog.create({
                module: 'FINANCE',
                action: 'GENERATE_SETTLEMENT',
                performedBy: req.admin.id,
                targetId: settlement._id,
                targetModel: 'Settlement',
                metadata: `Generated for ${payments.length} payments`
            });
        }

        res.json(settlement);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.updateSettlementStatus = async (req, res) => {
    const { id } = req.params;
    const { status, transactionId } = req.body; // e.g., 'COMPLETED'

    try {
        const settlement = await Settlement.findById(id);
        if (!settlement) return res.status(404).json({ msg: 'Settlement not found' });

        const oldStatus = settlement.status;
        settlement.status = status;
        if (transactionId) settlement.transactionId = transactionId;
        if (status === 'COMPLETED') settlement.completedAt = Date.now();

        await settlement.save();

        if (status === 'COMPLETED') {
            await Payment.updateMany(
                { settlementId: settlement._id },
                { $set: { settlementStatus: 'SETTLED', settlementDate: Date.now() } }
            );
        }

        await AuditLog.create({
            module: 'FINANCE',
            action: 'UPDATE_SETTLEMENT',
            performedBy: req.admin.id,
            targetId: settlement._id,
            targetModel: 'Settlement',
            beforeValue: { status: oldStatus },
            afterValue: { status: status }
        });

        res.json(settlement);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// --- Refunds ---

exports.getRefunds = async (req, res) => {
    try {
        const refunds = await Refund.find()
            .populate('userId', 'name email')
            .populate('paymentId')
            .sort({ createdAt: -1 });
        res.json(refunds);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.approveRefund = async (req, res) => {
    const { id } = req.params;
    try {
        const refund = await Refund.findById(id);
        if (!refund) return res.status(404).json({ msg: 'Refund request not found' });

        if (refund.status !== 'PENDING') return res.status(400).json({ msg: 'Refund already processed' });

        refund.status = 'APPROVED';
        refund.approvedBy = req.admin.id;
        refund.processedAt = Date.now(); // In real system, this might initiate a gateway call

        await refund.save();

        // Update payment
        await Payment.findByIdAndUpdate(refund.paymentId, {
            paymentStatus: 'REFUNDED',
            refundAmount: refund.amount,
            refundedAt: Date.now()
        });

        await AuditLog.create({
            module: 'FINANCE',
            action: 'APPROVE_REFUND',
            performedBy: req.admin.id,
            targetId: refund._id,
            targetModel: 'Refund',
            metadata: `Refund approved: ${refund.amount}`
        });

        res.json({ msg: 'Refund Approved', refund });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.rejectRefund = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    try {
        const refund = await Refund.findById(id);
        if (!refund) return res.status(404).json({ msg: 'Refund request not found' });

        if (refund.status !== 'PENDING') return res.status(400).json({ msg: 'Refund already processed' });

        refund.status = 'REJECTED';
        refund.rejectionReason = reason;
        refund.approvedBy = req.admin.id;

        await refund.save();

        await AuditLog.create({
            module: 'FINANCE',
            action: 'REJECT_REFUND',
            performedBy: req.admin.id,
            targetId: refund._id,
            targetModel: 'Refund',
            metadata: `Reason: ${reason}`
        });


        res.json({ msg: 'Refund Rejected', refund });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// --- Doctor Specific ---

exports.getDoctorSettlements = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const settlements = await Settlement.find({ doctorId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        const total = await Settlement.countDocuments({ doctorId });

        // Get totals from Doctor model
        const doctor = await Doctor.findById(doctorId).select('earnings');

        res.json({
            success: true,
            data: {
                settlements,
                totals: doctor ? doctor.earnings : {},
                pagination: {
                    currentPage: page,
                    totalSettlements: total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

