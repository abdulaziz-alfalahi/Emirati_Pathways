import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import {
  GraduationCap,
  Users,
  BookOpen,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
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
  FileText,
  Lightbulb,
  Globe,
  Briefcase
} from 'lucide-react';
import ScholarshipManagement from '@/components/educator/ScholarshipManagement';

interface EducatorData {
  students: {
    totalEnrolled: number;
    activeStudents: number;
    graduatingStudents: number;
    placementRate: number;
  };
  programs: {
    totalPrograms: number;
    activePrograms: number;
    industryPartnerships: number;
    certificationPrograms: number;
  };
  outcomes: {
    employmentRate: number;
    averageSalary: number;
    skillsMatchRate: number;
    industryReadiness: number;
  };
  research: {
    publications: number;
    ongoingProjects: number;
    grants: number;
    collaborations: number;
  };
  activity: Array<{
    id: number;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    priority?: string;
  }>;
}



const EducatorDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboardData, setDashboardData] = useState<EducatorData>({
    students: {
      totalEnrolled: 0,
      activeStudents: 0,
      graduatingStudents: 0,
      placementRate: 0
    },
    programs: {
      totalPrograms: 0,
      activePrograms: 0,
      industryPartnerships: 0,
      certificationPrograms: 0
    },
    outcomes: {
      employmentRate: 0,
      averageSalary: 0,
      skillsMatchRate: 0,
      industryReadiness: 0
    },
    research: {
      publications: 0,
      ongoingProjects: 0,
      grants: 0,
      collaborations: 0
    },
    activity: []
  });

  // Initialize with mock data
  React.useEffect(() => {
    setMockData();
  }, []);

  const setMockData = () => {
    setDashboardData({
      students: {
        totalEnrolled: 245,
        activeStudents: 198,
        graduatingStudents: 47,
        placementRate: 89
      },
      programs: {
        totalPrograms: 8,
        activePrograms: 6,
        industryPartnerships: 12,
        certificationPrograms: 4
      },
      outcomes: {
        employmentRate: 92,
        averageSalary: 85000,
        skillsMatchRate: 87,
        industryReadiness: 91
      },
      research: {
        publications: 45,
        ongoingProjects: 8,
        grants: 3,
        collaborations: 15
      },
      activity: [
        {
          id: 1,
          type: 'student_placement',
          title: 'Student Placement Success',
          description: 'Fatima Al Zahra secured position as AI Engineer at ADNOC Digital',
          timestamp: new Date().toISOString(),
          priority: 'high'
        },
        {
          id: 2,
          type: 'industry_partnership',
          title: 'New Industry Partnership',
          description: 'Signed collaboration agreement with Emirates NBD for fintech program',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          priority: 'high'
        },
        {
          id: 3,
          type: 'research_publication',
          title: 'Research Publication',
          description: 'Paper on "AI in UAE Education" accepted by IEEE Conference',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          priority: 'medium'
        },
        {
          id: 4,
          type: 'curriculum_update',
          title: 'Curriculum Enhancement',
          description: 'Updated Machine Learning course with latest industry requirements',
          timestamp: new Date(Date.now() - 259200000).toISOString(),
          priority: 'medium'
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
                  Educator Dashboard
                </h1>
                <p className="text-slate-600 font-dubai-medium">
                  Welcome back, Dr. Fatima Al Qasimi - Computer Science & AI Education
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-dubai-medium">
                  Professor
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-dubai-medium">
                  AI Specialist
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
                Create Course
              </Button>
              <Button variant="outline" className="font-dubai-medium">
                <Users className="h-4 w-4 mr-2" />
                Manage Students
              </Button>
              <Button variant="outline" className="font-dubai-medium">
                <Building className="h-4 w-4 mr-2" />
                Industry Partnerships
              </Button>
              <Button variant="outline" className="font-dubai-medium">
                <Download className="h-4 w-4 mr-2" />
                Export Reports
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 bg-white shadow-sm">
              <TabsTrigger value="overview" className="font-dubai-medium">Overview</TabsTrigger>
              <TabsTrigger value="students" className="font-dubai-medium">Students</TabsTrigger>
              <TabsTrigger value="programs" className="font-dubai-medium">Programs</TabsTrigger>
              <TabsTrigger value="research" className="font-dubai-medium">Research</TabsTrigger>
              <TabsTrigger value="outcomes" className="font-dubai-medium">Outcomes</TabsTrigger>
              <TabsTrigger value="scholarships" className="font-dubai-medium">Scholarships</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">Total Students</CardTitle>
                    <Users className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.students.totalEnrolled}</div>
                    <p className="text-xs text-green-600 font-dubai-medium">
                      {dashboardData.students.activeStudents} currently active
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">Active Programs</CardTitle>
                    <BookOpen className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.programs.activePrograms}</div>
                    <p className="text-xs text-slate-500 font-dubai-medium">
                      {dashboardData.programs.totalPrograms} total programs
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">Employment Rate</CardTitle>
                    <Briefcase className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.outcomes.employmentRate}%</div>
                    <p className="text-xs text-green-600 font-dubai-medium">
                      +3% from last year
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">Research Publications</CardTitle>
                    <FileText className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.research.publications}</div>
                    <p className="text-xs text-green-600 font-dubai-medium">
                      +8 this year
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Student Outcomes */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">Student Outcomes</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    Key performance indicators for student success
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-green-600">{dashboardData.outcomes.employmentRate}%</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">Employment Rate</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-blue-600">AED {dashboardData.outcomes.averageSalary.toLocaleString()}</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">Average Salary</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-purple-600">{dashboardData.outcomes.skillsMatchRate}%</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">Skills Match Rate</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-orange-600">{dashboardData.outcomes.industryReadiness}%</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">Industry Readiness</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Research & Industry Collaboration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="font-dubai-bold text-slate-900">Research Activity</CardTitle>
                    <CardDescription className="font-dubai-medium text-slate-600">
                      Current research projects and publications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-dubai-medium text-slate-600">Ongoing Projects</span>
                        <span className="text-lg font-dubai-bold text-slate-900">{dashboardData.research.ongoingProjects}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-dubai-medium text-slate-600">Active Grants</span>
                        <span className="text-lg font-dubai-bold text-slate-900">{dashboardData.research.grants}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-dubai-medium text-slate-600">Collaborations</span>
                        <span className="text-lg font-dubai-bold text-slate-900">{dashboardData.research.collaborations}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="font-dubai-bold text-slate-900">Industry Partnerships</CardTitle>
                    <CardDescription className="font-dubai-medium text-slate-600">
                      Active collaborations with industry partners
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-dubai-medium text-slate-600">Active Partnerships</span>
                        <span className="text-lg font-dubai-bold text-slate-900">{dashboardData.programs.industryPartnerships}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-dubai-medium text-slate-600">Certification Programs</span>
                        <span className="text-lg font-dubai-bold text-slate-900">{dashboardData.programs.certificationPrograms}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-dubai-medium text-slate-600">Placement Rate</span>
                        <span className="text-lg font-dubai-bold text-slate-900">{dashboardData.students.placementRate}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">Recent Activity</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    Latest updates from your educational activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.activity.length > 0 ? (
                      dashboardData.activity.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                          <div className="flex-shrink-0">
                            {activity.type === 'student_placement' && (
                              <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                            )}
                            {activity.type === 'industry_partnership' && (
                              <Building className="h-5 w-5 text-blue-500 mt-1" />
                            )}
                            {activity.type === 'research_publication' && (
                              <FileText className="h-5 w-5 text-purple-500 mt-1" />
                            )}
                            {activity.type === 'curriculum_update' && (
                              <BookOpen className="h-5 w-5 text-orange-500 mt-1" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-dubai-medium text-slate-900">
                                {activity.title}
                              </p>
                              {activity.priority && (
                                <Badge
                                  variant={activity.priority === 'high' ? 'destructive' : 'secondary'}
                                  className="text-xs"
                                >
                                  {activity.priority}
                                </Badge>
                              )}
                            </div>
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

            {/* Students Tab */}
            <TabsContent value="students" className="space-y-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">Student Management</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    Manage student enrollment and progress tracking
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-dubai-bold text-slate-900 mb-2">Student Management</h3>
                    <p className="text-slate-500 mb-6 font-dubai-medium">Comprehensive student tracking and progress management</p>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                      View All Students
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Programs Tab */}
            <TabsContent value="programs" className="space-y-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">Program Management</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    Manage courses, curricula, and educational programs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-dubai-bold text-slate-900 mb-2">Program Management</h3>
                    <p className="text-slate-500 mb-6 font-dubai-medium">Create and manage educational programs and curricula</p>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Program
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Research Tab */}
            <TabsContent value="research" className="space-y-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">Research & Publications</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    Manage research projects, publications, and collaborations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Lightbulb className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-dubai-bold text-slate-900 mb-2">Research Management</h3>
                    <p className="text-slate-500 mb-6 font-dubai-medium">Track research projects, publications, and academic collaborations</p>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                      View Research Portfolio
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Outcomes Tab */}
            <TabsContent value="outcomes" className="space-y-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">Student Outcomes & Analytics</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    Track student success metrics and employment outcomes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-dubai-bold text-slate-900 mb-2">Outcomes Analytics</h3>
                    <p className="text-slate-500 mb-6 font-dubai-medium">Comprehensive analytics on student success and employment outcomes</p>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                      View Analytics Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Scholarships Tab */}
            <TabsContent value="scholarships" className="space-y-6">
              <ScholarshipManagement />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default EducatorDashboard;
