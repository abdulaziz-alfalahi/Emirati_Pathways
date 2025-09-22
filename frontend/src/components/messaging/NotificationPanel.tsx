
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Briefcase, Calendar, FileText, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'application' | 'event' | 'message';
  createdAt: string;
  isRead: boolean;
  actionUrl?: string;
}

const NotificationPanel: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  
  useEffect(() => {
    if (!user) return;
    
    // In a real implementation, we would fetch notifications from the database
    // For demonstration, we'll use mock data
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'Job Application Update',
        message: 'Your application for Software Developer at Tech Co has been reviewed.',
        type: 'application',
        createdAt: new Date().toISOString(),
        isRead: false,
        actionUrl: '/job-matching'
      },
      {
        id: '2',
        title: 'Interview Scheduled',
        message: 'You have an interview scheduled for tomorrow at 10:00 AM.',
        type: 'event',
        createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        isRead: true,
        actionUrl: '/career-advisory/interviews'
      },
      {
        id: '3',
        title: 'New Message',
        message: 'You have received a new message from Career Advisor Sarah.',
        type: 'message',
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        isRead: false,
        actionUrl: '/messages'
      },
      {
        id: '4',
        title: 'Assessment Completed',
        message: 'Your Technical Skills Assessment has been evaluated.',
        type: 'system',
        createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        isRead: true,
        actionUrl: '/assessments'
      }
    ];
    
    setNotifications(mockNotifications);
    setLoading(false);
  }, [user]);
  
  const handleMarkAsRead = (notificationId: string) => {
    // Update the local state
    setNotifications(notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, isRead: true } 
        : notification
    ));
    
    // In a real implementation, we would also update the database
  };
  
  const handleMarkAllAsRead = () => {
    // Update all notifications in the current view
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      isRead: true
    }));
    setNotifications(updatedNotifications);
    
    // In a real implementation, we would also update the database
  };
  
  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(notification => notification.type === activeTab);
  
  const unreadCount = notifications.filter(notification => !notification.isRead).length;
  
  const formatNotificationDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }
    
    return date.toLocaleDateString();
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'application':
        return <Briefcase className="h-5 w-5" />;
      case 'event':
        return <Calendar className="h-5 w-5" />;
      case 'message':
        return <FileText className="h-5 w-5" />;
      case 'system':
        return <Award className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Notifications</CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleMarkAllAsRead}
          disabled={unreadCount === 0}
        >
          Mark all as read
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="all">
              All
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="application">Applications</TabsTrigger>
            <TabsTrigger value="event">Events</TabsTrigger>
            <TabsTrigger value="message">Messages</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filteredNotifications.length > 0 ? (
              filteredNotifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`p-4 rounded-lg border ${notification.isRead ? 'bg-background' : 'bg-muted/30'}`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-full ${
                      notification.type === 'system' ? 'bg-blue-100 text-blue-600' :
                      notification.type === 'application' ? 'bg-green-100 text-green-600' :
                      notification.type === 'event' ? 'bg-amber-100 text-amber-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium">{notification.title}</h4>
                        {!notification.isRead && (
                          <Badge className="ml-2">New</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatNotificationDate(notification.createdAt)}
                        </span>
                        <div className="flex gap-2">
                          {notification.actionUrl && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={notification.actionUrl}>View</a>
                            </Button>
                          )}
                          {!notification.isRead && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No notifications</h3>
                <p className="mt-2 text-muted-foreground">
                  You don't have any notifications at the moment.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NotificationPanel;
