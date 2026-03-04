
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import {
    Users, TrendingUp, Building2, BarChart3, Target, Shield, Award, CheckCircle,
    AlertTriangle, ArrowUp, ArrowDown, ChevronRight, ChevronLeft, Calendar,
    FileText, Download, Eye, Clock, Briefcase, Globe, Zap, Star,
    PieChart, Activity, Flag, MapPin, DollarSign, UserCheck, UserPlus
} from 'lucide-react';

const brand = {
    primary: '#0D9488', primaryDark: '#0F766E', primarySurface: '#F0FDFA',
    border: '#E5E7EB', textPrimary: '#111827', textSecondary: '#6B7280',
    amber: '#FEF3C7', amberText: '#92400E', green: '#DCFCE7', greenText: '#166534',
    red: '#FEE2E2', redText: '#991B1B', blue: '#DBEAFE', blueText: '#1E40AF',
    purple: '#F3E8FF', purpleText: '#6B21A8', pink: '#FCE7F3', pinkText: '#9D174D',
    orange: '#FFF7ED', orangeText: '#C2410C',
};

const EmiratizationTrackerPage: React.FC = () => {
    const { i18n } = useTranslation();
    const { toggleLanguage } = useLanguage();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;

    const [activeTab, setActiveTab] = useState(0);

    const tabs = [
        t('Dashboard', 'لوحة المتابعة'),
        t('Company Compliance', 'امتثال الشركات'),
        t('Sector Analysis', 'تحليل القطاعات'),
        t('Nafis Programs', 'برامج نافس'),
        t('Reports', 'التقارير'),
    ];

    /* ── DATA ── */
    const overviewStats = [
        { value: '10.17%', label: t('National Emiratization Rate', 'معدل التوطين الوطني'), icon: Users, trend: '+2.3%', trendUp: true, bg: brand.primarySurface, color: brand.primary },
        { value: '78,500', label: t('Emiratis in Private Sector', 'إماراتيون في القطاع الخاص'), icon: Briefcase, trend: '+12,400', trendUp: true, bg: brand.green, color: brand.greenText },
        { value: '14,200', label: t('Companies Compliant', 'شركات ممتثلة'), icon: CheckCircle, trend: '+1,850', trendUp: true, bg: brand.blue, color: brand.blueText },
        { value: '2,340', label: t('Non-Compliant', 'غير ممتثلة'), icon: AlertTriangle, trend: '-420', trendUp: true, bg: brand.amber, color: brand.amberText },
    ];

    const quarterlyProgress = [
        { quarter: 'Q1 2025', rate: '7.5%', hired: '54,200', target: '6%' },
        { quarter: 'Q2 2025', rate: '8.2%', hired: '60,100', target: '7%' },
        { quarter: 'Q3 2025', rate: '9.1%', hired: '68,900', target: '8%' },
        { quarter: 'Q4 2025', rate: '9.8%', hired: '74,300', target: '9%' },
        { quarter: 'Q1 2026', rate: '10.17%', hired: '78,500', target: '10%', current: true },
    ];

    const companies = [
        { name: t('Emirates NBD', 'الإمارات دبي الوطني'), sector: t('Banking', 'البنوك'), rate: '18.5%', target: '15%', status: 'compliant', emiratis: 3420, total: 18490, trend: '+2.1%' },
        { name: t('Etisalat (e&)', 'اتصالات (e&)'), sector: t('Telecom', 'الاتصالات'), rate: '22.3%', target: '15%', status: 'compliant', emiratis: 4150, total: 18610, trend: '+1.8%' },
        { name: t('ADNOC Group', 'مجموعة أدنوك'), sector: t('Oil & Gas', 'النفط والغاز'), rate: '60.2%', target: '20%', status: 'exemplary', emiratis: 12500, total: 20760, trend: '+0.5%' },
        { name: t('Emaar Properties', 'إعمار العقارية'), sector: t('Real Estate', 'العقارات'), rate: '12.8%', target: '10%', status: 'compliant', emiratis: 890, total: 6950, trend: '+3.2%' },
        { name: t('Dubai Holding', 'دبي القابضة'), sector: t('Diversified', 'متنوع'), rate: '25.1%', target: '15%', status: 'compliant', emiratis: 2800, total: 11160, trend: '+1.4%' },
        { name: t('Majid Al Futtaim', 'ماجد الفطيم'), sector: t('Retail', 'التجزئة'), rate: '6.2%', target: '10%', status: 'non_compliant', emiratis: 2480, total: 40000, trend: '+0.8%' },
        { name: t('Al Futtaim Group', 'مجموعة الفطيم'), sector: t('Automotive & Retail', 'السيارات والتجزئة'), rate: '5.8%', target: '10%', status: 'non_compliant', emiratis: 1160, total: 20000, trend: '+1.1%' },
        { name: t('Mashreq Bank', 'بنك المشرق'), sector: t('Banking', 'البنوك'), rate: '16.9%', target: '15%', status: 'compliant', emiratis: 845, total: 5000, trend: '+2.5%' },
    ];

    const sectors = [
        { name: t('Banking & Finance', 'البنوك والمالية'), rate: '17.8%', target: '15%', emiratis: 14200, totalWorkforce: 79775, companies: 48, compliance: 92, trend: '+2.3%', catBg: brand.blue, catColor: brand.blueText, icon: DollarSign },
        { name: t('Oil & Gas', 'النفط والغاز'), rate: '45.5%', target: '20%', emiratis: 22300, totalWorkforce: 49010, companies: 12, compliance: 100, trend: '+0.8%', catBg: brand.green, catColor: brand.greenText, icon: Zap },
        { name: t('Telecommunications', 'الاتصالات'), rate: '20.1%', target: '15%', emiratis: 8200, totalWorkforce: 40795, companies: 8, compliance: 88, trend: '+1.5%', catBg: brand.purple, catColor: brand.purpleText, icon: Globe },
        { name: t('Real Estate', 'العقارات'), rate: '11.2%', target: '10%', emiratis: 5600, totalWorkforce: 50000, companies: 85, compliance: 72, trend: '+3.1%', catBg: brand.amber, catColor: brand.amberText, icon: Building2 },
        { name: t('Retail & Hospitality', 'التجزئة والضيافة'), rate: '5.8%', target: '10%', emiratis: 9800, totalWorkforce: 168965, companies: 320, compliance: 45, trend: '+1.9%', catBg: brand.red, catColor: brand.redText, icon: Briefcase },
        { name: t('Technology', 'التكنولوجيا'), rate: '8.4%', target: '10%', emiratis: 3200, totalWorkforce: 38095, companies: 145, compliance: 58, trend: '+4.2%', catBg: brand.pink, catColor: brand.pinkText, icon: Activity },
        { name: t('Healthcare', 'الرعاية الصحية'), rate: '7.1%', target: '10%', emiratis: 4100, totalWorkforce: 57745, companies: 92, compliance: 51, trend: '+2.7%', catBg: brand.orange, catColor: brand.orangeText, icon: Shield },
    ];

    const nafisPrograms = [
        { name: t('Salary Support Program', 'برنامج دعم الرواتب'), desc: t('Monthly salary top-up for Emiratis working in the private sector, up to AED 7,000/month for 5 years', 'دعم شهري لرواتب الإماراتيين العاملين في القطاع الخاص، حتى 7,000 د.إ شهرياً لمدة 5 سنوات'), beneficiaries: '45,200', budget: t('AED 2.4B', '2.4 مليار د.إ'), status: t('Active', 'نشط'), catBg: brand.green, catColor: brand.greenText },
        { name: t('Unemployment Insurance', 'التأمين ضد التعطل'), desc: t('Financial safety net providing up to AED 20,000/month for job seekers between positions', 'شبكة أمان مالية توفر حتى 20,000 د.إ شهرياً للباحثين عن عمل بين الوظائف'), beneficiaries: '8,400', budget: t('AED 680M', '680 مليون د.إ'), status: t('Active', 'نشط'), catBg: brand.blue, catColor: brand.blueText },
        { name: t('Child Allowance', 'علاوة الأولاد'), desc: t('AED 800/month per child (up to 4 children) for Emiratis employed in the private sector', '800 د.إ شهرياً لكل طفل (حتى 4 أطفال) للإماراتيين العاملين في القطاع الخاص'), beneficiaries: '32,100', budget: t('AED 1.1B', '1.1 مليار د.إ'), status: t('Active', 'نشط'), catBg: brand.pink, catColor: brand.pinkText },
        { name: t('Apprenticeship Program (Ruwwad)', 'برنامج التدريب المهني (رواد)'), desc: t('On-the-job training with AED 3,500/month stipend for fresh graduates entering the private sector', 'تدريب عملي مع بدل 3,500 د.إ شهرياً للخريجين الجدد الملتحقين بالقطاع الخاص'), beneficiaries: '5,800', budget: t('AED 240M', '240 مليون د.إ'), status: t('Active', 'نشط'), catBg: brand.amber, catColor: brand.amberText },
        { name: t('Pension Contribution Support', 'دعم مساهمات التقاعد'), desc: t('Government covers pension contribution differences between public and private sector rates', 'تتحمل الحكومة فروقات مساهمات التقاعد بين القطاعين العام والخاص'), beneficiaries: '52,000', budget: t('AED 3.2B', '3.2 مليار د.إ'), status: t('Active', 'نشط'), catBg: brand.purple, catColor: brand.purpleText },
        { name: t('Training & Upskilling Vouchers', 'قسائم التدريب والتطوير'), desc: t('Up to AED 20,000 in training vouchers for professional certifications and skills development', 'حتى 20,000 د.إ في قسائم التدريب للشهادات المهنية وتطوير المهارات'), beneficiaries: '18,600', budget: t('AED 370M', '370 مليون د.إ'), status: t('Active', 'نشط'), catBg: brand.orange, catColor: brand.orangeText },
    ];

    const reportTypes = [
        { title: t('Quarterly Compliance Report', 'تقرير الامتثال الفصلي'), desc: t('Detailed breakdown of Emiratization rates by sector, company size, and emirate', 'تفصيل مفصل لمعدلات التوطين حسب القطاع وحجم الشركة والإمارة'), period: 'Q1 2026', icon: BarChart3, catBg: brand.blue, catColor: brand.blueText },
        { title: t('Penalty Assessment Report', 'تقرير تقييم العقوبات'), desc: t('Companies below target rates and applicable financial penalties under MOHRE regulations', 'الشركات دون المعدلات المستهدفة والعقوبات المالية المطبقة بموجب لوائح الوزارة'), period: t('Monthly', 'شهري'), icon: AlertTriangle, catBg: brand.red, catColor: brand.redText },
        { title: t('Workforce Nationality Report', 'تقرير جنسيات القوى العاملة'), desc: t('Demographics and nationality distribution across the private sector workforce', 'التوزيع الديموغرافي والجنسيات عبر القوى العاملة في القطاع الخاص'), period: t('Annual', 'سنوي'), icon: Globe, catBg: brand.purple, catColor: brand.purpleText },
        { title: t('Nafis Impact Assessment', 'تقييم أثر نافس'), desc: t('Effectiveness analysis of Nafis programs on Emirati employment in the private sector', 'تحليل فعالية برامج نافس على توظيف الإماراتيين في القطاع الخاص'), period: t('Bi-Annual', 'نصف سنوي'), icon: Target, catBg: brand.green, catColor: brand.greenText },
        { title: t('Skills Gap Analysis', 'تحليل فجوة المهارات'), desc: t('Comparison of available Emirati talent skills vs. private sector demand by industry', 'مقارنة مهارات الكفاءات الإماراتية المتاحة مع طلب القطاع الخاص حسب الصناعة'), period: t('Quarterly', 'فصلي'), icon: Activity, catBg: brand.amber, catColor: brand.amberText },
        { title: t('Emirati Retention Report', 'تقرير استبقاء الإماراتيين'), desc: t('Turnover rates, satisfaction surveys, and retention strategies effectiveness', 'معدلات الدوران الوظيفي واستطلاعات الرضا وفعالية استراتيجيات الاستبقاء'), period: t('Quarterly', 'فصلي'), icon: UserCheck, catBg: brand.pink, catColor: brand.pinkText },
    ];

    /* ── Shared styles ── */
    const card: React.CSSProperties = { background: '#fff', borderRadius: 16, border: `1px solid ${brand.border}`, padding: 24, marginBottom: 16 };
    const badgeStyle = (bg: string, color: string): React.CSSProperties => ({ background: bg, color, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap' as const });
    const tabBtnStyle = (active: boolean): React.CSSProperties => ({ padding: '10px 20px', fontSize: 14, fontWeight: active ? 600 : 400, color: active ? brand.primary : brand.textSecondary, borderBottom: active ? `2px solid ${brand.primary}` : '2px solid transparent', cursor: 'pointer', background: 'none', border: 'none', borderBottomStyle: 'solid' as const });
    const statusBadge = (status: string) => {
        const map: Record<string, { bg: string; color: string; label: string }> = {
            compliant: { bg: brand.green, color: brand.greenText, label: t('Compliant', 'ممتثل') },
            exemplary: { bg: brand.blue, color: brand.blueText, label: t('Exemplary', 'نموذجي') },
            non_compliant: { bg: brand.red, color: brand.redText, label: t('Non-Compliant', 'غير ممتثل') },
        };
        const s = map[status] || map.compliant;
        return <span style={badgeStyle(s.bg, s.color)}>{s.label}</span>;
    };
    const progressBar = (value: number, max: number, color: string) => (
        <div style={{ width: '100%', height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min((value / max) * 100, 100)}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
        </div>
    );

    /* ── TAB 1: Dashboard ── */
    const dashboardTab = (
        <div>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {overviewStats.map((s, i) => (
                    <div key={i} style={{ ...card, marginBottom: 0, textAlign: 'center' }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                            <s.icon size={22} color={s.color} />
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: brand.textPrimary }}>{s.value}</div>
                        <div style={{ fontSize: 13, color: brand.textSecondary, marginBottom: 8 }}>{s.label}</div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: s.trendUp ? brand.greenText : brand.redText }}>
                            {s.trendUp ? <ArrowUp size={12} /> : <ArrowDown size={12} />} {s.trend}
                        </div>
                    </div>
                ))}
            </div>

            {/* Quarterly Progress */}
            <div style={card}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Emiratization Progress (Quarterly)', 'تقدم التوطين (فصلي)')}</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                    {quarterlyProgress.map((q, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', background: q.current ? brand.primarySurface : '#F9FAFB', borderRadius: 12, border: q.current ? `1.5px solid ${brand.primary}` : `1px solid ${brand.border}` }}>
                            <div style={{ width: 90, fontSize: 13, fontWeight: 600, color: q.current ? brand.primary : brand.textPrimary }}>{q.quarter} {q.current && '📍'}</div>
                            <div style={{ flex: 1 }}>{progressBar(parseFloat(q.rate), 15, q.current ? brand.primary : '#94A3B8')}</div>
                            <div style={{ width: 60, fontSize: 14, fontWeight: 700, color: q.current ? brand.primary : brand.textPrimary, textAlign: 'center' }}>{q.rate}</div>
                            <div style={{ width: 80, fontSize: 12, color: brand.textSecondary }}>{t('Target', 'الهدف')}: {q.target}</div>
                            <div style={{ width: 100, fontSize: 12, color: brand.textSecondary }}>{q.hired} {t('hired', 'موظف')}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Key Milestones */}
            <div style={card}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('2025-2026 Milestones', 'إنجازات 2025-2026')}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    {[
                        { icon: Target, title: t('2% Annual Increase Target', 'هدف زيادة 2% سنوياً'), desc: t('MOHRE mandates 2% annual increase in Emiratization for companies with 50+ employees', 'تُلزم الوزارة بزيادة 2% سنوياً في التوطين للشركات التي لديها 50+ موظفاً'), catBg: brand.blue, catColor: brand.blueText },
                        { icon: DollarSign, title: t('AED 6,000/month Penalty', 'غرامة 6,000 د.إ/شهرياً'), desc: t('Monthly fine per missing Emirati employee below the quota target', 'غرامة شهرية لكل موظف إماراتي أقل من حصة التوطين المستهدفة'), catBg: brand.red, catColor: brand.redText },
                        { icon: Flag, title: t('10% Rate Achieved', 'تحقيق معدل 10%'), desc: t('UAE reached 10% private sector Emiratization milestone in Q1 2026', 'حققت الإمارات معدل 10% توطين في القطاع الخاص في الربع الأول 2026'), catBg: brand.green, catColor: brand.greenText },
                    ].map((m, i) => (
                        <div key={i} style={{ padding: 20, background: m.catBg + '40', borderRadius: 14, border: `1px solid ${m.catColor}20` }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: m.catBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                <m.icon size={20} color={m.catColor} />
                            </div>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, marginBottom: 6 }}>{m.title}</h4>
                            <p style={{ fontSize: 12, color: brand.textSecondary, lineHeight: 1.6 }}>{m.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ── TAB 2: Company Compliance ── */
    const companyTab = (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary }}>{t('Company Compliance Tracker', 'متابعة امتثال الشركات')}</h2>
                <span style={{ fontSize: 13, color: brand.textSecondary }}>{companies.length} {t('companies', 'شركة')}</span>
            </div>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr', gap: 12, padding: '12px 16px', background: '#F9FAFB', borderRadius: 10, marginBottom: 8, fontSize: 12, fontWeight: 600, color: brand.textSecondary }}>
                <span>{t('Company', 'الشركة')}</span>
                <span>{t('Sector', 'القطاع')}</span>
                <span>{t('Rate', 'المعدل')}</span>
                <span>{t('Target', 'الهدف')}</span>
                <span>{t('Emiratis', 'إماراتيون')}</span>
                <span>{t('Status', 'الحالة')}</span>
            </div>
            {companies.map((c, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr', gap: 12, padding: '16px', alignItems: 'center', background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, marginBottom: 8 }}>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: brand.textSecondary, display: 'flex', alignItems: 'center', gap: 4 }}>
                            {c.trend && <span style={{ color: brand.greenText, fontWeight: 600 }}><ArrowUp size={10} /> {c.trend}</span>}
                        </div>
                    </div>
                    <span style={{ fontSize: 13, color: brand.textSecondary }}>{c.sector}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: parseFloat(c.rate) >= parseFloat(c.target) ? brand.greenText : brand.redText }}>{c.rate}</span>
                    <span style={{ fontSize: 13, color: brand.textSecondary }}>{c.target}</span>
                    <span style={{ fontSize: 13, color: brand.textPrimary }}>{c.emiratis.toLocaleString()}/{c.total.toLocaleString()}</span>
                    {statusBadge(c.status)}
                </div>
            ))}
        </div>
    );

    /* ── TAB 3: Sector Analysis ── */
    const sectorTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Emiratization by Sector', 'التوطين حسب القطاع')}</h2>
            {sectors.map((s, i) => (
                <div key={i} style={{ ...card, borderLeft: isRTL ? '' : `4px solid ${s.catColor}`, borderRight: isRTL ? `4px solid ${s.catColor}` : '' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 280 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: s.catBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <s.icon size={20} color={s.catColor} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary }}>{s.name}</h3>
                                    <span style={{ fontSize: 12, color: brand.textSecondary }}>{s.companies} {t('companies', 'شركة')}</span>
                                </div>
                            </div>
                            <div style={{ marginBottom: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                                    <span style={{ color: brand.textSecondary }}>{t('Current Rate', 'المعدل الحالي')}: <strong style={{ color: brand.textPrimary }}>{s.rate}</strong></span>
                                    <span style={{ color: brand.textSecondary }}>{t('Target', 'الهدف')}: {s.target}</span>
                                </div>
                                {progressBar(parseFloat(s.rate), parseFloat(s.target) * 1.5, parseFloat(s.rate) >= parseFloat(s.target) ? brand.greenText : brand.redText)}
                            </div>
                            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: brand.textSecondary }}>
                                <span><Users size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {s.emiratis.toLocaleString()} {t('Emiratis', 'إماراتي')}</span>
                                <span><Building2 size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {s.totalWorkforce.toLocaleString()} {t('total', 'إجمالي')}</span>
                                <span style={{ color: brand.greenText, fontWeight: 600 }}><ArrowUp size={12} /> {s.trend}</span>
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', minWidth: 110 }}>
                            <div style={{ fontSize: 11, color: brand.textSecondary, marginBottom: 4 }}>{t('Compliance Rate', 'معدل الامتثال')}</div>
                            <div style={{ fontSize: 28, fontWeight: 700, color: s.compliance >= 80 ? brand.greenText : s.compliance >= 60 ? brand.amberText : brand.redText }}>{s.compliance}%</div>
                            <span style={badgeStyle(s.compliance >= 80 ? brand.green : s.compliance >= 60 ? brand.amber : brand.red, s.compliance >= 80 ? brand.greenText : s.compliance >= 60 ? brand.amberText : brand.redText)}>
                                {s.compliance >= 80 ? t('Strong', 'قوي') : s.compliance >= 60 ? t('Moderate', 'متوسط') : t('Needs Improvement', 'يحتاج تحسين')}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    /* ── TAB 4: Nafis ── */
    const nafisTab = (
        <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: brand.textPrimary, marginBottom: 8 }}>{t('Nafis — National Program for Emiratis', 'نافس — البرنامج الوطني لتنمية الكوادر الإماراتية')}</h2>
                <p style={{ fontSize: 14, color: brand.textSecondary, maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>{t('Government-backed incentives to accelerate Emirati participation in the private sector.', 'حوافز حكومية لتسريع مشاركة الإماراتيين في القطاع الخاص.')}</p>
            </div>
            {/* Summary stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                {[
                    { v: t('AED 7.8B', '7.8 مليار د.إ'), l: t('Total Budget', 'الميزانية الإجمالية'), icon: DollarSign, bg: brand.primarySurface, color: brand.primary },
                    { v: '162,100', l: t('Total Beneficiaries', 'إجمالي المستفيدين'), icon: Users, bg: brand.green, color: brand.greenText },
                    { v: '6', l: t('Active Programs', 'برامج نشطة'), icon: Award, bg: brand.blue, color: brand.blueText },
                ].map((s, i) => (
                    <div key={i} style={{ ...card, textAlign: 'center', marginBottom: 0 }}>
                        <s.icon size={22} color={s.color} style={{ marginBottom: 8 }} />
                        <div style={{ fontSize: 24, fontWeight: 700, color: brand.textPrimary }}>{s.v}</div>
                        <div style={{ fontSize: 13, color: brand.textSecondary }}>{s.l}</div>
                    </div>
                ))}
            </div>
            {/* Programs */}
            {nafisPrograms.map((p, i) => (
                <div key={i} style={card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 280 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary }}>{p.name}</h3>
                                <span style={badgeStyle(p.catBg, p.catColor)}>{p.status}</span>
                            </div>
                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.6, marginBottom: 8 }}>{p.desc}</p>
                            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: brand.textSecondary }}>
                                <span><Users size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {p.beneficiaries} {t('beneficiaries', 'مستفيد')}</span>
                                <span><DollarSign size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {p.budget}</span>
                            </div>
                        </div>
                        <button style={{ alignSelf: 'center', padding: '10px 20px', background: brand.primary, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                            {t('Apply Now', 'قدّم الآن')}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );

    /* ── TAB 5: Reports ── */
    const reportsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Emiratization Reports', 'تقارير التوطين')}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                {reportTypes.map((r, i) => (
                    <div key={i} style={card}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: r.catBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <r.icon size={22} color={r.catColor} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary }}>{r.title}</h3>
                                <span style={badgeStyle(r.catBg, r.catColor)}>{r.period}</span>
                            </div>
                        </div>
                        <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.6, marginBottom: 12 }}>{r.desc}</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button style={{ flex: 1, padding: '8px 16px', background: brand.primary, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                <Eye size={14} /> {t('View', 'عرض')}
                            </button>
                            <button style={{ padding: '8px 16px', background: '#F9FAFB', color: brand.textPrimary, border: `1px solid ${brand.border}`, borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Download size={14} /> {t('PDF', 'PDF')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const tabContent = [dashboardTab, companyTab, sectorTab, nafisTab, reportsTab];

    /* ── RENDER ── */
    return (
        <div className="min-h-screen flex flex-col bg-background" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            <HybridGovernmentNavFixed onLanguageToggle={toggleLanguage} currentLanguage={i18n.language as 'en' | 'ar'} />
            <main className="flex-1" style={{ background: '#FAFBFC' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px' }} dir={isRTL ? 'rtl' : 'ltr'}>
                    {/* Hero */}
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: brand.primarySurface, padding: '8px 20px', borderRadius: 20, marginBottom: 16 }}>
                            <Flag size={16} color={brand.primary} /> <span style={{ fontSize: 14, fontWeight: 600, color: brand.primary }}>{t('Emiratization Tracker', 'متابع التوطين')}</span>
                        </div>
                        <h1 style={{ fontSize: 36, fontWeight: 800, color: brand.textPrimary, marginBottom: 8 }}>
                            {t('National Emiratization Dashboard', 'لوحة متابعة التوطين')}
                        </h1>
                        <p style={{ fontSize: 16, color: brand.textSecondary, maxWidth: 640, margin: '0 auto', lineHeight: 1.7 }}>
                            {t('Track UAE Emiratization progress, company compliance, sector performance, and Nafis program impact in real time.',
                                'تابع تقدم التوطين في الإمارات وامتثال الشركات وأداء القطاعات وأثر برامج نافس في الوقت الفعلي.')}
                        </p>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', borderBottom: `1px solid ${brand.border}`, marginBottom: 24, overflowX: 'auto' }}>
                        {tabs.map((label, i) => (
                            <button key={i} onClick={() => setActiveTab(i)} style={tabBtnStyle(activeTab === i)}>{label}</button>
                        ))}
                    </div>

                    {/* Content */}
                    {tabContent[activeTab]}
                </div>
            </main>
        </div>
    );
};

export default EmiratizationTrackerPage;
