import React, { useState } from 'react';
import { getAuthToken } from '@/utils/tokenUtils';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';
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
  impact: {
    careerAdvancement: number;
  };
  expertise: {
    primaryAreas: string[];
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

interface IncentiveHistoryItem {
  id: number;
  action_type: string;
  points_awarded: number;
  reference_id: string;
  created_at: string;
}

interface PendingVerification {
  skill_id: number;
  candidate_user_id: string;
  skill_name: string;
  skill_level: string;
  skill_category: string;
  candidate_name: string;
  candidate_email: string;
  project_id: number | null;
  project_title: string | null;
  project_description: string | null;
  project_url: string | null;
  completion_date: string | null;
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
    impact: { careerAdvancement: 0 },
    expertise: { primaryAreas: [], successStories: 0 },
    activity: []
  });

  const API_BASE = import.meta.env.VITE_API_URL || '';

  const [incentivePoints, setIncentivePoints] = useState<number>(0);
  const [incentiveTier, setIncentiveTier] = useState<string>('bronze');
  const [incentiveHistory, setIncentiveHistory] = useState<IncentiveHistoryItem[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
  const [loadingIncentives, setLoadingIncentives] = useState<boolean>(true);
  const [loadingVerifications, setLoadingVerifications] = useState<boolean>(true);
  const [processingVerificationId, setProcessingVerificationId] = useState<number | null>(null);

  const fetchIncentives = async () => {
    try {
      setLoadingIncentives(true);
      const token = getAuthToken() || '';
      const resp = await fetch(`${API_BASE}/api/mentor/progress/incentives`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        const result = await resp.json();
        if (result.success) {
          setIncentivePoints(result.incentive_points);
          setIncentiveTier(result.incentive_tier);
          setIncentiveHistory(result.history || []);
        }
      }
    } catch (err) {
      console.error('Error fetching incentives:', err);
    } finally {
      setLoadingIncentives(false);
    }
  };

  const fetchVerifications = async () => {
    try {
      setLoadingVerifications(true);
      const token = getAuthToken() || '';
      const resp = await fetch(`${API_BASE}/api/mentor/progress/pending-verifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        const result = await resp.json();
        if (result.success) {
          setPendingVerifications(result.pending || []);
        }
      }
    } catch (err) {
      console.error('Error fetching pending verifications:', err);
    } finally {
      setLoadingVerifications(false);
    }
  };

  const handleVerifySkill = async (skillId: number, isApproved: boolean) => {
    try {
      setProcessingVerificationId(skillId);
      const token = getAuthToken() || '';
      const resp = await fetch(`${API_BASE}/api/mentor/progress/verify-skill`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ skill_id: skillId, is_approved: isApproved })
      });
      const result = await resp.json();
      if (resp.ok && result.success) {
        toast.success(result.message || (isApproved ? t('Skill verified successfully!', 'تم التحقق من المهارة بنجاح!') : t('Skill verification rejected.', 'تم رفض التحقق من المهارة.')));
        fetchIncentives();
        fetchVerifications();
      } else {
        toast.error(result.error || t('Failed to process verification', 'فشل في معالجة التحقق'));
      }
    } catch (err) {
      console.error('Error verifying skill:', err);
      toast.error(t('An error occurred during verification', 'حدث خطأ أثناء عملية التحقق'));
    } finally {
      setProcessingVerificationId(null);
    }
  };

  const getTierDetails = (points: number, tier: string) => {
    const currentPoints = points || 0;
    const currentTier = (tier || 'bronze').toLowerCase();
    
    let nextTier = '';
    let minPoints = 0;
    let maxPoints = 0;
    let badgeColor = '';
    let nextPoints = 0;
    
    if (currentTier === 'bronze') {
      nextTier = 'Silver';
      minPoints = 0;
      maxPoints = 1000;
      badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
      nextPoints = 1000;
    } else if (currentTier === 'silver') {
      nextTier = 'Gold';
      minPoints = 1000;
      maxPoints = 3500;
      badgeColor = 'bg-slate-200 text-slate-800 border-slate-400';
      nextPoints = 3500;
    } else if (currentTier === 'gold') {
      nextTier = 'Platinum';
      minPoints = 3500;
      maxPoints = 8000;
      badgeColor = 'bg-yellow-100 text-yellow-800 border-yellow-400';
      nextPoints = 8000;
    } else {
      nextTier = '';
      minPoints = 8000;
      maxPoints = 8000;
      badgeColor = 'bg-teal-100 text-teal-800 border-teal-400';
      nextPoints = 0;
    }
    
    const pointsInCurrentRange = currentPoints - minPoints;
    const rangeTotal = maxPoints - minPoints;
    const progress = rangeTotal > 0 ? Math.min(100, Math.max(0, (pointsInCurrentRange / rangeTotal) * 100)) : 100;
    const remaining = nextPoints > 0 ? nextPoints - currentPoints : 0;
    
    return {
      nextTier,
      progress,
      remaining,
      badgeColor,
      maxPoints,
      minPoints
    };
  };

  const getTierNameTranslation = (tierName: string) => {
    const lower = (tierName || 'bronze').toLowerCase();
    if (lower === 'bronze') return t('Bronze', 'برونزي');
    if (lower === 'silver') return t('Silver', 'فضي');
    if (lower === 'gold') return t('Gold', 'ذهبي');
    if (lower === 'platinum') return t('Platinum', 'بلاتيني');
    return tierName;
  };

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
        const token = getAuthToken() || '';
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
            impact: {
              careerAdvancement: Math.round((d.performance_metrics?.session_completion_rate || 0) * 100)
            },
            expertise: {
              primaryAreas: d.expertise_areas || [],
              successStories: d.mentor_info?.successful_placements || 0
            },
            activity: []
          });
        }
      } catch (err) {
        console.error('Failed to load mentor dashboard:', err);
      }
    })();
    fetchIncentives();
    fetchVerifications();
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
            <TabsList className="flex flex-wrap w-full bg-card shadow-sm p-1 gap-1 h-auto" dir={isRTL ? 'rtl' : 'ltr'}>
              <TabsTrigger value="overview" className="flex-grow md:flex-none font-dubai-medium">{t('Overview', 'نظرة عامة')}</TabsTrigger>
              <TabsTrigger value="mentees" className="flex-grow md:flex-none font-dubai-medium">{t('Mentees', 'المتدربين')}</TabsTrigger>
              <TabsTrigger value="sessions" className="flex-grow md:flex-none font-dubai-medium">{t('Sessions', 'الجلسات')}</TabsTrigger>
              <TabsTrigger value="verifications" className="flex-grow md:flex-none font-dubai-medium relative flex items-center justify-center gap-1.5">
                {t('Skill Verifications', 'التحقق من المهارات')}
                {pendingVerifications.length > 0 && (
                  <Badge variant="destructive" className="px-1.5 py-0.5 text-[10px] h-4 min-w-4 flex items-center justify-center rounded-full">
                    {pendingVerifications.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="incentives" className="flex-grow md:flex-none font-dubai-medium">
                {t('Incentives & Tiers', 'الحوافز والمستويات')}
              </TabsTrigger>
              <TabsTrigger value="impact" className="flex-grow md:flex-none font-dubai-medium">{t('Impact', 'التأثير')}</TabsTrigger>
              <TabsTrigger value="resources" className="flex-grow md:flex-none font-dubai-medium">{t('Resources', 'الموارد')}</TabsTrigger>
              <TabsTrigger value="messages" className="flex-grow md:flex-none font-dubai-medium">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-dubai-bold text-green-600">{dashboardData.impact.careerAdvancement}%</div>
                      <p className="text-sm text-slate-600 font-dubai-medium">{t('Career Advancement', 'التقدم المهني')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Expertise Areas */}
              <div className="grid grid-cols-1 gap-6">
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

            {/* Skill Verifications Tab */}
            <TabsContent value="verifications" className="space-y-6">
              <Card className={`bg-card shadow-sm border border-slate-100 ${isRTL ? 'text-right' : ''}`}>
                <CardHeader>
                  <CardTitle className="font-dubai-bold text-slate-900 flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-teal-600" />
                    {t('Skill Verification Queue', 'طابور التحقق من المهارات')}
                  </CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-500">
                    {t('Review and approve skills demonstrated in candidate portfolio projects. Approving a skill awards you +20 points.', 'قم بمراجعة واعتماد المهارات الموضحة في مشاريع المتدربين. اعتماد المهارة يمنحك +20 نقطة.')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingVerifications ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                    </div>
                  ) : pendingVerifications.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="h-16 w-16 text-teal-500 mx-auto mb-4" />
                      <h3 className="text-lg font-dubai-bold text-slate-800 mb-1">
                        {t('All Caught Up!', 'لقد انتهيت من كل المراجعات!')}
                      </h3>
                      <p className="text-slate-500 font-dubai-medium max-w-md mx-auto">
                        {t('There are no pending skill verifications at the moment. Excellent job keeping the queue clean!', 'لا توجد مهارات معلقة للتحقق منها حالياً. عمل رائع في إبقاء القائمة مكتملة!')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {pendingVerifications.map((item) => (
                        <div
                          key={item.skill_id}
                          className={`p-5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/50 transition-colors flex flex-col md:flex-row justify-between items-start gap-4 ${isRTL ? 'md:flex-row-reverse text-right' : ''}`}
                        >
                          <div className="space-y-3 flex-1">
                            {/* Candidate Info */}
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-dubai-bold">
                                {item.candidate_name?.charAt(0) || 'C'}
                              </div>
                              <div>
                                <h4 className="font-dubai-bold text-slate-900 leading-tight">{item.candidate_name}</h4>
                                <p className="text-xs text-slate-500 font-dubai">{item.candidate_email}</p>
                              </div>
                            </div>

                            {/* Skill Details */}
                            <div className="flex flex-wrap gap-2 pt-1">
                              <Badge className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                                {item.skill_name}
                              </Badge>
                              <Badge variant="outline" className="bg-slate-100 text-slate-700 font-dubai">
                                {item.skill_level}
                              </Badge>
                              <Badge variant="outline" className="bg-slate-100 text-slate-700 font-dubai">
                                {item.skill_category}
                              </Badge>
                            </div>

                            {/* Project Details */}
                            {item.project_title ? (
                              <div className="p-3 bg-white rounded-lg border border-slate-200/60 mt-2 space-y-1">
                                <p className="text-xs font-dubai-bold text-teal-800 uppercase tracking-wider">{t('Demonstrated in Project', 'موضح في مشروع')}</p>
                                <h5 className="font-dubai-bold text-sm text-slate-900">{item.project_title}</h5>
                                <p className="text-xs text-slate-600 font-dubai leading-relaxed">{item.project_description}</p>
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 mt-2">
                                  {item.project_url && (
                                    <a
                                      href={item.project_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-teal-600 hover:text-teal-700 font-dubai-bold underline"
                                    >
                                      {t('View Project Code/Link ↗', 'عرض رابط/رمز المشروع ↗')}
                                    </a>
                                  )}
                                  {item.completion_date && (
                                    <span className="text-[10px] text-slate-400 font-dubai">
                                      {t('Completed:', 'اكتمل في:')} {new Date(item.completion_date).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500 italic pt-1">
                                {t('No linked portfolio project found for this skill.', 'لا يوجد مشروع محفظة مرتبط بهذه المهارة.')}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className={`flex flex-row md:flex-col gap-2 w-full md:w-auto justify-end ${isRTL ? 'md:items-start' : 'md:items-end'}`}>
                            <Button
                              onClick={() => handleVerifySkill(item.skill_id, true)}
                              disabled={processingVerificationId !== null}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-dubai-medium flex-1 md:flex-initial"
                            >
                              {processingVerificationId === item.skill_id ? (
                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 me-2" />
                                  {t('Approve Skill', 'اعتماد المهارة')}
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleVerifySkill(item.skill_id, false)}
                              disabled={processingVerificationId !== null}
                              className="border-red-200 hover:bg-red-50 text-red-600 font-dubai-medium flex-1 md:flex-initial"
                            >
                              {t('Reject', 'رفض')}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Incentives & Tiers Tab */}
            <TabsContent value="incentives" className="space-y-6">
              {loadingIncentives ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary & Progress Card */}
                  <Card className={`bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md border-0 ${isRTL ? 'text-right' : ''}`}>
                    <CardContent className="p-6 md:p-8">
                      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
                        <div className="space-y-2">
                          <p className="text-teal-400 font-dubai-bold uppercase tracking-wider text-sm">
                            {t('MENTOR INCENTIVE PROGRAM', 'برنامج تحفيز المرشدين')}
                          </p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-dubai-bold">{incentivePoints}</span>
                            <span className="text-slate-400 font-dubai-medium text-lg">{t('Points', 'نقطة')}</span>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-slate-300 font-dubai-medium text-sm">{t('Current Tier:', 'المستوى الحالي:')}</span>
                            <Badge className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-bold text-xs px-2.5 py-1">
                              {getTierNameTranslation(incentiveTier)}
                            </Badge>
                          </div>
                        </div>

                        {/* Tier Details Card */}
                        <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 w-full md:w-auto md:min-w-[300px] space-y-3">
                          {(() => {
                            const details = getTierDetails(incentivePoints, incentiveTier);
                            return (
                              <>
                                <div className="flex justify-between items-center text-sm font-dubai-medium">
                                  <span className="text-slate-400">{t('Next Tier:', 'المستوى القادم:')}</span>
                                  <span className="text-teal-400 font-dubai-bold">
                                    {details.nextTier ? getTierNameTranslation(details.nextTier) : t('Max Tier Reached!', 'تم الوصول للحد الأقصى!')}
                                  </span>
                                </div>
                                <Progress value={details.progress} className="h-2 bg-slate-700" />
                                <div className="flex justify-between items-center text-xs font-dubai text-slate-400">
                                  <span>{details.minPoints} {t('pts', 'نقطة')}</span>
                                  {details.remaining > 0 ? (
                                    <span className="text-slate-300 font-dubai-bold">
                                      {t(`${details.remaining} points to upgrade`, `متبقي ${details.remaining} نقطة للترقية`)}
                                    </span>
                                  ) : (
                                    <span className="text-teal-400 font-dubai-bold">{t('Ultimate Tier', 'المستوى الأسمى')}</span>
                                  )}
                                  <span>{details.maxPoints} {t('pts', 'نقطة')}</span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tier Rules Description */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                      { name: 'Bronze', range: '< 1,000 pts', color: 'border-amber-400 bg-amber-500/10 text-amber-600' },
                      { name: 'Silver', range: '1,000 - 3,499 pts', color: 'border-slate-300 bg-slate-500/10 text-slate-500' },
                      { name: 'Gold', range: '3,500 - 7,999 pts', color: 'border-yellow-400 bg-yellow-500/10 text-yellow-600' },
                      { name: 'Platinum', range: '≥ 8,000 pts', color: 'border-teal-400 bg-teal-500/10 text-teal-600' }
                    ].map((tierItem, index) => {
                      const isCurrent = incentiveTier.toLowerCase() === tierItem.name.toLowerCase();

                      return (
                        <div
                          key={index}
                          className={`p-4 rounded-xl border text-center relative ${tierItem.color} ${isCurrent ? 'ring-2 ring-teal-500 bg-white opacity-100 font-dubai-bold' : 'opacity-70 bg-white'}`}
                        >
                          {isCurrent && (
                            <span className="absolute top-2 right-2 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                            </span>
                          )}
                          <h4 className="font-dubai-bold text-lg mb-1 text-slate-900">{getTierNameTranslation(tierItem.name)}</h4>
                          <p className="text-xs font-dubai-medium text-slate-600">{tierItem.range}</p>
                          {isCurrent && (
                            <Badge className="mt-2 bg-teal-600 text-white text-[10px] font-dubai">
                              {t('Active Level', 'المستوى الحالي')}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* History Logs */}
                  <Card className={`bg-card shadow-sm border border-slate-100 ${isRTL ? 'text-right' : ''}`}>
                    <CardHeader>
                      <CardTitle className="font-dubai-bold text-slate-900 flex items-center gap-2">
                        <Award className="h-5 w-5 text-teal-600" />
                        {t('Points Earning History', 'سجل كسب النقاط')}
                      </CardTitle>
                      <CardDescription className="font-dubai-medium text-slate-500">
                        {t('Recent logs of points awarded for sessions completed and skills verified.', 'السجلات الأخيرة للنقاط الممنوحة للجلسات المكتملة والمهارات التي تم التحقق منها.')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {incentiveHistory.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-slate-500 font-dubai-medium">
                            {t('No points awarded yet. Complete mentoring sessions or verify skills to earn points!', 'لم يتم منح نقاط بعد. أكمل جلسات الإرشاد أو تحقق من المهارات لكسب النقاط!')}
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto pr-2">
                          {incentiveHistory.map((log) => (
                            <div key={log.id} className="py-3 flex justify-between items-center gap-4 text-sm font-dubai">
                              <div>
                                <p className="font-dubai-bold text-slate-900">
                                  {log.action_type === 'session_completed'
                                    ? t('Session Completed', 'جلسة إرشادية مكتملة')
                                    : log.action_type === 'skill_verified'
                                    ? t('Portfolio Skill Verified', 'تم التحقق من مهارة المحفظة')
                                    : log.action_type}
                                </p>
                                <span className="text-xs text-slate-400 font-dubai">
                                  {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <span className="text-emerald-600 font-dubai-bold text-base">
                                +{log.points_awarded} {t('pts', 'نقطة')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
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
