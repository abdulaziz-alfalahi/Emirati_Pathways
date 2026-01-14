import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { restClient } from '@/utils/api';
import UserManagerEnhanced from '@/components/admin/UserManagerEnhanced';
import AdminRoles from '@/components/admin/AdminRoles';
import GrowthTools from '@/components/admin/GrowthTools';
import GrowthOperatorManagerEnhanced from '@/components/admin/GrowthOperatorManagerEnhanced';
import AdminRoleRequests from '@/components/admin/AdminRoleRequests';
import AdminInterviews from '@/components/admin/AdminInterviews';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Briefcase,
  TrendingUp,
  Shield,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  UserCheck,
  FileText,
  MessageSquare,
  Activity,
  Rocket,
  Video,
  ClipboardCopy,
  RefreshCw,
  UserPlus
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  // Derive tab from URL or default to "overview"
  const activeTab = searchParams.get("tab") || "overview";

  // Handler for UI tab changes
  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  // Load data when tab changes based on URL
  useEffect(() => {
    if (activeTab === 'feedback') {
      loadFeedbackList();
    }
  }, [activeTab]);
  const [dashboardData, setDashboardData] = useState({
    platform: {
      totalUsers: 0,
      activeUsers: 0,
      newRegistrations: 0,
      totalJobs: 0,
      totalApplications: 0,
      successfulMatches: 0
    },
    analytics: {
      userGrowthRate: 0,
      applicationSuccessRate: 0,
      averageMatchScore: 0,
      systemUptime: 0,
      visitorTrends: [],
      userActivity: []
    },
    moderation: {
      pendingReviews: 0,
      reportedContent: 0,
      flaggedUsers: 0,
      systemAlerts: 0
    },
    feedback: {
      total: 0,
      open: 0,
      bugs: 0,
      features: 0,
      today: 0
    },
    activity: [],
    system: {
      cpu_percent: 0,
      memory_percent: 0,
      disk_percent: 0,
      disk_total: 0,
      disk_free: 0
    }
  });

  const [feedbackList, setFeedbackList] = useState([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // Load dashboard data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const getUserDisplayName = () => {
    return user?.full_name || user?.email || 'Administrator';
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 Admin logout process...');
      await signOut(); // Use real sign out from context
      console.log('✅ Admin logout completed');
      navigate('/auth');
    } catch (error) {
      console.error('Admin logout error:', error);
      navigate('/auth');
    }
  };



  const loadFeedbackList = async () => {
    setLoadingFeedback(true);
    try {
      const response = await restClient.get('/api/feedback/');
      if (response.data && response.data.success) {
        setFeedbackList(response.data.data);
      }
    } catch (error) {
      console.error("Failed to load feedback list", error);
      toast({
        title: "Error",
        description: "Failed to load feedback list.",
        variant: "destructive",
      });
    } finally {
      setLoadingFeedback(false);
    }
  };

  const updateFeedbackStatus = async (id: string, newStatus: string) => {
    try {
      const response = await restClient.put(`/api/feedback/${id}/status`, { status: newStatus });
      if (response.data && response.data.success) {
        toast({
          title: "Success",
          description: `Feedback marked as ${newStatus}`,
        });
        // Optimistic update
        setFeedbackList((prev: any[]) => prev.map((item: any) =>
          item.id === id ? { ...item, status: newStatus } : item
        ));
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: "Error",
        description: "Failed to update feedback status.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (activeTab === 'feedback') {
      loadFeedbackList();
    }
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      // Use restClient which handles auth token automatically
      const [response, feedbackResponse] = await Promise.all([
        restClient.get('/api/admin/dashboard'),
        restClient.get('/api/feedback/stats')
      ]);

      const feedbackStats = feedbackResponse.data?.success ? feedbackResponse.data.stats : {
        total: 0, open: 0, bugs: 0, features: 0, today: 0
      };

      if (response.data && response.data.data) {
        const apiData = response.data.data;

        // Transform backend data to frontend structure
        setDashboardData({
          platform: {
            totalUsers: apiData.users?.total || 0,
            activeUsers: apiData.health?.components?.users?.active_users || 0,
            newRegistrations: apiData.health?.components?.users?.new_users_24h || 0,
            totalJobs: apiData.health?.components?.content?.total_content || 0, // Placeholder
            totalApplications: 0, // Placeholder
            successfulMatches: 0 // Placeholder
          },
          analytics: {
            userGrowthRate: apiData.analytics?.userGrowthRate || 0,
            applicationSuccessRate: apiData.analytics?.applicationSuccessRate || 0,
            averageMatchScore: apiData.analytics?.averageMatchScore || 0,
            systemUptime: apiData.analytics?.systemUptime || 99.9,
            visitorTrends: apiData.analytics?.visitorTrends || [],
            userActivity: apiData.analytics?.userActivity || [
              { name: 'Active', value: 0 },
              { name: 'Inactive', value: 0 }
            ]
          },
          moderation: {
            pendingReviews: apiData.notifications?.unread_count || 0, // Map notifications to reviews as proxy
            reportedContent: 0,
            flaggedUsers: 0,
            systemAlerts: apiData.notifications?.recent?.length || 0
          },
          feedback: feedbackStats,
          activity: (apiData.notifications?.recent || []).map((n: any, i: number) => ({
            id: i,
            type: n.notification_type || 'system_alert',
            title: n.title,
            description: n.message,
            timestamp: n.created_at || new Date().toISOString(),
            severity: n.severity || 'info'
          })),
          system: {
            cpu_percent: apiData.health?.system_resources?.cpu_percent || 0,
            memory_percent: apiData.health?.system_resources?.memory_percent || 0,
            disk_percent: apiData.health?.system_resources?.disk_percent || 0,
            disk_total: apiData.health?.system_resources?.disk_total_gb || 0,
            disk_free: apiData.health?.system_resources?.disk_free_gb || 0
          }
        });
      } else {
        console.log('API call returned no data, using mock data');
        setMockData();
      }
    } catch (error) {
      console.error('Error loading admin dashboard data:', error);
      setMockData();
    }
  };

  const setMockData = () => {
    setDashboardData({
      platform: {
        totalUsers: 2847,
        activeUsers: 1923,
        newRegistrations: 156,
        totalJobs: 342,
        totalApplications: 8934,
        successfulMatches: 1247
      },
      analytics: {
        userGrowthRate: 15.3,
        applicationSuccessRate: 68.2,
        averageMatchScore: 8.7,
        systemUptime: 99.8,
        visitorTrends: [],
        userActivity: []
      },
      moderation: {
        pendingReviews: 23,
        reportedContent: 5,
        flaggedUsers: 2,
        systemAlerts: 1
      },
      activity: [
        {
          id: 1,
          type: 'system_alert',
          title: 'System Maintenance Scheduled',
          description: 'Scheduled maintenance window for database optimization',
          timestamp: new Date().toISOString(),
          severity: 'info'
        },
        {
          id: 2,
          type: 'user_registration',
          title: 'New User Registration Spike',
          description: '50+ new registrations in the last hour',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          severity: 'success'
        },
        {
          id: 3,
          type: 'security_alert',
          title: 'Security Scan Completed',
          description: 'Weekly security scan completed successfully',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          severity: 'success'
        }
      ],
      feedback: {
        total: 12,
        open: 5,
        bugs: 2,
        features: 3,
        today: 1
      },
      system: {
        cpu_percent: 45,
        memory_percent: 62,
        disk_percent: 28,
        disk_total: 512,
        disk_free: 368
      }
    });
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 font-dubai">
      {/* Navigation */}
      <HybridGovernmentNavFixed showAuthButtons={true} />

      {/* Main Content */}
      <div className="pt-20 pb-8">
        <div className="min-h-screen bg-background">
          {/* Header */}
          <div className="bg-card border-b">
            <div className="container mx-auto px-4 py-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    System Administration
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Welcome back, {getUserDisplayName()}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary" className="bg-ehrdc-teal/10 text-ehrdc-teal">
                    Administrator
                  </Badge>
                  <Button variant="outline" onClick={handleLogout}>
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-8">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="users">User Management</TabsTrigger>
                <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
                <TabsTrigger value="operators" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Growth Operators
                </TabsTrigger>
                <TabsTrigger value="growth" className="flex items-center gap-2">
                  <Rocket className="h-4 w-4" />
                  Growth Tools
                </TabsTrigger>
                <TabsTrigger value="interviews" className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Interviews
                </TabsTrigger>
                <TabsTrigger value="feedback" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Feedback
                </TabsTrigger>
                <TabsTrigger value="requests" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Requests
                </TabsTrigger>
                <TabsTrigger value="system">System Health</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Platform Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardData.platform.totalUsers.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">
                        +{dashboardData.platform.newRegistrations} new this month
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardData.platform.activeUsers.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">
                        {Math.round((dashboardData.platform.activeUsers / dashboardData.platform.totalUsers) * 100)}% of total users
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardData.platform.totalJobs.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">
                        Across all categories
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Applications</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardData.platform.totalApplications.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">
                        Total submitted
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Successful Matches</CardTitle>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardData.platform.successfulMatches.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">
                        {Math.round((dashboardData.platform.successfulMatches / dashboardData.platform.totalApplications) * 100)}% success rate
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardData.analytics.systemUptime}%</div>
                      <p className="text-xs text-muted-foreground">
                        Last 30 days
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* System Health Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2" />
                        Platform Analytics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">User Growth Rate</span>
                          <span className="text-sm font-bold text-green-600">+{dashboardData.analytics.userGrowthRate}%</span>
                        </div>
                        <Progress value={dashboardData.analytics.userGrowthRate} className="w-full" />

                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Application Success Rate</span>
                          <span className="text-sm font-bold">{dashboardData.analytics.applicationSuccessRate}%</span>
                        </div>
                        <Progress value={dashboardData.analytics.applicationSuccessRate} className="w-full" />

                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Average Match Score</span>
                          <span className="text-sm font-bold">{dashboardData.analytics.averageMatchScore}/10</span>
                        </div>
                        <Progress value={dashboardData.analytics.averageMatchScore * 10} className="w-full" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Shield className="h-5 w-5 mr-2" />
                        Moderation Queue
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Pending Reviews</span>
                          <Badge variant={dashboardData.moderation.pendingReviews > 20 ? "destructive" : "secondary"}>
                            {dashboardData.moderation.pendingReviews}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Reported Content</span>
                          <Badge variant={dashboardData.moderation.reportedContent > 10 ? "destructive" : "secondary"}>
                            {dashboardData.moderation.reportedContent}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Flagged Users</span>
                          <Badge variant={dashboardData.moderation.flaggedUsers > 5 ? "destructive" : "secondary"}>
                            {dashboardData.moderation.flaggedUsers}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">System Alerts</span>
                          <Badge variant={dashboardData.moderation.systemAlerts > 0 ? "destructive" : "secondary"}>
                            {dashboardData.moderation.systemAlerts}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Feedback Overview (FUT) */}
                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2" />
                      Feedback Overview
                    </CardTitle>
                    <CardDescription>
                      User reported issues and feedback from the widget
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">Total Reports</span>
                        <span className="text-2xl font-bold">{dashboardData.feedback?.total || 0}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">Open Issues</span>
                        <span className="text-2xl font-bold text-orange-600">{dashboardData.feedback?.open || 0}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">Today</span>
                        <span className="text-2xl font-bold text-blue-600">{dashboardData.feedback?.today || 0}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">Bugs</span>
                        <span className="text-2xl font-bold text-red-600">{dashboardData.feedback?.bugs || 0}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">Features</span>
                        <span className="text-2xl font-bold text-green-600">{dashboardData.feedback?.features || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent System Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="h-5 w-5 mr-2" />
                      Recent System Activity
                    </CardTitle>
                    <CardDescription>
                      Latest system events and administrative actions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardData.activity.length > 0 ? (
                        dashboardData.activity.map((activity) => (
                          <div key={activity.id} className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              {activity.severity === 'success' && (
                                <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                              )}
                              {activity.severity === 'info' && (
                                <Clock className="h-4 w-4 text-blue-500 mt-1" />
                              )}
                              {activity.severity === 'warning' && (
                                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-1" />
                              )}
                              {activity.severity === 'error' && (
                                <AlertTriangle className="h-4 w-4 text-red-500 mt-1" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {activity.title}
                              </p>
                              <p className="text-sm text-gray-500">
                                {activity.description}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(activity.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No recent system activity</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>


              {/* Feedback Tab */}
              <TabsContent value="feedback" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Feedback & Issues Reports</span>
                      <Button variant="outline" size="sm" onClick={loadFeedbackList}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Review feedback submitted by users via the widget. Use "Copy for Developer" to share with engineering.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                          <tr className="text-left">
                            <th className="p-3 font-medium">Type</th>
                            <th className="p-3 font-medium">Status</th>
                            <th className="p-3 font-medium">Message</th>
                            <th className="p-3 font-medium">User & Page</th>
                            <th className="p-3 font-medium">Date</th>
                            <th className="p-3 font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loadingFeedback ? (
                            <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
                          ) : feedbackList.length === 0 ? (
                            <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No feedback received yet.</td></tr>
                          ) : (
                            feedbackList.map((item: any) => (
                              <tr key={item.id} className="border-b hover:bg-muted/50 transition-colors">
                                <td className="p-3">
                                  <div className="flex flex-col gap-1">
                                    <Badge variant={item.type === 'bug' ? 'destructive' : 'secondary'}>
                                      {item.type.toUpperCase()}
                                    </Badge>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <Badge variant={item.status === 'resolved' ? 'outline' : 'default'} className={item.status === 'resolved' ? 'text-green-600 border-green-600' : 'bg-blue-600'}>
                                    {item.status ? item.status.toUpperCase() : 'OPEN'}
                                  </Badge>
                                </td>
                                <td className="p-3 max-w-md">
                                  <p className="font-medium truncate">{item.message}</p>
                                  <p className="text-xs text-muted-foreground truncate font-mono">
                                    {item.console_logs && item.console_logs.length > 0 ? `${item.console_logs.length} logs captured` : 'No logs'}
                                  </p>
                                </td>
                                <td className="p-3">
                                  <div className="flex flex-col text-xs">
                                    <span className="font-medium">{item.role} {item.user_id ? `(#${item.user_id})` : ''}</span>
                                    <span className="text-muted-foreground truncate max-w-[150px]" title={item.metadata?.path}>
                                      {item.metadata?.path || 'Unknown path'}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-3 text-xs text-muted-foreground">
                                  {new Date(item.created_at).toLocaleString()}
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center space-x-2">
                                    {item.status !== 'resolved' && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-xs border-green-200 hover:bg-green-50 text-green-700"
                                        onClick={() => updateFeedbackStatus(item.id, 'resolved')}
                                      >
                                        <CheckCircle className="h-3 w-3 mr-1" /> Resolve
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="h-8 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                                      onClick={() => {
                                        const text = `
**Feedback Report**
ID: ${item.id}
User: ${item.role} (ID: ${item.user_id})
Type: ${item.type}
Page: ${item.metadata?.path || item.pageUrl || 'N/A'}
Date: ${new Date(item.created_at).toLocaleString()}

**Message:**
${item.message}

**Console Logs:**
\`\`\`
${Array.isArray(item.console_logs) ? item.console_logs.join('\n') : JSON.stringify(item.console_logs || [])}
\`\`\`

**Metadata:**
${JSON.stringify(item.metadata, null, 2)}
                                                        `.trim();
                                        navigator.clipboard.writeText(text);
                                        toast({
                                          title: "Copied",
                                          description: "Feedback report copied to clipboard",
                                        });
                                      }}
                                    >
                                      <ClipboardCopy className="h-3 w-3 mr-1" />
                                      Copy for Dev
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* User Management Tab */}
              <TabsContent value="users" className="space-y-6">
                <UserManagerEnhanced />
              </TabsContent>

              {/* Roles Tab */}
              <TabsContent value="roles" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Role Management</CardTitle>
                    <CardDescription>Manage user roles and permissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AdminRoles />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Growth Operators Tab */}
              <TabsContent value="operators" className="space-y-6">
                <GrowthOperatorManagerEnhanced />
              </TabsContent>

              {/* Growth Tools Tab */}
              <TabsContent value="growth" className="space-y-6">
                <GrowthTools />
              </TabsContent>

              {/* Interviews Tab */}
              <TabsContent value="interviews" className="space-y-6">
                <AdminInterviews />
              </TabsContent>

              {/* Role Requests Tab */}
              <TabsContent value="requests" className="space-y-6">
                <AdminRoleRequests />
              </TabsContent>



              {/* System Health Tab */}
              <TabsContent value="system" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>System Health Monitoring</CardTitle>
                    <CardDescription>
                      Monitor system performance and health metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">CPU Usage</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-600">{dashboardData.system?.cpu_percent || 0}%</div>
                          <Progress value={dashboardData.system?.cpu_percent || 0} className="w-full mt-2" />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Memory Usage</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-yellow-600">{dashboardData.system?.memory_percent || 0}%</div>
                          <Progress value={dashboardData.system?.memory_percent || 0} className="w-full mt-2" />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Disk Usage</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-blue-600">{dashboardData.system?.disk_percent || 0}%</div>
                          <Progress value={dashboardData.system?.disk_percent || 0} className="w-full mt-2" />
                          <p className="text-xs text-gray-500 mt-1">{dashboardData.system?.disk_free || 0} GB free of {dashboardData.system?.disk_total || 0} GB</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Network I/O</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-purple-600">12%</div>
                          <Progress value={12} className="w-full mt-2" />
                        </CardContent>
                      </Card>
                    </div>

                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">System Monitoring</h3>
                      <p className="text-gray-500 mb-4">Real-time system performance monitoring</p>
                      <Button>View Detailed Metrics</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Management</CardTitle>
                    <CardDescription>
                      Monitor security events and manage access controls
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center">
                            <Shield className="h-5 w-5 mr-2" />
                            Security Score
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-green-600">94/100</div>
                          <p className="text-sm text-gray-600">Excellent security posture</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Failed Logins</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-yellow-600">12</div>
                          <p className="text-sm text-gray-600">Last 24 hours</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Active Sessions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-blue-600">1,847</div>
                          <p className="text-sm text-gray-600">Currently active</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Security Center</h3>
                      <p className="text-gray-500 mb-4">Advanced security monitoring and controls</p>
                      <Button>Access Security Center</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
