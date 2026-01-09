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

// Test route
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'Backend server is running (MongoDB Mode)!',
        timestamp: new Date().toISOString()
    });
});

// Server startup
app.listen(PORT, HOST, () => {
    console.log('\n' + '='.repeat(60));
    console.log(`Server running on ${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
    console.log('Mode: MongoDB Migration');
    console.log('='.repeat(60) + '\n');
});