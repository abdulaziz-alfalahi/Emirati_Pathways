import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { getDisplayName } from '@/utils/nameUtils';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp, TrendingDown, Target, Brain, FileText, CheckCircle, Clock,
  AlertTriangle, ArrowRight, Users, Building2, Briefcase, BarChart3,
  Shield, Download, Settings, Activity, Loader2, Send
} from 'lucide-react';

import { restClient } from '@/utils/api';

export default function BoardPortal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { i18n } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
  const { user } = useAuth();
  const isRTL = i18n.language === 'ar';
  const b = (en: string, ar: string) => isRTL ? ar : en;
  const currentTab = searchParams.get('tab') || 'scorecards';

  const [scorecards, setScorecards] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [directives, setDirectives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New directive form state
  const [newDirective, setNewDirective] = useState({ title: '', body: '', category: 'strategic_priority', priority: 'normal' });

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
  const userName = getDisplayName(userData, b('Board Member', 'عضو مجلس'));
  const firstName = userName.split(' ')[0];

  // ── Tab Navigation ─────────────────────────────────────────────
  const handleTabChange = (value: string) => {
    navigate(`/board-portal?tab=${value}`, { replace: true });
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [scoreRes, insightsRes, dirRes] = await Promise.all([
        restClient.get('/api/board/scorecards'),
        restClient.get('/api/board/insights'),
        restClient.get('/api/board/directives')
      ]);

      if (scoreRes.data) setScorecards(scoreRes.data);
      if (insightsRes.data) setInsights(insightsRes.data);
      if (dirRes.data) setDirectives(dirRes.data);

    } catch (error) {
      console.error('Error fetching board data:', error);
      // Set fallback data
      setScorecards({
        placement_rate: { value: '12.4%', trend: '+2.4%', target: '15.0%', status: 'good' },
        time_to_hire: { value: '24 days', trend: '-3 days', target: '30 days', status: 'excellent' },
        pipeline_health: { value: '1,247', trend: '+12%', target: '1,000', status: 'good' },
        emiratisation_progress: { value: '4.2%', trend: '+0.5%', target: '5.0%', status: 'warning' },
        active_companies: { value: '38', trend: '+5%', target: '50', status: 'good' },
        total_offers: { value: '156', trend: '+18%', target: '100', status: 'excellent' }
      });
      setInsights([
        {
          id: 1,
          title: 'Placement Rate Growth',
          description: 'Abu Dhabi placement rate increased by 12%, driven primarily by the technology sector.',
          severity: 'info',
          theme: 'talent_supply'
        },
        {
          id: 2,
          title: 'Company Inactivity',
          description: '3 major enterprise companies have not posted new roles in the last 30 days.',
          severity: 'warning',
          theme: 'company_demand'
        },
        {
          id: 3,
          title: 'Candidate Registration Surge',
          description: '45 candidates completed their profile this week vs. 28 last week.',
          severity: 'info',
          theme: 'platform_health'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const submitDirective = async () => {
    if (!newDirective.title) return;

    try {
      const res = await restClient.post('/api/board/directives', newDirective);
      if (res.status === 200 || res.status === 201) {
        setNewDirective({ title: '', body: '', category: 'strategic_priority', priority: 'normal' });
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error submitting directive:', error);
    }
  };

  // ── Stat Card Config ───────────────────────────────────────────
  const getStatCards = () => {
    if (!scorecards) return [];
    const entries = Object.entries(scorecards);
    const iconMap: Record<string, any> = {
      placement_rate: Target,
      time_to_hire: Clock,
      pipeline_health: Users,
      emiratisation_progress: Shield,
      active_companies: Building2,
      total_offers: Briefcase,
      active_candidates: Users,
      employer_engagement: Building2,
      program_completion: CheckCircle,
    };
    const colorMap: Record<string, { color: string; bg: string; border: string }> = {
      excellent: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
      good: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
      warning: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    };

    return entries.map(([key, data]: [string, any]) => {
      const Icon = iconMap[key] || BarChart3;
      const colors = colorMap[data.status] || colorMap.good;
      return {
        key,
        label: b(key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
               key.replace(/_/g, ' ')),
        value: data.value,
        trend: data.trend,
        target: data.target,
        status: data.status,
        Icon,
        ...colors,
      };
    });
  };

  // ── Loading State ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`min-h-screen bg-[#FAFBFC] font-dubai ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <HybridGovernmentNavFixed showAuthButtons={true} currentLanguage={language} onLanguageToggle={toggleLanguage} />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <p className="text-sm text-slate-500 font-dubai-medium">{b('Loading Executive Intelligence...', 'جاري تحميل لوحة الإدارة...')}</p>
          </div>
        </div>
      </div>
    );
  }

  const statCards = getStatCards();

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
                      {b('Board Member', 'عضو مجلس الإدارة')}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 font-dubai-medium mt-0.5">
                    {isRTL
                      ? <>الذكاء الاستراتيجي والتوجيهات — <span className="text-emerald-600 font-bold">بوابة الإدارة العليا</span></>
                      : <>Strategic Intelligence & Directives — <span className="text-emerald-600 font-bold">EHDC Executive Portal</span></>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                <Button variant="outline" size="sm" className="font-dubai-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {b('Generate Board Pack', 'إنشاء ملف المجلس')}
                </Button>
                <Button variant="outline" size="sm" className="font-dubai-medium flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  {b('Export Report', 'تصدير التقرير')}
                </Button>
              </div>
            </div>
          </div>

          {/* ─── Quick Actions ─── */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-3" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-dubai-medium shadow-sm flex items-center gap-2">
                <Brain className="h-4 w-4" />
                {b('AI Strategic Brief', 'موجز ذكاء استراتيجي')}
              </Button>
              <Button variant="outline" className="font-dubai-medium bg-white hover:bg-slate-50 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                {b('View Analytics', 'عرض التحليلات')}
              </Button>
              <Button variant="outline" className="font-dubai-medium bg-white hover:bg-slate-50 flex items-center gap-2">
                <Send className="h-4 w-4" />
                {b('Issue Directive', 'إصدار توجيه')}
              </Button>
            </div>
          </div>

          {/* ─── Tabs ─── */}
          <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <TabsList className="grid w-full grid-cols-4 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200/80" dir={isRTL ? 'rtl' : 'ltr'} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
              <TabsTrigger value="scorecards" className="font-dubai-medium data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none rounded-lg text-sm" onClick={() => handleTabChange('scorecards')}>{b('Scorecards', 'بطاقات الأداء')}</TabsTrigger>
              <TabsTrigger value="insights" className="font-dubai-medium data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none rounded-lg text-sm" onClick={() => handleTabChange('insights')}>{b('AI Insights', 'رؤى الذكاء الاصطناعي')}</TabsTrigger>
              <TabsTrigger value="directives" className="font-dubai-medium data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none rounded-lg text-sm" onClick={() => handleTabChange('directives')}>{b('Directives', 'التوجيهات')}</TabsTrigger>
              <TabsTrigger value="emiratisation" className="font-dubai-medium data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none rounded-lg text-sm" onClick={() => handleTabChange('emiratisation')}>{b('Emiratisation', 'التوطين')}</TabsTrigger>
            </TabsList>

            {/* ═══════════════════════════════════════════════════════
                              SCORECARDS TAB
               ═══════════════════════════════════════════════════════ */}
            <TabsContent value="scorecards" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

              {/* ─── Stat Cards ─── */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {statCards.map((stat) => (
                  <Card key={stat.key} className={`bg-white border ${stat.border} hover:shadow-md transition-all duration-200 group`}>
                    <CardContent className="pt-5 pb-4 px-5">
                      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={isRTL ? 'text-right' : 'text-left'}>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1 font-dubai-medium">{stat.label}</p>
                          <p className="text-3xl font-dubai-bold text-slate-900">{stat.value}</p>
                          <div className="flex items-center mt-1 text-xs font-dubai-medium">
                            {stat.trend?.startsWith('+') || stat.trend?.startsWith('-') && !stat.trend?.startsWith('-') ? (
                              <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                            )}
                            <span className={stat.trend?.startsWith('+') ? 'text-emerald-600' : stat.trend?.startsWith('-') && stat.key === 'time_to_hire' ? 'text-emerald-600' : 'text-red-600'}>
                              {stat.trend}
                            </span>
                            <span className="text-slate-400 ml-2">{b('vs target', 'مقابل الهدف')} {stat.target}</span>
                          </div>
                        </div>
                        <div className={`p-3 ${stat.bg} rounded-xl group-hover:scale-110 transition-transform`}>
                          <stat.Icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* ─── Summary Card ─── */}
              <Card className="bg-white border border-slate-200/80">
                <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                  <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                    <Activity className="h-4 w-4 text-emerald-600" />
                    {b('Platform Performance Summary', 'ملخص أداء المنصة')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                      <p className="text-3xl font-dubai-bold text-emerald-700">{scorecards?.placement_rate?.value || '—'}</p>
                      <p className="text-sm text-emerald-600 font-dubai-medium mt-1">{b('Placement Rate', 'معدل التوظيف')}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-center">
                      <p className="text-3xl font-dubai-bold text-blue-700">{scorecards?.pipeline_health?.value || scorecards?.active_candidates?.value || '—'}</p>
                      <p className="text-sm text-blue-600 font-dubai-medium mt-1">{b('Active Candidates', 'المرشحون النشطون')}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-center">
                      <p className="text-3xl font-dubai-bold text-amber-700">{scorecards?.emiratisation_progress?.value || '—'}</p>
                      <p className="text-sm text-amber-600 font-dubai-medium mt-1">{b('Emiratisation Progress', 'تقدم التوطين')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══════════════════════════════════════════════════════
                              INSIGHTS TAB
               ═══════════════════════════════════════════════════════ */}
            <TabsContent value="insights" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-lg font-dubai-bold text-slate-800 flex items-center gap-2" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                    <Brain className="h-5 w-5 text-emerald-600" />
                    {b('Weekly Intelligence Brief', 'موجز الذكاء الأسبوعي')}
                  </h3>
                  {insights.length > 0 ? insights.map((insight) => (
                    <Card key={insight.id} className="bg-white border border-slate-200/80 hover:shadow-md transition-all duration-200" style={{ borderLeftWidth: '4px', borderLeftColor: insight.severity === 'warning' ? '#f59e0b' : '#10b981' }}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                          <CardTitle className="text-base font-dubai-bold text-slate-800">{insight.title}</CardTitle>
                          <Badge className={insight.severity === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'} >
                            {insight.theme?.replace('_', ' ')}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-600 font-dubai-medium">{insight.description}</p>
                        <div className="mt-4 flex justify-end">
                          <Button variant="ghost" size="sm" className="text-emerald-600 h-8 gap-1 font-dubai-medium">
                            {b('View Details', 'عرض التفاصيل')} <ArrowRight className={`h-3 w-3 ${isRTL ? 'rotate-180' : ''}`} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )) : (
                    <Card className="bg-white border border-slate-200/80">
                      <CardContent className="p-8 text-center text-slate-500 font-dubai-medium">
                        {b('No insights available yet. AI models will generate insights as data accumulates.', 'لا توجد رؤى متاحة بعد. ستقوم نماذج الذكاء الاصطناعي بإنشاء رؤى مع تراكم البيانات.')}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* AI Engine Card */}
                <Card className="bg-white border border-slate-200/80 sticky top-24">
                  <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                      <Brain className="h-4 w-4 text-emerald-600" />
                      {b('AI Analysis Engine', 'محرك التحليل الذكي')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <p className="text-sm text-slate-500 mb-6 font-dubai-medium">
                      {b(
                        'Insights are automatically generated by analyzing pipeline anomalies, conversion rate changes, and platform engagement metrics.',
                        'يتم إنشاء الرؤى تلقائيًا من خلال تحليل بيانات التوظيف والمشاركة في المنصة.'
                      )}
                    </p>
                    <div className="space-y-3" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                      {[
                        { label: b('Models Run', 'النماذج المنفذة'), value: '24', color: 'text-blue-600' },
                        { label: b('Data Points', 'نقاط البيانات'), value: '4,500+', color: 'text-emerald-600' },
                        { label: b('Last Analysis', 'آخر تحليل'), value: b('2 hours ago', 'منذ ساعتين'), color: 'text-purple-600' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                          <span className="text-sm text-slate-600 font-dubai-medium">{item.label}</span>
                          <span className={`text-sm font-dubai-bold ${item.color}`}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ═══════════════════════════════════════════════════════
                              DIRECTIVES TAB
               ═══════════════════════════════════════════════════════ */}
            <TabsContent value="directives" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-lg font-dubai-bold text-slate-800" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                    {b('Active Directives', 'التوجيهات النشطة')}
                  </h3>
                  {directives.length === 0 ? (
                    <Card className="bg-white border border-slate-200/80">
                      <CardContent className="p-8 text-center text-slate-500 font-dubai-medium">
                        {b('No active directives.', 'لا توجد توجيهات نشطة.')}
                      </CardContent>
                    </Card>
                  ) : (
                    directives.map((dir) => (
                      <Card key={dir.id} className="bg-white border border-slate-200/80 hover:shadow-md transition-all duration-200">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                            <CardTitle className="text-base font-dubai-bold text-slate-800">{dir.title}</CardTitle>
                            <Badge className={dir.status === 'open' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}>
                              {dir.status === 'open' ? <Clock className="h-3 w-3 mr-1 inline" /> : <CheckCircle className="h-3 w-3 mr-1 inline" />}
                              {dir.status}
                            </Badge>
                          </div>
                          <CardDescription className="flex gap-2 mt-1" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                            <Badge variant="outline" className="text-[10px] font-dubai-medium">{dir.category?.replace('_', ' ')}</Badge>
                            <span className="text-[10px] text-slate-400 font-dubai">{new Date(dir.created_at).toLocaleDateString()}</span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-600 font-dubai-medium">{dir.body}</p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                {/* Issue Directive Form */}
                <Card className="bg-white border border-emerald-100 sticky top-24">
                  <CardHeader className="pb-2 border-b border-emerald-100 bg-emerald-50/30">
                    <CardTitle className="text-base text-emerald-900 font-dubai-bold" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                      {b('Issue Directive', 'إصدار توجيه')}
                    </CardTitle>
                    <CardDescription className="font-dubai-medium text-xs" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                      {b('Send a strategic directive to the Operations Team', 'أرسل توجيه استراتيجي لفريق العمليات')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-dubai-medium text-slate-600">{b('Title', 'العنوان')}</label>
                      <Input
                        placeholder={b('e.g., Investigate placement drop', 'مثال: التحقيق في انخفاض التوظيف')}
                        value={newDirective.title}
                        onChange={e => setNewDirective({...newDirective, title: e.target.value})}
                        className="font-dubai"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-dubai-medium text-slate-600">{b('Category', 'الفئة')}</label>
                      <Select value={newDirective.category} onValueChange={v => setNewDirective({...newDirective, category: v})}>
                        <SelectTrigger className="font-dubai"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="strategic_priority">{b('Strategic Priority', 'أولوية استراتيجية')}</SelectItem>
                          <SelectItem value="data_request">{b('Data Request', 'طلب بيانات')}</SelectItem>
                          <SelectItem value="improvement_suggestion">{b('Improvement Suggestion', 'اقتراح تحسين')}</SelectItem>
                          <SelectItem value="policy_direction">{b('Policy Direction', 'توجيه سياسات')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-dubai-medium text-slate-600">{b('Details', 'التفاصيل')}</label>
                      <Textarea
                        placeholder={b('Context and required actions...', 'السياق والإجراءات المطلوبة...')}
                        className="min-h-[100px] font-dubai"
                        value={newDirective.body}
                        onChange={e => setNewDirective({...newDirective, body: e.target.value})}
                      />
                    </div>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 font-dubai-medium" onClick={submitDirective}>
                      <Send className="h-4 w-4 mr-2" />
                      {b('Submit Directive', 'إرسال التوجيه')}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ═══════════════════════════════════════════════════════
                              EMIRATISATION TAB
               ═══════════════════════════════════════════════════════ */}
            <TabsContent value="emiratisation" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-white border border-slate-200/80">
                <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                  <CardTitle className="font-dubai-bold text-slate-900 text-base" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                    {b('Executive Emiratisation Overview', 'نظرة عامة تنفيذية على التوطين')}
                  </CardTitle>
                  <CardDescription className="font-dubai-medium text-slate-500 text-xs" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                    {b('High-level view of national targets and NAFIS integration', 'نظرة عامة على الأهداف الوطنية وتكامل نافس')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                    <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                      <Target className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                      <p className="text-3xl font-dubai-bold text-emerald-700">5.0%</p>
                      <p className="text-sm text-emerald-600 font-dubai-medium mt-1">{b('2025 Target', 'هدف 2025')}</p>
                      <Progress value={84} className="h-2 mt-3" />
                      <p className="text-xs text-emerald-500 mt-1 font-dubai">{b('84% toward target', '84% نحو الهدف')}</p>
                    </div>
                    <div className="p-6 rounded-xl bg-blue-50 border border-blue-100 text-center">
                      <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-3xl font-dubai-bold text-blue-700">45,678</p>
                      <p className="text-sm text-blue-600 font-dubai-medium mt-1">{b('Emirati Employees', 'الموظفون الإماراتيون')}</p>
                      <p className="text-xs text-blue-500 mt-2 font-dubai">{b('+2.1% this month', '+2.1% هذا الشهر')}</p>
                    </div>
                    <div className="p-6 rounded-xl bg-amber-50 border border-amber-100 text-center">
                      <Building2 className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                      <p className="text-3xl font-dubai-bold text-amber-700">6</p>
                      <p className="text-sm text-amber-600 font-dubai-medium mt-1">{b('Priority Sectors', 'القطاعات ذات الأولوية')}</p>
                      <p className="text-xs text-amber-500 mt-2 font-dubai">{b('Monitored for compliance', 'تخضع للرقابة')}</p>
                    </div>
                  </div>

                  {/* National Target Summary */}
                  <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-dubai-bold text-emerald-800">{b('National Target 2025', 'الهدف الوطني 2025')}</p>
                        <p className="text-xs text-emerald-600 font-dubai-medium mt-0.5">
                          {b('Overall Emiratisation Goal — Private Sector', 'هدف التوطين الشامل — القطاع الخاص')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-dubai-bold text-emerald-700">5.0%</p>
                        <p className="text-[10px] text-emerald-600 font-dubai-medium">
                          {b('Current', 'الحالي')}: 4.2%
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
  );
}
