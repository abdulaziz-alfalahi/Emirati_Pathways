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
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  const { language, toggleLanguage } = useLanguage();
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

  // Fetch from API, fall back to mock data
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5005';
        const response = await fetch(`${API_BASE}/api/assessor/dashboard`);
        if (response.ok) {
          const data = await response.json();
          setDashboardData({
            assessments: data.assessments || dashboardData.assessments,
            candidates: data.candidates || dashboardData.candidates,
            performance: data.performance || dashboardData.performance,
            specializations: data.specializations || dashboardData.specializations,
            activity: data.activity || [],
          });
          return;
        }
      } catch (error) {
        console.error('Error loading assessor dashboard:', error);
      }
      // Fallback mock data
      setDashboardData({
        assessments: { totalAssessments: 1250, completedThisMonth: 89, pendingReview: 12, averageRating: 4.8 },
        candidates: { totalCandidates: 856, passedAssessments: 672, failedAssessments: 184, awaitingResults: 45 },
        performance: { accuracyRate: 96, averageCompletionTime: 45, qualityScore: 4.7, feedbackRating: 4.8 },
        specializations: {
          primaryAreas: ['Software Development', 'Project Management', 'Communication Skills', 'Technical Writing'],
          certifications: ['Certified Professional Assessor', 'Technical Skills Evaluator', 'Soft Skills Assessment'],
          yearsExperience: 8,
          assessmentTypes: ['Technical Skills', 'Soft Skills', 'Leadership', 'Communication'],
        },
        activity: [
          { id: 1, type: 'assessment_completed', title: 'Assessment Completed', description: 'Technical assessment for Senior Developer position at ADNOC Digital', timestamp: new Date().toISOString(), priority: 'high' },
          { id: 2, type: 'candidate_passed', title: 'Candidate Assessment Passed', description: 'Ahmed Al Emirati successfully passed blockchain development assessment', timestamp: new Date(Date.now() - 86400000).toISOString(), priority: 'medium' },
          { id: 3, type: 'quality_review', title: 'Quality Review Completed', description: 'Peer review completed for communication skills assessment framework', timestamp: new Date(Date.now() - 172800000).toISOString(), priority: 'medium' },
          { id: 4, type: 'new_assignment', title: 'New Assessment Assignment', description: 'Assigned to evaluate leadership skills for Emirates NBD management role', timestamp: new Date(Date.now() - 259200000).toISOString(), priority: 'high' },
        ],
      });
    };
    fetchData();
  }, []);

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
                  {t('Welcome back, Mariam Al Nuaimi - Certified Skills Assessment Specialist', 'مرحباً بعودتك، مريم النعيمي - أخصائية تقييم المهارات المعتمدة')}
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
                <MessageSquare className="h-4 w-4 mr-1" />
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
                        <div key={activity.id} className={`flex items-start gap-3 p-3 bg-slate-50 rounded-lg ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
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
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">{t('Candidate Management', 'إدارة المرشحين')}</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    {t('Track and manage candidate assessments', 'تتبع وإدارة تقييمات المرشحين')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-dubai-bold text-slate-900 mb-2">{t('Candidate Management', 'إدارة المرشحين')}</h3>
                    <p className="text-slate-500 mb-6 font-dubai-medium">{t('Track candidate progress and assessment results', 'تتبع تقدم المرشحين ونتائج التقييم')}</p>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                      {t('View All Candidates', 'عرض جميع المرشحين')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
