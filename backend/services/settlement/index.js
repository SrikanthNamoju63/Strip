/**
 * Settlement & Reconciliation Service
 * Handles daily doctor payouts, payment reconciliation, and ledger management
 */

const Payment = require('../../models/Payment');
const Settlement = require('../../models/Settlement');
const Doctor = require('../../models/Doctor');
const User = require('../../models/User');
const AuditLog = require('../../models/AuditLog');
const stripeService = require('./stripeService');
const razorpayService = require('./razorpayService');

class SettlementService {
  /**
   * Calculate settlement for a doctor
   * Groups payments, calculates net amount (minus refunds), creates settlement record
   */
  async calculateSettlement(doctorId, fromDate, toDate) {
    try {
      // Get all captured payments for doctor in date range
      const payments = await Payment.find({
        doctorId,
        status: 'CAPTURED',
        confirmedAt: {
          $gte: fromDate,
          $lte: toDate
        }
      });

      if (payments.length === 0) {
        return {
          doctorId,
          totalPayments: 0,
          totalAmount: 0,
          totalRefunds: 0,
          netAmount: 0,
          settlementRecords: []
        };
      }

      // Calculate totals
      let totalAmount = 0;
      let totalRefunds = 0;
      const settlementRecords = [];

      for (const payment of payments) {
        totalAmount += payment.breakdown.doctorReceivable;

        if (payment.refund && payment.refund.processedAt) {
          totalRefunds += payment.refund.amount;
        }

        settlementRecords.push({
          paymentId: payment._id,
          appointmentId: payment.appointmentId,
          amount: payment.breakdown.doctorReceivable,
          refund: payment.refund?.amount || 0,
          netAmount: payment.breakdown.doctorReceivable - (payment.refund?.amount || 0)
        });
      }

      const netAmount = totalAmount - totalRefunds;

      // Create settlement record
      const settlement = await Settlement.create({
        doctorId,
        totalPayments: payments.length,
        totalAmount,
        totalRefunds,
        netAmount,
        settlementRecords,
        fromDate,
        toDate,
        status: 'PENDING',
        createdAt: new Date()
      });

      // Audit log
      await AuditLog.create({
        module: 'SETTLEMENT',
        action: 'SETTLEMENT_CALCULATED',
        targetId: settlement._id,
        metadata: {
          doctorId,
          totalAmount,
          netAmount,
          settlements: payments.length
        }
      });

      return {
        settlementId: settlement._id,
        doctorId,
        totalPayments: payments.length,
        totalAmount,
        totalRefunds,
        netAmount,
        status: 'PENDING'
      };
    } catch (err) {
      console.error('Settlement calculation error:', err);
      throw err;
    }
  }

  /**
   * Daily settlement batch job (runs at 2 AM)
   * Processes settlements for all doctors with captured payments yesterday
   */
  async processDailySettlements() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all doctors with payments yesterday
      const doctors = await Payment.distinct('doctorId', {
        status: 'CAPTURED',
        confirmedAt: {
          $gte: yesterday,
          $lt: today
        },
        'settlement.status': { $ne: 'SETTLED' }
      });

      const results = [];

      for (const doctorId of doctors) {
        try {
          const settlement = await this.calculateSettlement(doctorId, yesterday, today);

          if (settlement.netAmount > 0) {
            // Queue for bank transfer
            await this.queueBankTransfer(settlement);
            results.push({
              doctorId,
              settlementId: settlement.settlementId,
              amount: settlement.netAmount,
              status: 'SUCCESS'
            });
          } else {
            results.push({
              doctorId,
              settlementId: settlement.settlementId,
              amount: 0,
              status: 'SKIPPED'
            });
          }
        } catch (err) {
          console.error(`Settlement failed for doctor ${doctorId}:`, err);
          results.push({
            doctorId,
            status: 'FAILED',
            error: err.message
          });
        }
      }

      // Log batch job
      await AuditLog.create({
        module: 'SETTLEMENT',
        action: 'DAILY_SETTLEMENT_BATCH',
        metadata: {
          totalDoctors: doctors.length,
          successCount: results.filter(r => r.status === 'SUCCESS').length,
          failedCount: results.filter(r => r.status === 'FAILED').length,
          totalAmount: results.reduce((sum, r) => sum + (r.amount || 0), 0)
        }
      });

