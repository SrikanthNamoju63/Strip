/**
 * ============================================================================
 * HEALTHCARE PLATFORM - ECOSYSTEM INITIALIZATION
 * ============================================================================
 * 
 * Purpose: Complete setup for integrating all 31 database tables as a unified
 *          ecosystem with real-time capabilities, security, and monitoring.
 * 
 * Integration: Add this class to your server.js or main application file
 * 
 * Usage Example:
 *   const HealthcarePlatform = require('./ECOSYSTEM_INITIALIZATION');
 *   const platform = new HealthcarePlatform(app);
 *   await platform.initialize();
 *   platform.server.listen(3000);
 * 
 * Features:
 *   - 31 Database tables orchestration
 *   - MongoDB change streams monitoring
 *   - Real-time WebSocket events
 *   - Role-based access control
 *   - Comprehensive error handling
 *   - System health monitoring
 * 
 * ============================================================================
 */

// ============================================================================
// IMPORTS
// ============================================================================

// Core Dependencies
const express = require('express');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const http = require('http');

// Ecosystem Services (Core Integration)
const DatabaseEcosystemManager = require('./services/DatabaseEcosystemManager');
const RealTimeEventSystem = require('./services/RealTimeEventSystem');
const DatabaseSecurityManager = require('./services/DatabaseSecurityManager');

// Configuration
const connectDB = require('./config/db');

// ============================================================================
// HEALTHCARE PLATFORM CLASS
// ============================================================================

/**
 * HealthcarePlatform
 * Main orchestrator class that initializes and manages all ecosystem components
 */
class HealthcarePlatform {
    /**
     * Constructor
     * @param {Express.Application} app - Express application instance
     */
    constructor(app) {
        // Express setup
        this.app = app;
        
        // HTTP & Socket.io server setup
        this.server = http.createServer(this.app);
        this.io = new Server(this.server, {
            cors: {
                origin: process.env.CORS_ORIGIN || '*',
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
            }
        });

        // Initialize empty properties for ecosystem services
        this.ecosystem = null;
        this.realtimeSystem = null;
        this.securityManager = null;
    }

    // ========================================================================
    // MAIN INITIALIZATION METHOD
    // ========================================================================

    /**
     * Initialize entire ecosystem and all services
     * Executes in 7 sequential steps
     * 
     * @returns {Promise<boolean>} True if initialization successful
     * @throws {Error} If any step fails
     */
    async initialize() {
        try {
            console.log('\n' + '='.repeat(80));
            console.log('INITIALIZING HEALTHCARE PLATFORM ECOSYSTEM');
            console.log('='.repeat(80) + '\n');

            // ====== Step 1: Database Connection ======
            await this.connectDatabase();

            // ====== Step 2: Ecosystem Manager ======
            await this.initializeEcosystemManager();

            // ====== Step 3: Real-Time System ======
            this.initializeRealTimeSystem();

            // ====== Step 4: Security Manager ======
            this.initializeSecurityManager();

            // ====== Step 5: WebSocket Handlers ======
            this.setupWebSocketHandlers();

            // ====== Step 6: Error Handling ======
            this.setupErrorHandling();

            // ====== Step 7: System Monitoring ======
            this.startMonitoring();

            return true;
        } catch (error) {
            console.error('Ecosystem initialization failed:', error);
            throw error;
        }
    }

    // ========================================================================
    // STEP 1: DATABASE CONNECTION
    // ========================================================================

    /**
     * Connect to MongoDB database
     * @private
     * @throws {Error} If connection fails
     */
    async connectDatabase() {
        console.log('Connecting to MongoDB...');
        try {
            await connectDB();
            console.log('MongoDB connected\n');
        } catch (error) {
            throw new Error(`Database connection failed: ${error.message}`);
        }
    }

    // ========================================================================
    // STEP 2: ECOSYSTEM MANAGER INITIALIZATION
    // ========================================================================

