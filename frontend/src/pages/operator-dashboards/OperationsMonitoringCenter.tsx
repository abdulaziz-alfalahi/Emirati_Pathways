import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import {
    Activity, Users, Building2, GraduationCap, Briefcase,
    TrendingUp, BarChart3, Flag, Clock, CheckCircle,
    ArrowUp, ArrowDown, AlertTriangle, Globe, Zap,
    UserCheck, Award, MessageSquare, Target, Monitor
} from 'lucide-react';

const OperationsMonitoringCenter: React.FC = () => {
    const { language } = useLanguage();
    const isRTL = language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const colors = {
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
        textPrimary: '#F1F5F9',
        textSecondary: '#94A3B8',
        textMuted: '#64748B',
    };

    const platformHealth = {
        activeUsers: 3842,
        dailyRegistrations: 127,
        uptime: '99.97%',
        responseTime: '142ms',
    };

    const talentPipeline = [
        { label: t('Total Candidates', 'إجمالي المرشحين'), value: '12,847', icon: Users, change: '+2.7%', up: true },
        { label: t('CVs Created', 'السير الذاتية'), value: '9,215', icon: CheckCircle, change: '+3.1%', up: true },
        { label: t('Applications', 'الطلبات'), value: '4,580', icon: Briefcase, change: '+5.2%', up: true },
        { label: t('Placements', 'التوظيف'), value: '1,287', icon: Target, change: '+1.8%', up: true },
    ];

    const employerActivity = [
        { label: t('Companies', 'الشركات'), value: '342', icon: Building2, change: '+12', up: true },
        { label: t('Active Vacancies', 'الوظائف الشاغرة'), value: '1,856', icon: Briefcase, change: '+45', up: true },
        { label: t('Interviews', 'المقابلات'), value: '234', icon: Clock, change: '+18', up: true },
        { label: t('Offers Extended', 'العروض المقدمة'), value: '89', icon: Award, change: '+7', up: true },
    ];

    const educationMetrics = {
        institutions: 142,
        programs: 385,
        enrollments: 28450,
        scholarships: 2850,
    };

    const emiratizationData = {
        nationalRate: '4.28%',
        rateChange: '+0.15%',
        compliantCompanies: 285,
        nonCompliant: 57,
        sectors: [
            { name: t('Banking', 'المصارف'), rate: 42, target: 45 },
            { name: t('Telecom', 'الاتصالات'), rate: 38, target: 40 },
            { name: t('Insurance', 'التأمين'), rate: 35, target: 38 },
            { name: t('Real Estate', 'العقارات'), rate: 28, target: 30 },
            { name: t('Tech', 'التكنولوجيا'), rate: 15, target: 20 },
        ],
    };

    const operatorPerformance = [
        { name: t('Growth', 'النمو'), queue: 8, avgTime: '2.1h', icon: Building2, color: colors.green },
        { name: t('Nafis', 'نافس'), queue: 15, avgTime: '1.4h', icon: Users, color: colors.accent },
        { name: t('Education', 'التعليم'), queue: 5, avgTime: '3.2h', icon: GraduationCap, color: colors.purple },
        { name: t('Prof Dev', 'التطوير'), queue: 12, avgTime: '2.8h', icon: Award, color: colors.teal },
        { name: t('Community', 'المجتمع'), queue: 23, avgTime: '1.1h', icon: MessageSquare, color: colors.pink },
    ];

    const recentActivity = [
        { text: t('287 new candidates onboarded via Nafis', 'تم استقطاب 287 مرشحاً جديداً عبر نافس'), time: '12m', type: 'talent' },
        { text: t('ADNOC posted 15 new vacancies', 'نشرت أدنوك 15 وظيفة جديدة'), time: '28m', type: 'employer' },
        { text: t('UAE University added AI program', 'أضافت جامعة الإمارات برنامج الذكاء الاصطناعي'), time: '1h', type: 'education' },
        { text: t('Success story flagged for review', 'تم الإبلاغ عن قصة نجاح للمراجعة'), time: '2h', type: 'alert' },
    ];

    const MetricCard = ({ label, value, icon: Icon, change, up, color = colors.accent }: any) => (
        <div style={{ background: colors.cardBg, borderRadius: 8, padding: '12px 14px', border: `1px solid ${colors.cardBorder}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: `${color}20`, borderRadius: 6, padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={color} />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary, letterSpacing: -0.5 }}>{value}</div>
            </div>
            {change && (
                <div style={{ fontSize: 11, color: up ? colors.green : colors.red, display: 'flex', alignItems: 'center', gap: 2, fontWeight: 600 }}>
                    {up ? <ArrowUp size={10} /> : <ArrowDown size={10} />} {change}
                </div>
            )}
        </div>
    );

    return (
        <div dir={isRTL ? 'rtl' : 'ltr'} style={{
            minHeight: '100vh', background: colors.bg, overflow: 'hidden',
            fontFamily: "'Inter', -apple-system, sans-serif"
        }}>
            {/* Header Bar */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 24px', borderBottom: `1px solid ${colors.cardBorder}`,
                background: 'linear-gradient(180deg, #0F1729 0%, #0B1120 100%)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: colors.accentGlow, borderRadius: 8, padding: 6 }}>
                        <Monitor size={20} color={colors.accent} />
                    </div>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary, letterSpacing: -0.3 }}>
                            {t('Operations Monitoring Center', 'مركز مراقبة العمليات')}
                        </div>
                        <div style={{ fontSize: 11, color: colors.textMuted }}>{t('EHRDC Platform Command Center', 'مركز قيادة منصة الهيئة')}</div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors.green, boxShadow: `0 0 8px ${colors.green}` }} />
                        <span style={{ fontSize: 12, color: colors.green, fontWeight: 600 }}>{t('ALL SYSTEMS OPERATIONAL', 'جميع الأنظمة تعمل')}</span>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: colors.textPrimary, fontFeatureSettings: '"tnum"', letterSpacing: 1 }}>
                        {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                    </div>
                    <div style={{ fontSize: 11, color: colors.textMuted }}>
                        {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gridTemplateRows: 'auto auto auto', gap: 12, height: 'calc(100vh - 50px)' }}>

                {/* Row 1: Platform Health (full width) */}
                <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    <div style={{ background: colors.cardBg, borderRadius: 8, padding: 14, border: `1px solid ${colors.cardBorder}`, display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ background: colors.greenGlow, borderRadius: 8, padding: 8 }}>
                            <Activity size={20} color={colors.green} />
                        </div>
                        <div>
                            <div style={{ fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Active Users', 'المستخدمون النشطون')}</div>
                            <div style={{ fontSize: 28, fontWeight: 800, color: colors.textPrimary, fontFeatureSettings: '"tnum"' }}>{platformHealth.activeUsers.toLocaleString()}</div>
                        </div>
                        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                            <div style={{ fontSize: 11, color: colors.textMuted }}>{t('Peak today', 'ذروة اليوم')}</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: colors.green }}>4,127</div>
                        </div>
                    </div>

                    <div style={{ background: colors.cardBg, borderRadius: 8, padding: 14, border: `1px solid ${colors.cardBorder}`, display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ background: colors.accentGlow, borderRadius: 8, padding: 8 }}>
                            <UserCheck size={20} color={colors.accent} />
                        </div>
                        <div>
                            <div style={{ fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Daily Registrations', 'التسجيلات اليومية')}</div>
                            <div style={{ fontSize: 28, fontWeight: 800, color: colors.textPrimary, fontFeatureSettings: '"tnum"' }}>{platformHealth.dailyRegistrations}</div>
                        </div>
                        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                            <div style={{ fontSize: 11, color: colors.textMuted }}>{t('Monthly avg', 'المتوسط الشهري')}</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: colors.accent }}>98</div>
                        </div>
                    </div>

                    <div style={{ background: colors.cardBg, borderRadius: 8, padding: 14, border: `1px solid ${colors.cardBorder}`, display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ background: colors.greenGlow, borderRadius: 8, padding: 8 }}>
                            <Globe size={20} color={colors.green} />
                        </div>
                        <div>
                            <div style={{ fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Uptime', 'التشغيل')}</div>
                            <div style={{ fontSize: 28, fontWeight: 800, color: colors.green, fontFeatureSettings: '"tnum"' }}>{platformHealth.uptime}</div>
                        </div>
                    </div>

                    <div style={{ background: colors.cardBg, borderRadius: 8, padding: 14, border: `1px solid ${colors.cardBorder}`, display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ background: colors.purpleGlow, borderRadius: 8, padding: 8 }}>
                            <Zap size={20} color={colors.purple} />
                        </div>
                        <div>
                            <div style={{ fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Response Time', 'وقت الاستجابة')}</div>
                            <div style={{ fontSize: 28, fontWeight: 800, color: colors.purple, fontFeatureSettings: '"tnum"' }}>{platformHealth.responseTime}</div>
                        </div>
                    </div>
                </div>

                {/* Row 2: Talent Pipeline + Employer Activity */}
                <div style={{ gridColumn: '1 / 3', background: colors.cardBg, borderRadius: 8, padding: 16, border: `1px solid ${colors.cardBorder}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Users size={16} color={colors.accent} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Talent Pipeline', 'خط الكوادر')}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {talentPipeline.map((m, i) => (
                            <MetricCard key={i} {...m} color={colors.accent} />
                        ))}
                    </div>
                </div>

                <div style={{ gridColumn: '3 / 5', background: colors.cardBg, borderRadius: 8, padding: 16, border: `1px solid ${colors.cardBorder}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Building2 size={16} color={colors.green} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Employer Activity', 'نشاط أصحاب العمل')}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {employerActivity.map((m, i) => (
                            <MetricCard key={i} {...m} color={colors.green} />
                        ))}
                    </div>
                </div>

                {/* Row 3: Emiratization + Operator Performance + Activity */}
                <div style={{ background: colors.cardBg, borderRadius: 8, padding: 16, border: `1px solid ${colors.cardBorder}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Flag size={16} color={colors.yellow} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Emiratization', 'التوطين')}</span>
                    </div>
                    <div style={{ textAlign: 'center', marginBottom: 12 }}>
                        <div style={{ fontSize: 36, fontWeight: 800, color: colors.yellow, fontFeatureSettings: '"tnum"' }}>{emiratizationData.nationalRate}</div>
                        <div style={{ fontSize: 11, color: colors.green, fontWeight: 600 }}><ArrowUp size={10} /> {emiratizationData.rateChange}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 12 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 18, fontWeight: 700, color: colors.green }}>{emiratizationData.compliantCompanies}</div>
                            <div style={{ fontSize: 10, color: colors.textMuted }}>{t('Compliant', 'ملتزمة')}</div>
                        </div>
                        <div style={{ width: 1, background: colors.cardBorder }} />
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 18, fontWeight: 700, color: colors.red }}>{emiratizationData.nonCompliant}</div>
                            <div style={{ fontSize: 10, color: colors.textMuted }}>{t('Non-Compliant', 'غير ملتزمة')}</div>
                        </div>
                    </div>
                    {emiratizationData.sectors.map((s, i) => (
                        <div key={i} style={{ marginBottom: 6 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3, color: colors.textSecondary }}>
                                <span>{s.name}</span>
                                <span style={{ fontWeight: 600, color: s.rate >= s.target ? colors.green : colors.yellow }}>{s.rate}%</span>
                            </div>
                            <div style={{ height: 4, background: colors.cardBorder, borderRadius: 2, position: 'relative' }}>
                                <div style={{ height: '100%', width: `${(s.rate / 50) * 100}%`, background: s.rate >= s.target ? colors.green : colors.yellow, borderRadius: 2, transition: 'width 1s ease' }} />
                                <div style={{ position: 'absolute', left: `${(s.target / 50) * 100}%`, top: -2, width: 2, height: 8, background: colors.red, borderRadius: 1 }} />
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ gridColumn: '2 / 4', background: colors.cardBg, borderRadius: 8, padding: 16, border: `1px solid ${colors.cardBorder}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <BarChart3 size={16} color={colors.purple} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Operator Performance', 'أداء المشغلين')}</span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                                <th style={{ padding: '8px 6px', fontSize: 11, color: colors.textMuted, textAlign: isRTL ? 'right' : 'left', fontWeight: 600 }}>{t('Operator', 'المشغل')}</th>
                                <th style={{ padding: '8px 6px', fontSize: 11, color: colors.textMuted, textAlign: 'center', fontWeight: 600 }}>{t('Queue', 'الانتظار')}</th>
                                <th style={{ padding: '8px 6px', fontSize: 11, color: colors.textMuted, textAlign: 'center', fontWeight: 600 }}>{t('Avg Time', 'متوسط الوقت')}</th>
                                <th style={{ padding: '8px 6px', fontSize: 11, color: colors.textMuted, textAlign: 'center', fontWeight: 600 }}>{t('Status', 'الحالة')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {operatorPerformance.map((op, i) => (
                                <tr key={i} style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                                    <td style={{ padding: '10px 6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <op.icon size={14} color={op.color} />
                                            <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{op.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                                        <span style={{
                                            fontSize: 13, fontWeight: 700, padding: '2px 10px', borderRadius: 10,
                                            color: op.queue > 20 ? colors.red : op.queue > 10 ? colors.yellow : colors.green,
                                            background: op.queue > 20 ? colors.redGlow : op.queue > 10 ? colors.yellowGlow : colors.greenGlow,
                                        }}>{op.queue}</span>
                                    </td>
                                    <td style={{ padding: '10px 6px', textAlign: 'center', fontSize: 13, color: colors.textSecondary, fontFeatureSettings: '"tnum"' }}>{op.avgTime}</td>
                                    <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: op.queue > 20 ? colors.yellow : colors.green, margin: '0 auto', boxShadow: `0 0 6px ${op.queue > 20 ? colors.yellow : colors.green}` }} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ background: colors.cardBg, borderRadius: 8, padding: 16, border: `1px solid ${colors.cardBorder}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Activity size={16} color={colors.teal} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Live Feed', 'التحديثات')}</span>
                    </div>
                    {recentActivity.map((a, i) => (
                        <div key={i} style={{ padding: '8px 0', borderBottom: i < recentActivity.length - 1 ? `1px solid ${colors.cardBorder}` : 'none' }}>
                            <div style={{ fontSize: 12, color: colors.textPrimary, lineHeight: 1.4 }}>{a.text}</div>
                            <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>{a.time} {t('ago', 'مضت')}</div>
                        </div>
                    ))}

                    <div style={{ marginTop: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <GraduationCap size={14} color={colors.purple} />
                            <span style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase' }}>{t('Education', 'التعليم')}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                            <div style={{ background: `${colors.purple}15`, borderRadius: 6, padding: 8, textAlign: 'center' }}>
                                <div style={{ fontSize: 16, fontWeight: 700, color: colors.purple }}>{educationMetrics.institutions}</div>
                                <div style={{ fontSize: 9, color: colors.textMuted }}>{t('Institutions', 'مؤسسة')}</div>
                            </div>
                            <div style={{ background: `${colors.purple}15`, borderRadius: 6, padding: 8, textAlign: 'center' }}>
                                <div style={{ fontSize: 16, fontWeight: 700, color: colors.purple }}>{educationMetrics.programs}</div>
                                <div style={{ fontSize: 9, color: colors.textMuted }}>{t('Programs', 'برنامج')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OperationsMonitoringCenter;
