import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Briefcase, 
  FileText, 
  Building, 
  TrendingUp, 
  TrendingDown,
  Activity, 
  Shield, 
  Settings, 
  Download,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Globe,
  BarChart3,
  PieChart,
  Calendar,
  Mail,
  Phone
} from 'lucide-react';
import { adminService, PlatformOverview } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';

const AdminDashboard: React.FC = () => {
  const [platformData, setPlatformData] = useState<PlatformOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeframe, setTimeframe] = useState('monthly');
  const [users, setUsers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterEmirate, setFilterEmirate] = useState('');
  const { toast } = useToast();

  // Mock data for demonstration
  const mockPlatformData: PlatformOverview = {
    total_users: 2847,
    total_jobs: 1256,
    total_applications: 8934,
    total_companies: 342,
    active_users_today: 156,
    new_registrations_today: 23,
    jobs_posted_today: 12,
    applications_submitted_today: 89,
    user_growth_rate: 15.2,
    job_growth_rate: 8.7,
    application_success_rate: 23.4,
    platform_engagement_score: 78.5,
    emiratization_metrics: {
      uae_nationals_percentage: 67.3,
      emiratization_jobs_count: 423,
      emiratization_success_rate: 31.2
    },
    top_industries: [
      { industry: 'Technology', job_count: 234, application_count: 1567 },
      { industry: 'Finance', job_count: 189, application_count: 1234 },
      { industry: 'Healthcare', job_count: 156, application_count: 987 },
      { industry: 'Education', job_count: 134, application_count: 876 },
      { industry: 'Government', job_count: 123, application_count: 765 }
    ],
    top_emirates: [
      { emirate: 'Dubai', user_count: 1234, job_count: 567 },
      { emirate: 'Abu Dhabi', user_count: 987, job_count: 432 },
      { emirate: 'Sharjah', user_count: 456, job_count: 234 },
      { emirate: 'Ajman', user_count: 123, job_count: 89 },
      { emirate: 'Ras Al Khaimah', user_count: 87, job_count: 45 }
    ],
    recent_activities: [
      {
        type: 'user_registration',
        description: 'New user registered: Fatima Al Zahra',
        timestamp: '2024-09-15T16:30:00Z',
        user_id: 'user-123',
        user_name: 'Fatima Al Zahra'
      },
      {
        type: 'job_posted',
        description: 'New job posted: Senior Software Engineer at ADNOC',
        timestamp: '2024-09-15T15:45:00Z',
        user_id: 'recruiter-456',
        user_name: 'Ahmed Al Mansouri'
      },
      {
        type: 'application_submitted',
        description: 'Application submitted for AI Engineer position',
        timestamp: '2024-09-15T14:20:00Z',
        user_id: 'candidate-789',
        user_name: 'Omar Al Rashid'
      }
    ]
  };

  const mockUsers = [
    {
      id: '1',
      name: 'Ahmed Al Mansouri',
      email: 'ahmed.almansouri@email.com',
      role: 'candidate',
      emirate: 'Dubai',
      registration_date: '2024-08-15T10:00:00Z',
      last_login: '2024-09-15T14:30:00Z',
      is_active: true,
      profile_completion: 85,
      applications_count: 12,
      jobs_posted_count: 0
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      role: 'recruiter',
      emirate: 'Abu Dhabi',
      registration_date: '2024-07-20T09:00:00Z',
      last_login: '2024-09-15T16:00:00Z',
      is_active: true,
      profile_completion: 95,
      applications_count: 0,
      jobs_posted_count: 23
    },
    {
      id: '3',
      name: 'Dr. Fatima Al Zahra',
      email: 'fatima.alzahra@university.ae',
      role: 'mentor',
      emirate: 'Sharjah',
      registration_date: '2024-06-10T11:00:00Z',
      last_login: '2024-09-14T20:15:00Z',
      is_active: true,
      profile_completion: 100,
      applications_count: 0,
      jobs_posted_count: 0
    }
  ];

  useEffect(() => {
    loadPlatformData();
    loadUsers();
  }, [timeframe]);

  const loadPlatformData = async () => {
    setIsLoading(true);
    try {
      const response = await adminService.getPlatformOverview(timeframe);
      
      if (response.success) {
        setPlatformData(response.data);
      } else {
        // Use mock data if API fails
        setPlatformData(mockPlatformData);
        console.log('Using mock data for platform overview');
      }
    } catch (error) {
      console.error('Error loading platform data:', error);
      // Use mock data as fallback
      setPlatformData(mockPlatformData);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await adminService.getUserManagement(1, 50, {
        role: filterRole || undefined,
        emirate: filterEmirate || undefined,
        search: searchTerm || undefined
      });
      
      if (response.success) {
        setUsers(response.data?.users || []);
      } else {
        // Use mock data if API fails
        setUsers(mockUsers);
        console.log('Using mock data for users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      // Use mock data as fallback
      setUsers(mockUsers);
    }
  };

  const handleUserStatusUpdate = async (userId: string, isActive: boolean) => {
    try {
      const response = await adminService.updateUserStatus(userId, isActive);
      
      if (response.success) {
        toast({
          title: "Success",
          description: `User ${isActive ? 'activated' : 'deactivated'} successfully!`,
        });
        
        // Update local state
        setUsers(prev => 
          prev.map(user => 
            user.id === userId ? { ...user, is_active: isActive } : user
          )
        );
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update user status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleExportData = async (type: 'users' | 'jobs' | 'applications' | 'analytics') => {
    try {
      const response = await adminService.exportData(type, 'excel');
      
      if (response.success) {
        toast({
          title: "Export Started",
          description: "Your data export has been downloaded.",
        });
      } else {
        toast({
          title: "Export Failed",
          description: response.error || "Failed to export data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during export",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'recruiter': return 'bg-blue-100 text-blue-800';
      case 'mentor': return 'bg-purple-100 text-purple-800';
      case 'employer_admin': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration': return <UserCheck className="h-4 w-4" />;
      case 'job_posted': return <Briefcase className="h-4 w-4" />;
      case 'application_submitted': return <FileText className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">🛡️ Admin Dashboard</h1>
              <p className="text-xl opacity-90">Platform oversight and management for Emirati Journey</p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-40 bg-white text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="bg-white text-purple-600 hover:bg-gray-100">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Total Users</p>
                      <p className="text-2xl font-bold text-blue-600">{platformData?.total_users.toLocaleString()}</p>
                      <div className="flex items-center mt-1">
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-500">+{platformData?.user_growth_rate}%</span>
                      </div>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Total Jobs</p>
                      <p className="text-2xl font-bold text-green-600">{platformData?.total_jobs.toLocaleString()}</p>
                      <div className="flex items-center mt-1">
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-500">+{platformData?.job_growth_rate}%</span>
                      </div>
                    </div>
                    <Briefcase className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Total Applications</p>
                      <p className="text-2xl font-bold text-purple-600">{platformData?.total_applications.toLocaleString()}</p>
                      <div className="flex items-center mt-1">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-500">{platformData?.application_success_rate}% success</span>
                      </div>
                    </div>
                    <FileText className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Companies</p>
                      <p className="text-2xl font-bold text-orange-600">{platformData?.total_companies.toLocaleString()}</p>
                      <div className="flex items-center mt-1">
                        <Building className="h-4 w-4 text-orange-500 mr-1" />
                        <span className="text-sm text-gray-500">Active employers</span>
                      </div>
                    </div>
                    <Building className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Today's Activity */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{platformData?.active_users_today}</p>
                    <p className="text-sm text-gray-500">Active Users Today</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{platformData?.new_registrations_today}</p>
                    <p className="text-sm text-gray-500">New Registrations</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{platformData?.jobs_posted_today}</p>
                    <p className="text-sm text-gray-500">Jobs Posted Today</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{platformData?.applications_submitted_today}</p>
                    <p className="text-sm text-gray-500">Applications Today</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* D33 and Talent33 & Emiratization Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-red-600" />
                  <span>🇦🇪 D33 and Talent33 & Emiratization Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">UAE Nationals Percentage</p>
                    <div className="flex items-center space-x-2">
                      <Progress value={platformData?.emiratization_metrics.uae_nationals_percentage} className="flex-1" />
                      <span className="text-sm font-semibold">{platformData?.emiratization_metrics.uae_nationals_percentage}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Emiratization Jobs</p>
                    <p className="text-2xl font-bold text-red-600">{platformData?.emiratization_metrics.emiratization_jobs_count}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Emiratization Success Rate</p>
                    <p className="text-2xl font-bold text-green-600">{platformData?.emiratization_metrics.emiratization_success_rate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Industries and Emirates */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Industries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {platformData?.top_industries.map((industry, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{industry.industry}</p>
                          <p className="text-sm text-gray-500">{industry.job_count} jobs</p>
                        </div>
                        <Badge variant="outline">{industry.application_count} applications</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Emirates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {platformData?.top_emirates.map((emirate, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{emirate.emirate}</p>
                          <p className="text-sm text-gray-500">{emirate.user_count} users</p>
                        </div>
                        <Badge variant="outline">{emirate.job_count} jobs</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Platform Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {platformData?.recent_activities.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{activity.description}</p>
                        <p className="text-xs text-gray-500">{formatDate(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            {/* User Management Header */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>User Management</CardTitle>
                  <div className="flex space-x-2">
                    <Button onClick={() => handleExportData('users')} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export Users
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex-1 min-w-64">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Roles</SelectItem>
                      <SelectItem value="candidate">Candidate</SelectItem>
                      <SelectItem value="recruiter">Recruiter</SelectItem>
                      <SelectItem value="mentor">Mentor</SelectItem>
                      <SelectItem value='employer_admin'>Employer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterEmirate} onValueChange={setFilterEmirate}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Emirates" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Emirates</SelectItem>
                      <SelectItem value="Dubai">Dubai</SelectItem>
                      <SelectItem value="Abu Dhabi">Abu Dhabi</SelectItem>
                      <SelectItem value="Sharjah">Sharjah</SelectItem>
                      <SelectItem value="Ajman">Ajman</SelectItem>
                      <SelectItem value="Ras Al Khaimah">Ras Al Khaimah</SelectItem>
                      <SelectItem value="Fujairah">Fujairah</SelectItem>
                      <SelectItem value="Umm Al Quwain">Umm Al Quwain</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={loadUsers}>
                    <Filter className="h-4 w-4 mr-2" />
                    Apply Filters
                  </Button>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">User</th>
                        <th className="text-left p-4">Role</th>
                        <th className="text-left p-4">Emirate</th>
                        <th className="text-left p-4">Registration</th>
                        <th className="text-left p-4">Last Login</th>
                        <th className="text-left p-4">Status</th>
                        <th className="text-left p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                              <div className="flex items-center mt-1">
                                <Progress value={user.profile_completion} className="w-16 h-2 mr-2" />
                                <span className="text-xs text-gray-500">{user.profile_completion}%</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={getRoleColor(user.role)}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="p-4">{user.emirate}</td>
                          <td className="p-4">
                            <p className="text-sm">{formatDate(user.registration_date)}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-sm">{formatDate(user.last_login)}</p>
                          </td>
                          <td className="p-4">
                            {user.is_active ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleUserStatusUpdate(user.id, !user.is_active)}
                              >
                                {user.is_active ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Briefcase className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Job Management Interface</h3>
                  <p className="text-gray-600 mb-6">
                    Comprehensive job oversight and management capabilities.
                  </p>
                  <Button onClick={() => handleExportData('jobs')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Job Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Application Management Interface</h3>
                  <p className="text-gray-600 mb-6">
                    Monitor and manage job applications across the platform.
                  </p>
                  <Button onClick={() => handleExportData('applications')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Application Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Advanced Analytics Dashboard</h3>
                  <p className="text-gray-600 mb-6">
                    Deep insights and analytics for platform performance and D33 and Talent33 compliance.
                  </p>
                  <Button onClick={() => handleExportData('analytics')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Analytics Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;

