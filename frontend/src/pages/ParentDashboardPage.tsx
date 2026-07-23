import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import UserMenu from '@/components/layout/UserMenu';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ParentAssessmentOverview } from '@/components/assessments/ParentAssessmentOverview';
import { restClient } from '@/utils/api';
import AiAssistPanel from '@/components/ai/AiAssistPanel';
import {
    Users, GraduationCap, Calendar, BookOpen, MapPin, Clock,
    ArrowRight, ArrowLeft, CheckCircle, TrendingUp, Award, Star, Heart,
    BarChart3, Lightbulb, Shield, Sparkles, ChevronRight, ChevronLeft,
    Target, School, Trophy, Briefcase
} from 'lucide-react';

/* ────────────────────────── COMPONENT ──────────────────────────── */

const ParentDashboardPage: React.FC = () => {
    const { user } = useAuth();
    const { language, toggleLanguage } = useLanguage();
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
    const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

    const [activeTab, setActiveTab] = useState('overview');
    const [childApplications, setChildApplications] = useState<any[]>([]);
    const [apiChildren, setApiChildren] = useState<any[] | null>(null);
    const [apiLoading, setApiLoading] = useState(true);

    useEffect(() => {
        const loadApps = async () => {
            try {
                const resp = await restClient.get('/api/career-services/parent/child-applications?child_id=1');
                setChildApplications(resp.data?.applications || []);
            } catch { setChildApplications([]); }
        };
        loadApps();

        // Load real children data from parent dashboard API
        const loadDashboard = async () => {
            try {
                const resp = await restClient.get('/api/career-services/parent/dashboard');
                if (resp.data?.success && resp.data?.children?.length > 0) {
                    const kids = resp.data.children.map((c: any, i: number) => ({
                        id: c.id || `child-${i + 1}`,
                        name: t(`${c.first_name}`, c.arabic_name?.split(' ')[0] || c.first_name),
                        age: c.age || 0,
                        grade: c.grade || '',
                        gpa: c.gpa || 0,
                        attendance: c.attendance || 0,
                        trend: 'up' as const,
                        subjects: (c.subjects || []).map((s: any) => ({
                            name: s.name || '',
                            grade: s.grade || '',
                            progress: Number(s.progress) || 0,
                        })),
                        activities: c.activities || [],
                        campsEnrolled: c.campsEnrolled || 0,
                    }));
                    setApiChildren(kids);
                }
            } catch { /* fallback to hardcoded */ }
            finally { setApiLoading(false); }
        };
        loadDashboard();
    }, []);

    const firstName = user?.first_name || user?.full_name?.split(' ')[0] || t('Parent', 'ولي الأمر');
    const initial = firstName.charAt(0).toUpperCase();

    /* ─────────────────────────── DATA ─────────────────────────── */

    // Only show real children returned by the API. No fabricated academic
    // records — when the API returns none, the UI shows an honest empty state.
    const childrenData = apiChildren ?? [];

    // Knowledge camps and upcoming events have no API backing yet. Rather than
    // fabricate specific camps, spot counts, and events, present honest empty
    // states until a real data source is wired up.
    const knowledgeCamps: {
        id: string;
        title: string;
        category: string;
        categoryLabel: string;
        dates: string;
        location: string;
        ages: string;
        spotsLeft: number;
        children: { name: string; status: 'enrolled' | 'eligible' | 'not-eligible' }[];
    }[] = [];

    const upcomingEvents: {
        id: number;
        title: string;
        date: string;
        time: string;
        type: string;
    }[] = [];

    /* ─────────────────────────── HELPERS ─────────────────────────── */

    const statusBadge = (status: 'enrolled' | 'eligible' | 'not-eligible') => {
        const config: Record<string, { className: string; label: string }> = {
            'enrolled': { className: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: t('✓ Enrolled', '✓ مسجّل') },
            'eligible': { className: 'bg-blue-100 text-blue-700 border-blue-200', label: t('Eligible', 'مؤهل') },
            'not-eligible': { className: 'bg-gray-100 text-gray-500 border-gray-200', label: t('Age mismatch', 'غير مناسب للعمر') },
        };
        const s = config[status];
        return <Badge variant="outline" className={`text-[11px] font-medium ${s.className}`}>{s.label}</Badge>;
    };

    const categoryColor = (cat: string) => {
        switch (cat) {
            case 'Technology': return 'bg-blue-100 text-blue-700';
            case 'Language': return 'bg-emerald-100 text-emerald-700';
            case 'Leadership': return 'bg-amber-100 text-amber-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const eventIcon = (type: string) => {
        switch (type) {
            case 'meeting': return <Users className="h-4 w-4 text-blue-500" />;
            case 'event': return <Star className="h-4 w-4 text-amber-500" />;
            case 'deadline': return <Clock className="h-4 w-4 text-red-500" />;
            default: return <Calendar className="h-4 w-4 text-gray-500" />;
        }
    };

    const totalEnrolled = childrenData.reduce((sum, c) => sum + c.campsEnrolled, 0);

    const resources = [
        { title: t('Academic Reports', 'التقارير الأكاديمية'), desc: t('View detailed progress reports', 'عرض تقارير التقدّم المفصّلة'), icon: BarChart3, color: 'bg-blue-100 text-blue-600', href: '#' },
        { title: t('Knowledge Camps', 'المعسكرات المعرفية'), desc: t('Browse and register', 'تصفّح وسجّل'), icon: School, color: 'bg-teal-100 text-teal-600', href: '/knowledge-camps' },
        { title: t('Scholarships', 'المنح الدراسية'), desc: t('Financial aid options', 'خيارات المساعدة المالية'), icon: Award, color: 'bg-amber-100 text-amber-600', href: '/scholarships' },
        { title: t('Career Guidance', 'التوجيه المهني'), desc: t('Plan their future path', 'خطّط لمسارهم المستقبلي'), icon: Target, color: 'bg-purple-100 text-purple-600', href: '/career-planning-hub' },
        { title: t('School Programs', 'البرامج المدرسية'), desc: t('Explore school activities', 'استكشف الأنشطة المدرسية'), icon: BookOpen, color: 'bg-indigo-100 text-indigo-600', href: '/school-programs' },
        { title: t('University Programs', 'البرامج الجامعية'), desc: t('Higher education paths', 'مسارات التعليم العالي'), icon: GraduationCap, color: 'bg-emerald-100 text-emerald-600', href: '/university-programs' },
        { title: t('LMS & Courses', 'نظام التعلّم والدورات'), desc: t('Online learning resources', 'موارد التعلّم الإلكتروني'), icon: Lightbulb, color: 'bg-orange-100 text-orange-600', href: '/lms' },
        { title: t('Safety & Wellbeing', 'السلامة والرفاهية'), desc: t('Child safety resources', 'موارد سلامة الأطفال'), icon: Shield, color: 'bg-rose-100 text-rose-600', href: '#' },
    ];

    return (
        <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* ── Government Navigation ── */}
            <HybridGovernmentNavFixed
                showAuthButtons={false}
                currentPage="dashboard"
                userRole="parent"
                currentLanguage={language}
                onLanguageToggle={toggleLanguage}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* ── Welcome Hero ── */}
                <div className="flex justify-between items-center">
                    <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-xl">{initial}</span>
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-dubai-bold text-foreground animate-in fade-in slide-in-from-left-4 duration-500">
                                {t(`Welcome back, ${firstName}! 👋`, `مرحباً بعودتك، ${firstName}! 👋`)}
                            </h1>
                            <p className="text-muted-foreground mt-1 font-dubai-medium">
                                {t("Monitor your children's education, activities, and growth", 'تابع تعليم أبنائك وأنشطتهم ونموهم')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── AI guidance for guardians (no child names/identifiers are sent) ── */}
                <AiAssistPanel
                    feature="study_pathway"
                    title="AI guidance for guardians"
                    titleAr="إرشاد لأولياء الأمور بالذكاء الاصطناعي"
                    getContext={() => ({
                        grade_level: childrenData.map((c: any) => c.grade).filter(Boolean).slice(0, 30),
                        interests: [
                            ...childrenData.flatMap((c: any) => c.activities || []),
                            ...childApplications.map((a: any) => a.type),
                        ].filter(Boolean).slice(0, 30),
                        strengths: childrenData
                            .flatMap((c: any) => (c.subjects || []).map((s: any) => s.name))
                            .filter(Boolean).slice(0, 30),
                    })}
                />

                {/* ── Stats Grid ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Children */}
                    <Card className="hover:shadow-md transition-shadow duration-200">
                        <CardContent className="pt-6">
                            <div className="flex items-center">
                                <div className="p-3 bg-blue-100 rounded-full">
                                    <Users className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="ms-4">
                                    <p className="text-sm font-dubai-medium text-muted-foreground">{t('Children', 'الأبناء')}</p>
                                    <p className="text-2xl font-dubai-bold text-foreground">{childrenData.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Active Enrolments */}
                    <Card className="hover:shadow-md transition-shadow duration-200">
                        <CardContent className="pt-6">
                            <div className="flex items-center">
                                <div className="p-3 bg-emerald-100 rounded-full">
                                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                                </div>
                                <div className="ms-4">
                                    <p className="text-sm font-dubai-medium text-muted-foreground">{t('Camp Enrolments', 'التسجيل في المعسكرات')}</p>
                                    <p className="text-2xl font-dubai-bold text-foreground">{totalEnrolled}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Upcoming Events */}
                    <Card className="hover:shadow-md transition-shadow duration-200">
                        <CardContent className="pt-6">
                            <div className="flex items-center">
                                <div className="p-3 bg-purple-100 rounded-full">
                                    <Calendar className="h-6 w-6 text-purple-600" />
                                </div>
                                <div className="ms-4">
                                    <p className="text-sm font-dubai-medium text-muted-foreground">{t('Upcoming Events', 'الفعاليات القادمة')}</p>
                                    <p className="text-2xl font-dubai-bold text-foreground">{upcomingEvents.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Gradient Accent CTA */}
                    <Card className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-dubai-bold text-lg">{t('Quick Actions', 'إجراءات سريعة')}</h3>
                                <Sparkles className="h-6 w-6 opacity-80" />
                            </div>
                            <p className="text-teal-50 text-sm mb-4">{t("Browse programmes and track your children's progress.", 'تصفّح البرامج وتابع تقدّم أبنائك.')}</p>
                            <Link to="/knowledge-camps">
                                <Button variant="secondary" size="sm" className="w-full text-teal-700 font-semibold">
                                    {t('Browse Camps', 'تصفّح المعسكرات')} <ArrowIcon className={`h-4 w-4 ms-2`} />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Tabbed Content ── */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className={`flex w-full bg-muted/50 p-1 rounded-xl shadow-sm ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                        <TabsTrigger value="overview" className="flex-1">{t('Overview', 'نظرة عامة')}</TabsTrigger>
                        <TabsTrigger value="children" className="flex-1">{t('Children', 'الأبناء')}</TabsTrigger>
                        <TabsTrigger value="camps" className="flex-1">{t('Knowledge Camps', 'المعسكرات المعرفية')}</TabsTrigger>
                        <TabsTrigger value="assessments" className="flex-1">{t('Assessments', 'التقييمات')}</TabsTrigger>
                        <TabsTrigger value="resources" className="flex-1">{t('Resources', 'الموارد')}</TabsTrigger>
                        <TabsTrigger value="opportunities" className="flex-1">{t('Opportunities', 'الفرص')}</TabsTrigger>
                    </TabsList>

                    {/* ────── OVERVIEW TAB ────── */}
                    <TabsContent value="overview" className="space-y-6 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Children Summary */}
                            <div className="lg:col-span-2 space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5 text-teal-600" /> {t('Academic Overview', 'النظرة الأكاديمية')}
                                </h3>
                                {childrenData.length === 0 ? (
                                    <Card className="border-dashed border-2">
                                        <CardContent className="py-12 text-center">
                                            <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                            <p className="text-muted-foreground font-medium">{t('No children linked to this account', 'لا يوجد أبناء مرتبطون بهذا الحساب')}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{t("Once children are linked, their academic overview will appear here", 'بمجرد ربط الأبناء، ستظهر نظرتهم الأكاديمية هنا')}</p>
                                        </CardContent>
                                    </Card>
                                ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {childrenData.map(child => (
                                        <Card key={child.id} className="hover:shadow-md transition-shadow duration-200">
                                            <CardContent className="pt-6">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                                                            <span className="text-white font-bold text-sm">{child.name[0]}</span>
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold">{child.name}</p>
                                                            <p className="text-xs text-muted-foreground">{t('Grade', 'الصف')} {child.grade} · {t('Age', 'العمر')} {child.age}</p>
                                                        </div>
                                                    </div>
                                                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                                                        <TrendingUp className="h-3 w-3 me-1" />
                                                        {child.gpa} {t('GPA', 'المعدل')}
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 mt-4">
                                                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                                                        <p className="text-2xl font-bold text-blue-700">{child.gpa}</p>
                                                        <p className="text-xs text-blue-600">{t('GPA / 4.0', 'المعدل / 4.0')}</p>
                                                    </div>
                                                    <div className="bg-emerald-50 rounded-lg p-3 text-center">
                                                        <p className="text-2xl font-bold text-emerald-700">{child.attendance}%</p>
                                                        <p className="text-xs text-emerald-600">{t('Attendance', 'الحضور')}</p>
                                                    </div>
                                                </div>

                                                <div className="mt-3 flex flex-wrap gap-1.5">
                                                    {child.activities.map(a => (
                                                        <Badge key={a} variant="outline" className="text-[11px]">{a}</Badge>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                                )}
                            </div>

                            {/* Upcoming Events Sidebar */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-purple-600" /> {t('Upcoming Events', 'الفعاليات القادمة')}
                                </h3>
                                <Card>
                                    <CardContent className="pt-4 divide-y">
                                        {upcomingEvents.length === 0 ? (
                                            <div className="py-8 text-center">
                                                <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                                <p className="text-sm text-muted-foreground font-medium">{t('No upcoming events', 'لا توجد فعاليات قادمة')}</p>
                                            </div>
                                        ) : (
                                            upcomingEvents.map(evt => (
                                                <div key={evt.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                                                    <div className="mt-0.5 p-2 rounded-lg bg-muted">
                                                        {eventIcon(evt.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{evt.title}</p>
                                                        <p className="text-xs text-muted-foreground">{evt.date} · {evt.time}</p>
                                                    </div>
                                                    <ChevronIcon className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                                                </div>
                                            ))
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ────── CHILDREN TAB ────── */}
                    <TabsContent value="children" className="space-y-6 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {childrenData.length === 0 && (
                            <Card className="border-dashed border-2">
                                <CardContent className="py-12 text-center">
                                    <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                    <p className="text-muted-foreground font-medium">{t('No children linked to this account', 'لا يوجد أبناء مرتبطون بهذا الحساب')}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{t("Once children are linked, their academic records will appear here", 'بمجرد ربط الأبناء، ستظهر سجلاتهم الأكاديمية هنا')}</p>
                                </CardContent>
                            </Card>
                        )}
                        {childrenData.map(child => (
                            <Card key={child.id} className="hover:shadow-md transition-shadow duration-200">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow">
                                                <span className="text-white font-bold text-lg">{child.name[0]}</span>
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl">{child.name}</CardTitle>
                                                <CardDescription>{t('Grade', 'الصف')} {child.grade} · {t('Age', 'العمر')} {child.age}</CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                                                <TrendingUp className={`h-3 w-3 me-1`} />{t('GPA', 'المعدل')} {child.gpa}
                                            </Badge>
                                            <Badge variant="outline">{child.attendance}% {t('Attendance', 'الحضور')}</Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    {/* Subject Progress Bars */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">{t('Subjects', 'المواد الدراسية')}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {child.subjects.map(subj => (
                                                <div key={subj.name} className="flex items-center gap-3">
                                                    <span className="text-sm font-medium w-24 truncate">{subj.name}</span>
                                                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all duration-500"
                                                            style={{ width: `${subj.progress}%` }}
                                                        />
                                                    </div>
                                                    <Badge variant="outline" className="text-[11px] min-w-[32px] justify-center">{subj.grade}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Activities */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('Extracurriculars', 'الأنشطة اللاصفية')}</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {child.activities.map(a => (
                                                <Badge key={a} className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">{a}</Badge>
                                            ))}
                                            <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">
                                                {child.campsEnrolled} {child.campsEnrolled !== 1 ? t('Camps', 'معسكرات') : t('Camp', 'معسكر')} {t('Enrolled', 'مسجّل')}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-2">
                                        <Button variant="outline" size="sm">
                                            <BarChart3 className={`h-4 w-4 me-2`} /> {t('Full Academic Report', 'التقرير الأكاديمي الكامل')}
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <Calendar className={`h-4 w-4 me-2`} /> {t('Schedule Meeting', 'جدولة اجتماع')}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </TabsContent>

                    {/* ────── KNOWLEDGE CAMPS TAB ────── */}
                    <TabsContent value="camps" className="space-y-6 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">{t('Knowledge Camps', 'المعسكرات المعرفية')}</h2>
                                <p className="text-sm text-muted-foreground">{t('Browse and manage camp enrolments for your children', 'تصفّح وأدِر تسجيل أبنائك في المعسكرات')}</p>
                            </div>
                            <Link to="/knowledge-camps">
                                <Button variant="outline" size="sm" className="gap-1">
                                    {t('Browse All Camps', 'تصفّح جميع المعسكرات')} <ArrowIcon className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>

                        {knowledgeCamps.length === 0 ? (
                            <Card className="border-dashed border-2">
                                <CardContent className="py-12 text-center">
                                    <School className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                    <p className="text-muted-foreground font-medium">{t('No camp enrolments available', 'لا تتوفر تسجيلات في المعسكرات')}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{t('Browse available knowledge camps to get started', 'تصفّح المعسكرات المعرفية المتاحة للبدء')}</p>
                                    <Link to="/knowledge-camps">
                                        <Button variant="outline" size="sm" className="mt-4 gap-1">
                                            {t('Browse All Camps', 'تصفّح جميع المعسكرات')} <ArrowIcon className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ) : (
                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {knowledgeCamps.map(camp => (
                                <Card key={camp.id} className="hover:shadow-lg transition-all duration-200 overflow-hidden group">
                                    <div className="h-1.5 bg-gradient-to-r from-teal-400 to-emerald-500" />
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <CardTitle className="text-base group-hover:text-teal-700 transition-colors">{camp.title}</CardTitle>
                                            <Badge className={`text-[11px] shrink-0 ${categoryColor(camp.category)}`}>{camp.categoryLabel}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="space-y-1.5 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {camp.dates}</div>
                                            <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {camp.location}</div>
                                            <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {t('Ages', 'الأعمار')} {camp.ages}</div>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-xs">
                                            <Clock className="h-3 w-3 text-orange-500" />
                                            <span className={camp.spotsLeft <= 10 ? 'text-orange-600 font-medium' : 'text-muted-foreground'}>
                                                {camp.spotsLeft} {t('spots remaining', 'مقعد متبقٍ')}
                                            </span>
                                        </div>

                                        <div className="bg-muted/60 rounded-xl p-3 space-y-2">
                                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t('Your Children', 'أبناؤك')}</p>
                                            {camp.children.map((child, i) => (
                                                <div key={i} className="flex items-center justify-between">
                                                    <span className="text-sm font-medium">{child.name}</span>
                                                    {statusBadge(child.status)}
                                                </div>
                                            ))}
                                        </div>

                                        <Button size="sm" className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                                            {t('Manage Enrolment', 'إدارة التسجيل')}
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        )}
                    </TabsContent>

                    {/* ────── ASSESSMENTS TAB ────── */}
                    <TabsContent value="assessments" className="space-y-6 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 gap-6">
                            {childrenData.length === 0 ? (
                                <Card className="border-dashed border-2">
                                    <CardContent className="py-12 text-center">
                                        <BarChart3 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                        <p className="text-muted-foreground font-medium">{t('No assessments available', 'لا تتوفر تقييمات')}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{t("Assessment results appear once children are linked to this account", 'تظهر نتائج التقييم بمجرد ربط الأبناء بهذا الحساب')}</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                childrenData.map(child => (
                                    <ParentAssessmentOverview
                                        key={child.id}
                                        childId={child.id}
                                        childName={child.name}
                                    />
                                ))
                            )}
                        </div>
                    </TabsContent>

                    {/* ────── RESOURCES TAB ────── */}
                    <TabsContent value="resources" className="space-y-6 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h3 className="text-lg font-semibold">{t('Parent Resources', 'موارد أولياء الأمور')}</h3>
                        <p className="text-sm text-muted-foreground -mt-4">{t("Tools and information to support your children's journey", 'أدوات ومعلومات لدعم مسيرة أبنائك')}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {resources.map(item => (
                                <Link to={item.href} key={item.title}>
                                    <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group h-full">
                                        <CardContent className="pt-6">
                                            <div className={`p-3 rounded-xl ${item.color} w-fit mb-3 group-hover:scale-110 transition-transform duration-200`}>
                                                <item.icon className="h-5 w-5" />
                                            </div>
                                            <h4 className="font-semibold text-sm group-hover:text-teal-700 transition-colors">{item.title}</h4>
                                            <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </TabsContent>

                    {/* ────── OPPORTUNITIES TAB ────── */}
                    <TabsContent value="opportunities" className="space-y-6 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-lg font-semibold">{t("Your Children's Applications", 'طلبات أبنائك')}</h2>
                            <p className="text-sm text-muted-foreground">{t('Track internship, gig, and scholarship applications', 'تابع طلبات التدريب والعمل الحر والمنح')}</p>
                        </div>
                        {childApplications.length === 0 ? (
                            <Card className="border-dashed border-2">
                                <CardContent className="py-12 text-center">
                                    <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                    <p className="text-muted-foreground font-medium">{t('No applications yet', 'لا توجد طلبات بعد')}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{t("Your children's internship and scholarship applications will appear here", 'ستظهر طلبات التدريب والمنح لأبنائك هنا')}</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {childApplications.map((app: any, i: number) => (
                                    <Card key={i} className="hover:shadow-md transition-shadow">
                                        <CardContent className="pt-5 pb-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge className={`text-[10px] ${app.type === 'internship' ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                            : app.type === 'gig' ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            }`}>
                                                            {app.type === 'internship' ? t('Internship', 'تدريب') : app.type === 'gig' ? t('Gig', 'عمل حر') : t('Scholarship', 'منحة')}
                                                        </Badge>
                                                    </div>
                                                    <h3 className="font-semibold text-foreground">{app.title}</h3>
                                                    <p className="text-sm text-muted-foreground">{app.company}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">{t('Applied', 'تقدم')}: {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : '—'}</p>
                                                </div>
                                                <div className="text-end space-y-1">
                                                    <Badge className={`text-[10px] ${app.educator_status === 'approved' ? 'bg-green-50 text-green-700 border-green-200'
                                                        : app.educator_status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200'
                                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                                        }`}>
                                                        {app.educator_status === 'approved' ? t('✓ Educator Approved', '✓ موافقة المعلم')
                                                            : app.educator_status === 'rejected' ? t('✗ Educator Rejected', '✗ رفض المعلم')
                                                                : t('⏳ Pending Review', '⏳ قيد المراجعة')}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

export default ParentDashboardPage;
