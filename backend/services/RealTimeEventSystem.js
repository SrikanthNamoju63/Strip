/**
 * Real-Time Event System
 * Manages real-time updates across all database tables
 * WebSocket integration for live notifications and data sync
 */

const EventEmitter = require('events');
const mongoose = require('mongoose');

class RealTimeEventSystem extends EventEmitter {
    constructor(io) {
        super();
        this.io = io;
        this.activeConnections = new Map(); // userId -> socket connections
        this.modelWatchers = new Map(); // model watchers for change streams
        this.eventQueue = [];
        this.maxQueueSize = 1000;
    }

    /**
     * Initialize change stream watchers for all collections
     */
    initializeChangeStreams(models) {
        // Appointment changes - notify doctor and user
        this.watchCollection(models.Appointment, (changeEvent) => {
            this.handleAppointmentChange(changeEvent);
        });

        // Payment changes - notify user, doctor, admin
        this.watchCollection(models.Payment, (changeEvent) => {
            this.handlePaymentChange(changeEvent);
        });

        // Notification insertion - send to user immediately
        this.watchCollection(models.Notification, (changeEvent) => {
            this.handleNotificationChange(changeEvent);
        });

        // Health reading changes - trigger analysis
        this.watchCollection(models.HealthReading, (changeEvent) => {
            this.handleHealthReadingChange(changeEvent);
        });

        // Doctor availability changes
        this.watchCollection(models.DoctorAvailability, (changeEvent) => {
            this.handleAvailabilityChange(changeEvent);
        });

        // Settlement changes
        this.watchCollection(models.Settlement, (changeEvent) => {
            this.handleSettlementChange(changeEvent);
        });

        // User wallet changes
        this.watchCollection(models.UserWallet, (changeEvent) => {
            this.handleWalletChange(changeEvent);
        });

        // Support ticket changes
        this.watchCollection(models.SupportTicket, (changeEvent) => {
            this.handleTicketChange(changeEvent);
        });

        console.log('✅ Real-time change streams initialized');
    }

    /**
     * Watch a collection for changes
     */
    watchCollection(model, callback) {
        try {
            const changeStream = model.collection.watch(
                [
                    {
                        $match: {
                            operationType: { $in: ['insert', 'update', 'delete', 'replace'] }
                        }
                    }
                ],
                { fullDocument: 'updateLookup' }
            );

            changeStream.on('change', (changeEvent) => {
                try {
                    callback(changeEvent);
                } catch (error) {
                    console.error('Error in change stream callback:', error);
                }
            });

            changeStream.on('error', (error) => {
                console.error('Change stream error:', error);
            });

            this.modelWatchers.set(model.collection.name, changeStream);
        } catch (error) {
            console.error(`Failed to setup watcher for ${model.collection.name}:`, error);
        }
    }

    /**
     * Handle appointment changes
     */
    async handleAppointmentChange(changeEvent) {
        const { operationType, fullDocument, updateDescription } = changeEvent;

        if (operationType === 'insert') {
            // New appointment created
            this.emitToUser(fullDocument.userId, 'appointment_created', {
                appointmentId: fullDocument._id,
                doctorId: fullDocument.doctorId,
                date: fullDocument.appointmentDate,
                time: fullDocument.appointmentTime
            });

            this.emitToDoctor(fullDocument.doctorId, 'new_appointment', {
                appointmentId: fullDocument._id,
                userId: fullDocument.userId,
                date: fullDocument.appointmentDate
            });
        }

        if (operationType === 'update') {
            const statusChange = updateDescription?.updatedFields?.status;
            if (statusChange) {
                // Notify both parties of status change
                this.emitToUser(fullDocument.userId, 'appointment_status_changed', {
                    appointmentId: fullDocument._id,
                    status: statusChange,
                    timestamp: new Date()
                });

                this.emitToDoctor(fullDocument.doctorId, 'appointment_status_changed', {
                    appointmentId: fullDocument._id,
                    status: statusChange,
                    timestamp: new Date()
                });

                // If cancelled, trigger refund notification
                if (statusChange.includes('CANCELLED')) {
                    this.emitEvent('refund_triggered', {
                        appointmentId: fullDocument._id,
                        userId: fullDocument.userId,
                        reason: `Appointment ${statusChange}`
                    });
                }
            }
        }

        if (operationType === 'delete') {
            // Appointment deleted (soft or hard)
            this.emitToUser(fullDocument.userId, 'appointment_deleted', {
                appointmentId: fullDocument._id
            });
        }

        this.queueEvent('appointment_change', changeEvent);
    }

