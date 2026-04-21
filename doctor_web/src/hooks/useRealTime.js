import { useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

/**
 * useRealTime - Hook that auto-refreshes page data when socket events fire
 * 
 * Usage:
 *   useRealTime({
 *     events: ['appointment_update', 'notification'],
 *     onEvent: (eventName, data) => { fetchData(); },
 *   });
 * 
 * Or simpler:
 *   useRealTime({ events: ['appointment_update'], refetch: fetchMyData });
 */
const useRealTime = ({ events = [], onEvent, refetch, debounceMs = 500 }) => {
    const socket = useSocket();
    const debounceRef = useRef(null);

    const debouncedRefetch = useCallback(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            if (refetch) refetch();
        }, debounceMs);
    }, [refetch, debounceMs]);

    useEffect(() => {
        if (!socket) return;

        const handlers = {};

        events.forEach(eventName => {
            handlers[eventName] = (data) => {
                console.log(`🔄 Real-time update [${eventName}]:`, data);
                if (onEvent) onEvent(eventName, data);
                if (refetch) debouncedRefetch();
            };
            socket.on(eventName, handlers[eventName]);
        });

        return () => {
            events.forEach(eventName => {
                if (handlers[eventName]) {
                    socket.off(eventName, handlers[eventName]);
                }
            });
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [socket, events.join(','), onEvent, debouncedRefetch]);

    return { isConnected: !!socket?.connected };
};

export default useRealTime;
