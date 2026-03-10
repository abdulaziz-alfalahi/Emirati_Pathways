import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { restClient } from '@/utils/api';
import {
    BarChart3, Briefcase, DollarSign, Rocket, Plus, Pencil, Trash2,
    Loader2, GraduationCap, Users, TrendingUp, Globe, ExternalLink,
    Building
} from 'lucide-react';

/* ──────────────── Types ──────────────── */
interface SalaryBenchmark {
    id: number;
    role_title: string; role_title_ar?: string;
    industry: string; industry_ar?: string;
    experience_level: string;
    min_salary: number; median_salary: number; max_salary: number;
    currency: string;
}

interface StartupProgram {
    id: number;
    name: string; name_ar?: string;
    location: string; location_ar?: string;
    description: string; description_ar?: string;
    website: string; type: string;
    focus: string[];
    is_active: boolean;
}

/* ──────────────── Component ──────────────── */
const CareerServicesOperatorDashboard: React.FC = () => {
    const { i18n } = useTranslation();
    const { language, toggleLanguage } = useLanguage();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState('overview');

    // ── Salary Benchmarks State ──
    const [salaryData, setSalaryData] = useState<SalaryBenchmark[]>([]);
    const [salaryLoading, setSalaryLoading] = useState(true);
    const [showSalaryForm, setShowSalaryForm] = useState(false);
    const [editingSalary, setEditingSalary] = useState<number | null>(null);
    const [salaryForm, setSalaryForm] = useState({ role_title: '', role_title_ar: '', industry: '', industry_ar: '', experience_level: 'mid', min_salary: '', median_salary: '', max_salary: '', currency: 'AED' });

    // ── Startup Programs State ──
    const [startupData, setStartupData] = useState<StartupProgram[]>([]);
    const [startupLoading, setStartupLoading] = useState(true);
    const [showStartupForm, setShowStartupForm] = useState(false);
    const [editingStartup, setEditingStartup] = useState<number | null>(null);
    const [startupForm, setStartupForm] = useState({ name: '', name_ar: '', location: '', location_ar: '', description: '', description_ar: '', website: '', type: 'accelerator', focus: '' });

    // ── Internship & Gig Counts ──
    const [internshipCount, setInternshipCount] = useState(0);
    const [gigCount, setGigCount] = useState(0);

    // ── Loading Helpers ──
    useEffect(() => { loadSalaryBenchmarks(); loadStartupPrograms(); loadInternshipCount(); loadGigCount(); }, []);

    const loadSalaryBenchmarks = async () => {
        setSalaryLoading(true);
        try {
            const resp = await restClient.get('/api/career-services/salary-benchmarks');
            setSalaryData(resp.data?.benchmarks || []);
        } catch { setSalaryData([]); }
        setSalaryLoading(false);
    };

    const loadStartupPrograms = async () => {
        setStartupLoading(true);
        try {
            const resp = await restClient.get('/api/career-services/startups');
            setStartupData(resp.data?.programs || []);
        } catch { setStartupData([]); }
        setStartupLoading(false);
    };

    const loadInternshipCount = async () => {
        try {
            const resp = await restClient.get('/api/career-services/internships?status=active');
            const list = resp.data?.internships || resp.data || [];
            setInternshipCount(Array.isArray(list) ? list.length : 0);
        } catch { setInternshipCount(0); }
    };

    const loadGigCount = async () => {
        try {
            const resp = await restClient.get('/api/career-services/gigs?status=active');
            const list = resp.data?.gigs || resp.data || [];
            setGigCount(Array.isArray(list) ? list.length : 0);
        } catch { setGigCount(0); }
    };

    // ── Salary CRUD ──
    const handleSaveSalary = async () => {
        try {
            const payload = { ...salaryForm, min_salary: Number(salaryForm.min_salary), median_salary: Number(salaryForm.median_salary), max_salary: Number(salaryForm.max_salary) };
            if (editingSalary) {
                await restClient.put(`/api/career-services/salary-benchmarks/${editingSalary}`, payload);
            } else {
                await restClient.post('/api/career-services/salary-benchmarks', payload);
            }
            toast({ title: t('Saved', 'تم الحفظ') });
            setShowSalaryForm(false); setEditingSalary(null);
            loadSalaryBenchmarks();
        } catch { toast({ title: t('Error', 'خطأ'), variant: 'destructive' }); }
    };

    const handleDeleteSalary = async (id: number) => {
        try { await restClient.delete(`/api/career-services/salary-benchmarks/${id}`); loadSalaryBenchmarks(); }
        catch { toast({ title: t('Error', 'خطأ'), variant: 'destructive' }); }
    };

    // ── Startup CRUD ──
    const handleSaveStartup = async () => {
        try {
            const payload = { ...startupForm, focus: startupForm.focus.split(',').map(s => s.trim()).filter(Boolean) };
            if (editingStartup) {
                await restClient.put(`/api/career-services/startups/${editingStartup}`, payload);
            } else {
                await restClient.post('/api/career-services/startups', payload);
            }
            toast({ title: t('Saved', 'تم الحفظ') });
            setShowStartupForm(false); setEditingStartup(null);
            loadStartupPrograms();
        } catch { toast({ title: t('Error', 'خطأ'), variant: 'destructive' }); }
    };

    const handleDeleteStartup = async (id: number) => {
        try { await restClient.delete(`/api/career-services/startups/${id}`); loadStartupPrograms(); }
        catch { toast({ title: t('Error', 'خطأ'), variant: 'destructive' }); }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 font-dubai" dir={isRTL ? 'rtl' : 'ltr'}>
            <HybridGovernmentNavFixed showAuthButtons={true} onLanguageToggle={toggleLanguage} currentLanguage={language} />

            <div className="pt-20 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-dubai-bold text-slate-900 mb-2">
                            {t('Career Services Management', 'إدارة الخدمات المهنية')}
                        </h1>
                        <p className="text-slate-600 font-dubai-medium">
                            {t('Manage salary benchmarks, startup programs, and career data', 'إدارة معايير الرواتب وبرامج الشركات الناشئة والبيانات المهنية')}
                        </p>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm p-1.5 rounded-xl border border-slate-200/80">
                            <TabsTrigger value="overview" className="font-dubai-medium data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 rounded-lg">
                                <BarChart3 className="h-4 w-4 me-1.5" /> {t('Overview', 'نظرة عامة')}
                            </TabsTrigger>
                            <TabsTrigger value="salary" className="font-dubai-medium data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 rounded-lg">
                                <DollarSign className="h-4 w-4 me-1.5" /> {t('Salary Benchmarks', 'معايير الرواتب')}
                            </TabsTrigger>
                            <TabsTrigger value="startups" className="font-dubai-medium data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 rounded-lg">
                                <Rocket className="h-4 w-4 me-1.5" /> {t('Startup Programs', 'برامج الشركات الناشئة')}
                            </TabsTrigger>
                        </TabsList>

                        {/* ══════════ OVERVIEW TAB ══════════ */}
                        <TabsContent value="overview" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {[
                                    { label: t('Salary Benchmarks', 'معايير الرواتب'), count: salaryData.length, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                    { label: t('Startup Programs', 'برامج الشركات'), count: startupData.length, icon: Rocket, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                    { label: t('Active Internships', 'التدريبات النشطة'), count: internshipCount, icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50' },
                                    { label: t('Active Gigs', 'العمل الحر النشط'), count: gigCount, icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-50' },
                                ].map((stat, i) => (
                                    <Card key={i} className="bg-white border border-slate-200/80">
                                        <CardContent className="pt-4 pb-3 px-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider font-dubai-medium">{stat.label}</p>
                                                    <p className="text-2xl font-dubai-bold text-slate-900 mt-1">{stat.count}</p>
                                                </div>
                                                <div className={`p-2.5 ${stat.bg} rounded-xl`}>
                                                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            <Card className="bg-white">
                                <CardHeader>
                                    <CardTitle className="font-dubai-bold text-lg">{t('Quick Actions', 'إجراءات سريعة')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-3">
                                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-dubai-medium gap-1.5"
                                            onClick={() => { setActiveTab('salary'); setShowSalaryForm(true); }}>
                                            <Plus className="h-4 w-4" /> {t('Add Salary Benchmark', 'إضافة معيار راتب')}
                                        </Button>
                                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-dubai-medium gap-1.5"
                                            onClick={() => { setActiveTab('startups'); setShowStartupForm(true); }}>
                                            <Plus className="h-4 w-4" /> {t('Add Startup Program', 'إضافة برنامج شركة ناشئة')}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ══════════ SALARY BENCHMARKS TAB ══════════ */}
                        <TabsContent value="salary" className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-dubai-bold text-slate-800">{t('Salary Benchmarks', 'معايير الرواتب')}</h2>
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-dubai-medium gap-1"
                                    onClick={() => { setEditingSalary(null); setSalaryForm({ role_title: '', role_title_ar: '', industry: '', industry_ar: '', experience_level: 'mid', min_salary: '', median_salary: '', max_salary: '', currency: 'AED' }); setShowSalaryForm(true); }}>
                                    <Plus className="h-4 w-4" /> {t('Add Benchmark', 'إضافة معيار')}
                                </Button>
                            </div>

                            {showSalaryForm && (
                                <Card className="border-emerald-200 bg-emerald-50/30">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base font-dubai-bold text-emerald-800">
                                            {editingSalary ? t('Edit Benchmark', 'تعديل المعيار') : t('New Salary Benchmark', 'معيار راتب جديد')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-xs font-dubai-medium text-slate-500">{t('Role Title', 'المسمى الوظيفي')}</label>
                                                <Input value={salaryForm.role_title} onChange={e => setSalaryForm(f => ({ ...f, role_title: e.target.value }))} />
                                            </div>
                                            <div>
                                                <label className="text-xs font-dubai-medium text-slate-500">{t('Industry', 'الصناعة')}</label>
                                                <Input value={salaryForm.industry} onChange={e => setSalaryForm(f => ({ ...f, industry: e.target.value }))} />
                                            </div>
                                            <div>
                                                <label className="text-xs font-dubai-medium text-slate-500">{t('Experience Level', 'مستوى الخبرة')}</label>
                                                <select value={salaryForm.experience_level} onChange={e => setSalaryForm(f => ({ ...f, experience_level: e.target.value }))}
                                                    className="w-full h-10 px-3 border border-input rounded-md text-sm bg-white">
                                                    <option value="entry">Entry</option>
                                                    <option value="mid">Mid</option>
                                                    <option value="senior">Senior</option>
                                                    <option value="executive">Executive</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-dubai-medium text-slate-500">{t('Min Salary', 'الحد الأدنى')}</label>
                                                <Input type="number" value={salaryForm.min_salary} onChange={e => setSalaryForm(f => ({ ...f, min_salary: e.target.value }))} />
                                            </div>
                                            <div>
                                                <label className="text-xs font-dubai-medium text-slate-500">{t('Median Salary', 'متوسط الراتب')}</label>
                                                <Input type="number" value={salaryForm.median_salary} onChange={e => setSalaryForm(f => ({ ...f, median_salary: e.target.value }))} />
                                            </div>
                                            <div>
                                                <label className="text-xs font-dubai-medium text-slate-500">{t('Max Salary', 'الحد الأقصى')}</label>
                                                <Input type="number" value={salaryForm.max_salary} onChange={e => setSalaryForm(f => ({ ...f, max_salary: e.target.value }))} />
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-4 justify-end">
                                            <Button variant="outline" size="sm" onClick={() => setShowSalaryForm(false)}>{t('Cancel', 'إلغاء')}</Button>
                                            <Button size="sm" className="bg-emerald-600 text-white" onClick={handleSaveSalary}>{editingSalary ? t('Update', 'تحديث') : t('Create', 'إنشاء')}</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {salaryLoading ? (
                                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>
                            ) : salaryData.length === 0 ? (
                                <Card className="border-dashed border-2 border-slate-200">
                                    <CardContent className="py-12 text-center">
                                        <DollarSign className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                        <p className="text-slate-500 font-dubai-medium">{t('No salary benchmarks yet', 'لا توجد معايير رواتب بعد')}</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="bg-white border border-slate-200/80">
                                    <CardContent className="p-0">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                                    <th className={`px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider font-dubai-medium ${isRTL ? 'text-right' : 'text-left'}`}>{t('Role', 'المسمى')}</th>
                                                    <th className={`px-3 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider font-dubai-medium ${isRTL ? 'text-right' : 'text-left'}`}>{t('Industry', 'الصناعة')}</th>
                                                    <th className="px-3 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider font-dubai-medium text-center">{t('Level', 'المستوى')}</th>
                                                    <th className="px-3 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider font-dubai-medium text-center">{t('Range (AED)', 'النطاق')}</th>
                                                    <th className="px-3 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider font-dubai-medium text-center">{t('Actions', 'إجراءات')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {salaryData.map(b => (
                                                    <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                                        <td className="px-5 py-3 font-dubai-medium text-slate-800">{isRTL ? (b.role_title_ar || b.role_title) : b.role_title}</td>
                                                        <td className="px-3 py-3 text-slate-600 font-dubai">{b.industry}</td>
                                                        <td className="px-3 py-3 text-center"><Badge className="text-[10px] bg-slate-100 text-slate-600 border-0">{b.experience_level}</Badge></td>
                                                        <td className="px-3 py-3 text-center font-dubai-medium text-slate-700">{Number(b.min_salary).toLocaleString()} – {Number(b.max_salary).toLocaleString()}</td>
                                                        <td className="px-3 py-3 text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-500 hover:text-emerald-600"
                                                                    onClick={() => {
                                                                        setEditingSalary(b.id);
                                                                        setSalaryForm({ role_title: b.role_title, role_title_ar: b.role_title_ar || '', industry: b.industry, industry_ar: b.industry_ar || '', experience_level: b.experience_level, min_salary: String(b.min_salary), median_salary: String(b.median_salary), max_salary: String(b.max_salary), currency: b.currency });
                                                                        setShowSalaryForm(true);
                                                                    }}>
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-500 hover:text-red-600" onClick={() => handleDeleteSalary(b.id)}>
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        {/* ══════════ STARTUP PROGRAMS TAB ══════════ */}
                        <TabsContent value="startups" className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-dubai-bold text-slate-800">{t('Startup Programs', 'برامج الشركات الناشئة')}</h2>
                                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-dubai-medium gap-1"
                                    onClick={() => { setEditingStartup(null); setStartupForm({ name: '', name_ar: '', location: '', location_ar: '', description: '', description_ar: '', website: '', type: 'accelerator', focus: '' }); setShowStartupForm(true); }}>
                                    <Plus className="h-4 w-4" /> {t('Add Program', 'إضافة برنامج')}
                                </Button>
                            </div>

                            {showStartupForm && (
                                <Card className="border-indigo-200 bg-indigo-50/30">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base font-dubai-bold text-indigo-800">
                                            {editingStartup ? t('Edit Program', 'تعديل البرنامج') : t('New Startup Program', 'برنامج شركة ناشئة جديد')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-dubai-medium text-slate-500">{t('Program Name', 'اسم البرنامج')}</label>
                                                <Input value={startupForm.name} onChange={e => setStartupForm(f => ({ ...f, name: e.target.value }))} />
                                            </div>
                                            <div>
                                                <label className="text-xs font-dubai-medium text-slate-500">{t('Location', 'الموقع')}</label>
                                                <Input value={startupForm.location} onChange={e => setStartupForm(f => ({ ...f, location: e.target.value }))} />
                                            </div>
                                            <div>
                                                <label className="text-xs font-dubai-medium text-slate-500">{t('Website', 'الموقع الإلكتروني')}</label>
                                                <Input value={startupForm.website} onChange={e => setStartupForm(f => ({ ...f, website: e.target.value }))} placeholder="example.com" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-dubai-medium text-slate-500">{t('Type', 'النوع')}</label>
                                                <select value={startupForm.type} onChange={e => setStartupForm(f => ({ ...f, type: e.target.value }))}
                                                    className="w-full h-10 px-3 border border-input rounded-md text-sm bg-white">
                                                    <option value="accelerator">Accelerator</option>
                                                    <option value="incubator">Incubator</option>
                                                    <option value="venture_studio">Venture Studio</option>
                                                    <option value="coworking">Coworking</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-xs font-dubai-medium text-slate-500">{t('Focus Areas (comma-separated)', 'مجالات التركيز')}</label>
                                                <Input value={startupForm.focus} onChange={e => setStartupForm(f => ({ ...f, focus: e.target.value }))} placeholder="FinTech, HealthTech, AI" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-xs font-dubai-medium text-slate-500">{t('Description', 'الوصف')}</label>
                                                <Textarea value={startupForm.description} onChange={e => setStartupForm(f => ({ ...f, description: e.target.value }))} rows={2} />
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-4 justify-end">
                                            <Button variant="outline" size="sm" onClick={() => setShowStartupForm(false)}>{t('Cancel', 'إلغاء')}</Button>
                                            <Button size="sm" className="bg-indigo-600 text-white" onClick={handleSaveStartup}>{editingStartup ? t('Update', 'تحديث') : t('Create', 'إنشاء')}</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {startupLoading ? (
                                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
                            ) : startupData.length === 0 ? (
                                <Card className="border-dashed border-2 border-slate-200">
                                    <CardContent className="py-12 text-center">
                                        <Rocket className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                        <p className="text-slate-500 font-dubai-medium">{t('No startup programs yet', 'لا توجد برامج بعد')}</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {startupData.map(prog => (
                                        <Card key={prog.id} className="bg-white border border-slate-200/80 hover:shadow-md transition-shadow">
                                            <CardContent className="pt-5 pb-4 px-5">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Badge className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200 font-dubai-medium">{prog.type}</Badge>
                                                            {!prog.is_active && <Badge className="text-[10px] bg-red-50 text-red-600 border-red-200">Inactive</Badge>}
                                                        </div>
                                                        <h3 className="font-dubai-bold text-slate-800 text-base mt-1">{isRTL ? (prog.name_ar || prog.name) : prog.name}</h3>
                                                        <p className="text-xs text-slate-500 font-dubai flex items-center gap-1 mt-0.5">
                                                            <Building className="h-3 w-3" /> {prog.location}
                                                        </p>
                                                        <p className="text-xs text-slate-500 font-dubai mt-1 line-clamp-2">{prog.description}</p>
                                                        {prog.focus && prog.focus.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                {prog.focus.map((f, i) => (
                                                                    <Badge key={i} className="text-[9px] bg-slate-100 text-slate-600 border-0 font-dubai">{f}</Badge>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {prog.website && (
                                                            <a href={`https://${prog.website}`} target="_blank" rel="noopener noreferrer"
                                                                className="text-xs text-indigo-600 hover:underline flex items-center gap-1 mt-2 font-dubai-medium">
                                                                <Globe className="h-3 w-3" /> {prog.website} <ExternalLink className="h-3 w-3" />
                                                            </a>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-1 ml-3">
                                                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-500 hover:text-indigo-600"
                                                            onClick={() => {
                                                                setEditingStartup(prog.id);
                                                                setStartupForm({ name: prog.name, name_ar: prog.name_ar || '', location: prog.location, location_ar: prog.location_ar || '', description: prog.description, description_ar: prog.description_ar || '', website: prog.website, type: prog.type, focus: (prog.focus || []).join(', ') });
                                                                setShowStartupForm(true);
                                                            }}>
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-500 hover:text-red-600" onClick={() => handleDeleteStartup(prog.id)}>
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default CareerServicesOperatorDashboard;
