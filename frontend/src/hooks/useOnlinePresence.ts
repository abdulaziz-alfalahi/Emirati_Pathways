
import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '@/components/notifications/NotificationSystem';

/**
 * Hook that tracks which users are currently online via Socket.IO presence events.
 * Returns a Set of online user IDs and an `isOnline(userId)` helper.
 */
export function useOnlinePresence() {
    const { socket } = useNotifications();
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!socket) return;

        // Ask the server for the current list once on mount / reconnect
        socket.emit('get_online_users');

        const handleOnlineUsers = (data: { users: string[] }) => {
            setOnlineUsers(new Set(data.users));
        };

        const handleUserOnline = (data: { user_id: string }) => {
            setOnlineUsers(prev => {
                const next = new Set(prev);
                next.add(data.user_id);
                return next;
            });
        };

        const handleUserOffline = (data: { user_id: string }) => {
            setOnlineUsers(prev => {
                const next = new Set(prev);
                next.delete(data.user_id);
                return next;
            });
        };

        socket.on('online_users', handleOnlineUsers);
        socket.on('user_online', handleUserOnline);
        socket.on('user_offline', handleUserOffline);

        return () => {
            socket.off('online_users', handleOnlineUsers);
            socket.off('user_online', handleUserOnline);
            socket.off('user_offline', handleUserOffline);
        };
    }, [socket]);

    const isOnline = useCallback(
        (userId: string | number) => onlineUsers.has(String(userId)),
        [onlineUsers],
    );

    return { onlineUsers, isOnline };
}
