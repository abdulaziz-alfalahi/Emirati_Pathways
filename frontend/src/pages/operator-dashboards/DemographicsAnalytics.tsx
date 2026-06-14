import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    Activity, Users, PieChart as PieChartIcon, 
    BarChart3, Loader2, AlertTriangle, UserCheck, ShieldAlert
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
};

const COLORS = [c.accent, c.green, c.yellow, c.purple, c.orange, c.teal, c.pink, c.red];

const DemographicsAnalytics: React.FC = () => {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const isRTL = language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;

    const [activeTab, setActiveTab] = useState<'main' | 'priority' | 'reachability'>('main');
    
    const [mainData, setMainData] = useState<any>(null);
    const [priorityData, setPriorityData] = useState<any>(null);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMainData = async () => {
            try {
                const res = await restClient.get('/api/metrics/demographics');
                if (res.data?.success && res.data?.data) {
                    // Map the new mock data structure to what the charts expect
                    const metrics = res.data.data;
                    
                    setMainData({
                        gender: [
                            { name: 'Male', value: metrics.age_distribution.reduce((acc: number, item: any) => acc + item.male, 0) },
                            { name: 'Female', value: metrics.age_distribution.reduce((acc: number, item: any) => acc + item.female, 0) }
                        ],
                        age_group: metrics.age_distribution.map((item: any) => ({
                            name: item.group,
                            value: item.male + item.female
                        })),
                        education: metrics.education_levels.map((item: any) => ({
                            name: item.level,
                            value: item.employed + item.seeking
                        })),
                        employment: [
                            { name: 'Employed', value: metrics.education_levels.reduce((acc: number, item: any) => acc + item.employed, 0) },
                            { name: 'Seeking', value: metrics.education_levels.reduce((acc: number, item: any) => acc + item.seeking, 0) }
                        ]
                    });

                    setPriorityData({
                        emirate: metrics.regional_spread.map((item: any) => ({
                            name: item.emirate,
                            value: item.candidates
                        })),
                        military: [
                            { name: 'Completed', value: 12000 },
                            { name: 'Exempted', value: 3500 },
                            { name: 'Pending', value: 2500 }
                        ],
                        marital: [
                            { name: 'Single', value: 15000 },
                            { name: 'Married', value: 20000 },
                            { name: 'Divorced', value: 1200 },
                            { name: 'Widowed', value: 300 }
                        ]
                    });
                }
            } catch (e: any) {
                console.error(e);
                setError(e.message || 'Failed to load');
            }
        };

        Promise.all([fetchMainData()]).finally(() => {
            setLoading(false);
        });
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
            <div style={{ height: 300, width: '100%' }}>
                {children}
            </div>
        </div>
    );

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
                    <TabButton id="priority" label={t('Priority Segments', 'الشرائح ذات الأولوية')} icon={ShieldAlert} />
                    <TabButton id="reachability" label={t('Reachability', 'إمكانية الوصول')} icon={Activity} />
                </div>
            </div>

            {/* ─── Body ─────────────────────────────────────────── */}
            {loading && !mainData ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 100, gap: 12, color: c.textSecondary }}>
                    <Loader2 size={24} className="animate-spin" />
                    <span style={{ fontSize: 14 }}>{t('Loading analytics data...', 'جارٍ تحميل البيانات...')}</span>
                </div>
            ) : error && !mainData ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 100, gap: 12, color: c.red }}>
                    <AlertTriangle size={24} />
                    <span style={{ fontSize: 14 }}>{error}</span>
                </div>
            ) : (
                <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    
                    {/* TAB: MAIN OVERVIEW */}
                    {activeTab === 'main' && mainData && (
                        <>
                            <ChartCard title={t('Gender Distribution', 'توزيع الجنس')}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={mainData.gender} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5}>
                                            {mainData.gender.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: c.cardBg, borderColor: c.cardBorder, color: c.textPrimary }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            <ChartCard title={t('Age Group Status', 'حالة الفئة العمرية')}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={mainData.age_group} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        <XAxis dataKey="name" stroke={c.textMuted} tick={{ fill: c.textSecondary, fontSize: 12 }} />
                                        <YAxis stroke={c.textMuted} tick={{ fill: c.textSecondary, fontSize: 12 }} />
                                        <Tooltip cursor={{ fill: c.cardBorder }} contentStyle={{ backgroundColor: c.cardBg, borderColor: c.cardBorder, color: c.textPrimary }} />
                                        <Bar dataKey="value" fill={c.accent} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            <ChartCard title={t('Education Status', 'حالة التعليم')}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={mainData.education} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        <XAxis dataKey="name" stroke={c.textMuted} tick={{ fill: c.textSecondary, fontSize: 10 }} angle={-25} textAnchor="end" height={60} />
                                        <YAxis stroke={c.textMuted} tick={{ fill: c.textSecondary, fontSize: 12 }} />
                                        <Tooltip cursor={{ fill: c.cardBorder }} contentStyle={{ backgroundColor: c.cardBg, borderColor: c.cardBorder, color: c.textPrimary }} />
                                        <Bar dataKey="value" fill={c.green} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            <ChartCard title={t('Employment Status', 'الحالة الوظيفية')}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={mainData.employment} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                        <XAxis type="number" stroke={c.textMuted} />
                                        <YAxis dataKey="name" type="category" stroke={c.textMuted} tick={{ fill: c.textSecondary, fontSize: 11 }} width={120} />
                                        <Tooltip cursor={{ fill: c.cardBorder }} contentStyle={{ backgroundColor: c.cardBg, borderColor: c.cardBorder, color: c.textPrimary }} />
                                        <Bar dataKey="value" fill={c.purple} radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>
                        </>
                    )}

                    {/* TAB: PRIORITY SEGMENTS */}
                    {activeTab === 'priority' && priorityData && (
                        <>
                            <ChartCard title={t('Military Service Status', 'حالة الخدمة الوطنية')}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={priorityData.military} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        <XAxis dataKey="name" stroke={c.textMuted} tick={{ fill: c.textSecondary, fontSize: 12 }} />
                                        <YAxis stroke={c.textMuted} />
                                        <Tooltip cursor={{ fill: c.cardBorder }} contentStyle={{ backgroundColor: c.cardBg, borderColor: c.cardBorder, color: c.textPrimary }} />
                                        <Bar dataKey="value" fill={c.orange} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            <ChartCard title={t('Marital Status', 'الحالة الاجتماعية')}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={priorityData.marital} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={2}>
                                            {priorityData.marital.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: c.cardBg, borderColor: c.cardBorder, color: c.textPrimary }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            <ChartCard title={t('Emirate Of Residence', 'إمارة الإقامة')}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={priorityData.emirate} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        <XAxis dataKey="name" stroke={c.textMuted} tick={{ fill: c.textSecondary, fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                                        <YAxis stroke={c.textMuted} />
                                        <Tooltip cursor={{ fill: c.cardBorder }} contentStyle={{ backgroundColor: c.cardBg, borderColor: c.cardBorder, color: c.textPrimary }} />
                                        <Bar dataKey="value" fill={c.teal} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>
                        </>
                    )}

                    {/* TAB: REACHABILITY */}
                    {activeTab === 'reachability' && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 60, color: c.textMuted }}>
                            <UserCheck size={48} color={c.textMuted} style={{ margin: '0 auto 16px' }} />
                            <div style={{ fontSize: 18, fontWeight: 600 }}>{t('No Answer / GDO Tracking', 'تتبع الكوادر غير المجيبة')}</div>
                            <div style={{ fontSize: 14, marginTop: 8 }}>{t('Module coming soon based on live CRM interactions.', 'ستتوفر قريباً بناءً على تفاعلات نظام إدارة العلاقات الحي.')}</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DemographicsAnalytics;
