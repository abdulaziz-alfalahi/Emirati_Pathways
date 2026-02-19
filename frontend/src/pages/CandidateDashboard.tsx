import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import {
  User,
  Briefcase,
  FileText,
  TrendingUp,
  Upload,
  CheckCircle,
  AlertCircle,
  Target,
  Calendar,
  Eye,
  Bell,
  Settings,
  Sparkles,
  ArrowRight
} from 'lucide-react';

// Import your existing components
import CVProfile from '@/components/candidate/CVProfile';
import JobMatches from '@/components/candidate/JobMatches';
import ApplicationTracker from '@/components/candidate/ApplicationTracker';
import Messages from '@/components/candidate/Messages';
import CandidateInterviews from '@/components/candidate/Interviews';
import CandidateOffers from '@/components/candidate/CandidateOffers';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { restClient } from '@/utils/api';

interface DashboardData {
  profile: {
    name: string;
    email?: string;
    phone?: string;
    location?: string;
    completionPercentage: number;
    cvUploaded: boolean;
    profile_photo_url?: string;
    ats_score?: number;
  };
  stats: {
    profileViews: number;
    jobMatches: number;
    applications: number;
    interviews: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'application' | 'interview' | 'profile_view' | 'job_match';
    title: string;
    description: string;
    timestamp: string;
  }>;
}

