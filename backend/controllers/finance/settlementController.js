const Settlement = require('../../models/Settlement');
const Payment = require('../../models/Payment');
const Doctor = require('../../models/Doctor');
const Appointment = require('../../models/Appointment');

// @desc    Process settlements for a specific period
// @route   POST /api/admin/settlements/process
// @access  Private (Admin)
exports.processSettlementsLogic = async (startDate, endDate, commissionPercentage = 10) => {
    if (!startDate || !endDate) {
        throw new Error('startDate and endDate are required');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get all captured payments in this period that haven't been settled
    const payments = await Payment.find({
        paymentStatus: 'CAPTURED',
        settlementStatus: 'PENDING',
        paidAt: { $gte: start, $lte: end }
    }).populate('doctorId');

    if (payments.length === 0) {
        return { message: 'No pending payments to settle', count: 0, settlements: [] };
    }

    // Group payments by doctor
    const doctorPayments = {};
    payments.forEach(payment => {
        const doctorId = payment.doctorId._id.toString();
        if (!doctorPayments[doctorId]) {
            doctorPayments[doctorId] = {
                doctor: payment.doctorId,
                payments: [],
                grossEarnings: 0,
                platformCommission: 0,
                deductions: 0
            };
        }
        doctorPayments[doctorId].payments.push(payment);
        doctorPayments[doctorId].grossEarnings += payment.consultationFee || 0;
        doctorPayments[doctorId].platformCommission += (payment.consultationFee || 0) * (commissionPercentage / 100);
        doctorPayments[doctorId].deductions += payment.refundAmount || 0;
    });

    const settlements = [];

    // Create settlement records
    for (const [doctorId, data] of Object.entries(doctorPayments)) {
        const netAmount = data.grossEarnings - data.platformCommission - data.deductions;

        const settlement = new Settlement({
            doctorId: data.doctor._id,
            settlementPeriod: { startDate: start, endDate: end },
            totalAmount: data.grossEarnings,
            grossEarnings: data.grossEarnings,
            platformCommission: data.platformCommission,
            deductions: data.deductions,
            netAmount,
            paymentIds: data.payments.map(p => p._id),
            appointmentCount: data.payments.length,
            bankDetails: data.doctor.bankDetails,
            status: 'PENDING'
        });

        await settlement.save();
        settlements.push(settlement);

        // Update all related payments with settlement reference
        await Payment.updateMany(
            { _id: { $in: data.payments.map(p => p._id) } },
            {
                settlementId: settlement._id,
                settlementStatus: 'PROCESSED'
            }
        );

        // Update doctor earnings summary
        await Doctor.findByIdAndUpdate(
            doctorId,
            {
                $inc: {
                    'earnings.totalEarnings': netAmount,
                    'earnings.appointmentCount': data.payments.length
                },
                'earnings.lastSettlementDate': new Date(),
                'earnings.pendingSettlement': 0
            }
        );
    }

    return {
        success: true,
        message: `${settlements.length} settlements created successfully`,
        data: settlements,
        count: settlements.length
    };
};

// @desc    Process settlements for a specific period
// @route   POST /api/admin/settlements/process
// @access  Private (Admin)
exports.processSettlements = async (req, res) => {
    try {
        const { startDate, endDate, commissionPercentage } = req.body;
        const result = await exports.processSettlementsLogic(startDate, endDate, commissionPercentage);
        res.json(result);
    } catch (error) {
        console.error('Settlement processing error:', error);
        res.status(500).json({ message: error.message || 'Error processing settlements' });
    }
};

// @desc    Get all settlements
// @route   GET /api/admin/settlements
// @access  Private (Admin)
exports.getSettlements = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, doctorId, sortBy = 'recent' } = req.query;

        const skip = (page - 1) * limit;
        const query = {};

        if (status) query.status = status;
        if (doctorId) query.doctorId = doctorId;

        let sortOption = { createdAt: -1 }; // Recent by default
        if (sortBy === 'amount') sortOption = { netAmount: -1 };
        if (sortBy === 'oldest') sortOption = { createdAt: 1 };

        const settlements = await Settlement.find(query)
            .populate('doctorId', 'name email specialization')
            .populate('approvedBy', 'name email')
            .sort(sortOption)
            .limit(parseInt(limit))
            .skip(skip)
            .exec();

        const totalCount = await Settlement.countDocuments(query);

        // Get summary stats
        const stats = await Settlement.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$netAmount' },
                    totalCommission: { $sum: '$platformCommission' }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                settlements,
                stats,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalCount / limit),
                    totalSettlements: totalCount
                }
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message || 'Error fetching settlements' });
    }
};