      return {
        processedAt: new Date(),
        doctorCount: doctors.length,
        results
      };
    } catch (err) {
      console.error('Daily settlement batch error:', err);
      throw err;
    }
  }

  /**
   * Queue bank transfer for settlement
   * Integrates with payment gateway's payout API
   */
  async queueBankTransfer(settlement) {
    try {
      const doctor = await Doctor.findById(settlement.doctorId);
      const user = await User.findById(doctor.userId);

      // Validate bank details exist
      if (!doctor.bankDetails || !doctor.bankDetails.accountNumber) {
        throw new Error('Doctor bank details not configured');
      }

      // Update settlement status
      const updatedSettlement = await Settlement.findByIdAndUpdate(
        settlement.settlementId,
        {
          status: 'PROCESSING',
          bankTransferInitiatedAt: new Date()
        },
        { new: true }
      );

      // In production: integrate with actual payout service
      // For now: log for manual processing
      console.log(`Bank transfer queued:`, {
        settlementId: settlement.settlementId,
        amount: settlement.netAmount,
        accountNumber: doctor.bankDetails.accountNumber.slice(-4),
        doctorName: user.name
      });

      // Audit
      await AuditLog.create({
        module: 'SETTLEMENT',
        action: 'BANK_TRANSFER_QUEUED',
        targetId: settlement.settlementId,
        metadata: {
          amount: settlement.netAmount,
          doctorId: settlement.doctorId,
          reference: `SET_${settlement.settlementId}`
        }
      });

      return updatedSettlement;
    } catch (err) {
      console.error('Bank transfer queueing error:', err);
      throw err;
    }
  }

  /**
   * Confirm bank transfer (when bank confirms payment)
   * Called via webhook or manual confirmation
   */
  async confirmBankTransfer(settlementId, referenceNumber) {
    try {
      const settlement = await Settlement.findByIdAndUpdate(
        settlementId,
        {
          status: 'SETTLED',
          bankTransferCompletedAt: new Date(),
          bankReferenceNumber: referenceNumber
        },
        { new: true }
      );

      // Mark related payments as settled
      await Payment.updateMany(
        { _id: { $in: settlement.settlementRecords.map(r => r.paymentId) } },
        {
          'settlement.status': 'SETTLED',
          'settlement.settlementId': settlementId,
          'settlement.settledAt': new Date()
        }
      );

      // Notify doctor
      const doctor = await Doctor.findById(settlement.doctorId);
      const user = await User.findById(doctor.userId);

      // Send notification
      console.log(`Settlement confirmed for ${user.name}:`, {
        amount: settlement.netAmount,
        referenceNumber
      });

      // Audit
      await AuditLog.create({
        module: 'SETTLEMENT',
        action: 'SETTLEMENT_COMPLETED',
        targetId: settlementId,
        metadata: {
          amount: settlement.netAmount,
          doctorId: settlement.doctorId,
          referenceNumber
        }
      });

      return settlement;
    } catch (err) {
      console.error('Bank transfer confirmation error:', err);
      throw err;
    }
  }

  /**
   * Reconciliation: Compare database payments with payment gateway records
   * Runs monthly to detect discrepancies
   */
  async reconcilePayments(fromDate, toDate, paymentGateway = 'STRIPE') {
    try {
      // Get all payments from database for period
      const dbPayments = await Payment.find({
        status: 'CAPTURED',
        confirmedAt: {
          $gte: fromDate,
          $lte: toDate
        },
        paymentGateway
      });

      // Get all transactions from payment gateway
      const gatewayTransactions = await this.fetchGatewayTransactions(
        fromDate,
        toDate,
        paymentGateway
      );

      // Compare and detect discrepancies
      const discrepancies = [];

      // Check database payments that don't exist in gateway
      for (const dbPayment of dbPayments) {
        const gatewayTxn =
          paymentGateway === 'STRIPE'
            ? gatewayTransactions.find(
                t => t.id === dbPayment.stripe.paymentIntentId
              )
            : gatewayTransactions.find(t => t.id === dbPayment.razorpay.orderId);

        if (!gatewayTxn) {
          discrepancies.push({
            type: 'MISSING_IN_GATEWAY',
            paymentId: dbPayment._id,
            amount: dbPayment.breakdown.totalAmount,
            severity: 'HIGH'
          });
        } else if (Math.abs(gatewayTxn.amount - dbPayment.breakdown.totalAmount) > 1) {
          discrepancies.push({
            type: 'AMOUNT_MISMATCH',
            paymentId: dbPayment._id,
            dbAmount: dbPayment.breakdown.totalAmount,
            gatewayAmount: gatewayTxn.amount,
            severity: 'HIGH'
          });
        }
      }

      // Check gateway transactions not in database
      for (const gatewayTxn of gatewayTransactions) {
        const dbPayment =
          paymentGateway === 'STRIPE'
            ? dbPayments.find(p => p.stripe.paymentIntentId === gatewayTxn.id)
            : dbPayments.find(p => p.razorpay.orderId === gatewayTxn.id);

        if (!dbPayment) {
          discrepancies.push({
            type: 'MISSING_IN_DB',
            gatewayId: gatewayTxn.id,
            amount: gatewayTxn.amount,
            severity: 'CRITICAL'
          });
        }
      }

      // Log reconciliation report
      const report = {
        period: { fromDate, toDate },
        paymentGateway,
        dbPaymentCount: dbPayments.length,
        gatewayTransactionCount: gatewayTransactions.length,
        discrepancies,
        discrepancyCount: discrepancies.length,
        timestamp: new Date()
      };

      await AuditLog.create({
        module: 'SETTLEMENT',
        action: 'MONTHLY_RECONCILIATION',
        metadata: {
          paymentGateway,
          totalPayments: dbPayments.length,
          totalGatewayTransactions: gatewayTransactions.length,
          discrepancyCount: discrepancies.length
        }
      });

      return report;
    } catch (err) {
      console.error('Payment reconciliation error:', err);
      throw err;
    }
  }

  /**
   * Fetch transactions from payment gateway
   */
  async fetchGatewayTransactions(fromDate, toDate, gateway) {
    if (gateway === 'STRIPE') {
      // Fetch from Stripe API
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const charges = await stripe.charges.list({
        created: {
          gte: Math.floor(fromDate.getTime() / 1000),
          lte: Math.floor(toDate.getTime() / 1000)
        }
      });

      return charges.data.map(charge => ({
        id: charge.payment_intent,
        amount: charge.amount / 100,
        status: charge.status,
        date: new Date(charge.created * 1000)
      }));
    } else if (gateway === 'RAZORPAY') {
      // Fetch from Razorpay API
      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });

      const payments = await razorpay.payments.all({
        skip: 0,
        count: 100,
        from: Math.floor(fromDate.getTime() / 1000),
        to: Math.floor(toDate.getTime() / 1000)
      });

      return (payments.items || []).map(payment => ({
        id: payment.order_id,
        amount: payment.amount / 100,
        status: payment.status,
        date: new Date(payment.created_at * 1000)
      }));
    }
  }

  /**
   * Generate settlement report for doctor dashboard
   */
  async getSettlementReport(doctorId, limit = 12) {
    try {
      const settlements = await Settlement.find({ doctorId })
        .sort({ createdAt: -1 })
        .limit(limit);

      const totalSettled = settlements
        .filter(s => s.status === 'SETTLED')
        .reduce((sum, s) => sum + s.netAmount, 0);

      const totalPending = settlements
        .filter(s => s.status === 'PENDING')
        .reduce((sum, s) => sum + s.netAmount, 0);

      return {
        doctorId,
        totalSettled,
        totalPending,
        totalProcessing: settlements
          .filter(s => s.status === 'PROCESSING')
          .reduce((sum, s) => sum + s.netAmount, 0),
        settlements: settlements.map(s => ({
          settlementId: s._id,
          period: { from: s.fromDate, to: s.toDate },
          amount: s.netAmount,
          status: s.status,
          settledAt: s.bankTransferCompletedAt
        }))
      };
    } catch (err) {
      console.error('Settlement report error:', err);
      throw err;
    }
  }
}

module.exports = new SettlementService();
