import React, { useState, useEffect } from 'react';
import { getDoctorNotifications, markNotificationAsRead } from '../services/api';
import { motion } from 'framer-motion';
import { Bell, CheckCircle, X, Calendar, MessageSquare, AlertCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import useRealTime from '../hooks/useRealTime';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});

    useEffect(() => {
        fetchNotifications();
    }, [unreadOnly, page]);

    // Real-time: auto-refresh when new notifications arrive
    useRealTime({
        events: ['notification', 'appointment_update'],
        refetch: fetchNotifications,
    });

    async function fetchNotifications() {
        try {
            setLoading(true);
            const data = await getDoctorNotifications(page, 20, unreadOnly);
            setNotifications(data.data?.notifications || []);
            setPagination(data.data?.pagination || {});
        } catch (err) {
            console.error(err);
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await markNotificationAsRead(notificationId);
            setNotifications(notifications.map(n =>
                n._id === notificationId ? { ...n, isRead: true } : n
            ));
        } catch (err) {
            toast.error('Failed to mark notification as read');
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'APPOINTMENT_BOOKED':
                return <Calendar className="text-blue-500" size={24} />;
            case 'APPOINTMENT_CANCELLED':
                return <X className="text-red-500" size={24} />;
            case 'APPOINTMENT_RESCHEDULED':
                return <Calendar className="text-orange-500" size={24} />;
            case 'RATING_RECEIVED':
                return <MessageSquare className="text-yellow-500" size={24} />;
            case 'PAYMENT_RECEIVED':
                return <AlertCircle className="text-green-500" size={24} />;
            default:
                return <Info className="text-gray-500" size={24} />;
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'APPOINTMENT_BOOKED':
                return 'bg-blue-50 border-blue-200';
            case 'APPOINTMENT_CANCELLED':
                return 'bg-red-50 border-red-200';
            case 'APPOINTMENT_RESCHEDULED':
                return 'bg-orange-50 border-orange-200';
            case 'RATING_RECEIVED':
                return 'bg-yellow-50 border-yellow-200';
            case 'PAYMENT_RECEIVED':
                return 'bg-green-50 border-green-200';
            default:
                return 'bg-gray-50 border-gray-200';
        }
    };

    if (loading && notifications.length === 0) {
        return (
            <div className="flex justify-center items-center h-full min-h-[50vh]">
                <div className="loader"></div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                        <Bell className="text-primary" size={32} />
                        Notifications
                    </h1>
                    <p className="text-gray-500 mt-2">
                        {pagination.unread || 0} unread notification{(pagination.unread || 0) !== 1 ? 's' : ''}
                    </p>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={unreadOnly}
                        onChange={(e) => {
                            setUnreadOnly(e.target.checked);
                            setPage(1);
                        }}
                        className="w-5 h-5 rounded border-gray-300"
                    />
                    <span className="font-semibold text-gray-700">Unread Only</span>
                </label>
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
                {notifications.length === 0 ? (
                    <div className="bg-gray-50 rounded-2xl p-12 text-center border border-gray-200">
                        <Bell className="mx-auto text-gray-300 mb-4" size={48} />
                        <p className="text-gray-500 text-lg">
                            {unreadOnly ? 'No unread notifications' : 'No notifications yet'}
                        </p>
                    </div>
                ) : (
                    notifications.map((notification, index) => (
                        <motion.div
                            key={notification._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`rounded-2xl shadow-md border-2 p-5 cursor-pointer transition hover:shadow-lg ${
                                notification.isRead
                                    ? 'bg-white border-gray-200'
                                    : `${getNotificationColor(notification.type)} border-current`
                            }`}
                            onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="mt-1">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-gray-800">
                                                {notification.title}
                                            </h3>
                                            {!notification.isRead && (
                                                <span className="inline-block w-2 h-2 bg-primary rounded-full"></span>
                                            )}
                                        </div>
                                        <p className="text-gray-700 text-sm leading-relaxed">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            {new Date(notification.createdAt).toLocaleDateString()}{' '}
                                            {new Date(notification.createdAt).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkAsRead(notification._id);
                                    }}
                                    className={`p-2 rounded-lg transition flex-shrink-0 ${
                                        notification.isRead
                                            ? 'text-gray-300 hover:bg-gray-100'
                                            : 'text-primary hover:bg-primary/10'
                                    }`}
                                >
                                    <CheckCircle size={20} />
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                        Previous
                    </button>
                    <div className="flex items-center gap-2">
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`w-10 h-10 rounded-lg font-semibold transition ${
                                    page === p
                                        ? 'bg-primary text-white'
                                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                        disabled={page === pagination.totalPages}
                        className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                        Next
                    </button>
                </div>
            )}
        </motion.div>
    );
};

export default Notifications;
