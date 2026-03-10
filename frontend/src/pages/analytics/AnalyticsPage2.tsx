
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import { restClient } from '@/utils/api';
import {
    BarChart3, TrendingUp, Target, Award, Users,
    Clock, ChevronRight, ChevronLeft, Star, CheckCircle, Zap,
    Brain, BookOpen, Briefcase, ArrowUpRight, ArrowDownRight,
    Calendar, Eye, FileText, Loader2
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

/* ────── Types ────── */
interface AnalyticsData {
    profile: { full_name?: string; email?: string; phone?: string; created_at?: string };
    overview: {
        profile_completeness: number;
        total_applications: number;
        job_applications: number;
        internship_applications: number;
        gig_applications: number;
        interview_count: number;
        interview_rate: number;
        skills_count: number;
        certifications_count: number;
        portfolio_projects: number;
        application_statuses: Record<string, number>;
    };
    skills: { name: string; level: number; demand: string }[];
    certifications: any[];
    goals: { title: string; title_ar?: string; progress: number; target: number; deadline?: string; status?: string }[];
    recent_applications: any[];
    experience_years: number;
}

/* ──────── Fallback data (used when API returns no real data) ──────── */
const FALLBACK: AnalyticsData = {
    profile: { full_name: 'Guest User' },
    overview: {
        profile_completeness: 25, total_applications: 0, job_applications: 0,
        internship_applications: 0, gig_applications: 0, interview_count: 0,
        interview_rate: 0, skills_count: 0, certifications_count: 0,
        portfolio_projects: 0, application_statuses: {},
    },
    skills: [
        { name: 'Project Management', level: 70, demand: 'High' },
        { name: 'Data Analysis', level: 65, demand: 'Very High' },
        { name: 'Cloud Computing', level: 55, demand: 'High' },
        { name: 'Leadership', level: 80, demand: 'Medium' },
        { name: 'Communication', level: 75, demand: 'High' },
    ],
    certifications: [],
    goals: [],
    recent_applications: [],
    experience_years: 0,
};

/* ──────────────────────── COMPONENT ──────────────────────── */

const AnalyticsPage: React.FC = () => {

    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

    /* ── API State ── */
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await restClient.get('/api/career-services/analytics/candidate');
                const d = res.data as AnalyticsData;
                // If user has no skills data at all, merge fallback skills so the page isn't empty
                if (!d.skills || d.skills.length === 0) d.skills = FALLBACK.skills;
                setData(d);
            } catch (err) {
                console.error('Failed to load candidate analytics:', err);
                setData(FALLBACK);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const d = data || FALLBACK;
    const ov = d.overview;

    /* ──────────────────────── DATA ──────────────────────── */

    const overviewMetrics = [
        { label: t('Profile Score', 'نقاط الملف'), value: `${ov.profile_completeness}%`, change: ov.profile_completeness >= 50 ? `${ov.profile_completeness}%` : t('Low', 'منخفض'), up: ov.profile_completeness >= 50, Icon: Eye },
        { label: t('Applications Sent', 'الطلبات المرسلة'), value: String(ov.total_applications), change: `${ov.job_applications} jobs`, up: ov.total_applications > 0, Icon: FileText },
        { label: t('Interview Rate', 'معدل المقابلات'), value: `${ov.interview_rate}%`, change: `${ov.interview_count} total`, up: ov.interview_rate > 0, Icon: Users },
        { label: t('Skills Tracked', 'المهارات المتابَعة'), value: String(ov.skills_count || d.skills.length), change: '', up: true, Icon: Brain },
        { label: t('Certifications', 'الشهادات'), value: String(ov.certifications_count), change: '', up: ov.certifications_count > 0, Icon: Award },
        { label: t('Portfolio Items', 'عناصر المحفظة'), value: String(ov.portfolio_projects), change: '', up: ov.portfolio_projects > 0, Icon: Target },
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

            {loading && (
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto', color: brand.primary }} />
                </div>
            )}

            {!loading && (
                <>
                    {/* Metric Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
                        {overviewMetrics.map((m, i) => (
                            <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 8, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <m.Icon size={18} style={{ color: brand.primary }} />
                                    </div>
                                    {m.change && (
                                        <span style={{
                                            display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, fontWeight: 600,
                                            color: m.up ? brand.greenText : brand.redText,
                                        }}>
                                            {m.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                            {m.change}
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: 24, fontWeight: 700, color: brand.textPrimary }}>{m.value}</div>
                                <span style={{ fontSize: 12, color: brand.textSecondary }}>{m.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Application Status Breakdown */}
                    {Object.keys(ov.application_statuses).length > 0 && (
                        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 24, marginBottom: 28 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 16px' }}>{t('Application Statuses', 'حالات الطلبات')}</h3>
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                {Object.entries(ov.application_statuses).map(([status, count]) => (
                                    <div key={status} style={{
                                        padding: '10px 16px', borderRadius: 10,
                                        background: status === 'hired' ? brand.green : status.includes('interview') ? brand.blue : status === 'rejected' ? brand.red : brand.amber,
                                        color: status === 'hired' ? brand.greenText : status.includes('interview') ? brand.blueText : status === 'rejected' ? brand.redText : brand.amberText,
                                        fontSize: 13, fontWeight: 600,
                                    }}>
                                        {status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}: {count}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent Applications */}
                    {d.recent_applications.length > 0 && (
                        <>
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>{t('Recent Applications', 'الطلبات الأخيرة')}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {d.recent_applications.map((a: any, i: number) => (
                                    <div key={i} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{ fontSize: 20 }}>📨</span>
                                        <div style={{ flex: 1 }}>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary }}>{a.job_title || t('Job Application', 'طلب وظيفة')}</span>
                                            <div style={{ fontSize: 12, color: brand.textSecondary }}>
                                                {a.company && `${a.company} · `}{a.applied_at ? new Date(a.applied_at).toLocaleDateString() : ''}
                                            </div>
                                        </div>
                                        <span style={{ background: brand.primarySurface, color: brand.primary, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6 }}>
                                            {(a.status || 'applied').replace(/_/g, ' ')}
                                        </span>
                                        {a.match_score && (
                                            <span style={{ background: brand.green, color: brand.greenText, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6 }}>
                                                {a.match_score}% {t('match', 'تطابق')}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Empty state */}
                    {ov.total_applications === 0 && d.recent_applications.length === 0 && (
                        <div style={{ background: brand.primarySurface, borderRadius: 12, padding: 32, textAlign: 'center' }}>
                            <FileText size={40} style={{ color: brand.primary, margin: '0 auto 12px', opacity: 0.5 }} />
                            <p style={{ fontSize: 14, color: brand.textSecondary }}>
                                {t('No applications yet. Start applying to jobs to see your analytics here!', 'لا توجد طلبات بعد. ابدأ بالتقديم على الوظائف لرؤية تحليلاتك هنا!')}
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );

    /* ── Tab 2: Skills Analytics ── */
    const topSkills = d.skills.slice(0, 10);
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

            {topSkills.length === 0 ? (
                <div style={{ background: brand.primarySurface, borderRadius: 12, padding: 32, textAlign: 'center' }}>
                    <Brain size={40} style={{ color: brand.primary, margin: '0 auto 12px', opacity: 0.5 }} />
                    <p style={{ fontSize: 14, color: brand.textSecondary }}>
                        {t('Add skills to your profile to see analytics here.', 'أضف مهارات إلى ملفك الشخصي لرؤية تحليلاتك هنا.')}
                    </p>
                </div>
            ) : (
                <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                        {topSkills.map((s, i) => (
                            <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{s.name}</span>
                                        <span style={{
                                            background: s.demand === 'Very High' ? brand.green : s.demand === 'High' ? brand.blue : brand.amber,
                                            color: s.demand === 'Very High' ? brand.greenText : s.demand === 'High' ? brand.blueText : brand.amberText,
                                            fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                                        }}>
                                            {s.demand === 'Very High' ? t('Very High Demand', 'طلب مرتفع جداً')
                                                : s.demand === 'High' ? t('High Demand', 'طلب مرتفع')
                                                    : t('Medium Demand', 'طلب متوسط')}
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
                            {(() => {
                                const insights: string[] = [];
                                const veryHighDemand = topSkills.filter(s => s.demand === 'Very High');
                                const lowSkills = topSkills.filter(s => s.level < 70);
                                if (veryHighDemand.length > 0) {
                                    insights.push(t(
                                        `${veryHighDemand.map(s => s.name).join(', ')} — in very high demand across UAE companies. Consider advanced certifications.`,
                                        `${veryHighDemand.map(s => s.name).join('، ')} — مطلوبة بشدة في شركات الإمارات. فكّر في الشهادات المتقدمة.`
                                    ));
                                }
                                if (lowSkills.length > 0) {
                                    insights.push(t(
                                        `Boost ${lowSkills.map(s => s.name).join(', ')} by 10-20% to unlock more opportunities.`,
                                        `حسّن ${lowSkills.map(s => s.name).join('، ')} بنسبة 10-20% لفتح المزيد من الفرص.`
                                    ));
                                }
                                const highSkills = topSkills.filter(s => s.level >= 85);
                                if (highSkills.length > 0) {
                                    insights.push(t(
                                        `Your ${highSkills.map(s => s.name).join(', ')} scores position you for senior roles.`,
                                        `درجاتك في ${highSkills.map(s => s.name).join('، ')} تؤهّلك للأدوار القيادية.`
                                    ));
                                }
                                if (insights.length === 0) {
                                    insights.push(t('Keep building skills to unlock AI-powered insights.', 'استمر في بناء المهارات لفتح رؤى مدعومة بالذكاء الاصطناعي.'));
                                }
                                return insights.map((insight, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                        <CheckCircle size={14} style={{ color: brand.primary, marginTop: 2, flexShrink: 0 }} />
                                        <span style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5 }}>{insight}</span>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </>
            )}
        </div>
    );

    /* ── Tab 3: Goals Progress ── */
    const goalProgress = d.goals.length > 0 ? d.goals : [
        { title: t('Complete 5 Assessments', 'أكمل 5 تقييمات'), progress: 3, target: 5, deadline: t('Mar 2026', 'مارس 2026') },
        { title: t('Apply to 20 Positions', 'تقدّم لـ 20 وظيفة'), progress: ov.total_applications, target: 20, deadline: t('Mar 2026', 'مارس 2026') },
        { title: t('Earn 5 Certifications', 'احصل على 5 شهادات'), progress: ov.certifications_count, target: 5, deadline: t('Apr 2026', 'أبريل 2026') },
        { title: t('Reach 90% Profile Score', 'حقّق 90% نقاط الملف'), progress: ov.profile_completeness, target: 90, deadline: t('Mar 2026', 'مارس 2026') },
    ];

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
                    const current = g.progress ?? 0;
                    const target = g.target ?? 1;
                    const pct = Math.min(Math.round((current / target) * 100), 100);
                    return (
                        <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                <div>
                                    <h4 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>
                                        {(isRTL && g.title_ar) ? g.title_ar : g.title}
                                    </h4>
                                    <div style={{ display: 'flex', gap: 8, fontSize: 12, color: brand.textSecondary }}>
                                        {g.deadline && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={12} /> {g.deadline}</span>}
                                        <span>{current} / {target}</span>
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
                    {
                        title: t('Application Success Rate', 'معدل نجاح الطلبات'),
                        desc: ov.interview_rate > 0
                            ? t(`Your ${ov.interview_rate}% interview conversion rate. Target 40% by refining your CV summary section.`, `معدل تحويلك إلى المقابلات ${ov.interview_rate}%. استهدف 40% بتحسين قسم ملخص السيرة الذاتية.`)
                            : t('Start applying to jobs to track your interview conversion rate.', 'ابدأ بالتقديم على الوظائف لتتبع معدل تحويلك إلى المقابلات.'),
                        Icon: TrendingUp,
                        stat: `${ov.interview_rate}%`,
                        statBg: ov.interview_rate > 20 ? brand.green : brand.amber,
                        statColor: ov.interview_rate > 20 ? brand.greenText : brand.amberText,
                    },
                    {
                        title: t('Profile Completeness', 'اكتمال الملف الشخصي'),
                        desc: ov.profile_completeness >= 75
                            ? t('Great job! Your profile is well-rounded. Keep it updated to stay competitive.', 'عمل رائع! ملفك الشخصي متكامل. حافظ على تحديثه لتبقى تنافسياً.')
                            : t('Complete your profile — add skills, certifications, and portfolio projects to increase visibility.', 'أكمل ملفك — أضف مهارات وشهادات ومشاريع للمحفظة لزيادة الظهور.'),
                        Icon: Eye,
                        stat: `${ov.profile_completeness}%`,
                        statBg: ov.profile_completeness >= 75 ? brand.green : brand.blue,
                        statColor: ov.profile_completeness >= 75 ? brand.greenText : brand.blueText,
                    },
                    {
                        title: t('Market Positioning', 'تموضع في السوق'),
                        desc: t(`You have ${d.skills.length} tracked skills. Companies in the UAE value cloud, AI, and data analysis most highly right now.`, `لديك ${d.skills.length} مهارة متابَعة. تقدّر الشركات في الإمارات السحابة والذكاء الاصطناعي وتحليل البيانات حالياً.`),
                        Icon: Briefcase,
                        stat: `${d.skills.length} ${t('skills', 'مهارة')}`,
                        statBg: brand.primarySurface,
                        statColor: brand.primary,
                    },
                    {
                        title: t('Career Activity', 'النشاط المهني'),
                        desc: ov.total_applications > 0
                            ? t(`${ov.total_applications} total applications across jobs, internships, and gigs. ${ov.interview_count} interviews secured.`, `${ov.total_applications} طلب إجمالي عبر الوظائف والتدريب والمشاريع. ${ov.interview_count} مقابلة تم تأمينها.`)
                            : t('No applications yet. Explore jobs, internships, and gigs to start building your career pipeline.', 'لا توجد طلبات بعد. استكشف الوظائف والتدريب والمشاريع لبناء مسار حياتك المهنية.'),
                        Icon: Users,
                        stat: `${ov.total_applications}`,
                        statBg: brand.purple,
                        statColor: brand.purpleText,
                    },
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

            {/* Quick Wins */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <Star size={20} style={{ color: brand.primary }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{t('Quick Wins', 'مكاسب سريعة')}</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(() => {
                        const wins: string[] = [];
                        if (ov.portfolio_projects < 3) wins.push(t('Add project case studies to your portfolio to boost recruiter engagement.', 'أضف دراسات حالة لمشاريعك في محفظتك لتعزيز تفاعل الموظِّفين.'));
                        if (ov.certifications_count < 5) wins.push(t(`Earn ${5 - ov.certifications_count} more certifications to strengthen your profile.`, `احصل على ${5 - ov.certifications_count} شهادات إضافية لتقوية ملفك الشخصي.`));
                        if (ov.total_applications < 20) wins.push(t(`Apply to ${20 - ov.total_applications} more positions to hit your monthly target.`, `تقدّم لـ ${20 - ov.total_applications} وظيفة إضافية لتحقيق هدفك الشهري.`));
                        if (ov.profile_completeness < 100) wins.push(t('Complete all profile sections for maximum visibility to recruiters.', 'أكمل جميع أقسام الملف الشخصي لأقصى ظهور للموظِّفين.'));
                        if (wins.length === 0) wins.push(t('You\'re on track! Keep applying and building your skills.', 'أنت على المسار الصحيح! استمر في التقديم وبناء مهاراتك.'));
                        return wins.map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                <CheckCircle size={14} style={{ color: brand.primary, marginTop: 2, flexShrink: 0 }} />
                                <span style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5 }}>{item}</span>
                            </div>
                        ));
                    })()}
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

    const stats = [
        { value: `${ov.profile_completeness}%`, label: t('Profile Score', 'نقاط الملف'), icon: Target },
        { value: String(ov.total_applications), label: t('Applications', 'الطلبات'), icon: FileText },
        { value: `${ov.interview_rate}%`, label: t('Interview Rate', 'معدل المقابلات'), icon: TrendingUp },
        { value: String(d.skills.length), label: t('Skills', 'المهارات'), icon: Brain },
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
