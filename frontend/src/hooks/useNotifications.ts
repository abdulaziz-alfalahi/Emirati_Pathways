
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Notification } from '@/types/notifications';
import { useToast } from '@/hooks/use-toast';
import { restClient } from '@/utils/api';

export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Use Backend API instead of Supabase Direct to resolve ID mismatch (Int vs UUID)
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      // Don't set loading on polling updates (silent refresh)
      // Only initial load needs loading state
      const response = await restClient.get('/api/communication/notifications?limit=20');

      if (response.data.success) {
        const fetchedNotes = response.data.data.notifications;

        // Transform backend response to frontend types if needed
        // Backend returns generic objects, we need Notification interface
        const formattedNotes: Notification[] = fetchedNotes.map((n: any) => {
          // Parse metadata if string
          let meta = n.metadata;
          if (typeof meta === 'string') {
            try { meta = JSON.parse(meta); } catch (e) { }
          }

          return {
            id: n.id,
            user_id: n.user_id,
            type: n.notification_type || n.type, // Handle naming diffs
            title: n.title,
            message: n.content || n.message,
            link: meta?.link, // or derive from type
            is_read: !!n.read_at,
            created_at: n.created_at,
            read_at: n.read_at,
            metadata: meta || {}
          };
        });

        setNotifications(formattedNotes);
        setUnreadCount(response.data.data.unread_count || formattedNotes.filter(n => !n.is_read).length); // Backend returns unread_count
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Silent fail on polling usually better than toast spam
    } finally {
      setLoading(false);
    }
  }, [user]); // user dependency critical

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      // Optimistic Update
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      await restClient.post(`/api/communication/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert if critical, but for read status usually acceptable to drift slightly until next poll
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      // Optimistic Update
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);

      await restClient.post(`/api/communication/notifications/mark-all-read`);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      fetchNotifications();
    }
  };

  useEffect(() => {
    if (user) {
      // Initial Fetch
      fetchNotifications();

      // Polling Strategy (30 seconds)
      // Replacing Socket for reliability given architecture mismatch
      const intervalId = setInterval(() => {
        fetchNotifications();
      }, 30000);

      return () => clearInterval(intervalId);
    }
  }, [user, fetchNotifications]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications
  };
};
