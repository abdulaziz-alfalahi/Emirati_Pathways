import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Zap,
  Brain,
  Globe,
  Award,
  Lightbulb,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  Eye,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { toast } from 'sonner';
import { restClient } from '@/utils/api';

// Types
interface AnalyticsInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  data: any;
  confidence_score: number;
  priority: string;
  created_at: string;
}

interface DashboardData {
  employment_trends: any;
  emiratization_progress: any;
  user_engagement: any;
  predictive_insights: any;
  key_insights: AnalyticsInsight[];
  dashboard_summary: any;
}

interface AdvancedAnalyticsDashboardProps {
  userType: string;
  authToken: string;
}

const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({
  userType,
  authToken
}) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Color schemes for charts
  const colors = {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    danger: '#EF4444',
    warning: '#F97316',
    success: '#22C55E',
    info: '#06B6D4',
    purple: '#8B5CF6',
    pink: '#EC4899'
  };

  const sectorColors = [
    colors.primary,
    colors.secondary,
    colors.accent,
    colors.danger,
    colors.warning,
    colors.info,
    colors.purple,
    colors.pink
  ];

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await restClient.get('/api/advanced-analytics/dashboard', {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        throw new Error('Failed to load dashboard data');
      }
    } catch (err: any) {
      console.error('Dashboard data loading error:', err);
      setError(err.response?.data?.error || 'Failed to load analytics data');
      toast.error('Failed to load analytics dashboard');
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  // Refresh data
  const refreshData = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success('Analytics data refreshed');
  };

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Format numbers for display
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Get priority color
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return colors.danger;
      case 'high': return colors.warning;
      case 'medium': return colors.info;
      case 'low': return colors.success;
      default: return colors.primary;
    }
  };

  // Get trend icon
  const getTrendIcon = (trend: number) => {
    if (trend > 0) {
      return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    } else if (trend < 0) {
      return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    }
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading advanced analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Analytics Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!dashboardData) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>No Data Available</AlertTitle>
        <AlertDescription>Analytics data is not available at this time.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600 mt-1">AI-powered insights for the Emirati Human Development Platform</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 me-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 me-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold">
                  {formatNumber(dashboardData.employment_trends?.summary?.total_applications || 0)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              {getTrendIcon(5.2)}
              <span className="text-sm text-gray-600 ms-1">+5.2% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Emiratization Rate</p>
                <p className="text-2xl font-bold">
                  {(dashboardData.emiratization_progress?.summary?.overall_emiratization_ratio || 0).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              {getTrendIcon(2.1)}
              <span className="text-sm text-gray-600 ms-1">+2.1% progress</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">
                  {formatNumber(dashboardData.user_engagement?.summary?.total_active_users || 0)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              {getTrendIcon(8.7)}
              <span className="text-sm text-gray-600 ms-1">+8.7% engagement</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">
                  {(dashboardData.employment_trends?.summary?.average_success_rate || 0).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Award className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              {getTrendIcon(3.4)}
              <span className="text-sm text-gray-600 ms-1">+3.4% improvement</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Insights Alert */}
      {dashboardData.key_insights?.filter(i => i.priority === 'critical').length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Insights Require Attention</AlertTitle>
          <AlertDescription>
            {dashboardData.key_insights.filter(i => i.priority === 'critical').length} critical insights need immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="emiratization">Emiratization</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="predictions">AI Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="h-5 w-5 me-2" />
                  Key Insights
                </CardTitle>
                <CardDescription>
                  AI-generated insights from platform data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <div className="space-y-4">
                    {dashboardData.key_insights?.slice(0, 10).map((insight, index) => (
                      <div key={insight.id} className="border-s-4 ps-4 py-2" style={{ borderLeftColor: getPriorityColor(insight.priority) }}>
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" style={{ color: getPriorityColor(insight.priority) }}>
                            {insight.priority}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {(insight.confidence_score * 100).toFixed(0)}% confidence
                          </span>
                        </div>
                        <h4 className="font-medium text-sm">{insight.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Emiratization Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 me-2" />
                  D33 and Talent33 Progress
                </CardTitle>
                <CardDescription>
                  Progress towards Emiratization targets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.emiratization_progress?.progress_towards_targets?.slice(0, 5).map((sector: any, index: number) => (
                    <div key={sector.sector} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{sector.sector}</span>
                        <span>{sector.progress_percentage.toFixed(1)}%</span>
                      </div>
                      <Progress
                        value={sector.progress_percentage}
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Current: {sector.current_ratio.toFixed(1)}%</span>
                        <span>Target: {sector.target_ratio}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Employment Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 me-2" />
                Employment Trends Overview
              </CardTitle>
              <CardDescription>
                Application trends and success rates by sector
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboardData.employment_trends?.sector_performance || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sector" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="success_rate"
                      stackId="1"
                      stroke={colors.primary}
                      fill={colors.primary}
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employment Tab */}
        <TabsContent value="employment" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sector Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Sector Performance</CardTitle>
                <CardDescription>Success rates by industry sector</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData.employment_trends?.sector_performance || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="sector" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="success_rate" fill={colors.primary} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Application Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Application Trends</CardTitle>
                <CardDescription>Daily application volume over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashboardData.employment_trends?.trends_data?.slice(-30) || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="total_applications"
                        stroke={colors.primary}
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="emirati_applications"
                        stroke={colors.secondary}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Emiratization Tab */}
        <TabsContent value="emiratization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Emiratization by Sector */}
            <Card>
              <CardHeader>
                <CardTitle>Emiratization by Sector</CardTitle>
                <CardDescription>Current Emiratization ratios across sectors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData.emiratization_progress?.sector_metrics || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ sector, emiratization_ratio }) => `${sector}: ${emiratization_ratio.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="emiratization_ratio"
                      >
                        {(dashboardData.emiratization_progress?.sector_metrics || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={sectorColors[index % sectorColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* D33 Vision Progress */}
            <Card>
              <CardHeader>
                <CardTitle>D33 Vision Progress</CardTitle>
                <CardDescription>Progress towards D33 and Talent33 targets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" data={dashboardData.emiratization_progress?.progress_towards_targets?.slice(0, 6) || []}>
                      <RadialBar
                        minAngle={15}
                        label={{ position: 'insideStart', fill: '#fff' }}
                        background
                        clockWise
                        dataKey="progress_percentage"
                      />
                      <Legend iconSize={18} layout="vertical" verticalAlign="middle" wrapperStyle={{ paddingLeft: '20px' }} />
                      <Tooltip />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Engagement by Persona */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement by Persona</CardTitle>
                <CardDescription>User activity across different persona types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData.user_engagement?.engagement_by_persona || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="user_type" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="activities_per_user" fill={colors.primary} />
                      <Bar dataKey="avg_session_minutes" fill={colors.secondary} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Activity Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Activity Trends</CardTitle>
                <CardDescription>Platform activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboardData.user_engagement?.daily_activity_trends?.slice(-14) || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="daily_activities"
                        stackId="1"
                        stroke={colors.primary}
                        fill={colors.primary}
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="predictions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Predictions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 me-2" />
                  AI Predictions
                </CardTitle>
                <CardDescription>
                  Machine learning powered predictions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <div className="space-y-4">
                    {dashboardData.predictive_insights?.predictions?.map((prediction: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{prediction.type}</Badge>
                          <span className="text-xs text-gray-500">
                            {(prediction.confidence * 100).toFixed(0)}% confidence
                          </span>
                        </div>
                        <h4 className="font-medium text-sm mb-1">{prediction.title}</h4>
                        <p className="text-xs text-gray-600">{prediction.prediction}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 me-2" />
                  AI Recommendations
                </CardTitle>
                <CardDescription>
                  Actionable recommendations based on data analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <div className="space-y-4">
                    {dashboardData.predictive_insights?.recommendations?.map((rec: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{rec.category}</Badge>
                          <Badge
                            variant={rec.priority === 'high' ? 'destructive' : 'secondary'}
                          >
                            {rec.priority}
                          </Badge>
                        </div>
                        <h4 className="font-medium text-sm mb-1">{rec.title}</h4>
                        <p className="text-xs text-gray-600 mb-2">{rec.description}</p>
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500">Impact Score:</span>
                          <Progress
                            value={rec.impact_score * 100}
                            className="ms-2 h-2 flex-1"
                          />
                          <span className="text-xs text-gray-500 ms-2">
                            {(rec.impact_score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
