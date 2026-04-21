/**
 * Payment Service
 * Handles payment processing, refunds, and settlements
 */

const Payment = require('../../models/Payment');
const Refund = require('../../models/Refund');
const Settlement = require('../../models/Settlement');
const Appointment = require('../../models/Appointment');
const FeeConfig = require('../../models/FeeConfig');

/**
 * Calculate platform fee
 */
const calculatePlatformFee = async (amount, doctorId) => {
  try {
    // Get fee configuration
    const feeConfig = await FeeConfig.findOne({ isActive: true });
    
    if (!feeConfig) {
      // Default 10% if no config
      return {
        platformFee: amount * 0.1,
        doctorAmount: amount * 0.9,
        percentage: 10
      };
    }

    // Check for doctor-specific override
    const doctorOverride = feeConfig.doctorOverrides?.find(
      o => o.doctorId.toString() === doctorId.toString()
    );

    const percentage = doctorOverride?.percentage || feeConfig.platformFeePercentage;
    const platformFee = (amount * percentage) / 100;
    
    return {
      platformFee,
      doctorAmount: amount - platformFee,
      percentage,
      taxAmount: (platformFee * (feeConfig.taxPercentage || 0)) / 100
    };
  } catch (error) {
    console.error('Calculate fee error:', error);
    return { platformFee: amount * 0.1, doctorAmount: amount * 0.9, percentage: 10 };
  }
};

/**
 * Create payment record
 */
