/**
 * Enhanced Socket Manager
 * Real-time WebSocket hub for the healthcare platform
 * Supports: Live tickers, Room-based messaging, User tracking, Stats broadcasting
 */

const socketIO = require('socket.io');
const statsEngine = require('../services/realtime/statsEngine');

class SocketManager {
    constructor() {
        this.io = null;
    }

    init(server) {
        this.io = socketIO(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            },
            // Performance tuning
            pingTimeout: 60000,
            pingInterval: 25000,
            transports: ['websocket', 'polling'],
        });

        // Initialize stats engine with Socket.IO instance
        statsEngine.init(this.io);

        this.io.on('connection', (socket) => {
            console.log(`⚡ Socket connected: ${socket.id}`);

            // -- Room Joining --
            socket.on('join_room', (room) => {
                socket.join(room);
                console.log(`📌 Socket ${socket.id} joined room: ${room}`);

                // Track user connection info
                const userInfo = {
                    socketId: socket.id,
                    room: room,
                    role: room === 'admin' ? 'admin' : room.startsWith('doctor_') ? 'doctor' : 'user',
                    userId: room.startsWith('doctor_') ? room.replace('doctor_', '') :
                            room.startsWith('user_') ? room.replace('user_', '') : null,
                };
                statsEngine.trackConnection(socket.id, userInfo);

                // Send immediate cached stats on join
                const cached = statsEngine.getCachedStats();
                if (cached && cached.ticker) {
                    socket.emit('live_ticker', {
                        timestamp: new Date().toISOString(),
                        data: cached,
                        initial: true
                    });
                }
            });

            // -- Subscribe to specific ticker channels --
            socket.on('subscribe_ticker', (channels) => {
                if (Array.isArray(channels)) {
                    channels.forEach(channel => {
                        socket.join(`ticker_${channel}`);
                    });
                }
            });

            // -- Heartbeat / Ping for latency tracking --
            socket.on('ping_server', (data) => {
                socket.emit('pong_server', {
                    serverTime: new Date().toISOString(),
                    clientTime: data?.clientTime
                });
            });

            // -- Disconnect --
            socket.on('disconnect', (reason) => {
                console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
                statsEngine.removeConnection(socket.id);
            });

            // -- Error handling --
            socket.on('error', (err) => {
                console.error(`Socket error for ${socket.id}:`, err);
            });
        });

        // Start the real-time stats engine
        statsEngine.start();

        console.log('Enhanced Socket.io initialized with Real-Time Stats Engine');
    }

    /**
     * Emit to a specific room
     */
    emit(room, event, data) {
        if (!this.io) {
            console.warn('Socket.io not initialized, cannot emit event');
            return;
        }
        this.io.to(room).emit(event, data);
    }

    /**
     * Broadcast to all connected clients
     */
    broadcast(event, data) {
        if (!this.io) {
            console.warn('Socket.io not initialized, cannot broadcast');
            return;
        }
        this.io.emit(event, data);
    }

    /**
     * Emit appointment update to relevant rooms
     */
    emitAppointmentUpdate(appointmentData) {
        if (!this.io) return;

        const { doctorId, userId, status } = appointmentData;

        // Notify doctor
        if (doctorId) {
            this.io.to(`doctor_${doctorId}`).emit('appointment_update', {
                type: 'appointment',
                action: status,
                data: appointmentData,
                timestamp: new Date().toISOString()
            });
        }

        // Notify user
        if (userId) {
            this.io.to(`user_${userId}`).emit('appointment_update', {
                type: 'appointment',
                action: status,
                data: appointmentData,
                timestamp: new Date().toISOString()
            });
        }

        // Notify admin room
        this.io.to('admin').emit('appointment_update', {
            type: 'appointment',
            action: status,
            data: appointmentData,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Emit payment update
     */
    emitPaymentUpdate(paymentData) {
        if (!this.io) return;

        this.io.to('admin').emit('payment_update', {
            type: 'payment',
            data: paymentData,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Get Socket.IO instance
     */
    getIO() {
        return this.io;
    }

    /**
     * Get real-time stats
     */
    getStats() {
        return statsEngine.getCachedStats();
    }
}

module.exports = new SocketManager();
