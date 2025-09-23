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
  UserCheck, 
  Users, 
  Target, 
  TrendingUp, 
  Calendar,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  Heart,
  Building,
  Award,
  MessageSquare,
  Download,
  Upload,
  BarChart3,
  PieChart,
  Star,
  RotateCcw,
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
  Coffee
} from 'lucide-react';

interface MentorData {
  mentees: {
    totalMentees: number;
    activeMentees: number;
    successfulPlacements: number;
    averageSessionRating: number;
  };
  sessions: {
    totalSessions: number;
    thisMonth: number;
    upcomingSessions: number;
    completedGoals: number;
  };
  impact: {
    careerAdvancement: number;
    skillImprovement: number;
    networkGrowth: number;
    confidenceBoost: number;
  };
  expertise: {
    primaryAreas: string[];
    yearsExperience: number;
    industryConnections: number;
    successStories: number;
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

// Role Switcher Button Component
const RoleSwitcherButton = () => {
  const handleRoleSwitch = () => {
    console.log('🔄 Switching to role selector from Mentor Dashboard');
    
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

const MentorDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboardData, setDashboardData] = useState<MentorData>({
    mentees: {
      totalMentees: 0,
      activeMentees: 0,
      successfulPlacements: 0,
      averageSessionRating: 0
    },
    sessions: {
      totalSessions: 0,
      thisMonth: 0,
      upcomingSessions: 0,
      completedGoals: 0
    },
    impact: {
      careerAdvancement: 0,
      skillImprovement: 0,
      networkGrowth: 0,
      confidenceBoost: 0
    },
    expertise: {
      primaryAreas: [],
      yearsExperience: 0,
      industryConnections: 0,
      successStories: 0
    },
    activity: []
  });

  // Initialize with mock data
  React.useEffect(() => {
    setMockData();
  }, []);

  const setMockData = () => {
    setDashboardData({
      mentees: {
        totalMentees: 28,
        activeMentees: 18,
        successfulPlacements: 15,
        averageSessionRating: 4.8
      },
      sessions: {
        totalSessions: 156,
        thisMonth: 24,
        upcomingSessions: 8,
        completedGoals: 42
      },
      impact: {
        careerAdvancement: 89,
        skillImprovement: 94,
        networkGrowth: 76,
        confidenceBoost: 92
      },
      expertise: {
        primaryAreas: ['Technology Leadership', 'Fintech Innovation', 'Career Development', 'Digital Transformation'],
        yearsExperience: 15,
        industryConnections: 250,
        successStories: 15
      },
      activity: [
        {
          id: 1,
          type: 'mentee_success',
          title: 'Mentee Career Advancement',
          description: 'Sara Al Mansoori promoted to Senior Product Manager at Careem',
          timestamp: new Date().toISOString(),
          priority: 'high'
        },
        {
          id: 2,
          type: 'session_completed',
          title: 'Mentoring Session Completed',
          description: 'Career planning session with Ahmed focusing on leadership skills',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          priority: 'medium'
        },
        {
          id: 3,
          type: 'goal_achieved',
          title: 'Goal Achievement',
          description: 'Mentee completed blockchain certification program',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          priority: 'medium'
        },
        {
          id: 4,
          type: 'new_mentee',
          title: 'New Mentee Onboarded',
          description: 'Started mentoring relationship with Fatima Al Zahra',
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
      
      {/* Role Switcher Button */}
      <RoleSwitcherButton />
      
      {/* Main Content */}
      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-dubai-bold text-slate-900 mb-2">
                  Mentor Dashboard
                </h1>
                <p className="text-slate-600 font-dubai-medium">
                  Welcome back, Khalid Waleed - Technology Leadership Mentor
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-dubai-medium">
                  Senior Mentor
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-dubai-medium">
                  Tech Leader
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
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Session
              </Button>
              <Button variant="outline" className="font-dubai-medium">
                <Users className="h-4 w-4 mr-2" />
                View Mentees
              </Button>
              <Button variant="outline" className="font-dubai-medium">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
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
              <TabsTrigger value="mentees" className="font-dubai-medium">Mentees</TabsTrigger>
              <TabsTrigger value="sessions" className="font-dubai-medium">Sessions</TabsTrigger>
              <TabsTrigger value="impact" className="font-dubai-medium">Impact</TabsTrigger>
              <TabsTrigger value="resources" className="font-dubai-medium">Resources</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">Active Mentees</CardTitle>
                    <Users className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.mentees.activeMentees}</div>
                    <p className="text-xs text-slate-500 font-dubai-medium">
                      {dashboardData.mentees.totalMentees} total mentees
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">Sessions This Month</CardTitle>
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.sessions.thisMonth}</div>
                    <p className="text-xs text-green-600 font-dubai-medium">
                      {dashboardData.sessions.upcomingSessions} upcoming
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">Success Stories</CardTitle>
                    <Award className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.expertise.successStories}</div>
                    <p className="text-xs text-green-600 font-dubai-medium">
                      Career advancements achieved
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">Session Rating</CardTitle>
                    <Star className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.mentees.averageSessionRating}</div>
                    <div className="flex mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`h-3 w-3 ${star <= dashboardData.mentees.averageSessionRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Mentoring Impact */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">Mentoring Impact</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    Positive outcomes achieved through your mentoring
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-green-600">{dashboardData.impact.careerAdvancement}%</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">Career Advancement</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-blue-600">{dashboardData.impact.skillImprovement}%</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">Skill Improvement</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-purple-600">{dashboardData.impact.networkGrowth}%</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">Network Growth</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-orange-600">{dashboardData.impact.confidenceBoost}%</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">Confidence Boost</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Expertise & Experience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="font-dubai-bold text-slate-900">Expertise Areas</CardTitle>
                    <CardDescription className="font-dubai-medium text-slate-600">
                      Your primary mentoring specializations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardData.expertise.primaryAreas.map((area, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                          <span className="text-sm font-dubai-medium text-slate-700">{area}</span>
                          <Badge variant="secondary" className="text-xs">Expert</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="font-dubai-bold text-slate-900">Professional Profile</CardTitle>
                    <CardDescription className="font-dubai-medium text-slate-600">
                      Your mentoring credentials and experience
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-dubai-medium text-slate-600">Years of Experience</span>
                        <span className="text-lg font-dubai-bold text-slate-900">{dashboardData.expertise.yearsExperience}+</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-dubai-medium text-slate-600">Industry Connections</span>
                        <span className="text-lg font-dubai-bold text-slate-900">{dashboardData.expertise.industryConnections}+</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-dubai-medium text-slate-600">Completed Goals</span>
                        <span className="text-lg font-dubai-bold text-slate-900">{dashboardData.sessions.completedGoals}</span>
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
                    Latest updates from your mentoring activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.activity.length > 0 ? (
                      dashboardData.activity.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                          <div className="flex-shrink-0">
                            {activity.type === 'mentee_success' && (
                              <Award className="h-5 w-5 text-green-500 mt-1" />
                            )}
                            {activity.type === 'session_completed' && (
                              <CheckCircle className="h-5 w-5 text-blue-500 mt-1" />
                            )}
                            {activity.type === 'goal_achieved' && (
                              <Target className="h-5 w-5 text-purple-500 mt-1" />
                            )}
                            {activity.type === 'new_mentee' && (
                              <UserCheck className="h-5 w-5 text-orange-500 mt-1" />
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

            {/* Mentees Tab */}
            <TabsContent value="mentees" className="space-y-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">Mentee Management</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    Manage your current and past mentees
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-dubai-bold text-slate-900 mb-2">Mentee Management</h3>
                    <p className="text-slate-500 mb-6 font-dubai-medium">Track progress and manage relationships with your mentees</p>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                      View All Mentees
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sessions Tab */}
            <TabsContent value="sessions" className="space-y-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">Session Management</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    Schedule and manage mentoring sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-dubai-bold text-slate-900 mb-2">Session Management</h3>
                    <p className="text-slate-500 mb-6 font-dubai-medium">Schedule, conduct, and track mentoring sessions</p>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule New Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Impact Tab */}
            <TabsContent value="impact" className="space-y-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">Impact Analytics</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    Measure and track your mentoring impact
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-dubai-bold text-slate-900 mb-2">Impact Analytics</h3>
                    <p className="text-slate-500 mb-6 font-dubai-medium">Comprehensive analytics on your mentoring impact and success stories</p>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                      View Impact Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Resources Tab */}
            <TabsContent value="resources" className="space-y-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">Mentoring Resources</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    Access tools and resources for effective mentoring
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-dubai-bold text-slate-900 mb-2">Resource Library</h3>
                    <p className="text-slate-500 mb-6 font-dubai-medium">Access mentoring guides, templates, and best practices</p>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                      Browse Resources
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

export default MentorDashboard;
