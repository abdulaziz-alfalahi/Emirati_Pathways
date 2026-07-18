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
  User, 
  Briefcase, 
  Users, 
  Video,
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
  Calendar,
  FileText,
  TrendingUp,
  Activity,
  RotateCcw
} from 'lucide-react';

// Role Switcher Button Component
const RoleSwitcherButton = () => {
  const handleRoleSwitch = () => {
    console.log('🔄 Switching to role selector from Recruiter Dashboard');
    
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

interface RecruiterDashboardProps {
  activeTab: string;
}

const RecruiterDashboard: React.FC<RecruiterDashboardProps> = ({ activeTab }) => {
  const { user, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    performance: {
      fillRate: 85,
      candidateQuality: 92,
      clientSatisfaction: 88,
      timeToFill: 18
    },
    pipeline: {
      totalCandidates: 156,
      activeApplications: 43,
      interviewsScheduled: 12,
      offersExtended: 8
    },
    jobs: {
      activeJobs: 15,
      filledPositions: 23,
      pendingApproval: 5,
      draftJobs: 3
    },
    interviews: {
      scheduled: 8,
      completed: 15,
      pending: 3,
      cancelled: 2
    }
  });

  const [recentActivities] = useState([
    { id: 1, type: 'application', title: 'New Application Received', description: 'Ahmed Al-Rashid applied for Senior Developer position', timestamp: '2 hours ago', status: 'new' },
    { id: 2, type: 'interview', title: 'Interview Completed', description: 'Fatima Hassan - Marketing Manager interview', timestamp: '4 hours ago', status: 'completed' },
    { id: 3, type: 'job', title: 'Job Posted', description: 'Data Analyst position published', timestamp: '1 day ago', status: 'active' },
    { id: 4, type: 'offer', title: 'Offer Accepted', description: 'Omar Al-Zahra accepted Software Engineer offer', timestamp: '2 days ago', status: 'success' }
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return (
  <Layout>
    <RoleSwitcherButton />
    
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">  {/* Added container constraints */}
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recruiter Dashboard</h1>
            <p className="text-gray-600">Manage recruitment pipeline and candidate relationships</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-ehrdc-teal/10 text-ehrdc-teal">
              Recruiter
            </Badge>
            <Button onClick={signOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          <Tabs defaultValue={activeTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="jobs" className="flex items-center space-x-2">
                <Briefcase className="h-4 w-4" />
                <span>Jobs</span>
              </TabsTrigger>
              <TabsTrigger value="candidates" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Candidates</span>
              </TabsTrigger>
              <TabsTrigger value="interviews" className="flex items-center space-x-2">
                <Video className="h-4 w-4" />
                <span>Interviews</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Fill Rate</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-ehrdc-teal">{dashboardData.performance.fillRate}%</div>
                    <Progress value={dashboardData.performance.fillRate} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Candidate Quality</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-ehrdc-teal">{dashboardData.performance.candidateQuality}%</div>
                    <Progress value={dashboardData.performance.candidateQuality} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Client Satisfaction</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-ehrdc-teal">{dashboardData.performance.clientSatisfaction}%</div>
                    <Progress value={dashboardData.performance.clientSatisfaction} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Time to Fill</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-ehrdc-teal">{dashboardData.performance.timeToFill}</div>
                    <p className="text-xs text-muted-foreground">days</p>
                  </CardContent>
                </Card>
              </div>

              {/* Pipeline Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>Recruitment Pipeline</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Candidates</span>
                      <Badge variant="secondary" className="bg-ehrdc-teal/10 text-ehrdc-teal">
                        {dashboardData.pipeline.totalCandidates}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Active Applications</span>
                      <Badge variant="secondary">{dashboardData.pipeline.activeApplications}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Interviews Scheduled</span>
                      <Badge variant="secondary">{dashboardData.pipeline.interviewsScheduled}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Offers Extended</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {dashboardData.pipeline.offersExtended}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="h-5 w-5" />
                      <span>Recent Activities</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivities.slice(0, 4).map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            {activity.type === 'application' && <FileText className="h-4 w-4 text-blue-500" />}
                            {activity.type === 'interview' && <Video className="h-4 w-4 text-purple-500" />}
                            {activity.type === 'job' && <Briefcase className="h-4 w-4 text-ehrdc-teal" />}
                            {activity.type === 'offer' && <CheckCircle className="h-4 w-4 text-green-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                            <p className="text-sm text-gray-500">{activity.description}</p>
                            <p className="text-xs text-gray-400">{activity.timestamp}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="jobs" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Briefcase className="h-5 w-5" />
                    <span>Job Management</span>
                  </CardTitle>
                  <CardDescription>Manage your job postings and requirements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-ehrdc-teal/5 rounded-lg">
                      <div className="text-2xl font-bold text-ehrdc-teal">{dashboardData.jobs.activeJobs}</div>
                      <div className="text-sm text-gray-600">Active Jobs</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{dashboardData.jobs.filledPositions}</div>
                      <div className="text-sm text-gray-600">Filled Positions</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{dashboardData.jobs.pendingApproval}</div>
                      <div className="text-sm text-gray-600">Pending Approval</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-600">{dashboardData.jobs.draftJobs}</div>
                      <div className="text-sm text-gray-600">Draft Jobs</div>
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <Button className="bg-ehrdc-teal hover:bg-ehrdc-teal/90">
                      <Upload className="h-4 w-4 me-2" />
                      Post New Job
                    </Button>
                    <Button variant="outline">
                      <Eye className="h-4 w-4 me-2" />
                      View All Jobs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="candidates" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Candidate Management</span>
                  </CardTitle>
                  <CardDescription>Review and manage candidate applications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <Input placeholder="Search candidates..." className="w-full" />
                      </div>
                      <Select>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Candidates</SelectItem>
                          <SelectItem value="new">New Applications</SelectItem>
                          <SelectItem value="screening">In Screening</SelectItem>
                          <SelectItem value="interview">Interview Stage</SelectItem>
                          <SelectItem value="offer">Offer Extended</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline">
                        <Filter className="h-4 w-4 me-2" />
                        Filter
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Button variant="outline" className="h-auto p-6 flex flex-col items-center space-y-2">
                        <UserCheck className="h-8 w-8" />
                        <span>Review Applications</span>
                        <span className="text-xs text-muted-foreground">43 pending</span>
                      </Button>
                      <Button variant="outline" className="h-auto p-6 flex flex-col items-center space-y-2">
                        <MessageSquare className="h-8 w-8" />
                        <span>Schedule Interviews</span>
                        <span className="text-xs text-muted-foreground">12 candidates</span>
                      </Button>
                      <Button variant="outline" className="h-auto p-6 flex flex-col items-center space-y-2">
                        <Download className="h-8 w-8" />
                        <span>Export Reports</span>
                        <span className="text-xs text-muted-foreground">Generate reports</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="interviews" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Video className="h-5 w-5" />
                    <span>Interview Management</span>
                  </CardTitle>
                  <CardDescription>Schedule and manage candidate interviews</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{dashboardData.interviews.scheduled}</div>
                      <div className="text-sm text-gray-600">Scheduled</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{dashboardData.interviews.completed}</div>
                      <div className="text-sm text-gray-600">Completed</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{dashboardData.interviews.pending}</div>
                      <div className="text-sm text-gray-600">Pending</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{dashboardData.interviews.cancelled}</div>
                      <div className="text-sm text-gray-600">Cancelled</div>
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <Button className="bg-ehrdc-teal hover:bg-ehrdc-teal/90">
                      <Calendar className="h-4 w-4 me-2" />
                      Schedule Interview
                    </Button>
                    <Button variant="outline">
                      <Eye className="h-4 w-4 me-2" />
                      View Calendar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default RecruiterDashboard;