    /**
     * Initialize the DatabaseEcosystemManager
     * Loads all 31 models and registers hooks
     * 
     * @private
     * @returns {Promise<DatabaseEcosystemManager>} Initialized ecosystem manager
     * @throws {Error} If initialization fails
     */
    async initializeEcosystemManager() {
        console.log('Initializing Ecosystem Manager (31 tables)...');
        try {
            this.ecosystem = new DatabaseEcosystemManager();
            
            // Load all database models
            const models = await this.ecosystem.initializeModels();
            console.log(`      ✓ Loaded ${Object.keys(models).length} database models`);

            // Setup automatic hooks and cascading operations
            this.ecosystem.setupEcosystemHooks();
            console.log('      ✓ Ecosystem hooks registered');
            console.log('      ✓ Automatic cascading enabled\n');

            return this.ecosystem;
        } catch (error) {
            throw new Error(`Ecosystem initialization failed: ${error.message}`);
        }
    }

    // ========================================================================
    // STEP 3: REAL-TIME EVENT SYSTEM INITIALIZATION
    // ========================================================================

    /**
     * Initialize the RealTimeEventSystem
     * Enables MongoDB change streams and WebSocket event broadcasting
     * 
     * @private
     * @returns {RealTimeEventSystem} Initialized real-time system
     * @throws {Error} If initialization fails
     */
    initializeRealTimeSystem() {
        console.log('  ⚡ Initializing Real-Time Event System...');
        try {
            this.realtimeSystem = new RealTimeEventSystem(this.io);
            
            // Initialize MongoDB change stream monitors
            this.realtimeSystem.initializeChangeStreams(this.ecosystem.models);
            console.log('      ✓ Change streams monitoring enabled (8 collections)\n');

            // Periodic cleanup of old events
            setInterval(() => {
                this.realtimeSystem.clearOldEvents(60 * 60 * 1000); // 1 hour old
            }, 10 * 60 * 1000); // Every 10 minutes

            return this.realtimeSystem;
        } catch (error) {
            throw new Error(`Real-time system initialization failed: ${error.message}`);
        }
    }

    // ========================================================================
    // STEP 4: SECURITY MANAGER INITIALIZATION
    // ========================================================================

    /**
     * Initialize the DatabaseSecurityManager
     * Sets up RBAC, encryption, and validation rules
     * 
     * @private
     * @returns {DatabaseSecurityManager} Initialized security manager
     * @throws {Error} If initialization fails
     */
    initializeSecurityManager() {
        console.log('  🔒 Initializing Security Manager...');
        try {
            this.securityManager = new DatabaseSecurityManager();
            
            // Define role-based access control matrix
            this.securityManager.defineAccessControl();
            console.log('      ✓ Access control matrix defined (7 roles)');

            // Define table relationships and validation rules
            this.securityManager.defineRelationshipRules();
            console.log('      ✓ Relationship rules defined (31 tables)\n');

            return this.securityManager;
        } catch (error) {
            throw new Error(`Security manager initialization failed: ${error.message}`);
        }
    }

    // ========================================================================
    // STEP 5: WEBSOCKET EVENT HANDLERS
    // ========================================================================

    /**
     * Setup WebSocket connection handlers and event listeners
     * Handles all real-time client communications
     * 
     * @private
     */
    setupWebSocketHandlers() {
        console.log('🔌 Setting up WebSocket handlers...');
        
        this.io.on('connection', (socket) => {
            const userId = socket.handshake.auth.userId;
            
            // Validate user connection
            if (!userId) {
                console.warn('      Connection rejected: Missing userId');
                socket.disconnect();
                return;
            }

            // Register user connection
            this.realtimeSystem.registerUserConnection(userId, socket);
            console.log(`      👤 User ${userId} connected`);

            // -------- APPOINTMENT EVENTS --------
            this._setupAppointmentHandlers(socket, userId);

            // -------- PAYMENT EVENTS --------
            this._setupPaymentHandlers(socket, userId);

            // -------- HEALTH EVENTS --------
            this._setupHealthHandlers(socket, userId);

            // -------- SUPPORT TICKET EVENTS --------
            this._setupSupportHandlers(socket, userId);

            // -------- WALLET EVENTS --------
            this._setupWalletHandlers(socket, userId);

            // -------- DISCONNECT HANDLER --------
            socket.on('disconnect', () => {
                this.realtimeSystem.unregisterUserConnection(userId, socket);
                console.log(`      👤 User ${userId} disconnected`);
            });
        });

        console.log('      ✓ WebSocket handlers configured\n');
    }

