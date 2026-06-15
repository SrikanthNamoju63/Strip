import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Filter, Calendar, TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'react-hot-toast';
import { getAdvancedStats, exportReportData } from '../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdvancedReports = () => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('30days');
    const [selectedMetric, setSelectedMetric] = useState('revenue');

    const dateRanges = [
        { value: '7days', label: 'Last 7 Days' },
        { value: '30days', label: 'Last 30 Days' },
        { value: '90days', label: 'Last 90 Days' },
        { value: 'ytd', label: 'Year to Date' }
    ];

    useEffect(() => {
        loadReportData();
    }, [dateRange]);

    const loadReportData = async () => {
        setLoading(true);
        try {
            const data = await getAdvancedStats(dateRange);
            setReportData(data);
        } catch (error) {
            console.error('Failed to load report data:', error);
            toast.error('Failed to load report data');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format) => {
        try {
            if (format === 'pdf') {
                generatePDF();
                return;
            }
            await exportReportData(dateRange, format);
            toast.success(`Report exported as ${format.toUpperCase()}`);
        } catch (error) {
            toast.error('Failed to export report');
        }
    };

    const generatePDF = () => {
        try {
            const doc = new jsPDF();
            doc.text('Advanced Analytics Report', 14, 15);
            doc.setFontSize(10);
            
            const rangeLabel = dateRanges.find(r => r.value === dateRange)?.label || dateRange;
            doc.text(`Period: ${rangeLabel}`, 14, 22);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 27);

            if (reportData?.detailedMetrics) {
                const tableColumn = ["Metric", "Value", "Change", "% of Total"];
                const tableRows = reportData.detailedMetrics.map(metric => [
                    metric.name,
                    metric.value,
                    `${metric.change >= 0 ? '+' : ''}${metric.change}%`,
                    `${metric.percentage}%`
                ]);

                autoTable(doc, {
                    head: [tableColumn],
                    body: tableRows,
                    startY: 35,
                    theme: 'grid',
                    styles: { fontSize: 9 },
                    headStyles: { fillColor: [37, 99, 235] } // blue-600
                });
                
                let finalY = doc.lastAutoTable.finalY || 35;
                finalY += 15;
                
                doc.setFontSize(12);
                doc.text('Key Performance Indicators:', 14, finalY);
                finalY += 8;
                doc.setFontSize(10);
                
                const kpis = [
                    `Total Revenue: INR ${(reportData.totalRevenue || 0).toLocaleString('en-IN')}`,
                    `Total Transactions: ${reportData.totalTransactions || 0}`,
                    `Active Users: ${reportData.activeUsers || 0}`,
                    `Total Appointments: ${reportData.totalAppointments || 0}`
                ];
                
                kpis.forEach(kpi => {
                    doc.text(kpi, 14, finalY);
                    finalY += 6;
                });
            } else {
                doc.text('No data available for this report period.', 14, 40);
            }

            doc.save(`analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success('Report exported as PDF');
        } catch (err) {
            console.error('PDF Generation Error:', err);
            toast.error('Failed to generate PDF');
        }
    };

    const MetricCard = ({ title, value, change, icon: Icon, color, delay }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className={`bg-gradient-to-br ${color} rounded-2xl p-6 text-white shadow-lg`}
        >
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm opacity-90">{title}</p>
                    <p className="text-3xl font-bold mt-2">{value}</p>
                    {change && (
                        <p className={`text-sm mt-2 ${change >= 0 ? 'text-emerald-200' : 'text-red-200'}`}>
                            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% from last period
                        </p>
                    )}
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                    <Icon size={24} />
                </div>
            </div>
        </motion.div>
    );

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
                    <h1 className="text-3xl font-bold text-slate-900">Advanced Analytics</h1>
                    <p className="text-slate-500 mt-1">Comprehensive platform performance reports</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        {dateRanges.map(range => (
                            <option key={range.value} value={range.value}>{range.label}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => handleExport('csv')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium"
                    >
                        <Download size={16} /> CSV
                    </button>
                    <button
                        onClick={() => handleExport('pdf')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                        <Download size={16} /> PDF
                    </button>
                </div>
            </div>

            {/* Top Metrics */}
            {reportData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        title="Total Revenue"
                        value={`₹${(reportData.totalRevenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                        change={reportData.revenueChange}
                        icon={TrendingUp}
                        color="from-blue-500 to-blue-600"
                        delay={0.1}
                    />
                    <MetricCard
                        title="Total Transactions"
                        value={reportData.totalTransactions || 0}
                        change={reportData.transactionChange}
                        icon={BarChart3}
                        color="from-purple-500 to-purple-600"
                        delay={0.2}
                    />
                    <MetricCard
                        title="Active Users"
                        value={reportData.activeUsers || 0}
                        change={reportData.usersChange}
                        icon={TrendingUp}
                        color="from-emerald-500 to-emerald-600"
                        delay={0.3}
                    />
                    <MetricCard
                        title="Doctor Appointments"
                        value={reportData.totalAppointments || 0}
                        change={reportData.appointmentChange}
                        icon={Calendar}
                        color="from-orange-500 to-orange-600"
                        delay={0.4}
                    />
                </div>
            )}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100"
                >
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Revenue Trend</h3>
                    {reportData?.revenueTrend && (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={reportData.revenueTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px'
                                    }}
                                    formatter={(value) => `₹${value.toLocaleString()}`}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    name="Revenue"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="commission"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    name="Platform Commission"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </motion.div>

                {/* Transaction Volume */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100"
                >
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Transaction Volume</h3>
                    {reportData?.transactionVolume && (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={reportData.transactionVolume}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="transactions" fill="#3b82f6" name="Transactions" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="failed" fill="#ef4444" name="Failed" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </motion.div>

                {/* User Growth */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100"
                >
                    <h3 className="text-lg font-bold text-slate-900 mb-4">User Growth</h3>
                    {reportData?.userGrowth && (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={reportData.userGrowth}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="patients"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    name="Patients"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="doctors"
                                    stroke="#ec4899"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    name="Doctors"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </motion.div>

                {/* Payment Methods Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100"
                >
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Payment Methods</h3>
                    {reportData?.paymentMethods && (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={reportData.paymentMethods}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value }) => `${name}: ${value}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {reportData.paymentMethods.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 4]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `${value}%`} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </motion.div>
            </div>

            {/* Detailed Metrics Table */}
            {reportData?.detailedMetrics && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100"
                >
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Detailed Metrics</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-left">
                                    <th className="pb-3 font-semibold text-slate-700">Metric</th>
                                    <th className="pb-3 font-semibold text-slate-700">Value</th>
                                    <th className="pb-3 font-semibold text-slate-700">Change</th>
                                    <th className="pb-3 font-semibold text-slate-700">% of Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.detailedMetrics.map((metric, idx) => (
                                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="py-3 text-slate-700 font-medium">{metric.name}</td>
                                        <td className="py-3 text-slate-900 font-semibold">{metric.value}</td>
                                        <td className={`py-3 ${metric.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {metric.change >= 0 ? '+' : ''}{metric.change}%
                                        </td>
                                        <td className="py-3 text-slate-600">{metric.percentage}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default AdvancedReports;
