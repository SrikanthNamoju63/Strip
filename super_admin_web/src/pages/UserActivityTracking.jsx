import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Calendar, User, MapPin, Smartphone, SearchIcon, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { getUserActivity, exportActivityLog } from '../services/api';

const UserActivityTracking = () => {
    const [activities, setActivities] = useState([]);
    const [filteredActivities, setFilteredActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [dateRange, setDateRange] = useState('7days');
    const [selectedUser, setSelectedUser] = useState(null);

    const activityTypes = [
        { value: 'all', label: 'All Activities' },
        { value: 'login', label: 'Login/Logout' },
        { value: 'booking', label: 'Appointments' },
        { value: 'payment', label: 'Payments' },
        { value: 'profile', label: 'Profile Updates' },
        { value: 'document', label: 'Document Upload' },
        { value: 'refund', label: 'Refunds' }
    ];

    useEffect(() => {
        loadUserActivity();
    }, [dateRange]);

    useEffect(() => {
        filterActivities();
    }, [activities, searchTerm, filterType]);

    const loadUserActivity = async () => {
        setLoading(true);
        try {
            const data = await getUserActivity(dateRange);
            setActivities(data);
        } catch (error) {
            console.error('Failed to load activity:', error);
            toast.error('Failed to load activity data');
        } finally {
            setLoading(false);
        }
    };

    const filterActivities = () => {
        let filtered = activities;

        if (filterType !== 'all') {
            filtered = filtered.filter(a => a.type === filterType);
        }

        if (searchTerm) {
            filtered = filtered.filter(a =>
                a.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.action?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredActivities(filtered);
    };

    const getActivityIcon = (type) => {
        const icons = {
            login: '🔑',
            logout: '🚪',
            booking: '📅',
            payment: '💳',
            profile: '👤',
            document: '📄',
            refund: '💰'
        };
        return icons[type] || '📌';
    };

    const getActivityColor = (type) => {
        const colors = {
            login: 'from-blue-500 to-blue-600',
            logout: 'from-slate-500 to-slate-600',
            booking: 'from-indigo-500 to-indigo-600',
            payment: 'from-emerald-500 to-emerald-600',
            profile: 'from-purple-500 to-purple-600',
            document: 'from-orange-500 to-orange-600',
            refund: 'from-red-500 to-red-600'
        };
        return colors[type] || 'from-slate-500 to-slate-600';
    };

    const handleExportActivity = async () => {
        try {
            await exportActivityLog(filterType, dateRange);
            toast.success('Activity log exported');
        } catch (error) {
            toast.error('Export failed');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="loader"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">User Activity Tracking</h1>
                    <p className="text-slate-500 mt-1">Monitor all user actions and interactions</p>
                </div>
                <button
                    onClick={handleExportActivity}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                    Export Log
                </button>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by email or user ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>

                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        {activityTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                    </select>

                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="today">Today</option>
                        <option value="7days">Last 7 Days</option>
                        <option value="30days">Last 30 Days</option>
                        <option value="90days">Last 90 Days</option>
                    </select>
                </div>
                <p className="text-sm text-slate-600">
                    Showing <span className="font-bold text-slate-900">{filteredActivities.length}</span> activities
                </p>
            </div>

            {/* Activity Timeline */}
            <div className="space-y-4">
                {filteredActivities.length > 0 ? (
                    filteredActivities.map((activity, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow hover:cursor-pointer"
                            onClick={() => setSelectedUser(activity)}
                        >
                            <div className="flex gap-4">
                                {/* Timeline Dot */}
                                <div className="flex flex-col items-center">
                                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getActivityColor(activity.type)} flex items-center justify-center text-white text-lg shadow-md`}>
                                        {getActivityIcon(activity.type)}
                                    </div>
                                    <div className="w-1 h-8 bg-slate-200 mt-2"></div>
                                </div>

                                {/* Activity Details */}
                                <div className="flex-1 pt-2">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-slate-900">{activity.action}</h4>
                                            <p className="text-sm text-slate-600">{activity.userEmail}</p>
                                        </div>
                                        <span className="text-xs text-slate-500 whitespace-nowrap ml-2">
                                            {format(new Date(activity.timestamp), 'MMM dd, HH:mm')}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-3 mt-3 text-xs">
                                        {activity.ipAddress && (
                                            <span className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-50 rounded-lg text-slate-700">
                                                <MapPin size={14} /> {activity.ipAddress}
                                            </span>
                                        )}
                                        {activity.deviceType && (
                                            <span className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-50 rounded-lg text-slate-700">
                                                <Smartphone size={14} /> {activity.deviceType}
                                            </span>
                                        )}
                                        {activity.status && (
                                            <span className={`px-2 py-1.5 rounded-lg font-medium ${
                                                activity.status === 'success'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {activity.status}
                                            </span>
                                        )}
                                    </div>

                                    {activity.details && (
                                        <p className="text-xs text-slate-500 mt-2 italic">{activity.details}</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                        <Activity className="mx-auto text-slate-300 mb-3" size={48} />
                        <p className="text-slate-500 font-medium">No activities found</p>
                    </div>
                )}
            </div>

            {/* User Details Modal */}
            {selectedUser && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedUser(null)}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
                    >
                        <h3 className="text-2xl font-bold text-slate-900 mb-6">Activity Details</h3>

                        <div className="space-y-4 mb-6">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-semibold">User Email</p>
                                <p className="text-slate-900 font-medium mt-1">{selectedUser.userEmail}</p>
                            </div>

                            <div>
                                <p className="text-xs text-slate-500 uppercase font-semibold">Action</p>
                                <p className="text-slate-900 font-medium mt-1">{selectedUser.action}</p>
                            </div>

                            <div>
                                <p className="text-xs text-slate-500 uppercase font-semibold">Timestamp</p>
                                <p className="text-slate-900 font-medium mt-1">
                                    {format(new Date(selectedUser.timestamp), 'PPpp')}
                                </p>
                            </div>

                            {selectedUser.ipAddress && (
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-semibold">IP Address</p>
                                    <p className="text-slate-900 font-medium mt-1">{selectedUser.ipAddress}</p>
                                </div>
                            )}

                            {selectedUser.deviceType && (
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Device</p>
                                    <p className="text-slate-900 font-medium mt-1">{selectedUser.deviceType}</p>
                                </div>
                            )}

                            {selectedUser.status && (
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Status</p>
                                    <p className={`font-medium mt-1 ${selectedUser.status === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {selectedUser.status}
                                    </p>
                                </div>
                            )}

                            {selectedUser.details && (
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Details</p>
                                    <p className="text-slate-600 text-sm mt-1">{selectedUser.details}</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setSelectedUser(null)}
                            className="w-full px-4 py-2.5 bg-slate-200 text-slate-900 rounded-xl hover:bg-slate-300 transition-colors font-medium"
                        >
                            Close
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
};

export default UserActivityTracking;
