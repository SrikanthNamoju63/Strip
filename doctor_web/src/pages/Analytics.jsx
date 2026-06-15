import React, { useState, useEffect } from 'react';
import { getDoctorProfile, getDoctorStats } from '../services/api';
import { motion } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Calendar, CheckCircle, Star, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Analytics = () => {
    const { user } = useAuth();

    if (user?.role === 'RECEPTIONIST' || user?.role === 'NURSE') {
        return <Navigate to="/" replace />;
    }

    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30days');

    useEffect(() => {
        fetchData();
    }, [period]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const prof = await getDoctorProfile();
            setProfile(prof);

            const statsData = await getDoctorStats(prof._id, period);
            setStats(statsData);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[50vh]">
                <div className="loader"></div>
            </div>
        );
    }

    // Mock data removed - using stats from backend

    const StatCard = ({ icon: Icon, label, value, change, unit = '' }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                    <Icon className="text-primary" size={24} />
                </div>
                {change > 0 && (
                    <span className="text-green-500 text-sm font-semibold flex items-center gap-1">
                        +{change}% <TrendingUp size={16} />
                    </span>
                )}
                {change < 0 && (
                    <span className="text-red-500 text-sm font-semibold">
                        {change}%
                    </span>
                )}
            </div>
            <p className="text-gray-500 text-sm font-medium mb-1">{label}</p>
            <p className="text-3xl font-bold text-gray-800">
                {value}{unit}
            </p>
        </motion.div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto space-y-8"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Analytics & Performance</h1>
                    <p className="text-gray-500 mt-2">Track your appointments, earnings, and patient satisfaction</p>
                </div>
                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="px-6 py-3 border border-gray-300 rounded-lg font-semibold focus:ring-2 focus:ring-primary outline-none"
                >
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="90days">Last 90 Days</option>
                </select>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={Calendar}
                    label="Total Appointments"
                    value={stats?.totalAppointments || 0}
                    change={5}
                />
                <StatCard
                    icon={CheckCircle}
                    label="Completed"
                    value={stats?.completedAppointments || 0}
                    change={8}
                />
                <StatCard
                    icon={Star}
                    label="Average Rating"
                    value={stats?.averageRating?.toFixed(1) || '0'}
                    unit="/5"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Completion Rate"
                    value={stats?.completionRate || '0'}
                    unit="%"
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Appointments Trend */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
                >
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Appointments Trend</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stats?.appointmentTrend || []}>
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend />
                            <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="cancelled" fill="#ef4444" name="Cancelled" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Revenue Trend */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
                >
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Revenue Trend</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={stats?.revenueTrend || []}>
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip formatter={(value) => `₹${value}`} />
                            <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Appointment Status */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
                >
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Appointment Status Distribution</h2>
                    <div className="flex items-center justify-center h-[300px]">
                        {stats?.statusDistribution?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.statusDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stats.statusDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend layout="vertical" align="right" verticalAlign="middle" />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-gray-400 text-center">No data available</div>
                        )}
                    </div>
                </motion.div>

                {/* Summary Stats */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
                >
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Performance Summary</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600 font-semibold">Total Revenue</span>
                            <span className="text-2xl font-bold text-primary">₹{stats?.totalRevenue?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600 font-semibold">Completion Rate</span>
                            <div className="flex items-center gap-2">
                                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-green-400 to-green-600"
                                        style={{ width: `${stats?.completionRate || 0}%` }}
                                    />
                                </div>
                                <span className="text-lg font-bold">{stats?.completionRate || '0'}%</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600 font-semibold">Average Rating</span>
                            <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <span key={i} className={`text-lg ${i < Math.round(stats?.averageRating || 0)
                                        ? 'text-yellow-400'
                                        : 'text-gray-300'
                                        }`}>
                                        ★
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600 font-semibold">Total Ratings</span>
                            <span className="text-lg font-bold text-primary">{stats?.totalRatings || 0}</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Analytics;
