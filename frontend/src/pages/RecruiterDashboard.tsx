import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { useLanguage } from '@/context/EnhancedLanguageContext';
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
  Star,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import EmiratizationROICalculatorDialog from '@/components/recruiter/EmiratizationROICalculatorDialog';
import { useUnreadMessageCount } from '@/hooks/useUnreadMessageCount';


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
  const { i18n } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
  const isRTL = i18n.language === 'ar';
  const b = (en: string, ar: string) => isRTL ? ar : en;
  const currentTab = searchParams.get('tab') || 'overview';
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [sourceCandidatesDialogOpen, setSourceCandidatesDialogOpen] = useState(false);
  const [roiCalculatorOpen, setRoiCalculatorOpen] = useState(false);
  const { unreadCount } = useUnreadMessageCount();

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
  const firstName = recruiterName.split(' ')[0];

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
    if (isRTL) {
      if (hour < 12) return 'صباح الخير';
      if (hour < 18) return 'مساء الخير';
      return 'مساء الخير';
    }
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };


  // Stat cards config
  const statCards = [
    { label: b('Placements This Year', 'التوظيفات هذا العام'), value: dashboardData.placements.thisYear, icon: Target, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', sub: `${b('Target', 'الهدف')}: ${dashboardData.placements.target}` },
    { label: b('Active Searches', 'عمليات البحث النشطة'), value: dashboardData.pipeline.activeSearches, icon: Briefcase, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', sub: b('Across all postings', 'عبر جميع الإعلانات') },
    { label: b('Avg. Time to Fill', 'متوسط وقت الشغل'), value: `${dashboardData.performance.averageTimeToFill}${b('d', 'ي')}`, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', sub: b('Average across roles', 'المتوسط عبر الأدوار') },
    { label: b('Placement Rate', 'معدل التوظيف'), value: `${dashboardData.performance.placementRate}%`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', sub: b('Of total positions', 'من إجمالي الوظائف') },
  ];

  return (
    <div className={`min-h-screen bg-[#FAFBFC] font-dubai ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Navigation */}
      <HybridGovernmentNavFixed showAuthButtons={true} currentLanguage={language} onLanguageToggle={toggleLanguage} />

      {/* Main Content */}
      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ─── Enhanced Header ─── */}
          <div className="mb-6">
            <div className="flex items-center justify-between" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
              <div className="flex items-center gap-4" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {firstName.charAt(0)}
                </div>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <div className="flex items-center gap-3" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                    <h1 className="text-2xl font-dubai-bold text-slate-900">
                      {getGreeting()}، {firstName}
                    </h1>
                    {userData.role && (
                      <Badge className="bg-teal-50 text-teal-700 border border-teal-200 text-xs font-dubai-medium capitalize">
                        {userData.role.replace(/_/g, ' ')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 font-dubai-medium mt-0.5">
                    {isRTL
                      ? <>لديك <span className="text-teal-600 font-bold">{dashboardData.pipeline.activeSearches} عملية بحث نشطة</span> و <span className="text-teal-600 font-bold">{dashboardData.pipeline.interviewsScheduled} مقابلة</span> مجدولة.</>
                      : <>You have <span className="text-teal-600 font-bold">{dashboardData.pipeline.activeSearches} active searches</span> and <span className="text-teal-600 font-bold">{dashboardData.pipeline.interviewsScheduled} interviews</span> scheduled.</>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                <Button variant="outline" size="sm" className="font-dubai-medium flex items-center gap-2" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                  <Settings className="h-4 w-4" />
                  {b('Settings', 'الإعدادات')}
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-3" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
              <Link to="/recruiter/jd-builder" className="inline-block">
                <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium shadow-sm flex items-center gap-2" style={{ direction: isRTL ? 'rtl' : 'ltr' }} aria-label={b('Create new vacancy', 'إنشاء وظيفة جديدة')}>
                  <Plus className="h-4 w-4" />
                  {b('Post New Job', 'نشر وظيفة جديدة')}
                </Button>
              </Link>
              <Button variant="outline" className="font-dubai-medium bg-white hover:bg-slate-50 flex items-center gap-2" style={{ direction: isRTL ? 'rtl' : 'ltr' }} onClick={() => setSourceCandidatesDialogOpen(true)}>
                <UserPlus className="h-4 w-4" />
                {b('Source Candidates', 'البحث عن مرشحين')}
              </Button>
              <Button variant="outline" className="font-dubai-medium bg-white hover:bg-slate-50 flex items-center gap-2" style={{ direction: isRTL ? 'rtl' : 'ltr' }} onClick={() => setRoiCalculatorOpen(true)}>
                <Calculator className="h-4 w-4" />
                {b('ROI Calculator', 'حاسبة العائد')}
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200/80" dir={isRTL ? 'rtl' : 'ltr'} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
              <TabsTrigger value="overview" className="font-dubai-medium data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-lg text-sm" onClick={() => handleTabChange('overview')}>{b('Overview', 'نظرة عامة')}</TabsTrigger>
              <TabsTrigger value="jobs" className="font-dubai-medium data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-lg text-sm" onClick={() => handleTabChange('jobs')}>{b('My Jobs', 'وظائفي')}</TabsTrigger>
              <TabsTrigger value="candidates" className="font-dubai-medium data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-lg text-sm" onClick={() => handleTabChange('candidates')}>{b('Candidates', 'المرشحون')}</TabsTrigger>
              <TabsTrigger value="interviews" className="font-dubai-medium data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-lg text-sm" onClick={() => handleTabChange('interviews')}>{b('Interviews', 'المقابلات')}</TabsTrigger>
              <TabsTrigger value="messages" className="font-dubai-medium data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-lg text-sm" onClick={() => handleTabChange('messages')}>
                {b('Messages', 'الرسائل')}
                {unreadCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full min-w-[18px]">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="offers" className="font-dubai-medium data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-lg text-sm" onClick={() => handleTabChange('offers')}>{b('Offers', 'العروض')}</TabsTrigger>
            </TabsList>

            {/* ════════════════════════════════════════════════════════════
                              ENHANCED OVERVIEW TAB
               ════════════════════════════════════════════════════════════ */}
            <TabsContent value="overview" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

              {/* ─── Stat Cards ─── */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                  <Card key={i} className={`bg-white border ${stat.border} hover:shadow-md transition-all duration-200 group`}>
                    <CardContent className="pt-5 pb-4 px-5">
                      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={isRTL ? 'text-right' : 'text-left'}>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1 font-dubai-medium">{stat.label}</p>
                          <p className="text-3xl font-dubai-bold text-slate-900">{stat.value}</p>
                          <p className="text-xs text-slate-400 mt-0.5 font-dubai-medium">{stat.sub}</p>
                        </div>
                        <div className={`p-3 ${stat.bg} rounded-xl group-hover:scale-110 transition-transform`}>
                          <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* ─── My Active Jobs + Upcoming Interviews ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* My Active Jobs — 2 cols */}
                <Card className="lg:col-span-2 bg-white border border-slate-200/80">
                  <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                      <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold">
                        <Briefcase className="h-4 w-4 text-teal-600" />
                        {b('My Active Jobs', 'وظائفي النشطة')}
                      </CardTitle>
                      <Button variant="link" size="sm" className="text-xs text-teal-600 font-dubai-medium" onClick={() => handleTabChange('jobs')}>
                        {b('View All', 'عرض الكل')} →
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-3 px-0">
                    <table className="w-full text-sm" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className={`px-5 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider font-dubai-medium ${isRTL ? 'text-right' : 'text-left'}`}>{b('Job Title', 'المسمى الوظيفي')}</th>
                          <th className={`px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider font-dubai-medium ${isRTL ? 'text-right' : 'text-left'}`}>{b('Applicants', 'المتقدمون')}</th>
                          <th className={`px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider font-dubai-medium ${isRTL ? 'text-right' : 'text-left'}`}>{b('Status', 'الحالة')}</th>
                          <th className={`px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider font-dubai-medium ${isRTL ? 'text-right' : 'text-left'}`}>{b('Posted', 'تاريخ النشر')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { title: b('Senior Software Engineer', 'مهندس برمجيات أول'), applicants: 45, status: 'active', posted: b('10 days ago', 'قبل 10 أيام') },
                          { title: b('Marketing Director', 'مدير تسويق'), applicants: 120, status: 'reviewing', posted: b('5 days ago', 'قبل 5 أيام') },
                          { title: b('HR Business Partner', 'شريك أعمال الموارد البشرية'), applicants: 32, status: 'active', posted: b('25 days ago', 'قبل 25 يوماً') },
                        ].map((job, i) => (
                          <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer">
                            <td className="px-5 py-3 font-dubai-medium text-slate-800">{job.title}</td>
                            <td className="px-3 py-3 font-dubai text-slate-600">{job.applicants}</td>
                            <td className="px-3 py-3">
                              <Badge className={`text-[10px] font-dubai-medium ${job.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                {job.status === 'active' ? b('Active', 'نشط') : b('Reviewing', 'قيد المراجعة')}
                              </Badge>
                            </td>
                            <td className="px-3 py-3 text-xs text-slate-400 font-dubai">{job.posted}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>

                {/* Right Column — Upcoming Interviews + Messages */}
                <div className="space-y-6">
                  {/* Upcoming Interviews */}
                  <Card className="bg-white border border-slate-200/80">
                    <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                      <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                        <Calendar className="h-4 w-4 text-teal-600" />
                        {b('Upcoming Interviews', 'المقابلات القادمة')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3">
                      <div className="space-y-3">
                        {[
                          { name: b('Fatima Khalid', 'فاطمة خالد'), role: b('Financial Analyst', 'محللة مالية'), time: '10:00 AM', initials: isRTL ? 'فخ' : 'FK', bg: 'bg-teal-100 text-teal-700' },
                          { name: b('Omar Saeed', 'عمر سعيد'), role: b('Project Manager', 'مدير مشاريع'), time: '2:30 PM', initials: isRTL ? 'عس' : 'OS', bg: 'bg-indigo-100 text-indigo-700' },
                          { name: b('Aisha Al Suwaidi', 'عائشة السويدي'), role: b('Data Scientist', 'عالمة بيانات'), time: '4:00 PM', initials: isRTL ? 'عس' : 'AS', bg: 'bg-purple-100 text-purple-700' },
                        ].map((interview, i) => (
                          <div key={i} className="p-3 rounded-lg border border-slate-100 hover:border-teal-200 transition-colors" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${interview.bg}`}>
                                {interview.initials}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-dubai-medium text-slate-800">{interview.name}</p>
                                <p className="text-xs text-slate-400 font-dubai">{interview.role}</p>
                              </div>
                              <span className="text-xs text-teal-600 font-dubai-bold">{interview.time}</span>
                            </div>
                            <Button size="sm" variant="outline" className="w-full mt-2 text-xs font-dubai-medium text-teal-700 border-teal-200 hover:bg-teal-50">
                              ▶ {b('Join Call', 'انضم للمكالمة')}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Messages Preview */}
                  <Card className="bg-white border border-slate-200/80">
                    <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                      <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                        <Bell className="h-4 w-4 text-teal-600" />
                        {b('Recent Messages', 'الرسائل الأخيرة')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3">
                      <div className="space-y-3">
                        {[
                          { name: b('Sultan Nayef', 'سلطان نايف'), msg: b('Thank you for the update. I\'ll prepare…', 'شكراً على التحديث. سأجهز…'), time: b('1 hr ago', 'منذ ساعة') },
                          { name: b('Layla Mahmoud', 'ليلى محمود'), msg: b('Can you reschedule tomorrow\'s interview?', 'هل يمكنك إعادة جدولة مقابلة الغد؟'), time: b('3 hrs ago', 'منذ 3 ساعات') },
                        ].map((m, i) => (
                          <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">{m.name.charAt(0)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-dubai-medium text-slate-800">{m.name}</p>
                                <span className="text-[10px] text-slate-400 font-dubai">{m.time}</span>
                              </div>
                              <p className="text-xs text-slate-500 font-dubai truncate">{m.msg}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button variant="link" size="sm" className="text-xs text-teal-600 mt-2 font-dubai-medium w-full" onClick={() => handleTabChange('messages')}>
                        {b('View All Messages', 'عرض كل الرسائل')} →
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* ─── Recent Applicants (existing component) ─── */}
              <RecentApplicants
                limit={5}
                onViewAll={() => handleTabChange('jobs')}
              />

              {/* Recent Activity */}
              <Card className="bg-white border border-slate-200/80">
                <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                  <CardTitle className="font-dubai-bold text-slate-900 text-base">{b('Recent Activity', 'النشاط الأخير')}</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-500 text-xs">
                    {b('Latest updates from your recruitment activities', 'آخر التحديثات من أنشطة التوظيف')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="space-y-2">
                    {dashboardData.activity.length > 0 ? (
                      dashboardData.activity.slice(0, 4).map((activity) => (
                        <div key={activity.id} className={`flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                          <div className="flex-shrink-0 mt-0.5">
                            {activity.type === 'placement_success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                            {activity.type === 'interview_scheduled' && <Calendar className="h-4 w-4 text-blue-500" />}
                            {activity.type === 'new_requirement' && <Briefcase className="h-4 w-4 text-purple-500" />}
                            {activity.type === 'candidate_sourced' && <UserPlus className="h-4 w-4 text-orange-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <p className="text-sm font-dubai-medium text-slate-800">{activity.title}</p>
                              {activity.priority && (
                                <Badge
                                  variant={activity.priority === 'high' ? 'destructive' : 'secondary'}
                                  className="text-[10px] shrink-0"
                                >
                                  {activity.priority}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 font-dubai mt-0.5">{activity.description}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 font-dubai-medium py-4 text-center">{b('No recent activity', 'لا يوجد نشاط حديث')}</p>
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
    </div >
  );
};

export default RecruiterDashboard;
