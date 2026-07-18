import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import {
  User,
  Users,
  Briefcase,
  FileText,
  TrendingUp,
  Upload,
  CheckCircle,
  Target,
  Calendar,
  Eye,
  Bell,
  Search,
  Sparkles,
  ArrowRight,
  Clock,
  Zap,
  BookOpen,
  Building2
} from 'lucide-react';

// Import your existing components
import CVProfile from '@/components/candidate/CVProfile';
import JobMatches from '@/components/candidate/JobMatches';
import ApplicationTracker from '@/components/candidate/ApplicationTracker';
import Messages from '@/components/candidate/Messages';
import CandidateInterviews from '@/components/candidate/Interviews';
import { CandidateOffers } from '@/components/candidate/CandidateOffers';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { restClient } from '@/utils/api';
import { useUnreadMessageCount } from '@/hooks/useUnreadMessageCount';
import { useAuth } from '@/context/AuthContext';
import { profileSnapshotAPI, type RecommendedJob, type ProfileSnapshot } from '@/services/intelligenceAPI';

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

/* ─── Circular Progress Ring ─── */
const CircularProgress: React.FC<{ value: number; size?: number; strokeWidth?: number }> = ({
  value, size = 120, strokeWidth = 10
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="#E5E7EB" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="#006E6D" strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" className="transition-all duration-1000 ease-out" />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        className="fill-slate-900 text-2xl font-bold" transform={`rotate(90, ${size / 2}, ${size / 2})`}>
        {value}%
      </text>
    </svg>
  );
};

// Lazy-load MyCompanyView so it only loads when the tab is shown
const MyCompanyView = React.lazy(() => import('@/pages/workspace/MyCompanyView'));

