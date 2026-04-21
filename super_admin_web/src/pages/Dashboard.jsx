import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Users, DollarSign, Calendar, TrendingUp, TrendingDown, Clock, ShieldCheck, Stethoscope, IndianRupee } from 'lucide-react';
import { getStats, getPaymentAnalytics } from '../services/api';
import { useAdminAuth } from '../hooks/useAdminAuth';
import StatsCard from '../components/StatsCard';
import useRealTime from '../hooks/useRealTime';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [revenueData, setRevenueData] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAdminAuth();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch independently or allow one to fail without breaking the other
                const [statsResult, analyticsResult] = await Promise.allSettled([
                    getStats(),
                    getPaymentAnalytics()
                ]);

                // Handle Stats
                if (statsResult.status === 'fulfilled') {
                    setStats(statsResult.value);
                } else {
                    console.error("Failed to fetch stats:", statsResult.reason);
                    // Fallback to empty obj if needed, or keep null
                }

                // Handle Analytics
                if (analyticsResult.status === 'fulfilled') {
                    const analyticsData = analyticsResult.value;
                    // Process daily revenue data for the chart
                    if (analyticsData.success && analyticsData.data.dailyRevenue) {
                        const formattedData = analyticsData.data.dailyRevenue.map(item => ({
                            name: new Date(item._id).toLocaleDateString('en-US', { weekday: 'short' }),
                            fullDate: item._id,
                            revenue: item.revenue,
                            profit: item.commission // Assuming commission is the profit for the platform
                        }));
                        setRevenueData(formattedData);
                    }
                } else {
                    console.error("Failed to fetch payment analytics:", analyticsResult.reason);
                    // Revenue data remains empty array []
                }

            } catch (err) {
                console.error("Unexpected error in dashboard fetch", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Real-time: auto-refresh when booking or payment occurs
    useRealTime({
        events: ['appointment_update', 'payment_update', 'notification'],
        refetch: () => {
            // Background refresh without loading spinner
            Promise.allSettled([getStats(), getPaymentAnalytics()]).then(([statsResult, analyticsResult]) => {
                if (statsResult.status === 'fulfilled') setStats(statsResult.value);
                if (analyticsResult.status === 'fulfilled') {
                    const analyticsData = analyticsResult.value;
                    if (analyticsData.success && analyticsData.data.dailyRevenue) {
                        const formattedData = analyticsData.data.dailyRevenue.map(item => ({
                            name: new Date(item._id).toLocaleDateString('en-US', { weekday: 'short' }),
                            fullDate: item._id,
                            revenue: item.revenue,
                            profit: item.commission
                        }));
                        setRevenueData(formattedData);
                    }
                }
            });
        },
    });

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-100">
                    <p className="font-bold text-slate-700 mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: <span className="font-semibold">₹{Number(entry.value).toFixed(2)}</span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    icon={Stethoscope}
                    label="Total Doctors"
                    value={stats?.doctors?.total || 0}
                    subValue={`${stats?.doctors?.verified || 0} Verified`}
                    trend="up"
                    trendValue="12%"
                    color="blue"
                    delay={0.1}
                />
                <StatsCard
                    icon={Users}
                    label="Active Users"
                    value={stats?.users?.total || 0}
                    trend="up"
                    trendValue="5%"
                    color="emerald"
                    delay={0.2}
                />
                <StatsCard
                    icon={Calendar}
                    label="Appointments"
                    value={stats?.appointments?.total || 0}
                    subValue="Total"
                    trend="down"
                    trendValue="2%"
                    color="purple"
                    delay={0.3}
                />
                <StatsCard
                    icon={IndianRupee}
                    label="Total Revenue"
                    value={`₹${Number(stats?.financials?.totalProfit || 0).toFixed(2)}`}
                    trend="up"
                    trendValue="18%"
                    color="amber"
                    delay={0.4}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Revenue Analytics</h3>
                        <select className="bg-slate-50 border-none text-sm rounded-lg px-3 py-1 text-slate-500 outline-none hover:bg-slate-100 cursor-pointer">
                            <option>This Week</option>
                            <option>Last Week</option>
                            <option>This Month</option>
                        </select>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData.length > 0 ? revenueData : []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                <Legend iconType="circle" />
                                <Bar dataKey="revenue" name="Total Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="profit" name="Net Profit" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                        {revenueData.length === 0 && (
                            <div className="flex justify-center items-center h-full text-slate-400">
                                No revenue data available
                            </div>
                        )}
                    </div>
                </div>

                {/* Verification Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Doctor Status</h3>
                    <div className="h-64 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { name: 'Verified', count: stats?.doctors?.verified || 0 },
                                { name: 'Pending', count: stats?.doctors?.pending || 0 },
                                { name: 'Rejected', count: stats?.doctors?.rejected || 0 } // Assuming we might get rejected count later
                            ]} layout="vertical" barSize={20} margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} width={80} />
                                <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                    {
                                        [{ fill: '#10b981' }, { fill: '#f59e0b' }, { fill: '#ef4444' }].map((entry, index) => (
                                            <cell key={`cell-${index}`} fill={entry.fill} />
                                        ))
                                    }
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>

                        <div className="mt-6 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                    <span className="text-slate-600">Verified</span>
                                </div>
                                <span className="font-bold text-slate-800">{stats?.doctors?.verified || 0}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                                    <span className="text-slate-600">Pending Review</span>
                                </div>
                                <span className="font-bold text-slate-800">{stats?.doctors?.pending || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions or Recent Activity placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <TopOperators />

                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white relative overflow-hidden flex flex-col justify-center">
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-2">Pending Verifications</h3>
                        <p className="text-blue-100 mb-6 max-w-md">There are {stats?.doctors?.pending || 0} doctors waiting for approval. Review their documents to ensure quality.</p>
                        <button className="bg-white text-blue-600 px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-50 transition-colors shadow-lg w-fit">
                            Review Applications
                        </button>
                    </div>
                    <ShieldCheck size={180} className="absolute -bottom-8 -right-8 text-white opacity-10 rotate-12" />
                </div>
            </div>
        </div>
    );
};

// Sub-component for Top Rated Doctors
import { getDoctors } from '../services/api';

const TopOperators = () => {
    const [doctors, setDoctors] = useState([]);

    useEffect(() => {
        const load = async () => {
            // sort=rating is supported by our backend update
            try {
                const res = await getDoctors({ sort: 'rating', limit: 5 });
                if (Array.isArray(res)) {
                    setDoctors(res);
                }
            } catch (e) { console.error(e); }
        };
        load();
    }, []);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Top Rated Doctors</h3>
            <div className="space-y-4">
                {doctors.map(doc => (
                    <div key={doc._id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden">
                            {doc.doctorPhoto ? <img src={doc.doctorPhoto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">{doc.name[0]}</div>}
                        </div>
                        <div className="flex-grow">
                            <div className="font-semibold text-slate-900">{doc.name}</div>
                            <div className="text-xs text-slate-500">{doc.specialization}</div>
                        </div>
                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded text-yellow-700 font-bold text-sm">
                            <span>★</span>
                            <span>{doc.ratings?.averageRating?.toFixed(1) || '0.0'}</span>
                        </div>
                    </div>
                ))}
                {doctors.length === 0 && <div className="text-slate-400 text-center">No ratings yet</div>}
            </div>
        </div>
    );
};

export default Dashboard;
