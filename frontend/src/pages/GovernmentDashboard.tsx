import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { restClient } from '@/utils/api';
import { getDisplayName } from '@/utils/nameUtils';
import ComplianceTab from '@/components/government/ComplianceTab';
import NafisTab from '@/components/government/NafisTab';
import MegaProjectsTab from '@/components/government/MegaProjectsTab';
import CareerEventsTab from '@/components/government/CareerEventsTab';
import {
  Target,
  TrendingUp,
  Users,
  BarChart3,
  FileText,
  Building2,
  GraduationCap,
  Settings,
  Download,
  ChevronRight,
  Activity,
  Shield,
  Globe,
  Landmark,
  CheckCircle,
  AlertTriangle,
  Clock,
  Briefcase
} from 'lucide-react';

// ── Data Interfaces ────────────────────────────────────────────────
interface SectorData {
  sector: string;
  sectorAr?: string;
  rate: number;
  target: number;
  employees: number;
}

interface InitiativeData {
  id: number;
  name: string;
  nameAr?: string;
  status: 'active' | 'completed' | 'planned';
  beneficiaries: number;
  completionRate: number;
}

interface ActivityItem {
  id: number;
  type: 'policy' | 'program' | 'milestone' | 'report';
  message: string;
  messageAr?: string;
  time: string;
  timeAr?: string;
}

interface GovernmentData {
  emiratization: {
    overallRate: number;
    targetRate: number;
    totalEmiratiEmployees: number;
    monthlyGrowth: number;
    sectorBreakdown: SectorData[];
  };
  workforce: {
    totalWorkforce: number;
    unemploymentRate: number;
    skillsGapIndex: number;
    trainingPrograms: number;
  };
  initiatives: {
    activePrograms: number;
    beneficiaries: number;
    completionRate: number;
    successStories: number;
    list: InitiativeData[];
  };
  activity: ActivityItem[];
}