const CandidateDashboard: React.FC = () => {
  const { i18n } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
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

  // Intelligence data
  const [recommendedJobs, setRecommendedJobs] = useState<RecommendedJob[]>([]);
  const [aiInsight, setAiInsight] = useState<{ en: string; ar: string } | null>(null);
  const [topGaps, setTopGaps] = useState<any[]>([]);
  const [quickWins, setQuickWins] = useState<any[]>([]);
  const [readinessScore, setReadinessScore] = useState<number>(0);

  // Bilingual helper
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  const { unreadCount } = useUnreadMessageCount();

  useEffect(() => {
    // Check for hash
    if (location.hash) {
      const tab = location.hash.replace('#', '');
      if (['overview', 'profile', 'jobs', 'applications', 'interviews', 'messages', 'company'].includes(tab)) {
        setActiveTab(tab);
        return;
      }
      // Redirect old 'offers' tab to 'applications'
      if (tab === 'offers') {
        setActiveTab('applications');
        return;
      }
    }

    // Check for query param
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'profile', 'jobs', 'applications', 'interviews', 'messages', 'company'].includes(tab)) {
      setActiveTab(tab);
    } else if (tab === 'offers') {
      setActiveTab('applications');
    }
  }, [location]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, readinessRes] = await Promise.allSettled([
          restClient.get('/api/candidate/dashboard/stats'),
          restClient.get('/api/v2/profile/readiness'),
        ]);

        if (statsRes.status === 'fulfilled' && statsRes.value.data.success) {
          const result = statsRes.value.data;
          setDashboardData(prev => ({
            ...prev,
            profile: { ...prev.profile, ...result.data.profile },
            stats: { ...prev.stats, ...result.data.stats },
            recentActivity: result.data.recentActivity || []
          }));
        }

        // Override completionPercentage with holistic readiness score
        if (readinessRes.status === 'fulfilled' && readinessRes.value.data.success) {
          setDashboardData(prev => ({
            ...prev,
            profile: { ...prev.profile, completionPercentage: readinessRes.value.data.overall }
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

  // Fetch intelligence data (non-blocking — dashboard loads fast, intelligence fills in)
  useEffect(() => {
    const fetchIntelligence = async () => {
      try {
        const [snapshotResult, jobsResult] = await Promise.allSettled([
          profileSnapshotAPI.getSnapshot(),
          profileSnapshotAPI.getRecommendedJobs(),
        ]);

        if (snapshotResult.status === 'fulfilled') {
          const snap = snapshotResult.value;
          setAiInsight(snap.ai_insight);
          setTopGaps(snap.gap_analysis?.top_gaps || []);
          setQuickWins(snap.recommendations?.quick_wins || []);
          setReadinessScore(snap.gap_analysis?.readiness_score || 0);
        }

        if (jobsResult.status === 'fulfilled') {
          setRecommendedJobs(jobsResult.value.jobs || []);
        }
      } catch (err) {
        console.error('Intelligence fetch error (non-critical):', err);
      }
    };

    fetchIntelligence();
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

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'application': return 'bg-blue-100 border-blue-200';
      case 'interview': return 'bg-purple-100 border-purple-200';
      case 'profile_view': return 'bg-green-100 border-green-200';
      case 'job_match': return 'bg-orange-100 border-orange-200';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          <span className="text-slate-600 font-dubai-medium">{t('Loading dashboard...', 'جاري تحميل لوحة التحكم...')}</span>
        </div>
      </div>
    );
  }

  // Names arrive from the Emirates-ID record in ALL CAPS ("ABDULAZIZ ESSA AHMAD
  // ALFALAHI"), which reads as shouting in a greeting. Title-case for display
  // only. No-op for Arabic (the script is caseless), so this is RTL-safe.
  const toTitleCase = (s: string) =>
    s.replace(/\S+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  const firstName = toTitleCase(dashboardData.profile.name.split(' ')[0]);

  const recentActivity = dashboardData.recentActivity;

  // Stat card config
  const statCards = [
    { label: t('Profile Views', 'مشاهدات الملف'), value: dashboardData.stats.profileViews, icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: t('Job Matches', 'الوظائف المطابقة'), value: dashboardData.stats.jobMatches, icon: Target, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
    { label: t('Applications', 'الطلبات'), value: dashboardData.stats.applications, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
    { label: t('Interviews', 'المقابلات'), value: dashboardData.stats.interviews, icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
  ];

  return (
    <div className={`min-h-screen bg-[#FAFBFC] ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <HybridGovernmentNavFixed
        showAuthButtons={false}
        currentPage="dashboard"
        userRole="job seeker"
        currentLanguage={language}
        onLanguageToggle={toggleLanguage}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ─── Welcome Header ─── */}
        <div className="flex justify-between items-start py-6">
          <div className="flex items-center gap-4">
            <div className="relative group w-14 h-14 rounded-full overflow-hidden shadow-lg ring-2 ring-teal-100 transform hover:scale-105 transition-transform duration-200">
              {dashboardData.profile.profile_photo_url ? (
                <img
                  src={dashboardData.profile.profile_photo_url || ''}
                  alt={dashboardData.profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
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
                      const response = await restClient.post('/api/profile/candidate/photo', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
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
              <h1 className="text-2xl font-bold text-slate-900 animate-in fade-in slide-in-from-left-4 duration-500">
                {dashboardData.profile.name === 'New Member'
                  ? t('Welcome!', '!مرحباً')
                  : (() => {
                    const hour = new Date().getHours();
                    const greeting = hour < 12 ? t('Good morning', 'صباح الخير') : hour < 17 ? t('Good afternoon', 'مساء الخير') : t('Good evening', 'مساء الخير');
                    // Arabic uses its own comma (U+060C), not the Latin one.
                    return `${greeting}${isRTL ? '، ' : ', '}${firstName}`;
                  })()}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-sm text-slate-500">
                  {new Date().toLocaleDateString(isRTL ? 'ar-AE' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <Badge className="bg-teal-50 text-teal-700 border border-teal-200 text-xs font-dubai-medium">
                  {t('Candidate Status: Active', 'حالة المرشح: نشط')}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {!dashboardData.profile.cvUploaded && (
          <div className="pt-2 mb-6">
            <Alert className="border-teal-200 bg-teal-50/80 shadow-sm backdrop-blur-sm">
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

        <div className="py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <TabsList className={`grid w-full ${user?.company_id ? 'grid-cols-8' : 'grid-cols-7'} bg-white p-1.5 rounded-xl shadow-sm border border-slate-200/80`}>
              <TabsTrigger value="overview" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-lg text-sm">{t('Overview', 'نظرة عامة')}</TabsTrigger>
              <TabsTrigger value="profile" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-lg text-sm">{t('Profile & CV', 'الملف والسيرة')}</TabsTrigger>
              <TabsTrigger value="jobs" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-lg text-sm">{t('Job Matches', 'الوظائف المطابقة')}</TabsTrigger>
              <TabsTrigger value="applications" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-lg text-sm">{t('Applications', 'الطلبات')}</TabsTrigger>
              <TabsTrigger value="offers" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-lg text-sm">{t('Offers', 'العروض')}</TabsTrigger>
              <TabsTrigger value="interviews" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-lg text-sm">{t('Interviews', 'المقابلات')}</TabsTrigger>
              <TabsTrigger value="messages" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-lg text-sm">
                {t('Messages', 'الرسائل')}
                {unreadCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full min-w-[18px]">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </TabsTrigger>
              {user?.company_id && (
                <TabsTrigger value="company" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-lg text-sm">
                  <Building2 className="h-3.5 w-3.5" style={{ marginInlineEnd: 4 }} />
                  {t('My Company', 'شركتي')}
                </TabsTrigger>
              )}
            </TabsList>

            {/* ════════════════════════════════════════════════════════════
                              ENHANCED OVERVIEW TAB
               ════════════════════════════════════════════════════════════ */}
            <TabsContent value="overview" className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

              {/* ─── 3-Column Layout: Sidebar + Main + Right Panel ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>

                {/* Left Sidebar — Profile Status + Quick Actions */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Profile Readiness */}
                  <Card className="bg-white border border-slate-200/80">
                    <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                      <CardTitle className="flex items-center gap-2 text-base text-slate-800">
                        <User className="h-4 w-4 text-teal-600" />
                        {t('Profile Readiness', 'جاهزية الملف')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-5 flex flex-col items-center">
                      <CircularProgress value={dashboardData.profile.completionPercentage} />
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs text-slate-500">{t('ATS Compatibility', 'توافق ATS')}</span>
                        <Badge className={`text-[10px] ${(dashboardData.profile.ats_score || 0) >= 80 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                          {(dashboardData.profile.ats_score || 0) >= 80 ? t('High', 'عالي') : t('Medium', 'متوسط')}
                        </Badge>
                      </div>
                      <Button
                        onClick={() => navigate('/candidate/profile')}
                        variant="outline"
                        size="sm"
                        className="w-full mt-4 text-xs font-dubai-medium text-teal-700 border-teal-200 hover:bg-teal-50"
                      >
                        {t('Improve Readiness →', 'حسّن الجاهزية ←')}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card className="bg-white border border-slate-200/80">
                    <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                      <CardTitle className="flex items-center gap-2 text-base text-slate-800">
                        <TrendingUp className="h-4 w-4 text-teal-600" />
                        {t('Quick Actions', 'إجراءات سريعة')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-2">
                      <Button variant="outline" className="w-full justify-start text-sm h-10 hover:bg-teal-50 hover:text-teal-700" onClick={() => navigate('/candidate/profile')}>
                        <Upload className="h-4 w-4 text-teal-600" style={{ marginInlineEnd: 10 }} />
                        {t('Upload Latest CV', 'ارفع أحدث سيرة ذاتية')}
                      </Button>
                      <Button variant="outline" className="w-full justify-start text-sm h-10 hover:bg-teal-50 hover:text-teal-700" onClick={() => setActiveTab('jobs')}>
                        <Search className="h-4 w-4 text-blue-500" style={{ marginInlineEnd: 10 }} />
                        {t('Browse New Jobs', 'تصفح الوظائف الجديدة')}
                      </Button>
                      <Button variant="outline" className="w-full justify-start text-sm h-10 hover:bg-teal-50 hover:text-teal-700" onClick={() => navigate('/mentorship')}>
                        <Users className="h-4 w-4 text-purple-500" style={{ marginInlineEnd: 10 }} />
                        {t('Find a Mentor', 'ابحث عن مرشد')}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Center — Stat Cards + Recommended Jobs */}
                <div className="lg:col-span-6 space-y-6">
                  {/* Stat Cards (2x2 grid) */}
                  <div className="grid grid-cols-2 gap-4">
                    {statCards.map((stat, i) => (
                      <Card key={i} className={`bg-white border ${stat.border} hover:shadow-md transition-all duration-200 group`}>
                        <CardContent className="pt-5 pb-4 px-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                              <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                              </div>
                            </div>
                            <div className={`p-3 ${stat.bg} rounded-xl group-hover:scale-110 transition-transform`}>
                              <stat.icon className={`h-5 w-5 ${stat.color}`} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Recommended for You */}
                  <Card className="bg-white border border-slate-200/80">
                    <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base text-slate-800">
                          <Target className="h-4 w-4 text-teal-600" />
                          {t('Recommended for You', 'موصى به لك')}
                        </CardTitle>
                        <Button variant="link" size="sm" className="text-xs text-teal-600" onClick={() => setActiveTab('jobs')}>
                          {/* Arrow must follow reading direction. Arrows written
                              INSIDE t() already flip; these bare ones did not. */}
                          {t('View All', 'عرض الكل')} {isRTL ? '←' : '→'}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-3 space-y-3">
                      {recommendedJobs.length > 0 ? recommendedJobs.slice(0, 3).map((job, i) => (
                        <div key={i} className="p-4 rounded-lg border border-slate-100 hover:border-teal-200 hover:shadow-sm transition-all cursor-pointer group">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500 flex-shrink-0">
                                {(job.company || '?').charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-800 group-hover:text-teal-700 transition-colors">{isRTL && (job as any).title_ar ? (job as any).title_ar : job.title}</p>
                                <p className="text-xs text-slate-500">{isRTL && (job as any).company_ar ? (job as any).company_ar : job.company}</p>
                                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                                  <span>📍 {job.location || 'UAE'}</span>
                                  <span>💰 {job.salary}</span>
                                  <span>🏢 {job.type}</span>
                                  {job.source === 'live' && <Badge className="bg-green-50 text-green-600 text-[9px] border-green-200">{t('Live', 'مباشر')}</Badge>}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge className="bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-bold">
                                ✦ {job.match_score}% {t('Match', 'تطابق')}
                              </Badge>
                              {(job as any).hasApplied ? (
                                <Badge className="bg-green-100 text-green-800 border-none text-[11px] font-medium py-1 px-2.5 flex items-center gap-1">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  {t('Applied', 'تم التقديم')}
                                </Badge>
                              ) : (
                                <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-7 px-3" onClick={(e) => { e.stopPropagation(); setActiveTab('jobs'); }}>
                                  {t('Apply Now', 'قدّم الآن')}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-6 text-slate-400">
                          <p className="text-sm">{t('Upload your CV to get personalized job recommendations', 'ارفع سيرتك الذاتية للحصول على توصيات وظيفية مخصصة')}</p>
                          <Button variant="link" size="sm" className="text-teal-600 mt-1" onClick={() => setActiveTab('jobs')}>
                            {t('Browse All Jobs', 'تصفح جميع الوظائف')} {isRTL ? '←' : '→'}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card className="bg-white border border-slate-200/80">
                    <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                      <CardTitle className="flex items-center gap-2 text-base text-slate-800">
                        <Clock className="h-4 w-4 text-teal-600" />
                        {t('Recent Activity', 'النشاط الأخير')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3">
                      <div className="space-y-1">
                        {recentActivity.length > 0 ? (
                          recentActivity.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50/80 transition-colors cursor-pointer group">
                              <div className={`p-2 rounded-lg border ${getActivityColor(activity.type)} flex-shrink-0 mt-0.5`}>
                                {getActivityIcon(activity.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800 group-hover:text-teal-700 transition-colors">{activity.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{activity.description}</p>
                              </div>
                              <span className="text-xs text-slate-400 flex-shrink-0 mt-1">{activity.timestamp}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-slate-400">
                            <p className="text-sm">{t('No recent activity yet. Start applying to jobs!', 'لا توجد نشاطات أخيرة بعد. ابدأ بالتقدم للوظائف!')}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Sidebar — AI Career Insight + Upcoming Events */}
                <div className="lg:col-span-3 space-y-6">
                  {/* AI Career Insight — LIVE */}
                  <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-xl p-5 text-white shadow-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-100">
                        {t('AI Career Insight', 'رؤية مهنية بالذكاء الاصطناعي')}
                      </span>
                    </div>
                    <p className="text-sm text-teal-50 leading-relaxed mb-4">
                      {aiInsight
                        ? (isRTL ? aiInsight.ar : aiInsight.en)
                        : t(
                          'Upload your CV and complete your profile to get AI-powered job matches and personalized career recommendations.',
                          'ارفع سيرتك الذاتية وأكمل ملفك للحصول على مطابقات وظيفية ذكية وتوصيات مهنية مخصصة.'
                        )}
                    </p>
                    {readinessScore > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1 bg-white/20 rounded-full h-2">
                          <div className="bg-white rounded-full h-2 transition-all duration-1000" style={{ width: `${readinessScore}%` }} />
                        </div>
                        <span className="text-xs text-teal-100 font-bold">{readinessScore}%</span>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      // CONTRAST FIX: variant="outline" sets bg-background (white);
                      // combined with text-white the label was invisible and the
                      // control rendered as a blank white box on the teal card.
                      // Force a transparent ground so the white label is legible.
                      className="bg-transparent border-white/40 text-white hover:bg-white/15 hover:text-white text-xs rounded-lg w-full focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-0"
                      onClick={() => navigate('/career-advisory')}
                    >
                      {t('Explore Recommendations', 'استكشف التوصيات')}
                    </Button>
                  </div>

                  {/* Skill Gaps — LIVE */}
                  {topGaps.length > 0 && (
                    <Card className="bg-white border border-slate-200/80">
                      <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                        <CardTitle className="flex items-center gap-2 text-base text-slate-800">
                          <Zap className="h-4 w-4 text-amber-500" />
                          {t('Skill Gaps', 'فجوات المهارات')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-3 space-y-2">
                        {topGaps.slice(0, 3).map((gap: any, i: number) => (
                          <div key={i} className="p-2.5 rounded-lg border border-slate-100 hover:border-amber-200 transition-colors">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-slate-700">{gap.skill_name}</span>
                              <Badge className={`text-[9px] ${gap.priority >= 0.7 ? 'bg-red-50 text-red-600 border-red-200' :
                                  gap.priority >= 0.4 ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                    'bg-blue-50 text-blue-600 border-blue-200'
                                }`}>
                                {gap.priority >= 0.7 ? t('High Priority', 'أولوية عالية') :
                                  gap.priority >= 0.4 ? t('Medium', 'متوسط') : t('Low', 'منخفض')}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                              <span>{gap.current_level || t('None', 'لا يوجد')}</span>
                              <span>{isRTL ? '←' : '→'}</span>
                              <span className="text-teal-600 font-medium">{gap.required_level}</span>
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs text-amber-700 border-amber-200 hover:bg-amber-50 mt-1"
                          onClick={() => navigate('/career-advisory')}
                        >
                          {t('View Full Analysis →', 'عرض التحليل الكامل ←')}
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Quick Win Recommendations — LIVE */}
                  {quickWins.length > 0 && (
                    <Card className="bg-white border border-slate-200/80">
                      <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                        <CardTitle className="flex items-center gap-2 text-base text-slate-800">
                          <BookOpen className="h-4 w-4 text-green-600" />
                          {t('Quick Wins', 'إنجازات سريعة')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-3 space-y-2">
                        {quickWins.slice(0, 2).map((rec: any, i: number) => (
                          <div key={i} className="p-2.5 rounded-lg border border-slate-100 hover:border-green-200 transition-colors cursor-pointer"
                            onClick={() => rec.action_url && navigate(rec.action_url)}>
                            <p className="text-xs font-medium text-slate-700">
                              {isRTL && rec.title_ar ? rec.title_ar : rec.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className="text-[9px] bg-green-50 text-green-600 border-green-200">{rec.type}</Badge>
                              <span className="text-[10px] text-slate-400">{rec.effort}</span>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}


                </div>

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

            <TabsContent value="offers" className="space-y-6 mt-6">
              <CandidateOffers />
            </TabsContent>

            <TabsContent value="interviews" className="space-y-6 mt-6">
              <CandidateInterviews />
            </TabsContent>

            <TabsContent value="messages" className="space-y-6 mt-6">
              <Messages />
            </TabsContent>

            {user?.company_id && (
              <TabsContent value="company" className="space-y-6 mt-6">
                <React.Suspense fallback={
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                  </div>
                }>
                  <MyCompanyView />
                </React.Suspense>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard;