    /**
     * Handle payment changes
     */
    async handlePaymentChange(changeEvent) {
        const { operationType, fullDocument, updateDescription } = changeEvent;

        if (operationType === 'insert' && fullDocument.paymentStatus === 'PENDING') {
            // New payment initiated
            this.emitToUser(fullDocument.userId, 'payment_initiated', {
                paymentId: fullDocument._id,
                amount: fullDocument.totalAmount,
                orderId: fullDocument.razorpayOrderId
            });
        }

        if (operationType === 'update') {
            const statusChange = updateDescription?.updatedFields?.paymentStatus;
            
            if (statusChange === 'CAPTURED') {
                // Payment successful - notify user, doctor, and admin
                this.emitToUser(fullDocument.userId, 'payment_successful', {
                    paymentId: fullDocument._id,
                    amount: fullDocument.totalAmount,
                    appointmentId: fullDocument.appointmentId
                });

                this.emitToDoctor(fullDocument.doctorId, 'payment_received', {
                    paymentId: fullDocument._id,
                    amount: fullDocument.doctorAmount,
                    userName: fullDocument.userId
                });

                this.emitEvent('payment_captured', {
                    paymentId: fullDocument._id,
                    doctorId: fullDocument.doctorId,
                    userId: fullDocument.userId,
                    amount: fullDocument.totalAmount
                });
            }

            if (statusChange === 'FAILED') {
                // Payment failed
                this.emitToUser(fullDocument.userId, 'payment_failed', {
                    paymentId: fullDocument._id,
                    reason: fullDocument.errorMessage || 'Payment processing failed'
                });
            }

            if (statusChange === 'REFUNDED') {
                // Refund processed
                this.emitToUser(fullDocument.userId, 'refund_processed', {
                    paymentId: fullDocument._id,
                    refundAmount: fullDocument.refundAmount,
                    appointmentId: fullDocument.appointmentId
                });
            }
        }

        this.queueEvent('payment_change', changeEvent);
    }

    /**
     * Handle notification creation/update
     */
    async handleNotificationChange(changeEvent) {
        const { operationType, fullDocument } = changeEvent;

        if (operationType === 'insert') {
            // New notification - send to user immediately
            const recipientId = fullDocument.recipientId || fullDocument.userId;
            
            this.emitToUser(recipientId, 'new_notification', {
                notificationId: fullDocument._id,
                title: fullDocument.title,
                message: fullDocument.message,
                type: fullDocument.type,
                timestamp: fullDocument.createdAt
            });

            // Broadcast to admin dashboard if system notification
            if (fullDocument.type === 'SYSTEM' || fullDocument.type === 'WARNING') {
                this.emitEvent('system_notification', {
                    notificationId: fullDocument._id,
                    title: fullDocument.title,
                    message: fullDocument.message,
                    severity: fullDocument.type
                });
            }
        }

        if (operationType === 'update' && fullDocument.read === true) {
            // Notification marked as read
            this.emitEvent('notification_read', {
                notificationId: fullDocument._id,
                userId: fullDocument.recipientId
            });
        }

        this.queueEvent('notification_change', changeEvent);
    }

