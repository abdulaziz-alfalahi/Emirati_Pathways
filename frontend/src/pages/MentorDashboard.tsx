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



const MentorDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  const { language, toggleLanguage } = useLanguage();
  const [dashboardData, setDashboardData] = useState<MentorData>({
    mentees: { totalMentees: 0, activeMentees: 0, successfulPlacements: 0, averageSessionRating: 0 },
    sessions: { totalSessions: 0, thisMonth: 0, upcomingSessions: 0, completedGoals: 0 },
    impact: { careerAdvancement: 0, skillImprovement: 0, networkGrowth: 0, confidenceBoost: 0 },
    expertise: { primaryAreas: [], yearsExperience: 0, industryConnections: 0, successStories: 0 },
    activity: []
  });

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5003';

  // Get authenticated user info
  const getUserInfo = () => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  };
  const userInfo = getUserInfo();
  const mentorName = userInfo?.full_name || userInfo?.name || t('Mentor', 'المرشد');

  // Fetch real dashboard data from API
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const userId = userInfo?.id || userInfo?.user_id || '';
        if (!userId) return;
        const token = localStorage.getItem('token') || '';
        const resp = await fetch(`${API_BASE}/api/mentor/dashboard/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!resp.ok) return;
        const result = await resp.json();
        if (!cancelled && result.success && result.dashboard) {
          const d = result.dashboard;
          setDashboardData({
            mentees: {
              totalMentees: d.mentor_info?.total_mentees || 0,
              activeMentees: d.availability?.current_mentees || 0,
              successfulPlacements: d.mentor_info?.successful_placements || 0,
              averageSessionRating: d.mentor_info?.rating || d.performance_metrics?.rating || 0
            },
            sessions: {
              totalSessions: d.performance_metrics?.testimonials_count || 0,
              thisMonth: 0,
              upcomingSessions: 0,
              completedGoals: 0
            },
            impact: {
              careerAdvancement: Math.round((d.performance_metrics?.session_completion_rate || 0) * 100),
              skillImprovement: 0,
              networkGrowth: 0,
              confidenceBoost: 0
            },
            expertise: {
              primaryAreas: d.expertise_areas || [],
              yearsExperience: 0,
              industryConnections: 0,
              successStories: d.mentor_info?.successful_placements || 0
            },
            activity: []
          });
        }
      } catch (err) {
        console.error('Failed to load mentor dashboard:', err);
      }
    })();
    return () => { cancelled = true; };
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
                <h1 className="text-3xl font-dubai-bold text-foreground mb-2">
                  {t('Mentor Dashboard', 'لوحة تحكم المرشد')}
                </h1>
                <p className="text-muted-foreground font-dubai-medium">
                  {t(`Welcome back, ${mentorName}`, `مرحباً بعودتك، ${mentorName}`)}
                </p>
              </div>
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-dubai-medium">
                  {t('Senior Mentor', 'مرشد أول')}
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-dubai-medium">
                  {t('Tech Leader', 'قائد تقني')}
                </Badge>
                <Button variant="outline" size="sm">
                  <Settings className={`h-4 w-4 me-2`} />
                  {t('Settings', 'الإعدادات')}
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-4">
              <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                <Calendar className={`h-4 w-4 me-2`} />
                {t('Schedule Session', 'جدولة جلسة')}
              </Button>
              <Button variant="outline" className="font-dubai-medium">
                <Users className={`h-4 w-4 me-2`} />
                {t('View Mentees', 'عرض المتدربين')}
              </Button>
              <Button variant="outline" className="font-dubai-medium">
                <MessageSquare className={`h-4 w-4 me-2`} />
                {t('Send Message', 'إرسال رسالة')}
              </Button>
              <Button variant="outline" className="font-dubai-medium">
                <Download className={`h-4 w-4 me-2`} />
                {t('Export Reports', 'تصدير التقارير')}
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 bg-card shadow-sm" dir={isRTL ? 'rtl' : 'ltr'}>
              <TabsTrigger value="overview" className="font-dubai-medium">{t('Overview', 'نظرة عامة')}</TabsTrigger>
              <TabsTrigger value="mentees" className="font-dubai-medium">{t('Mentees', 'المتدربين')}</TabsTrigger>
              <TabsTrigger value="sessions" className="font-dubai-medium">{t('Sessions', 'الجلسات')}</TabsTrigger>
              <TabsTrigger value="impact" className="font-dubai-medium">{t('Impact', 'التأثير')}</TabsTrigger>
              <TabsTrigger value="resources" className="font-dubai-medium">{t('Resources', 'الموارد')}</TabsTrigger>
              <TabsTrigger value="messages" className="font-dubai-medium">
                <MessageSquare className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                {t('Messages', 'الرسائل')}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className={`bg-card shadow-sm hover:shadow-md transition-shadow ${isRTL ? 'text-right' : ''}`}>
                  <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">{t('Active Mentees', 'المتدربون النشطون')}</CardTitle>
                    <Users className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.mentees.activeMentees}</div>
                    <p className="text-xs text-slate-500 font-dubai-medium">
                      {dashboardData.mentees.totalMentees} {t('total mentees', 'إجمالي المتدربين')}
                    </p>
                  </CardContent>
                </Card>

                <Card className={`bg-card shadow-sm hover:shadow-md transition-shadow ${isRTL ? 'text-right' : ''}`}>
                  <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">{t('Sessions This Month', 'جلسات هذا الشهر')}</CardTitle>
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.sessions.thisMonth}</div>
                    <p className="text-xs text-green-600 font-dubai-medium">
                      {dashboardData.sessions.upcomingSessions} {t('upcoming', 'قادمة')}
                    </p>
                  </CardContent>
                </Card>

                <Card className={`bg-card shadow-sm hover:shadow-md transition-shadow ${isRTL ? 'text-right' : ''}`}>
                  <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">{t('Success Stories', 'قصص النجاح')}</CardTitle>
                    <Award className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-dubai-bold text-slate-900">{dashboardData.expertise.successStories}</div>
                    <p className="text-xs text-green-600 font-dubai-medium">
                      {t('Career advancements achieved', 'تقدّمات مهنية تم تحقيقها')}
                    </p>
                  </CardContent>
                </Card>

                <Card className={`bg-card shadow-sm hover:shadow-md transition-shadow ${isRTL ? 'text-right' : ''}`}>
                  <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <CardTitle className="text-sm font-dubai-medium text-slate-600">{t('Session Rating', 'تقييم الجلسات')}</CardTitle>
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
              <Card className={`bg-card shadow-sm ${isRTL ? 'text-right' : ''}`}>
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">{t('Mentoring Impact', 'تأثير الإرشاد')}</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    {t('Positive outcomes achieved through your mentoring', 'النتائج الإيجابية المحققة من خلال إرشادك')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-green-600">{dashboardData.impact.careerAdvancement}%</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">{t('Career Advancement', 'التقدم المهني')}</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-blue-600">{dashboardData.impact.skillImprovement}%</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">{t('Skill Improvement', 'تحسين المهارات')}</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-purple-600">{dashboardData.impact.networkGrowth}%</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">{t('Network Growth', 'نمو الشبكة')}</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-orange-600">{dashboardData.impact.confidenceBoost}%</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">{t('Confidence Boost', 'تعزيز الثقة')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Expertise & Experience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className={`bg-card shadow-sm ${isRTL ? 'text-right' : ''}`}>
                  <CardHeader>
                    <CardTitle className="font-dubai-bold text-slate-900">{t('Expertise Areas', 'مجالات الخبرة')}</CardTitle>
                    <CardDescription className="font-dubai-medium text-slate-600">
                      {t('Your primary mentoring specializations', 'تخصصاتك الإرشادية الرئيسية')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardData.expertise.primaryAreas.map((area, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                          <span className="text-sm font-dubai-medium text-slate-700">{area}</span>
                          <Badge variant="secondary" className="text-xs">{t('Expert', 'خبير')}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className={`bg-card shadow-sm ${isRTL ? 'text-right' : ''}`}>
                  <CardHeader>
                    <CardTitle className="font-dubai-bold text-slate-900">{t('Professional Profile', 'الملف المهني')}</CardTitle>
                    <CardDescription className="font-dubai-medium text-slate-600">
                      {t('Your mentoring credentials and experience', 'مؤهلاتك وخبراتك في الإرشاد')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-dubai-medium text-slate-600">{t('Years of Experience', 'سنوات الخبرة')}</span>
                        <span className="text-lg font-dubai-bold text-slate-900">{dashboardData.expertise.yearsExperience}+</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-dubai-medium text-slate-600">{t('Industry Connections', 'روابط القطاع')}</span>
                        <span className="text-lg font-dubai-bold text-slate-900">{dashboardData.expertise.industryConnections}+</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-dubai-medium text-slate-600">{t('Completed Goals', 'الأهداف المكتملة')}</span>
                        <span className="text-lg font-dubai-bold text-slate-900">{dashboardData.sessions.completedGoals}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className={`bg-card shadow-sm ${isRTL ? 'text-right' : ''}`}>
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">{t('Recent Activity', 'النشاط الأخير')}</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    {t('Latest updates from your mentoring activities', 'أحدث التحديثات من أنشطتك الإرشادية')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.activity.length > 0 ? (
                      dashboardData.activity.map((activity) => (
                        <div key={activity.id} className={`flex items-start gap-3 p-3 bg-slate-50 rounded-lg ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
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
                      <p className="text-sm text-slate-500 font-dubai-medium">{t('No recent activity', 'لا يوجد نشاط حديث')}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Mentees Tab */}
            <TabsContent value="mentees" className="space-y-6">
              <Card className="bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">{t('Mentee Management', 'إدارة المتدربين')}</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    {t('Manage your current and past mentees', 'إدارة المتدربين الحاليين والسابقين')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-dubai-bold text-slate-900 mb-2">{t('Mentee Management', 'إدارة المتدربين')}</h3>
                    <p className="text-slate-500 mb-6 font-dubai-medium">{t('Track progress and manage relationships with your mentees', 'تتبّع التقدم وإدارة العلاقات مع المتدربين')}</p>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                      {t('View All Mentees', 'عرض جميع المتدربين')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sessions Tab */}
            <TabsContent value="sessions" className="space-y-6">
              <Card className="bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">{t('Session Management', 'إدارة الجلسات')}</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    {t('Schedule and manage mentoring sessions', 'جدولة وإدارة جلسات الإرشاد')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-dubai-bold text-slate-900 mb-2">{t('Session Management', 'إدارة الجلسات')}</h3>
                    <p className="text-slate-500 mb-6 font-dubai-medium">{t('Schedule, conduct, and track mentoring sessions', 'جدولة وإجراء وتتبّع جلسات الإرشاد')}</p>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                      <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('Schedule New Session', 'جدولة جلسة جديدة')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Impact Tab */}
            <TabsContent value="impact" className="space-y-6">
              <Card className="bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">{t('Impact Analytics', 'تحليلات التأثير')}</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    {t('Measure and track your mentoring impact', 'قياس وتتبّع تأثير إرشادك')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-dubai-bold text-slate-900 mb-2">{t('Impact Analytics', 'تحليلات التأثير')}</h3>
                    <p className="text-slate-500 mb-6 font-dubai-medium">{t('Comprehensive analytics on your mentoring impact and success stories', 'تحليلات شاملة لتأثير إرشادك وقصص النجاح')}</p>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                      {t('View Impact Dashboard', 'عرض لوحة التأثير')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Resources Tab */}
            <TabsContent value="resources" className="space-y-6">
              <Card className="bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900">{t('Mentoring Resources', 'موارد الإرشاد')}</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-600">
                    {t('Access tools and resources for effective mentoring', 'الوصول إلى أدوات وموارد للإرشاد الفعّال')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-dubai-bold text-slate-900 mb-2">{t('Resource Library', 'مكتبة الموارد')}</h3>
                    <p className="text-slate-500 mb-6 font-dubai-medium">{t('Access mentoring guides, templates, and best practices', 'الوصول إلى أدلة الإرشاد والقوالب وأفضل الممارسات')}</p>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                      {t('Browse Resources', 'تصفح الموارد')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages" className="space-y-6">
              <Messages senderRole="mentor" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default MentorDashboard;
