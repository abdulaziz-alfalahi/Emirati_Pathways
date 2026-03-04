
import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    BarChart3, TrendingUp, Target, Award, Users,
    Clock, ChevronRight, ChevronLeft, Star, CheckCircle, Zap,
    Brain, BookOpen, Briefcase, ArrowUpRight, ArrowDownRight,
    Calendar, Eye, FileText
} from 'lucide-react';

// Brand tokens (unified with Education Pathway)
const brand = {
    primary: '#0D9488',
    primaryDark: '#0F766E',
    primarySurface: '#F0FDFA',
    border: '#E5E7EB',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    amber: '#FEF3C7',
    amberText: '#92400E',
    green: '#DCFCE7',
    greenText: '#166534',
    red: '#FEE2E2',
    redText: '#991B1B',
    blue: '#DBEAFE',
    blueText: '#1E40AF',
    purple: '#F3E8FF',
    purpleText: '#6B21A8',
};

/* ──────────────────────── COMPONENT ──────────────────────── */

const AnalyticsPage: React.FC = () => {

    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

    /* ──────────────────────── DATA ──────────────────────── */

    const overviewMetrics = [
        { label: t('Profile Views', 'مشاهدات الملف'), value: '1,247', change: '+12%', up: true, Icon: Eye },
        { label: t('Applications Sent', 'الطلبات المرسلة'), value: '18', change: '+3', up: true, Icon: FileText },
        { label: t('Interview Rate', 'معدل المقابلات'), value: '33%', change: '+5%', up: true, Icon: Users },
        { label: t('Avg. Match Score', 'متوسط درجة التوافق'), value: '87%', change: '+2%', up: true, Icon: Target },
        { label: t('Skills Completed', 'المهارات المكتملة'), value: '12', change: '+2', up: true, Icon: Brain },
        { label: t('Certifications', 'الشهادات'), value: '4', change: '+1', up: true, Icon: Award },
    ];

    const weeklyActivity = [
        { day: t('Mon', 'الإثنين'), applications: 3, views: 42 },
        { day: t('Tue', 'الثلاثاء'), applications: 1, views: 55 },
        { day: t('Wed', 'الأربعاء'), applications: 2, views: 38 },
        { day: t('Thu', 'الخميس'), applications: 4, views: 67 },
        { day: t('Fri', 'الجمعة'), applications: 2, views: 51 },
        { day: t('Sat', 'السبت'), applications: 0, views: 22 },
        { day: t('Sun', 'الأحد'), applications: 1, views: 18 },
    ];

    const topSkills = [
        { name: t('Project Management', 'إدارة المشاريع'), level: 92, demand: t('High', 'مرتفع'), demandKey: 'High' },
        { name: t('Data Analysis', 'تحليل البيانات'), level: 85, demand: t('Very High', 'مرتفع جداً'), demandKey: 'Very High' },
        { name: t('Cloud Architecture', 'هندسة السحابة'), level: 78, demand: t('High', 'مرتفع'), demandKey: 'High' },
        { name: t('Leadership', 'القيادة'), level: 88, demand: t('Medium', 'متوسط'), demandKey: 'Medium' },
        { name: t('Communication', 'التواصل'), level: 82, demand: t('High', 'مرتفع'), demandKey: 'High' },
    ];

    const careerMilestones = [
        { title: t('Completed Leadership Assessment', 'أكمل تقييم القيادة'), date: t('Feb 15, 2026', '15 فبراير 2026'), type: t('Assessment', 'تقييم'), icon: '🏆' },
        { title: t('Applied to Emirates Group', 'تقدّم لمجموعة الإمارات'), date: t('Feb 12, 2026', '12 فبراير 2026'), type: t('Application', 'طلب'), icon: '📨' },
        { title: t('Earned Digital Literacy Badge', 'حصل على شارة الإلمام الرقمي'), date: t('Feb 10, 2026', '10 فبراير 2026'), type: t('Badge', 'شارة'), icon: '🎖️' },
        { title: t('Portfolio viewed by 3 recruiters', 'شوهد الملف من قبل 3 موظِّفين'), date: t('Feb 8, 2026', '8 فبراير 2026'), type: t('Engagement', 'تفاعل'), icon: '👀' },
        { title: t('Completed AWS Cloud Certification', 'أكمل شهادة AWS السحابية'), date: t('Feb 5, 2026', '5 فبراير 2026'), type: t('Certification', 'شهادة'), icon: '📜' },
    ];

    const goalProgress = [
        { title: t('Complete 5 Assessments', 'أكمل 5 تقييمات'), current: 3, target: 5, deadline: t('Mar 2026', 'مارس 2026') },
        { title: t('Apply to 20 Positions', 'تقدّم لـ 20 وظيفة'), current: 18, target: 20, deadline: t('Mar 2026', 'مارس 2026') },
        { title: t('Earn 5 Certifications', 'احصل على 5 شهادات'), current: 4, target: 5, deadline: t('Apr 2026', 'أبريل 2026') },
        { title: t('Reach 90% Match Score', 'حقّق 90% درجة توافق'), current: 87, target: 90, deadline: t('Mar 2026', 'مارس 2026') },
    ];

    const stats = [
        { value: '87%', label: t('Match Score', 'درجة التوافق'), icon: Target },
        { value: '1,247', label: t('Profile Views', 'مشاهدات الملف'), icon: Eye },
        { value: '18', label: t('Applications', 'الطلبات'), icon: FileText },
        { value: '33%', label: t('Interview Rate', 'معدل المقابلات'), icon: TrendingUp },
    ];

    /* ── Tab 1: Overview ── */
    const overviewTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Career Overview', 'نظرة عامة على المسيرة المهنية')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'A snapshot of your career progress — profile engagement, applications, and growth metrics at a glance.',
                    'لمحة عن تقدمك المهني — تفاعل الملف الشخصي والطلبات ومقاييس النمو بنظرة واحدة.'
                )}
            </p>

            {/* Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
                {overviewMetrics.map((m, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <m.Icon size={18} style={{ color: brand.primary }} />
                            </div>
                            <span style={{
                                display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, fontWeight: 600,
                                color: m.up ? brand.greenText : brand.redText,
                            }}>
                                {m.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {m.change}
                            </span>
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: brand.textPrimary }}>{m.value}</div>
                        <span style={{ fontSize: 12, color: brand.textSecondary }}>{m.label}</span>
                    </div>
                ))}
            </div>

            {/* Weekly Activity */}
            <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 24, marginBottom: 28 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 16px' }}>{t('Weekly Activity', 'النشاط الأسبوعي')}</h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 120 }}>
                    {weeklyActivity.map((d, i) => {
                        const maxViews = Math.max(...weeklyActivity.map(w => w.views));
                        const barHeight = (d.views / maxViews) * 100;
                        return (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <span style={{ fontSize: 10, color: brand.textSecondary }}>{d.views}</span>
                                <div style={{ width: '100%', maxWidth: 40, height: `${barHeight}%`, background: brand.primary, borderRadius: '6px 6px 0 0', minHeight: 8, opacity: 0.7 + (barHeight / 300) }} />
                                <span style={{ fontSize: 11, color: brand.textSecondary }}>{d.day}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recent Milestones */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>{t('Recent Milestones', 'الإنجازات الأخيرة')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {careerMilestones.map((m, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 20 }}>{m.icon}</span>
                        <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary }}>{m.title}</span>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>{m.date}</div>
                        </div>
                        <span style={{ background: brand.primarySurface, color: brand.primary, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6 }}>
                            {m.type}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: Skills Analytics ── */
    const skillsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Skills Analytics', 'تحليلات المهارات')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Detailed breakdown of your skill levels compared to market demand — identify where to invest your learning.',
                    'تفصيل مستويات مهاراتك مقارنةً بالطلب في السوق — حدّد أين تستثمر في التعلم.'
                )}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                {topSkills.map((s, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{s.name}</span>
                                <span style={{
                                    background: s.demandKey === 'Very High' ? brand.green : s.demandKey === 'High' ? brand.blue : brand.amber,
                                    color: s.demandKey === 'Very High' ? brand.greenText : s.demandKey === 'High' ? brand.blueText : brand.amberText,
                                    fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                                }}>
                                    {s.demand} {t('Demand', 'طلب')}
                                </span>
                            </div>
                            <span style={{ fontSize: 16, fontWeight: 700, color: s.level >= 85 ? brand.greenText : s.level >= 75 ? brand.primary : brand.amberText }}>
                                {s.level}%
                            </span>
                        </div>
                        <div style={{ height: 8, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{
                                width: `${s.level}%`, height: '100%', borderRadius: 99,
                                background: s.level >= 85 ? '#22C55E' : s.level >= 75 ? brand.primary : '#F59E0B',
                            }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Skill Insights */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <Zap size={20} style={{ color: brand.primary }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{t('Skill Insights', 'رؤى المهارات')}</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                        t('Data Analysis is in very high demand — consider advanced certifications', 'تحليل البيانات مطلوب بشدة — فكّر في الشهادات المتقدمة'),
                        t('Your Project Management score positions you for PM roles in 85% of UAE companies', 'درجتك في إدارة المشاريع تؤهّلك لأدوار مدير مشروع في 85% من شركات الإمارات'),
                        t('Cloud Architecture is trending upward — improving by 10% would unlock senior architect roles', 'هندسة السحابة في اتجاه تصاعدي — تحسين 10% سيفتح لك أدوار المهندس المعماري الأقدم'),
                    ].map((insight, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <CheckCircle size={14} style={{ color: brand.primary, marginTop: 2, flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5 }}>{insight}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ── Tab 3: Goals Progress ── */
    const goalsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Goals Progress', 'تقدّم الأهداف')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Track progress toward your career objectives with concrete metrics and deadlines.',
                    'تابع التقدم نحو أهدافك المهنية بمقاييس ومواعيد نهائية محددة.'
                )}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {goalProgress.map((g, i) => {
                    const pct = Math.round((g.current / g.target) * 100);
                    return (
                        <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                <div>
                                    <h4 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{g.title}</h4>
                                    <div style={{ display: 'flex', gap: 8, fontSize: 12, color: brand.textSecondary }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={12} /> {g.deadline}</span>
                                        <span>{g.current} / {g.target}</span>
                                    </div>
                                </div>
                                <span style={{ fontSize: 16, fontWeight: 700, color: pct >= 80 ? brand.greenText : pct >= 50 ? brand.primary : brand.amberText }}>{pct}%</span>
                            </div>
                            <div style={{ height: 8, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: pct >= 80 ? '#22C55E' : pct >= 50 ? brand.primary : '#F59E0B', borderRadius: 99 }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    /* ── Tab 4: Career Insights ── */
    const insightsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Career Insights', 'رؤى مهنية')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'AI-generated insights based on your career activity, UAE market trends, and peer benchmarks.',
                    'رؤى مولّدة بالذكاء الاصطناعي بناءً على نشاطك المهني واتجاهات السوق الإماراتي ومقارنات الأقران.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 28 }}>
                {[
                    { title: t('Application Success Rate', 'معدل نجاح الطلبات'), desc: t('Your 33% interview conversion is 8% above the UAE average — target 40% by refining your CV summary section', 'معدل تحويلك إلى المقابلات 33% أعلى بـ 8% من المتوسط الإماراتي — استهدف 40% بتحسين قسم ملخص السيرة الذاتية'), Icon: TrendingUp, stat: '33%', statBg: brand.green, statColor: brand.greenText },
                    { title: t('Profile Visibility', 'ظهور الملف الشخصي'), desc: t('Your profile was viewed 1,247 times this month — 23% more than last month. Peak views are on weekdays between 9-11 AM', 'شوهد ملفك 1,247 مرة هذا الشهر — أكثر بـ 23% من الشهر الماضي. ذروة المشاهدات أيام الأسبوع بين 9-11 صباحاً'), Icon: Eye, stat: '+23%', statBg: brand.blue, statColor: brand.blueText },
                    { title: t('Market Positioning', 'تموضع في السوق'), desc: t('Your skill set aligns with 47 active job postings in the UAE — focus on cloud certifications to unlock 12 more', 'مجموعة مهاراتك تتوافق مع 47 إعلان وظيفي نشط في الإمارات — ركّز على شهادات السحابة لفتح 12 وظيفة إضافية'), Icon: Briefcase, stat: t('47 matches', '47 تطابق'), statBg: brand.primarySurface, statColor: brand.primary },
                    { title: t('Peer Comparison', 'مقارنة بالأقران'), desc: t('You rank in the top 15% of candidates in your experience bracket — your leadership score is pulling the average up', 'تحتل المرتبة ضمن أفضل 15% من المرشحين في فئة خبرتك — درجتك في القيادة ترفع المتوسط'), Icon: Users, stat: t('Top 15%', 'أفضل 15%'), statBg: brand.purple, statColor: brand.purpleText },
                ].map((insight, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <insight.Icon size={20} style={{ color: brand.primary }} />
                            </div>
                            <span style={{ background: insight.statBg, color: insight.statColor, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6 }}>
                                {insight.stat}
                            </span>
                        </div>
                        <div>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{insight.title}</h4>
                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{insight.desc}</p>
                        </div>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: brand.primary, cursor: 'pointer', marginTop: 'auto' }}>
                            {t('View Details', 'عرض التفاصيل')} <ChevronIcon size={14} />
                        </span>
                    </div>
                ))}
            </div>

            {/* Recommendations summary */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <Star size={20} style={{ color: brand.primary }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{t('Quick Wins', 'مكاسب سريعة')}</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                        t('Add 2 more project case studies to your portfolio to boost recruiter engagement', 'أضف دراستَي حالة إضافيتين لمشاريعك في ملفك لتعزيز تفاعل الموظِّفين'),
                        t('Complete the remaining AWS certification to reach your 5-cert goal', 'أكمل شهادة AWS المتبقية للوصول إلى هدف 5 شهادات'),
                        t('Apply to 2 more positions this week to hit your monthly target', 'تقدّم لوظيفتين إضافيتين هذا الأسبوع لتحقيق هدفك الشهري'),
                    ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <CheckCircle size={14} style={{ color: brand.primary, marginTop: 2, flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5 }}>{item}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'overview', label: t('Overview', 'نظرة عامة'), icon: <BarChart3 className="h-4 w-4" />, content: overviewTab },
        { id: 'skills', label: t('Skills Analytics', 'تحليلات المهارات'), icon: <Brain className="h-4 w-4" />, content: skillsTab },
        { id: 'goals', label: t('Goals Progress', 'تقدّم الأهداف'), icon: <Target className="h-4 w-4" />, content: goalsTab },
        { id: 'insights', label: t('Career Insights', 'رؤى مهنية'), icon: <TrendingUp className="h-4 w-4" />, content: insightsTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('Analytics', 'التحليلات')}
            description={t(
                'Track your career growth with real-time metrics, skill analytics, goal progress, and AI-powered insights tailored to the UAE market',
                'تابع نموك المهني بمقاييس آنية وتحليلات مهارات وتقدّم أهداف ورؤى مدعومة بالذكاء الاصطناعي مخصصة للسوق الإماراتي'
            )}
            icon={<BarChart3 className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="overview"
        />
    );
};

export default AnalyticsPage;
