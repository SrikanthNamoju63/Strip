import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AdminAuthContext } from './AdminAuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

/**
 * Enhanced Admin Socket Provider with real-time dashboard support
 */
export const SocketProvider = ({ children }) => {
    const { user } = useContext(AdminAuthContext);
    const [socket, setSocket] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');

    useEffect(() => {
        if (user) {
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
                console.log('⚡ Admin Socket connected');
                setConnectionStatus('connected');
                // Join admin room for admin-specific broadcasts
                newSocket.emit('join_room', 'admin');
                // Subscribe to all ticker channels
                newSocket.emit('subscribe_ticker', [
                    'appointments', 'revenue', 'platform', 'doctors', 'users', 'payments'
                ]);
            });

            newSocket.on('disconnect', (reason) => {
                console.log('🔌 Admin Socket disconnected:', reason);
                setConnectionStatus('disconnected');
            });

            newSocket.on('reconnect', () => {
                setConnectionStatus('connected');
                newSocket.emit('join_room', 'admin');
            });

            // Real-time notifications
            newSocket.on('notification', (data) => {
                console.log('🔔 Admin Notification:', data);
                toast(data.message || 'New update received', {
                    icon: data.type === 'warning' ? '⚠️' : data.type === 'error' ? '❌' : '🔔',
                    duration: 5000,
                    style: {
                        background: '#1e293b',
                        color: '#fff',
                        borderRadius: '12px',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    },
                });
            });

            // Appointment updates
            newSocket.on('appointment_update', (data) => {
                console.log('📅 Appointment update:', data);
                const actionEmoji = {
                    'BOOKED': '🆕',
                    'CANCELLED': '❌',
                    'COMPLETED': '✅',
                    'IN_PROGRESS': '🔄',
                };
                toast(`${actionEmoji[data.action] || '📋'} Appointment ${data.action?.toLowerCase() || 'updated'}`, {
                    duration: 3000,
                    style: {
                        background: '#1e293b',
                        color: '#fff',
                        borderRadius: '12px',
                    },
                });
            });

            // Payment updates
            newSocket.on('payment_update', (data) => {
                console.log('💰 Payment update:', data);
                toast('💰 New payment processed', {
                    duration: 3000,
                    style: {
                        background: '#064e3b',
                        color: '#fff',
                        borderRadius: '12px',
                    },
                });
            });

            newSocket.on('connect_error', (error) => {
                console.warn('Admin socket connection error:', error.message);
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
