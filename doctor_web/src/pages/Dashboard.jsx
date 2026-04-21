import React, { useEffect, useState } from 'react';
import { getDoctorAppointments, getDoctorProfile } from '../services/api';
import { motion } from 'framer-motion';
import { Users, Calendar, DollarSign, Activity, TrendingUp, Clock, CheckCircle, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSocket } from '../context/SocketContext';
import MissingDetailsModal from '../components/MissingDetailsModal';
import DoctorQRCode from '../components/DoctorQRCode';

const Dashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [timeFilter, setTimeFilter] = useState('week');
    const [showMissingDetailsModal, setShowMissingDetailsModal] = useState(false);

    // Real-time updates
    const socket = useSocket();

    const fetchData = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            const user = await getDoctorProfile();
            setProfile(user);
            const appts = await getDoctorAppointments(user._id);
            setAppointments(appts);
        } catch (err) {
            console.error(err);
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Auto-refresh fallback (every 30 seconds)
        const interval = setInterval(() => fetchData(true), 30000);
        return () => clearInterval(interval);
    }, []);

    // Check for missing details or requests
    useEffect(() => {
        if (!profile) return;

        const isRequested = profile.profileDetailsRequested;
        const isMissingCritical = !profile.registrationNumber || !profile.medicalCouncil || !profile.experience || !profile.consultationFee;

        if (isRequested || isMissingCritical) {
            setShowMissingDetailsModal(true);
        }
    }, [profile]);

    // Socket Listener - Auto-refresh on any real-time change
    useEffect(() => {
        if (!socket) return;

        const handleRealTimeUpdate = (data) => {
            console.log('🔄 Real-time update received, refreshing dashboard...', data);
            fetchData(true); // Background refresh
        };

        // Listen to ALL relevant push events (no polling/ticker events to avoid 429)
        socket.on('notification', handleRealTimeUpdate);
        socket.on('appointment_update', handleRealTimeUpdate);
        socket.on('payment_update', handleRealTimeUpdate);

        return () => {
            socket.off('notification', handleRealTimeUpdate);
            socket.off('appointment_update', handleRealTimeUpdate);
            socket.off('payment_update', handleRealTimeUpdate);
        };
    }, [socket]);

    if (loading) return (
        <div className="flex justify-center items-center h-full min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    const pendingCount = appointments.filter(a => a.status === 'BOOKED').length;
    const completedCount = appointments.filter(a => a.status === 'COMPLETED').length;
    const totalRevenue = appointments.reduce((sum, appt) => {
        // Use historical fee if available, else current profile fee (estimate)
        const fee = appt.fees?.doctorReceivable || appt.consultationFee || profile?.consultationFee || 0;
        return sum + fee;
    }, 0);

    const stats = [
        {
            label: 'Total Revenue',
            value: `\u20B9${totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            color: 'bg-emerald-500',
            trend: '+12.5%'
        },
        {
            label: 'Appointments',
            value: appointments.length,
            icon: Calendar,
            color: 'bg-blue-500',
            trend: '+4%'
        },
        {
            label: 'Pending',
            value: pendingCount,
            icon: Clock,
            color: 'bg-amber-500',
            trend: 'Action needed'
        },
        {
            label: 'Completed',
            value: completedCount,
            icon: CheckCircle,
            color: 'bg-purple-500',
            trend: 'High completion'
        },
        {
            label: 'Average Rating',
            value: profile?.ratings?.averageRating ? profile.ratings.averageRating.toFixed(1) : '0.0',
            icon: Star,
            color: 'bg-yellow-500',
            trend: `${profile?.ratings?.totalReviews || 0} reviews`
        },
    ];

    // Aggregation Logic
    const getChartData = () => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentDate = now.getDate();

        if (timeFilter === 'year') {
            // Initialize 12 months
            const data = Array.from({ length: 12 }, (_, i) => ({
                name: new Date(0, i).toLocaleString('default', { month: 'short' }),
                appts: 0
            }));

            appointments.forEach(appt => {
                const d = new Date(appt.appointmentDate);
                if (d.getFullYear() === currentYear) {
                    data[d.getMonth()].appts++;
                }
            });
            return data;

        } else if (timeFilter === 'month') {
            // Days in current month
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            const data = Array.from({ length: daysInMonth }, (_, i) => ({
                name: `${i + 1}`,
                appts: 0
            }));

            appointments.forEach(appt => {
                const d = new Date(appt.appointmentDate);
                if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
                    const day = d.getDate();
                    if (day >= 1 && day <= daysInMonth) {
                        data[day - 1].appts++;
                    }
                }
            });
            return data;

        } else {
            // Week (Mon-Sun)
            const data = [
                { name: 'Mon', appts: 0 }, { name: 'Tue', appts: 0 },
                { name: 'Wed', appts: 0 }, { name: 'Thu', appts: 0 },
                { name: 'Fri', appts: 0 }, { name: 'Sat', appts: 0 },
                { name: 'Sun', appts: 0 },
            ];

            // Calculate start of week (Monday)
            const dayOfWeek = now.getDay(); // 0 is Sunday
            const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            const startOfWeek = new Date(now.setDate(diff));
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 7);

            appointments.forEach(appt => {
                const d = new Date(appt.appointmentDate);
                if (d >= startOfWeek && d < endOfWeek) {
                    const dayIndex = d.getDay(); // 0-Sun, 1-Mon...
                    // Map 1->0 (Mon), 2->1 (Tue)... 0->6 (Sun)
                    const mapIndex = dayIndex === 0 ? 6 : dayIndex - 1;
                    data[mapIndex].appts++;
                }
            });
            return data;
        }
    };

    const data = getChartData();

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Overview</h1>
                    <p className="text-gray-500 mt-1">Welcome back, Dr. {profile?.name}</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 shadow-sm hidden md:block">
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <button
                        onClick={fetchData}
                        className="p-2 md:px-4 md:py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                        title="Refresh Data"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? "animate-spin" : ""}><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21h5v-5" /></svg>
                        <span className="hidden md:inline">Refresh</span>
                    </button>
                    <button className="bg-primary text-white px-4 py-2 rounded-lg font-medium shadow-lg shadow-primary/30 hover:bg-secondary transition-colors">
                        + New Patient
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group"
                    >
                        <div className="flex justify-between items-start z-10 relative">
                            <div>
                                <p className="text-gray-500 text-sm font-medium mb-1">{stat.label}</p>
                                <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                                <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-full">
                                    <TrendingUp size={12} />
                                    <span>{stat.trend}</span>
                                </div>
                            </div>
                            <div className={`p-3 rounded-xl text-white shadow-lg ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                        </div>
                        {/* Decoration */}
                        <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-10 group-hover:scale-110 transition-transform duration-500 ${stat.color}`}></div>
                    </motion.div>
                ))}
            </div>

            {/* Charts & Recent Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Appointment Analytics</h3>
                        <select
                            value={timeFilter}
                            onChange={(e) => setTimeFilter(e.target.value)}
                            className="text-sm border-gray-200 border rounded-lg px-2 py-1 text-gray-500 outline-none focus:border-primary"
                        >
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="year">This Year</option>
                        </select>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(37, 99, 235, 0.1)' }}
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="appts" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={timeFilter === 'month' ? 10 : 30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Appointments List */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Recent Patients</h3>
                        <a href="/appointments" className="text-sm text-primary font-medium hover:underline">View All</a>
                    </div>
                    <div className="space-y-4">
                        {appointments.slice(0, 4).map((appt) => (
                            <div key={appt._id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                    {appt.patientDetails?.name?.[0] || 'U'}
                                </div>
                                <div className="flex-grow">
                                    <h4 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{appt.patientDetails?.name}</h4>
                                    <p className="text-xs text-gray-500">{new Date(appt.appointmentDate).toLocaleDateString()} • {appt.appointmentTime}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${appt.status === 'BOOKED' ? 'bg-amber-100 text-amber-700' :
                                    appt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {appt.status}
                                </span>
                            </div>
                        ))}
                        {appointments.length === 0 && (
                            <p className="text-center text-gray-400 py-4">No appointments yet.</p>
                        )}
                    </div>
                </div>

                {/* Recent Reviews Summary */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Recent Reviews</h3>
                        <a href="/feedbacks" className="text-sm text-primary font-medium hover:underline">View All</a>
                    </div>
                    <div className="flex items-center justify-center h-48 bg-gray-50 rounded-xl">
                        <div className="text-center">
                            <div className="text-4xl font-bold text-gray-900 mb-2">{profile?.ratings?.averageRating?.toFixed(1) || '0.0'}</div>
                            <div className="flex justify-center gap-1 mb-2">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} size={20} fill={s <= Math.round(profile?.ratings?.averageRating || 0) ? "#EAB308" : "none"} color="#EAB308" />
                                ))}
                            </div>
                            <p className="text-gray-500 text-sm">based on {profile?.ratings?.totalReviews || 0} reviews</p>
                        </div>
                    </div>
                </div>

                {/* QR Code Section */}
                <div className="lg:col-span-3 xl:col-span-1">
                    <DoctorQRCode profile={profile} />
                </div>
            </div>

            <MissingDetailsModal
                isOpen={showMissingDetailsModal}
                onClose={() => setShowMissingDetailsModal(false)}
                profile={profile}
                onUpdateSuccess={() => fetchData()}
            />
        </div>
    );
};

export default Dashboard;
