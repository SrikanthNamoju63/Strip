import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Server, Shield, Database, AlertCircle, CheckCircle, Clock,
    Settings as SettingsIcon, RefreshCw, Trash2, Download, Upload, Eye, EyeOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
    getSystemHealth, getSystemLogs, clearCache, backupDatabase,
    restoreDatabase, getApiHealth, resetSystem
} from '../services/api';

const SystemAdministration = () => {
    const [systemHealth, setSystemHealth] = useState(null);
    const [apiHealth, setApiHealth] = useState(null);
    const [systemLogs, setSystemLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showLogs, setShowLogs] = useState(false);
    const [backupProgress, setBackupProgress] = useState(0);
    const [showBackupModal, setShowBackupModal] = useState(false);
    const [backupPassword, setBackupPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        loadSystemStatus();
    }, []);

    const loadSystemStatus = async () => {
        setLoading(true);
        try {
            const [healthRes, apiRes, logsRes] = await Promise.allSettled([
                getSystemHealth(),
                getApiHealth(),
                getSystemLogs()
            ]);

            if (healthRes.status === 'fulfilled') setSystemHealth(healthRes.value);
            if (apiRes.status === 'fulfilled') setApiHealth(apiRes.value);
            if (logsRes.status === 'fulfilled') setSystemLogs(logsRes.value);
        } catch (error) {
            console.error('Failed to load system status:', error);
            toast.error('Failed to load system status');
        } finally {
            setLoading(false);
        }
    };

    const handleClearCache = async () => {
        if (!window.confirm('Clear all cache? This may impact performance temporarily.')) return;
        try {
            await clearCache();
            toast.success('Cache cleared successfully');
            loadSystemStatus();
        } catch (error) {
            toast.error('Failed to clear cache');
        }
    };

    const handleBackupDatabase = async () => {
        if (!backupPassword) {
            toast.error('Password required for backup');
            return;
        }
        setBackupProgress(0);
        try {
            await backupDatabase(backupPassword);
            setBackupProgress(100);
            toast.success('Database backup completed');
            setShowBackupModal(false);
            setBackupPassword('');
        } catch (error) {
            toast.error('Backup failed');
        }
    };

    const StatusIndicator = ({ status, label }) => {
        const statusConfig = {
            healthy: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
            degraded: { bg: 'bg-amber-100', text: 'text-amber-700', icon: AlertCircle },
            unhealthy: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle }
        };
        const config = statusConfig[status] || statusConfig.degraded;
        const Icon = config.icon;

        return (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg} ${config.text} text-sm font-medium`}>
                <Icon size={16} />
                {label}
            </div>
        );
    };

    const SystemCard = ({ icon: Icon, title, children, delay }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100"
        >
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Icon size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            </div>
            {children}
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
                    <h1 className="text-3xl font-bold text-slate-900">System Administration</h1>
                    <p className="text-slate-500 mt-1">Monitor and manage platform infrastructure</p>
                </div>
                <button
                    onClick={loadSystemStatus}
                    className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* System Health Overview */}
            {systemHealth && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm opacity-90">Database Status</p>
                                <p className="text-2xl font-bold mt-2">{systemHealth.database.status}</p>
                            </div>
                            <Database size={24} />
                        </div>
                        <p className="text-xs opacity-75">Response: {systemHealth.database.responseTime}ms</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm opacity-90">Cache Status</p>
                                <p className="text-2xl font-bold mt-2">{systemHealth.cache.status}</p>
                            </div>
                            <SettingsIcon size={24} />
                        </div>
                        <p className="text-xs opacity-75">Memory: {systemHealth.cache.memoryUsage}%</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm opacity-90">API Health</p>
                                <p className="text-2xl font-bold mt-2">{apiHealth?.status || 'Unknown'}</p>
                            </div>
                            <Server size={24} />
                        </div>
                        <p className="text-xs opacity-75">Uptime: {systemHealth.uptime}</p>
                    </motion.div>
                </div>
            )}

            {/* Management Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SystemCard icon={RefreshCw} title="Cache Management" delay={0.4}>
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">Clear application cache to free up memory</p>
                        <button
                            onClick={handleClearCache}
                            className="w-full px-4 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-medium"
                        >
                            Clear Cache Now
                        </button>
                    </div>
                </SystemCard>

                <SystemCard icon={Download} title="Backup Database" delay={0.5}>
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">Create encrypted backup of all data</p>
                        <button
                            onClick={() => setShowBackupModal(true)}
                            className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
                        >
                            Start Backup
                        </button>
                    </div>
                </SystemCard>

                <SystemCard icon={Eye} title="View System Logs" delay={0.6}>
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">View detailed system event logs</p>
                        <button
                            onClick={() => setShowLogs(!showLogs)}
                            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                        >
                            {showLogs ? 'Hide Logs' : 'View Logs'}
                        </button>
                    </div>
                </SystemCard>
            </div>

            {/* API Endpoints Status */}
            {apiHealth && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100"
                >
                    <h3 className="text-lg font-bold text-slate-900 mb-4">API Endpoints Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {apiHealth.endpoints?.map((endpoint, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                <div>
                                    <p className="font-medium text-slate-900">{endpoint.path}</p>
                                    <p className="text-xs text-slate-500">{endpoint.method}</p>
                                </div>
                                <StatusIndicator status={endpoint.status} label={`${endpoint.responseTime}ms`} />
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* System Logs */}
            {showLogs && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100"
                >
                    <h3 className="text-lg font-bold text-slate-900 mb-4">System Logs</h3>
                    <div className="bg-slate-900 rounded-xl p-4 overflow-y-auto max-h-96 font-mono text-sm text-slate-100">
                        {systemLogs.length > 0 ? (
                            systemLogs.map((log, idx) => (
                                <div key={idx} className="py-1 border-b border-slate-700">
                                    <span className={`${
                                        log.level === 'error' ? 'text-red-400' :
                                        log.level === 'warn' ? 'text-amber-400' :
                                        log.level === 'info' ? 'text-blue-400' :
                                        'text-slate-400'
                                    }`}>
                                        [{log.timestamp}] {log.level.toUpperCase()}: {log.message}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-400">No logs available</p>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Backup Modal */}
            {showBackupModal && (
                <AnimatePresence>
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
                        >
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Database Backup</h3>
                            <p className="text-slate-600 text-sm mb-4">
                                Enter your password to securely backup the database. This encryption ensures only authorized recovery.
                            </p>
                            <div className="relative mb-4">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={backupPassword}
                                    onChange={(e) => setBackupPassword(e.target.value)}
                                    placeholder="Enter backup password"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                                <button
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {backupProgress > 0 && (
                                <div className="mb-4">
                                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-emerald-600 h-full transition-all"
                                            style={{ width: `${backupProgress}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">{backupProgress}% Complete</p>
                                </div>
                            )}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowBackupModal(false);
                                        setBackupPassword('');
                                        setBackupProgress(0);
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-slate-200 text-slate-900 rounded-xl hover:bg-slate-300 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBackupDatabase}
                                    disabled={!backupPassword}
                                    className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
                                >
                                    Create Backup
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </AnimatePresence>
            )}
        </div>
    );
};

export default SystemAdministration;
