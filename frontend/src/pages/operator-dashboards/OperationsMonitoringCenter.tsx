import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import {
    Activity, Users, Building2, GraduationCap, Briefcase,
    TrendingUp, BarChart3, Flag, Clock, CheckCircle,
    ArrowUp, ArrowDown, AlertTriangle, Globe, Zap,
    UserCheck, Award, MessageSquare, Target, Monitor,
    Video, CalendarCheck, CalendarClock, PlayCircle,
    ThumbsUp, ThumbsDown, FileText, Loader2
} from 'lucide-react';
import { restClient } from '@/utils/api';

interface OpsData {
    platform_health: {
        total_users: number;
        registrations_today: number;
        registrations_week: number;
        uptime: string;
        response_time: string;
    };
    talent_pipeline: {
        total_candidates: number;
        total_cvs: number;
        total_applications: number;
        applications_week: number;
        placements: number;
    };
    employer_activity: {
        total_companies: number;
        active_vacancies: number;
        total_jobs: number;
        new_jobs_week: number;
        total_offers: number;
        offers_week: number;
    };
    interview_tracker: {
        conducted_today: number;
        conducted_week: number;
        ongoing: number;
        upcoming_today: number;
        upcoming_week: number;
        total: number;
    };
    shortlist_stats: {
        shortlisted_week: number;
        rejected_week: number;
        shortlisted_total: number;
        rejected_total: number;
    };
    emiratization: {
        sectors: { name: string; total_jobs: number; target: number }[];
    };
    role_distribution: Record<string, number>;
    live_feed: { text: string; time: string; type: string; relative: string }[];
}

