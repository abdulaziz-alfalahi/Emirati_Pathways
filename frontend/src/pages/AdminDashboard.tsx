import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
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
  Activity
} from 'lucide-react';



const AdminDashboard = () => {
  const { user, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
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
      systemUptime: 0
    },
    moderation: {
      pendingReviews: 0,
      reportedContent: 0,
      flaggedUsers: 0,
      systemAlerts: 0
    },
    activity: []
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    loadDashboardData();
  }, [isAuthenticated, navigate]);

  const getUserDisplayName = () => {
    if (!user) return 'Administrator';

    if (user.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user.user_metadata?.name) return user.user_metadata.name;
    if (user.full_name) return user.full_name;
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;

    if (user.email) {
      const emailName = user.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }

    return 'Administrator';
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 Admin logout process...');
      await signOut();
      console.log('✅ Admin logout completed');
      window.location.replace('/auth');
    } catch (error) {
      console.error('Admin logout error:', error);
      window.location.href = '/auth';
    }
  };

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('auth_token');
      if (!token) {
        console.log('No token found, using mock data');
        setMockData();
        return;
      }

      const response = await fetch('http://127.0.0.1:5005/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data.data || {});
      } else {
        console.log('API call failed, using mock data');
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
        systemUptime: 99.8
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
      ]
    });
  };

  // Show loading if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="users">User Management</TabsTrigger>
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

              {/* User Management Tab */}
              <TabsContent value="users" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                      Manage platform users and their permissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">User Management Tools</h3>
                      <p className="text-gray-500 mb-4">Advanced user management and permission controls</p>
                      <Button>Manage Users</Button>
                    </div>
                  </CardContent>
                </Card>
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
                          <div className="text-2xl font-bold text-green-600">23%</div>
                          <Progress value={23} className="w-full mt-2" />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Memory Usage</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-yellow-600">67%</div>
                          <Progress value={67} className="w-full mt-2" />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Disk Usage</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-blue-600">45%</div>
                          <Progress value={45} className="w-full mt-2" />
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
