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

    const ChartCard = ({ title, children }: any) => (
        <div style={{ background: c.cardBg, borderRadius: 8, padding: 16, border: `1px solid ${c.cardBorder}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: c.textPrimary, marginBottom: 16, letterSpacing: 0.5 }}>
                {title}
            </div>
            <div style={{ height: 280, width: '100%' }}>
                {children}
            </div>
        </div>
    );

    // Get current data cut statistics
    const currentStats = rawMetrics ? rawMetrics[selectedCut] : null;

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
                            <option value="registered">{t('Registered Candidates (Master List)', 'المرشحون المسجلون (القائمة الرئيسية)')}</option>
                            <option value="active">{t('Active Jobseekers (Total AJS)', 'الباحثون النشطون عن عمل (الإجمالي)')}</option>
                            <option value="priority_1st">{t('1st Priority Candidates', 'المرشحون ذوو الأولوية الأولى')}</option>
                            <option value="hatta">{t('Hatta Initiative Cohort', 'مبادرة أهالي حتا')}</option>
                            <option value="cda">{t('CDA Initiative Cohort', 'مبادرة هيئة تنمية المجتمع')}</option>
                            <option value="gdo">{t('GDO Initiative Cohort', 'مبادرة مكتب التطوير الحكومي')}</option>
                            <option value="no_answer">{t('No Answer Candidates', 'المرشحون غير المجيبين')}</option>
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
            ) : (
                <div style={{ padding: 24 }}>
                    
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
                                    {currentStats.gender.find((g: any) => g.name === 'Female')?.value 
                                        ? `${Math.round((currentStats.gender.find((g: any) => g.name === 'Female').value / currentStats.total) * 100)}%`
                                        : '0%'
                                    }
                                </div>
                            </div>
                            <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 8, padding: 16 }}>
                                <div style={{ fontSize: 12, color: c.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>
                                    {t('Male Ratio', 'نسبة الذكور')}
                                </div>
                                <div style={{ fontSize: 24, fontWeight: 700, color: c.accent, marginTop: 4 }}>
                                    {currentStats.gender.find((g: any) => g.name === 'Male')?.value 
                                        ? `${Math.round((currentStats.gender.find((g: any) => g.name === 'Male').value / currentStats.total) * 100)}%`
                                        : '0%'
                                    }
                                </div>
                            </div>
                            <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 8, padding: 16 }}>
                                <div style={{ fontSize: 12, color: c.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>
                                    {t('Primary Location', 'الموقع الرئيسي')}
                                </div>
                                <div style={{ fontSize: 24, fontWeight: 700, color: c.green, marginTop: 4 }}>
                                    {currentStats.location.length > 0 ? currentStats.location[0].name : '—'}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: MAIN OVERVIEW */}
                    {activeTab === 'main' && currentStats && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <ChartCard title={t('Gender Distribution', 'توزيع الجنس')}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={currentStats.gender} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={5}>
                                            {currentStats.gender.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: c.cardBg, borderColor: c.cardBorder, color: c.textPrimary }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            <ChartCard title={t('Age Group Distribution', 'توزيع الفئات العمرية')}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={currentStats.age_group} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        <XAxis dataKey="name" stroke={c.textMuted} tick={{ fill: c.textSecondary, fontSize: 12 }} />
                                        <YAxis stroke={c.textMuted} tick={{ fill: c.textSecondary, fontSize: 12 }} />
                                        <Tooltip cursor={{ fill: c.cardBorder }} contentStyle={{ backgroundColor: c.cardBg, borderColor: c.cardBorder, color: c.textPrimary }} />
                                        <Bar dataKey="value" fill={c.accent} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            <ChartCard title={t('Education Level Distribution', 'توزيع المستويات التعليمية')}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={currentStats.education} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        <XAxis dataKey="name" stroke={c.textMuted} tick={{ fill: c.textSecondary, fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                                        <YAxis stroke={c.textMuted} tick={{ fill: c.textSecondary, fontSize: 12 }} />
                                        <Tooltip cursor={{ fill: c.cardBorder }} contentStyle={{ backgroundColor: c.cardBg, borderColor: c.cardBorder, color: c.textPrimary }} />
                                        <Bar dataKey="value" fill={c.green} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            <ChartCard title={t('Work Experience Years', 'سنوات الخبرة العملية')}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={currentStats.experience} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        <XAxis dataKey="name" stroke={c.textMuted} tick={{ fill: c.textSecondary, fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                                        <YAxis stroke={c.textMuted} tick={{ fill: c.textSecondary, fontSize: 12 }} />
                                        <Tooltip cursor={{ fill: c.cardBorder }} contentStyle={{ backgroundColor: c.cardBg, borderColor: c.cardBorder, color: c.textPrimary }} />
                                        <Bar dataKey="value" fill={c.purple} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            <ChartCard title={t('Emirate of Residence', 'إمارة الإقامة')} style={{ gridColumn: '1 / -1' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={currentStats.location} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
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
                            <ChartCard title={t('National Military Service Status', 'حالة الخدمة الوطنية')}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={currentStats.military} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        <XAxis dataKey="name" stroke={c.textMuted} tick={{ fill: c.textSecondary, fontSize: 11 }} angle={-15} textAnchor="end" height={50} />
                                        <YAxis stroke={c.textMuted} />
                                        <Tooltip cursor={{ fill: c.cardBorder }} contentStyle={{ backgroundColor: c.cardBg, borderColor: c.cardBorder, color: c.textPrimary }} />
                                        <Bar dataKey="value" fill={c.orange} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            <ChartCard title={t('Marital Status', 'الحالة الاجتماعية')}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={currentStats.marital} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2}>
                                            {currentStats.marital.map((entry: any, index: number) => (
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
                            {/* Initiatives comparison */}
                            <ChartCard title={t('EHRDC Initiatives Active Counts', 'أعداد المستفيدين النشطين من مبادرات الهيئة')}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[
                                        { name: t('Hatta Cohort', 'أهالي حتا'), value: rawMetrics.initiatives_totals.hatta },
                                        { name: t('CDA Cohort', 'تنمية المجتمع'), value: rawMetrics.initiatives_totals.cda },
                                        { name: t('GDO Cohort', 'التطوير الحكومي'), value: rawMetrics.initiatives_totals.gdo }
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

                            {/* No Answer Candidates */}
                            <ChartCard title={t('Contact Center Reachability Status', 'حالة استجابة الاتصال مع الكوادر')}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={[
                                            { name: t('Answered Call', 'أجابوا على الاتصال'), value: rawMetrics.registered.total - rawMetrics.no_answer.total },
                                            { name: t('No Answer / Pending', 'لم يجيبوا / قيد الانتظار'), value: rawMetrics.no_answer.total }
                                        ]} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2}>
                                            <Cell fill={c.green} />
                                            <Cell fill={c.red} />
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: c.cardBg, borderColor: c.cardBorder, color: c.textPrimary }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            {/* Weekly Registrations Added vs Removed */}
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
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DemographicsAnalytics;
