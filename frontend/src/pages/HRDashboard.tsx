import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  FileText, 
  Briefcase, 
  TrendingUp, 
  Calendar,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  UserCheck,
  Building,
  Award,
  MessageSquare,
  Download,
  Upload,
  BarChart3,
  PieChart,
  Target,
  Star,
  RotateCcw
} from 'lucide-react';

// Role Switcher Button Component
const RoleSwitcherButton = () => {
  const handleRoleSwitch = () => {
    console.log('🔄 Switching to role selector from HR Dashboard');
    
    // Clear authentication state to allow role switching
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_token');
    
    // Force navigation to HTML role selector
    window.location.href = '/role_selector.html';
  };

  return (
    <button 
      onClick={handleRoleSwitch}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '25px',
        fontWeight: '600',
        cursor: 'pointer',
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.3s ease'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(5, 150, 105, 0.4)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.3)';
      }}
    >
      <RotateCcw size={16} />
      Switch Role
    </button>
  );
};

const HRDashboard = () => {
  const { user, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboardData, setDashboardData] = useState({
    candidates: {
      total: 0,
      active: 0,
      shortlisted: 0,
      interviewed: 0,
      hired: 0
    },
    positions: {
      total: 0,
      open: 0,
      filled: 0,
      pending: 0
    },
    recruitment: {
      averageTimeToHire: 0,
      successRate: 0,
      candidateQuality: 0
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

  // Get user display name from various possible sources
  const getUserDisplayName = () => {
    if (!user) return 'HR Manager';
    
    // Try user_metadata first (common in Supabase)
    if (user.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user.user_metadata?.name) return user.user_metadata.name;
    
    // Try direct properties
    if (user.full_name) return user.full_name;
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    
    // Fallback to email-based name
    if (user.email) {
      const emailName = user.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    
    return 'HR Manager';
  };

  // Logout functionality
  const handleLogout = async () => {
    try {
      console.log('🚪 HR Manager logout process...');
      await signOut();
      console.log('✅ HR Manager logout completed');
      window.location.replace('/auth');
    } catch (error) {
      console.error('HR Manager logout error:', error);
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

      const response = await fetch('http://localhost:5003/api/hr/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      } );

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data.data || {});
      } else {
        console.log('API call failed, using mock data');
        setMockData();
      }
    } catch (error) {
      console.error('Error loading HR dashboard data:', error);
      setMockData();
    }
  };

  const setMockData = () => {
    setDashboardData({
      candidates: {
        total: 156,
        active: 89,
        shortlisted: 23,
        interviewed: 12,
        hired: 8
      },
      positions: {
        total: 45,
        open: 18,
        filled: 22,
        pending: 5
      },
      recruitment: {
        averageTimeToHire: 28,
        successRate: 72,
        candidateQuality: 8.4
      },
      activity: [
        {
          id: 1,
          type: 'candidate_hired',
          title: 'New Hire Completed',
          description: 'Ahmed Al Emirati joined as Software Engineer',
          timestamp: new Date().toISOString()
        },
        {
          id: 2,
          type: 'interview_scheduled',
          title: 'Interview Scheduled',
          description: 'Technical interview for Frontend Developer position',
          timestamp: new Date(Date.now() - 86400000).toISOString()
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
    <Layout>
      {/* Role Switcher Button */}
      <RoleSwitcherButton />
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  HR Management Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">
                  Welcome back, {getUserDisplayName()}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="secondary" className="bg-ehrdc-teal/10 text-ehrdc-teal">
                  HR Manager
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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="candidates">Candidates</TabsTrigger>
              <TabsTrigger value="positions">Positions</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.candidates.total}</div>
                    <p className="text-xs text-muted-foreground">
                      +12% from last month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Positions</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.positions.open}</div>
                    <p className="text-xs text-muted-foreground">
                      {dashboardData.positions.pending} pending approval
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Time to Hire</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.recruitment.averageTimeToHire} days</div>
                    <p className="text-xs text-muted-foreground">
                      -5 days from last quarter
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.recruitment.successRate}%</div>
                    <p className="text-xs text-muted-foreground">
                      +8% from last quarter
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recruitment Pipeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Recruitment Pipeline</CardTitle>
                  <CardDescription>
                    Current status of candidates in the recruitment process
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{dashboardData.candidates.total}</div>
                      <p className="text-sm text-gray-600">Total Candidates</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{dashboardData.candidates.active}</div>
                      <p className="text-sm text-gray-600">Active</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{dashboardData.candidates.shortlisted}</div>
                      <p className="text-sm text-gray-600">Shortlisted</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{dashboardData.candidates.interviewed}</div>
                      <p className="text-sm text-gray-600">Interviewed</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{dashboardData.candidates.hired}</div>
                      <p className="text-sm text-gray-600">Hired</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest updates from your recruitment activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.activity.length > 0 ? (
                      dashboardData.activity.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            {activity.type === 'candidate_hired' && (
                              <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                            )}
                            {activity.type === 'interview_scheduled' && (
                              <Calendar className="h-4 w-4 text-blue-500 mt-1" />
                            )}
                            {activity.type === 'application_received' && (
                              <FileText className="h-4 w-4 text-purple-500 mt-1" />
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
                              {new Date(activity.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No recent activity</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Candidates Tab */}
            <TabsContent value="candidates" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Candidate Management</CardTitle>
                  <CardDescription>
                    Manage and review candidate applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="flex-1">
                      <Input placeholder="Search candidates..." className="max-w-sm" />
                    </div>
                    <Select>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Candidates</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="shortlisted">Shortlisted</SelectItem>
                        <SelectItem value="interviewed">Interviewed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button>
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>

                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Candidate Management</h3>
                    <p className="text-gray-500 mb-4">Advanced candidate filtering and management tools</p>
                    <Button>View All Candidates</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Positions Tab */}
            <TabsContent value="positions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Position Management</CardTitle>
                  <CardDescription>
                    Manage job positions and requirements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Open Positions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-green-600">{dashboardData.positions.open}</div>
                        <p className="text-sm text-gray-600">Currently recruiting</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Filled Positions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-blue-600">{dashboardData.positions.filled}</div>
                        <p className="text-sm text-gray-600">Successfully filled</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Pending Approval</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-orange-600">{dashboardData.positions.pending}</div>
                        <p className="text-sm text-gray-600">Awaiting approval</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Position Management</h3>
                    <p className="text-gray-500 mb-4">Create and manage job positions</p>
                    <Button>Create New Position</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Recruitment Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Candidate Quality Score</span>
                        <span className="text-sm font-bold">{dashboardData.recruitment.candidateQuality}/10</span>
                      </div>
                      <Progress value={dashboardData.recruitment.candidateQuality * 10} className="w-full" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Success Rate</span>
                        <span className="text-sm font-bold">{dashboardData.recruitment.successRate}%</span>
                      </div>
                      <Progress value={dashboardData.recruitment.successRate} className="w-full" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <PieChart className="h-5 w-5 mr-2" />
                      Department Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                          <span className="text-sm">Technology</span>
                        </div>
                        <span className="text-sm font-medium">45%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-sm">Operations</span>
                        </div>
                        <span className="text-sm font-medium">30%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                          <span className="text-sm">Marketing</span>
                        </div>
                        <span className="text-sm font-medium">15%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                          <span className="text-sm">Finance</span>
                        </div>
                        <span className="text-sm font-medium">10%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Monthly Report</span>
                    </CardTitle>
                    <CardDescription>Comprehensive monthly recruitment summary</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>Candidate Report</span>
                    </CardTitle>
                    <CardDescription>Detailed candidate analytics and insights</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-5 w-5" />
                      <span>Performance Report</span>
                    </CardTitle>
                    <CardDescription>Recruitment team performance metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default HRDashboard;
