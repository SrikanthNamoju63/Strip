/**
 * Real-Time Stats Engine
 * Aggregates live platform KPIs and broadcasts every second via Socket.IO
 * Like a stock market data feed — constant streaming updates
 */

const Appointment = require('../../models/Appointment');
const User = require('../../models/User');
const Doctor = require('../../models/Doctor');
const Payment = require('../../models/Payment');

class StatsEngine {
    constructor() {
        this.io = null;
        this.intervalId = null;
        this.cachedStats = {};
        this.connectedUsers = new Map(); // Track connected sockets
        this.lastUpdate = null;
    }

    /**
     * Initialize with Socket.IO instance
     */
    init(io) {
        this.io = io;
        console.log('📊 StatsEngine initialized');
    }

    /**
     * Start broadcasting every second
     */
    start() {
        if (!this.io) {
            console.warn('⚠ StatsEngine: Cannot start without Socket.IO');
            return;
        }

        // Aggregate and broadcast every 1 second
        this.intervalId = setInterval(async () => {
            try {
                const stats = await this.aggregateStats();
                this.cachedStats = stats;
                this.lastUpdate = new Date();

                // Broadcast to all connected clients
                this.io.emit('live_ticker', {
                    timestamp: this.lastUpdate.toISOString(),
                    data: stats
                });

                // Broadcast admin-specific stats
                this.io.to('admin').emit('admin_stats_update', {
                    timestamp: this.lastUpdate.toISOString(),
                    data: stats
                });

                // Broadcast doctor-specific per-doctor stats
                // (Each doctor gets their own room stats)
                this.broadcastDoctorStats(stats);

            } catch (err) {
                // Don't crash the interval on errors
                console.error('StatsEngine error:', err.message);
            }
        }, 1000); // Every 1 second

        // Heavy aggregation every 30 seconds (detailed stats)
        this.heavyIntervalId = setInterval(async () => {
            try {
                const heavyStats = await this.aggregateHeavyStats();
                this.io.to('admin').emit('admin_heavy_stats', {
                    timestamp: new Date().toISOString(),
                    data: heavyStats
                });
            } catch (err) {
                console.error('StatsEngine heavy aggregation error:', err.message);
            }
        }, 30000); // Every 30 seconds

        console.log('🚀 StatsEngine: Broadcasting live stats every 1 second');
    }

    /**
     * Stop broadcasting
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        if (this.heavyIntervalId) {
            clearInterval(this.heavyIntervalId);
            this.heavyIntervalId = null;
        }
        console.log('⏹ StatsEngine stopped');
    }

    /**
     * Track connected user
     */
    trackConnection(socketId, userInfo) {
        this.connectedUsers.set(socketId, {
            ...userInfo,
            connectedAt: new Date()
        });
    }

    /**
     * Remove tracked user
     */
    removeConnection(socketId) {
        this.connectedUsers.delete(socketId);
    }

    /**
     * Lightweight aggregation — runs every 1 second
     * Uses MongoDB aggregation for speed
     */
    async aggregateStats() {
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        // Run all queries in parallel for max speed
        const [
            todayAppointments,
            todayRevenue,
            activeConsultations,
            recentBookings,
            onlineDoctorsCount,
            totalUsersCount
        ] = await Promise.allSettled([
            // Today's appointments by status
            Appointment.aggregate([
                {
                    $match: {
                        appointmentDate: { $gte: startOfDay, $lte: endOfDay }
                    }
                },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Today's revenue
            Payment.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startOfDay, $lte: endOfDay },
                        status: 'paid'
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$amount' },
                        totalTransactions: { $sum: 1 },
                        platformFee: { $sum: '$platformFee' },
                        doctorPayout: { $sum: '$doctorAmount' }
                    }
                }
            ]),

            // Active consultations (in-progress appointments)
            Appointment.countDocuments({
                status: { $in: ['IN_PROGRESS', 'CHECKED_IN'] },
                appointmentDate: { $gte: startOfDay, $lte: endOfDay }
            }),

            // Recent bookings (last 5 minutes)
            Appointment.countDocuments({
                createdAt: { $gte: new Date(now - 5 * 60 * 1000) }
            }),

            // "Online" doctors (connected via socket)
            Promise.resolve(
                Array.from(this.connectedUsers.values())
                    .filter(u => u.role === 'doctor').length
            ),

