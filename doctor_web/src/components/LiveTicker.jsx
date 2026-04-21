import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import {
    TrendingUp, TrendingDown, Activity, Users, Calendar,
    DollarSign, Zap, Heart, Clock, CheckCircle
} from 'lucide-react';

/**
 * LiveTicker - Stock Market Style Real-Time Data Bar
 * Scrolls continuously with live data from Socket.IO
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

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('live_ticker', handleLiveTicker);

        if (socket.connected) setIsConnected(true);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('live_ticker', handleLiveTicker);
        };
    }, [socket, tickerData]);

    const getChangeIndicator = (current, previous, key) => {
        if (!previous || previous[key] === undefined) return 'neutral';
        if (current > previous[key]) return 'up';
        if (current < previous[key]) return 'down';
        return 'neutral';
    };

    const formatCurrency = (value) => {
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
        if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
        return `₹${value?.toFixed(0) || 0}`;
    };

    const tickerItems = tickerData ? [
        {
            label: 'Appointments Today',
            value: tickerData.totalAppointmentsToday || 0,
            icon: Calendar,
            change: getChangeIndicator(tickerData.totalAppointmentsToday, prevData, 'totalAppointmentsToday'),
            color: '#3b82f6'
        },
        {
            label: 'Completed',
            value: tickerData.completedToday || 0,
            icon: CheckCircle,
            change: getChangeIndicator(tickerData.completedToday, prevData, 'completedToday'),
            color: '#10b981'
        },
        {
            label: 'Revenue Today',
            value: formatCurrency(tickerData.todayRevenue || 0),
            icon: DollarSign,
            change: getChangeIndicator(tickerData.todayRevenue, prevData, 'todayRevenue'),
            color: '#f59e0b',
            isFormatted: true
        },
        {
            label: 'Active Consults',
            value: tickerData.activeConsultations || 0,
            icon: Activity,
            change: getChangeIndicator(tickerData.activeConsultations, prevData, 'activeConsultations'),
            color: '#8b5cf6'
        },
        {
            label: 'Doctors Online',
            value: tickerData.onlineDoctors || 0,
            icon: Users,
            change: 'neutral',
            color: '#06b6d4'
        },
        {
            label: 'New Bookings (5m)',
            value: tickerData.recentBookings || 0,
            icon: Zap,
            change: getChangeIndicator(tickerData.recentBookings, prevData, 'recentBookings'),
            color: '#ec4899'
        },
        {
            label: 'In Progress',
            value: tickerData.inProgressToday || 0,
            icon: Clock,
            change: getChangeIndicator(tickerData.inProgressToday, prevData, 'inProgressToday'),
            color: '#14b8a6'
        },
        {
            label: 'Platform Users',
            value: tickerData.totalUsers || 0,
            icon: Heart,
            change: 'neutral',
            color: '#ef4444'
        },
    ] : [];

    // Double the items for seamless scrolling
    const doubledItems = [...tickerItems, ...tickerItems];

    return (
        <div className="live-ticker-container">
            {/* Connection Status */}
            <div className="ticker-status">
                <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
                <span className="status-text">
                    {isConnected ? 'LIVE' : 'CONNECTING...'}
                </span>
                {lastUpdate && (
                    <span className="update-time">
                        {lastUpdate.toLocaleTimeString()}
                    </span>
                )}
            </div>

            {/* Scrolling Ticker */}
            <div className="ticker-scroll-wrapper">
                <div className="ticker-scroll" ref={scrollRef}>
                    {doubledItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <div key={index} className="ticker-item">
                                <div className="ticker-item-icon" style={{ color: item.color }}>
                                    <Icon size={14} />
                                </div>
                                <span className="ticker-item-label">{item.label}</span>
                                <span className={`ticker-item-value ${item.change === 'up' ? 'value-up' : item.change === 'down' ? 'value-down' : ''}`}>
                                    {item.isFormatted ? item.value : item.value}
                                </span>
                                {item.change === 'up' && <TrendingUp size={12} className="change-icon up" />}
                                {item.change === 'down' && <TrendingDown size={12} className="change-icon down" />}
                                <div className="ticker-separator">•</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <style>{`
                .live-ticker-container {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
                    border-bottom: 1px solid rgba(59, 130, 246, 0.3);
                    padding: 0;
                    overflow: hidden;
                    position: relative;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.3);
                    z-index: 50;
                }

                .ticker-status {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 0 16px;
                    border-right: 1px solid rgba(255,255,255,0.1);
                    flex-shrink: 0;
                    min-width: 130px;
                    height: 100%;
                    background: rgba(0,0,0,0.2);
                }

                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }

                .status-dot.connected {
                    background: #22c55e;
                    box-shadow: 0 0 8px rgba(34,197,94,0.6);
                    animation: pulse-dot 2s infinite;
                }

                .status-dot.disconnected {
                    background: #ef4444;
                    animation: pulse-dot 1s infinite;
                }

                @keyframes pulse-dot {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.3); }
                }

                .status-text {
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 1.5px;
                    color: #22c55e;
                    font-family: 'Monaco', 'Courier New', monospace;
                }

                .status-dot.disconnected + .status-text {
                    color: #ef4444;
                }

                .update-time {
                    font-size: 10px;
                    color: rgba(255,255,255,0.4);
                    font-family: 'Monaco', 'Courier New', monospace;
                }

                .ticker-scroll-wrapper {
                    flex: 1;
                    overflow: hidden;
                    position: relative;
                    height: 100%;
                    mask-image: linear-gradient(
                        90deg,
                        transparent 0%,
                        black 3%,
                        black 97%,
                        transparent 100%
                    );
                }

                .ticker-scroll {
                    display: flex;
                    align-items: center;
                    height: 100%;
                    animation: scroll-ticker 40s linear infinite;
                    will-change: transform;
                    width: max-content;
                }

                .ticker-scroll:hover {
                    animation-play-state: paused;
                }

                @keyframes scroll-ticker {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }

                .ticker-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 0 12px;
                    white-space: nowrap;
                    height: 100%;
                }

                .ticker-item-icon {
                    display: flex;
                    align-items: center;
                    opacity: 0.9;
                }

                .ticker-item-label {
                    font-size: 11px;
                    color: rgba(255,255,255,0.5);
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .ticker-item-value {
                    font-size: 13px;
                    font-weight: 700;
                    color: #ffffff;
                    font-family: 'Monaco', 'Courier New', monospace;
                    transition: color 0.3s ease;
                }

                .ticker-item-value.value-up {
                    color: #22c55e;
                    text-shadow: 0 0 8px rgba(34,197,94,0.4);
                }

                .ticker-item-value.value-down {
                    color: #ef4444;
                    text-shadow: 0 0 8px rgba(239,68,68,0.4);
                }

                .change-icon {
                    flex-shrink: 0;
                }

                .change-icon.up {
                    color: #22c55e;
                }

                .change-icon.down {
                    color: #ef4444;
                }

                .ticker-separator {
                    color: rgba(255,255,255,0.15);
                    font-size: 8px;
                    margin: 0 4px;
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .live-ticker-container {
                        height: 36px;
                    }
                    .ticker-status {
                        min-width: 80px;
                        padding: 0 10px;
                    }
                    .update-time {
                        display: none;
                    }
                    .ticker-item-label {
                        font-size: 10px;
                    }
                    .ticker-item-value {
                        font-size: 12px;
                    }
                }
            `}</style>
        </div>
    );
};

export default LiveTicker;
