const cron = require('node-cron');
const Payment = require('../../models/Payment');
const Appointment = require('../../models/Appointment');

const startPaymentCron = () => {
    // Run every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
        console.log('Running Order Expiry Cron Job...');
        try {
            const expiryTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago

            // Find pending payments created before expiryTime
            const expiredPayments = await Payment.find({
                paymentStatus: 'PENDING',
                createdAt: { $lt: expiryTime }
            });

            if (expiredPayments.length === 0) return;

            console.log(`Found ${expiredPayments.length} expired payments.`);

            for (const payment of expiredPayments) {
                payment.paymentStatus = 'FAILED'; // Or 'EXPIRED' if enum supports it
                payment.statusHistory.push({
                    status: 'FAILED',
                    failureMessage: 'Payment Expired (Auto-Cron)',
                    timestamp: new Date()
                });
                await payment.save();

                // Release Appointment potentially?
                // If appointment was 'PENDING_PAYMENT', we might want to cancel it or free up the slot
                // Assuming Appointment status logic handles this or stays as is
            }
        } catch (error) {
            console.error('Error in Payment Cron:', error);
        }
    });
};

module.exports = startPaymentCron;
