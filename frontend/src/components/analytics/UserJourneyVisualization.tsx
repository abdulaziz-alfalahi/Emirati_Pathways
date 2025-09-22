
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { CalendarIcon, TrendingUp, Award, MapPin, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { crossPhaseAnalyticsService } from '@/services/crossPhaseAnalyticsService';
import { format } from 'date-fns';

interface JourneyAnalytics {
  journey_data: any[];
  phase_transitions: any[];
  milestones: any[];
  engagement_metrics: any;
}

export const UserJourneyVisualization: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<JourneyAnalytics>({
    journey_data: [],
    phase_transitions: [],
    milestones: [],
    engagement_metrics: {}
  });
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date()
  });

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, dateRange]);

  const loadAnalytics = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [journeyData, transitions, milestones] = await Promise.all([
        crossPhaseAnalyticsService.getUserJourneyAnalytics(user.id, dateRange),
        crossPhaseAnalyticsService.getPhaseTransitions(user.id),
        crossPhaseAnalyticsService.getUserMilestones(user.id)
      ]);

      setAnalytics({
        journey_data: journeyData,
        phase_transitions: transitions,
        milestones: milestones,
        engagement_metrics: calculateEngagementMetrics(journeyData)
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEngagementMetrics = (journeyData: any[]) => {
    const totalEvents = journeyData.length;
    const uniqueDays = new Set(journeyData.map(event => 
      format(new Date(event.created_at), 'yyyy-MM-dd')
    )).size;
    
    const phaseDistribution = journeyData.reduce((acc, event) => {
      acc[event.phase] = (acc[event.phase] || 0) + 1;
      return acc;
    }, {});

    const eventTypes = journeyData.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalEvents,
      uniqueDays,
      avgEventsPerDay: uniqueDays > 0 ? Math.round(totalEvents / uniqueDays) : 0,
      phaseDistribution,
      eventTypes
    };
  };

  const prepareChartData = () => {
    // Group events by date for timeline chart
    const timelineData = analytics.journey_data.reduce((acc, event) => {
      const date = format(new Date(event.created_at), 'MMM dd');
      if (!acc[date]) {
        acc[date] = { date, events: 0, phases: new Set() };
      }
      acc[date].events += 1;
      acc[date].phases.add(event.phase);
      return acc;
    }, {});

    return Object.values(timelineData).map((item: any) => ({
      ...item,
      phases: item.phases.size
    }));
  };

  const phaseColors = {
    education: '#3B82F6',
    career: '#10B981', 
    professional: '#F59E0B',
    lifelong: '#8B5CF6'
  };

  const pieData = Object.entries(analytics.engagement_metrics.phaseDistribution || {}).map(([phase, count]) => ({
    name: phase,
    value: count,
    color: phaseColors[phase as keyof typeof phaseColors] || '#6B7280'
  }));

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your journey analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Your Journey Analytics
              </CardTitle>
              <CardDescription>
                Visualize your progress across the citizen lifecycle phases
              </CardDescription>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange.start, 'MMM dd')} - {format(dateRange.end, 'MMM dd')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={{
                    from: dateRange.start,
                    to: dateRange.end
                  }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ start: range.from, end: range.to });
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total Events</span>
            </div>
            <p className="text-2xl font-bold mt-1">{analytics.engagement_metrics.totalEvents || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Active Days</span>
            </div>
            <p className="text-2xl font-bold mt-1">{analytics.engagement_metrics.uniqueDays || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Milestones</span>
            </div>
            <p className="text-2xl font-bold mt-1">{analytics.milestones.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Phase Transitions</span>
            </div>
            <p className="text-2xl font-bold mt-1">{analytics.phase_transitions.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Activity Timeline</TabsTrigger>
          <TabsTrigger value="phases">Phase Distribution</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="transitions">Phase Transitions</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>Your engagement over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={prepareChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="events" stroke="#3B82F6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="phases">
          <Card>
            <CardHeader>
              <CardTitle>Phase Distribution</CardTitle>
              <CardDescription>Your activity across different phases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones">
          <Card>
            <CardHeader>
              <CardTitle>Achievement Milestones</CardTitle>
              <CardDescription>Your accomplishments across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.milestones.map((milestone, index) => (
                  <div key={milestone.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-yellow-600" />
                      <div>
                        <h4 className="font-medium">{milestone.milestone_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(milestone.achieved_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{milestone.phase}</Badge>
                      {milestone.points_earned > 0 && (
                        <Badge>{milestone.points_earned} pts</Badge>
                      )}
                    </div>
                  </div>
                ))}
                {analytics.milestones.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No milestones achieved yet. Keep engaging with the platform to earn achievements!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transitions">
          <Card>
            <CardHeader>
              <CardTitle>Phase Transitions</CardTitle>
              <CardDescription>Your journey through the citizen lifecycle phases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.phase_transitions.map((transition, index) => (
                  <div key={transition.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <div>
                        <h4 className="font-medium">
                          {transition.from_phase ? `${transition.from_phase} → ${transition.to_phase}` : `Started in ${transition.to_phase}`}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(transition.transition_date), 'MMM dd, yyyy')}
                        </p>
                        {transition.transition_reason && (
                          <p className="text-xs text-muted-foreground mt-1">{transition.transition_reason}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {transition.readiness_score && (
                        <Badge variant="outline">
                          Readiness: {Math.round(transition.readiness_score * 100)}%
                        </Badge>
                      )}
                      {transition.completion_percentage && (
                        <Badge>
                          {Math.round(transition.completion_percentage)}% Complete
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {analytics.phase_transitions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No phase transitions recorded yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
