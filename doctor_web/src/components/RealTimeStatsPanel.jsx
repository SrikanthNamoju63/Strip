import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import {
    Activity, Users, Calendar, DollarSign, Clock,
    TrendingUp, ArrowUpRight, ArrowDownRight,
    Wifi, WifiOff, Zap, CheckCircle
} from 'lucide-react';

/**
 * RealTimeStatsPanel - Live updating stats for Doctor Dashboard
 * Shows platform activity + personal stats in real-time
 */
const RealTimeStatsPanel = () => {
    const socket = useSocket();
    const [globalStats, setGlobalStats] = useState(null);
    const [prevStats, setPrevStats] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [pulseKeys, setPulseKeys] = useState({});

    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);

        const handleTicker = (payload) => {
            const data = payload.data?.ticker || payload.data;
            
            // Detect changes
            if (globalStats) {
                const pulses = {};
                Object.keys(data).forEach(key => {
                    if (globalStats[key] !== undefined && globalStats[key] !== data[key]) {
                        pulses[key] = data[key] > globalStats[key] ? 'up' : 'down';
                    }
                });
                setPulseKeys(pulses);
                setTimeout(() => setPulseKeys({}), 600);
            }
            
            setPrevStats(globalStats);
            setGlobalStats(data);
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('live_ticker', handleTicker);
        socket.on('doctor_stats_update', handleTicker);

        if (socket.connected) setIsConnected(true);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('live_ticker', handleTicker);
            socket.off('doctor_stats_update', handleTicker);
        };
    }, [socket, globalStats]);

    if (!globalStats) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <Activity size={20} className="text-blue-500" />
                    <h3 className="text-lg font-bold text-gray-900">Live Platform Activity</h3>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold tracking-wider">
                        <WifiOff size={10} />
                        CONNECTING
                    </div>
                </div>
                <div className="flex items-center justify-center h-24">
                    <div className="loader"></div>
                </div>
            </div>
        );
    }

    const miniCards = [
        {
            label: 'Platform Appts',
            value: globalStats.totalAppointmentsToday || 0,
            key: 'totalAppointmentsToday',
            icon: Calendar,
            color: '#3b82f6',
            bg: '#eff6ff',
        },
        {
            label: 'Completed',
            value: globalStats.completedToday || 0,
            key: 'completedToday',
            icon: CheckCircle,
            color: '#22c55e',
            bg: '#f0fdf4',
        },
        {
            label: 'Active Consults',
            value: globalStats.activeConsultations || 0,
            key: 'activeConsultations',
            icon: Activity,
            color: '#8b5cf6',
            bg: '#f5f3ff',
        },
        {
            label: 'Doctors Online',
            value: globalStats.onlineDoctors || 0,
            key: 'onlineDoctors',
            icon: Users,
            color: '#06b6d4',
            bg: '#ecfeff',
        },
        {
            label: 'New (5min)',
            value: globalStats.recentBookings || 0,
            key: 'recentBookings',
            icon: Zap,
            color: '#f59e0b',
            bg: '#fffbeb',
        },
        {
            label: 'Pending',
            value: globalStats.bookedToday || 0,
            key: 'bookedToday',
            icon: Clock,
            color: '#ec4899',
            bg: '#fdf2f8',
        },
    ];

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <Activity size={20} className="text-blue-500" />
                    <h3 className="text-lg font-bold text-gray-900">Live Platform Activity</h3>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${
                        isConnected 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                            : 'bg-red-50 text-red-500 border border-red-200'
                    }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} 
                             style={{ animation: 'pulse-mini 2s infinite' }} />
                        {isConnected ? 'STREAMING' : 'OFFLINE'}
                    </div>
                </div>
            </div>

            {/* Mini KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {miniCards.map((card) => {
                    const Icon = card.icon;
                    const pulse = pulseKeys[card.key];
                    
                    return (
                        <div
                            key={card.key}
                            className="p-3 rounded-xl transition-all duration-300"
                            style={{
                                background: card.bg,
                                border: pulse 
                                    ? `1px solid ${pulse === 'up' ? '#22c55e' : '#ef4444'}` 
                                    : '1px solid transparent',
                                boxShadow: pulse 
                                    ? `0 0 12px ${pulse === 'up' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` 
                                    : 'none',
                            }}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: card.color, opacity: 0.7 }}>
                                    {card.label}
                                </span>
                                <Icon size={14} style={{ color: card.color, opacity: 0.6 }} />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-extrabold" style={{ 
                                    color: pulse === 'up' ? '#22c55e' : pulse === 'down' ? '#ef4444' : '#0f172a',
                                    transition: 'color 0.3s ease',
                                    fontFamily: "'Inter', system-ui, sans-serif"
                                }}>
                                    {card.value}
                                </span>
                                {pulse === 'up' && <ArrowUpRight size={14} className="text-emerald-500" />}
                                {pulse === 'down' && <ArrowDownRight size={14} className="text-red-500" />}
                            </div>
                        </div>
                    );
                })}
            </div>

            <style>{`
                @keyframes pulse-mini {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
            `}</style>
        </div>
    );
};

export default RealTimeStatsPanel;
