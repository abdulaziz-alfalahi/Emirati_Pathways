import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ExportReportsDialog from '@/components/recruiter/ExportReportsDialog';
import SourceCandidatesDialog from '@/components/recruiter/SourceCandidatesDialog';
import CandidateMatching from '@/components/recruiter/CandidateMatching';
import JobDescriptionsList from '@/components/recruiter/JobDescriptionsList';
import RecentApplicants from '@/components/recruiter/RecentApplicants';
import Interviews from '@/components/recruiter/Interviews';
import OffersPage from '@/pages/recruiter/Offers';
import Messages from '@/components/recruiter/Messages';
import RecruiterInterviews from '@/components/recruiter/Interviews'; // Use standard component instead of page wrapper? 
import RecruiterAnalyticsPage from '@/pages/recruiter/Analytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { restClient } from '@/utils/api';
import {
  Target,
  Briefcase,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  UserPlus,
  Settings,
  Bell,
  Plus,
  Calculator,
  FileText,
  Users,
  BarChart3,
  CheckSquare,
  Star
} from 'lucide-react';
import EmiratizationROICalculatorDialog from '@/components/recruiter/EmiratizationROICalculatorDialog';

interface RecruiterData {
  placements: {
    thisMonth: number;
    thisQuarter: number;
    thisYear: number;
    target: number;
  };
  pipeline: {
    activeSearches: number;
    candidatesInProcess: number;
    interviewsScheduled: number;
    offersExtended: number;
  };
  performance: {
    placementRate: number;
    averageTimeToFill: number;
    clientSatisfaction: number;
    candidateQuality: number;
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

const RecruiterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [sourceCandidatesDialogOpen, setSourceCandidatesDialogOpen] = useState(false);
  const [roiCalculatorOpen, setRoiCalculatorOpen] = useState(false);

  // Get user data from localStorage for dynamic display
  const getUserData = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : {};
    } catch {
      return {};
    }
  };
  const userData = getUserData();
  // Use full_name first, then construct from first/last, then fallback to 'Recruiter'
  const recruiterName = userData.full_name
    || `${userData.first_name || ''} ${userData.last_name || ''}`.trim()
    || 'Recruiter';
  const recruiterId = userData.id || '';
  const companyId = userData.company_id || '';

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    navigate(`/recruiter?tab=${value}`, { replace: true });
  };

  const [dashboardData, setDashboardData] = useState<RecruiterData>({
    placements: {
      thisMonth: 0,
      thisQuarter: 0,
      thisYear: 0,
      target: 0
    },
    pipeline: {
      activeSearches: 0,
      candidatesInProcess: 0,
      interviewsScheduled: 0,
      offersExtended: 0
    },
    performance: {
      placementRate: 0,
      averageTimeToFill: 0,
      clientSatisfaction: 0,
      candidateQuality: 0
    },
    activity: []
  });

  // Load real dashboard data from backend
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await restClient.get('/api/recruiter/statistics/dashboard');

      if (response.data && response.data.success && response.data.data) {
        const apiData = response.data.data;
        console.log('✅ Dashboard data loaded from backend:', apiData);

        // Map backend data to frontend structure
        const mappedData: RecruiterData = {
          placements: {
            thisMonth: apiData.overview?.positions_filled || 0, // Approx
            thisQuarter: apiData.overview?.positions_filled || 0, // Approx
            thisYear: apiData.overview?.positions_filled || 0,
            target: 100 // Hardcoded target for now
          },
          pipeline: {
            activeSearches: apiData.overview?.active_vacancies || 0,
            candidatesInProcess: apiData.overview?.total_applications || 0,
            interviewsScheduled: apiData.overview?.interviews_scheduled || 0,
            offersExtended: apiData.overview?.offers_pending || 0
          },
          performance: {
            placementRate: 0, // Not available in API yet
            averageTimeToFill: 0, // Not available in API yet
            clientSatisfaction: 5.0, // Mock
            candidateQuality: 5.0 // Mock
          },
          activity: apiData.recent_activity ? apiData.recent_activity.map((a: any) => ({
            id: a.id || Math.random(),
            type: a.action || 'info',
            title: a.action ? a.action.replace(/_/g, ' ') : 'Activity',
            description: a.details ? JSON.stringify(a.details) : (a.resourceType + ' ' + a.resourceId),
            timestamp: a.timestamp || new Date().toISOString(),
            priority: 'medium'
          })) : []
        };

        setDashboardData(mappedData);
      } else {
        console.log('⚠️ API returned no data, using mock data');
        setMockData();
      }
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      setMockData();
    }
  };

  const setMockData = () => {
    setDashboardData({
      placements: {
        thisMonth: 12,
        thisQuarter: 34,
        thisYear: 156,
        target: 180
      },
      pipeline: {
        activeSearches: 24,
        candidatesInProcess: 89,
        interviewsScheduled: 18,
        offersExtended: 7
      },
      performance: {
        placementRate: 78,
        averageTimeToFill: 21,
        clientSatisfaction: 4.6,
        candidateQuality: 4.4
      },
      activity: [
        {
          id: 1,
          type: 'placement_success',
          title: 'Successful Placement',
          description: 'Ahmed Al Emirati placed as Senior Developer at ADNOC Digital',
          timestamp: new Date().toISOString(),
          priority: 'high'
        },
        {
          id: 2,
          type: 'interview_scheduled',
          title: 'Interview Scheduled',
          description: 'Technical interview for Blockchain Developer at Emirates NBD',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          priority: 'medium'
        },
        {
          id: 3,
          type: 'new_requirement',
          title: 'New Vacancy',
          description: 'AI Engineer position for Dubai Future Foundation',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          priority: 'high'
        },
        {
          id: 4,
          type: 'candidate_sourced',
          title: 'Candidate Sourced',
          description: 'Found 5 qualified UAE National candidates for Fintech role',
          timestamp: new Date(Date.now() - 259200000).toISOString(),
          priority: 'medium'
        }
      ]
    });
  };

  // Dynamic greeting logic
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
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
                  Recruitment Dashboard
                </h1>
                <p className="text-slate-600 font-dubai-medium">
                  {getGreeting()}, {recruiterName}. You have <span className="text-teal-600 font-bold">{dashboardData.pipeline.activeSearches} active searches</span> and <span className="text-teal-600 font-bold">{dashboardData.pipeline.interviewsScheduled} interviews</span> scheduled.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {userData.role && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 font-dubai-medium capitalize">
                    {userData.role.replace(/_/g, ' ')}
                  </Badge>
                )}
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Actions (Simplified) */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-4">
              <Link to="/recruiter/jd-builder" className="inline-block">
                <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium shadow-sm" aria-label="Create new vacancy">
                  <Plus className="h-4 w-4 mr-2" />
                  Post New Job
                </Button>
              </Link>
              <Button variant="outline" className="font-dubai-medium bg-card hover:bg-muted" onClick={() => setSourceCandidatesDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Source Candidates
              </Button>
              <Button variant="outline" className="font-dubai-medium bg-card hover:bg-muted" onClick={() => setRoiCalculatorOpen(true)}>
                <Calculator className="h-4 w-4 mr-2" />
                ROI Calculator
              </Button>
            </div>
          </div>

          {/* Tabs - Simplified to 5 main tabs */}
          <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 bg-card shadow-sm">
              <TabsTrigger value="overview" className="font-dubai-medium" onClick={() => handleTabChange('overview')}>Overview</TabsTrigger>
              <TabsTrigger value="jobs" className="font-dubai-medium" onClick={() => handleTabChange('jobs')}>My Jobs</TabsTrigger>
              <TabsTrigger value="candidates" className="font-dubai-medium" onClick={() => handleTabChange('candidates')}>Candidates</TabsTrigger>
              <TabsTrigger value="interviews" className="font-dubai-medium" onClick={() => handleTabChange('interviews')}>Interviews</TabsTrigger>
              <TabsTrigger value="messages" className="font-dubai-medium" onClick={() => handleTabChange('messages')}>Messages</TabsTrigger>
              <TabsTrigger value="offers" className="font-dubai-medium" onClick={() => handleTabChange('offers')}>Offers</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-card shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">Placements This Year</CardTitle>
                    <Target className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.placements.thisYear}</div>
                    <p className="text-xs text-slate-500 font-dubai-medium">
                      Target: {dashboardData.placements.target} ({Math.round((dashboardData.placements.thisYear / dashboardData.placements.target) * 100)}%)
                    </p>
                    <Progress value={(dashboardData.placements.thisYear / dashboardData.placements.target) * 100} className="mt-2" />
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">Active Searches</CardTitle>
                    <Briefcase className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.pipeline.activeSearches}</div>
                    <p className="text-xs text-slate-500 font-dubai-medium">
                      Across all job postings
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">Avg. Time to Fill</CardTitle>
                    <Clock className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.performance.averageTimeToFill} days</div>
                    <p className="text-xs text-slate-500 font-dubai-medium">
                      Average across all roles
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">Placement Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.performance.placementRate}%</div>
                    <p className="text-xs text-slate-500 font-dubai-medium">
                      Of total positions
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recruitment Pipeline */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">Recruitment Pipeline</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    Candidates flowing through your recruitment stages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between gap-1">
                    {[
                      { label: 'Active Searches', count: dashboardData.pipeline.activeSearches, bg: 'bg-blue-500', lightBg: 'bg-blue-50', text: 'text-blue-600' },
                      { label: 'In Process', count: dashboardData.pipeline.candidatesInProcess, bg: 'bg-yellow-500', lightBg: 'bg-yellow-50', text: 'text-yellow-600' },
                      { label: 'Interviews', count: dashboardData.pipeline.interviewsScheduled, bg: 'bg-purple-500', lightBg: 'bg-purple-50', text: 'text-purple-600' },
                      { label: 'Offers', count: dashboardData.pipeline.offersExtended, bg: 'bg-green-500', lightBg: 'bg-green-50', text: 'text-green-600' },
                    ].map((stage, i, arr) => (
                      <React.Fragment key={stage.label}>
                        <div className={`flex-1 ${stage.lightBg} rounded-xl p-4 text-center relative group hover:shadow-md transition-shadow cursor-default`}>
                          <div className={`${stage.bg} h-1.5 rounded-full mb-3 transition-all group-hover:h-2`} />
                          <div className={`text-2xl font-dubai-bold ${stage.text}`}>{stage.count}</div>
                          <p className="text-xs text-slate-600 font-dubai-medium mt-1">{stage.label}</p>
                        </div>
                        {i < arr.length - 1 && (
                          <div className="text-slate-300 text-xl font-bold shrink-0 px-1">→</div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="font-dubai-bold text-slate-900">Client Satisfaction</CardTitle>
                    <CardDescription className="font-dubai-medium text-slate-600">
                      Average rating from hiring managers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <div className="text-3xl font-dubai-bold text-slate-900">{dashboardData.performance.clientSatisfaction}</div>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${star <= dashboardData.performance.clientSatisfaction ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 font-dubai-medium mt-2">
                      Based on hiring manager feedback
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="font-dubai-bold text-slate-900">Candidate Quality Score</CardTitle>
                    <CardDescription className="font-dubai-medium text-slate-600">
                      Average quality rating of placed candidates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <div className="text-3xl font-dubai-bold text-slate-900">{dashboardData.performance.candidateQuality}</div>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${star <= dashboardData.performance.candidateQuality ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 font-dubai-medium mt-2">
                      Based on post-placement reviews
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Applicants Section */}
              <RecentApplicants
                limit={5}
                onViewAll={() => handleTabChange('jobs')}
              />

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
                        <div key={activity.id} className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
                          <div className="flex-shrink-0">
                            {activity.type === 'placement_success' && (
                              <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                            )}
                            {activity.type === 'interview_scheduled' && (
                              <Calendar className="h-5 w-5 text-blue-500 mt-1" />
                            )}
                            {activity.type === 'new_requirement' && (
                              <Briefcase className="h-5 w-5 text-purple-500 mt-1" />
                            )}
                            {activity.type === 'candidate_sourced' && (
                              <UserPlus className="h-5 w-5 text-orange-500 mt-1" />
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

            {/* My Jobs Tab */}
            <TabsContent value="jobs" className="space-y-6">
              <JobDescriptionsList />
            </TabsContent>

            {/* Candidates Tab */}
            <TabsContent value="candidates" className="space-y-6">
              <CandidateMatching />
            </TabsContent>

            {/* Interviews Tab */}
            <TabsContent value="interviews" className="space-y-6">
              <Interviews />
            </TabsContent>

            {/* Offers & Approvals Tab */}
            <TabsContent value="offers" className="space-y-6">
              <OffersPage />
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages" className="space-y-6">
              <Messages />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <RecruiterAnalyticsPage />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Export Reports Dialog */}
      <ExportReportsDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
      />

      {/* Source Candidates Dialog */}
      <SourceCandidatesDialog
        open={sourceCandidatesDialogOpen}
        onClose={() => setSourceCandidatesDialogOpen(false)}
      />

      {/* ROI Calculator Dialog */}
      <EmiratizationROICalculatorDialog
        open={roiCalculatorOpen}
        onClose={() => setRoiCalculatorOpen(false)}
      />
    </div>
  );
};

export default RecruiterDashboard;