    /**
     * Appointment event handlers
     * @private
     */
    _setupAppointmentHandlers(socket, userId) {
        // Search doctors by specialization
        socket.on('appointment:search_doctors', async (data) => {
            try {
                const doctors = await this.ecosystem.models.Doctor.find({
                    specialization: data.specialization,
                    isVerified: true,
                    isActive: true
                }).limit(10);
                
                socket.emit('appointment:doctors_found', { doctors });
                
                // Log activity
                await this.ecosystem.models.UserActivity.create({
                    userId,
                    activityType: 'DOCTOR_SEARCH',
                    resourceType: 'DOCTOR',
                    actionDescription: `Searched doctors for ${data.specialization}`,
                    status: 'SUCCESS'
                });
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Book appointment
        socket.on('appointment:book', async (data) => {
            try {
                // Validate doctor verification
                await this.ecosystem.validateDoctorVerification(data.doctorId);

                // Apply coupon and calculate fees
                const paymentValidation = await this.ecosystem.validatePaymentAndApplyCoupon(
                    userId,
                    data.couponCode,
                    data.appointmentFee
                );

                // Get available slots
                const slots = await this.ecosystem.getAvailableSlots(
                    data.doctorId,
                    new Date(data.appointmentDate)
                );

                socket.emit('appointment:slots_available', { slots });
                
                // Log activity
                await this.ecosystem.models.UserActivity.create({
                    userId,
                    activityType: 'APPOINTMENT_SEARCH',
                    resourceType: 'APPOINTMENT',
                    doctorId: data.doctorId,
                    status: 'SUCCESS'
                });
            } catch (error) {
                socket.emit('error', { message: error.message });
                
                // Log failure
                await this.ecosystem.models.UserActivity.create({
                    userId,
                    activityType: 'APPOINTMENT_SEARCH',
                    status: 'FAILURE',
                    errorMessage: error.message
                });
            }
        });
    }

    /**
     * Payment event handlers
     * @private
     */
    _setupPaymentHandlers(socket, userId) {
        // Verify payment status
        socket.on('payment:verify', async (data) => {
            try {
                const payment = await this.ecosystem.models.Payment.findById(data.paymentId);
                
                if (!payment) {
                    throw new Error('Payment not found');
                }

                socket.emit('payment:verified', {
                    paymentId: payment._id,
                    status: payment.paymentStatus,
                    amount: payment.totalAmount
                });
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });
    }

    /**
     * Health tracking event handlers
     * @private
     */
    _setupHealthHandlers(socket, userId) {
        // Record health reading
        socket.on('health:record_reading', async (data) => {
            try {
                const reading = await this.ecosystem.models.HealthReading.create({
                    userId,
                    readingType: data.readingType,
                    value: data.value,
                    unit: data.unit,
                    source: 'mobile_app',
                    recordedAt: new Date(),
                    isNormal: this._checkHealthNormal(data)
                });

                socket.emit('health:reading_recorded', {
                    readingId: reading._id,
                    isNormal: reading.isNormal
                });

                // Alert if abnormal
                if (!reading.isNormal) {
                    this.realtimeSystem.emitToUser(userId, 'health:alert', {
                        readingId: reading._id,
                        message: `Your ${data.readingType} reading is abnormal. Please consult a doctor.`
                    });
                }

                // Log activity
                await this.ecosystem.models.UserActivity.create({
                    userId,
                    activityType: 'HEALTH_READING',
                    resourceType: 'HEALTH_READING',
                    status: 'SUCCESS'
                });
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });
    }

    /**
     * Support ticket event handlers
     * @private
     */
    _setupSupportHandlers(socket, userId) {
        // Create support ticket
        socket.on('support:create_ticket', async (data) => {
            try {
                const ticket = await this.ecosystem.models.SupportTicket.create({
                    userId,
                    subject: data.subject,
                    description: data.description,
                    category: data.category,
                    priority: data.priority || 'MEDIUM',
                    ticketId: `TKT-${Date.now()}`,
                    status: 'OPEN'
                });

                socket.emit('support:ticket_created', {
                    ticketId: ticket._id,
                    ticketNumber: ticket.ticketId
                });

                // Notify support admin
                this.realtimeSystem.emitEvent('support:new_ticket', {
                    ticketId: ticket._id,
                    priority: ticket.priority
                });

                // Log activity
                await this.ecosystem.models.UserActivity.create({
                    userId,
                    activityType: 'SUPPORT_TICKET_CREATED',
                    resourceType: 'SUPPORT_TICKET',
                    supportTicketId: ticket._id,
                    status: 'SUCCESS'
                });
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Send message to ticket
        socket.on('support:send_message', async (data) => {
            try {
                const ticket = await this.ecosystem.models.SupportTicket.findById(data.ticketId);
                
                ticket.messages.push({
                    senderId: userId,
                    senderRole: 'USER',
                    message: data.message,
                    sentAt: new Date()
                });

                await ticket.save();

                socket.emit('support:message_sent', {
                    ticketId: ticket._id,
                    messageId: ticket.messages.length - 1
                });

                // Notify assigned admin
                if (ticket.assignedTo) {
                    this.realtimeSystem.emitToAdmin(ticket.assignedTo, 'support:new_message', {
                        ticketId: ticket._id,
                        message: data.message
                    });
                }

                // Log activity
                await this.ecosystem.models.UserActivity.create({
                    userId,
                    activityType: 'SUPPORT_TICKET_UPDATED',
                    resourceType: 'SUPPORT_TICKET',
                    supportTicketId: ticket._id,
                    status: 'SUCCESS'
                });
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });
    }

    /**
     * Wallet event handlers
     * @private
     */
    _setupWalletHandlers(socket, userId) {
        // Check wallet balance
        socket.on('wallet:check_balance', async () => {
            try {
                const wallet = await this.ecosystem.models.UserWallet.findOne({ userId });
                
                socket.emit('wallet:balance_updated', {
                    totalBalance: wallet?.totalBalance || 0,
                    availableBalance: wallet?.availableBalance || 0,
                    lockedBalance: wallet?.lockedBalance || 0,
                    rewardPoints: wallet?.rewardPoints || 0
                });
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });
    }

    // ========================================================================
    // STEP 6: ERROR HANDLING
    // ========================================================================

    /**
     * Configure comprehensive error handling
     * Global error handlers for express and mongoose
     * 
     * @private
     */
    setupErrorHandling() {
        console.log('Setting up error handling...');

        // Express error handler (catches all route errors)
        this.app.use((error, req, res, next) => {
            console.error('Error:', error.message);

            const statusCode = error.statusCode || 500;
            const message = error.message || 'Internal Server Error';

            // Log error activity
            if (req.user?.id) {
                this.ecosystem.models.UserActivity.create({
                    userId: req.user.id,
                    activityType: 'ERROR',
                    status: 'FAILURE',
                    errorMessage: message,
                    statusCode
                }).catch(err => console.error('Failed to log error activity:', err));
            }

            res.status(statusCode).json({ 
                error: message,
                timestamp: new Date()
            });
        });

        // MongoDB connection error handler
        mongoose.connection.on('error', (error) => {
            console.error('MongoDB error:', error.message);
            this.realtimeSystem.emitEvent('system:database_error', {
                message: 'Database connection error',
                timestamp: new Date(),
                error: error.message
            });
        });

        // MongoDB disconnection handler
        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected');
            this.realtimeSystem.emitEvent('system:database_offline', {
                timestamp: new Date(),
                message: 'Database connection lost'
            });
        });

        console.log('      ✓ Error handlers configured\n');
    }

    // ========================================================================
    // STEP 7: SYSTEM MONITORING & HEALTH CHECKS
    // ========================================================================

    /**
     * Start system monitoring and health check endpoints
     * Provides metrics for observability and debugging
     * 
     * @private
     */
    startMonitoring() {
        console.log('Starting system monitoring...');

        // ---- HEALTH CHECK ENDPOINT ----
        this.app.get('/health', async (req, res) => {
            try {
                // Check database connection status
                const dbStatus = mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy';
                
                // Count active users
                const activeUsers = this.realtimeSystem.activeConnections.size;

                // Get database statistics
                const stats = await mongoose.connection.db.stats();

                res.json({
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    components: {
                        database: {
                            status: dbStatus,
                            collections: stats.collections,
                            dataSize: `${(stats.dataSize / 1024 / 1024).toFixed(2)}MB`
                        },
                        realtime: {
                            activeUsers,
                            eventQueueSize: this.realtimeSystem.eventQueue.length,
                            socketConnections: this.io.engine.clientsCount
                        }
                    }
                });
            } catch (error) {
                res.status(503).json({
                    status: 'unhealthy',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // ---- METRICS ENDPOINT ----
        this.app.get('/metrics', async (req, res) => {
            try {
                const metrics = {
                    timestamp: new Date().toISOString(),
                    uptime: `${Math.round(process.uptime())}s`,
                    connections: {
                        activeUsers: this.realtimeSystem.activeConnections.size,
                        totalSocketConnections: this.io.engine.clientsCount
                    },
                    events: {
                        queueSize: this.realtimeSystem.eventQueue.length,
                        recentEvents: this.realtimeSystem.getEventHistory(50)
                    },
                    ecosystem: {
                        modelsLoaded: Object.keys(this.ecosystem.models).length,
                        hooksRegistered: Object.keys(this.ecosystem.hooks || {}).length
                    },
                    memory: {
                        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
                        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
                    }
                };

                res.json(metrics);
            } catch (error) {
                res.status(500).json({ 
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // ---- MEMORY MONITORING (Every 60 seconds) ----
        setInterval(() => {
            const memUsage = process.memoryUsage();
            console.log('Memory:', {
                heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
                external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
                activeUsers: this.realtimeSystem.activeConnections.size
            });
        }, 60000);

        // Monitor database queries
        if (process.env.DEBUG_DB === 'true') {
            mongoose.set('debug', (collection, method, query) => {
                console.log(`DB: ${collection}.${method}`, query);
            });
        }

        console.log('✅ Monitoring started');

        console.log('      ✓ Health check endpoint: /health');
        console.log('      ✓ Metrics endpoint: /metrics');
        console.log('      ✓ Memory monitoring enabled\n');
    }

    // ========================================================================
    // HELPER METHODS
    // ========================================================================

    /**
     * Check if a health reading is normal (helper method)
     * @private
     * @param {Object} data Health reading data
     * @returns {boolean} True if reading is normal
     */
    _checkHealthNormal(data) {
        // Define normal ranges based on reading type
        const normalRanges = {
            'BLOOD_PRESSURE': { min: 90, max: 140 }, // mmHg
            'HEART_RATE': { min: 60, max: 100 },    // bpm
            'GLUCOSE': { min: 70, max: 100 },       // mg/dL
            'TEMPERATURE': { min: 36.5, max: 37.5 } // Celsius
        };

        const range = normalRanges[data.readingType];
        if (!range) return true; // Unknown type, assume normal

        return data.value >= range.min && data.value <= range.max;
    }

    checkHealthNormal(reading) {
        // Implement health threshold checking
        const thresholds = {
            'blood_pressure': { systolic: 140, diastolic: 90 },
            'heart_rate': { max: 100, min: 60 },
            'glucose': { max: 200, min: 70 },
            'temperature': { max: 38, min: 36 }
        };

        const threshold = thresholds[reading.readingType];
        if (!threshold) return true; // Unknown type, assume normal

        // Example: check blood pressure
        if (reading.readingType === 'blood_pressure') {
            return reading.value.systolic < threshold.systolic && 
                   reading.value.diastolic < threshold.diastolic;
        }

        return true; // Placeholder
    }

    /**
     * Start the server
     */
    start(port = 5000) {
        this.server.listen(port, () => {
            console.log(`\nHealthcare Platform Server running on port ${port}`);
            console.log(`Health Check: http://localhost:${port}/health`);
            console.log(`Metrics: http://localhost:${port}/metrics`);
            console.log(`WebSocket: ws://localhost:${port}\n`);
        });
    }
}

// ==================== USAGE ====================

async function main() {
    const app = express();

    // Middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // CORS
    const cors = require('cors');
    app.use(cors({
        origin: process.env.CORS_ORIGIN || '*'
    }));

    // Initialize platform
    const platform = new HealthcarePlatform(app);
    await platform.initialize();

    // Start server
    platform.start(process.env.PORT || 5000);
}

// Start application (only when run directly)
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = HealthcarePlatform;
