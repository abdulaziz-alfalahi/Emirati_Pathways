import { useState, useEffect } from 'react';
import { restClient } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

/**
 * Hook that fetches and returns the current user's unread message count.
 * Polls every 60 seconds and can also be refreshed on demand.
 */
export function useUnreadMessageCount() {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchCount = async () => {
        if (!user?.id) return;
        try {
            const res = await restClient.get('/api/communication/stats');
            if (res.data?.success && res.data?.data) {
                const stats = res.data.data;
                setUnreadCount(stats.unread_messages || 0);
            }
        } catch {
            // Silently ignore — non-critical
        }
    };

    useEffect(() => {
        fetchCount();
        const interval = setInterval(fetchCount, 60000); // Poll every 60s
        return () => clearInterval(interval);
    }, [user?.id]);

    return { unreadCount, refreshUnreadCount: fetchCount };
}
