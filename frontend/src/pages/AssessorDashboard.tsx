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
  ClipboardCheck, 
  Users, 
  Target, 
  TrendingUp, 
  Calendar,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  FileCheck,
  Building,
  Award,
  MessageSquare,
  Download,
  Upload,
  BarChart3,
  PieChart,
  Star,

  Settings,
  Bell,
  Plus,
  Edit,
  FileText,
  Lightbulb,
  Globe,
  Briefcase,
  BookOpen,
  Video,
  Coffee,
  UserCheck,
  AlertCircle,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

interface AssessorData {
  assessments: {
    totalAssessments: number;
    completedThisMonth: number;
    pendingReview: number;
    averageRating: number;
  };
  candidates: {
    totalCandidates: number;
    passedAssessments: number;
    failedAssessments: number;
    awaitingResults: number;
  };
  performance: {
    accuracyRate: number;
    averageCompletionTime: number;
    qualityScore: number;
    feedbackRating: number;
  };
  specializations: {
    primaryAreas: string[];
    certifications: string[];
    yearsExperience: number;
    assessmentTypes: string[];
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



const AssessorDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboardData, setDashboardData] = useState<AssessorData>({
    assessments: {
      totalAssessments: 0,
      completedThisMonth: 0,
      pendingReview: 0,
      averageRating: 0
    },
    candidates: {
      totalCandidates: 0,
      passedAssessments: 0,
      failedAssessments: 0,
      awaitingResults: 0
    },
    performance: {
      accuracyRate: 0,
      averageCompletionTime: 0,
      qualityScore: 0,
      feedbackRating: 0
    },
    specializations: {
      primaryAreas: [],
      certifications: [],
      yearsExperience: 0,
      assessmentTypes: []
    },
    activity: []
  });

  // Initialize with mock data
  React.useEffect(() => {
    setMockData();
  }, []);