const CandidateDashboard: React.FC = () => {
  const { i18n } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    profile: {
      name: 'Job Seeker',
      completionPercentage: 0,
      cvUploaded: false,
      ats_score: 0
    },
    stats: {
      profileViews: 0,
      jobMatches: 0,
      applications: 0,
      interviews: 0
    },
    recentActivity: []
  });
  const [activeTab, setActiveTab] = useState('overview');
  const location = useLocation();

  // Bilingual helper
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;

  useEffect(() => {
    // Check for hash
    if (location.hash) {
      const tab = location.hash.replace('#', '');
      if (['overview', 'profile', 'jobs', 'applications', 'interviews', 'offers', 'messages'].includes(tab)) {
        setActiveTab(tab);
        return;
      }
    }

    // Check for query param
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'profile', 'jobs', 'applications', 'interviews', 'offers', 'messages'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await restClient.get('/api/candidate/dashboard/stats');
        if (response.data.success) {
          const result = response.data;
          setDashboardData(prev => ({
            ...prev,
            profile: { ...prev.profile, ...result.data.profile },
            stats: { ...prev.stats, ...result.data.stats }
          }));
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'application': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'interview': return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'profile_view': return <Eye className="h-4 w-4 text-green-500" />;
      case 'job_match': return <Target className="h-4 w-4 text-orange-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">{t('Loading dashboard...', 'جاري تحميل لوحة التحكم...')}</div>;
  }

  const firstName = dashboardData.profile.name.split(' ')[0];

  return (
    <div className={`min-h-screen bg-background ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <HybridGovernmentNavFixed
        showAuthButtons={false}
        currentPage="dashboard"
        userRole="job seeker"
        currentLanguage={language}
        onLanguageToggle={toggleLanguage}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center gap-4">
            <div className="relative group w-12 h-12 rounded-full overflow-hidden shadow-lg transform hover:scale-105 transition-transform duration-200">
              {dashboardData.profile.profile_photo_url ? (
                <img
                  src={dashboardData.profile.profile_photo_url || ''}
                  alt={dashboardData.profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-teal-600 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {dashboardData.profile.name ? dashboardData.profile.name.charAt(0).toUpperCase() : 'C'}
                  </span>
                </div>
              )}
              {/* Upload Overlay */}
              <div
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => document.getElementById('dashboard-photo-upload')?.click()}
              >
                <Upload className="h-4 w-4 text-white" />
              </div>
              <input
                type="file"
                id="dashboard-photo-upload"
                className="hidden"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (!file.type.startsWith('image/')) return;
                    const formData = new FormData();
                    formData.append('photo', file);
                    try {
                      // Use restClient for consistent base URL and auth headers
                      const response = await restClient.post('/api/profile/candidate/photo', formData, {
                        headers: {
                          'Content-Type': 'multipart/form-data',
                        },
                      });

                      const data = response.data;
                      if (data.success) {
                        setDashboardData(prev => ({
                          ...prev,
                          profile: { ...prev.profile, profile_photo_url: data.data.photo_url }
                        }));
                      }
                    } catch (err) {
                      console.error("Upload failed", err);
                    }
                  }
                }}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground animate-in fade-in slide-in-from-left-4 duration-500">
                {dashboardData.profile.name === 'New Member'
                  ? t('Welcome!', '!مرحباً')
                  : t(`Welcome back, ${firstName}!`, `!مرحباً بعودتك، ${firstName}`)}
              </h1>
              <p className="text-muted-foreground">
                {dashboardData.profile.name === 'New Member'
                  ? t('Complete your profile to unlock your career journey', 'أكمل ملفك الشخصي لبدء رحلتك المهنية')
                  : t('Your career journey continues here', 'رحلتك المهنية تستمر هنا')}
              </p>
            </div>
          </div>

        </div>

        {!dashboardData.profile.cvUploaded && (
          <div className="pt-4 mb-6">
            <Alert className="border-teal-200 bg-teal-50 shadow-sm">
              <Sparkles className="h-4 w-4 text-teal-600" />
              <AlertDescription className="text-teal-800 flex justify-between items-center">
                <span>
                  <strong>{t('Boost your profile!', 'عزّز ملفك الشخصي!')}</strong> {t('Upload your CV to get AI-powered job matches and a professional profile.', 'ارفع سيرتك الذاتية للحصول على مطابقات وظيفية ذكية وملف مهني احترافي.')}
                </span>
                <Button size="sm" className="bg-teal-600 hover:bg-teal-700" style={{ marginInlineStart: 16 }} onClick={() => navigate('/candidate/profile')}>
                  {t('Upload CV Now', 'ارفع السيرة الذاتية')} <ArrowRight className="h-4 w-4" style={{ marginInlineStart: 8 }} />
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <TabsList className="grid w-full grid-cols-7 bg-muted/50 p-1 rounded-xl shadow-sm">
              <TabsTrigger value="overview">{t('Overview', 'نظرة عامة')}</TabsTrigger>
              <TabsTrigger value="profile">{t('Profile & CV', 'الملف والسيرة')}</TabsTrigger>
              <TabsTrigger value="jobs">{t('Job Matches', 'الوظائف المطابقة')}</TabsTrigger>
              <TabsTrigger value="applications">{t('Applications', 'الطلبات')}</TabsTrigger>
              <TabsTrigger value="interviews">{t('Interviews', 'المقابلات')}</TabsTrigger>
              <TabsTrigger value="offers">{t('Offers', 'العروض')}</TabsTrigger>
              <TabsTrigger value="messages">{t('Messages', 'الرسائل')}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6" dir={isRTL ? 'rtl' : 'ltr'}>
                <Card className="hover:shadow-md transition-shadow duration-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-blue-100 rounded-full">
                        <Eye className="h-6 w-6 text-blue-600" />
                      </div>
                      <div style={{ marginInlineStart: 16 }}>
                        <p className="text-sm font-medium text-muted-foreground">{t('Profile Views', 'مشاهدات الملف')}</p>
                        <p className="text-2xl font-bold text-foreground">{dashboardData.stats.profileViews}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow duration-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-green-100 rounded-full">
                        <Target className="h-6 w-6 text-green-600" />
                      </div>
                      <div style={{ marginInlineStart: 16 }}>
                        <p className="text-sm font-medium text-muted-foreground">{t('Job Matches', 'الوظائف المطابقة')}</p>
                        <p className="text-2xl font-bold text-foreground">{dashboardData.stats.jobMatches}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow duration-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-purple-100 rounded-full">
                        <FileText className="h-6 w-6 text-purple-600" />
                      </div>
                      <div style={{ marginInlineStart: 16 }}>
                        <p className="text-sm font-medium text-muted-foreground">{t('Applications', 'الطلبات')}</p>
                        <p className="text-2xl font-bold text-foreground">{dashboardData.stats.applications}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow duration-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-orange-100 rounded-full">
                        <Calendar className="h-6 w-6 text-orange-600" />
                      </div>
                      <div style={{ marginInlineStart: 16 }}>
                        <p className="text-sm font-medium text-muted-foreground">{t('Interviews', 'المقابلات')}</p>
                        <p className="text-2xl font-bold text-foreground">{dashboardData.stats.interviews}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="overflow-hidden">
                  <CardHeader className="bg-card border-b">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-teal-600" />
                      {t('Profile Completion', 'اكتمال الملف الشخصي')}
                    </CardTitle>
                    <CardDescription>
                      {t('Complete your profile to get better job matches', 'أكمل ملفك الشخصي للحصول على مطابقات وظيفية أفضل')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{t('Overall Progress', 'التقدم العام')}</span>
                        <span className="text-sm font-bold text-teal-600">{dashboardData.profile.completionPercentage}%</span>
                      </div>
                      <Progress value={dashboardData.profile.completionPercentage} className="h-3 bg-gray-100" />
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-lg">
                          <span className="flex items-center gap-2">
                            <Upload className="h-4 w-4 text-gray-500" />
                            {t('CV Upload Status', 'حالة رفع السيرة الذاتية')}
                          </span>
                          {dashboardData.profile.cvUploaded ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" /> {t('Uploaded', 'تم الرفع')}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> {t('Pending', 'قيد الانتظار')}
                            </Badge>
                          )}
                        </div>
                        <Button
                          onClick={() => navigate('/candidate/profile')}
                          variant="default"
                          className="w-full bg-slate-900 hover:bg-slate-800"
                        >
                          {dashboardData.profile.cvUploaded
                            ? t('Enhance Profile / CV', 'تحسين الملف / السيرة الذاتية')
                            : t('Build Profile & CV', 'إنشاء الملف والسيرة الذاتية')}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between text-sm p-3 bg-blue-50 rounded-lg mt-3">
                        <span className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-blue-500" />
                          {t('ATS Compatibility', 'توافق نظام تتبع المتقدمين')}
                        </span>
                        <span className={`font-bold ${(dashboardData.profile.ats_score || 0) >= 80 ? 'text-green-600' :
                          (dashboardData.profile.ats_score || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                          {dashboardData.profile.ats_score || 0}/100
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="bg-card border-b">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-teal-600" />
                      {t('Quick Actions', 'إجراءات سريعة')}
                    </CardTitle>
                    <CardDescription>
                      {t('Common tasks to boost your job search', 'مهام شائعة لتعزيز بحثك عن وظيفة')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <Button
                        onClick={() => setActiveTab('jobs')}
                        variant="outline"
                        className="w-full justify-start hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition-colors"
                      >
                        <Target className="h-4 w-4" style={{ marginInlineEnd: 8 }} />
                        {t('Browse Job Matches', 'تصفح الوظائف المطابقة')}
                      </Button>
                      <Button
                        onClick={() => setActiveTab('applications')}
                        variant="outline"
                        className="w-full justify-start hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition-colors"
                      >
                        <FileText className="h-4 w-4" style={{ marginInlineEnd: 8 }} />
                        {t(`Track Applications (${dashboardData.stats.applications})`, `تتبع الطلبات (${dashboardData.stats.applications})`)}
                      </Button>
                      <Button
                        onClick={() => navigate('/candidate/profile')}
                        variant="outline"
                        className="w-full justify-start hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition-colors"
                      >
                        <Sparkles className="h-4 w-4" style={{ marginInlineEnd: 8 }} />
                        {t('Build Your Resume with AI', 'أنشئ سيرتك الذاتية بالذكاء الاصطناعي')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="profile" className="space-y-6 mt-6">
              {/* Unified CV-as-Profile component with ATS score and D33/Talent33 recommendations */}
              <CVProfile />
            </TabsContent>

            <TabsContent value="jobs" className="space-y-6 mt-6">
              <JobMatches />
            </TabsContent>

            <TabsContent value="applications" className="space-y-6 mt-6">
              <ApplicationTracker />
            </TabsContent>

            <TabsContent value="interviews" className="space-y-6 mt-6">
              <CandidateInterviews />
            </TabsContent>

            <TabsContent value="offers" className="space-y-6 mt-6">
              <CandidateOffers />
            </TabsContent>

            <TabsContent value="messages" className="space-y-6 mt-6">
              <Messages />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div >
  );
};

export default CandidateDashboard;
