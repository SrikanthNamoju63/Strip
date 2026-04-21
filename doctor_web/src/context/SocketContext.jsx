import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { notification } from 'antd';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

/**
 * Enhanced Socket Provider with real-time ticker support
 */
export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [reconnectAttempts, setReconnectAttempts] = useState(0);

    useEffect(() => {
        if (user && user._id) {
            const SOCKET_URL = 'http://localhost:6002';

            const newSocket = io(SOCKET_URL, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 20000,
            });

            newSocket.on('connect', () => {
                console.log('⚡ Socket connected');
                setConnectionStatus('connected');
                setReconnectAttempts(0);

                // Join Doctor Room for personalized updates
                const roomName = `doctor_${user._id}`;
                newSocket.emit('join_room', roomName);
                console.log(`📌 Joined room: ${roomName}`);

                // Subscribe to ticker channels
                newSocket.emit('subscribe_ticker', ['appointments', 'revenue', 'platform']);
            });

            newSocket.on('disconnect', (reason) => {
                console.log('🔌 Socket disconnected:', reason);
                setConnectionStatus('disconnected');
            });

            newSocket.on('reconnect_attempt', (attempt) => {
                setReconnectAttempts(attempt);
                setConnectionStatus('reconnecting');
            });

            newSocket.on('reconnect', () => {
                setConnectionStatus('connected');
                setReconnectAttempts(0);
                // Re-join room after reconnect
                const roomName = `doctor_${user._id}`;
                newSocket.emit('join_room', roomName);
            });

            // Handle notifications with sound/visual feedback
            newSocket.on('notification', (data) => {
                console.log('🔔 Notification received:', data);
                notification.open({
                    message: data.title || 'New Notification',
                    description: data.message,
                    type: data.type === 'success' ? 'success' : data.type === 'warning' ? 'warning' : 'info',
                    duration: 5,
                    placement: 'topRight',
                    style: {
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    }
                });
            });

            // Handle appointment updates
            newSocket.on('appointment_update', (data) => {
                console.log('📅 Appointment update:', data);
                const messages = {
                    'BOOKED': '🆕 New appointment booked!',
                    'CANCELLED': '❌ Appointment cancelled',
                    'COMPLETED': '✅ Appointment completed',
                    'IN_PROGRESS': '🔄 Appointment in progress',
                };
                const msg = messages[data.action] || 'Appointment updated';
                notification.info({
                    message: msg,
                    duration: 3,
                    placement: 'topRight',
                });
            });

            newSocket.on('connect_error', (error) => {
                console.warn('Socket connection error:', error.message);
                setConnectionStatus('error');
            });

            setSocket(newSocket);

            return () => {
                newSocket.close();
            };
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
                setConnectionStatus('disconnected');
            }
        }
    }, [user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
