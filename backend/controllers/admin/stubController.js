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
        const { range } = req.query; // e.g. '7days', '30days', '1year', 'all'
        
        // Models needed
        const Payment = require('../../models/Payment');
        const Appointment = require('../../models/Appointment');
        const User = require('../../models/User');
        const Doctor = require('../../models/Doctor');

        let startDate = new Date();
        let previousStartDate = new Date();
        let isAllTime = false;

        if (range === '7days') {
            startDate.setDate(startDate.getDate() - 7);
            previousStartDate.setDate(previousStartDate.getDate() - 14);
        } else if (range === '30days') {
            startDate.setDate(startDate.getDate() - 30);
            previousStartDate.setDate(previousStartDate.getDate() - 60);
        } else if (range === '1year') {
            startDate.setFullYear(startDate.getFullYear() - 1);
            previousStartDate.setFullYear(previousStartDate.getFullYear() - 2);
        } else {
            startDate = new Date(0); // All time
            previousStartDate = new Date(0);
            isAllTime = true;
        }
        
        // Revenue Trend (Daily)
        const revenueTrendRaw = await Payment.aggregate([
            { $match: { paidAt: { $gte: startDate }, paymentStatus: 'CAPTURED' } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$paidAt" } },
                    revenue: { $sum: "$totalAmount" },
                    commission: { $sum: "$platformCommission" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const revenueTrend = revenueTrendRaw.map(item => ({
            date: item._id,
            revenue: item.revenue,
            commission: item.commission
        }));

        // Current Period Totals
        const totalRevenueResult = await Payment.aggregate([
            { $match: { paidAt: { $gte: startDate }, paymentStatus: 'CAPTURED' } },
            { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
        ]);
        const totalRevenue = totalRevenueResult[0]?.total || 0;
        const totalTransactions = totalRevenueResult[0]?.count || 0;
        
        const totalAppointments = await Appointment.countDocuments({ createdAt: { $gte: startDate } });
        const activeUsers = await User.countDocuments({ createdAt: { $gte: startDate } });

        // Previous Period Totals (for percentage change)
        let revenueChange = 0, transactionChange = 0, usersChange = 0, appointmentChange = 0;

        if (!isAllTime) {
            const prevRevenueResult = await Payment.aggregate([
                { $match: { paidAt: { $gte: previousStartDate, $lt: startDate }, paymentStatus: 'CAPTURED' } },
                { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
            ]);
            const prevTotalRevenue = prevRevenueResult[0]?.total || 0;
            const prevTotalTransactions = prevRevenueResult[0]?.count || 0;
            
            const prevTotalAppointments = await Appointment.countDocuments({ createdAt: { $gte: previousStartDate, $lt: startDate } });
            const prevActiveUsers = await User.countDocuments({ createdAt: { $gte: previousStartDate, $lt: startDate } });

            const calcChange = (current, prev) => prev === 0 ? (current > 0 ? 100 : 0) : Number((((current - prev) / prev) * 100).toFixed(1));

            revenueChange = calcChange(totalRevenue, prevTotalRevenue);
            transactionChange = calcChange(totalTransactions, prevTotalTransactions);
            appointmentChange = calcChange(totalAppointments, prevTotalAppointments);
            usersChange = calcChange(activeUsers, prevActiveUsers);
        }

        // User Growth (Daily)
        const userGrowthRaw = await User.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);
        
        const doctorGrowthRaw = await Doctor.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // Merge user and doctor into one growth array
        const growthMap = {};
        userGrowthRaw.forEach(u => {
            if(!growthMap[u._id]) growthMap[u._id] = { date: u._id, patients: 0, doctors: 0 };
            growthMap[u._id].patients = u.count;
        });
        doctorGrowthRaw.forEach(d => {
            if(!growthMap[d._id]) growthMap[d._id] = { date: d._id, patients: 0, doctors: 0 };
            growthMap[d._id].doctors = d.count;
        });
        const userGrowth = Object.values(growthMap).sort((a,b) => a.date.localeCompare(b.date));

        // Payment Methods Pie
        const paymentMethodsRaw = await Payment.aggregate([
            { $match: { paidAt: { $gte: startDate }, paymentStatus: 'CAPTURED' } },
            { $group: { _id: "$paymentMethod", value: { $sum: 1 } } }
        ]);
        const paymentMethods = paymentMethodsRaw.map(pm => ({ name: pm._id || 'Unknown', value: pm.value }));

        // Appointment Status Pie
        const appointmentStatusRaw = await Appointment.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: "$status", value: { $sum: 1 } } }
        ]);
        const appointmentStatusDist = appointmentStatusRaw.map(a => ({
            name: a._id,
            value: a.value
        }));

        res.json({
            totalRevenue,
            revenueChange, 
            totalTransactions,
            transactionChange,
            activeUsers,
            usersChange,
            totalAppointments,
            appointmentChange,
            revenueTrend,
            userGrowth,
            paymentMethods,
            appointmentStatusDist
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
