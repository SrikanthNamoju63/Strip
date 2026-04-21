import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'react-hot-toast';
import { getApiMetrics, getEndpointStatus } from '../services/api';

const APIMonitoring = () => {
    const [metrics, setMetrics] = useState(null);
    const [endpointStatus, setEndpointStatus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState(30);

    useEffect(() => {
        loadMetrics();
        const interval = setInterval(loadMetrics, refreshInterval * 1000);
        return () => clearInterval(interval);
    }, [refreshInterval]);

    const loadMetrics = async () => {
        try {
            const [metricsRes, statusRes] = await Promise.allSettled([
                getApiMetrics(),
                getEndpointStatus()
            ]);

            if (metricsRes.status === 'fulfilled') setMetrics(metricsRes.value);
            if (statusRes.status === 'fulfilled') setEndpointStatus(statusRes.value);
        } catch (error) {
            console.error('Failed to load API metrics:', error);
            toast.error('Failed to load API metrics');
        } finally {
            setLoading(false);
        }
    };

    const MetricCard = ({ title, value, unit, icon: Icon, color, trend, delay }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className={`bg-gradient-to-br ${color} rounded-2xl p-6 text-white shadow-lg`}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-sm opacity-90">{title}</p>
                    <p className="text-3xl font-bold mt-2">{value}</p>
                    <p className="text-xs opacity-75 mt-1">{unit}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                    <Icon size={24} />
                </div>
            </div>
            {trend && (
                <div className={`text-sm font-semibold ${trend >= 0 ? 'text-red-200' : 'text-emerald-200'}`}>
                    {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last hour
                </div>
            )}
        </motion.div>
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">API Monitoring</h1>
                    <p className="text-slate-500 mt-1">Real-time API performance and health monitoring</p>
                </div>
                <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                    <option value="10">Refresh every 10s</option>
                    <option value="30">Refresh every 30s</option>
                    <option value="60">Refresh every 60s</option>
                </select>
            </div>

            {/* Key Metrics */}
            {metrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        title="Average Response Time"
                        value={metrics.avgResponseTime}
                        unit="milliseconds"
                        icon={Zap}
                        color="from-blue-500 to-blue-600"
                        trend={metrics.responseTimeTrend}
                        delay={0.1}
                    />
                    <MetricCard
                        title="Total Requests/Hour"
                        value={metrics.requestsPerHour}
                        unit="requests"
                        icon={Activity}
                        color="from-purple-500 to-purple-600"
                        trend={metrics.requestsTrend}
                        delay={0.2}
                    />
                    <MetricCard
                        title="Error Rate"
                        value={`${metrics.errorRate}%`}
                        unit="of total requests"
                        icon={AlertTriangle}
                        color="from-red-500 to-red-600"
                        trend={metrics.errorTrend}
                        delay={0.3}
                    />
                    <MetricCard
                        title="Success Rate"
                        value={`${metrics.successRate}%`}
                        unit="of total requests"
                        icon={CheckCircle}
                        color="from-emerald-500 to-emerald-600"
                        delay={0.4}
                    />
                </div>
            )}

            {/* Response Time Trend */}
            {metrics?.responseTimeTrend && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100"
                >
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Response Time Trend (Last 24 Hours)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={metrics.responseTimeTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="time" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                            <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px'
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="responseTime"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </motion.div>
            )}

            {/* Endpoint Status */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100"
            >
                <h3 className="text-lg font-bold text-slate-900 mb-4">Endpoint Status</h3>
                <div className="space-y-3">
                    {endpointStatus.length > 0 ? (
                        endpointStatus.map((endpoint, idx) => {
                            const statusColor =
                                endpoint.status === 'healthy' ? 'text-emerald-600' :
                                endpoint.status === 'degraded' ? 'text-amber-600' :
                                'text-red-600';

                            const statusBg =
                                endpoint.status === 'healthy' ? 'bg-emerald-50' :
                                endpoint.status === 'degraded' ? 'bg-amber-50' :
                                'bg-red-50';

                            return (
                                <div key={idx} className={`flex items-center justify-between p-4 rounded-xl ${statusBg}`}>
                                    <div>
                                        <p className="font-semibold text-slate-900">{endpoint.path}</p>
                                        <p className="text-xs text-slate-600 mt-1">{endpoint.method}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-bold ${statusColor}`}>
                                            {endpoint.status.charAt(0).toUpperCase() + endpoint.status.slice(1)}
                                        </p>
                                        <p className="text-xs text-slate-600 mt-1">{endpoint.avgResponseTime}ms avg</p>
                                        <p className="text-xs text-slate-600">Success: {endpoint.successRate}%</p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-center text-slate-500 py-8">No endpoint data available</p>
                    )}
                </div>
            </motion.div>

            {/* Request Volume */}
            {metrics?.requestVolume && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100"
                >
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Request Volume by Endpoint</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={metrics.requestVolume}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="endpoint" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                            <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px'
                                }}
                            />
                            <Bar dataKey="requests" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            )}

            {/* Error Distribution */}
            {metrics?.errorDistribution && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100"
                >
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Error Distribution</h3>
                    <div className="space-y-3">
                        {metrics.errorDistribution.map((error, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-slate-900">{error.code}: {error.message}</p>
                                    <p className="text-xs text-slate-500 mt-1">Last occurrence: {error.lastOccurrence}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-red-600">{error.count} errors</p>
                                    <p className="text-xs text-slate-600">{error.percentage}%</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default APIMonitoring;
