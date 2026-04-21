const cron = require('node-cron');
const settlementController = require('../controllers/finance/settlementController');

const startPaymentCron = require('../services/cron/paymentCron');

const setupCronJobs = () => {
    // Run at 23:59 (11:59 PM) every day
    cron.schedule('59 23 * * *', async () => {
        console.log('Running daily settlement cron job...');
        try {
            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0));
            const endOfDay = new Date(today.setHours(23, 59, 59, 999));

            // Directly call logic
            const result = await settlementController.processSettlementsLogic(
                startOfDay.toISOString(),
                endOfDay.toISOString()
            );
            console.log('Settlement Job Result:', result);

        } catch (error) {
            console.error('Error in daily settlement cron job:', error);
        }
    });

    // Start Payment Expiry Cron
    startPaymentCron();

    // Start Payout Retry Worker
    const startRetryWorker = require('../scripts/cron/retry_transfers');
    startRetryWorker();

    console.log('Cron jobs scheduled: Daily Settlement, Payment Expiry, Payout Retry');
};

module.exports = setupCronJobs;
