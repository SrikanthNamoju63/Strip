exports.systemHealth = async (req, res) => {
    try {
        res.json({
            status: 'OK',
            uptime: Math.floor(process.uptime()),
            database: {
                status: 'Connected',
                responseTime: 45
            },
            cache: {
                status: 'Optimized',
                memoryUsage: 45
            }
        });
    } catch (error) {
        console.error('System health check error:', error);
        res.status(500).json({ error: 'Failed to retrieve system health' });
    }
};

exports.systemLogs = async (req, res) => {
    try {
        res.json([
            { level: 'info', message: 'System started', timestamp: new Date() },
            { level: 'warn', message: 'High memory usage detected', timestamp: new Date(Date.now() - 100000) }
        ]);
    } catch (error) {
        console.error('System logs error:', error);
        res.status(500).json({ error: 'Failed to retrieve system logs' });
    }
};

exports.apiHealth = async (req, res) => {
    try {
        res.json({
            status: 'Healthy',
            latency: '45ms',
            activeConnections: 12
        });
    } catch (error) {
        console.error('API health check error:', error);
        res.status(500).json({ error: 'Failed to retrieve API health' });
    }
};

exports.advancedAnalytics = async (req, res) => {
    try {
        const fakeRevenueTrend = [];
        const fakeTransactionVolume = [];
        const fakeUserGrowth = [];
        
        // Generate last 7 days data
        for (let i = 6; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString();
            const rev = Math.floor(Math.random() * 50000) + 10000;
            fakeRevenueTrend.push({ date, revenue: rev, commission: Math.floor(rev * 0.1) });
            
            const trans = Math.floor(Math.random() * 200) + 50;
            fakeTransactionVolume.push({ date, transactions: trans, completed: Math.floor(trans * 0.85), failed: Math.floor(trans * 0.15) });
            
            const pats = Math.floor(Math.random() * 1000) + 500;
            fakeUserGrowth.push({ date, patients: pats + (6-i)*50, doctors: 120 + (6-i)*2 });
        }

        res.json({
            totalRevenue: 854300,
            revenueChange: 12.5,
            totalTransactions: 3245,
            transactionChange: 8.2,
            activeUsers: 12540,
            usersChange: 15.3,
            totalAppointments: 2150,
            appointmentChange: 5.4,
            revenueTrend: fakeRevenueTrend,
            transactionVolume: fakeTransactionVolume,
            userGrowth: fakeUserGrowth,
            paymentMethods: [
                { name: 'Credit/Debit Card', value: 45 },
                { name: 'UPI', value: 35 },
                { name: 'Net Banking', value: 15 },
                { name: 'Wallet', value: 5 }
            ],
            detailedMetrics: [
                { name: 'Patient Registrations', value: '1,245', change: 15.2, percentage: '100.0' },
                { name: 'Doctor Onboardings', value: '42', change: 5.5, percentage: '3.4' },
                { name: 'Successful Consultations', value: '1,890', change: 8.8, percentage: '87.9' },
                { name: 'Cancelled Appointments', value: '260', change: -2.4, percentage: '12.1' },
                { name: 'Average Rating', value: '4.8', change: 1.2, percentage: 'N/A' },
                { name: 'Refund Requests', value: '15', change: -5.0, percentage: '0.7' }
            ]
        });
    } catch (error) {
        console.error('Advanced analytics error:', error);
        res.status(500).json({ error: 'Failed to retrieve analytics' });
    }
};

exports.activity = async (req, res) => {
    try {
        res.json([
            { user: 'Admin', action: 'Login', timestamp: new Date() },
            { user: 'Doctor X', action: 'Update Profile', timestamp: new Date(Date.now() - 50000) }
        ]);
    } catch (error) {
        console.error('Activity log error:', error);
        res.status(500).json({ error: 'Failed to retrieve activity logs' });
    }
};

exports.emailTemplates = async (req, res) => {
    try {
        res.json([
            { id: 1, name: 'Welcome Email', subject: 'Welcome to HealthPlatform' },
            { id: 2, name: 'Appointment Confirmation', subject: 'Your Appointment is Confirmed' }
        ]);
    } catch (error) {
        console.error('Email templates error:', error);
        res.status(500).json({ error: 'Failed to retrieve email templates' });
    }
};

exports.emailHistory = async (req, res) => {
    try {
        res.json([
            { recipient: 'user@example.com', template: 'Welcome Email', status: 'Sent', sentAt: new Date() }
        ]);
    } catch (error) {
        console.error('Email history error:', error);
        res.status(500).json({ error: 'Failed to retrieve email history' });
    }
};

exports.apiMetrics = async (req, res) => {
    try {
        res.json({
            requestsPerMinute: 45,
            avgResponseTime: 120,
            errors: 2
        });
    } catch (error) {
        console.error('API metrics error:', error);
        res.status(500).json({ error: 'Failed to retrieve API metrics' });
    }
};

exports.endpoints = async (req, res) => {
    try {
        res.json([
            { method: 'GET', path: '/api/doctors', status: 'Active' },
            { method: 'POST', path: '/api/appointments', status: 'Active' }
        ]);
    } catch (error) {
        console.error('Endpoints error:', error);
        res.status(500).json({ error: 'Failed to retrieve endpoints' });
    }
};

exports.exportData = async (req, res) => {
    try {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="export.csv"');
        res.send(`Date,Value\n${new Date().toISOString()},100`);
    } catch (error) {
        console.error('Export data error:', error);
        res.status(500).json({ error: 'Failed to export data' });
    }
};