            // Total users
            User.countDocuments()
        ]);

        // Parse appointment stats
        const appointmentsByStatus = {};
        let totalAppointmentsToday = 0;
        if (todayAppointments.status === 'fulfilled') {
            todayAppointments.value.forEach(item => {
                appointmentsByStatus[item._id] = item.count;
                totalAppointmentsToday += item.count;
            });
        }

        // Parse revenue
        const revenue = todayRevenue.status === 'fulfilled' && todayRevenue.value.length > 0
            ? todayRevenue.value[0]
            : { totalRevenue: 0, totalTransactions: 0, platformFee: 0, doctorPayout: 0 };

        return {
            // Live Ticker Data Points
            ticker: {
                totalAppointmentsToday,
                bookedToday: appointmentsByStatus['BOOKED'] || 0,
                completedToday: appointmentsByStatus['COMPLETED'] || 0,
                cancelledToday: appointmentsByStatus['CANCELLED'] || 0,
                inProgressToday: appointmentsByStatus['IN_PROGRESS'] || 0,
                checkedInToday: appointmentsByStatus['CHECKED_IN'] || 0,
                todayRevenue: revenue.totalRevenue || 0,
                todayTransactions: revenue.totalTransactions || 0,
                platformFeeToday: revenue.platformFee || 0,
                doctorPayoutToday: revenue.doctorPayout || 0,
                activeConsultations: activeConsultations.status === 'fulfilled' ? activeConsultations.value : 0,
                recentBookings: recentBookings.status === 'fulfilled' ? recentBookings.value : 0,
                onlineDoctors: onlineDoctorsCount.status === 'fulfilled' ? onlineDoctorsCount.value : 0,
                connectedClients: this.connectedUsers.size,
                totalUsers: totalUsersCount.status === 'fulfilled' ? totalUsersCount.value : 0,
            },
            // Metadata
            serverTime: now.toISOString(),
            uptime: process.uptime(),
        };
    }

    /**
     * Heavy aggregation — runs every 30 seconds
     * More complex queries for admin dashboard
     */
    async aggregateHeavyStats() {
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            weeklyRevenue,
            monthlyRevenue,
            doctorStats,
            hourlyDistribution,
            paymentMethods
        ] = await Promise.allSettled([
            // Weekly revenue
            Payment.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startOfWeek },
                        status: 'paid'
                    }
                },
                {
                    $group: {
                        _id: { $dayOfWeek: '$createdAt' },
                        revenue: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),

            // Monthly revenue
            Payment.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startOfMonth },
                        status: 'paid'
                    }
                },
                {
                    $group: {
                        _id: { $dayOfMonth: '$createdAt' },
                        revenue: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),

            // Doctor verification stats
            Doctor.aggregate([
                {
                    $group: {
                        _id: '$isVerified',
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Hourly appointment distribution for today
            Appointment.aggregate([
                {
                    $match: {
                        appointmentDate: { $gte: startOfDay }
                    }
                },
                {
                    $group: {
                        _id: '$appointmentTime',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),

            // Payment method distribution
            Payment.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startOfMonth },
                        status: 'paid'
                    }
                },
                {
                    $group: {
                        _id: '$paymentMethod',
                        count: { $sum: 1 },
                        total: { $sum: '$amount' }
                    }
                }
            ])
        ]);

        return {
            weeklyRevenue: weeklyRevenue.status === 'fulfilled' ? weeklyRevenue.value : [],
            monthlyRevenue: monthlyRevenue.status === 'fulfilled' ? monthlyRevenue.value : [],
            doctorStats: doctorStats.status === 'fulfilled' ? doctorStats.value : [],
            hourlyDistribution: hourlyDistribution.status === 'fulfilled' ? hourlyDistribution.value : [],
            paymentMethods: paymentMethods.status === 'fulfilled' ? paymentMethods.value : [],
        };
    }

    /**
     * Broadcast per-doctor stats to their rooms
     */
    broadcastDoctorStats(globalStats) {
        // Get unique doctor IDs from connected users
        const doctorIds = new Set();
        this.connectedUsers.forEach((info) => {
            if (info.role === 'doctor' && info.userId) {
                doctorIds.add(info.userId);
            }
        });

        // For each connected doctor, emit their personalized ticker
        doctorIds.forEach(doctorId => {
            this.io.to(`doctor_${doctorId}`).emit('doctor_stats_update', {
                timestamp: new Date().toISOString(),
                global: {
                    totalPlatformAppointments: globalStats.ticker.totalAppointmentsToday,
                    onlineDoctors: globalStats.ticker.onlineDoctors,
                    connectedClients: globalStats.ticker.connectedClients,
                },
            });
        });
    }

    /**
     * Get cached stats (for REST endpoint fallback)
     */
    getCachedStats() {
        return {
            ...this.cachedStats,
            lastUpdate: this.lastUpdate?.toISOString() || null
        };
    }
}

module.exports = new StatsEngine();
