import React, { useEffect, useState } from 'react';
import { 
    AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, 
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
    Activity, Users, DollarSign, Calendar, TrendingUp, TrendingDown, 
    Clock, ShieldCheck, Stethoscope, IndianRupee, Filter 
} from 'lucide-react';
import { getAdvancedStats } from '../services/api';
import { useAdminAuth } from '../hooks/useAdminAuth';
import StatsCard from '../components/StatsCard';
import useRealTime from '../hooks/useRealTime';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#f43f5e', '#8b5cf6', '#ec4899'];

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('30days');
    const { user } = useAdminAuth();

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const data = await getAdvancedStats(dateRange);
            setStats(data);
        } catch (err) {
            console.error("Unexpected error in dashboard fetch", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [dateRange]);

    // Real-time: auto-refresh when booking or payment occurs
    useRealTime({
        events: ['appointment_update', 'payment_update', 'notification'],
        refetch: () => {
            getAdvancedStats(dateRange).then(data => setStats(data));
        },
    });

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-xl border border-slate-100">
                    <p className="font-bold text-slate-700 mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm flex items-center gap-2" style={{ color: entry.color }}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                            {entry.name}: <span className="font-semibold">{Number(entry.value).toLocaleString()}</span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading && !stats) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="loader"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 bg-slate-50 min-h-screen pb-10">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Analytics Overview</h1>
                    <p className="text-slate-500 text-sm">Monitor your platform's key performance indicators</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-100 rounded-lg p-1">
                        {['7days', '30days', '1year', 'all'].map(range => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                    dateRange === range 
                                        ? 'bg-white text-indigo-600 shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {range === '7days' ? '7 Days' : range === '30days' ? '30 Days' : range === '1year' ? '1 Year' : 'All Time'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    icon={IndianRupee}
                    label="Total Revenue"
                    value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`}
                    trend={stats?.revenueChange >= 0 ? "up" : "down"}
                    trendValue={`${Math.abs(stats?.revenueChange || 0)}%`}
                    color="indigo"
                    delay={0.1}
                />
                <StatsCard
                    icon={Calendar}
                    label="Total Appointments"
                    value={(stats?.totalAppointments || 0).toLocaleString()}
                    trend={stats?.appointmentChange >= 0 ? "up" : "down"}
                    trendValue={`${Math.abs(stats?.appointmentChange || 0)}%`}
                    color="emerald"
                    delay={0.2}
                />
                <StatsCard
                    icon={Users}
                    label="Active Users"
                    value={(stats?.activeUsers || 0).toLocaleString()}
                    trend={stats?.usersChange >= 0 ? "up" : "down"}
                    trendValue={`${Math.abs(stats?.usersChange || 0)}%`}
                    color="blue"
                    delay={0.3}
                />
                <StatsCard
                    icon={Activity}
                    label="Transactions"
                    value={(stats?.totalTransactions || 0).toLocaleString()}
                    trend={stats?.transactionChange >= 0 ? "up" : "down"}
                    trendValue={`${Math.abs(stats?.transactionChange || 0)}%`}
                    color="amber"
                    delay={0.4}
                />
            </div>

            {/* Main Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Trend - Spans 2 columns */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Revenue Trend</h3>
                        <p className="text-sm text-slate-500">Daily revenue and platform commission</p>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.revenueTrend || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} minTickGap={30} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => `₹${val}`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" />
                                <Area type="monotone" dataKey="revenue" name="Total Revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                <Area type="monotone" dataKey="commission" name="Platform Commission" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCommission)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Payment Methods</h3>
                        <p className="text-sm text-slate-500">Distribution of successful payments</p>
                    </div>
                    <div className="flex-1 min-h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats?.paymentMethods || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {(stats?.paymentMethods || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend layout="vertical" verticalAlign="bottom" align="center" iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* User & Doctor Growth */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Platform Growth</h3>
                        <p className="text-sm text-slate-500">New patient and doctor signups</p>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats?.userGrowth || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} minTickGap={30} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" />
                                <Line yAxisId="left" type="monotone" dataKey="patients" name="New Patients" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                                <Line yAxisId="right" type="monotone" dataKey="doctors" name="New Doctors" stroke="#f59e0b" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Appointment Status */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Appointment Status</h3>
                        <p className="text-sm text-slate-500">Current status of all appointments</p>
                    </div>
                    <div className="flex-1 min-h-[300px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats?.appointmentStatusDist || []}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    dataKey="value"
                                    labelLine={false}
                                >
                                    {(stats?.appointmentStatusDist || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend layout="vertical" verticalAlign="bottom" align="center" iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