    /**
     * Handle health reading changes
     */
    async handleHealthReadingChange(changeEvent) {
        const { operationType, fullDocument } = changeEvent;

        if (operationType === 'insert') {
            // New health reading - check if abnormal
            this.emitToUser(fullDocument.userId, 'health_reading_recorded', {
                readingId: fullDocument._id,
                readingType: fullDocument.readingType,
                value: fullDocument.value,
                unit: fullDocument.unit,
                isNormal: fullDocument.isNormal,
                timestamp: fullDocument.createdAt
            });

            // If abnormal, send alert
            if (!fullDocument.isNormal) {
                this.emitToUser(fullDocument.userId, 'health_alert', {
                    readingId: fullDocument._id,
                    readingType: fullDocument.readingType,
                    severity: this.calculateSeverity(fullDocument),
                    message: `Your ${fullDocument.readingType} reading is abnormal. Please consult a doctor.`
                });
            }
        }

        this.queueEvent('health_reading_change', changeEvent);
    }

    /**
     * Handle doctor availability changes
     */
    async handleAvailabilityChange(changeEvent) {
        const { operationType, fullDocument } = changeEvent;

        if (operationType === 'update') {
            // Broadcast availability change to all users
            this.emitEvent('doctor_availability_updated', {
                doctorId: fullDocument.doctorId,
                isActive: fullDocument.isActive,
                updatedAt: new Date()
            });

            // Alert users with pending appointments
            const Appointment = require('../models/Appointment');
            const Notification = require('../models/Notification');
            
            const userAppointments = await Appointment.find({
                doctorId: fullDocument.doctorId,
                status: 'CONFIRMED'
            }).distinct('userId');

            for (const userId of userAppointments) {
                await Notification.create({
                    recipientId: userId,
                    recipientType: 'user',
                    title: 'Doctor Availability Updated',
                    message: 'Your doctor\'s availability has been updated. Check appointment status.'
                });
            }
        }

        this.queueEvent('availability_change', changeEvent);
    }

    /**
     * Handle settlement updates
     */
    async handleSettlementChange(changeEvent) {
        const { operationType, fullDocument, updateDescription } = changeEvent;

        if (operationType === 'insert') {
            // New settlement created
            this.emitToDoctor(fullDocument.doctorId, 'settlement_created', {
                settlementId: fullDocument._id,
                amount: fullDocument.netAmount,
                period: `${fullDocument.settlementPeriod.startDate} to ${fullDocument.settlementPeriod.endDate}`,
                appointmentCount: fullDocument.appointmentCount
            });
        }

        if (operationType === 'update') {
            const statusChange = updateDescription?.updatedFields?.status;
            
            if (statusChange === 'COMPLETED') {
                this.emitToDoctor(fullDocument.doctorId, 'settlement_completed', {
                    settlementId: fullDocument._id,
                    amount: fullDocument.netAmount,
                    completedAt: new Date()
                });
            }
        }

        this.queueEvent('settlement_change', changeEvent);
    }

    /**
     * Handle wallet changes
     */
    async handleWalletChange(changeEvent) {
        const { operationType, fullDocument, updateDescription } = changeEvent;

        if (operationType === 'update') {
            const balanceChange = updateDescription?.updatedFields?.availableBalance;
            
            if (balanceChange !== undefined) {
                this.emitToUser(fullDocument.userId, 'wallet_updated', {
                    walletId: fullDocument._id,
                    availableBalance: fullDocument.availableBalance,
                    totalBalance: fullDocument.totalBalance,
                    updatedAt: new Date()
                });
            }
        }

        this.queueEvent('wallet_change', changeEvent);
    }

    /**
     * Handle support ticket changes
     */
    async handleTicketChange(changeEvent) {
        const { operationType, fullDocument, updateDescription } = changeEvent;

        if (operationType === 'insert') {
            // New ticket created - notify assigned admin
            if (fullDocument.assignedTo) {
                this.emitToAdmin(fullDocument.assignedTo, 'new_ticket', {
                    ticketId: fullDocument._id,
                    ticketNumber: fullDocument.ticketId,
                    subject: fullDocument.subject,
                    priority: fullDocument.priority,
                    createdAt: fullDocument.createdAt
                });
            }
        }

        if (operationType === 'update') {
            // Notify user/doctor of status change
            const statusChange = updateDescription?.updatedFields?.status;
            if (statusChange) {
                const recipientId = fullDocument.userId || fullDocument.doctorId;
                this.emitToUser(recipientId, 'ticket_status_changed', {
                    ticketId: fullDocument._id,
                    status: statusChange,
                    updatedAt: new Date()
                });
            }

            // Notify of new message
            const newMessages = updateDescription?.updatedFields?.messages;
            if (newMessages && newMessages.length > 0) {
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.senderRole === 'ADMIN') {
                    const recipientId = fullDocument.userId || fullDocument.doctorId;
                    this.emitToUser(recipientId, 'new_ticket_message', {
                        ticketId: fullDocument._id,
                        message: lastMessage.message,
                        timestamp: lastMessage.sentAt
                    });
                }
            }
        }

