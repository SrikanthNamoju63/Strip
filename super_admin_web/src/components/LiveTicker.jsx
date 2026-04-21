import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import {
    TrendingUp, TrendingDown, Activity, Users, Calendar,
    DollarSign, Zap, Heart, Clock, CheckCircle,
    Shield, Server, CreditCard, Stethoscope
} from 'lucide-react';

/**
 * AdminLiveTicker - Stock Market Style Real-Time Data Bar for Admin
 * Shows platform-wide KPIs streaming every second
 */
const LiveTicker = () => {
    const socket = useSocket();
    const [tickerData, setTickerData] = useState(null);
    const [prevData, setPrevData] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);

        const handleLiveTicker = (payload) => {
            setPrevData(tickerData);
            setTickerData(payload.data?.ticker || payload.data);
            setLastUpdate(new Date());
        };

        const handleAdminStats = (payload) => {
            setPrevData(tickerData);
            setTickerData(payload.data?.ticker || payload.data);
            setLastUpdate(new Date());
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('live_ticker', handleLiveTicker);
        socket.on('admin_stats_update', handleAdminStats);

        if (socket.connected) setIsConnected(true);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('live_ticker', handleLiveTicker);
            socket.off('admin_stats_update', handleAdminStats);
        };
    }, [socket, tickerData]);

    const getChangeIndicator = (current, previous, key) => {
        if (!previous || previous[key] === undefined) return 'neutral';
        if (current > previous[key]) return 'up';
        if (current < previous[key]) return 'down';
        return 'neutral';
    };

    const formatCurrency = (value) => {
        if (!value) return '₹0';
        if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
        if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
        return `₹${value.toFixed(0)}`;
    };

    const tickerItems = tickerData ? [
        {
            label: 'Total Revenue',
            value: formatCurrency(tickerData.todayRevenue || 0),
            icon: DollarSign,
            change: getChangeIndicator(tickerData.todayRevenue, prevData, 'todayRevenue'),
            color: '#22c55e',
            isFormatted: true
        },
        {
            label: 'Platform Fee',
            value: formatCurrency(tickerData.platformFeeToday || 0),
            icon: CreditCard,
            change: getChangeIndicator(tickerData.platformFeeToday, prevData, 'platformFeeToday'),
            color: '#f59e0b',
            isFormatted: true
        },
        {
            label: 'Appointments',
            value: tickerData.totalAppointmentsToday || 0,
            icon: Calendar,
            change: getChangeIndicator(tickerData.totalAppointmentsToday, prevData, 'totalAppointmentsToday'),
            color: '#3b82f6'
        },
        {
            label: 'Booked',
            value: tickerData.bookedToday || 0,
            icon: Clock,
            change: getChangeIndicator(tickerData.bookedToday, prevData, 'bookedToday'),
            color: '#f59e0b'
        },
        {
            label: 'Completed',
            value: tickerData.completedToday || 0,
            icon: CheckCircle,
            change: getChangeIndicator(tickerData.completedToday, prevData, 'completedToday'),
            color: '#10b981'
        },
        {
            label: 'Active Consults',
            value: tickerData.activeConsultations || 0,
            icon: Activity,
            change: getChangeIndicator(tickerData.activeConsultations, prevData, 'activeConsultations'),
            color: '#8b5cf6'
        },
        {
            label: 'Transactions',
            value: tickerData.todayTransactions || 0,
            icon: CreditCard,
            change: getChangeIndicator(tickerData.todayTransactions, prevData, 'todayTransactions'),
            color: '#06b6d4'
        },
        {
            label: 'Doctors Online',
            value: tickerData.onlineDoctors || 0,
            icon: Stethoscope,
            change: 'neutral',
            color: '#14b8a6'
        },
        {
            label: 'Connected Clients',
            value: tickerData.connectedClients || 0,
            icon: Server,
            change: 'neutral',
            color: '#6366f1'
        },
        {
            label: 'New Bookings (5m)',
            value: tickerData.recentBookings || 0,
            icon: Zap,
            change: getChangeIndicator(tickerData.recentBookings, prevData, 'recentBookings'),
            color: '#ec4899'
        },
        {
            label: 'Total Users',
            value: tickerData.totalUsers || 0,
            icon: Users,
            change: 'neutral',
            color: '#ef4444'
        },
        {
            label: 'Doctor Payout',
            value: formatCurrency(tickerData.doctorPayoutToday || 0),
            icon: Heart,
            change: getChangeIndicator(tickerData.doctorPayoutToday, prevData, 'doctorPayoutToday'),
            color: '#f43f5e',
            isFormatted: true
        },
    ] : [];

    const doubledItems = [...tickerItems, ...tickerItems];

    return (
        <div className="admin-live-ticker">
            {/* Connection Status */}
            <div className="aticker-status">
                <div className={`astatus-dot ${isConnected ? 'connected' : 'disconnected'}`} />
                <span className="astatus-text" style={{ color: isConnected ? '#22c55e' : '#ef4444' }}>
                    {isConnected ? 'LIVE' : 'CONNECTING'}
                </span>
                {lastUpdate && (
                    <span className="aupdate-time">
                        {lastUpdate.toLocaleTimeString()}
                    </span>
                )}
            </div>

            {/* Scrolling Ticker */}
            <div className="aticker-scroll-wrapper">
                <div className="aticker-scroll" ref={scrollRef}>
                    {doubledItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <div key={index} className="aticker-item">
                                <div className="aticker-icon" style={{ color: item.color }}>
                                    <Icon size={14} />
                                </div>
                                <span className="aticker-label">{item.label}</span>
                                <span className={`aticker-value ${item.change === 'up' ? 'val-up' : item.change === 'down' ? 'val-down' : ''}`}>
                                    {item.value}
                                </span>
                                {item.change === 'up' && <TrendingUp size={12} className="achange-up" />}
                                {item.change === 'down' && <TrendingDown size={12} className="achange-down" />}
                                <span className="aticker-sep">│</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <style>{`
                .admin-live-ticker {
                    background: linear-gradient(135deg, #020617 0%, #0f172a 40%, #1e1b4b 70%, #020617 100%);
                    border-bottom: 1px solid rgba(99, 102, 241, 0.3);
                    padding: 0;
                    overflow: hidden;
                    position: relative;
                    height: 42px;
                    display: flex;
                    align-items: center;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
                    z-index: 50;
                }

                .aticker-status {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 0 16px;
                    border-right: 1px solid rgba(255,255,255,0.08);
                    flex-shrink: 0;
                    min-width: 140px;
                    height: 100%;
                    background: rgba(0,0,0,0.3);
                }

                .astatus-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }

                .astatus-dot.connected {
                    background: #22c55e;
                    box-shadow: 0 0 10px rgba(34,197,94,0.7);
                    animation: admin-pulse 2s infinite;
                }

                .astatus-dot.disconnected {
                    background: #ef4444;
                    animation: admin-pulse 1s infinite;
                }

                @keyframes admin-pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.4; transform: scale(1.4); }
                }

                .astatus-text {
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 2px;
                    font-family: 'Monaco', 'Courier New', monospace;
                }

                .aupdate-time {
                    font-size: 10px;
                    color: rgba(255,255,255,0.3);
                    font-family: monospace;
                }

                .aticker-scroll-wrapper {
                    flex: 1;
                    overflow: hidden;
                    position: relative;
                    height: 100%;
                    mask-image: linear-gradient(
                        90deg,
                        transparent 0%,
                        black 2%,
                        black 98%,
                        transparent 100%
                    );
                }

                .aticker-scroll {
                    display: flex;
                    align-items: center;
                    height: 100%;
                    animation: admin-scroll 50s linear infinite;
                    will-change: transform;
                    width: max-content;
                }

                .aticker-scroll:hover {
                    animation-play-state: paused;
                }

                @keyframes admin-scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }

                .aticker-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 0 14px;
                    white-space: nowrap;
                    height: 100%;
                }

                .aticker-icon {
                    display: flex;
                    align-items: center;
                    opacity: 0.85;
                }

                .aticker-label {
                    font-size: 10px;
                    color: rgba(255,255,255,0.45);
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                }

                .aticker-value {
                    font-size: 13px;
                    font-weight: 700;
                    color: #e2e8f0;
                    font-family: 'Monaco', 'Courier New', monospace;
                    transition: all 0.3s ease;
                }

                .aticker-value.val-up {
                    color: #4ade80;
                    text-shadow: 0 0 12px rgba(74,222,128,0.5);
                }

                .aticker-value.val-down {
                    color: #f87171;
                    text-shadow: 0 0 12px rgba(248,113,113,0.5);
                }

                .achange-up { color: #4ade80; flex-shrink: 0; }
                .achange-down { color: #f87171; flex-shrink: 0; }

                .aticker-sep {
                    color: rgba(255,255,255,0.08);
                    font-size: 14px;
                    margin: 0 2px;
                }

                @media (max-width: 768px) {
                    .admin-live-ticker { height: 38px; }
                    .aticker-status { min-width: 80px; padding: 0 10px; }
                    .aupdate-time { display: none; }
                    .aticker-label { font-size: 9px; }
                    .aticker-value { font-size: 12px; }
                }
            `}</style>
        </div>
    );
};

export default LiveTicker;