const OperationsMonitoringCenter: React.FC = () => {
    const { language } = useLanguage();
    const isRTL = language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const [currentTime, setCurrentTime] = useState(new Date());
    const [data, setData] = useState<OpsData | null>(null);
    const [funnelData, setFunnelData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const [res, liveRes] = await Promise.all([
                    restClient.get('/api/operations/stats'),
                    restClient.get('/api/metrics/operations-live')
                ]);
                
                if (res.data?.success && res.data?.data) {
                    setData(res.data.data);
                }
                if (liveRes.data?.success && liveRes.data?.data) {
                    setFunnelData(liveRes.data.data.funnel_analytics);
                }
            } catch (e: any) {
                console.error('Operations stats error:', e);
                setError(e.message || 'Failed to load');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const c = {
        bg: '#0B1120',
        cardBg: '#111B2E',
        cardBorder: '#1E2D4A',
        accent: '#3B82F6',
        accentGlow: 'rgba(59, 130, 246, 0.15)',
        green: '#10B981',
        greenGlow: 'rgba(16, 185, 129, 0.15)',
        yellow: '#F59E0B',
        yellowGlow: 'rgba(245, 158, 11, 0.15)',
        red: '#EF4444',
        redGlow: 'rgba(239, 68, 68, 0.15)',
        purple: '#8B5CF6',
        purpleGlow: 'rgba(139, 92, 246, 0.15)',
        pink: '#EC4899',
        teal: '#14B8A6',
        tealGlow: 'rgba(20, 184, 166, 0.15)',
        orange: '#F97316',
        orangeGlow: 'rgba(249, 115, 22, 0.15)',
        textPrimary: '#F1F5F9',
        textSecondary: '#94A3B8',
        textMuted: '#64748B',
    };

    const MetricCard = ({ label, value, icon: Icon, sub, color = c.accent }: any) => (
        <div style={{ background: c.cardBg, borderRadius: 8, padding: '12px 14px', border: `1px solid ${c.cardBorder}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: `${color}20`, borderRadius: 6, padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={color} />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: c.textMuted, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: c.textPrimary, letterSpacing: -0.5 }}>{value}</div>
            </div>
            {sub && (
                <div style={{ fontSize: 11, color: c.textSecondary, textAlign: 'right' as const }}>
                    {sub}
                </div>
            )}
        </div>
    );

    const BigStat = ({ label, value, icon: Icon, color = c.accent, sub, subColor }: any) => (
        <div style={{ background: c.cardBg, borderRadius: 8, padding: 14, border: `1px solid ${c.cardBorder}`, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: `${color}20`, borderRadius: 8, padding: 8 }}>
                <Icon size={20} color={color} />
            </div>
            <div>
                <div style={{ fontSize: 11, color: c.textMuted, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>{label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: c.textPrimary, fontFeatureSettings: '"tnum"' }}>{value}</div>
            </div>
            {sub && (
                <div style={{ marginLeft: 'auto', textAlign: 'right' as const }}>
                    <div style={{ fontSize: 11, color: c.textMuted }}>{sub.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: subColor || c.green }}>{sub.value}</div>
                </div>
            )}
        </div>
    );

    const ph = data?.platform_health;
    const tp = data?.talent_pipeline;
    const ea = data?.employer_activity;
    const it = data?.interview_tracker;
    const ss = data?.shortlist_stats;

    return (
        <div dir={isRTL ? 'rtl' : 'ltr'} style={{
            minHeight: '100vh', background: c.bg, overflow: 'auto',
            fontFamily: "'Inter', -apple-system, sans-serif"
        }}>
            {/* ─── Header Bar ─────────────────────────────────────────── */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 24px', borderBottom: `1px solid ${c.cardBorder}`,
                background: 'linear-gradient(180deg, #0F1729 0%, #0B1120 100%)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: c.accentGlow, borderRadius: 8, padding: 6 }}>
                        <Monitor size={20} color={c.accent} />
                    </div>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: c.textPrimary, letterSpacing: -0.3 }}>
                            {t('Operations Monitoring Center', 'مركز مراقبة العمليات')}
                        </div>
                        <div style={{ fontSize: 11, color: c.textMuted }}>{t('EHRDC Platform Command Center', 'مركز قيادة منصة الهيئة')}</div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.green, boxShadow: `0 0 8px ${c.green}` }} />
                        <span style={{ fontSize: 12, color: c.green, fontWeight: 600 }}>{t('ALL SYSTEMS OPERATIONAL', 'جميع الأنظمة تعمل')}</span>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: c.textPrimary, fontFeatureSettings: '"tnum"', letterSpacing: 1 }}>
                        {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                    </div>
                    <div style={{ fontSize: 11, color: c.textMuted }}>
                        {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                </div>
            </div>

            {/* ─── Loading State ────────────────────────────────── */}
            {loading && !data && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12, color: c.textSecondary }}>
                    <Loader2 size={24} className="animate-spin" />
                    <span style={{ fontSize: 14 }}>{t('Loading live data...', 'جارٍ تحميل البيانات...')}</span>
                </div>
            )}

            {error && !data && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12, color: c.red }}>
                    <AlertTriangle size={24} />
                    <span style={{ fontSize: 14 }}>{error}</span>
                </div>
            )}

            {/* ─── Main Grid ──────────────────────────────────────── */}
            {data && (
                <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>

                    {/* ROW 1: Platform Health (full width) */}
                    <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                        <BigStat
                            label={t('Total Users', 'إجمالي المستخدمين')}
                            value={(ph?.total_users || 0).toLocaleString()}
                            icon={Activity}
                            color={c.green}
                            sub={{ label: t('Today', 'اليوم'), value: `+${ph?.registrations_today || 0}` }}
                            subColor={c.green}
                        />
                        <BigStat
                            label={t('Registrations This Week', 'تسجيلات الأسبوع')}
                            value={ph?.registrations_week || 0}
                            icon={UserCheck}
                            color={c.accent}
                            sub={{ label: t('Today', 'اليوم'), value: `+${ph?.registrations_today || 0}` }}
                            subColor={c.accent}
                        />
                        <BigStat
                            label={t('Uptime', 'التشغيل')}
                            value={ph?.uptime || '—'}
                            icon={Globe}
                            color={c.green}
                        />
                        <BigStat
                            label={t('Response Time', 'وقت الاستجابة')}
                            value={ph?.response_time || '—'}
                            icon={Zap}
                            color={c.purple}
                        />
                    </div>

                    {/* ROW 2: Talent Pipeline + Employer Activity */}
                    <div style={{ gridColumn: '1 / 3', background: c.cardBg, borderRadius: 8, padding: 16, border: `1px solid ${c.cardBorder}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <Users size={16} color={c.accent} />
                            <span style={{ fontSize: 13, fontWeight: 700, color: c.textPrimary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Talent Pipeline', 'خط الكوادر')}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <MetricCard label={t('Candidates', 'المرشحون')} value={tp?.total_candidates || 0} icon={Users} color={c.accent} />
                            <MetricCard label={t('CVs Created', 'السير الذاتية')} value={tp?.total_cvs || 0} icon={FileText} color={c.accent} />
                            <MetricCard label={t('Applications', 'الطلبات')} value={tp?.total_applications || 0} icon={Briefcase} color={c.accent} sub={`+${tp?.applications_week || 0} this wk`} />
                            <MetricCard label={t('Placements', 'التوظيف')} value={tp?.placements || 0} icon={Target} color={c.green} />
                        </div>
                    </div>

                    <div style={{ gridColumn: '3 / 5', background: c.cardBg, borderRadius: 8, padding: 16, border: `1px solid ${c.cardBorder}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <Building2 size={16} color={c.green} />
                            <span style={{ fontSize: 13, fontWeight: 700, color: c.textPrimary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Employer Activity', 'نشاط أصحاب العمل')}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <MetricCard label={t('Companies', 'الشركات')} value={ea?.total_companies || 0} icon={Building2} color={c.green} />
                            <MetricCard label={t('Active Vacancies', 'الوظائف الشاغرة')} value={ea?.active_vacancies || 0} icon={Briefcase} color={c.green} sub={`+${ea?.new_jobs_week || 0} this wk`} />
                            <MetricCard label={t('Offers Extended', 'العروض المقدمة')} value={ea?.total_offers || 0} icon={Award} color={c.green} sub={`+${ea?.offers_week || 0} this wk`} />
                            <MetricCard label={t('Total Jobs', 'إجمالي الوظائف')} value={ea?.total_jobs || 0} icon={Briefcase} color={c.teal} />
                        </div>
                    </div>

                    {/* ROW 3: Interview Tracker (NEW) + Shortlisted/Rejected (NEW) */}
                    <div style={{ gridColumn: '1 / 3', background: c.cardBg, borderRadius: 8, padding: 16, border: `1px solid ${c.cardBorder}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                            <Video size={16} color={c.orange} />
                            <span style={{ fontSize: 13, fontWeight: 700, color: c.textPrimary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Interview Tracker', 'متتبع المقابلات')}</span>
                            <span style={{ fontSize: 10, color: c.textMuted, marginLeft: 'auto' }}>{t('Total:', 'الإجمالي:')} {it?.total || 0}</span>
                        </div>

                        {/* Interview stats grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
                            {/* Ongoing */}
                            <div style={{
                                background: `linear-gradient(135deg, ${c.orangeGlow}, transparent)`,
                                border: `1px solid ${c.orange}40`, borderRadius: 8, padding: '14px 12px', textAlign: 'center'
                            }}>
                                <PlayCircle size={20} color={c.orange} style={{ margin: '0 auto 6px' }} />
                                <div style={{ fontSize: 28, fontWeight: 800, color: c.orange, fontFeatureSettings: '"tnum"' }}>{it?.ongoing || 0}</div>
                                <div style={{ fontSize: 10, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Ongoing Now', 'جارية الآن')}</div>
                            </div>
                            {/* Upcoming Today */}
                            <div style={{
                                background: `linear-gradient(135deg, ${c.accentGlow}, transparent)`,
                                border: `1px solid ${c.accent}40`, borderRadius: 8, padding: '14px 12px', textAlign: 'center'
                            }}>
                                <CalendarClock size={20} color={c.accent} style={{ margin: '0 auto 6px' }} />
                                <div style={{ fontSize: 28, fontWeight: 800, color: c.accent, fontFeatureSettings: '"tnum"' }}>{it?.upcoming_today || 0}</div>
                                <div style={{ fontSize: 10, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Upcoming Today', 'القادمة اليوم')}</div>
                            </div>
                            {/* Conducted Today */}
                            <div style={{
                                background: `linear-gradient(135deg, ${c.greenGlow}, transparent)`,
                                border: `1px solid ${c.green}40`, borderRadius: 8, padding: '14px 12px', textAlign: 'center'
                            }}>
                                <CalendarCheck size={20} color={c.green} style={{ margin: '0 auto 6px' }} />
                                <div style={{ fontSize: 28, fontWeight: 800, color: c.green, fontFeatureSettings: '"tnum"' }}>{it?.conducted_today || 0}</div>
                                <div style={{ fontSize: 10, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Conducted Today', 'تم اليوم')}</div>
                            </div>
                        </div>

                        {/* Week summary bar */}
                        <div style={{
                            display: 'flex', gap: 12, padding: '10px 14px',
                            background: `${c.cardBorder}80`, borderRadius: 6
                        }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 10, color: c.textMuted, textTransform: 'uppercase', marginBottom: 2 }}>{t('Conducted This Week', 'تمت هذا الأسبوع')}</div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: c.green }}>{it?.conducted_week || 0}</div>
                            </div>
                            <div style={{ width: 1, background: c.cardBorder }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 10, color: c.textMuted, textTransform: 'uppercase', marginBottom: 2 }}>{t('Upcoming This Week', 'القادمة هذا الأسبوع')}</div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: c.accent }}>{it?.upcoming_week || 0}</div>
                            </div>
                        </div>
                    </div>

                    {/* Shortlisted & Rejected */}
                    <div style={{ gridColumn: '3 / 5', background: c.cardBg, borderRadius: 8, padding: 16, border: `1px solid ${c.cardBorder}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                            <BarChart3 size={16} color={c.purple} />
                            <span style={{ fontSize: 13, fontWeight: 700, color: c.textPrimary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Screening Decisions', 'قرارات الفرز')}</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                            {/* Shortlisted This Week */}
                            <div style={{
                                background: `linear-gradient(135deg, ${c.greenGlow}, transparent)`,
                                border: `1px solid ${c.green}40`, borderRadius: 8, padding: '16px 14px', textAlign: 'center'
                            }}>
                                <ThumbsUp size={22} color={c.green} style={{ margin: '0 auto 8px' }} />
                                <div style={{ fontSize: 32, fontWeight: 800, color: c.green, fontFeatureSettings: '"tnum"' }}>{ss?.shortlisted_week || 0}</div>
                                <div style={{ fontSize: 11, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Shortlisted This Week', 'قائمة مختصرة هذا الأسبوع')}</div>
                                <div style={{ fontSize: 10, color: c.textSecondary, marginTop: 4 }}>{t('Total:', 'الإجمالي:')} {ss?.shortlisted_total || 0}</div>
                            </div>

                            {/* Rejected This Week */}
                            <div style={{
                                background: `linear-gradient(135deg, ${c.redGlow}, transparent)`,
                                border: `1px solid ${c.red}40`, borderRadius: 8, padding: '16px 14px', textAlign: 'center'
                            }}>
                                <ThumbsDown size={22} color={c.red} style={{ margin: '0 auto 8px' }} />
                                <div style={{ fontSize: 32, fontWeight: 800, color: c.red, fontFeatureSettings: '"tnum"' }}>{ss?.rejected_week || 0}</div>
                                <div style={{ fontSize: 11, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Rejected This Week', 'مرفوض هذا الأسبوع')}</div>
                                <div style={{ fontSize: 10, color: c.textSecondary, marginTop: 4 }}>{t('Total:', 'الإجمالي:')} {ss?.rejected_total || 0}</div>
                            </div>
                        </div>

                        {/* Conversion ratio bar */}
                        {(ss?.shortlisted_total || 0) + (ss?.rejected_total || 0) > 0 && (() => {
                            const total = (ss?.shortlisted_total || 0) + (ss?.rejected_total || 0);
                            const ratio = Math.round(((ss?.shortlisted_total || 0) / total) * 100);
                            return (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: c.textSecondary, marginBottom: 4 }}>
                                        <span>{t('Shortlist Rate', 'نسبة القائمة المختصرة')}</span>
                                        <span style={{ fontWeight: 600, color: ratio >= 50 ? c.green : c.yellow }}>{ratio}%</span>
                                    </div>
                                    <div style={{ height: 6, background: c.cardBorder, borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                                        <div style={{ width: `${ratio}%`, background: c.green, borderRadius: 3, transition: 'width 1s ease' }} />
                                        <div style={{ width: `${100 - ratio}%`, background: c.red, transition: 'width 1s ease' }} />
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* ROW 4: Emiratization + Live Feed */}
                    <div style={{ gridColumn: '1 / 3', background: c.cardBg, borderRadius: 8, padding: 16, border: `1px solid ${c.cardBorder}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <Flag size={16} color={c.yellow} />
                            <span style={{ fontSize: 13, fontWeight: 700, color: c.textPrimary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Emiratization by Sector', 'التوطين حسب القطاع')}</span>
                        </div>
                        {data.emiratization.sectors.length > 0 ? (
                            <div style={{ display: 'grid', gap: 8 }}>
                                {data.emiratization.sectors.map((s, i) => (
                                    <div key={i}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3, color: c.textSecondary }}>
                                            <span>{s.name}</span>
                                            <span style={{ display: 'flex', gap: 8 }}>
                                                <span style={{ color: c.textMuted }}>{s.total_jobs} {t('jobs', 'وظيفة')}</span>
                                                {s.target > 0 && <span style={{ fontWeight: 600, color: c.yellow }}>{t('target', 'الهدف')}: {s.target}%</span>}
                                            </span>
                                        </div>
                                        <div style={{ height: 4, background: c.cardBorder, borderRadius: 2 }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${Math.min((s.total_jobs / (data.emiratization.sectors[0]?.total_jobs || 1)) * 100, 100)}%`,
                                                background: s.target > 0 ? c.yellow : c.accent,
                                                borderRadius: 2, transition: 'width 1s ease'
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ color: c.textMuted, fontSize: 13, textAlign: 'center', padding: 20 }}>{t('No sector data', 'لا توجد بيانات قطاع')}</div>
                        )}
                    </div>

                    {/* Live Feed */}
                    <div style={{ gridColumn: '3 / 5', background: c.cardBg, borderRadius: 8, padding: 16, border: `1px solid ${c.cardBorder}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <Activity size={16} color={c.teal} />
                            <span style={{ fontSize: 13, fontWeight: 700, color: c.textPrimary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Live Feed', 'التحديثات المباشرة')}</span>
                            <div style={{
                                marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%',
                                background: c.green, boxShadow: `0 0 6px ${c.green}`,
                                animation: 'pulse 2s ease-in-out infinite'
                            }} />
                        </div>
                        {data.live_feed.length > 0 ? (
                            data.live_feed.map((item, i) => (
                                <div key={i} style={{ padding: '8px 0', borderBottom: i < data.live_feed.length - 1 ? `1px solid ${c.cardBorder}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: 12, color: c.textPrimary, lineHeight: 1.4, flex: 1 }}>
                                        <span style={{
                                            display: 'inline-block', width: 6, height: 6, borderRadius: '50%', marginRight: 8,
                                            background: item.type === 'user' ? c.accent : item.type === 'job' ? c.green : item.type === 'application' ? c.purple : c.teal
                                        }} />
                                        {item.text}
                                    </div>
                                    <div style={{ fontSize: 10, color: c.textMuted, whiteSpace: 'nowrap', marginLeft: 12 }}>
                                        {item.relative} {t('ago', 'مضت')}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ color: c.textMuted, fontSize: 13, textAlign: 'center', padding: 20 }}>{t('No recent activity', 'لا يوجد نشاط حديث')}</div>
                        )}

                        {/* Funnel Analytics */}
                        {funnelData && (
                            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${c.cardBorder}` }}>
                                <div style={{ fontSize: 11, color: c.textMuted, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>{t('Conversion Funnel', 'قمع التحويل')}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {[
                                        { label: t('Signups', 'التسجيلات'), value: funnelData.signups, color: c.accent },
                                        { label: t('Profile Completion', 'إكمال الملف'), value: funnelData.profile_completion, color: c.purple },
                                        { label: t('Job Applications', 'طلبات التوظيف'), value: funnelData.job_applications, color: c.green }
                                    ].map((step, idx, arr) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 100, fontSize: 11, color: c.textSecondary }}>{step.label}</div>
                                            <div style={{ flex: 1, background: c.cardBorder, height: 24, borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
                                                <div style={{ 
                                                    width: `${Math.max(5, (step.value / arr[0].value) * 100)}%`, 
                                                    background: step.color, 
                                                    height: '100%', 
                                                    transition: 'width 1s ease',
                                                    display: 'flex', alignItems: 'center', paddingLeft: 12
                                                }}>
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{step.value.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
            `}</style>
        </div>
    );
};

export default OperationsMonitoringCenter;
