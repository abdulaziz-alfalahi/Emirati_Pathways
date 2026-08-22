import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
    Activity, Users, PieChart as PieChartIcon, 
    BarChart3, Loader2, AlertTriangle, UserCheck, ShieldAlert, TrendingUp
} from 'lucide-react';
import { restClient } from '@/utils/api';

const c = {
    bg: '#0B1120',
    cardBg: '#111B2E',
    cardBorder: '#1E2D4A',
    accent: '#3B82F6',
    accentGlow: 'rgba(59, 130, 246, 0.15)',
    green: '#10B981',
    yellow: '#F59E0B',
    red: '#EF4444',
    purple: '#8B5CF6',
    teal: '#14B8A6',
    orange: '#F97316',
    pink: '#EC4899',
    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    purpleGlow: 'rgba(139, 92, 246, 0.15)',
};

const COLORS = [c.accent, c.green, c.yellow, c.purple, c.orange, c.teal, c.pink, c.red];

const DemographicsAnalytics: React.FC = () => {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const isRTL = language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;

    const [activeTab, setActiveTab] = useState<'main' | 'priority' | 'reachability'>('main');
    const [selectedCut, setSelectedCut] = useState<string>('registered');
    
    const [rawMetrics, setRawMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDemographics = async () => {
            try {
                const res = await restClient.get('/api/metrics/demographics');
                if (res.data?.success && res.data?.data) {
                    setRawMetrics(res.data.data);
                } else {
                    setError('Failed to load demographics data structure');
                }
            } catch (e: any) {
                console.error(e);
                setError(e.message || 'Failed to load');
            } finally {
                setLoading(false);
            }
        };

        fetchDemographics();
    }, []);

    const TabButton = ({ id, label, icon: Icon }: any) => (
        <button
            onClick={() => setActiveTab(id)}
            style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 16px', borderRadius: 8,
                background: activeTab === id ? c.accentGlow : 'transparent',
                color: activeTab === id ? c.accent : c.textSecondary,
                border: `1px solid ${activeTab === id ? c.accent : 'transparent'}`,
                fontWeight: 600, fontSize: 13,
                cursor: 'pointer', transition: 'all 0.2s ease'
            }}
        >
            <Icon size={16} />
            {label}
        </button>
    );

    // `style` was accepted at three call sites (style={{ gridColumn: '1 / -1' }})
    // and silently dropped, so the cards meant to span the grid never did.
    const ChartCard = ({ title, children, footer, style }: any) => (
        <div style={{ background: c.cardBg, borderRadius: 8, padding: 16, border: `1px solid ${c.cardBorder}`, ...style }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: c.textPrimary, marginBottom: 16, letterSpacing: 0.5 }}>
                {title}
            </div>
            <div style={{ height: 280, width: '100%' }}>
                {children}
            </div>
            {footer}
        </div>
    );

    // Get current data cut statistics
    const currentStats = rawMetrics ? rawMetrics[selectedCut] : null;

    // The endpoint reads candidate_profiles now, not the master spreadsheet, so
    // "unavailable" means the query failed rather than a file being absent.
    // Every render below must still treat it as "no data" rather than crash on
    // the missing keys.
    const sourceUnavailable = !!rawMetrics && !rawMetrics.registered;

    // Bucket names are database values ('Male', 'High School', 'Not Working'),
    // translated at render so a language switch retranslates them.
    const LABELS_AR: Record<string, string> = {
        Male: 'ذكور', Female: 'إناث',
        Single: 'أعزب', Married: 'متزوج', Divorced: 'مطلّق', Widowed: 'أرمل', Dead: 'متوفّى',
        Working: 'يعمل', 'Not Working': 'لا يعمل', Retired: 'متقاعد', Unknown: 'غير معروف',
        Completed: 'أنهى الخدمة', Exempted: 'معفى', 'In Service': 'في الخدمة',
        'Not Yet Joined': 'لم يلتحق بعد', 'Not Required "Female"': 'غير مطلوبة (إناث)',
        Dubai: 'دبي', 'Abu Dhabi': 'أبوظبي', Sharjah: 'الشارقة', Ajman: 'عجمان',
        'Ras Al Khaimah': 'رأس الخيمة', Fujairah: 'الفجيرة', 'Umm Al Quwain': 'أم القيوين',
        'Al Ain': 'العين', Hatta: 'حتا',
        Answered: 'تم الرد', 'No Answer': 'لم يتم الرد', Pending: 'قيد الانتظار', new: 'جديد',
    };
    const label = (name: string) =>
        !isRTL ? name
               : (rawMetrics?.education_labels_ar?.[name] || LABELS_AR[name] || name);
    const series = (field: string) =>
        (currentStats?.[field] || []).map((x: any) => ({ ...x, name: label(x.name) }));

    // Coverage travels with every chart. These columns are populated very
    // unevenly — emirate_of_residence on 9% of records, military_status on 6% —
    // and a bar chart drawn without saying so reports a share of the whole
    // roster when it is a share of the tenth that answered the question.
    const Coverage = ({ field }: { field: string }) => {
        const cov = currentStats?.coverage?.[field];
        if (!cov) return null;
        return (
            <div style={{
                fontSize: 11, marginTop: 8, lineHeight: 1.6,
                color: cov.pct < 50 ? c.yellow : c.textMuted,
            }}>
                {cov.pct < 50 ? '⚠ ' : ''}{isRTL ? cov.note.ar : cov.note.en}
            </div>
        );
    };

    // Ratios divide by the records that STATE a gender, not by the cohort. Of
    // 38,297 recorded people 1,627 have no gender on file; dividing by the
    // cohort total would report 64% female + 32% male and leave the reader to
    // wonder where the missing 4% went.
    const genderKnown = currentStats?.coverage?.gender?.known || 0;
    const ratioOf = (name: string) => {
        const hit = (currentStats?.gender || []).find((g: any) => g.name === name);
        return hit && genderKnown ? `${Math.round((hit.value / genderKnown) * 100)}%` : '—';
    };

    return (
        <div dir={isRTL ? 'rtl' : 'ltr'} style={{
            minHeight: '100vh', background: c.bg, overflow: 'auto',
            fontFamily: "'Inter', -apple-system, sans-serif"
        }}>
            {/* ─── Header ─────────────────────────────────────────── */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 24px', borderBottom: `1px solid ${c.cardBorder}`,
                background: 'linear-gradient(180deg, #0F1729 0%, #0B1120 100%)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: c.purpleGlow, borderRadius: 8, padding: 8 }}>
                        <PieChartIcon size={24} color={c.purple} />
                    </div>
                    <div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: c.textPrimary, letterSpacing: -0.5 }}>
                            {t('Demographics Analytics', 'تحليلات التركيبة السكانية')}
                        </div>
                        <div style={{ fontSize: 13, color: c.textMuted }}>
                            {t('Deep-dive analysis of the talent pool', 'تحليل متعمق لمجموعة الكوادر')}
                        </div>
                    </div>
                </div>

                {/* Demographic Cut Dropdown */}
                {rawMetrics && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 13, color: c.textSecondary, fontWeight: 500 }}>
                            {t('Cohort Cut:', 'شريحة الكوادر:')}
                        </span>
                        <select
                            value={selectedCut}
                            onChange={(e) => setSelectedCut(e.target.value)}
                            style={{
                                background: c.cardBg,
                                color: c.textPrimary,
                                border: `1px solid ${c.cardBorder}`,
                                padding: '8px 12px',
                                borderRadius: 8,
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                outline: 'none'
                            }}
                        >
                            {/* Driven by the cuts the API actually serves, with each
                                cohort's size in the option. The list used to be seven
                                hardcoded options mirroring sheets in the master file;
                                the cohorts are crm_segments now, so a segment the CRM
                                team adds shows up here without a frontend change —
                                and a cut with no members is visibly empty rather than
                                an option that silently draws nothing. */}
                            {Object.entries(rawMetrics.segments || {}).map(([key, seg]: any) => (
                                <option key={key} value={key}>
                                    {(isRTL ? seg.label_ar : seg.label_en)}
                                    {rawMetrics[key]
                                        ? ` (${rawMetrics[key].total.toLocaleString(isRTL ? 'ar-AE' : 'en-US')})`
                                        : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 14px', borderRadius: 8,
                            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                            color: '#CBD5E1', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                    >
                        ← {isRTL ? 'العودة للمنصة' : 'Back to Platform'}
                    </button>
                    <TabButton id="main" label={t('Main Overview', 'نظرة عامة رئيسية')} icon={Users} />
                    <TabButton id="priority" label={t('Priority Details', 'تفاصيل الأولوية')} icon={ShieldAlert} />
                    <TabButton id="reachability" label={t('System Tracking', 'تتبع النظام')} icon={Activity} />
                </div>
            </div>

            {/* ─── Body ─────────────────────────────────────────── */}
            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 100, gap: 12, color: c.textSecondary }}>
                    <Loader2 size={24} className="animate-spin" />
                    <span style={{ fontSize: 14 }}>{t('Loading analytics data...', 'جارٍ تحميل البيانات...')}</span>
                </div>
            ) : error ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 100, gap: 12, color: c.red }}>
                    <AlertTriangle size={24} />
                    <span style={{ fontSize: 14 }}>{error}</span>
                </div>
            ) : sourceUnavailable ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 100, gap: 12, color: c.textSecondary }}>
                    <AlertTriangle size={32} color={c.yellow} />
                    <span style={{ fontSize: 15, fontWeight: 600, color: c.textPrimary }}>
                        {t('Demographics source not connected', 'مصدر بيانات التركيبة السكانية غير متصل')}
                    </span>
                    <span style={{ fontSize: 13, maxWidth: 420, textAlign: 'center' }}>
                        {t(
                            'The demographics query did not return, so no figures are shown — nothing here is estimated or simulated.',
                            'لم تُرجع استعلامات التركيبة السكانية أي نتيجة، لذلك لا تُعرض أي أرقام — لا شيء هنا مُقدّر أو مُحاكى.'
                        )}
                    </span>
                </div>
            ) : (
                <div style={{ padding: 24 }}>

                    {/* Scope. These are RECORDED people — imported from NAFIS and
                        the CRM master file — not people who have signed in. Same
                        disclosure the population strip carries, for the same reason. */}
                    {currentStats && (
                        <div style={{
                            marginBottom: 16, padding: '10px 14px', borderRadius: 8,
                            background: c.cardBg, border: `1px solid ${c.cardBorder}`,
                            fontSize: 12, color: c.textSecondary, lineHeight: 1.7,
                        }}>
                            {isRTL ? rawMetrics.scope_note_ar : rawMetrics.scope_note}
                        </div>
                    )}

                    {/* Cohort Stats Mini Header */}
                    {currentStats && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: 16,
                            marginBottom: 20
                        }}>
                            <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 8, padding: 16 }}>
                                <div style={{ fontSize: 12, color: c.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>
                                    {t('Cohort Total Size', 'حجم الشريحة الإجمالي')}
                                </div>
                                <div style={{ fontSize: 24, fontWeight: 700, color: c.textPrimary, marginTop: 4 }}>
                                    {currentStats.total.toLocaleString()}
                                </div>
                            </div>
                            <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 8, padding: 16 }}>
                                <div style={{ fontSize: 12, color: c.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>
                                    {t('Female Ratio', 'نسبة الإناث')}
                                </div>
                                <div style={{ fontSize: 24, fontWeight: 700, color: c.pink, marginTop: 4 }}>
                                    {ratioOf('Female')}
                                </div>
                            </div>
                            <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 8, padding: 16 }}>
                                <div style={{ fontSize: 12, color: c.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>
                                    {t('Male Ratio', 'نسبة الذكور')}
                                </div>
                                <div style={{ fontSize: 24, fontWeight: 700, color: c.accent, marginTop: 4 }}>
                                    {ratioOf('Male')}
                                </div>
                            </div>
                            <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 8, padding: 16 }}>
                                <div style={{ fontSize: 12, color: c.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>
                                    {t('Primary Location', 'الموقع الرئيسي')}
                                </div>
                                <div style={{ fontSize: 24, fontWeight: 700, color: c.green, marginTop: 4 }}>
                                    {currentStats.emirate.length > 0 ? label(currentStats.emirate[0].name) : '—'}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: MAIN OVERVIEW */}
                    {activeTab === 'main' && currentStats && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <ChartCard title={t('Gender Distribution', 'توزيع الجنس')} footer={<Coverage field="gender" />}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={series('gender')} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={5}>
                                            {series('gender').map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: c.cardBg, borderColor: c.cardBorder, color: c.textPrimary }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            <ChartCard title={t('Age Group Distribution', 'توزيع الفئات العمرية')} footer={<Coverage field="age" />}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={series('age')} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        <XAxis dataKey="name" stroke={c.textMuted} tick={{ fill: c.textSecondary, fontSize: 12 }} />
                                        <YAxis stroke={c.textMuted} tick={{ fill: c.textSecondary, fontSize: 12 }} />
                                        <Tooltip cursor={{ fill: c.cardBorder }} contentStyle={{ backgroundColor: c.cardBg, borderColor: c.cardBorder, color: c.textPrimary }} />
                                        <Bar dataKey="value" fill={c.accent} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            {/* Spans the row: the "Work Experience Years" card that
                                used to sit beside it is gone (experience_duration is
                                populated on 1 of 38,297 rows), and education has the
                                most categories of any chart here anyway. */}
                            <ChartCard title={t('Education Level Distribution', 'توزيع المستويات التعليمية')} footer={<Coverage field="education" />} style={{ gridColumn: '1 / -1' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={series('education')} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        <XAxis dataKey="name" stroke={c.textMuted} tick={{ fill: c.textSecondary, fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                                        <YAxis stroke={c.textMuted} tick={{ fill: c.textSecondary, fontSize: 12 }} />
                                        <Tooltip cursor={{ fill: c.cardBorder }} contentStyle={{ backgroundColor: c.cardBg, borderColor: c.cardBorder, color: c.textPrimary }} />
                                        <Bar dataKey="value" fill={c.green} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>


                            <ChartCard title={t('Emirate of Residence', 'إمارة الإقامة')} style={{ gridColumn: '1 / -1' }} footer={<Coverage field="emirate" />}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={series('emirate')} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        <XAxis dataKey="name" stroke={c.textMuted} tick={{ fill: c.textSecondary, fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
                                        <YAxis stroke={c.textMuted} />
                                        <Tooltip cursor={{ fill: c.cardBorder }} contentStyle={{ backgroundColor: c.cardBg, borderColor: c.cardBorder, color: c.textPrimary }} />
                                        <Bar dataKey="value" fill={c.teal} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>
                        </div>
                    )}

                    {/* TAB: PRIORITY DETAILS */}
                    {activeTab === 'priority' && currentStats && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <ChartCard title={t('National Military Service Status', 'حالة الخدمة الوطنية')} footer={<Coverage field="military" />}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={series('military')} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        <XAxis dataKey="name" stroke={c.textMuted} tick={{ fill: c.textSecondary, fontSize: 11 }} angle={-15} textAnchor="end" height={50} />
                                        <YAxis stroke={c.textMuted} />
                                        <Tooltip cursor={{ fill: c.cardBorder }} contentStyle={{ backgroundColor: c.cardBg, borderColor: c.cardBorder, color: c.textPrimary }} />
                                        <Bar dataKey="value" fill={c.orange} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            <ChartCard title={t('Marital Status', 'الحالة الاجتماعية')} footer={<Coverage field="marital" />}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={series('marital')} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2}>
                                            {series('marital').map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: c.cardBg, borderColor: c.cardBorder, color: c.textPrimary }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </ChartCard>
                        </div>
                    )}

                    {/* TAB: SYSTEM TRACKING */}
                    {activeTab === 'reachability' && rawMetrics && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            {/* Cohort sizes are crm_segments memberships on
                                candidate_profiles — the segments the CRM team
                                maintains, not a sheet per cohort. */}
                            {rawMetrics.hatta && (
                            <ChartCard title={t('EHRDC Initiatives Active Counts', 'أعداد المستفيدين النشطين من مبادرات الهيئة')}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[
                                        { name: t('Hatta Cohort', 'أهالي حتا'), value: rawMetrics.hatta.total },
                                        { name: t('CDA Cohort', 'تنمية المجتمع'), value: rawMetrics.cda.total },
                                        { name: t('GDO Cohort', 'التطوير الحكومي'), value: rawMetrics.gdo.total }
                                    ]}>
                                        <XAxis dataKey="name" stroke={c.textMuted} tick={{ fill: c.textSecondary }} />
                                        <YAxis stroke={c.textMuted} />
                                        <Tooltip cursor={{ fill: c.cardBorder }} contentStyle={{ backgroundColor: c.cardBg, borderColor: c.cardBorder, color: c.textPrimary }} />
                                        <Bar dataKey="value" fill={c.accent} radius={[4, 4, 0, 0]}>
                                            <Cell fill={c.teal} />
                                            <Cell fill={c.purple} />
                                            <Cell fill={c.accent} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>
                            )}

                            {/* No Answer Candidates */}
                            {/* Read from call_status, and "not yet called" is its own
                                slice. This used to plot registered.total minus the
                                no-answer cohort as "Answered Call" — 37,501 of 38,297
                                people shown as having answered, when the CRM records
                                4,921 answered and has not called 32,058 at all.
                                Subtracting one cohort from the roster does not make the
                                remainder a call outcome. */}
                            {currentStats?.coverage?.call && (
                            <ChartCard title={t('Contact Center Reachability Status', 'حالة استجابة الاتصال مع الكوادر')}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={[
                                            ...series('call'),
                                            { name: t('Not yet called', 'لم يتم الاتصال بهم بعد'),
                                              value: currentStats.coverage.call.total - currentStats.coverage.call.known },
                                        ].filter((d: any) => d.value > 0)}
                                             dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2}>
                                            {[...series('call'), { name: 'uncalled', value: 1 }].map((_: any, i: number) => (
                                                <Cell key={`call-${i}`} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: c.cardBg, borderColor: c.cardBorder, color: c.textPrimary }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </ChartCard>
                            )}

                            {/* Weekly Registrations Added vs Removed */}
                            {rawMetrics.growth?.weekly?.length > 0 && (
                            <ChartCard title={t('Weekly Intake Trend (Added vs Removed)', 'اتجاه التدفق الأسبوعي (المضاف مقابل المزال)')} style={{ gridColumn: '1 / -1' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={rawMetrics.growth.weekly} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <XAxis dataKey="date" stroke={c.textMuted} tick={{ fill: c.textSecondary }} />
                                        <YAxis stroke={c.textMuted} />
                                        <Tooltip contentStyle={{ backgroundColor: c.cardBg, borderColor: c.cardBorder, color: c.textPrimary }} />
                                        <Legend />
                                        <Area type="monotone" dataKey="added" name={t('Candidates Added', 'المرشحون المضافون')} stroke={c.green} fill={c.green} fillOpacity={0.15} strokeWidth={2} />
                                        <Area type="monotone" dataKey="removed" name={t('Candidates Placed/Removed', 'المرشحون المعينون/المزالون')} stroke={c.red} fill={c.red} fillOpacity={0.1} strokeWidth={1.5} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartCard>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DemographicsAnalytics;
