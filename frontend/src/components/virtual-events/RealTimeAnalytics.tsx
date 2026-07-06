
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Users, 
  Clock, 
  TrendingUp, 
  Eye,
  MessageSquare,
  UserPlus,
  BarChart3
} from 'lucide-react';
import { EngagementTrackingService } from '@/services/engagementTrackingService';
interface RealTimeAnalyticsProps {
  eventId: string;
}

interface LiveMetrics {
  activeUsers: number;
  totalSessions: number;
  averageEngagement: number;
  topBooth: string;
  recentActivities: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
}

const RealTimeAnalytics: React.FC<RealTimeAnalyticsProps> = ({ eventId }) => {
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics>({
    activeUsers: 0,
    totalSessions: 0,
    averageEngagement: 0,
    topBooth: '',
    recentActivities: []
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    loadInitialMetrics();
    setupRealtimeSubscription();
  }, [eventId]);

  const loadInitialMetrics = async () => {
    try {
      // Load initial analytics data
      const analytics = await EngagementTrackingService.getEventAnalytics(eventId);
      const leaderboard = await EngagementTrackingService.getEngagementLeaderboard(eventId, 50);
      
      const activeUsers = leaderboard.filter(user => {
        const lastActivity = new Date(user.last_activity);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return lastActivity > fiveMinutesAgo;
      }).length;

      const averageEngagement = leaderboard.length > 0
        ? leaderboard.reduce((sum, user) => sum + user.overall_engagement_score, 0) / leaderboard.length
        : 0;

      setLiveMetrics(prev => ({
        ...prev,
        activeUsers,
        totalSessions: leaderboard.length,
        averageEngagement: Math.round(averageEngagement)
      }));
    } catch (error) {
      console.error('Failed to load initial metrics:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`event-analytics-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_attendance',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          console.log('New session attendance:', payload);
          setLiveMetrics(prev => ({
            ...prev,
            activeUsers: prev.activeUsers + 1,
            recentActivities: [
              {
                type: 'session_join',
                message: 'New attendee joined a session',
                timestamp: new Date().toISOString()
              },
              ...prev.recentActivities.slice(0, 9)
            ]
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'booth_interaction_tracking',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          console.log('New booth interaction:', payload);
          setLiveMetrics(prev => ({
            ...prev,
            recentActivities: [
              {
                type: 'booth_interaction',
                message: `Attendee interacted with a booth (${payload.new.interaction_type})`,
                timestamp: new Date().toISOString()
              },
              ...prev.recentActivities.slice(0, 9)
            ]
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'engagement_analytics',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          console.log('Engagement updated:', payload);
          // Recalculate average engagement
          loadInitialMetrics();
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
        console.log('Realtime subscription status:', status);
      });

    return () => {
      // TODO: Connect to Flask API - supabase.removeChannel(channel);
    };
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'session_join': return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'booth_interaction': return <Eye className="h-4 w-4 text-blue-500" />;
      case 'question_asked': return <MessageSquare className="h-4 w-4 text-purple-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-AE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Real-Time Analytics</h2>
        <Badge variant={isConnected ? 'default' : 'destructive'} className="animate-pulse">
          {isConnected ? 'Live' : 'Disconnected'}
        </Badge>
      </div>

      {/* Live Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{liveMetrics.activeUsers}</div>
            <div className="text-xs text-muted-foreground">Currently online</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{liveMetrics.totalSessions}</div>
            <div className="text-xs text-muted-foreground">Registered attendees</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              Avg Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-purple-600">{liveMetrics.averageEngagement}%</div>
              <Progress value={liveMetrics.averageEngagement} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">~2s</div>
            <div className="text-xs text-muted-foreground">Average response</div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Live Activity Feed
            </CardTitle>
            <CardDescription>Real-time attendee activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {liveMetrics.recentActivities.length > 0 ? (
                liveMetrics.recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center space-x-3">
                      {getActivityIcon(activity.type)}
                      <span className="text-sm">{activity.message}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="mx-auto h-8 w-8 mb-2" />
                  <p>No recent activities</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Engagement Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Distribution</CardTitle>
            <CardDescription>Current attendee engagement levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { level: 'Highly Engaged', percentage: 25, color: 'bg-green-500' },
                { level: 'Engaged', percentage: 35, color: 'bg-blue-500' },
                { level: 'Moderately Engaged', percentage: 30, color: 'bg-yellow-500' },
                { level: 'Low Engagement', percentage: 10, color: 'bg-gray-500' }
              ].map((item) => (
                <div key={item.level} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{item.level}</span>
                    <span>{item.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connection Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span>
              {isConnected ? 'Connected to real-time analytics' : 'Disconnected from real-time feed'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeAnalytics;
