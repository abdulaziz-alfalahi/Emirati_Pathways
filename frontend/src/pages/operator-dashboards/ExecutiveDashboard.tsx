import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { restClient } from '@/utils/api';
import {
  TrendingUp, Target, Brain, FileText, CheckCircle, Clock,
  Users, Building2, Briefcase, BarChart3, Award,
  Shield, Download, Activity, Loader2, Send, ArrowRight,
  Globe, Landmark, AlertTriangle
} from 'lucide-react';

const API_BASE = 'http://localhost:5005';
const CHART_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#14B8A6', '#EF4444'];

const ExecutiveDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { i18n } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
  const isRTL = i18n.language === 'ar';
  const b = (en: string, ar: string) => isRTL ? ar : en;
  const currentTab = searchParams.get('tab') || 'overview';

  // ── State ──────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [executiveData, setExecutiveData] = useState<any>(null);
  const [scorecards, setScorecards] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [directives, setDirectives] = useState<any[]>([]);
  const [newDirective, setNewDirective] = useState({
    title: '', body: '', category: 'strategic_priority', priority: 'normal'
  });

  // ── User Data ──────────────────────────────────────────────────
  const getUserData = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : {};
    } catch { return {}; }
  };
  const userData = getUserData();
  const userName = getDisplayName(userData, b('Board Member', 'عضو مجلس'));
  const firstName = userName.split(' ')[0];

  // ── Tab Navigation ─────────────────────────────────────────────
  const handleTabChange = (value: string) => {
    navigate(`/executive?tab=${value}`, { replace: true });
  };

  // ── Dynamic Greeting ───────────────────────────────────────────
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (isRTL) return hour < 12 ? 'صباح الخير' : 'مساء الخير';
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // ── Data Fetching ──────────────────────────────────────────────
  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const headers = { 'Content-Type': 'application/json' };

      // Fetch all APIs in parallel
      const [execRes, scoreRes, insightsRes, dirRes] = await Promise.allSettled([
        restClient.get('/api/metrics/executive-impact'),
        fetch(`${API_BASE}/api/board/scorecards`, { headers }),
        fetch(`${API_BASE}/api/board/insights`, { headers }),
        fetch(`${API_BASE}/api/board/directives`, { headers })
      ]);

      // Executive impact data
      if (execRes.status === 'fulfilled' && execRes.value?.data?.success) {
        setExecutiveData(execRes.value.data.data);
      } else {
        // Fallback mock data
        setExecutiveData({
          kpis: { total_placed: 1247, economic_value_aed: '12.4M', emiratization_target_progress: 84, active_partners: 38 },
          strategic_impact: [
            { month: 'Jan', placements: 45, target: 50 },
            { month: 'Feb', placements: 52, target: 50 },
            { month: 'Mar', placements: 61, target: 55 },
            { month: 'Apr', placements: 58, target: 55 },
            { month: 'May', placements: 72, target: 60 },
            { month: 'Jun', placements: 68, target: 60 },
          ],
          sector_distribution: [
            { name: b('Banking', 'المصارف'), value: 35 },
            { name: b('Technology', 'التكنولوجيا'), value: 28 },
            { name: b('Healthcare', 'الصحة'), value: 18 },
            { name: b('Energy', 'الطاقة'), value: 12 },
            { name: b('Other', 'أخرى'), value: 7 },
          ]
        });
      }

      // Scorecards
      if (scoreRes.status === 'fulfilled') {
        const res = scoreRes.value as Response;
        if (res.ok) setScorecards(await res.json());
      }

      // Insights
      if (insightsRes.status === 'fulfilled') {
        const res = insightsRes.value as Response;
        if (res.ok) setInsights(await res.json());
      }

      // Directives
      if (dirRes.status === 'fulfilled') {
        const res = dirRes.value as Response;
        if (res.ok) setDirectives(await res.json());
      }

    } catch (error) {
      console.error('Error fetching executive data:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitDirective = async () => {
    if (!newDirective.title) return;
    try {
      const res = await fetch(`${API_BASE}/api/board/directives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDirective)
      });
      if (res.ok) {
        setNewDirective({ title: '', body: '', category: 'strategic_priority', priority: 'normal' });
        fetchAllData();
      }
    } catch (error) {
      console.error('Error submitting directive:', error);
    }
  };

  // ── Top-Level KPI Cards ────────────────────────────────────────
  const kpis = executiveData?.kpis || {};
  const statCards = [
    {
      label: b('Total Placements', 'إجمالي التعيينات'),
      value: (kpis.total_placed || 0).toLocaleString(),
      icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100',
      sub: `${b('Economic Value', 'القيمة الاقتصادية')}: AED ${kpis.economic_value_aed || '—'}`
    },
    {
      label: b('Emiratisation Target', 'هدف التوطين'),
      value: `${kpis.emiratization_target_progress || 0}%`,
      icon: Target, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100',
      sub: b('Vision 2071 Progress', 'تقدم رؤية 2071')
    },
    {
      label: b('Active Partners', 'شركاء نشطون'),
      value: (kpis.active_partners || 0).toLocaleString(),
      icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100',
      sub: b('Private Sector Verified', 'القطاع الخاص — معتمدون')
    },
    {
      label: b('Growth Projection', 'توقعات النمو'),
      value: '+18%',
      icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100',
      sub: b('Next Quarter · AI Forecast', 'الربع القادم · توقعات الذكاء الاصطناعي')
    },
  ];

  // ── Scorecard items for the Scorecards section ─────────────────
  const getScorecardItems = () => {
    if (!scorecards) return [];
    return Object.entries(scorecards).map(([key, data]: [string, any]) => {
      const iconMap: Record<string, any> = {
        placement_rate: Target, time_to_hire: Clock, pipeline_health: Users,
        emiratisation_progress: Shield, active_companies: Building2,
        total_offers: Briefcase, active_candidates: Users,
        employer_engagement: Building2, program_completion: CheckCircle,
      };
      const colorMap: Record<string, { color: string; bg: string; border: string }> = {
        excellent: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
        good: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
        warning: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
      };
      const Icon = iconMap[key] || BarChart3;
      const colors = colorMap[data.status] || colorMap.good;
      return { key, Icon, ...colors, ...data,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      };
    });
  };

  // ── Recharts custom tooltip ────────────────────────────────────
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-dubai-bold text-slate-800 mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-xs font-dubai-medium" style={{ color: entry.color }}>
            {entry.name}: <span className="font-dubai-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
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

  return (
    <div className={`min-h-screen bg-[#FAFBFC] font-dubai ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ═══ Navigation ═══ */}
      <HybridGovernmentNavFixed showAuthButtons={true} currentLanguage={language} onLanguageToggle={toggleLanguage} />

      {/* ═══ Main Content ═══ */}
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
                      ? <>تتبع <span className="text-emerald-600 font-bold">{kpis.active_partners || 0} شريك</span> مع <span className="text-emerald-600 font-bold">{(kpis.total_placed || 0).toLocaleString()} تعيين</span> حتى الآن.</>
                      : <>Tracking <span className="text-emerald-600 font-bold">{kpis.active_partners || 0} partners</span> with <span className="text-emerald-600 font-bold">{(kpis.total_placed || 0).toLocaleString()} placements</span> to date.</>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                <Button variant="outline" size="sm" className="font-dubai-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {b('Board Pack', 'ملف المجلس')}
                </Button>
                <Button variant="outline" size="sm" className="font-dubai-medium flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  {b('Export', 'تصدير')}
                </Button>
              </div>
            </div>
          </div>

          {/* ─── Quick Actions ─── */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-3" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-dubai-medium shadow-sm flex items-center gap-2">
                <Brain className="h-4 w-4" />
                {b('AI Strategic Brief', 'موجز استراتيجي')}
              </Button>
              <Button variant="outline" className="font-dubai-medium bg-white hover:bg-slate-50 flex items-center gap-2">
                <Send className="h-4 w-4" />
                {b('Issue Directive', 'إصدار توجيه')}
              </Button>
              <Button variant="outline" className="font-dubai-medium bg-white hover:bg-slate-50 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                {b('Deep Analytics', 'تحليلات عميقة')}
              </Button>
            </div>
          </div>

          {/* ─── Tabs ─── */}
          <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <TabsList className="grid w-full grid-cols-5 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200/80" dir={isRTL ? 'rtl' : 'ltr'} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
              {[
                { value: 'overview', label: b('Overview', 'نظرة عامة') },
                { value: 'strategic', label: b('Strategic Impact', 'التأثير الاستراتيجي') },
                { value: 'insights', label: b('AI Insights', 'رؤى ذكية') },
                { value: 'directives', label: b('Directives', 'التوجيهات') },
                { value: 'emiratisation', label: b('Emiratisation', 'التوطين') },
              ].map(tab => (
                <TabsTrigger key={tab.value} value={tab.value}
                  className="font-dubai-medium data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none rounded-lg text-sm"
                  onClick={() => handleTabChange(tab.value)}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ═══════════════════════════════════════════════════════
                              OVERVIEW TAB
               ═══════════════════════════════════════════════════════ */}
            <TabsContent value="overview" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

              {/* ─── KPI Stat Cards ─── */}
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

              {/* ─── Charts + Operational Scorecards ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Placement Growth Chart */}
                <Card className="lg:col-span-2 bg-white border border-slate-200/80">
                  <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                      <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold">
                        <BarChart3 className="h-4 w-4 text-emerald-600" />
                        {b('Strategic Placement Growth', 'نمو التعيينات الاستراتيجي')}
                      </CardTitle>
                      <Button variant="link" size="sm" className="text-xs text-emerald-600 font-dubai-medium" onClick={() => handleTabChange('strategic')}>
                        {b('Full View', 'عرض كامل')} →
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div style={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={executiveData?.strategic_impact || []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorPlacements" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="placements" name={b('Placements', 'التعيينات')} stroke="#10B981" fill="url(#colorPlacements)" strokeWidth={2.5} />
                          <Area type="monotone" dataKey="target" name={b('Target', 'الهدف')} stroke="#8B5CF6" fill="none" strokeWidth={2} strokeDasharray="5 5" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Operational Scorecards Summary */}
                <Card className="bg-white border border-slate-200/80">
                  <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                      <Activity className="h-4 w-4 text-emerald-600" />
                      {b('Operational Metrics', 'المؤشرات التشغيلية')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <div className="space-y-3" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                      {getScorecardItems().slice(0, 5).map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 ${item.bg} rounded-lg`}>
                              <item.Icon className={`h-3.5 w-3.5 ${item.color}`} />
                            </div>
                            <span className="text-sm text-slate-600 font-dubai-medium">{item.label}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-dubai-bold text-slate-900">{item.value}</span>
                            {item.trend && (
                              <span className={`text-[10px] block font-dubai-medium ${item.trend.startsWith('+') ? 'text-emerald-500' : 'text-amber-500'}`}>
                                {item.trend}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ─── National Target Banner ─── */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-100 rounded-lg">
                      <Landmark className="h-5 w-5 text-emerald-700" />
                    </div>
                    <div>
                      <p className="text-sm font-dubai-bold text-emerald-800">{b('National Emiratisation Target 2025', 'الهدف الوطني للتوطين 2025')}</p>
                      <p className="text-xs text-emerald-600 font-dubai-medium mt-0.5">
                        {b('Overall private sector goal', 'الهدف الشامل للقطاع الخاص')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-dubai-bold text-emerald-700">{kpis.emiratization_target_progress || 0}%</p>
                      <p className="text-[10px] text-emerald-600 font-dubai-medium">{b('Current', 'الحالي')}</p>
                    </div>
                    <div className="w-32">
                      <Progress value={kpis.emiratization_target_progress || 0} className="h-2.5" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-dubai-bold text-slate-500">100%</p>
                      <p className="text-[10px] text-slate-400 font-dubai-medium">{b('Target', 'الهدف')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ═══════════════════════════════════════════════════════
                              STRATEGIC IMPACT TAB
               ═══════════════════════════════════════════════════════ */}
            <TabsContent value="strategic" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Bar Chart — Placement Growth */}
                <Card className="lg:col-span-2 bg-white border border-slate-200/80">
                  <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                      <BarChart3 className="h-4 w-4 text-emerald-600" />
                      {b('Placement Growth — Actual vs Target', 'نمو التعيينات — الفعلي مقابل المستهدف')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div style={{ height: 350 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={executiveData?.strategic_impact || []} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Bar dataKey="placements" name={b('Actual Placements', 'التعيينات الفعلية')} fill="#10B981" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="target" name={b('Target', 'المستهدف')} fill="#8B5CF6" radius={[6, 6, 0, 0]} opacity={0.6} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Pie Chart — Sector Distribution */}
                <Card className="bg-white border border-slate-200/80">
                  <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                      <Globe className="h-4 w-4 text-emerald-600" />
                      {b('Sector Distribution', 'توزيع القطاعات')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div style={{ height: 280 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={executiveData?.sector_distribution || []} dataKey="value" nameKey="name"
                            cx="50%" cy="50%" innerRadius={65} outerRadius={100} paddingAngle={3}>
                            {(executiveData?.sector_distribution || []).map((_: any, i: number) => (
                              <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Full Scorecards Grid */}
              {scorecards && (
                <Card className="bg-white border border-slate-200/80">
                  <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="font-dubai-bold text-slate-900 text-base" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                      {b('Operational KPI Scorecards', 'بطاقات أداء المؤشرات التشغيلية')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {getScorecardItems().map((item) => (
                        <div key={item.key} className={`p-4 rounded-xl border ${item.border} hover:shadow-sm transition-all`} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`p-2 ${item.bg} rounded-lg`}>
                                <item.Icon className={`h-4 w-4 ${item.color}`} />
                              </div>
                              <span className="text-sm font-dubai-medium text-slate-600">{item.label}</span>
                            </div>
                          </div>
                          <p className="text-2xl font-dubai-bold text-slate-900 mt-1">{item.value}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-xs font-dubai-medium ${item.trend?.startsWith('+') ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {item.trend}
                            </span>
                            <span className="text-[10px] text-slate-400 font-dubai">{b('Target', 'الهدف')}: {item.target}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ═══════════════════════════════════════════════════════
                              AI INSIGHTS TAB
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
                          <Badge className={insight.severity === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}>
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

                {/* AI Engine Status */}
                <Card className="bg-white border border-slate-200/80 sticky top-24">
                  <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                      <Brain className="h-4 w-4 text-emerald-600" />
                      {b('AI Analysis Engine', 'محرك التحليل الذكي')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <p className="text-sm text-slate-500 mb-6 font-dubai-medium">
                      {b('Insights are generated by analyzing pipeline anomalies, conversion rates, and engagement metrics.', 'يتم إنشاء الرؤى تلقائيًا من خلال تحليل البيانات.')}
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
                      <Progress value={kpis.emiratization_target_progress || 84} className="h-2 mt-3" />
                      <p className="text-xs text-emerald-500 mt-1 font-dubai">{kpis.emiratization_target_progress || 84}% {b('toward target', 'نحو الهدف')}</p>
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

                  {/* Sector Chart */}
                  <div className="mt-6">
                    <Card className="border border-slate-200/80">
                      <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                        <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                          <Globe className="h-4 w-4 text-emerald-600" />
                          {b('Placement Distribution by Sector', 'توزيع التعيينات حسب القطاع')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div style={{ height: 300 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={executiveData?.sector_distribution || []} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                              <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                              <YAxis dataKey="name" type="category" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar dataKey="value" fill="#10B981" radius={[0, 6, 6, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
