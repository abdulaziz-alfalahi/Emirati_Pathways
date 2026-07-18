import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  BookOpen, 
  BarChart3, 
  Library,
  Calendar,
  TrendingUp,
  Award,
  Clock,
  Target,
  AlertCircle,
  CheckCircle,
  Plus,
  Search,
  Filter,
  Download,
  Settings,
  Bell,
  Globe
} from 'lucide-react';

interface DashboardStats {
  totalStudents: number;
  activeClasses: number;
  completedAssessments: number;
  resourcesShared: number;
  attendanceRate: number;
  performanceAverage: number;
}

interface RecentActivity {
  id: string;
  type: 'assessment' | 'attendance' | 'resource' | 'curriculum';
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'overdue';
}

interface UpcomingTask {
  id: string;
  title: string;
  type: 'lesson' | 'assessment' | 'meeting' | 'deadline';
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

const EducatorDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeClasses: 0,
    completedAssessments: 0,
    resourcesShared: 0,
    attendanceRate: 0,
    performanceAverage: 0
  });

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedTimeframe]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration - replace with actual API calls
      setStats({
        totalStudents: 156,
        activeClasses: 8,
        completedAssessments: 24,
        resourcesShared: 45,
        attendanceRate: 92.5,
        performanceAverage: 85.3
      });

      setRecentActivities([
        {
          id: '1',
          type: 'assessment',
          title: 'Mathematics Quiz - Grade 5A',
          description: '28 students completed the assessment',
          timestamp: '2 hours ago',
          status: 'completed'
        },
        {
          id: '2',
          type: 'attendance',
          title: 'Daily Attendance - Science Class',
          description: '2 students marked absent',
          timestamp: '4 hours ago',
          status: 'completed'
        },
        {
          id: '3',
          type: 'resource',
          title: 'New Learning Material Added',
          description: 'Arabic Literature - Grade 6 resources',
          timestamp: '1 day ago',
          status: 'completed'
        },
        {
          id: '4',
          type: 'curriculum',
          title: 'Lesson Plan Review',
          description: 'Islamic Studies curriculum update pending',
          timestamp: '2 days ago',
          status: 'pending'
        }
      ]);

      setUpcomingTasks([
        {
          id: '1',
          title: 'Grade 5 Mathematics Assessment',
          type: 'assessment',
          dueDate: '2025-09-22',
          priority: 'high',
          completed: false
        },
        {
          id: '2',
          title: 'Parent-Teacher Conference',
          type: 'meeting',
          dueDate: '2025-09-23',
          priority: 'medium',
          completed: false
        },
        {
          id: '3',
          title: 'Curriculum Planning Session',
          type: 'lesson',
          dueDate: '2025-09-25',
          priority: 'medium',
          completed: false
        },
        {
          id: '4',
          title: 'Monthly Report Submission',
          type: 'deadline',
          dueDate: '2025-09-30',
          priority: 'high',
          completed: false
        }
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'assessment': return <Award className="h-4 w-4" />;
      case 'attendance': return <Users className="h-4 w-4" />;
      case 'resource': return <Library className="h-4 w-4" />;
      case 'curriculum': return <BookOpen className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'lesson': return <BookOpen className="h-4 w-4" />;
      case 'assessment': return <Award className="h-4 w-4" />;
      case 'meeting': return <Users className="h-4 w-4" />;
      case 'deadline': return <Calendar className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'overdue': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Educator Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your teaching overview.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 me-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 me-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 me-2" />
            Notifications
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Classes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeClasses}</p>
              </div>
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assessments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedAssessments}</p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resources</p>
                <p className="text-2xl font-bold text-gray-900">{stats.resourcesShared}</p>
              </div>
              <Library className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Attendance</p>
                <p className="text-2xl font-bold text-gray-900">{stats.attendanceRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-cyan-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Performance</p>
                <p className="text-2xl font-bold text-gray-900">{stats.performanceAverage}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 me-2" />
                Recent Activities
              </CardTitle>
              <CardDescription>
                Latest updates from your classes and students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                    <div className={`p-2 rounded-full ${getStatusColor(activity.status)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                    </div>
                    <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Tasks */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 me-2" />
                Upcoming Tasks
              </CardTitle>
              <CardDescription>
                Your schedule and deadlines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                    <div className="p-2 rounded-full bg-gray-100">
                      {getTaskIcon(task.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{task.title}</p>
                      <p className="text-xs text-gray-600">{task.dueDate}</p>
                    </div>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4" variant="outline">
                <Plus className="h-4 w-4 me-2" />
                Add Task
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and shortcuts for efficient teaching
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <Users className="h-6 w-6 mb-2" />
              <span className="text-xs">Take Attendance</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Award className="h-6 w-6 mb-2" />
              <span className="text-xs">Create Assessment</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <BookOpen className="h-6 w-6 mb-2" />
              <span className="text-xs">Plan Lesson</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Library className="h-6 w-6 mb-2" />
              <span className="text-xs">Add Resource</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <BarChart3 className="h-6 w-6 mb-2" />
              <span className="text-xs">View Analytics</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Calendar className="h-6 w-6 mb-2" />
              <span className="text-xs">Schedule Meeting</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* UAE Education Notice */}
      <Alert>
        <Globe className="h-4 w-4" />
        <AlertDescription>
          <strong>UAE Ministry of Education Update:</strong> New curriculum standards for the 2025-2026 academic year are now available. 
          <Button variant="link" className="p-0 h-auto ms-2">
            View Updates
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default EducatorDashboard;
