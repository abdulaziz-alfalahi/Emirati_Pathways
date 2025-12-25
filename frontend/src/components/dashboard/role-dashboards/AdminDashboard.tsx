
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart4,
  BookOpen,
  User,
  Users,
  Settings,
  Shield,
  TrendingUp,
  TrendingDown,
  Activity,
  Globe,
  Database,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Target,
  Award,
  Building
} from 'lucide-react';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import DashboardActions from '@/components/dashboard/DashboardActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';

interface AdminDashboardProps {
  activeTab: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab }) => {
  import { restClient } from '@/utils/api';
  import { useQuery } from '@tanstack/react-query'; // Assuming react-query is used in the project, otherwise standard useEffect

  // Defining interfaces for the data structure
  interface DashboardData {
    health: any;
    metrics: {
      recent: any[];
    };
    notifications: {
      unread_count: number;
      recent: any[];
    };
    users: {
      total: number;
    };
    timestamp: string;
  }

  const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab }) => {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initial Real-time Data State (Fallbacks)
    const [realTimeData, setRealTimeData] = useState({
      totalUsers: 0,
      activeUsers: 0,
      newRegistrations: 0,
      jobApplications: 0,
      successfulMatches: 0,
      systemUptime: 0,
      apiCalls: 0,
      storageUsed: 0,
      emiratizationRate: 0,
      partnerOrganizations: 0
    });

    const [systemHealth, setSystemHealth] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    // Fetch Dashboard Data
    React.useEffect(() => {
      const fetchDashboardData = async () => {
        try {
          setLoading(true);
          // Using restClient to handle auth headers automatically
          const response = await restClient.get('/api/admin/dashboard');
          const data = response.data.data;

          setDashboardData(data);

          // Map backend data to frontend state structure
          // Note: Backend might not return all these fields yet, so we use fallbacks
          if (data) {
            setRealTimeData(prev => ({
              ...prev,
              totalUsers: data.users?.total || 0,
              activeUsers: data.metrics?.recent?.find((m: any) => m.name === 'active_users')?.value || 0,
              systemUptime: 99.9, // Mock for now if not in backend
              apiCalls: data.metrics?.recent?.find((m: any) => m.name === 'api_calls')?.value || 0,
            }));

            // Transform health data
            const healthComponents = data.health?.data?.components || {};
            const healthArray = Object.keys(healthComponents).map(key => ({
              service: key.charAt(0).toUpperCase() + key.slice(1),
              status: healthComponents[key].status === 'healthy' ? 'healthy' : 'error',
              uptime: 99.9 // Mock
            }));
            setSystemHealth(healthArray);
          }
        } catch (err) {
          console.error("Failed to fetch admin dashboard data:", err);
          setError("Failed to load dashboard data");
        } finally {
          setLoading(false);
        }
      };

      fetchDashboardData();
    }, []);

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'healthy': return 'text-green-600 bg-green-100';
        case 'warning': return 'text-yellow-600 bg-yellow-100';
        case 'error': return 'text-red-600 bg-red-100';
        default: return 'text-gray-600 bg-gray-100';
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'healthy': return <CheckCircle className="h-4 w-4" />;
        case 'warning': return <AlertTriangle className="h-4 w-4" />;
        case 'error': return <AlertTriangle className="h-4 w-4" />;
        default: return <Clock className="h-4 w-4" />;
      }
    };

    const getActivityIcon = (type: string) => {
      switch (type) {
        case 'user': return <User className="h-4 w-4 text-blue-600" />;
        case 'application': return <Target className="h-4 w-4 text-green-600" />;
        case 'cv': return <BookOpen className="h-4 w-4 text-purple-600" />;
        case 'interview': return <Activity className="h-4 w-4 text-orange-600" />;
        case 'offer': return <Award className="h-4 w-4 text-emerald-600" />;
        default: return <Activity className="h-4 w-4 text-gray-600" />;
      }
    };

    return (
      <Tabs defaultValue={activeTab} className="space-y-8">
        <TabsList className="mb-4">
          <TabsTrigger value="overview"><User className="h-4 w-4 mr-2" /> Overview</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart4 className="h-4 w-4 mr-2" /> Analytics</TabsTrigger>
          <TabsTrigger value="system"><Activity className="h-4 w-4 mr-2" /> System Health</TabsTrigger>
          <TabsTrigger value="management"><Users className="h-4 w-4 mr-2" /> Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          {/* Enhanced Real-time Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{realTimeData.totalUsers.toLocaleString()}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +12% from last month
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                    <p className="text-2xl font-bold">{realTimeData.activeUsers.toLocaleString()}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +8% from yesterday
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Job Applications</p>
                    <p className="text-2xl font-bold">{realTimeData.jobApplications.toLocaleString()}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +15% this week
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Emiratization Rate</p>
                    <p className="text-2xl font-bold">{realTimeData.emiratizationRate}%</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +2.3% this quarter
                    </p>
                  </div>
                  <Award className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Real-time Activity Feed
              </CardTitle>
              <CardDescription>Live updates from across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">by {activity.user}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Frequently used administrative functions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/admin/user-roles" className="block">
                  <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <div>
                        <h3 className="font-medium">User Role Management</h3>
                        <p className="text-sm text-muted-foreground">Assign and manage user roles</p>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link to="/api-keys" className="block">
                  <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5 text-green-600" />
                      <div>
                        <h3 className="font-medium">API Configuration</h3>
                        <p className="text-sm text-muted-foreground">Manage platform integrations</p>
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <BarChart4 className="h-5 w-5 text-purple-600" />
                    <div>
                      <h3 className="font-medium">Generate Reports</h3>
                      <p className="text-sm text-muted-foreground">Export platform analytics</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-8">
          <DashboardMetrics />

          {/* Enhanced Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>System Uptime</span>
                      <span>{realTimeData.systemUptime}%</span>
                    </div>
                    <Progress value={realTimeData.systemUptime} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Storage Usage</span>
                      <span>{realTimeData.storageUsed}%</span>
                    </div>
                    <Progress value={realTimeData.storageUsed} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>API Response Time</span>
                      <span>125ms avg</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Partnership Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Partner Organizations</span>
                    </div>
                    <span className="font-bold">{realTimeData.partnerOrganizations}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Successful Matches</span>
                    </div>
                    <span className="font-bold">{realTimeData.successfulMatches}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-orange-600" />
                      <span className="text-sm">API Calls Today</span>
                    </div>
                    <span className="font-bold">{realTimeData.apiCalls.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Health Monitor
              </CardTitle>
              <CardDescription>Real-time status of platform services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemHealth.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(service.status)}
                      <div>
                        <h3 className="font-medium">{service.service}</h3>
                        <p className="text-sm text-muted-foreground">Uptime: {service.uptime}%</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(service.status)}>
                      {service.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="management" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Administration Tools</CardTitle>
              <CardDescription>Comprehensive platform management</CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardActions
                actions={[
                  { title: "User Role Management", description: "Assign and manage user roles", icon: Shield, link: "/admin/user-roles" },
                  { title: "User Management", description: "Manage user accounts and profiles", icon: Users },
                  { title: "Content Management", description: "Manage platform content and resources", icon: BookOpen },
                  { title: "API Configuration", description: "Configure platform integrations", icon: Settings, link: "/api-keys" },
                  { title: "Analytics & Reports", description: "Generate comprehensive reports", icon: BarChart4 },
                  { title: "System Monitoring", description: "Monitor platform performance", icon: Activity }
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    );
  };

  export default AdminDashboard;