const createPayment = async (paymentData) => {
  try {
    const {
      userId,
      doctorId,
      appointmentId,
      amount,
      currency = 'USD',
      paymentMethod,
      provider,
      transactionId
    } = paymentData;

    // Calculate fees
    const feeBreakdown = await calculatePlatformFee(amount, doctorId);

    const payment = new Payment({
      user: userId,
      doctor: doctorId,
      appointment: appointmentId,
      amount,
      currency,
      paymentMethod,
      provider,
      transactionId,
      platformFee: feeBreakdown.platformFee,
      doctorAmount: feeBreakdown.doctorAmount,
      status: 'pending',
      idempotencyKey: `${transactionId}_${Date.now()}`,
      createdAt: new Date()
    });

    await payment.save();

    return { success: true, payment, feeBreakdown };
  } catch (error) {
    console.error('Create payment error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verify payment
 */
const verifyPayment = async (paymentId, providerData) => {
  try {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return { success: false, error: 'Payment not found' };
    }

    // Update payment status based on provider response
    payment.status = providerData.status === 'succeeded' ? 'completed' : 'failed';
    payment.providerResponse = providerData;
    
    if (payment.status === 'completed') {
      payment.completedAt = new Date();
      
      // Update appointment payment status
      await Appointment.findByIdAndUpdate(payment.appointment, {
        paymentStatus: 'paid',
        paidAmount: payment.amount
      });
    }

    await payment.save();

    return { success: true, payment };
  } catch (error) {
    console.error('Verify payment error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Process refund
 */
const processRefund = async (refundData) => {
  try {
    const { paymentId, amount, reason, processedBy } = refundData;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return { success: false, error: 'Payment not found' };
    }

    if (payment.status !== 'completed') {
      return { success: false, error: 'Payment not eligible for refund' };
    }

    // Check if refund amount is valid
    const existingRefunds = await Refund.aggregate([
      { $match: { payment: payment._id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalRefunded = existingRefunds[0]?.total || 0;
    if (totalRefunded + amount > payment.amount) {
      return { success: false, error: 'Refund amount exceeds payment amount' };
    }

    const refund = new Refund({
      payment: paymentId,
      amount,
      reason,
      status: 'pending',
      processedBy,
      idempotencyKey: `refund_${paymentId}_${Date.now()}`,
      createdAt: new Date()
    });

    await refund.save();

    // TODO: Process with payment provider
    // For now, mark as completed
    refund.status = 'completed';
    refund.completedAt = new Date();
    refund.transactionId = `REFUND_${Date.now()}`;
    await refund.save();

    // Update payment refund status
    payment.refundStatus = totalRefunded + amount >= payment.amount ? 'full' : 'partial';
    payment.refundedAmount = totalRefunded + amount;
    await payment.save();

    return { success: true, refund };
  } catch (error) {
    console.error('Process refund error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get payment statistics
 */
const getPaymentStats = async (filters = {}) => {
  try {
    const { startDate, endDate, doctorId } = filters;
    const matchStage = {};

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    if (doctorId) matchStage.doctor = doctorId;

    const stats = await Payment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalPlatformFee: { $sum: '$platformFee' },
          totalDoctorAmount: { $sum: '$doctorAmount' }
        }
      }
    ]);

    const dailyStats = await Payment.aggregate([
      { $match: { ...matchStage, status: 'completed' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return {
      success: true,
      data: {
        summary: stats,
        dailyTrend: dailyStats
      }
    };
  } catch (error) {
    console.error('Get payment stats error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create settlement for doctor
 */
const createSettlement = async (settlementData) => {
  try {
    const { doctorId, period, paymentIds } = settlementData;

    // Get payments to settle
    const payments = await Payment.find({
      _id: { $in: paymentIds },
      doctor: doctorId,
      status: 'completed',
      settlement: { $exists: false }
    });

    if (payments.length === 0) {
      return { success: false, error: 'No eligible payments found' };
    }

    const grossAmount = payments.reduce((sum, p) => sum + p.doctorAmount, 0);
    const platformFeeTotal = payments.reduce((sum, p) => sum + p.platformFee, 0);

    // Calculate deductions
    const taxRate = 0; // Configure based on jurisdiction
    const taxes = (grossAmount * taxRate) / 100;

    const settlement = new Settlement({
      doctor: doctorId,
      period: {
        startDate: new Date(period.startDate),
        endDate: new Date(period.endDate)
      },
      payments: paymentIds,
      grossAmount,
      deductions: {
        platformFee: platformFeeTotal,
        taxes,
        refunds: 0
      },
      netAmount: grossAmount - taxes,
      status: 'pending',
      createdAt: new Date()
    });

    await settlement.save();

    // Update payments with settlement reference
    await Payment.updateMany(
      { _id: { $in: paymentIds } },
      { settlement: settlement._id }
    );

    return { success: true, settlement };
  } catch (error) {
    console.error('Create settlement error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Process settlement payment
 */
const processSettlementPayment = async (settlementId, bankDetails) => {
  try {
    const settlement = await Settlement.findById(settlementId);
    if (!settlement) {
      return { success: false, error: 'Settlement not found' };
    }

    if (settlement.status !== 'pending') {
      return { success: false, error: 'Settlement already processed' };
    }

    // TODO: Integrate with bank/payment provider
    // For now, simulate processing
    settlement.status = 'processing';
    settlement.bankDetails = bankDetails;
    await settlement.save();

    // Simulate completion after processing
    setTimeout(async () => {
      settlement.status = 'completed';
      settlement.transactionId = `STL_${Date.now()}`;
      settlement.processedAt = new Date();
      await settlement.save();
    }, 5000);

    return { success: true, settlement };
  } catch (error) {
    console.error('Process settlement error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get doctor earnings
 */
const getDoctorEarnings = async (doctorId, period = 'month') => {
  try {
    const startDate = new Date();
    if (period === 'week') startDate.setDate(startDate.getDate() - 7);
    else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
    else if (period === 'year') startDate.setFullYear(startDate.getFullYear() - 1);

    const earnings = await Payment.aggregate([
      {
        $match: {
          doctor: doctorId,
          status: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$doctorAmount' },
          totalAppointments: { $sum: 1 },
          averagePerAppointment: { $avg: '$doctorAmount' }
        }
      }
    ]);

    const dailyBreakdown = await Payment.aggregate([
      {
        $match: {
          doctor: doctorId,
          status: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          earnings: { $sum: '$doctorAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return {
      success: true,
      data: {
        summary: earnings[0] || {
          totalEarnings: 0,
          totalAppointments: 0,
          averagePerAppointment: 0
        },
        dailyBreakdown
      }
    };
  } catch (error) {
    console.error('Get doctor earnings error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  calculatePlatformFee,
  createPayment,
  verifyPayment,
  processRefund,
  getPaymentStats,
  createSettlement,
  processSettlementPayment,
  getDoctorEarnings
};
