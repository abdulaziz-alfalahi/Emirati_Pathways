import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  CheckCheck,
  AlertCircle,
  Info,
  AlertTriangle,
  CheckCircle,
  Filter,
  Settings,
  Megaphone,
  MessageSquare
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification } from '@/types/notifications';
import { formatDistanceToNow } from 'date-fns';
import { IntelligentNotificationSystem } from '@/components/notifications/IntelligentNotificationSystem';
import { CrossPhaseAnnouncements } from '@/components/notifications/CrossPhaseAnnouncements';

const NotificationsPage: React.FC = () => {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [activeTab, setActiveTab] = useState('intelligent');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'urgent':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500';
      case 'warning':
        return 'border-l-yellow-500';
      case 'urgent':
        return 'border-l-red-500';
      default:
        return 'border-l-blue-500';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (activeTab) {
      case 'unread':
        return !notification.is_read;
      case 'read':
        return notification.is_read;
      case 'urgent':
        return notification.type === 'urgent';
      default:
        return true;
    }
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading notifications...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Bell className="h-8 w-8" />
              Notification Center
            </h1>
            <p className="text-muted-foreground">
              Stay updated with personalized notifications, announcements, and communications
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/candidate-dashboard?tab=messages">
              <Button variant="outline" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Messages
              </Button>
            </Link>
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} className="flex items-center gap-2">
                <CheckCheck className="h-4 w-4" />
                Mark all as read ({unreadCount})
              </Button>
            )}
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Preferences
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="intelligent" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Smart Notifications
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              All ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Unread ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="urgent" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Urgent ({notifications.filter(n => n.type === 'urgent').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="intelligent">
            <IntelligentNotificationSystem />
          </TabsContent>

          <TabsContent value="announcements">
            <CrossPhaseAnnouncements />
          </TabsContent>

          <TabsContent value={activeTab} className="space-y-4">

            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                  <p className="text-muted-foreground">
                    {activeTab === 'all' && 'You have no notifications yet.'}
                    {activeTab === 'unread' && 'All notifications have been read.'}
                    {activeTab === 'urgent' && 'No urgent notifications.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`border-l-4 ${getNotificationTypeColor(notification.type)} ${!notification.is_read ? 'bg-muted/30' : ''
                      } hover:shadow-md transition-shadow cursor-pointer`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                                {notification.title}
                                {!notification.is_read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </h3>
                              <p className="text-muted-foreground mb-3">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="capitalize">
                                  {notification.type}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                            {notification.link && (
                              <Link
                                to={notification.link}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button size="sm" variant="outline">
                                  View
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default NotificationsPage;
