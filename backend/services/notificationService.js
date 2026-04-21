/**
 * Notification Service
 * Handles sending notifications to doctors and users via Socket.IO + Database
 */

const Notification = require('../models/Notification');
const socketManager = require('../utils/socket');

/**
 * Send notification to a doctor via Socket.IO
 */
const sendToDoctor = async (doctorId, title, message, type = 'INFO') => {
    try {
        // Save to database
        const notification = new Notification({
            recipientId: doctorId,
            recipientType: 'doctor',
            title,
            message,
            type,
            read: false,
            createdAt: new Date()
        });
        await notification.save();

        // Send via Socket.IO
        socketManager.emit(`doctor_${doctorId}`, 'notification', {
            _id: notification._id,
            title,
            message,
            type,
            timestamp: new Date().toISOString()
        });

        return notification;
    } catch (error) {
        console.error('sendToDoctor notification error:', error.message);
        // Don't throw - notifications should not break main flow
    }
};

/**
 * Send notification to a user via Socket.IO
 */
const sendToUser = async (userId, title, message, type = 'INFO') => {
    try {
        const notification = new Notification({
            recipientId: userId,
            recipientType: 'user',
            title,
            message,
            type,
            read: false,
            createdAt: new Date()
        });
        await notification.save();

        socketManager.emit(`user_${userId}`, 'notification', {
            _id: notification._id,
            title,
            message,
            type,
            timestamp: new Date().toISOString()
        });

        return notification;
    } catch (error) {
        console.error('sendToUser notification error:', error.message);
    }
};

/**
 * Send notification to all admins
 */
const sendToAdmin = async (title, message, type = 'INFO') => {
    try {
        const notification = new Notification({
            recipientType: 'admin',
            title,
            message,
            type,
            read: false,
            createdAt: new Date()
        });
        await notification.save();

        socketManager.emit('admin', 'notification', {
            _id: notification._id,
            title,
            message,
            type,
            timestamp: new Date().toISOString()
        });

        return notification;
    } catch (error) {
        console.error('sendToAdmin notification error:', error.message);
    }
};

/**
 * Broadcast to all connected clients
 */
const broadcastAll = async (title, message, type = 'INFO') => {
    try {
        socketManager.broadcast('notification', {
            title,
            message,
            type,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('broadcastAll error:', error.message);
    }
};

module.exports = {
    sendToDoctor,
    sendToUser,
    sendToAdmin,
    broadcastAll
};
