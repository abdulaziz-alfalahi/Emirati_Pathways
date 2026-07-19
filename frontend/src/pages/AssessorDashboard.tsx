import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import Messages from '@/components/recruiter/Messages';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { restClient } from '@/utils/api';
import { getDisplayName } from '@/utils/nameUtils';
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
  Languages,
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
  ThumbsDown,
  Loader2
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
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  const { language, toggleLanguage } = useLanguage();
  // Resolve the logged-in user's name from localStorage (no hardcoded identity)
  const getUserData = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : {};
    } catch {
      return {};
    }
  };
  const userData = getUserData();
  const rawName = getDisplayName(userData, '');
  const assessorName = (rawName && rawName !== 'None None' && rawName !== 'None') ? rawName : t('Assessor', 'المُقيّم');
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

  // Fetch from API. On error, show an honest-empty state (no fabricated data).
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // restClient injects the Authorization bearer token + CSRF header and
        // sends credentials, so the protected endpoint is called authenticated.
        const res = await restClient.get('/api/assessor/dashboard');
        const data = res.data || {};
        setDashboardData({
          assessments: data.assessments || dashboardData.assessments,
          candidates: data.candidates || dashboardData.candidates,
          performance: data.performance || dashboardData.performance,
          specializations: data.specializations || dashboardData.specializations,
          activity: data.activity || [],
        });
      } catch (error) {
        console.error('Error loading assessor dashboard:', error);
        // Honest-empty fallback: zeros and empty lists so the assessor sees
        // "unavailable"/empty states instead of fabricated numbers.
        setDashboardData({
          assessments: { totalAssessments: 0, completedThisMonth: 0, pendingReview: 0, averageRating: 0 },
          candidates: { totalCandidates: 0, passedAssessments: 0, failedAssessments: 0, awaitingResults: 0 },
          performance: { accuracyRate: 0, averageCompletionTime: 0, qualityScore: 0, feedbackRating: 0 },
          specializations: {
            primaryAreas: [],
            certifications: [],
            yearsExperience: 0,
            assessmentTypes: [],
          },
          activity: [],
        });
      }
    };
    fetchData();
  }, []);

  // State variables for candidates/applications
  const [applications, setApplications] = useState<any[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [schedulingApp, setSchedulingApp] = useState<any | null>(null);
  const [gradingApp, setGradingApp] = useState<any | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [gradeScore, setGradeScore] = useState(80);
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadApplications = async () => {
    setAppsLoading(true);
    setActionError(null);
    try {
      const res = await restClient.get('/api/assessor/applications');
      if (res.data?.success) {
        setApplications(res.data.applications || []);
      } else {
        setActionError(res.data?.message || "Failed to fetch applications");
      }
    } catch (err: any) {
      console.error("Error loading assessor applications:", err);
      setActionError(err.response?.data?.message || err.message || "Failed to fetch applications");
    } finally {
      setAppsLoading(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'candidates') {
      loadApplications();
    }
  }, [activeTab]);

  const handleSchedule = async (appId: string) => {
    if (!scheduledDate) return;
    try {
      setActionError(null);
      setActionSuccess(null);
      const res = await restClient.put(`/api/assessor/applications/${appId}/schedule`, {
        scheduled_at: new Date(scheduledDate).toISOString()
      });
      if (res.data?.success) {
        setActionSuccess(t("Candidate scheduled successfully!", "تم جدولة المرشح بنجاح!"));
        setSchedulingApp(null);
        setScheduledDate('');
        loadApplications();
      } else {
        setActionError(res.data?.message || "Failed to schedule candidate");
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || "Failed to schedule candidate");
    }
  };

  const handleComplete = async (appId: string) => {
    try {
      setActionError(null);
      setActionSuccess(null);
      const skillsArray = skillsInput
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const res = await restClient.post(`/api/assessor/applications/${appId}/complete`, {
        score: gradeScore,
        feedback: gradeFeedback,
        skills_to_verify: skillsArray
      });
      if (res.data?.success) {
        setActionSuccess(t("Evaluation completed and skills synced to portfolio!", "تم إكمال التقييم ومزامنة المهارات مع المحفظة!"));
        setGradingApp(null);
        setGradeFeedback('');
        setSkillsInput('');
        setGradeScore(80);
        loadApplications();
      } else {
        setActionError(res.data?.message || "Failed to complete evaluation");
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || "Failed to complete evaluation");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 font-dubai" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Navigation */}
      <HybridGovernmentNavFixed showAuthButtons={true} onLanguageToggle={toggleLanguage} currentLanguage={language} />



      {/* Main Content */}
      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-dubai-bold text-slate-900 mb-2">
                  {t('Assessor Dashboard', 'لوحة تحكم المُقيّم')}
                </h1>
                <p className="text-slate-600 font-dubai-medium">
                  {t('Welcome back', 'مرحباً بعودتك')}, {assessorName} - {t('Certified Skills Assessment Specialist', 'أخصائي تقييم المهارات المعتمد')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-dubai-medium">
                  {t('Certified Assessor', 'مُقيّم معتمد')}
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-dubai-medium">
                  {t('Skills Expert', 'خبير مهارات')}
                </Badge>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 me-2" />
                  {t('Settings', 'الإعدادات')}
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-4">
              <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                <ClipboardCheck className="h-4 w-4 me-2" />
                {t('New Assessment', 'تقييم جديد')}
              </Button>
              <Button variant="outline" className="font-dubai-medium">
                <Users className="h-4 w-4 me-2" />
                {t('View Candidates', 'عرض المرشحين')}
              </Button>
              <Button variant="outline" className="font-dubai-medium">
                <FileCheck className="h-4 w-4 me-2" />
                {t('Review Results', 'مراجعة النتائج')}
              </Button>
              <Button variant="outline" className="font-dubai-medium">
                <Download className="h-4 w-4 me-2" />
                {t('Export Reports', 'تصدير التقارير')}
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 bg-white shadow-sm">
              <TabsTrigger value="overview" className="font-dubai-medium">{t('Overview', 'نظرة عامة')}</TabsTrigger>
              <TabsTrigger value="assessments" className="font-dubai-medium">{t('Assessments', 'التقييمات')}</TabsTrigger>
              <TabsTrigger value="candidates" className="font-dubai-medium">{t('Candidates', 'المرشحين')}</TabsTrigger>
              <TabsTrigger value="performance" className="font-dubai-medium">{t('Performance', 'الأداء')}</TabsTrigger>
              <TabsTrigger value="tools" className="font-dubai-medium">{t('Tools', 'الأدوات')}</TabsTrigger>
              <TabsTrigger value="messages" className="font-dubai-medium">
                <MessageSquare className="h-4 w-4 me-1" />
                {t('Messages', 'الرسائل')}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">{t('Total Assessments', 'إجمالي التقييمات')}</CardTitle>
                    <ClipboardCheck className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.assessments.totalAssessments}</div>
                    <p className="text-xs text-green-600 font-dubai-medium">
                      {dashboardData.assessments.completedThisMonth} {t('this month', 'هذا الشهر')}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">{t('Pending Reviews', 'المراجعات المعلقة')}</CardTitle>
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.assessments.pendingReview}</div>
                    <p className="text-xs text-orange-600 font-dubai-medium">
                      {t('Require immediate attention', 'تتطلب اهتماماً فورياً')}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">{t('Accuracy Rate', 'نسبة الدقة')}</CardTitle>
                    <Target className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.performance.accuracyRate}%</div>
                    <p className="text-xs text-green-600 font-dubai-medium">
                      {t('Above industry standard', 'أعلى من المعيار الصناعي')}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">{t('Quality Rating', 'تقييم الجودة')}</CardTitle>
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
                  <CardTitle className="font-dubai-bold text-slate-900">{t('Assessment Results Overview', 'نظرة عامة على نتائج التقييم')}</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    {t('Summary of candidate assessment outcomes', 'ملخص نتائج تقييم المرشحين')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-blue-600">{dashboardData.candidates.totalCandidates}</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">{t('Total Candidates', 'إجمالي المرشحين')}</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-green-600">{dashboardData.candidates.passedAssessments}</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">{t('Passed Assessments', 'اجتازوا التقييم')}</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-red-600">{dashboardData.candidates.failedAssessments}</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">{t('Failed Assessments', 'لم يجتازوا التقييم')}</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-yellow-600">{dashboardData.candidates.awaitingResults}</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">{t('Awaiting Results', 'بانتظار النتائج')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="font-dubai-bold text-slate-900">{t('Assessment Performance', 'أداء التقييم')}</CardTitle>
                    <CardDescription className="font-dubai-medium text-slate-600">
                      {t('Your assessment quality and efficiency metrics', 'مقاييس جودة وكفاءة تقييماتك')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-dubai-medium text-slate-600">{t('Average Completion Time', 'متوسط وقت الإنجاز')}</span>
                        <span className="text-lg font-dubai-bold text-slate-900">{dashboardData.performance.averageCompletionTime} {t('min', 'دقيقة')}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-dubai-medium text-slate-600">{t('Feedback Rating', 'تقييم التغذية الراجعة')}</span>
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
                        <span className="text-sm font-dubai-medium text-slate-600">{t('Years of Experience', 'سنوات الخبرة')}</span>
                        <span className="text-lg font-dubai-bold text-slate-900">{dashboardData.specializations.yearsExperience}+</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="font-dubai-bold text-slate-900">{t('Specialization Areas', 'مجالات التخصص')}</CardTitle>
                    <CardDescription className="font-dubai-medium text-slate-600">
                      {t('Your primary assessment specializations', 'تخصصاتك الأساسية في التقييم')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardData.specializations.primaryAreas.map((area, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                          <span className="text-sm font-dubai-medium text-slate-700">{area}</span>
                          <Badge variant="secondary" className="text-xs">{t('Expert', 'خبير')}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">{t('Recent Activity', 'النشاط الأخير')}</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    {t('Latest updates from your assessment activities', 'آخر التحديثات من أنشطة التقييم الخاصة بك')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.activity.length > 0 ? (
                      dashboardData.activity.map((activity) => (
                        <div key={activity.id} className={`flex items-start gap-3 p-3 bg-slate-50 rounded-lg ${isRTL ? 'flex-row-reverse text-start' : ''}`}>
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
                      <p className="text-sm text-slate-500 font-dubai-medium">{t('No recent activity', 'لا يوجد نشاط حديث')}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assessments Tab */}
            <TabsContent value="assessments" className="space-y-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">{t('Assessment Management', 'إدارة التقييمات')}</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    {t('Create and manage skill assessments', 'إنشاء وإدارة تقييمات المهارات')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <ClipboardCheck className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-dubai-bold text-slate-900 mb-2">{t('Assessment Management', 'إدارة التقييمات')}</h3>
                    <p className="text-slate-500 mb-6 font-dubai-medium">{t('Create, conduct, and manage comprehensive skill assessments', 'إنشاء وإجراء وإدارة تقييمات المهارات الشاملة')}</p>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                      <Plus className="h-4 w-4 me-2" />
                      {t('Create New Assessment', 'إنشاء تقييم جديد')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Candidates Tab */}
            <TabsContent value="candidates" className="space-y-6">
              {actionError && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-medium flex items-center gap-2">
                  <AlertCircle size={16} />
                  {actionError}
                </div>
              )}
              {actionSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm font-medium flex items-center gap-2">
                  <CheckCircle size={16} />
                  {actionSuccess}
                </div>
              )}

              <Card className="bg-white shadow-sm border border-slate-100">
                <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4 pb-6">
                  <div>
                    <CardTitle className="font-dubai-bold text-slate-900 text-xl">
                      {t('Assessment Applications', 'طلبات التقييم')}
                    </CardTitle>
                    <CardDescription className="font-dubai-medium text-slate-500 mt-1">
                      {t('Manage applications, schedule sessions, and grade candidates to verify skills.', 'إدارة الطلبات، وجدولة الجلسات، وتقييم المرشحين للتحقق من المهارات.')}
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={loadApplications} 
                    disabled={appsLoading} 
                    variant="outline" 
                    className="font-dubai-medium border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    {appsLoading ? <Loader2 size={16} className="animate-spin me-2" /> : null}
                    {t('Refresh List', 'تحديث القائمة')}
                  </Button>
                </CardHeader>
                <CardContent>
                  {appsLoading && applications.length === 0 ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="animate-spin text-teal-600" size={36} />
                    </div>
                  ) : applications.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-dubai-bold text-slate-900 mb-2">{t('No Applications Found', 'لم يتم العثور على طلبات')}</h3>
                      <p className="text-slate-500 font-dubai-medium max-w-md mx-auto">
                        {t('Candidates will appear here once they apply to assessments offered by your center.', 'سيظهر المرشحون هنا بمجرد تقديمهم للتقييمات التي يقدمها مركزك.')}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-start border-collapse" dir={isRTL ? 'rtl' : 'ltr'}>
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                            <th className="py-3 px-4 text-slate-500">{t('Candidate', 'المرشح')}</th>
                            <th className="py-3 px-4 text-slate-500">{t('Assessment', 'التقييم')}</th>
                            <th className="py-3 px-4 text-slate-500">{t('Date Applied', 'تاريخ التقديم')}</th>
                            <th className="py-3 px-4 text-slate-500">{t('Status', 'الحالة')}</th>
                            <th className="py-3 px-4 text-slate-500 text-end">{t('Actions', 'الإجراءات')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {applications.map((app) => (
                            <tr key={app.id} className="hover:bg-slate-50/50 transition-colors text-sm">
                              <td className="py-4 px-4">
                                <div className="font-semibold text-slate-900">{app.candidate_name}</div>
                                <div className="text-xs text-slate-500">{app.candidate_email}</div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="font-medium text-slate-900">{app.assessment_name}</div>
                                <div className="text-xs text-slate-500">{app.duration_minutes} {t('mins', 'دقيقة')}</div>
                              </td>
                              <td className="py-4 px-4 text-slate-600">
                                {new Date(app.applied_at).toLocaleDateString(isRTL ? 'ar-AE' : 'en-US')}
                              </td>
                              <td className="py-4 px-4">
                                {app.status === 'completed' && (
                                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {t('Completed', 'مكتمل')}
                                  </Badge>
                                )}
                                {app.status === 'scheduled' && (
                                  <div className="space-y-1">
                                    <Badge className="bg-blue-50 text-blue-700 border border-blue-200">
                                      {t('Scheduled', 'مجدول')}
                                    </Badge>
                                    <div className="text-[10px] text-slate-500 font-medium">
                                      {new Date(app.scheduled_at).toLocaleDateString()}
                                    </div>
                                  </div>
                                )}
                                {app.status === 'applied' && (
                                  <Badge className="bg-amber-50 text-amber-700 border border-amber-200">
                                    {t('Applied', 'تم التقديم')}
                                  </Badge>
                                )}
                              </td>
                              <td className="py-4 px-4 text-end">
                                <div className="flex gap-2 justify-end">
                                  {app.status === 'applied' && (
                                    <Button
                                      onClick={() => {
                                        setSchedulingApp(app);
                                        setScheduledDate('');
                                      }}
                                      size="sm"
                                      className="bg-blue-600 hover:bg-blue-700 text-white font-dubai-medium text-xs h-8"
                                    >
                                      {t('Schedule', 'جدولة')}
                                    </Button>
                                  )}
                                  {app.status === 'scheduled' && (
                                    <Button
                                      onClick={() => {
                                        setGradingApp(app);
                                        setGradeScore(80);
                                        setGradeFeedback('');
                                        // Auto-populate default suggested skills based on assessment templates
                                        const defaultSkills = app.assessment_name.includes('Python')
                                          ? 'Python, Software Engineering'
                                          : 'Strategic Leadership, Communication';
                                        setSkillsInput(defaultSkills);
                                      }}
                                      size="sm"
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-dubai-medium text-xs h-8"
                                    >
                                      {t('Grade & Sync', 'تقييم ومزامنة')}
                                    </Button>
                                  )}
                                  {app.status === 'completed' && app.notes && (
                                    <div className="text-xs text-slate-500 italic max-w-xs truncate text-end">
                                      {app.notes}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Schedule Modal */}
              {schedulingApp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full border border-slate-100 p-6 space-y-6 animate-in zoom-in-95 duration-200">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {t('Schedule Assessment', 'جدولة التقييم')}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {t('Set the date and time for candidate: ', 'حدد موعد وتاريخ تقييم المرشح: ')}
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{schedulingApp.candidate_name}</span>
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          {t('Date & Time', 'تاريخ ووقت الموعد')}
                        </label>
                        <Input
                          type="datetime-local"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="w-full border-slate-200 dark:border-slate-800"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <Button
                        variant="outline"
                        onClick={() => setSchedulingApp(null)}
                        className="font-dubai-medium text-xs border-slate-200 text-slate-700"
                      >
                        {t('Cancel', 'إلغاء')}
                      </Button>
                      <Button
                        onClick={() => handleSchedule(schedulingApp.id)}
                        disabled={!scheduledDate}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-dubai-medium text-xs"
                      >
                        {t('Confirm Schedule', 'تأكيد الموعد')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Grade / Complete Modal */}
              {gradingApp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full border border-slate-100 p-6 space-y-6 animate-in zoom-in-95 duration-200">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {t('Complete & Grade Assessment', 'إكمال وتقييم الاختبار')}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {t('Submit final evaluation for: ', 'تقديم التقييم النهائي لـ: ')}
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{gradingApp.candidate_name}</span>
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Score Input */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            {t('Pass / Final Score (0 - 100)', 'الدرجة النهائية (0 - 100)')}
                          </label>
                          <span className="text-sm font-bold text-teal-600">{gradeScore}%</span>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={gradeScore}
                          onChange={(e) => setGradeScore(parseInt(e.target.value) || 0)}
                          className="w-full border-slate-200 dark:border-slate-800"
                        />
                      </div>

                      {/* Skills to Verify */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                          {t('Skills to Verify & Sync to Portfolio', 'المهارات المراد إثباتها ومزامنتها في المحفظة')}
                        </label>
                        <Input
                          type="text"
                          placeholder="e.g. Python, SQL, Docker"
                          value={skillsInput}
                          onChange={(e) => setSkillsInput(e.target.value)}
                          className="w-full border-slate-200 dark:border-slate-800"
                        />
                        <span className="text-[10px] text-slate-400 block mt-1">
                          {t('Enter skills separated by commas. These will automatically appear as "Verified" badges in the candidate portfolio.', 'أدخل المهارات مفصولة بفواصل. ستظهر تلقائياً كـ "شارة موثقة" في محفظة المرشح.')}
                        </span>
                      </div>

                      {/* Feedback Notes */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          {t('Feedback & Notes', 'التغذية الراجعة والملاحظات')}
                        </label>
                        <textarea
                          rows={3}
                          value={gradeFeedback}
                          onChange={(e) => setGradeFeedback(e.target.value)}
                          placeholder={t('Write constructive evaluation notes here...', 'اكتب ملاحظات التقييم هنا...')}
                          className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-800 p-2.5 bg-transparent focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <Button
                        variant="outline"
                        onClick={() => setGradingApp(null)}
                        className="font-dubai-medium text-xs border-slate-200 text-slate-700"
                      >
                        {t('Cancel', 'إلغاء')}
                      </Button>
                      <Button
                        onClick={() => handleComplete(gradingApp.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-dubai-medium text-xs"
                      >
                        {t('Submit Grade & Verify Skills', 'تقديم التقييم وتوثيق المهارات')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">{t('Performance Analytics', 'تحليلات الأداء')}</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    {t('Detailed performance metrics and insights', 'مقاييس أداء مفصلة ورؤى')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-dubai-bold text-slate-900 mb-2">{t('Performance Analytics', 'تحليلات الأداء')}</h3>
                    <p className="text-slate-500 mb-6 font-dubai-medium">{t('Comprehensive analytics on assessment quality and efficiency', 'تحليلات شاملة لجودة وكفاءة التقييم')}</p>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                      {t('View Analytics Dashboard', 'عرض لوحة التحليلات')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tools Tab */}
            <TabsContent value="tools" className="space-y-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">{t('Assessment Tools & Resources', 'أدوات وموارد التقييم')}</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    {t('Access assessment frameworks and evaluation tools', 'الوصول إلى أطر التقييم وأدوات التقييم')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-dubai-bold text-slate-900 mb-2">{t('Assessment Tools', 'أدوات التقييم')}</h3>
                    <p className="text-slate-500 mb-6 font-dubai-medium">{t('Access evaluation frameworks, rubrics, and assessment templates', 'الوصول إلى أطر التقييم والمعايير وقوالب التقييم')}</p>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                      {t('Browse Tools Library', 'تصفح مكتبة الأدوات')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages" className="space-y-6">
              <Messages senderRole="assessor" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AssessorDashboard;
