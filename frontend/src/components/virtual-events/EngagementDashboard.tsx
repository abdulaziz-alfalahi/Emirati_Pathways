
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  MessageSquare, 
  Star,
  Trophy,
  Activity,
  BarChart3
} from 'lucide-react';
import { EngagementTrackingService, EngagementAnalytics } from '@/services/engagementTrackingService';
import { toast } from '@/components/ui/use-toast';

interface EngagementDashboardProps {
  eventId: string;
  userId?: string;
}

const EngagementDashboard: React.FC<EngagementDashboardProps> = ({ eventId, userId }) => {
  const [userEngagement, setUserEngagement] = useState<EngagementAnalytics | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [eventAnalytics, setEventAnalytics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEngagementData();
  }, [eventId, userId]);

  const loadEngagementData = async () => {
    try {
      setIsLoading(true);
      
      const [userEngagementData, leaderboardData, analyticsData] = await Promise.all([
        userId ? EngagementTrackingService.getUserEngagementAnalytics(userId, eventId) : null,
        EngagementTrackingService.getEngagementLeaderboard(eventId),
        EngagementTrackingService.getEventAnalytics(eventId)
      ]);

      setUserEngagement(userEngagementData);
      setLeaderboard(leaderboardData);
      setEventAnalytics(analyticsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load engagement data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getEngagementLevel = (score: number) => {
    if (score >= 80) return { level: 'Highly Engaged', color: 'bg-green-500' };
    if (score >= 60) return { level: 'Engaged', color: 'bg-blue-500' };
    if (score >= 40) return { level: 'Moderately Engaged', color: 'bg-yellow-500' };
    return { level: 'Low Engagement', color: 'bg-gray-500' };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Engagement Analytics</h2>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Live Tracking
        </Badge>
      </div>

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Personal Stats</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="analytics">Event Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          {userEngagement ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Engagement Score */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">{userEngagement.overall_engagement_score}</div>
                    <Progress value={userEngagement.overall_engagement_score} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {getEngagementLevel(userEngagement.overall_engagement_score).level}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Session Time */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Total Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatDuration(userEngagement.total_session_time)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {userEngagement.sessions_attended} sessions attended
                  </div>
                </CardContent>
              </Card>

              {/* Booths Visited */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Booths Visited
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userEngagement.booths_visited}</div>
                  <div className="text-xs text-muted-foreground">
                    {userEngagement.networking_connections} connections made
                  </div>
                </CardContent>
              </Card>

              {/* Participation */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Participation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userEngagement.questions_asked}</div>
                  <div className="text-xs text-muted-foreground">
                    Questions asked • {userEngagement.polls_participated} polls participated
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Engagement Data</h3>
                <p className="text-muted-foreground">
                  Start participating in the event to see your engagement statistics.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Top Engaged Attendees
              </CardTitle>
              <CardDescription>
                Most engaged participants in this event
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.map((participant, index) => (
                  <div key={participant.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {index + 1}
                      </div>
                      <Avatar>
                        <AvatarImage src={participant.profiles?.avatar_url} />
                        <AvatarFallback>
                          {participant.profiles?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{participant.profiles?.full_name || 'Anonymous'}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDuration(participant.total_session_time)} • {participant.booths_visited} booths
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-bold">{participant.overall_engagement_score}</span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={getEngagementLevel(participant.overall_engagement_score).color}
                      >
                        {getEngagementLevel(participant.overall_engagement_score).level}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Event Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Attendees</span>
                    <span className="font-bold">{leaderboard.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Engagement</span>
                    <span className="font-bold">
                      {leaderboard.length > 0 
                        ? Math.round(leaderboard.reduce((sum, p) => sum + p.overall_engagement_score, 0) / leaderboard.length)
                        : 0
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Session Time</span>
                    <span className="font-bold">
                      {formatDuration(leaderboard.reduce((sum, p) => sum + p.total_session_time, 0))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Highly Engaged', 'Engaged', 'Moderately Engaged', 'Low Engagement'].map((level) => {
                    const count = leaderboard.filter(p => 
                      getEngagementLevel(p.overall_engagement_score).level === level
                    ).length;
                    const percentage = leaderboard.length > 0 ? (count / leaderboard.length) * 100 : 0;
                    
                    return (
                      <div key={level} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{level}</span>
                          <span>{count} ({Math.round(percentage)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EngagementDashboard;
