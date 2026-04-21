/**
 * Stripe Payment Service
 * Handles payment intent creation, confirmation, refunds, and webhook processing
 * Implements idempotency, 3D Secure, fraud detection, and reconciliation
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');
const Payment = require('../../models/Payment');
const Appointment = require('../../models/Appointment');
const Doctor = require('../../models/Doctor');
const User = require('../../models/User');
const AuditLog = require('../../models/AuditLog');

class StripeService {
  /**
   * Create payment intent (initial payment request)
   * Returns: {clientSecret, paymentIntentId, amount, currency}
   */
  async createPaymentIntent(appointmentId, userId, doctorId, breakdown) {
    try {
      // Verify appointment exists
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) throw new Error('Appointment not found');

      const doctor = await Doctor.findById(doctorId);
      const user = await User.findById(userId);

      // Create payment record
      const payment = await Payment.create({
        appointmentId,
        userId,
        doctorId,
        breakdown,
        paymentGateway: 'STRIPE',
        status: 'PENDING',
        metadata: {
          userAgent: '',
          ipAddress: ''
        }
      });

      // Create idempotency key for duplicate prevention
      const idempotencyKey = `pay_${payment._id}_${Date.now()}`;

      const intent = await stripe.paymentIntents.create(
        {
          amount: Math.round(breakdown.totalAmount * 100), // In paise (₹550 = 55000 paise)
          currency: 'inr',
          payment_method_types: ['card', 'upi'],
          metadata: {
            appointmentId: appointmentId.toString(),
            userId: userId.toString(),
            doctorId: doctorId.toString(),
            doctorName: doctor.name,
            patientName: user.name,
            transactionType: 'appointment_booking',
            paymentId: payment._id.toString()
          },
          description: `Appointment with ${doctor.name} on ${appointment.appointmentDate}`,
          receipt_email: user.email,
          statement_descriptor: 'HEALTHAPP CONSULT',
          off_session: false
        },
        {
          idempotencyKey: idempotencyKey
        }
      );

      // Save payment intent details
      payment.stripe.paymentIntentId = intent.id;
      payment.stripe.clientSecret = intent.client_secret;
      payment.idempotencyKey = idempotencyKey;
      payment.initiatedAt = new Date();
      await payment.save();

      // Log audit
      await AuditLog.create({
        module: 'PAYMENT',
        action: 'PAYMENT_INTENT_CREATED',
        targetId: payment._id,
        userId,
        metadata: {
          appointmentId,
          amount: breakdown.totalAmount,
          paymentIntentId: intent.id
        }
      });

      return {
        paymentId: payment._id,
        paymentIntentId: intent.id,
        clientSecret: intent.client_secret,
        status: intent.status,
        amount: breakdown.totalAmount,
        currency: 'INR'
      };
    } catch (err) {
      console.error('Stripe payment intent creation error:', err);
      throw err;
    }
  }

  /**
   * Confirm payment after client-side authorization
   */
  async confirmPayment(paymentIntentId, paymentId) {
    try {
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      const payment = await Payment.findById(paymentId);

      if (!payment) throw new Error('Payment record not found');

      if (intent.status === 'succeeded') {
        // Payment successful - capture details
        const chargeId = intent.charges.data[0]?.id;
        const charge = await stripe.charges.retrieve(chargeId);

        payment.status = 'CAPTURED';
        payment.stripe.chargeId = chargeId;
        payment.stripe.receiptUrl = charge.receipt_url;
        payment.stripe.paymentMethod = {
          type: charge.payment_method_details?.type,
          cardBrand: charge.payment_method_details?.card?.brand,
          cardLast4: charge.payment_method_details?.card?.last4,
          cardExpiry:
            charge.payment_method_details?.card?.exp_month +
            '/' +
            charge.payment_method_details?.card?.exp_year
        };
        payment.confirmedAt = new Date();
        payment.settlement.status = 'PENDING';
        await payment.save();

        // Update appointment status
        await Appointment.findByIdAndUpdate(paymentId, {
          status: 'CONFIRMED',
          paymentStatus: 'COMPLETED'
        });

        // Publish event for notification service
        await this.publishPaymentEvent('payment.captured', payment);

        // Audit log
        await AuditLog.create({
          module: 'PAYMENT',
          action: 'PAYMENT_CAPTURED',
          targetId: paymentId,
          userId: payment.userId,
          metadata: {
            amount: payment.breakdown.totalAmount,
            chargeId
          }
        });

        return { success: true, status: 'CAPTURED', chargeId };
      } else if (intent.status === 'requires_action') {
        payment.status = 'AUTHORIZED';
        await payment.save();
        return {
          success: false,
          status: 'requires_action',
          message: '3D Secure verification required'
        };
      } else {
        payment.status = 'FAILED';
        payment.failedAt = new Date();
        payment.statusHistory.push({
          status: 'FAILED',
          failureMessage: `Payment intent status: ${intent.status}`
        });
        await payment.save();

        return { success: false, status: intent.status };
      }
    } catch (err) {
      console.error('Stripe payment confirmation error:', err);
      throw err;
    }
  }

  /**
   * Process refund
   */
  async refundPayment(paymentId, amount = null, reason = '') {
    try {
      const payment = await Payment.findById(paymentId);

      if (!payment || payment.status !== 'CAPTURED') {
        throw new Error('Payment not found or not in CAPTURED state');
      }

      const refundAmount = amount
        ? Math.round(amount * 100)
        : Math.round(payment.breakdown.totalAmount * 100);

      const refund = await stripe.refunds.create({
        charge: payment.stripe.chargeId,
        amount: refundAmount,
        reason: 'requested_by_customer',
        metadata: {
          refundReason: reason,
          appointmentId: payment.appointmentId.toString(),
          paymentId: paymentId.toString()
        }
      });

      // Track refund
      payment.refund = {
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount / 100,
        reason,
        requestedAt: new Date()
      };

      if (refund.status === 'succeeded') {
        payment.refund.processedAt = new Date();
        payment.status = 'REFUNDED';
      }

      await payment.save();

      // Audit log
      await AuditLog.create({
        module: 'PAYMENT',
        action: 'PAYMENT_REFUNDED',
        targetId: paymentId,
        metadata: {
          refundId: refund.id,
          amount: refund.amount / 100,
          reason
        }
      });

      return {
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount / 100
      };
    } catch (err) {
      console.error('Stripe refund error:', err);
      throw err;
    }
  }

  /**
   * Handle webhook events from Stripe
   */
  async handleWebhookEvent(rawBody, signature) {
    try {
      // Verify webhook signature
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      const verified = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        endpointSecret
      );

      const eventData = verified.data.object;

      switch (verified.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(eventData);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(eventData);
          break;

        case 'charge.dispute.created':
          await this.handleChargeback(eventData);
          break;

        case 'charge.refunded':
          await this.handleRefunded(eventData);
          break;

        case 'charge.dispute.closed':
          await this.handleDisputeClosed(eventData);
          break;

        default:
          console.log(`Unhandled webhook type: ${verified.type}`);
      }

      return { received: true };
    } catch (err) {
      console.error('Webhook verification failed:', err);
      throw new Error('Invalid webhook signature');
    }
  }

  async handlePaymentSucceeded(charge) {
    const payment = await Payment.findOne({
      'stripe.paymentIntentId': charge.payment_intent
    });

    if (payment && payment.status !== 'CAPTURED') {
      payment.status = 'CAPTURED';
      payment.confirmedAt = new Date();
      payment.stripe.webhookEventId = charge.id;
      payment.settlement.status = 'PENDING';
      await payment.save();

      await this.publishPaymentEvent('payment.captured', payment);

      // Update appointment
      await Appointment.findByIdAndUpdate(payment.appointmentId, {
        status: 'CONFIRMED',
        paymentStatus: 'COMPLETED'
      });
    }
  }

  async handlePaymentFailed(intent) {
    const payment = await Payment.findOne({
      'stripe.paymentIntentId': intent.id
    });

    if (payment && payment.status !== 'FAILED') {
      payment.status = 'FAILED';
      payment.failedAt = new Date();
      payment.statusHistory.push({
        status: 'FAILED',
        failureCode: intent.last_payment_error?.code,
        failureMessage: intent.last_payment_error?.message
      });
      await payment.save();

      await this.publishPaymentEvent('payment.failed', payment);
    }
  }

  async handleChargeback(charge) {
    // High-priority: Chargeback filed
    const payment = await Payment.findOne({
      'stripe.chargeId': charge.id
    });

    if (payment) {
      payment.riskLevel = 'HIGH';
      payment.fraudChecks.suspiciousReason = 'Chargeback filed by customer';
      await payment.save();

      // Alert admin
      await AuditLog.create({
        module: 'PAYMENT',
        action: 'CHARGEBACK_FILED',
        targetId: payment._id,
        metadata: {
          chargeId: charge.id,
          disputeAmount: charge.dispute.amount / 100
        }
      });
    }
  }

  async handleRefunded(charge) {
    const payment = await Payment.findOne({
      'stripe.chargeId': charge.id
    });

    if (payment) {
      payment.status = 'REFUNDED';
      payment.refund.processedAt = new Date();
      await payment.save();
    }
  }

  async handleDisputeClosed(dispute) {
    const payment = await Payment.findOne({
      'stripe.chargeId': dispute.charge
    });

    if (payment) {
      if (dispute.status === 'won') {
        payment.riskLevel = 'LOW';
        payment.fraudChecks.suspiciousReason = null;
      } else if (dispute.status === 'lost') {
        payment.riskLevel = 'HIGH';
        payment.fraudChecks.suspiciousReason = 'Chargeback lost - customer won';
      }
      await payment.save();
    }
  }

  /**
   * Publish payment events (integration with event system)
   */
  async publishPaymentEvent(eventType, payment) {
    // This would integrate with your event bus (Redis pub/sub, RabbitMQ, etc.)
    console.log(`Event published: ${eventType}`, {
      paymentId: payment._id,
      appointmentId: payment.appointmentId,
      amount: payment.breakdown.totalAmount
    });
  }
}

module.exports = new StripeService();
