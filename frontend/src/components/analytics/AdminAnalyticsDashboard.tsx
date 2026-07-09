
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, TrendingUp, Activity, Target, Download, Filter } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface PlatformMetrics {
  total_users: number;
  active_users_30d: number;
  phase_distribution: Record<string, number>;
  feature_usage: any[];
  engagement_trends: any[];
  milestone_achievements: any[];
}

export const AdminAnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<PlatformMetrics>({
    total_users: 0,
    active_users_30d: 0,
    phase_distribution: {},
    feature_usage: [],
    engagement_trends: [],
    milestone_achievements: []
  });
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedPhase, setSelectedPhase] = useState('all');

  useEffect(() => {
    loadPlatformMetrics();
  }, [timeRange, selectedPhase]);

  const loadPlatformMetrics = async () => {
    setLoading(true);
    try {
      // Get aggregated platform metrics
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Get user journey analytics for the time range
      let analyticsQuery = supabase
        .from('user_journey_analytics')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (selectedPhase !== 'all') {
        analyticsQuery = analyticsQuery.eq('phase', selectedPhase);
      }

      const { data: analyticsData } = await analyticsQuery;

      // Get feature usage analytics
      let featureQuery = supabase
        .from('feature_usage_analytics')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (selectedPhase !== 'all') {
        featureQuery = featureQuery.eq('phase', selectedPhase);
      }

      const { data: featureData } = await featureQuery;

      // Get milestones data
      const { data: milestonesData } = await supabase
        .from('user_journey_milestones')
        .select('*')
        .gte('achieved_at', startDate.toISOString())
        .lte('achieved_at', endDate.toISOString());

      // Process the data
      const processedMetrics = processAnalyticsData(analyticsData || [], featureData || [], milestonesData || []);
      setMetrics(processedMetrics);

    } catch (error) {
      console.error('Failed to load platform metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (analytics: any[], features: any[], milestones: any[]): PlatformMetrics => {
    // Calculate unique users
    const uniqueUsers = new Set(analytics.map(a => a.user_id)).size;
    const activeUsers30d = new Set(analytics.filter(a => {
      const eventDate = new Date(a.created_at);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return eventDate >= thirtyDaysAgo;
    }).map(a => a.user_id)).size;

    // Phase distribution
    const phaseDistribution = analytics.reduce((acc, event) => {
      acc[event.phase] = (acc[event.phase] || 0) + 1;
      return acc;
    }, {});

    // Feature usage aggregation
    const featureUsage = features.reduce((acc, usage) => {
      const key = `${usage.feature_name}_${usage.phase}`;
      if (!acc[key]) {
        acc[key] = {
          feature_name: usage.feature_name,
          phase: usage.phase,
          usage_count: 0,
          avg_duration: 0,
          success_rate: 0,
          total_duration: 0,
          success_count: 0
        };
      }
      acc[key].usage_count += 1;
      acc[key].total_duration += usage.duration_seconds || 0;
      acc[key].success_count += usage.success_rate || 0;
      return acc;
    }, {});

    // Calculate averages for feature usage
    const processedFeatureUsage = Object.values(featureUsage).map((feature: any) => ({
      ...feature,
      avg_duration: feature.usage_count > 0 ? Math.round(feature.total_duration / feature.usage_count) : 0,
      success_rate: feature.usage_count > 0 ? Math.round((feature.success_count / feature.usage_count) * 100) : 0
    }));

    // Engagement trends (daily)
    const engagementTrends = analytics.reduce((acc, event) => {
      const date = event.created_at.split('T')[0]; // Get date part
      if (!acc[date]) {
        acc[date] = { date, events: 0, unique_users: new Set() };
      }
      acc[date].events += 1;
      acc[date].unique_users.add(event.user_id);
      return acc;
    }, {});

    const processedTrends = Object.values(engagementTrends).map((trend: any) => ({
      date: trend.date,
      events: trend.events,
      unique_users: trend.unique_users.size
    })).sort((a, b) => a.date.localeCompare(b.date));

    return {
      total_users: uniqueUsers,
      active_users_30d: activeUsers30d,
      phase_distribution: phaseDistribution,
      feature_usage: processedFeatureUsage,
      engagement_trends: processedTrends,
      milestone_achievements: milestones
    };
  };

  const exportData = async () => {
    try {
      const dataToExport = {
        metrics,
        generated_at: new Date().toISOString(),
        time_range: timeRange,
        selected_phase: selectedPhase
      };

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `platform-analytics-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const phaseColors = {
    education: '#3B82F6',
    career: '#10B981',
    professional: '#F59E0B',
    lifelong: '#8B5CF6'
  };

  const pieData = Object.entries(metrics.phase_distribution).map(([phase, count]) => ({
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
            <p className="text-muted-foreground">Loading platform analytics...</p>
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
                <Activity className="h-5 w-5" />
                Platform Analytics Dashboard
              </CardTitle>
              <CardDescription>
                Comprehensive insights into platform usage and user engagement
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 days</SelectItem>
                  <SelectItem value="30d">30 days</SelectItem>
                  <SelectItem value="90d">90 days</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Phases</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="career">Career</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="lifelong">Lifelong</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportData} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total Users</span>
            </div>
            <p className="text-2xl font-bold mt-1">{metrics.total_users}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Active Users (30d)</span>
            </div>
            <p className="text-2xl font-bold mt-1">{metrics.active_users_30d}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Features Used</span>
            </div>
            <p className="text-2xl font-bold mt-1">{metrics.feature_usage.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Milestones</span>
            </div>
            <p className="text-2xl font-bold mt-1">{metrics.milestone_achievements.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="engagement" className="space-y-4">
        <TabsList>
          <TabsTrigger value="engagement">Engagement Trends</TabsTrigger>
          <TabsTrigger value="phases">Phase Distribution</TabsTrigger>
          <TabsTrigger value="features">Feature Usage</TabsTrigger>
          <TabsTrigger value="milestones">Achievement Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle>User Engagement Trends</CardTitle>
              <CardDescription>Daily active users and event patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.engagement_trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="events" stroke="#3B82F6" strokeWidth={2} name="Events" />
                    <Line type="monotone" dataKey="unique_users" stroke="#10B981" strokeWidth={2} name="Unique Users" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="phases">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Phase Activity Distribution</CardTitle>
                <CardDescription>User activity across lifecycle phases</CardDescription>
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

            <Card>
              <CardHeader>
                <CardTitle>Phase Activity Summary</CardTitle>
                <CardDescription>Detailed breakdown by phase</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(metrics.phase_distribution).map(([phase, count]) => (
                    <div key={phase} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: phaseColors[phase as keyof typeof phaseColors] || '#6B7280' }}
                        />
                        <span className="font-medium capitalize">{phase}</span>
                      </div>
                      <Badge variant="outline">{count} events</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Feature Usage Analytics</CardTitle>
              <CardDescription>Most used features and their performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.feature_usage.slice(0, 10).map((feature, index) => (
                  <div key={`${feature.feature_name}_${feature.phase}`} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{feature.feature_name}</h4>
                      <Badge variant="outline">{feature.phase}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Usage Count:</span>
                        <p className="font-medium">{feature.usage_count}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Avg Duration:</span>
                        <p className="font-medium">{feature.avg_duration}s</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Success Rate:</span>
                        <p className="font-medium">{feature.success_rate}%</p>
                      </div>
                    </div>
                  </div>
                ))}
                {metrics.feature_usage.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No feature usage data available for the selected time range.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones">
          <Card>
            <CardHeader>
              <CardTitle>Achievement Analytics</CardTitle>
              <CardDescription>User milestones and achievement patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.milestone_achievements.slice(0, 10).map((milestone, index) => (
                  <div key={milestone.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{milestone.milestone_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(milestone.achieved_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{milestone.phase}</Badge>
                      <Badge>{milestone.milestone_type}</Badge>
                      {milestone.points_earned > 0 && (
                        <Badge variant="secondary">{milestone.points_earned} pts</Badge>
                      )}
                    </div>
                  </div>
                ))}
                {metrics.milestone_achievements.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No milestone achievements recorded for the selected time range.
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
