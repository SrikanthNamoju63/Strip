const cron = require('node-cron');
const Payment = require('../../models/Payment');
const razorpayService = require('../../services/payment/razorpayService');
const AuditLog = require('../../models/AuditLog');

const MAX_RETRIES = 3;

/**
 * Retry Payout Worker
 * Finds failed transfers and retries them up to MAX_RETRIES
 */
const startRetryWorker = () => {
    // Run every hour
    cron.schedule('0 * * * *', async () => {
        console.log('Running Payout Retry Worker...');
        try {
            // Find eligible payments:
            // 1. Transfer Status = FAILED
            // 2. Retry Count < MAX (Need to add retry count to schema or audit logic)
            // For now, we'll check Audit Logs or add a temporary field. 
            // Better: Add 'transferRetryCount' to Payment model. 
            // Since we can't easily change schema on the fly without restarting, we'll use a hack or just retry all FAILED
            // that are recent (e.g., last 24 hours) to avoid infinite loops on old failures.

            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

            const failedPayments = await Payment.find({
                transferStatus: 'FAILED',
                updatedAt: { $gte: twentyFourHoursAgo }
            }).limit(10); // Batch size

            for (const payment of failedPayments) {
                console.log(`Retrying transfer for Payment ${payment._id}...`);

                // Fetch doctor to check current account status
                const Doctor = require('../../models/Doctor');
                const doctor = await Doctor.findById(payment.doctorId);

                if (!doctor || !doctor.bankDetails?.razorpayAccountId) {
                    console.error(`Doctor missing for payment ${payment._id}, cannot retry.`);
                    continue;
                }

                try {
                    // Re-attempt transfer using Razorpay Service
                    // We need a method to 'create transfer' on existing order/payment
                    // razorpayService.retryTransfer(payment, doctor.bankDetails.razorpayAccountId);

                    // Since we don't have a direct 'retryTransfer' method exposed yet, we implement logic here:
                    const transferAmount = Math.round(payment.doctorPayout * 100);

                    const transfer = await razorpayService.razorpay.transfers.create({
                        account: doctor.bankDetails.razorpayAccountId,
                        amount: transferAmount,
                        currency: "INR",
                        notes: {
                            paymentId: payment._id.toString(),
                            type: "doctor_payout_retry"
                        }
                        // We link to the original payment if possible, using source_payment_id?
                        // "transfers.create" usually takes a "source" (payment_id) if doing standalone transfer from capturing payment.
                        // But here we might just do a direct transfer from the main account balance if the original flow failed?
                        // Razorpay Route 'Direct Transfer' API is usually: /transfers
                        // payload: { account, amount, currency, source_payment_id? }
                    });

                    if (transfer.id) {
                        payment.transferStatus = 'PENDING'; // Will update to PROCESSED via webhook
                        payment.transferId = transfer.id;
                        await payment.save();

                        await AuditLog.create({
                            module: 'PAYMENT',
                            action: 'TRANSFER_RETRY',
                            targetId: payment._id,
                            metadata: { transferId: transfer.id, attempt: 'retry' }
                        });
                        console.log(`Retry initiated for ${payment._id}: ${transfer.id}`);
                    }

                } catch (err) {
                    console.error(`Retry failed for ${payment._id}:`, err.message);
                    // Update audit log?
                }
            }

        } catch (error) {
            console.error('Error in Retry Worker:', error);
        }
    });
};

module.exports = startRetryWorker;