  const setMockData = () => {
    setDashboardData({
      assessments: {
        totalAssessments: 1250,
        completedThisMonth: 89,
        pendingReview: 12,
        averageRating: 4.8
      },
      candidates: {
        totalCandidates: 856,
        passedAssessments: 672,
        failedAssessments: 184,
        awaitingResults: 45
      },
      performance: {
        accuracyRate: 96,
        averageCompletionTime: 45,
        qualityScore: 4.7,
        feedbackRating: 4.8
      },
      specializations: {
        primaryAreas: ['Software Development', 'Project Management', 'Communication Skills', 'Technical Writing'],
        certifications: ['Certified Professional Assessor', 'Technical Skills Evaluator', 'Soft Skills Assessment'],
        yearsExperience: 8,
        assessmentTypes: ['Technical Skills', 'Soft Skills', 'Leadership', 'Communication']
      },
      activity: [
        {
          id: 1,
          type: 'assessment_completed',
          title: 'Assessment Completed',
          description: 'Technical assessment for Senior Developer position at ADNOC Digital',
          timestamp: new Date().toISOString(),
          priority: 'high'
        },
        {
          id: 2,
          type: 'candidate_passed',
          title: 'Candidate Assessment Passed',
          description: 'Ahmed Al Emirati successfully passed blockchain development assessment',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          priority: 'medium'
        },
        {
          id: 3,
          type: 'quality_review',
          title: 'Quality Review Completed',
          description: 'Peer review completed for communication skills assessment framework',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          priority: 'medium'
        },
        {
          id: 4,
          type: 'new_assignment',
          title: 'New Assessment Assignment',
          description: 'Assigned to evaluate leadership skills for Emirates NBD management role',
          timestamp: new Date(Date.now() - 259200000).toISOString(),
          priority: 'high'
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
                  Assessor Dashboard
                </h1>
                <p className="text-slate-600 font-dubai-medium">
                  Welcome back, Mariam Al Nuaimi - Certified Skills Assessment Specialist
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-dubai-medium">
                  Certified Assessor
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-dubai-medium">
                  Skills Expert
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
                <ClipboardCheck className="h-4 w-4 mr-2" />
                New Assessment
              </Button>
              <Button variant="outline" className="font-dubai-medium">
                <Users className="h-4 w-4 mr-2" />
                View Candidates
              </Button>
              <Button variant="outline" className="font-dubai-medium">
                <FileCheck className="h-4 w-4 mr-2" />
                Review Results
              </Button>
              <Button variant="outline" className="font-dubai-medium">
                <Download className="h-4 w-4 mr-2" />
                Export Reports
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm">
              <TabsTrigger value="overview" className="font-dubai-medium">Overview</TabsTrigger>
              <TabsTrigger value="assessments" className="font-dubai-medium">Assessments</TabsTrigger>
              <TabsTrigger value="candidates" className="font-dubai-medium">Candidates</TabsTrigger>
              <TabsTrigger value="performance" className="font-dubai-medium">Performance</TabsTrigger>
              <TabsTrigger value="tools" className="font-dubai-medium">Tools</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">Total Assessments</CardTitle>
                    <ClipboardCheck className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.assessments.totalAssessments}</div>
                    <p className="text-xs text-green-600 font-dubai-medium">
                      {dashboardData.assessments.completedThisMonth} this month
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">Pending Reviews</CardTitle>
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.assessments.pendingReview}</div>
                    <p className="text-xs text-orange-600 font-dubai-medium">
                      Require immediate attention
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">Accuracy Rate</CardTitle>
                    <Target className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.performance.accuracyRate}%</div>
                    <p className="text-xs text-green-600 font-dubai-medium">
                      Above industry standard
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">Quality Rating</CardTitle>
                    <Star className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.performance.qualityScore}</div>
                    <div className="flex mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`h-3 w-3 ${star <= dashboardData.performance.qualityScore ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Assessment Results Overview */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">Assessment Results Overview</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    Summary of candidate assessment outcomes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-blue-600">{dashboardData.candidates.totalCandidates}</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">Total Candidates</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-green-600">{dashboardData.candidates.passedAssessments}</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">Passed Assessments</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-red-600">{dashboardData.candidates.failedAssessments}</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">Failed Assessments</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-yellow-600">{dashboardData.candidates.awaitingResults}</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">Awaiting Results</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="font-dubai-bold text-slate-900">Assessment Performance</CardTitle>
                    <CardDescription className="font-dubai-medium text-slate-600">
                      Your assessment quality and efficiency metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-dubai-medium text-slate-600">Average Completion Time</span>
                        <span className="text-lg font-dubai-bold text-slate-900">{dashboardData.performance.averageCompletionTime} min</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-dubai-medium text-slate-600">Feedback Rating</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-dubai-bold text-slate-900">{dashboardData.performance.feedbackRating}</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`h-4 w-4 ${star <= dashboardData.performance.feedbackRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-dubai-medium text-slate-600">Years of Experience</span>
                        <span className="text-lg font-dubai-bold text-slate-900">{dashboardData.specializations.yearsExperience}+</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="font-dubai-bold text-slate-900">Specialization Areas</CardTitle>
                    <CardDescription className="font-dubai-medium text-slate-600">
                      Your primary assessment specializations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardData.specializations.primaryAreas.map((area, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                          <span className="text-sm font-dubai-medium text-slate-700">{area}</span>
                          <Badge variant="secondary" className="text-xs">Expert</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">Recent Activity</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    Latest updates from your assessment activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.activity.length > 0 ? (
                      dashboardData.activity.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                          <div className="flex-shrink-0">
                            {activity.type === 'assessment_completed' && (
                              <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                            )}
                            {activity.type === 'candidate_passed' && (
                              <ThumbsUp className="h-5 w-5 text-blue-500 mt-1" />
                            )}
                            {activity.type === 'quality_review' && (
                              <FileCheck className="h-5 w-5 text-purple-500 mt-1" />
                            )}
                            {activity.type === 'new_assignment' && (
                              <ClipboardCheck className="h-5 w-5 text-orange-500 mt-1" />
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

            {/* Assessments Tab */}
            <TabsContent value="assessments" className="space-y-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">Assessment Management</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    Create and manage skill assessments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <ClipboardCheck className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-dubai-bold text-slate-900 mb-2">Assessment Management</h3>
                    <p className="text-slate-500 mb-6 font-dubai-medium">Create, conduct, and manage comprehensive skill assessments</p>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Assessment
                    </Button>
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
                    Track and manage candidate assessments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-dubai-bold text-slate-900 mb-2">Candidate Management</h3>
                    <p className="text-slate-500 mb-6 font-dubai-medium">Track candidate progress and assessment results</p>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                      View All Candidates
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">Performance Analytics</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    Detailed performance metrics and insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-dubai-bold text-slate-900 mb-2">Performance Analytics</h3>
                    <p className="text-slate-500 mb-6 font-dubai-medium">Comprehensive analytics on assessment quality and efficiency</p>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                      View Analytics Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tools Tab */}
            <TabsContent value="tools" className="space-y-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">Assessment Tools & Resources</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    Access assessment frameworks and evaluation tools
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-dubai-bold text-slate-900 mb-2">Assessment Tools</h3>
                    <p className="text-slate-500 mb-6 font-dubai-medium">Access evaluation frameworks, rubrics, and assessment templates</p>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                      Browse Tools Library
                    </Button>
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

export default AssessorDashboard;