// ── Component ──────────────────────────────────────────────────────
const GovernmentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { i18n } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
  const isRTL = i18n.language === 'ar';
  const b = (en: string, ar: string) => isRTL ? ar : en;
  const currentTab = searchParams.get('tab') || 'overview';

  // ── User Data ──────────────────────────────────────────────────
  const getUserData = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : {};
    } catch {
      return {};
    }
  };
  const userData = getUserData();
  const userName = getDisplayName(userData, b('Government Representative', 'ممثل حكومي'));
  const firstName = userName.split(' ')[0];

  // ── Tab Navigation ─────────────────────────────────────────────
  const handleTabChange = (value: string) => {
    navigate(`/government-dashboard?tab=${value}`, { replace: true });
  };

  // ── Dashboard Data ─────────────────────────────────────────────
  const [dashboardData, setDashboardData] = useState<GovernmentData>({
    emiratization: {
      overallRate: 0,
      targetRate: 75,
      totalEmiratiEmployees: 0,
      monthlyGrowth: 0,
      sectorBreakdown: []
    },
    workforce: {
      totalWorkforce: 0,
      unemploymentRate: 0,
      skillsGapIndex: 0,
      trainingPrograms: 0
    },
    initiatives: {
      activePrograms: 0,
      beneficiaries: 0,
      completionRate: 0,
      successStories: 0,
      list: []
    },
    activity: []
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await restClient.get('/api/education/government/dashboard');
      if (response.data && response.data.emiratization) {
        // Safely merge API data with defaults — API may not have all fields
        const apiData = response.data;
        setDashboardData(prev => ({
          emiratization: {
            overallRate: apiData.emiratization?.overallRate ?? apiData.emiratization?.emiratizationRate ?? prev.emiratization.overallRate,
            targetRate: apiData.emiratization?.targetRate ?? prev.emiratization.targetRate,
            totalEmiratiEmployees: apiData.emiratization?.totalEmiratiEmployees ?? prev.emiratization.totalEmiratiEmployees,
            monthlyGrowth: apiData.emiratization?.monthlyGrowth ?? prev.emiratization.monthlyGrowth,
            sectorBreakdown: (apiData.emiratization?.sectorBreakdown || prev.emiratization.sectorBreakdown).map((s: any) => ({
              sector: s.sector || '',
              sectorAr: s.sectorAr || '',
              rate: s.rate ?? 0,
              target: s.target ?? 75,
              employees: s.employees ?? 0,
            })),
          },
          workforce: { ...prev.workforce, ...apiData.workforce },
          initiatives: { ...prev.initiatives, ...apiData.initiatives, list: apiData.initiatives?.list || prev.initiatives.list },
          activity: apiData.activity || prev.activity,
        }));
      } else {
        setMockData();
      }
    } catch {
      console.log('⚠️ Using fallback data for government dashboard');
      setMockData();
    }
  };

  const setMockData = () => {
    setDashboardData({
      emiratization: {
        overallRate: 67.3,
        targetRate: 75.0,
        totalEmiratiEmployees: 45678,
        monthlyGrowth: 2.1,
        sectorBreakdown: [
          { sector: 'Banking & Finance', sectorAr: 'المصارف والمالية', rate: 78.5, target: 80, employees: 12450 },
          { sector: 'Government', sectorAr: 'القطاع الحكومي', rate: 89.2, target: 90, employees: 18930 },
          { sector: 'Healthcare', sectorAr: 'الرعاية الصحية', rate: 45.7, target: 60, employees: 5670 },
          { sector: 'Technology', sectorAr: 'التكنولوجيا', rate: 52.3, target: 65, employees: 4230 },
          { sector: 'Energy', sectorAr: 'الطاقة', rate: 71.8, target: 75, employees: 8920 },
          { sector: 'Hospitality', sectorAr: 'الضيافة', rate: 38.4, target: 50, employees: 3120 },
        ]
      },
      workforce: {
        totalWorkforce: 156789,
        unemploymentRate: 3.2,
        skillsGapIndex: 23.4,
        trainingPrograms: 47
      },
      initiatives: {
        activePrograms: 23,
        beneficiaries: 8934,
        completionRate: 84.7,
        successStories: 156,
        list: [
          { id: 1, name: 'Digital Skills Accelerator', nameAr: 'مسرّع المهارات الرقمية', status: 'active', beneficiaries: 2340, completionRate: 72 },
          { id: 2, name: 'STEM Talent Pipeline', nameAr: 'مسار مواهب العلوم والتكنولوجيا', status: 'active', beneficiaries: 1890, completionRate: 58 },
          { id: 3, name: 'Leadership Development', nameAr: 'تطوير القيادة', status: 'active', beneficiaries: 890, completionRate: 91 },
          { id: 4, name: 'Green Economy Training', nameAr: 'تدريب الاقتصاد الأخضر', status: 'planned', beneficiaries: 0, completionRate: 0 },
          { id: 5, name: 'Financial Sector Upskill', nameAr: 'تطوير مهارات القطاع المالي', status: 'completed', beneficiaries: 1560, completionRate: 100 },
        ]
      },
      activity: [
        { id: 1, type: 'policy', message: 'New Emiratization policy approved for tech sector', messageAr: 'اعتماد سياسة توطين جديدة لقطاع التكنولوجيا', time: '2h ago', timeAr: 'منذ ساعتين' },
        { id: 2, type: 'program', message: 'Digital Skills Program launched in Abu Dhabi', messageAr: 'إطلاق برنامج المهارات الرقمية في أبوظبي', time: '1d ago', timeAr: 'منذ يوم' },
        { id: 3, type: 'milestone', message: 'Banking sector reached 78% Emiratization', messageAr: 'قطاع المصارف يصل إلى 78% في التوطين', time: '2d ago', timeAr: 'منذ يومين' },
        { id: 4, type: 'report', message: 'Q3 Workforce Development Report published', messageAr: 'نشر تقرير تطوير القوى العاملة للربع الثالث', time: '3d ago', timeAr: 'منذ 3 أيام' },
      ]
    });
  };

  // ── Dynamic Greeting ───────────────────────────────────────────
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

  // ── Stat Cards ─────────────────────────────────────────────────
  const statCards = [
    {
      label: b('Emiratization Rate', 'نسبة التوطين'),
      value: `${dashboardData.emiratization.overallRate}%`,
      icon: Target,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-100',
      sub: `${b('Target', 'الهدف')}: ${dashboardData.emiratization.targetRate}%`
    },
    {
      label: b('Total Workforce', 'إجمالي القوى العاملة'),
      value: (dashboardData.workforce.totalWorkforce ?? 0).toLocaleString(),
      icon: Users,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      border: 'border-teal-100',
      sub: `${(dashboardData.emiratization.totalEmiratiEmployees ?? 0).toLocaleString()} ${b('Emirati nationals', 'مواطن إماراتي')}`
    },
    {
      label: b('Monthly Growth', 'النمو الشهري'),
      value: `+${dashboardData.emiratization.monthlyGrowth}%`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      sub: b('Month-over-month', 'مقارنة بالشهر السابق')
    },
    {
      label: b('Active Programs', 'البرامج النشطة'),
      value: dashboardData.initiatives.activePrograms,
      icon: GraduationCap,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      sub: `${dashboardData.initiatives.beneficiaries.toLocaleString()} ${b('beneficiaries', 'مستفيد')}`
    },
  ];

  // ── Activity Icon Resolver ─────────────────────────────────────
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'policy': return <Shield className="h-4 w-4 text-blue-500" />;
      case 'program': return <GraduationCap className="h-4 w-4 text-green-500" />;
      case 'milestone': return <CheckCircle className="h-4 w-4 text-purple-500" />;
      case 'report': return <FileText className="h-4 w-4 text-orange-500" />;
      default: return <Activity className="h-4 w-4 text-slate-400" />;
    }
  };

  // ── Status Badge Helper ────────────────────────────────────────
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px] font-dubai-medium">{b('Active', 'نشط')}</Badge>;
      case 'completed':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-dubai-medium">{b('Completed', 'مكتمل')}</Badge>;
      case 'planned':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-dubai-medium">{b('Planned', 'مخطط')}</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen bg-[#FAFBFC] font-dubai ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Navigation */}
      <HybridGovernmentNavFixed showAuthButtons={true} currentLanguage={language} onLanguageToggle={toggleLanguage} />

      {/* Main Content */}
      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ─── Header ─── */}
          <div className="mb-6">
            <div className="flex items-center justify-between" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
              <div className="flex items-center gap-4" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {firstName.charAt(0)}
                </div>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <div className="flex items-center gap-3" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                    <h1 className="text-2xl font-dubai-bold text-slate-900">
                      {getGreeting()}، {firstName}
                    </h1>
                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-dubai-medium">
                      {b('Government Representative', 'ممثل حكومي')}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 font-dubai-medium mt-0.5">
                    {isRTL
                      ? <>تتبع <span className="text-emerald-600 font-bold">{dashboardData.emiratization.sectorBreakdown.length} قطاعات</span> مع <span className="text-emerald-600 font-bold">{dashboardData.initiatives.activePrograms} برنامج نشط</span>.</>
                      : <>Monitoring <span className="text-emerald-600 font-bold">{dashboardData.emiratization.sectorBreakdown.length} sectors</span> with <span className="text-emerald-600 font-bold">{dashboardData.initiatives.activePrograms} active programs</span>.</>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                <Button variant="outline" size="sm" className="font-dubai-medium flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  {b('Export Report', 'تصدير التقرير')}
                </Button>
                <Button variant="outline" size="sm" className="font-dubai-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {b('Settings', 'الإعدادات')}
                </Button>
              </div>
            </div>
          </div>

          {/* ─── Quick Actions ─── */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-3" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-dubai-medium shadow-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {b('Create Policy', 'إنشاء سياسة')}
              </Button>
              <Button variant="outline" className="font-dubai-medium bg-white hover:bg-slate-50 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                {b('View Analytics', 'عرض التحليلات')}
              </Button>
              <Button variant="outline" className="font-dubai-medium bg-white hover:bg-slate-50 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {b('Sector Compliance', 'التزام القطاعات')}
              </Button>
            </div>
          </div>

          {/* ─── Tabs ─── */}
          <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full grid-cols-9 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200/80" dir={isRTL ? 'rtl' : 'ltr'} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
              <TabsTrigger value="overview" className="font-dubai-medium data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none rounded-lg text-sm" onClick={() => handleTabChange('overview')}>{b('Overview', 'نظرة عامة')}</TabsTrigger>
              <TabsTrigger value="compliance" className="font-dubai-medium data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none rounded-lg text-sm" onClick={() => handleTabChange('compliance')}>{b('Compliance', 'الامتثال')}</TabsTrigger>
              <TabsTrigger value="sectors" className="font-dubai-medium data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none rounded-lg text-sm" onClick={() => handleTabChange('sectors')}>{b('Sectors', 'القطاعات')}</TabsTrigger>
              <TabsTrigger value="nafis" className="font-dubai-medium data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none rounded-lg text-sm" onClick={() => handleTabChange('nafis')}>{b('Nafis', 'نافس')}</TabsTrigger>
              <TabsTrigger value="initiatives" className="font-dubai-medium data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none rounded-lg text-sm" onClick={() => handleTabChange('initiatives')}>{b('Initiatives', 'المبادرات')}</TabsTrigger>
              <TabsTrigger value="mega-projects" className="font-dubai-medium data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none rounded-lg text-sm" onClick={() => handleTabChange('mega-projects')}>{b('Mega Projects', 'المشاريع الكبرى')}</TabsTrigger>
              <TabsTrigger value="career-events" className="font-dubai-medium data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none rounded-lg text-sm" onClick={() => handleTabChange('career-events')}>{b('Career Events', 'الفعاليات المهنية')}</TabsTrigger>
              <TabsTrigger value="workforce" className="font-dubai-medium data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none rounded-lg text-sm" onClick={() => handleTabChange('workforce')}>{b('Workforce', 'القوى العاملة')}</TabsTrigger>
              <TabsTrigger value="reports" className="font-dubai-medium data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none rounded-lg text-sm" onClick={() => handleTabChange('reports')}>{b('Reports', 'التقارير')}</TabsTrigger>
            </TabsList>

            {/* ═══════════════════════════════════════════════════════
                              OVERVIEW TAB
               ═══════════════════════════════════════════════════════ */}
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

              {/* ─── Emiratization by Sector + Recent Activity ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Sector Breakdown — 2 cols */}
                <Card className="lg:col-span-2 bg-white border border-slate-200/80">
                  <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                      <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold">
                        <Landmark className="h-4 w-4 text-emerald-600" />
                        {b('Emiratization by Sector', 'التوطين حسب القطاع')}
                      </CardTitle>
                      <Button variant="link" size="sm" className="text-xs text-emerald-600 font-dubai-medium" onClick={() => handleTabChange('sectors')}>
                        {b('View All', 'عرض الكل')} →
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      {dashboardData.emiratization.sectorBreakdown.slice(0, 4).map((sector, i) => (
                        <div key={i} className="group" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-dubai-medium text-slate-700">{isRTL ? (sector.sectorAr || sector.sector) : sector.sector}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-dubai-bold text-slate-900">{sector.rate}%</span>
                              {sector.rate >= sector.target ? (
                                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                              ) : (
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                              )}
                            </div>
                          </div>
                          <div className="relative">
                            <Progress value={sector.rate} className="h-2.5 bg-slate-100" />
                            <div
                              className="absolute top-0 h-2.5 border-r-2 border-dashed border-slate-400"
                              style={{ left: `${sector.target}%` }}
                              title={`${b('Target', 'الهدف')}: ${sector.target}%`}
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 font-dubai-medium">
                            {(sector.employees ?? 0).toLocaleString()} {b('employees', 'موظف')} · {b('Target', 'الهدف')}: {sector.target ?? 75}%
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* National Target Summary */}
                    <div className="mt-5 p-4 bg-emerald-50 rounded-xl border border-emerald-100" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-dubai-bold text-emerald-800">{b('National Target 2025', 'الهدف الوطني 2025')}</p>
                          <p className="text-xs text-emerald-600 font-dubai-medium mt-0.5">
                            {b('Overall Emiratization Goal', 'هدف التوطين الشامل')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-dubai-bold text-emerald-700">{dashboardData.emiratization.targetRate}%</p>
                          <p className="text-[10px] text-emerald-600 font-dubai-medium">
                            {b('Current', 'الحالي')}: {dashboardData.emiratization.overallRate}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Right Column */}
                <div className="space-y-6">

                  {/* National Initiatives Summary */}
                  <Card className="bg-white border border-slate-200/80">
                    <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                      <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                        <Globe className="h-4 w-4 text-emerald-600" />
                        {b('National Initiatives', 'المبادرات الوطنية')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3">
                      <div className="space-y-3" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                        {[
                          { label: b('Active Programs', 'البرامج النشطة'), value: dashboardData.initiatives.activePrograms, color: 'text-blue-600' },
                          { label: b('Beneficiaries', 'المستفيدون'), value: (dashboardData.initiatives.beneficiaries ?? 0).toLocaleString(), color: 'text-green-600' },
                          { label: b('Avg. Completion', 'متوسط الإنجاز'), value: `${dashboardData.initiatives.completionRate}%`, color: 'text-purple-600' },
                          { label: b('Success Stories', 'قصص النجاح'), value: dashboardData.initiatives.successStories, color: 'text-orange-600' },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                            <span className="text-sm text-slate-600 font-dubai-medium">{item.label}</span>
                            <span className={`text-sm font-dubai-bold ${item.color}`}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-3 font-dubai-medium text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-xs" onClick={() => handleTabChange('initiatives')}>
                        {b('View All Initiatives', 'عرض جميع المبادرات')} →
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Workforce Snapshot */}
                  <Card className="bg-white border border-slate-200/80">
                    <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                      <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                        <Briefcase className="h-4 w-4 text-emerald-600" />
                        {b('Workforce Snapshot', 'لمحة عن القوى العاملة')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3">
                      <div className="space-y-3" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                        <div className="flex items-center justify-between p-2">
                          <span className="text-sm text-slate-600 font-dubai-medium">{b('Unemployment Rate', 'معدل البطالة')}</span>
                          <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px] font-dubai-medium">{dashboardData.workforce.unemploymentRate}%</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2">
                          <span className="text-sm text-slate-600 font-dubai-medium">{b('Skills Gap Index', 'مؤشر الفجوة المهارية')}</span>
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-dubai-medium">{dashboardData.workforce.skillsGapIndex}%</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2">
                          <span className="text-sm text-slate-600 font-dubai-medium">{b('Training Programs', 'برامج التدريب')}</span>
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-dubai-medium">{dashboardData.workforce.trainingPrograms}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* ─── Recent Activity ─── */}
              <Card className="bg-white border border-slate-200/80">
                <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                  <CardTitle className="font-dubai-bold text-slate-900 text-base">{b('Recent Policy & Program Activity', 'نشاط السياسات والبرامج الأخير')}</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-500 text-xs">
                    {b('Latest updates from national workforce development', 'آخر تحديثات تطوير القوى العاملة الوطنية')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="space-y-2">
                    {dashboardData.activity.length > 0 ? (
                      dashboardData.activity.map((activity) => (
                        <div key={activity.id} className={`flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                          <div className="flex-shrink-0 mt-0.5">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-dubai-medium text-slate-800">
                              {isRTL ? (activity.messageAr || activity.message) : activity.message}
                            </p>
                            <p className="text-xs text-slate-400 font-dubai mt-0.5">
                              {isRTL ? (activity.timeAr || activity.time) : activity.time}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-[10px] shrink-0 capitalize">
                            {b(activity.type, activity.type)}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 font-dubai-medium py-4 text-center">{b('No recent activity', 'لا يوجد نشاط حديث')}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══════════════════════════════════════════════════════
                              SECTORS TAB
               ═══════════════════════════════════════════════════════ */}
            <TabsContent value="sectors" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-white border border-slate-200/80">
                <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                  <CardTitle className="font-dubai-bold text-slate-900 text-base">{b('Emiratization by Sector — Full Breakdown', 'التوطين حسب القطاع — تفاصيل كاملة')}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <table className="w-full text-sm" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className={`px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider font-dubai-medium ${isRTL ? 'text-right' : 'text-left'}`}>{b('Sector', 'القطاع')}</th>
                        <th className={`px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider font-dubai-medium ${isRTL ? 'text-right' : 'text-left'}`}>{b('Current Rate', 'النسبة الحالية')}</th>
                        <th className={`px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider font-dubai-medium ${isRTL ? 'text-right' : 'text-left'}`}>{b('Target', 'الهدف')}</th>
                        <th className={`px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider font-dubai-medium ${isRTL ? 'text-right' : 'text-left'}`}>{b('Emirati Employees', 'الموظفون الإماراتيون')}</th>
                        <th className={`px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider font-dubai-medium ${isRTL ? 'text-right' : 'text-left'}`}>{b('Status', 'الحالة')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.emiratization.sectorBreakdown.map((sector, i) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-dubai-medium text-slate-800">{isRTL ? (sector.sectorAr || sector.sector) : sector.sector}</td>
                          <td className="px-4 py-3 font-dubai-bold text-slate-900">{sector.rate}%</td>
                          <td className="px-4 py-3 font-dubai text-slate-600">{sector.target}%</td>
                          <td className="px-4 py-3 font-dubai text-slate-600">{sector.employees.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            {sector.rate >= sector.target ? (
                              <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px] font-dubai-medium">{b('On Target', 'ضمن الهدف')}</Badge>
                            ) : (
                              <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-dubai-medium">{b('Below Target', 'دون الهدف')}</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══════════════════════════════════════════════════════
                              INITIATIVES TAB
               ═══════════════════════════════════════════════════════ */}
            <TabsContent value="initiatives" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-white border border-slate-200/80">
                <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                  <CardTitle className="font-dubai-bold text-slate-900 text-base">{b('National Workforce Initiatives', 'مبادرات القوى العاملة الوطنية')}</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-500 text-xs">
                    {b('Government-sponsored training and development programs', 'برامج التدريب والتطوير المدعومة حكومياً')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {dashboardData.initiatives.list.map((initiative) => (
                      <div key={initiative.id} className="p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:shadow-sm transition-all" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-sm font-dubai-bold text-slate-800">
                              {isRTL ? (initiative.nameAr || initiative.name) : initiative.name}
                            </h3>
                            {getStatusBadge(initiative.status)}
                          </div>
                          <ChevronRight className={`h-4 w-4 text-slate-400 ${isRTL ? 'rotate-180' : ''}`} />
                        </div>
                        <div className="flex items-center gap-6 text-xs text-slate-500 font-dubai-medium">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {initiative.beneficiaries.toLocaleString()} {b('beneficiaries', 'مستفيد')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {initiative.completionRate}% {b('complete', 'مكتمل')}
                          </span>
                        </div>
                        {initiative.status !== 'planned' && (
                          <div className="mt-2">
                            <Progress value={initiative.completionRate} className="h-1.5 bg-slate-100" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══════════════════════════════════════════════════════
                              WORKFORCE TAB
               ═══════════════════════════════════════════════════════ */}
            <TabsContent value="workforce" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: b('Total Workforce', 'إجمالي القوى العاملة'), value: (dashboardData.workforce.totalWorkforce ?? 0).toLocaleString(), icon: Users, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
                  { label: b('Emirati Nationals', 'المواطنون الإماراتيون'), value: (dashboardData.emiratization.totalEmiratiEmployees ?? 0).toLocaleString(), icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                  { label: b('Unemployment Rate', 'معدل البطالة'), value: `${dashboardData.workforce.unemploymentRate}%`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                  { label: b('Training Programs', 'برامج التدريب'), value: dashboardData.workforce.trainingPrograms, icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
                ].map((stat, i) => (
                  <Card key={i} className={`bg-white border ${stat.border} hover:shadow-md transition-all duration-200 group`}>
                    <CardContent className="pt-5 pb-4 px-5">
                      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={isRTL ? 'text-right' : 'text-left'}>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1 font-dubai-medium">{stat.label}</p>
                          <p className="text-3xl font-dubai-bold text-slate-900">{stat.value}</p>
                        </div>
                        <div className={`p-3 ${stat.bg} rounded-xl group-hover:scale-110 transition-transform`}>
                          <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-white border border-slate-200/80">
                <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                  <CardTitle className="font-dubai-bold text-slate-900 text-base">{b('Skills Gap Analysis', 'تحليل الفجوة المهارية')}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-center">
                      <p className="text-3xl font-dubai-bold text-amber-700">{dashboardData.workforce.skillsGapIndex}%</p>
                      <p className="text-sm text-amber-600 font-dubai-medium mt-1">{b('Skills Gap Index', 'مؤشر الفجوة')}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-center">
                      <p className="text-3xl font-dubai-bold text-green-700">{dashboardData.workforce.trainingPrograms}</p>
                      <p className="text-sm text-green-600 font-dubai-medium mt-1">{b('Active Training Programs', 'برامج تدريب نشطة')}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-center">
                      <p className="text-3xl font-dubai-bold text-blue-700">{(dashboardData.initiatives.beneficiaries ?? 0).toLocaleString()}</p>
                      <p className="text-sm text-blue-600 font-dubai-medium mt-1">{b('Current Beneficiaries', 'المستفيدون الحاليون')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══════════════════════════════════════════════════════
                              REPORTS TAB
               ═══════════════════════════════════════════════════════ */}
            <TabsContent value="reports" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-white border border-slate-200/80">
                <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                  <CardTitle className="font-dubai-bold text-slate-900 text-base">{b('Available Reports', 'التقارير المتاحة')}</CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-500 text-xs">
                    {b('Download official workforce development reports', 'تنزيل تقارير تطوير القوى العاملة الرسمية')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                    {[
                      { name: b('Q3 2025 Emiratization Report', 'تقرير التوطين — الربع الثالث 2025'), date: b('Oct 15, 2025', '15 أكتوبر 2025'), type: 'PDF' },
                      { name: b('Annual Workforce Analytics', 'تحليلات القوى العاملة السنوية'), date: b('Jan 5, 2025', '5 يناير 2025'), type: 'PDF' },
                      { name: b('Sector Compliance Summary', 'ملخص التزام القطاعات'), date: b('Nov 20, 2025', '20 نوفمبر 2025'), type: 'XLSX' },
                      { name: b('Training Impact Assessment', 'تقييم أثر التدريب'), date: b('Sep 30, 2025', '30 سبتمبر 2025'), type: 'PDF' },
                    ].map((report, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:shadow-sm transition-all cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                            <FileText className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm font-dubai-medium text-slate-800">{report.name}</p>
                            <p className="text-[10px] text-slate-400 font-dubai">{report.date} · {report.type}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══════════════════════════ COMPLIANCE TAB ═══════════════════════════ */}
            <TabsContent value="compliance">
              <ComplianceTab isRTL={isRTL} b={b} />
            </TabsContent>

            {/* ═══════════════════════════ NAFIS TAB ═══════════════════════════ */}
            <TabsContent value="nafis">
              <NafisTab isRTL={isRTL} b={b} />
            </TabsContent>

            {/* ═══════════════════════════ MEGA PROJECTS TAB ═══════════════════════════ */}
            <TabsContent value="mega-projects">
              <MegaProjectsTab isRTL={isRTL} b={b} />
            </TabsContent>

            {/* ═══════════════════════════ CAREER EVENTS TAB ═══════════════════════════ */}
            <TabsContent value="career-events">
              <CareerEventsTab isRTL={isRTL} b={b} />
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default GovernmentDashboard;