// @desc    Get doctor settlement history
// @route   GET /api/admin/settlements/doctor/:doctorId
// @access  Private (Admin/Doctor)
exports.getDoctorSettlements = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { page = 1, limit = 10, status } = req.query;

        const skip = (page - 1) * limit;
        const query = { doctorId };

        if (status) query.status = status;

        const settlements = await Settlement.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip)
            .exec();

        const totalCount = await Settlement.countDocuments(query);

        // Get doctor info
        const doctor = await Doctor.findById(doctorId).select('name email earnings');

        // Calculate totals from Settlements
        const settlementTotals = await Settlement.aggregate([
            { $match: { doctorId: require('mongoose').Types.ObjectId(doctorId) } },
            {
                $group: {
                    _id: null,
                    totalSettled: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, '$netAmount', 0] } },
                    pendingSettlement: { $sum: { $cond: [{ $in: ['$status', ['PENDING', 'INITIATED', 'PROCESSING']] }, '$netAmount', 0] } },
                    totalCommissionDeducted: { $sum: '$platformCommission' }
                }
            }
        ]);

        // Calculate pending payments (not yet in any settlement)
        const pendingPayments = await Payment.aggregate([
            {
                $match: {
                    doctorId: require('mongoose').Types.ObjectId(doctorId),
                    paymentStatus: 'CAPTURED',
                    settlementStatus: 'PENDING'
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$doctorAmount' },
                    totalCommission: { $sum: '$platformCommission' }
                }
            }
        ]);

        const sStats = settlementTotals[0] || { totalSettled: 0, pendingSettlement: 0, totalCommissionDeducted: 0 };
        const pStats = pendingPayments[0] || { totalAmount: 0, totalCommission: 0 };

        const finalStats = {
            totalSettled: sStats.totalSettled,
            pendingAmount: sStats.pendingSettlement + pStats.totalAmount,
            totalCommissionDeducted: sStats.totalCommissionDeducted + pStats.totalCommission
        };

        res.json({
            success: true,
            data: {
                doctor,
                settlements,
                totals: finalStats,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalCount / limit),
                    totalSettlements: totalCount
                }
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message || 'Error fetching doctor settlements' });
    }
};

// @desc    Initiate settlement payout
// @route   POST /api/admin/settlements/:settlementId/initiate
// @access  Private (Admin)
exports.initiateSettlementPayout = async (req, res) => {
    try {
        const { settlementId } = req.params;

        const settlement = await Settlement.findById(settlementId);

        if (!settlement) {
            return res.status(404).json({ message: 'Settlement not found' });
        }

        if (settlement.status !== 'PENDING') {
            return res.status(400).json({ message: `Cannot initiate payout for settlement in ${settlement.status} status` });
        }

        // Simulate payment gateway initiation
        settlement.status = 'INITIATED';
        settlement.initiatedAt = new Date();
        settlement.approvedBy = req.user._id;
        settlement.approvedAt = new Date();

        await settlement.save();

        // In production, integrate with payment gateway here
        // For now, simulate immediate completion
        setTimeout(async () => {
            settlement.status = 'COMPLETED';
            settlement.completedAt = new Date();
            settlement.transactionId = `TXN_${Date.now()}`;
            await settlement.save();

            // Update doctor status
            await Doctor.findByIdAndUpdate(
                settlement.doctorId,
                {
                    'earnings.totalSettled': settlement.netAmount,
                    'earnings.pendingSettlement': 0
                }
            );
        }, 2000);

        res.json({
            success: true,
            message: 'Settlement payout initiated',
            data: settlement
        });

    } catch (error) {
        res.status(500).json({ message: error.message || 'Error initiating payout' });
    }
};

// @desc    Get settlement reports
// @route   GET /api/admin/settlements/report/analytics
// @access  Private (Admin)
exports.getSettlementReports = async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'day' } = req.query;

        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
        const end = endDate ? new Date(endDate) : new Date();

        // Revenue breakdown
        const revenueByStatus = await Settlement.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$netAmount' },
                    totalCommission: { $sum: '$platformCommission' }
                }
            }
        ]);

        // Daily settlement amounts
        const dailySettlements = await Settlement.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end },
                    status: 'COMPLETED'
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$completedAt' }
                    },
                    amount: { $sum: '$netAmount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Top doctors by settlement
        const topDoctors = await Settlement.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end },
                    status: 'COMPLETED'
                }
            },
            {
                $group: {
                    _id: '$doctorId',
                    totalSettled: { $sum: '$netAmount' },
                    appointmentCount: { $sum: '$appointmentCount' },
                    settlementCount: { $sum: 1 }
                }
            },
            { $sort: { totalSettled: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'doctors',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'doctor'
                }
            },
            {
                $project: {
                    doctor: { $arrayElemAt: ['$doctor', 0] },
                    totalSettled: 1,
                    appointmentCount: 1,
                    settlementCount: 1
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                revenueByStatus,
                dailySettlements,
                topDoctors,
                period: { startDate: start, endDate: end }
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message || 'Error generating reports' });
    }
};
