/**
 * Notification Service
 * Handles push notifications, emails, and SMS
 */

const Notification = require('../../models/Notification');
const User = require('../../models/User');
const Doctor = require('../../models/Doctor');

// In-memory store for socket connections (would use Redis in production)
const connectedUsers = new Map();

/**
 * Register user socket connection
 */
const registerSocket = (userId, socket) => {
  connectedUsers.set(userId.toString(), socket);
};

/**
 * Unregister user socket
 */
const unregisterSocket = (userId) => {
  connectedUsers.delete(userId.toString());
};

/**
 * Send real-time notification via socket
 */
const sendRealtimeNotification = (userId, notification) => {
  const socket = connectedUsers.get(userId.toString());
  if (socket) {
    socket.emit('notification', notification);
    return true;
  }
  return false;
};

/**
 * Create and send notification
 */
const sendNotification = async ({
  userId,
  userType = 'USER',
  title,
  message,
  type = 'GENERAL',
  data = {},
  sendRealtime = true,
  sendEmail = false,
  sendSMS = false
}) => {
  try {
    // Save to database
    const notification = new Notification({
      userId,
      userType,
      title,
      message,
      type,
      data,
      isRead: false,
      createdAt: new Date()
    });

    await notification.save();

    // Send real-time if user is connected
    if (sendRealtime) {
      sendRealtimeNotification(userId, {
        id: notification._id,
        title,
        message,
        type,
        data,
        createdAt: notification.createdAt
      });
    }

    // Send email if requested
    if (sendEmail) {
      await sendEmailNotification(userId, userType, title, message);
    }

    // Send SMS if requested
    if (sendSMS) {
      await sendSMSNotification(userId, userType, message);
    }

    return { success: true, notification };
  } catch (error) {
    console.error('Send notification error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send bulk notifications
 */
const sendBulkNotifications = async ({
  userIds,
  userType = 'USER',
  title,
  message,
  type = 'GENERAL',
  data = {}
}) => {
  try {
    const notifications = userIds.map(userId => ({
      userId,
      userType,
      title,
      message,
      type,
      data,
      isRead: false,
      createdAt: new Date()
    }));

    await Notification.insertMany(notifications);

    // Send real-time to connected users
    userIds.forEach(userId => {
      sendRealtimeNotification(userId, {
        title,
        message,
        type,
        data,
        bulk: true
      });
    });

    return { success: true, count: notifications.length };
  } catch (error) {
    console.error('Send bulk notification error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send email notification (placeholder - integrate with email service)
 */
const sendEmailNotification = async (userId, userType, subject, body) => {
  try {
    let user;
    if (userType === 'USER') {
      user = await User.findById(userId);
    } else if (userType === 'DOCTOR') {
      user = await Doctor.findById(userId);
    }

    if (!user || !user.email) return false;

    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    console.log(`[EMAIL] To: ${user.email}, Subject: ${subject}`);
    
    return true;
  } catch (error) {
    console.error('Send email error:', error);
    return false;
  }
};

/**
 * Send SMS notification (placeholder - integrate with SMS service)
 */
const sendSMSNotification = async (userId, userType, message) => {
  try {
    let user;
    if (userType === 'USER') {
      user = await User.findById(userId);
    } else if (userType === 'DOCTOR') {
      user = await Doctor.findById(userId);
    }

    if (!user || !user.phone) return false;

    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log(`[SMS] To: ${user.phone}, Message: ${message}`);
    
    return true;
  } catch (error) {
    console.error('Send SMS error:', error);
    return false;
  }
};

/**
 * Get user notifications
 */
const getUserNotifications = async (userId, { page = 1, limit = 20, unreadOnly = false }) => {
  try {
    const query = { userId };
    if (unreadOnly) query.isRead = false;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    return {
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        unreadCount
      }
    };
  } catch (error) {
    console.error('Get notifications error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return { success: false, error: 'Notification not found' };
    }

    return { success: true, notification };
  } catch (error) {
    console.error('Mark as read error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return { success: true, modifiedCount: result.modifiedCount };
  } catch (error) {
    console.error('Mark all as read error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete notification
 */
const deleteNotification = async (notificationId, userId) => {
  try {
    const result = await Notification.findOneAndDelete({
      _id: notificationId,
      userId
    });

    if (!result) {
      return { success: false, error: 'Notification not found' };
    }

    return { success: true, message: 'Notification deleted' };
  } catch (error) {
    console.error('Delete notification error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send appointment reminder
 */
const sendAppointmentReminder = async (appointment) => {
  const { userId, doctorId, appointmentDate, timeSlot } = appointment;
  
  // Notify user
  await sendNotification({
    userId,
    userType: 'USER',
    title: 'Upcoming Appointment Reminder',
    message: `You have an appointment scheduled for ${new Date(appointmentDate).toLocaleDateString()} at ${timeSlot}`,
    type: 'APPOINTMENT',
    data: { appointmentId: appointment._id }
  });

  // Notify doctor
  await sendNotification({
    userId: doctorId,
    userType: 'DOCTOR',
    title: 'Appointment Reminder',
    message: `You have an appointment scheduled for ${new Date(appointmentDate).toLocaleDateString()} at ${timeSlot}`,
    type: 'APPOINTMENT',
    data: { appointmentId: appointment._id }
  });
};

/**
 * Send payment confirmation
 */
const sendPaymentConfirmation = async (payment) => {
  const { userId, amount, status } = payment;
  
  if (status === 'completed') {
    await sendNotification({
      userId,
      userType: 'USER',
      title: 'Payment Successful',
      message: `Your payment of $${amount} has been processed successfully.`,
      type: 'PAYMENT',
      data: { paymentId: payment._id }
    });
  }
};

module.exports = {
  registerSocket,
  unregisterSocket,
  sendRealtimeNotification,
  sendNotification,
  sendBulkNotifications,
  sendEmailNotification,
  sendSMSNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendAppointmentReminder,
  sendPaymentConfirmation
};
