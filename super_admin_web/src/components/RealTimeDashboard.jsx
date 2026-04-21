import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import {
    Activity, Users, Calendar, DollarSign, Zap,
    TrendingUp, TrendingDown, Server, Wifi, WifiOff,
    ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';

/**
 * RealTimeDashboard - Live KPI Cards with animated updates
 * Updates every second like a stock market dashboard
 */
const RealTimeDashboard = () => {
    const socket = useSocket();
    const [stats, setStats] = useState(null);
    const [prevStats, setPrevStats] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [blinkMap, setBlinkMap] = useState({});

    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);

        const handleLiveTicker = (payload) => {
            const newData = payload.data?.ticker || payload.data;
            
            // Detect changes for blink effect
            if (stats) {
                const blinks = {};
                Object.keys(newData).forEach(key => {
                    if (stats[key] !== undefined && stats[key] !== newData[key]) {
                        blinks[key] = newData[key] > stats[key] ? 'up' : 'down';
                    }
                });
                setBlinkMap(blinks);
                // Clear blinks after animation
                setTimeout(() => setBlinkMap({}), 800);
            }
            
            setPrevStats(stats);
            setStats(newData);
            setLastUpdate(new Date());
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('live_ticker', handleLiveTicker);
        socket.on('admin_stats_update', handleLiveTicker);

        if (socket.connected) setIsConnected(true);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('live_ticker', handleLiveTicker);
            socket.off('admin_stats_update', handleLiveTicker);
        };
    }, [socket, stats]);

    const formatCurrency = (val) => {
        if (!val) return '₹0';
        if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
        if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
        return `₹${val.toFixed(0)}`;
    };

    const getChange = (key) => {
        if (!prevStats || prevStats[key] === undefined || !stats) return null;
        if (stats[key] > prevStats[key]) return 'up';
        if (stats[key] < prevStats[key]) return 'down';
        return null;
    };

    const kpiCards = stats ? [
        {
            label: 'Today\'s Revenue',
            value: formatCurrency(stats.todayRevenue),
            key: 'todayRevenue',
            icon: DollarSign,
            gradient: 'from-emerald-500 to-teal-600',
            bgLight: 'bg-emerald-50',
            textColor: 'text-emerald-700',
        },
        {
            label: 'Appointments Today',
            value: stats.totalAppointmentsToday,
            key: 'totalAppointmentsToday',
            icon: Calendar,
            gradient: 'from-blue-500 to-indigo-600',
            bgLight: 'bg-blue-50',
            textColor: 'text-blue-700',
        },
        {
            label: 'Active Consultations',
            value: stats.activeConsultations,
            key: 'activeConsultations',
            icon: Activity,
            gradient: 'from-violet-500 to-purple-600',
            bgLight: 'bg-violet-50',
            textColor: 'text-violet-700',
        },
        {
            label: 'New Bookings (5min)',
            value: stats.recentBookings,
            key: 'recentBookings',
            icon: Zap,
            gradient: 'from-amber-500 to-orange-600',
            bgLight: 'bg-amber-50',
            textColor: 'text-amber-700',
        },
        {
            label: 'Online Doctors',
            value: stats.onlineDoctors,
            key: 'onlineDoctors',
            icon: Users,
            gradient: 'from-cyan-500 to-blue-600',
            bgLight: 'bg-cyan-50',
            textColor: 'text-cyan-700',
        },
        {
            label: 'Connected Clients',
            value: stats.connectedClients,
            key: 'connectedClients',
            icon: Server,
            gradient: 'from-slate-500 to-gray-700',
            bgLight: 'bg-slate-50',
            textColor: 'text-slate-700',
        },
    ] : [];

    return (
        <div className="rt-dashboard">
            {/* Header */}
            <div className="rt-dash-header">
                <div className="rt-dash-title">
                    <Activity size={20} className="text-indigo-500" />
                    <h3>Real-Time Platform Monitor</h3>
                    <div className={`rt-dash-badge ${isConnected ? 'online' : 'offline'}`}>
                        {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
                        <span>{isConnected ? 'STREAMING' : 'OFFLINE'}</span>
                    </div>
                </div>
                {lastUpdate && (
                    <span className="rt-dash-time">
                        Last update: {lastUpdate.toLocaleTimeString()}
                    </span>
                )}
            </div>

            {/* KPI Grid */}
            <div className="rt-dash-grid">
                {kpiCards.map((card) => {
                    const Icon = card.icon;
                    const change = getChange(card.key);
                    const isBlink = blinkMap[card.key];
                    
                    return (
                        <div
                            key={card.key}
                            className={`rt-kpi-card ${isBlink ? `blink-${isBlink}` : ''}`}
                        >
                            <div className="rt-kpi-header">
                                <span className="rt-kpi-label">{card.label}</span>
                                <div className={`rt-kpi-icon bg-gradient-to-br ${card.gradient}`}>
                                    <Icon size={16} color="white" />
                                </div>
                            </div>
                            <div className="rt-kpi-value-row">
                                <span className={`rt-kpi-value ${change === 'up' ? 'value-pulse-up' : change === 'down' ? 'value-pulse-down' : ''}`}>
                                    {card.value}
                                </span>
                                {change && (
                                    <span className={`rt-kpi-change ${change}`}>
                                        {change === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                    </span>
                                )}
                            </div>
                            {/* Sparkline placeholder bar */}
                            <div className="rt-kpi-bar">
                                <div
                                    className={`rt-kpi-bar-fill bg-gradient-to-r ${card.gradient}`}
                                    style={{
                                        width: `${Math.min(100, (typeof card.value === 'number' ? card.value : 50))}%`,
                                        transition: 'width 0.5s ease'
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Stats Row */}
            {stats && (
                <div className="rt-dash-bottom">
                    <div className="rt-bottom-item">
                        <span className="rt-bottom-label">Completed</span>
                        <span className="rt-bottom-value green">{stats.completedToday || 0}</span>
                    </div>
                    <div className="rt-bottom-sep" />
                    <div className="rt-bottom-item">
                        <span className="rt-bottom-label">Cancelled</span>
                        <span className="rt-bottom-value red">{stats.cancelledToday || 0}</span>
                    </div>
                    <div className="rt-bottom-sep" />
                    <div className="rt-bottom-item">
                        <span className="rt-bottom-label">Platform Fee</span>
                        <span className="rt-bottom-value amber">{formatCurrency(stats.platformFeeToday)}</span>
                    </div>
                    <div className="rt-bottom-sep" />
                    <div className="rt-bottom-item">
                        <span className="rt-bottom-label">Total Users</span>
                        <span className="rt-bottom-value blue">{stats.totalUsers || 0}</span>
                    </div>
                    <div className="rt-bottom-sep" />
                    <div className="rt-bottom-item">
                        <span className="rt-bottom-label">Transactions</span>
                        <span className="rt-bottom-value purple">{stats.todayTransactions || 0}</span>
                    </div>
                </div>
            )}

            <style>{`
                .rt-dashboard {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 20px;
                    padding: 24px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
                    margin-bottom: 24px;
                }

                .rt-dash-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .rt-dash-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .rt-dash-title h3 {
                    font-size: 16px;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0;
                }

                .rt-dash-badge {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 1px;
                }

                .rt-dash-badge.online {
                    background: rgba(34,197,94,0.1);
                    color: #22c55e;
                    border: 1px solid rgba(34,197,94,0.2);
                }

                .rt-dash-badge.offline {
                    background: rgba(239,68,68,0.1);
                    color: #ef4444;
                    border: 1px solid rgba(239,68,68,0.2);
                }

                .rt-dash-time {
                    font-size: 11px;
                    color: #94a3b8;
                    font-family: monospace;
                }

                .rt-dash-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                    margin-bottom: 20px;
                }

                @media (max-width: 1024px) {
                    .rt-dash-grid { grid-template-columns: repeat(2, 1fr); }
                }
                @media (max-width: 640px) {
                    .rt-dash-grid { grid-template-columns: 1fr; }
                }

                .rt-kpi-card {
                    background: #fafbfc;
                    border: 1px solid #f1f5f9;
                    border-radius: 16px;
                    padding: 18px;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }

                .rt-kpi-card:hover {
                    border-color: #e2e8f0;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
                    transform: translateY(-2px);
                }

                .rt-kpi-card.blink-up {
                    animation: blinkUp 0.8s ease;
                }

                .rt-kpi-card.blink-down {
                    animation: blinkDown 0.8s ease;
                }

                @keyframes blinkUp {
                    0% { border-color: #f1f5f9; }
                    30% { border-color: #22c55e; box-shadow: 0 0 20px rgba(34,197,94,0.15); }
                    100% { border-color: #f1f5f9; }
                }

                @keyframes blinkDown {
                    0% { border-color: #f1f5f9; }
                    30% { border-color: #ef4444; box-shadow: 0 0 20px rgba(239,68,68,0.15); }
                    100% { border-color: #f1f5f9; }
                }

                .rt-kpi-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 12px;
                }

                .rt-kpi-label {
                    font-size: 12px;
                    color: #64748b;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .rt-kpi-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                }

                .rt-kpi-value-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .rt-kpi-value {
                    font-size: 28px;
                    font-weight: 800;
                    color: #0f172a;
                    font-family: 'Inter', system-ui, sans-serif;
                    transition: color 0.3s ease;
                    line-height: 1.2;
                }

                .rt-kpi-value.value-pulse-up {
                    color: #22c55e;
                }

                .rt-kpi-value.value-pulse-down {
                    color: #ef4444;
                }

                .rt-kpi-change {
                    display: flex;
                    align-items: center;
                    padding: 2px;
                    border-radius: 6px;
                }

                .rt-kpi-change.up {
                    color: #22c55e;
                    background: rgba(34,197,94,0.1);
                }

                .rt-kpi-change.down {
                    color: #ef4444;
                    background: rgba(239,68,68,0.1);
                }

                .rt-kpi-bar {
                    margin-top: 12px;
                    height: 4px;
                    background: #e2e8f0;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .rt-kpi-bar-fill {
                    height: 100%;
                    border-radius: 4px;
                    min-width: 8px;
                }

                .rt-dash-bottom {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 20px;
                    padding: 16px;
                    background: #f8fafc;
                    border-radius: 12px;
                    border: 1px solid #f1f5f9;
                    flex-wrap: wrap;
                }

                .rt-bottom-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .rt-bottom-label {
                    font-size: 11px;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    font-weight: 500;
                }

                .rt-bottom-value {
                    font-size: 14px;
                    font-weight: 700;
                    font-family: monospace;
                }

                .rt-bottom-value.green { color: #22c55e; }
                .rt-bottom-value.red { color: #ef4444; }
                .rt-bottom-value.amber { color: #f59e0b; }
                .rt-bottom-value.blue { color: #3b82f6; }
                .rt-bottom-value.purple { color: #8b5cf6; }

                .rt-bottom-sep {
                    width: 1px;
                    height: 24px;
                    background: #e2e8f0;
                }
            `}</style>
        </div>
    );
};

export default RealTimeDashboard;
