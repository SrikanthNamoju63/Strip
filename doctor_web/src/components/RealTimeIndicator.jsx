import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Activity, Wifi, WifiOff, Clock, Zap } from 'lucide-react';

/**
 * RealTimeIndicator - Shows real-time connection status and live activity feed
 * Sits in the top bar or dashboard showing live platform activity
 */
const RealTimeIndicator = ({ compact = false }) => {
    const socket = useSocket();
    const [isConnected, setIsConnected] = useState(false);
    const [latency, setLatency] = useState(null);
    const [liveData, setLiveData] = useState(null);
    const [activityLog, setActivityLog] = useState([]);

    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);

        const handleLiveTicker = (payload) => {
            setLiveData(payload.data?.ticker || payload.data);
        };

        // Appointment updates for activity feed
        const handleAppointmentUpdate = (data) => {
            const newActivity = {
                id: Date.now(),
                type: data.action || 'update',
                message: getActivityMessage(data),
                time: new Date(),
            };
            setActivityLog(prev => [newActivity, ...prev].slice(0, 5)); // Keep last 5
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('live_ticker', handleLiveTicker);
        socket.on('appointment_update', handleAppointmentUpdate);
        socket.on('notification', handleAppointmentUpdate);

        if (socket.connected) setIsConnected(true);

        // Ping for latency measurement every 5 seconds
        const pingInterval = setInterval(() => {
            if (socket.connected) {
                const start = Date.now();
                socket.emit('ping_server', { clientTime: start });
                socket.once('pong_server', () => {
                    setLatency(Date.now() - start);
                });
            }
        }, 5000);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('live_ticker', handleLiveTicker);
            socket.off('appointment_update', handleAppointmentUpdate);
            socket.off('notification', handleAppointmentUpdate);
            clearInterval(pingInterval);
        };
    }, [socket]);

    const getActivityMessage = (data) => {
        if (data.title) return data.title;
        if (data.action === 'BOOKED') return 'New appointment booked';
        if (data.action === 'COMPLETED') return 'Appointment completed';
        if (data.action === 'CANCELLED') return 'Appointment cancelled';
        return 'New activity detected';
    };

    if (compact) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '20px',
                background: isConnected ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${isConnected ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}>
                <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: isConnected ? '#22c55e' : '#ef4444',
                    boxShadow: isConnected ? '0 0 8px rgba(34,197,94,0.5)' : '0 0 8px rgba(239,68,68,0.5)',
                    animation: 'pulse-dot 2s infinite',
                }} />
                <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: isConnected ? '#22c55e' : '#ef4444',
                    letterSpacing: '1px',
                }}>
                    {isConnected ? 'LIVE' : 'OFFLINE'}
                </span>
                {latency !== null && isConnected && (
                    <span style={{
                        fontSize: '10px',
                        color: latency < 100 ? '#22c55e' : latency < 300 ? '#f59e0b' : '#ef4444',
                        fontFamily: 'monospace',
                    }}>
                        {latency}ms
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className="realtime-indicator">
            {/* Status Header */}
            <div className="rt-header">
                <div className="rt-status">
                    {isConnected ? <Wifi size={14} color="#22c55e" /> : <WifiOff size={14} color="#ef4444" />}
                    <span className={`rt-status-text ${isConnected ? 'online' : 'offline'}`}>
                        {isConnected ? 'Real-Time Connected' : 'Reconnecting...'}
                    </span>
                </div>
                {latency !== null && (
                    <div className="rt-latency">
                        <Zap size={10} />
                        <span>{latency}ms</span>
                    </div>
                )}
            </div>

            {/* Live Stats */}
            {liveData && (
                <div className="rt-stats-grid">
                    <div className="rt-stat">
                        <span className="rt-stat-value">{liveData.activeConsultations || 0}</span>
                        <span className="rt-stat-label">Active</span>
                    </div>
                    <div className="rt-stat">
                        <span className="rt-stat-value">{liveData.recentBookings || 0}</span>
                        <span className="rt-stat-label">New (5m)</span>
                    </div>
                    <div className="rt-stat">
                        <span className="rt-stat-value">{liveData.onlineDoctors || 0}</span>
                        <span className="rt-stat-label">Online</span>
                    </div>
                </div>
            )}

            {/* Activity Feed */}
            {activityLog.length > 0 && (
                <div className="rt-activity">
                    {activityLog.map((activity) => (
                        <div key={activity.id} className="rt-activity-item" style={{
                            animation: 'slideIn 0.3s ease-out'
                        }}>
                            <Activity size={10} />
                            <span className="rt-activity-text">{activity.message}</span>
                            <span className="rt-activity-time">
                                {activity.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                .realtime-indicator {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 16px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                }

                .rt-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }

                .rt-status {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .rt-status-text {
                    font-size: 12px;
                    font-weight: 600;
                }

                .rt-status-text.online { color: #22c55e; }
                .rt-status-text.offline { color: #ef4444; }

                .rt-latency {
                    display: flex;
                    align-items: center;
                    gap: 3px;
                    font-size: 10px;
                    color: #94a3b8;
                    font-family: monospace;
                }

                .rt-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 8px;
                    margin-bottom: 12px;
                }

                .rt-stat {
                    text-align: center;
                    padding: 8px 4px;
                    background: #f8fafc;
                    border-radius: 10px;
                }

                .rt-stat-value {
                    display: block;
                    font-size: 18px;
                    font-weight: 700;
                    color: #1e293b;
                    font-family: 'Monaco', monospace;
                }

                .rt-stat-label {
                    font-size: 10px;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .rt-activity {
                    border-top: 1px solid #f1f5f9;
                    padding-top: 10px;
                }

                .rt-activity-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 0;
                    color: #64748b;
                    font-size: 11px;
                }

                .rt-activity-text {
                    flex: 1;
                }

                .rt-activity-time {
                    color: #94a3b8;
                    font-size: 10px;
                    font-family: monospace;
                }

                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes pulse-dot {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
};

export default RealTimeIndicator;
