import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
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
  Settings,
  Bell,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';

interface DashboardData {
  candidates: {
    total: number;
    active: number;
    shortlisted: number;
    interviewed: number;
    hired: number;
  };
  positions: {
    total: number;
    open: number;
    filled: number;
    pending: number;
  };
  recruitment: {
    averageTimeToHire: number;
    successRate: number;
    candidateQuality: number;
  };
  activity: Array<{
    id: number;
    type: string;
    title: string;
    description: string;
    timestamp: string;
  }>;
}

// Role Switcher Button Component


const HRDashboard: React.FC = () => {
  const { t } = useTranslation('hr-dashboard');
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboardData, setDashboardData] = useState<DashboardData>({
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

  // Initialize with mock data
  React.useEffect(() => {
    setMockData();
  }, []);

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
        },
        {
          id: 3,
          type: 'application_received',
          title: 'New Application',
          description: 'Fatima Al Zahra applied for Marketing Manager',
          timestamp: new Date(Date.now() - 172800000).toISOString()
        }
      ]
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 font-dubai">
      {/* Navigation */}
      <HybridGovernmentNavFixed showAuthButtons={true} />
      

      
      {/* Main Content */}
      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-dubai-bold text-slate-900 mb-2">
                  HR Management Dashboard
                </h1>
                <p className="text-slate-600 font-dubai-medium">
                  Welcome back, Sara Saeed - Manage UAE National talent acquisition
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-dubai-medium">
                  HR Manager
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-dubai-medium">
                  Talent33 Aligned
                </Badge>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-4">
              <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                <Plus className="h-4 w-4 mr-2" />
                Post New Job
              </Button>
              <Button variant="outline" className="font-dubai-medium">
                <Upload className="h-4 w-4 mr-2" />
                Import Candidates
              </Button>
              <Button variant="outline" className="font-dubai-medium">
                <Download className="h-4 w-4 mr-2" />
                Export Reports
              </Button>
              <Button variant="outline" className="font-dubai-medium">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Interviews
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm">
              <TabsTrigger value="overview" className="font-dubai-medium">Overview</TabsTrigger>
              <TabsTrigger value="candidates" className="font-dubai-medium">Candidates</TabsTrigger>
              <TabsTrigger value="positions" className="font-dubai-medium">Positions</TabsTrigger>
              <TabsTrigger value="analytics" className="font-dubai-medium">Analytics</TabsTrigger>
              <TabsTrigger value="reports" className="font-dubai-medium">Reports</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">Total Candidates</CardTitle>
                    <Users className="h-4 w-4 text-teal-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.candidates.total}</div>
                    <p className="text-xs text-green-600 font-dubai-medium">
                      +12% from last month
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">Active Positions</CardTitle>
                    <Briefcase className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.positions.open}</div>
                    <p className="text-xs text-slate-500 font-dubai-medium">
                      {dashboardData.positions.pending} pending approval
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">Avg. Time to Hire</CardTitle>
                    <Clock className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.recruitment.averageTimeToHire} days</div>
                    <p className="text-xs text-green-600 font-dubai-medium">
                      -5 days from last quarter
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">Success Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.recruitment.successRate}%</div>
                    <p className="text-xs text-green-600 font-dubai-medium">
                      +8% from last quarter
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recruitment Pipeline */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">Recruitment Pipeline</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    Current status of candidates in the recruitment process
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-blue-600">{dashboardData.candidates.total}</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">Total Candidates</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-yellow-600">{dashboardData.candidates.active}</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">Active</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-orange-600">{dashboardData.candidates.shortlisted}</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">Shortlisted</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-purple-600">{dashboardData.candidates.interviewed}</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">Interviewed</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-green-600">{dashboardData.candidates.hired}</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">Hired</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">Recent Activity</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    Latest updates from your recruitment activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.activity.length > 0 ? (
                      dashboardData.activity.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                          <div className="flex-shrink-0">
                            {activity.type === 'candidate_hired' && (
                              <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                            )}
                            {activity.type === 'interview_scheduled' && (
                              <Calendar className="h-5 w-5 text-blue-500 mt-1" />
                            )}
                            {activity.type === 'application_received' && (
                              <FileText className="h-5 w-5 text-purple-500 mt-1" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-dubai-medium text-slate-900">
                              {activity.title}
                            </p>
                            <p className="text-sm text-slate-600 font-dubai">
                              {activity.description}
                            </p>
                            <p className="text-xs text-slate-400 mt-1 font-dubai">
                              {new Date(activity.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 font-dubai-medium">No recent activity</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Candidates Tab */}
            <TabsContent value="candidates" className="space-y-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">Candidate Management</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    Manage and review candidate applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="flex-1">
                      <Input placeholder="Search candidates..." className="max-w-sm font-dubai" />
                    </div>
                    <Select>
                      <SelectTrigger className="w-[180px] font-dubai">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Candidates</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="shortlisted">Shortlisted</SelectItem>
                        <SelectItem value="interviewed">Interviewed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button className="font-dubai-medium">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>

                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-dubai-bold text-slate-900 mb-2">Candidate Management</h3>
                    <p className="text-slate-500 mb-6 font-dubai-medium">Advanced candidate filtering and management tools</p>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                      View All Candidates
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Positions Tab */}
            <TabsContent value="positions" className="space-y-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">Position Management</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    Manage job positions and requirements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card className="bg-green-50 border-green-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-dubai-bold text-green-800">Open Positions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-dubai-bold text-green-600">{dashboardData.positions.open}</div>
                        <p className="text-sm text-green-700 font-dubai-medium">Currently recruiting</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-blue-50 border-blue-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-dubai-bold text-blue-800">Filled Positions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-dubai-bold text-blue-600">{dashboardData.positions.filled}</div>
                        <p className="text-sm text-blue-700 font-dubai-medium">Successfully filled</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-orange-50 border-orange-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-dubai-bold text-orange-800">Pending Approval</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-dubai-bold text-orange-600">{dashboardData.positions.pending}</div>
                        <p className="text-sm text-orange-700 font-dubai-medium">Awaiting approval</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="text-center py-12">
                    <Briefcase className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-dubai-bold text-slate-900 mb-2">Position Management</h3>
                    <p className="text-slate-500 mb-6 font-dubai-medium">Create and manage job positions</p>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Position
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">Recruitment Analytics</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    Insights and metrics for data-driven decisions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-dubai-bold text-slate-900 mb-2">Advanced Analytics</h3>
                    <p className="text-slate-500 mb-6 font-dubai-medium">Comprehensive recruitment analytics and insights</p>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                      View Analytics Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">Reports & Exports</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    Generate and download recruitment reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-dubai-bold text-slate-900 mb-2">Report Generation</h3>
                    <p className="text-slate-500 mb-6 font-dubai-medium">Generate detailed recruitment reports</p>
                    <div className="flex justify-center space-x-4">
                      <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                        <Download className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                      <Button variant="outline" className="font-dubai-medium">
                        <Eye className="h-4 w-4 mr-2" />
                        View Templates
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