        this.queueEvent('ticket_change', changeEvent);
    }

    // ==================== EVENT EMISSION ====================

    /**
     * Emit event to specific user
     */
    emitToUser(userId, eventName, data) {
        const userConnections = this.activeConnections.get(userId.toString());
        if (userConnections && userConnections.length > 0) {
            userConnections.forEach(socket => {
                socket.emit(eventName, {
                    ...data,
                    timestamp: new Date()
                });
            });
        }
    }

    /**
     * Emit event to doctor
     */
    emitToDoctor(doctorId, eventName, data) {
        this.emitToUser(doctorId, eventName, data);
    }

    /**
     * Emit event to admin
     */
    emitToAdmin(adminId, eventName, data) {
        this.emitToUser(adminId, eventName, data);
    }

    /**
     * Emit event to all connected users
     */
    emitEvent(eventName, data) {
        this.io.emit(eventName, {
            ...data,
            timestamp: new Date()
        });
    }

    /**
     * Broadcast to room
     */
    emitToRoom(room, eventName, data) {
        this.io.to(room).emit(eventName, {
            ...data,
            timestamp: new Date()
        });
    }

    // ==================== CONNECTION MANAGEMENT ====================

    /**
     * Register user connection
     */
    registerUserConnection(userId, socket) {
        const connections = this.activeConnections.get(userId.toString()) || [];
        connections.push(socket);
        this.activeConnections.set(userId.toString(), connections);

        // Notify online status
        this.emitEvent('user_online', { userId, timestamp: new Date() });
    }

    /**
     * Unregister user connection
     */
    unregisterUserConnection(userId, socket) {
        const connections = this.activeConnections.get(userId.toString()) || [];
        const index = connections.indexOf(socket);
        if (index > -1) {
            connections.splice(index, 1);
        }

        if (connections.length === 0) {
            this.activeConnections.delete(userId.toString());
            // Notify offline status
            this.emitEvent('user_offline', { userId, timestamp: new Date() });
        } else {
            this.activeConnections.set(userId.toString(), connections);
        }
    }

    /**
     * Check if user is online
     */
    isUserOnline(userId) {
        const connections = this.activeConnections.get(userId.toString());
        return connections && connections.length > 0;
    }

    // ==================== EVENT QUEUE ====================

    /**
     * Queue event for batch processing
     */
    queueEvent(eventName, eventData) {
        if (this.eventQueue.length >= this.maxQueueSize) {
            this.eventQueue.shift();
        }
        this.eventQueue.push({
            eventName,
            eventData,
            timestamp: new Date()
        });
    }

    /**
     * Get event history
     */
    getEventHistory(limit = 100) {
        return this.eventQueue.slice(-limit);
    }

    /**
     * Clear old events
     */
    clearOldEvents(maxAge = 60 * 60 * 1000) {
        const cutoffTime = Date.now() - maxAge;
        this.eventQueue = this.eventQueue.filter(
            e => e.timestamp.getTime() > cutoffTime
        );
    }

    // ==================== HELPER METHODS ====================

    calculateSeverity(reading) {
        // Implement severity calculation
        return 'MEDIUM'; // Placeholder
    }

    /**
     * Close all change streams
     */
    closeAllWatchers() {
        this.modelWatchers.forEach((watcher) => {
            watcher.close();
        });
        this.modelWatchers.clear();
        console.log('✅ All watchers closed');
    }
}

module.exports = RealTimeEventSystem;
