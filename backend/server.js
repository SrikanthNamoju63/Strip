const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Connect to MongoDB
connectDB();

// Import routes
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const doctorRoutes = require('./routes/doctors');
const bloodRoutes = require('./routes/blood');
const profileRoutes = require('./routes/profile');
const healthMetricsRoutes = require('./routes/healthMetrics');
const bannerRoutes = require('./routes/banners');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.SERVER_HOST || '0.0.0.0';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors({
    origin: '*', // Allow all for development/migration
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/uploads', express.static(uploadsDir));

// Request logging
app.use((req, res, next) => {
    console.log(`  ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/blood', bloodRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/health', healthMetricsRoutes);
app.use('/api/banners', bannerRoutes);

// Test route
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'Backend server is running (MongoDB Mode)!',
        timestamp: new Date().toISOString()
    });
});

// Notification Scheduler (Runs every 24 hours in production, here set to check on startup/interval)
const checkDonationEligibility = async () => {
    try {
        console.log('--- Checking for Eligible Donors for Notification ---');
        const BloodDonor = require('./models/BloodDonor');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find donors where next_eligible_date is exactly today (or passed if we want to catch up)
        // For strict "Push when reach", we check bounds.
        const startOfDay = new Date(today);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        // Find donors who became eligible TODAY
        const donorsToNotify = await BloodDonor.find({
            next_eligible_date: {
                $gte: startOfDay,
                $lte: endOfDay
            },
            is_eligible: false // Only notify those who were marked ineligible previously? 
            // Actually, is_eligible might be updated by this job.
        }).populate('user_details');

        console.log(`Found ${donorsToNotify.length} donors becoming eligible today.`);

        for (const donor of donorsToNotify) {
            // Update their status to Eligible
            donor.is_eligible = true;
            await donor.save();

            // Simulate Push Notification
            if (donor.user_details && donor.user_details.fcm_token) {
                // sendPushNotification(donor.user_details.fcm_token, "You are now eligible to donate blood! Save a life today.");
                console.log(`[PUSH NOTIFICATION SENT] To: ${donor.user_details.full_name} (${donor.phone}) - Msg: You are eligible to donate!`);
            } else {
                console.log(`[PUSH SIMULATION] To: ${donor.user_details?.full_name || donor.phone} - User eligible today!`);
            }
        }
    } catch (error) {
        console.error('Notification Scheduler Error:', error);
    }
};

// Run check on startup and then every 24 hours
// setTimeout(checkDonationEligibility, 5000); // Run 5s after startup for demo
// setInterval(checkDonationEligibility, 24 * 60 * 60 * 1000);

// Server startup
app.listen(PORT, HOST, () => {
    console.log('\n' + '='.repeat(60));
    console.log(`Server running on ${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
    console.log('Mode: MongoDB Migration');

    // Start Notification Scheduler
    console.log('Starting Notification Scheduler...');
    checkDonationEligibility(); // Run immediately on start
    setInterval(checkDonationEligibility, 24 * 60 * 60 * 1000); // Then daily

    console.log('='.repeat(60) + '\n');
});