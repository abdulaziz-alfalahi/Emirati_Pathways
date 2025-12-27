import React, { useState, useEffect, useContext, createContext, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
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
import { toast } from 'sonner';
import { restClient } from '@/utils/api';

// Types
interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
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

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:5000', {
      auth: {
        token: authToken
      },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to notification server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from notification server');
      setIsConnected(false);
    });

    newSocket.on('connection_established', (data) => {
      console.log('Connection established:', data);
      setNotifications(data.recent_notifications || []);
      setUnreadCount(data.unread_count || 0);
    });

    newSocket.on('new_notification', (data) => {
      console.log('New notification received:', data);
      
      const newNotification = data.notification;
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(data.unread_count);

      // Show toast notification
      showToastNotification(newNotification);
    });

    newSocket.on('notifications_updated', (data) => {
      console.log('Notifications updated:', data);
      
      if (data.action === 'mark_read') {
        setNotifications(prev => 
          prev.map(n => 
            n.id === data.notification_id 
              ? { ...n, read: true, read_at: new Date().toISOString() }
              : n
          )
        );
      } else if (data.action === 'mark_all_read') {
        setNotifications(prev => 
          prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }))
        );
      } else if (data.action === 'delete') {
        setNotifications(prev => prev.filter(n => n.id !== data.notification_id));
      }
      
      setUnreadCount(data.unread_count);
    });

    newSocket.on('broadcast_notification', (data) => {
      console.log('Broadcast notification received:', data);
      showToastNotification(data);
    });

    newSocket.on('error', (error) => {
      console.error('WebSocket error:', error);
      toast.error('Notification system error: ' + error.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [authToken]);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const showToastNotification = (notification: any) => {
    const { title, message, priority, type } = notification;
    
    // Check if notifications are enabled and not in quiet hours
    if (!preferences.push_notifications) return;
    
    // Check quiet hours
    if (preferences.quiet_hours.enabled) {
      const now = new Date();
      const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                         now.getMinutes().toString().padStart(2, '0');
      
      if (currentTime >= preferences.quiet_hours.start_time || 
          currentTime <= preferences.quiet_hours.end_time) {
        return; // Skip notification during quiet hours
      }
    }

    const toastOptions = {
      description: message,
      duration: priority === 'critical' ? 10000 : 5000,
    };

    switch (priority) {
      case 'critical':
        toast.error(title, toastOptions);
        break;
      case 'high':
        toast.warning(title, toastOptions);
        break;
      default:
        toast.info(title, toastOptions);
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await restClient.get('/api/notifications/preferences', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setPreferences(response.data.preferences);
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  };

  const markAsRead = useCallback((notificationId: string) => {
    if (socket) {
      socket.emit('mark_read', { user_id: userId, notification_id: notificationId });
    }
  }, [socket, userId]);

  const markAllAsRead = useCallback(() => {
    if (socket) {
      socket.emit('mark_read', { user_id: userId, notification_id: 'all' });
    }
  }, [socket, userId]);

  const deleteNotification = useCallback((notificationId: string) => {
    if (socket) {
      socket.emit('delete_notification', { user_id: userId, notification_id: notificationId });
    }
  }, [socket, userId]);

  const updatePreferences = useCallback(async (newPreferences: NotificationPreferences) => {
    try {
      await restClient.post('/api/notifications/preferences', newPreferences, {
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
    refreshNotifications
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
  
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread' && notification.read) return false;
    if (typeFilter !== 'all' && notification.type !== typeFilter) return false;
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'job_alert':
        return <Briefcase className="h-4 w-4" />;
      case 'application_update':
        return <CheckCheck className="h-4 w-4" />;
      case 'interview_scheduled':
        return <Calendar className="h-4 w-4" />;
      case 'mentoring_session':
        return <Users className="h-4 w-4" />;
      case 'educational_content':
        return <GraduationCap className="h-4 w-4" />;
      case 'system_announcement':
        return <AlertCircle className="h-4 w-4" />;
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
    <div className="w-full">
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
            <Settings className="h-4 w-4" />
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
                className={`p-3 hover:bg-gray-50 transition-colors ${
                  !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-1 rounded-full ${getPriorityColor(notification.priority)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {notification.message}
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
                            onClick={() => markAsRead(notification.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
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
                    checked={localPreferences.quiet_hours.enabled}
                    onCheckedChange={(checked) =>
                      setLocalPreferences(prev => ({
                        ...prev,
                        quiet_hours: { ...prev.quiet_hours, enabled: checked }
                      }))
                    }
                  />
                </div>
                
                {localPreferences.quiet_hours.enabled && (
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

export default NotificationSystem;
