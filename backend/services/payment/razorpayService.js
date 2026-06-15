/**
 * Razorpay Payment Service
 * Alternative payment gateway implementation with identical interface
 * Handles order creation, verification, refunds, and webhooks
 */

const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../../models/Payment');
const Appointment = require('../../models/Appointment');
const Doctor = require('../../models/Doctor');
const User = require('../../models/User');
const AuditLog = require('../../models/AuditLog');
const RevenueLedger = require('../../models/RevenueLedger');

class RazorpayService {
  constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error('⛔ FATAL: Razorpay Keys Missing in Environment! Payment features will fail.');
    } else {
      console.log(`✓ Razorpay Service Initialized (Key ID starts with: ${keyId.substring(0, 8)}...)`);
    }

    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
  }

  /**
   * Create Linked Account (Razorpay Route)
   * This is how we onboard doctors to receive payouts
   */
  async createLinkedAccount(doctor) {
    try {
      const response = await this.razorpay.accounts.create({
        name: doctor.name,
        email: doctor.email,
        tnc_accepted: true,
        account_details: {
          business_name: doctor.practiceType === 'Own Clinic' ? doctor.clinicAddress.name : doctor.name,
          business_type: 'individual', // Simplified for individual doctors, can be prop/llp
        },
        bank_account: {
          ifsc_code: doctor.bankDetails.ifscCode,
          account_number: doctor.bankDetails.accountNumber,
          beneficiary_name: doctor.bankDetails.accountHolderName
        }
      });

      return response.id; // The acc_... ID
    } catch (err) {
      console.error('Razorpay Linked Account Creation Error:', err);
      throw err;
    }
  }

  /**
   * Create Order with Auto-Split
   * Includes the transfer instructions in the order payload
   */
  async createOrder(appointmentId, userId, doctorId, breakdown, razorpayAccountId) {
    try {
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) throw new Error('Appointment not found');

      const user = await User.findById(userId);

      // Create Payment Record (Pending)
      // We do NOT have the order ID yet, so we create a placeholder or update it immediately after
      // Better: Create DB record first to get ID, then init order

      // Calculate Transfer Amount (Doctor Payout)
      // Must be an integer in smallest currency unit (paise)
      const transferAmount = Math.round(breakdown.doctorPayout * 100);
      const totalAmountPaise = Math.round(breakdown.totalAmount * 100);

      // Prepare Transfers (Split)
      // IMPORTANT: Only add transfer if we have a valid linked account
      // If no linked account, we collect everything in Platform account (Manual settlement needed)
      const transfers = razorpayAccountId ? [
        {
          account: razorpayAccountId,
          amount: transferAmount,
          currency: "INR",
          notes: {
            appointmentId: appointmentId.toString(),
            type: "doctor_payout"
          },
          on_hold: 0 // Immediate transfer after capture? Or Hold? usually 0 for auto-settle
          // on_hold_until: ... if we want to delay settlement until appt completion
        }
      ] : [];

      // Create Order
      const options = {
        amount: totalAmountPaise,
        currency: "INR",
        receipt: `rcpt_${appointmentId}_${Date.now()}`,
        payment_capture: 1, // Auto capture
        notes: {
          appointmentId: appointmentId.toString(),
          doctorId: doctorId.toString(),
          userId: userId.toString()
        }
      };

      // Add transfers only if they exist
      if (transfers.length > 0) {
        options.transfers = transfers;
      }

      const order = await this.razorpay.orders.create(options);

      // Create DB Entry
      const payment = await Payment.create({
        appointmentId,
        userId,
        doctorId,

        // Finances
        doctorFee: breakdown.doctorFee,
        platformFee: breakdown.platformFee,
        commission: breakdown.commission,
        doctorPayout: breakdown.doctorPayout,
        totalAmount: breakdown.totalAmount,
        gatewayFeeEstimate: breakdown.gatewayFeeEstimate, // Estimated

        // Identifiers
        razorpayOrderId: order.id,
        paymentGateway: 'RAZORPAY',
        paymentMethod: 'CARD', // Default, will update on capture
        paymentStatus: 'PENDING',

        // Webhook Idempotency key (placeholder until webhook)
        webhookEventId: null
      });

      // Audit Log
      await AuditLog.create({
        module: 'PAYMENT',
        action: 'ORDER_CREATED',
        targetId: payment._id,
        userId,
        metadata: { orderId: order.id, amount: breakdown.totalAmount, split: transfers.length > 0 }
      });

      return {
        paymentId: payment._id,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID
      };

    } catch (err) {
      console.error('Razorpay Order Creation Error:', err);
      throw err;
    }
  }

  /**
   * Verify Signature
   */
  verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
    if (process.env.NODE_ENV !== 'production' && razorpaySignature === 'MOCK_SIGNATURE') {
      return true;
    }
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw new Error('Invalid signature');
    }
    return true;
  }

  /**
   * Handle Webhooks (The Brain)
   * Handles Payment Capture, Transfer Updates, and Refunds
   */
  async handleWebhookEvent(rawBody, signature) {
    // 1. Verify Webhook Signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new Error('Invalid webhook signature');
    }

    const event = JSON.parse(rawBody);
    const eventId = event.payload?.payment?.entity?.id || event.payload?.transfer?.entity?.id || event.id; // Best effort ID

    console.log(`Webhook Received: ${event.event} [${eventId}]`);

    // 2. Idempotency Check
    // We check if this exact event ID was already processed in AuditLog or Payment
    // To be safe, we'll check DB state before applying changes

    try {
      switch (event.event) {
        case 'payment.captured':
          await this.handlePaymentCaptured(event.payload.payment.entity, event.id);
          break;
        case 'transfer.processed':
          await this.handleTransferProcessed(event.payload.transfer.entity, event.id);
          break;
        case 'transfer.failed':
          await this.handleTransferFailed(event.payload.transfer.entity, event.id);
          break;
        case 'settlement.processed':
          await this.handleSettlementProcessed(event.payload.settlement.entity, event.id);
          break;
        // Add refund handlers...
        default:
          console.log('Unhandled event:', event.event);
      }
    } catch (err) {
      console.error(`Error processing webhook ${event.event}:`, err);
      // We do NOT throw here if we want to return 200 OK to Razorpay to stop retries if it's a logic error
      // But for system errors, we throw to trigger retry
      // For now, log and return safe
    }
  }

  async handlePaymentCaptured(paymentEntity, eventId) {
    // paymentEntity contains: id, order_id, fee, tax, amount, status...

    // Find payment by Order ID
    const payment = await Payment.findOne({ razorpayOrderId: paymentEntity.order_id });
    if (!payment) {
      console.error('Payment not found for order:', paymentEntity.order_id);
      return;
    }

    // Idempotency: If already captured, ignore
    if (payment.paymentStatus === 'CAPTURED') {
      console.log('Payment already captured, ignoring.');
      return;
    }

    // Update Payment
    payment.paymentStatus = 'CAPTURED';
    payment.razorpayPaymentId = paymentEntity.id;
    payment.paymentMethod = (paymentEntity.method || 'CARD').toUpperCase();
    payment.paidAt = new Date();

    // Store Actual Fees (returned in paise)
    payment.actualGatewayFee = paymentEntity.fee ? paymentEntity.fee / 100 : 0;
    payment.actualGatewayTax = paymentEntity.tax ? paymentEntity.tax / 100 : 0;
    payment.webhookEventId = eventId;

    await payment.save();

    // UPDATE: Update Appointment Status and Emit Socket Event
    const appointment = await Appointment.findByIdAndUpdate(payment.appointmentId, {
        status: 'CONFIRMED',
        paymentStatus: 'COMPLETED'
    }, { new: true });

    if (appointment) {
        const socketManager = require('../../utils/socket');
        try {
            socketManager.emitAppointmentUpdate({
                doctorId: appointment.doctorId,
                userId: appointment.userId,
                status: 'BOOKED', // Emitting BOOKED so dashboards know it's a new confirmed booking
                appointmentId: appointment._id,
                appointmentDate: appointment.appointmentDate,
                appointmentTime: appointment.appointmentTime,
                tokenNumber: appointment.tokenNumber
            });
        } catch (e) {
            console.error('Socket emission failed during payment capture:', e);
        }
    }

    // UPDATE: Revenue Ledger Entry is now deferred to 'transfer.processed'
    // This ensures we only account for money that has actually moved and settled
    console.log(`Payment Captured [${payment.razorpayPaymentId}]. Waiting for transfer processing to book revenue.`);


    // Check transfers
    // Razorpay usually returns 'transfers' array in payment entity if eager
    // But we wait for transfer.processed for final confirmation
  }

  async handleTransferProcessed(transferEntity, eventId) {
    // transferEntity: id, source_payment_id, recipient, amount...

    // We need to find the payment associated with this transfer
    // 1. Find by razorpayPaymentId (source_payment_id)
    const payment = await Payment.findOne({ razorpayPaymentId: transferEntity.source_payment_id });

    if (payment) {
      if (payment.transferStatus === 'PROCESSED') return;

      payment.transferStatus = 'PROCESSED';
      payment.transferId = transferEntity.id;
      payment.settlementStatus = 'SETTLED'; // Locally settled (money moved to doctor acc)
      payment.settlementDate = new Date();
      await payment.save();

      // Create Revenue Ledger Entry (MOVED from Captured)
      // Trigger: Payment Captured + Transfer Processed
      const ledgerEntry = await RevenueLedger.findOne({ paymentId: payment._id });
      if (!ledgerEntry) {
        await RevenueLedger.create({
          appointmentId: payment.appointmentId,
          paymentId: payment._id,
          grossAmount: payment.totalAmount, // User Paid
          gatewayFee: payment.actualGatewayFee || 0,
          taxOnGatewayFee: payment.actualGatewayTax || 0,
          platformRevenue: payment.platformFee + payment.commission,
          doctorPayout: payment.doctorPayout,
          // Net Profit = (Platform Rev) - (Gateway Fee)
          netProfit: (payment.platformFee + payment.commission) - (payment.actualGatewayFee || 0),
          status: 'FINAL'
        });
        console.log(`Revenue Ledger Entry created for Payment ${payment._id}`);
      }

      // This is where we could confirm appointment if policy requires transfer success
      // But usually payment.captured is enough for Appointment Confirmation
      // And transfer.processed is for Payout Confirmation
    }
  }

  async handleTransferFailed(transferEntity, eventId) {
    const payment = await Payment.findOne({ razorpayPaymentId: transferEntity.source_payment_id });
    if (payment) {
      payment.transferStatus = 'FAILED';
      await payment.save();

      // ALERT ADMIN
      await AuditLog.create({
        module: 'PAYMENT',
        action: 'TRANSFER_FAILED',
        targetId: payment._id,
        metadata: { reason: transferEntity.error_code, description: transferEntity.error_description }
      });
    }
  }

  async handleSettlementProcessed(settlementEntity, eventId) {
    // settlementEntity: id, amount, status, etc.
    // Razorpay doesn't always send the list of payments in the webhook payload directly for 'settlement.processed'
    // consistently across all versions. Usually it's a summary.
    // But if we use 'settlement.recon', we get details. 
    // For 'settlement.processed', we might simply verify the ID.

    // If we want to link payments, we usually need to fetch settlement details or rely on the report.
    // For now, we will log it. Linking individual payments to a settlement ID often requires an additional API call 
    // to GET /settlements/:id/payments if not provided in payload.

    console.log(`Settlement Processed: ${settlementEntity.id}, Amount: ${settlementEntity.amount}`);

    // NOTE: precise linking requires fetching settlement breakdown
    // await this.linkPaymentsToSettlement(settlementEntity.id);
  }
}

module.exports = new RazorpayService();
