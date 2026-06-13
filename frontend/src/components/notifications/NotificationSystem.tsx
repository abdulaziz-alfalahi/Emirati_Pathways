import React, { useState, useEffect, useContext, createContext, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  X,
  Settings,
  RefreshCw,
  Briefcase,
  Users,
  GraduationCap,
  AlertCircle,
  Calendar,
  MessageSquare,
  Trash2,
  Filter,
  Search,
  Volume2,
  VolumeX
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { restClient } from '@/utils/api';
import { getNotificationRoute } from '@/utils/navigation';

// Types
interface Notification {
  id: string;
  notification_type: string;
  title: string;
  content: string;
  metadata?: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  read: boolean;
  read_at?: string;
}

interface NotificationPreferences {
  job_alerts: boolean;
  application_updates: boolean;
  interview_notifications: boolean;
  mentoring_reminders: boolean;
  educational_updates: boolean;
  system_announcements: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  quiet_hours: {
    enabled: boolean;
    start_time: string;
    end_time: string;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  preferences: NotificationPreferences;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  updatePreferences: (preferences: NotificationPreferences) => void;
  refreshNotifications: () => void;
  socket: Socket | null;
}

// Context
const NotificationContext = createContext<NotificationContextType | null>(null);

// Hook
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Provider Component
interface NotificationProviderProps {
  children: React.ReactNode;
  userId: string;
  userType: string;
  authToken: string;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  userId,
  userType,
  authToken
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    job_alerts: true,
    application_updates: true,
    interview_notifications: true,
    mentoring_reminders: true,
    educational_updates: true,
    system_announcements: true,
    email_notifications: true,
    push_notifications: true,
    quiet_hours: {
      enabled: false,
      start_time: '22:00',
      end_time: '08:00'
    }
  });

  // Refs for accessing latest state in closures (polling/socket callbacks)
  const preferencesRef = React.useRef(preferences);
  const lastNotificationTimeRef = React.useRef<string | null>(null);
  const shouldPollRef = React.useRef(true); // Control polling

  React.useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!authToken) return;

    // START ANTI-GRAVITY FIX: Use relative path to support Proxy/Ngrok/Production
    const socketUrl = import.meta.env.VITE_WEBSOCKET_URL || undefined; // Undefined = window.location

    console.log('🔌 Initializing WebSocket connection...');
    let newSocket: Socket | null = null;

    try {
      newSocket = io(socketUrl, {
        path: '/socket.io', // Make sure this matches vite.config.ts proxy
        auth: {
          token: authToken
        },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        autoConnect: true
      });

      newSocket.on('connect', () => {
        console.log('✅ Connected to notification server:', newSocket?.id);
        setIsConnected(true);
        shouldPollRef.current = true; // Re-enable polling on valid connection

        if (newSocket) {
          // Join user specific room
          newSocket.emit('join', { room: userId });

          // G12: Join dedicated notification push room
          newSocket.emit('join_notification_room', { user_id: userId });

          // Also join a generic "global" or role-based room if needed
          if (userType) {
            newSocket.emit('join', { room: `role_${userType}` });
          }
        }
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from notification server:', reason);
        setIsConnected(false);
        if (reason === 'io server disconnect') {
          // the disconnection was initiated by the server, you need to reconnect manually
          newSocket?.connect();
        }
      });

      newSocket.on('connect_error', (err) => {
        console.warn('⚠️ Socket connection error:', err.message);
        // Don't disable polling here; polling is the fallback!
      });

      newSocket.on('reconnect_attempt', (attempt) => {
        console.log(`🔄 Reconnection attempt ${attempt}...`);
      });

      // G12: Listen for real-time notification push from backend
      newSocket.on('new_notification', (data: any) => {
        console.log('🔔 Real-time notification received:', data);
        if (data && data.title) {
          // Add to notification list immediately (no poll wait)
          const newNotif: Notification = {
            id: data.id || `rt-${Date.now()}`,
            notification_type: data.type || 'system',
            title: data.title,
            content: data.message || '',
            metadata: data.metadata,
            priority: data.priority || 'medium',
            created_at: new Date().toISOString(),
            read: false
          };
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
          showToastNotification(newNotif);
        }
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('🔥 Critical WebSocket Initialization Error:', error);
    }

    return () => {
      console.log('🔌 Cleaning up WebSocket connection...');
      if (newSocket) {
        newSocket.off('connect');
        newSocket.off('disconnect');
        newSocket.off('connect_error');
        newSocket.off('reconnect_attempt');
        newSocket.off('new_notification');
        newSocket.close();
      }
    };
  }, [authToken, userId, userType]); // Added userId/userType dependencies so we rejoin rooms if they change

  // Load preferences and Initial Fetch on mount
  const showToastNotification = useCallback((notification: any) => {
    const { title, content, priority, notification_type } = notification;

    // Check if notifications are enabled and not in quiet hours
    const currentPrefs = preferencesRef.current;
    if (!currentPrefs.push_notifications) return;

    // Check quiet hours
    if (currentPrefs.quiet_hours.enabled) {
      const now = new Date();
      const currentTime = now.getHours().toString().padStart(2, '0') + ':' +
        now.getMinutes().toString().padStart(2, '0');

      if (currentTime >= currentPrefs.quiet_hours.start_time ||
        currentTime <= currentPrefs.quiet_hours.end_time) {
        return; // Skip notification during quiet hours
      }
    }

    const toastOptions = {
      duration: priority === 'critical' ? 10000 : 5000,
    };

    const handleToastClick = () => {
      const route = getNotificationRoute(notification_type, userType || '', notification.metadata);
      if (route) navigate(route);
    };

    const ToastContent = ({ t }: { t: any }) => (
      <div
        onClick={() => {
          handleToastClick();
          toast.dismiss(t.id);
        }}
        className="cursor-pointer hover:opacity-80 transition-opacity"
      >
        <p className="font-bold">{title}</p>
        <p className="text-sm">{content}</p>
      </div>
    );

    switch (priority) {
      case 'critical':
        toast.error((t) => <ToastContent t={t} />, toastOptions);
        break;
      case 'high':
        toast((t) => <ToastContent t={t} />, { ...toastOptions, icon: '⚠️' });
        break;
      default:
        toast((t) => <ToastContent t={t} />, { ...toastOptions, icon: '🔔' });
    }
  }, [userType, navigate]);

  const loadPreferences = useCallback(async () => {
    try {
      const response = await restClient.get('/api/communication/notifications/preferences', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (response.data.success && response.data.data) {
        setPreferences(prev => ({ ...prev, ...response.data.data }));
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  }, [authToken]);

  const fetchNotifications = useCallback(async () => {
    if (!shouldPollRef.current) return;

    try {
      const response = await restClient.get('/api/communication/notifications', {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { limit: 50 }
      });
      if (response.data.success && response.data.data) {
        const fetchedNotifications: Notification[] = response.data.data.notifications || [];

        setNotifications(fetchedNotifications);

        const unread = fetchedNotifications.filter((n: Notification) => !n.read).length;
        setUnreadCount(unread);

        if (fetchedNotifications.length > 0) {
          const newestTime = fetchedNotifications[0].created_at;

          if (lastNotificationTimeRef.current) {
            const newItems = fetchedNotifications.filter(n => n.created_at > lastNotificationTimeRef.current!);

            newItems.slice(0, 3).forEach(n => {
              showToastNotification(n);
            });
          }

          if (!lastNotificationTimeRef.current || newestTime > lastNotificationTimeRef.current) {
            lastNotificationTimeRef.current = newestTime;
          }
        }
      }
    } catch (error: any) {
      // console.error('Failed to fetch notifications:', error); // Reduce spam
      if (error.response && error.response.status === 401) {
        if (shouldPollRef.current) {
          console.warn('Authentication failed for notifications, stopping polling');
          shouldPollRef.current = false;
        }
      }
    }
  }, [authToken, showToastNotification]);

  // Load preferences and Initial Fetch on mount
  useEffect(() => {
    loadPreferences();

    // Initial fetch
    fetchNotifications();

    // Polling fallback: Run ALWAYS since WebSockets are unreliable in this environment
    const pollInterval = setInterval(() => {
      if (!shouldPollRef.current) return; // Skip if disabled
      // console.log('Polling for notifications...'); // Reduce log spam
      fetchNotifications();
    }, 15000); // Poll every 15 seconds

    return () => clearInterval(pollInterval);
  }, [loadPreferences, fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    // Optimistic UI Update
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId
          ? { ...n, read: true, read_at: new Date().toISOString() }
          : n
      )
    );
    // Decrease unread count safely
    setUnreadCount(prev => {
      const notif = notifications.find(n => n.id === notificationId);
      if (notif && !notif.read && prev > 0) return prev - 1;
      return prev;
    });

    try {
      // Call REST API
      await restClient.post(`/api/communication/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      // Also emit via socket if available for cross-device sync
      if (socket && isConnected) {
        socket.emit('mark_read', { user_id: userId, notification_id: notificationId });
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // We don't revert optimistic update to avoid UI flickering, next fetch will correct it if failed
    }
  }, [socket, userId, authToken, isConnected, notifications]);

  const markAllAsRead = useCallback(async () => {
    // Optimistic UI Update
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }))
    );
    setUnreadCount(0);

    try {
      await restClient.post('/api/communication/notifications/mark-all-read', {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (socket && isConnected) {
        socket.emit('mark_read', { user_id: userId, notification_id: 'all' });
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [socket, userId, authToken, isConnected]);

  const deleteNotification = useCallback((notificationId: string) => {
    if (socket) {
      socket.emit('delete_notification', { user_id: userId, notification_id: notificationId });
    }
  }, [socket, userId]);

  const updatePreferences = useCallback(async (newPreferences: NotificationPreferences) => {
    try {
      await restClient.post('/api/communication/notifications/preferences', newPreferences, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setPreferences(newPreferences);
      toast.success('Notification preferences updated');
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast.error('Failed to update preferences');
    }
  }, [authToken]);

  const refreshNotifications = useCallback(() => {
    if (socket) {
      socket.emit('get_notifications', { user_id: userId, limit: 50 });
    }
  }, [socket, userId]);

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    isConnected,
    preferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    refreshNotifications,
    socket
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// Notification Bell Component
export const NotificationBell: React.FC = () => {
  const { unreadCount, isConnected } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          {isConnected ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5 text-gray-400" />
          )}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <NotificationPanel onClose={() => setIsOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};

// Notification Panel Component
interface NotificationPanelProps {
  onClose?: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  } = useNotifications();
  const navigate = useNavigate();
  const { user, switchRole } = useAuth(); // Get current user + role switcher

  const handleNotificationClick = async (notification: any) => {
    // Mark as read if unread
    if (!notification.read) {
      markAsRead(notification.id);
    }

    const type = notification.notification_type;
    const metadata = notification.metadata || {};

    // ─── Cross-role routing: switch role if notification is for a different role ───
    const recipientRole = metadata.recipient_role;
    if (recipientRole && user?.role && recipientRole !== user.role) {
      try { await switchRole(recipientRole); } catch { /* best effort */ }
    }

    // Priority 1: Explicit Link in Metadata (Deep Linking Feature)
    if (metadata.link) {
      navigate(metadata.link);
      if (onClose) onClose();
      return;
    }

    // Fallback: Check for generic link property if not in metadata
    if (notification.link) {
      navigate(notification.link);
      if (onClose) onClose();
      return;
    }

    // Navigation Logic
    const isAdmin = user?.role === 'admin' || user?.role === 'admin';
    const isRecruiter = user?.role === 'recruiter' || user?.role === 'recruiter' || user?.user_type === 'recruiter' || user?.user_type === 'recruiter';
    const isHRManager = user?.role === 'employer_admin' || user?.role === 'employer_admin' || user?.user_type === 'employer_admin' || user?.user_type === 'employer_admin';
    const userRole = user?.role || user?.user_type || '';

    // Operator role → dashboard path mapping
    // Use centralized map and add local-only entries not in ROLE_DASHBOARD_MAP
    const operatorDashboardMap: Record<string, string> = {
      'mentor': '/mentor-dashboard',
      'training_provider': '/educator-dashboard',
      'assessor': '/assessor-dashboard',
      'growth_operator': '/growth-operator-dashboard',
      'talent_operator': '/growth-operator-dashboard',
      'employer_relations': '/growth-operator-dashboard',
      'education_operator': '/growth-operator-dashboard',
      'assessment_operator': '/growth-operator-dashboard',
      'mentorship_operator': '/growth-operator-dashboard',
      'community_operator': '/growth-operator-dashboard',
      'platform_operator': '/growth-operator-dashboard',
      'operator': '/growth-operator-dashboard',
      'call_center_agent': '/call-center-dashboard',
      'advisor': '/advisor-dashboard',
      'coach': '/coach-dashboard',
      'internship_coordinator': '/internship-coordinator-dashboard',
      'training_provider': '/training-center-dashboard',
    };
    // Fallback: any growth_operator_* sub-role not in the map → growth-operator-dashboard
    const operatorDashboard = operatorDashboardMap[userRole]
      || (userRole.startsWith('growth_operator') ? '/growth-operator-dashboard' : undefined);
    const isOperator = !!operatorDashboard;
    const isCallCenter = userRole === 'call_center_agent';
    // Default to isCandidate if not any other known role
    const isCandidate = !isRecruiter && !isHRManager && !isAdmin && !isOperator;


    // Helper to detect intent from text if type is ambiguous
    const text = (notification.title + ' ' + notification.content).toLowerCase();
    const isInterviewContext = text.includes('interview') || type === 'interview_scheduled';
    const isMessageContext = text.includes('message') || type === 'new_message';

    if (isMessageContext && !text.includes('status update')) { // Avoid capturing "Application Message" if that exists
      const conversationId = metadata.conversation_id || metadata.conversationId;
      const convParam = conversationId ? `&conversationId=${conversationId}` : '';
      if (isAdmin) {
        navigate(`/admin-dashboard?tab=messaging${conversationId ? `&conversation=${conversationId}` : ''}`);
      } else if (isCallCenter) {
        navigate('/call-center-dashboard?tab=live-chats');
      } else if (isCandidate) {
        navigate(`/candidate-dashboard?tab=messages${conversationId ? `&conversation=${conversationId}` : ''}`);
      } else if (isHRManager) {
        navigate(`/hr-dashboard?tab=messages${convParam}`);
      } else if (isRecruiter) {
        navigate(`/recruiter?tab=messages${convParam}`);
      } else if (isOperator) {
        const target = `${operatorDashboard}?tab=messages${convParam}`;
        console.log(`🔔 Notification: navigating operator to ${target} (role=${userRole}, dashboard=${operatorDashboard})`);
        navigate(target);
      } else {
        navigate(`/candidate-dashboard?tab=messages${conversationId ? `&conversationId=${conversationId}` : ''}`);
      }
    }
    else if (isInterviewContext) {
      if (isRecruiter) {
        navigate('/recruiter?tab=interviews');
      } else if (isHRManager) {
        navigate('/hr-dashboard?tab=interviews');
      } else {
        navigate('/candidate-dashboard?tab=interviews');
      }
    }
    else if (type === 'application_update' || type === 'application_submitted' || type === 'application_reviewed') {
      if (isRecruiter) {
        navigate('/recruiter/jobs');
      } else if (isHRManager) {
        navigate('/hr-dashboard?tab=positions');
      } else {
        navigate('/candidate-dashboard?tab=applications');
      }
    }
    else if (type === 'job_alert') {
      if (metadata.job_id) {
        navigate(`/jobs/${metadata.job_id}`); // TODO: HR view for specific job?
      } else {
        navigate('/jobs');
      }
    }
    // Fallback for System Announcements without explicit link (e.g. legacy feedback)
    else if (type === 'system_announcement') {
      const isFeedback = (metadata.type === 'bug' || metadata.type === 'feature' || metadata.title?.toLowerCase().includes('feedback') || metadata.title?.toLowerCase().includes('issue resolved'));
      const isLiveChatRelated = metadata.type === 'live_chat_request' || metadata.type === 'live_chat_accepted' ||
        metadata.type === 'live_chat_ended' || metadata.type === 'ticket_created' || metadata.type === 'ticket_status_update' ||
        text.includes('live chat') || text.includes('ticket');

      if (isFeedback) {
        if (user?.role === 'admin' || user?.role === 'admin') {
          navigate('/admin-dashboard?tab=feedback');
        } else {
          // New logic: Trigger Feedback Widget via Deep Link
          let basePath = '/candidate-dashboard';
          if (isRecruiter) basePath = '/recruiter-dashboard';
          if (isHRManager) basePath = '/hr-dashboard';

          navigate(`${basePath}?action=feedback_history`);
        }
      } else if (isLiveChatRelated) {
        // Route to the user's appropriate dashboard
        if (isCallCenter) {
          navigate('/call-center-dashboard?tab=live-chats');
        } else {
          navigate('/candidate-dashboard?tab=messages');
        }
      }
    }

    if (onClose) onClose();
  };

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread' && notification.read) return false;
    if (typeFilter !== 'all' && notification.notification_type !== typeFilter) return false;
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'job_alert':
        return <Briefcase className="h-4 w-4" />;
      case 'application_update':
        return <CheckCheck className="h-4 w-4" />;
      case 'interview_scheduled':
      case 'interview_rescheduled':
      case 'interview_cancelled':
        return <Calendar className="h-4 w-4" />;
      case 'mentoring_session':
        return <Users className="h-4 w-4" />;
      case 'educational_content':
        return <GraduationCap className="h-4 w-4" />;
      case 'system_announcement':
        return <CheckCheck className="h-4 w-4 text-green-600" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  return (
    <div className="w-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <BellRing className="h-5 w-5" />
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount}</Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshNotifications}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="p-3 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex space-x-2">
            <Button
              variant={filter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </Button>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <ScrollArea className="h-96">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Bell className="h-8 w-8 mb-2" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-1 rounded-full ${getPriorityColor(notification.priority)}`}>
                    {getNotificationIcon(notification.notification_type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {notification.content}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>

                      <div className="flex items-center space-x-1 ml-2">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t bg-gray-50">
        <NotificationSettings />
      </div>
    </div>
  );
};

// Notification Settings Component
const NotificationSettings: React.FC = () => {
  const { preferences, updatePreferences } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [localPreferences, setLocalPreferences] = useState(preferences);

  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  const handleSave = () => {
    updatePreferences(localPreferences);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full">
          <Settings className="h-4 w-4 mr-2" />
          Notification Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Notification Preferences</DialogTitle>
          <DialogDescription>
            Customize how you receive notifications
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="types" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="types">Types</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
          </TabsList>

          <TabsContent value="types" className="space-y-4">
            <div className="space-y-3">
              {[
                { key: 'job_alerts', label: 'Job Alerts', icon: Briefcase },
                { key: 'application_updates', label: 'Application Updates', icon: CheckCheck },
                { key: 'interview_notifications', label: 'Interview Notifications', icon: Calendar },
                { key: 'mentoring_reminders', label: 'Mentoring Reminders', icon: Users },
                { key: 'educational_updates', label: 'Educational Updates', icon: GraduationCap },
                { key: 'system_announcements', label: 'System Announcements', icon: AlertCircle }
              ].map(({ key, label, icon: Icon }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4 text-gray-500" />
                    <Label htmlFor={key} className="text-sm">{label}</Label>
                  </div>
                  <Switch
                    id={key}
                    checked={localPreferences[key as keyof NotificationPreferences] as boolean}
                    onCheckedChange={(checked) =>
                      setLocalPreferences(prev => ({ ...prev, [key]: checked }))
                    }
                  />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="delivery" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Volume2 className="h-4 w-4 text-gray-500" />
                  <Label htmlFor="push_notifications" className="text-sm">Push Notifications</Label>
                </div>
                <Switch
                  id="push_notifications"
                  checked={localPreferences.push_notifications}
                  onCheckedChange={(checked) =>
                    setLocalPreferences(prev => ({ ...prev, push_notifications: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  <Label htmlFor="email_notifications" className="text-sm">Email Notifications</Label>
                </div>
                <Switch
                  id="email_notifications"
                  checked={localPreferences.email_notifications}
                  onCheckedChange={(checked) =>
                    setLocalPreferences(prev => ({ ...prev, email_notifications: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <VolumeX className="h-4 w-4 text-gray-500" />
                    <Label htmlFor="quiet_hours" className="text-sm">Quiet Hours</Label>
                  </div>
                  <Switch
                    id="quiet_hours"
                    checked={localPreferences.quiet_hours?.enabled || false}
                    onCheckedChange={(checked) =>
                      setLocalPreferences(prev => ({
                        ...prev,
                        quiet_hours: {
                          ...(prev.quiet_hours || { start_time: '22:00', end_time: '08:00' }),
                          enabled: checked
                        }
                      }))
                    }
                  />
                </div>

                {localPreferences.quiet_hours && localPreferences.quiet_hours.enabled && (
                  <div className="grid grid-cols-2 gap-2 ml-6">
                    <div>
                      <Label htmlFor="start_time" className="text-xs text-gray-500">From</Label>
                      <input
                        type="time"
                        id="start_time"
                        value={localPreferences.quiet_hours.start_time}
                        onChange={(e) =>
                          setLocalPreferences(prev => ({
                            ...prev,
                            quiet_hours: { ...prev.quiet_hours, start_time: e.target.value }
                          }))
                        }
                        className="w-full text-xs border rounded px-2 py-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_time" className="text-xs text-gray-500">To</Label>
                      <input
                        type="time"
                        id="end_time"
                        value={localPreferences.quiet_hours.end_time}
                        onChange={(e) =>
                          setLocalPreferences(prev => ({
                            ...prev,
                            quiet_hours: { ...prev.quiet_hours, end_time: e.target.value }
                          }))
                        }
                        className="w-full text-xs border rounded px-2 py-1"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Preferences
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// NotificationSystem export removed as it was undefined

