
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import { restClient } from '@/utils/api';
import { careerLifecycleAPI, type CareerStage } from '@/services/intelligenceAPI';
import {
    Banknote, TrendingUp, Calculator, Shield,
    Target, ChevronRight, BookOpen, BarChart3, Users,
    Wallet, Landmark, BadgePercent, GraduationCap, Award,
    CheckCircle, ArrowRight, ArrowLeft, Clock, Loader2
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

/* ── Types ── */
interface BudgetItem {
    category: string; category_ar: string; pct: number; amount: number;
}
interface FinancialData {
    estimated_salary: number;
    matching_benchmark: any;
    budget: BudgetItem[];
    savings_goals: { title: string; title_ar?: string; description?: string; target_date?: string; status?: string; progress: number }[];
    benchmarks: any[];
    skills_count: number;
}

/* ── Fallback ── */
const FALLBACK: FinancialData = {
    estimated_salary: 15000,
    matching_benchmark: null,
    budget: [
        { category: 'Housing', category_ar: 'السكن', pct: 30, amount: 4500 },
        { category: 'Transportation', category_ar: 'المواصلات', pct: 15, amount: 2250 },
        { category: 'Food & Groceries', category_ar: 'الطعام والبقالة', pct: 15, amount: 2250 },
        { category: 'Savings & Investments', category_ar: 'الادخار والاستثمار', pct: 20, amount: 3000 },
        { category: 'Utilities & Bills', category_ar: 'الخدمات والفواتير', pct: 10, amount: 1500 },
        { category: 'Personal & Leisure', category_ar: 'الشخصي والترفيه', pct: 10, amount: 1500 },
    ],
    savings_goals: [],
    benchmarks: [],
    skills_count: 0,
};

const catColorMap: Record<string, { bg: string; textColor: string }> = {
    'Housing': { bg: brand.blue, textColor: brand.blueText },
    'Transportation': { bg: brand.green, textColor: brand.greenText },
    'Food & Groceries': { bg: brand.amber, textColor: brand.amberText },
    'Savings & Investments': { bg: brand.primarySurface, textColor: brand.primary },
    'Utilities & Bills': { bg: brand.purple, textColor: brand.purpleText },
    'Personal & Leisure': { bg: brand.red, textColor: brand.redText },
};

/* ──────────────────────── COMPONENT ──────────────────────── */

const FinancialPlanningPage: React.FC = () => {

    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

    /* ── State ── */
    const [data, setData] = useState<FinancialData>(FALLBACK);
    const [loading, setLoading] = useState(true);
    const [careerStage, setCareerStage] = useState<CareerStage | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await restClient.get('/api/career-services/financial-profile');
                setData(res.data);
            } catch (err) {
                console.error('Failed to load financial profile:', err);
            } finally {
                setLoading(false);
            }
        })();
        // Fetch career stage (non-blocking)
        (async () => {
            try {
                const stage = await careerLifecycleAPI.getStage();
                setCareerStage(stage);
            } catch { /* not logged in — graceful fallback */ }
        })();
    }, []);

    const salary = data.estimated_salary;
    const fmtAED = (n: number) => `AED ${n.toLocaleString()}`;

    /* ──────────────────────── STATIC DATA ──────────────────────── */

    const savingsGoalsFallback = [
        { title: t('Emergency Fund', 'صندوق الطوارئ'), target: 50000, current: 32000, pct: 64, Icon: Shield, desc: t('6 months of living expenses', '6 أشهر من نفقات المعيشة') },
        { title: t('Home Down Payment', 'دفعة أولى للمنزل'), target: 200000, current: 85000, pct: 43, Icon: Landmark, desc: t('First property in the UAE', 'أول عقار في الإمارات') },
        { title: t('Investment Portfolio', 'المحفظة الاستثمارية'), target: 100000, current: 47000, pct: 47, Icon: TrendingUp, desc: t('Long-term wealth building', 'بناء الثروة طويل الأمد') },
        { title: t('Education Fund', 'صندوق التعليم'), target: 75000, current: 28000, pct: 37, Icon: GraduationCap, desc: t('Postgraduate studies or certifications', 'دراسات عليا أو شهادات مهنية') },
    ];

    const investmentOptions = [
        { title: t('UAE Equity Funds', 'صناديق أسهم الإمارات'), risk: t('Moderate', 'متوسط'), returns: '8–12%', min: t('AED 5,000', '5,000 د.إ'), desc: t('Diversified exposure to UAE stock market', 'تعرض متنوع لسوق الأسهم الإماراتية'), catBg: brand.blue, catColor: brand.blueText },
        { title: t('National Bonds', 'السندات الوطنية'), risk: t('Low', 'منخفض'), returns: '3–5%', min: t('AED 1,000', '1,000 د.إ'), desc: t('Government-backed savings with Sharia compliance', 'ادخار مدعوم حكومياً ومتوافق مع الشريعة'), catBg: brand.green, catColor: brand.greenText },
        { title: t('REIT (Real Estate)', 'صناديق العقارات (REIT)'), risk: t('Moderate', 'متوسط'), returns: '6–9%', min: t('AED 10,000', '10,000 د.إ'), desc: t('Property-backed income through listed REITs', 'دخل مدعوم بالعقارات عبر صناديق REIT المدرجة'), catBg: brand.amber, catColor: brand.amberText },
        { title: t('Sukuk (Islamic Bonds)', 'الصكوك (سندات إسلامية)'), risk: t('Low', 'منخفض'), returns: '4–6%', min: t('AED 5,000', '5,000 د.إ'), desc: t('Fixed-income instruments compliant with Islamic principles', 'أدوات دخل ثابت متوافقة مع المبادئ الإسلامية'), catBg: brand.purple, catColor: brand.purpleText },
        { title: t('Gold Savings Plan', 'خطة ادخار الذهب'), risk: t('Low-Moderate', 'منخفض-متوسط'), returns: '5–8%', min: t('AED 500', '500 د.إ'), desc: t('Physical gold accumulation through monthly purchases', 'تراكم الذهب الفعلي من خلال مشتريات شهرية'), catBg: brand.primarySurface, catColor: brand.primary },
        { title: t('Venture Capital', 'رأس المال المغامر'), risk: t('High', 'مرتفع'), returns: '15–25%', min: t('AED 50,000', '50,000 د.إ'), desc: t('Early-stage startup investments in UAE ecosystem', 'استثمارات في شركات ناشئة بالمنظومة الإماراتية'), catBg: brand.red, catColor: brand.redText },
    ];

    const govBenefits = [
        { title: t('GPSSA Pension', 'معاش الهيئة العامة للمعاشات'), desc: t('Government pension scheme for UAE nationals in the public sector', 'نظام المعاشات الحكومي للمواطنين الإماراتيين في القطاع العام'), Icon: Shield, status: t('Eligible', 'مؤهل') },
        { title: t('Housing Allowance', 'بدل السكن'), desc: t('Up to AED 800,000 housing loan for eligible nationals', 'قرض سكني يصل إلى 800,000 د.إ للمواطنين المؤهلين'), Icon: Landmark, status: t('Apply Now', 'قدّم الآن') },
        { title: t('Marriage Grant', 'منحة الزواج'), desc: t('AED 70,000 grant for UAE national marriages', 'منحة 70,000 د.إ لزواج المواطنين الإماراتيين'), Icon: Users, status: t('Check Status', 'تحقق من الحالة') },
        { title: t('Social Insurance (SIAL)', 'التأمين الاجتماعي (SIAL)'), desc: t('Unemployment insurance for private sector workers', 'تأمين ضد البطالة لموظفي القطاع الخاص'), Icon: BadgePercent, status: t('Active', 'نشط') },
        { title: t('Education Sponsorship', 'الرعاية التعليمية'), desc: t('Full scholarship programs for higher education abroad', 'برامج منح دراسية كاملة للتعليم العالي في الخارج'), Icon: GraduationCap, status: t('Eligible', 'مؤهل') },
        { title: t('Business Start-up Fund', 'صندوق تأسيس الأعمال'), desc: t('Khalifa Fund and SME support for entrepreneurial nationals', 'صندوق خليفة ودعم المشاريع الصغيرة والمتوسطة لرواد الأعمال المواطنين'), Icon: Award, status: t('Apply Now', 'قدّم الآن') },
    ];

    const resources = [
        { title: t('Salary Calculator', 'حاسبة الرواتب'), desc: t('Calculate take-home pay, end-of-service, and gratuity', 'احسب الراتب الصافي ومكافأة نهاية الخدمة'), Icon: Calculator, action: t('Calculate', 'احسب') },
        { title: t('Budget Planner', 'مخطط الميزانية'), desc: t('Create a personalized monthly budget plan', 'أنشئ خطة ميزانية شهرية مخصصة'), Icon: Wallet, action: t('Plan Budget', 'خطّط الميزانية') },
        { title: t('Loan Comparator', 'مقارنة القروض'), desc: t('Compare personal and home loan rates across UAE banks', 'قارن أسعار القروض الشخصية والعقارية في بنوك الإمارات'), Icon: BarChart3, action: t('Compare', 'قارن') },
        { title: t('Financial Literacy', 'الثقافة المالية'), desc: t('Learn fundamental financial concepts and strategies', 'تعلّم المفاهيم والاستراتيجيات المالية الأساسية'), Icon: BookOpen, action: t('Start Learning', 'ابدأ التعلم') },
        { title: t('Tax Guide', 'دليل الضرائب'), desc: t('Understand UAE corporate tax and international obligations', 'افهم ضريبة الشركات في الإمارات والالتزامات الدولية'), Icon: Banknote, action: t('Read Guide', 'اقرأ الدليل') },
        { title: t('Retirement Planner', 'مخطط التقاعد'), desc: t('Plan your retirement timeline and savings targets', 'خطّط لجدولك الزمني للتقاعد وأهداف الادخار'), Icon: Target, action: t('Plan Retirement', 'خطّط للتقاعد') },
    ];

    const stats = [
        { value: `AED ${Math.round(salary / 1000)}K`, label: t('Est. Monthly Salary', 'الراتب الشهري المقدّر'), icon: Banknote },
        { value: '20%', label: t('Rec. Savings Rate', 'نسبة الادخار الموصى بها'), icon: Banknote },
        { value: String(data.benchmarks.length || '6+'), label: t('Salary Benchmarks', 'معايير الرواتب'), icon: TrendingUp },
        { value: '6', label: t('Gov. Benefits', 'المزايا الحكومية'), icon: Shield },
    ];

    /* ── Tab 1: Budget & Planning ── */
    const budgetTab = (
        <div>
            {/* Career Stage Context */}
            {careerStage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: brand.primarySurface, border: `1px solid ${brand.primary}22`, borderRadius: 12, marginBottom: 20 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: brand.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUp style={{ width: 24, height: 24, color: '#fff' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>
                            {t('Your Career Stage:', 'مرحلتك المهنية:')} {isRTL ? careerStage.stage_label_ar : careerStage.stage_label}
                        </div>
                        <div style={{ fontSize: 12, color: brand.textSecondary }}>
                            {t(`${careerStage.milestones_completed}/${careerStage.total_milestones} milestones completed`, `${careerStage.milestones_completed}/${careerStage.total_milestones} إنجازات مكتملة`)}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: brand.primary }}>{careerStage.progress_pct}%</div>
                        <div style={{ fontSize: 11, color: brand.textSecondary }}>{t('Progress', 'التقدم')}</div>
                    </div>
                </div>
            )}

            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Monthly Budget Breakdown', 'تفصيل الميزانية الشهرية')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    `Recommended allocation based on ${fmtAED(salary)} estimated monthly salary — adjust to fit your situation.`,
                    `توزيع موصى به بناءً على راتب شهري مقدّر ${salary.toLocaleString()} د.إ — عدّله ليناسب وضعك.`
                )}
            </p>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto', color: brand.primary }} />
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 28 }}>
                    {data.budget.map((cat, i) => {
                        const colors = catColorMap[cat.category] || { bg: '#F3F4F6', textColor: brand.textSecondary };
                        return (
                            <div
                                key={i}
                                style={{
                                    background: '#fff', borderRadius: 16, border: `1px solid ${brand.border}`,
                                    padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                    transition: 'border-color 150ms, box-shadow 150ms',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = brand.primary; e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,148,136,0.1)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = brand.border; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <h3 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>
                                        {isRTL ? cat.category_ar : cat.category}
                                    </h3>
                                    <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: colors.bg, color: colors.textColor }}>{cat.pct}%</span>
                                </div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: brand.textPrimary, marginBottom: 8 }}>
                                    {isRTL ? `${cat.amount.toLocaleString()} د.إ` : fmtAED(cat.amount)}
                                </div>
                                <div style={{ width: '100%', height: 6, borderRadius: 3, background: '#F3F4F6' }}>
                                    <div style={{ width: `${cat.pct}%`, height: 6, borderRadius: 3, background: brand.primary, transition: 'width 300ms' }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Savings Goals (from career plans or fallback) */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Savings Goals', 'أهداف الادخار')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {(data.savings_goals.length > 0 ? data.savings_goals.map((g, i) => ({
                    title: isRTL && g.title_ar ? g.title_ar : g.title,
                    Icon: [Shield, Landmark, TrendingUp, GraduationCap][i % 4],
                    desc: g.description || g.title,
                    pct: g.progress,
                    target: g.target_date || t('Ongoing', 'مستمر'),
                    current: `${g.progress}%`,
                })) : savingsGoalsFallback.map(g => ({
                    title: g.title,
                    Icon: g.Icon,
                    desc: g.desc,
                    pct: g.pct,
                    target: fmtAED(g.target),
                    current: fmtAED(g.current),
                }))).map((goal, i) => (
                    <div
                        key={i}
                        style={{
                            background: '#fff', borderRadius: 16, border: `1px solid ${brand.border}`,
                            overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            transition: 'border-color 150ms, box-shadow 150ms',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = brand.primary; e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,148,136,0.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = brand.border; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
                    >
                        <div style={{ height: 4, background: brand.primary }} />
                        <div style={{ padding: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: brand.primarySurface, color: brand.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <goal.Icon style={{ width: 20, height: 20 }} />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{goal.title}</h4>
                                    <p style={{ fontSize: 12, color: brand.textSecondary, margin: '2px 0 0' }}>{goal.desc}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: brand.textSecondary, marginBottom: 8 }}>
                                <span>{goal.current} {t('progress', 'تقدّم')}</span>
                                <span>{t('Target:', 'الهدف:')} {goal.target}</span>
                            </div>
                            <div style={{ width: '100%', height: 8, borderRadius: 4, background: '#F3F4F6' }}>
                                <div style={{ width: `${Math.min(goal.pct, 100)}%`, height: 8, borderRadius: 4, background: brand.primary, transition: 'width 500ms' }} />
                            </div>
                            <div style={{ textAlign: isRTL ? 'left' : 'right', fontSize: 12, fontWeight: 600, color: brand.primary, marginTop: 4 }}>{goal.pct}%</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: Investment Options ── */
    const investTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Investment Options in the UAE', 'خيارات الاستثمار في الإمارات')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Explore Sharia-compliant and conventional investment vehicles available to UAE residents.',
                    'استكشف أدوات الاستثمار المتوافقة مع الشريعة والتقليدية المتاحة للمقيمين في الإمارات.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                {investmentOptions.map((opt, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 16, border: `1px solid ${brand.border}`, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'border-color 150ms, box-shadow 150ms' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = brand.primary; e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,148,136,0.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = brand.border; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}>
                        <div style={{ height: 4, background: brand.primary }} />
                        <div style={{ padding: 22 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{opt.title}</h3>
                                <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: opt.catBg, color: opt.catColor }}>{opt.risk}</span>
                            </div>
                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, marginBottom: 16 }}>{opt.desc}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                                <div style={{ padding: '10px 12px', borderRadius: 10, background: brand.green, textAlign: 'center' }}>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: brand.greenText }}>{opt.returns}</div>
                                    <div style={{ fontSize: 11, color: brand.textSecondary }}>{t('Annual Returns', 'العوائد السنوية')}</div>
                                </div>
                                <div style={{ padding: '10px 12px', borderRadius: 10, background: brand.blue, textAlign: 'center' }}>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: brand.blueText }}>{opt.min}</div>
                                    <div style={{ fontSize: 11, color: brand.textSecondary }}>{t('Min. Investment', 'الحد الأدنى')}</div>
                                </div>
                            </div>
                            <button style={{ width: '100%', padding: '10px 0', borderRadius: 12, background: brand.primary, color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'background 150ms', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                onMouseEnter={e => e.currentTarget.style.background = brand.primaryDark}
                                onMouseLeave={e => e.currentTarget.style.background = brand.primary}>
                                {t('Learn More', 'اعرف المزيد')} <ArrowIcon style={{ width: 14, height: 14 }} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Salary Benchmarks from API */}
            {data.benchmarks.length > 0 && (
                <div style={{ marginTop: 28 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>
                        {t('UAE Salary Benchmarks', 'معايير الرواتب في الإمارات')}
                    </h3>
                    <p style={{ fontSize: 13, color: brand.textSecondary, marginBottom: 16, lineHeight: 1.6 }}>
                        {t('Real market data to help you negotiate and plan your financial future.', 'بيانات سوق حقيقية لمساعدتك في التفاوض والتخطيط لمستقبلك المالي.')}
                    </p>
                    <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${brand.border}`, fontSize: 12, fontWeight: 600, color: brand.textSecondary }}>
                            <span>{t('Role', 'الدور')}</span>
                            <span>{t('Level', 'المستوى')}</span>
                            <span>{t('Min', 'الحد الأدنى')}</span>
                            <span>{t('Median', 'المتوسط')}</span>
                            <span>{t('Max', 'الحد الأعلى')}</span>
                        </div>
                        {data.benchmarks.map((b: any, i: number) => (
                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', gap: 8, padding: '12px 16px', borderBottom: i < data.benchmarks.length - 1 ? `1px solid ${brand.border}` : 'none', fontSize: 13, alignItems: 'center' }}>
                                <span style={{ fontWeight: 500, color: brand.textPrimary }}>{isRTL ? (b.role_title_ar || b.role_title) : b.role_title}</span>
                                <span style={{ background: b.experience_level === 'senior' ? brand.purple : b.experience_level === 'mid' ? brand.blue : brand.green, color: b.experience_level === 'senior' ? brand.purpleText : b.experience_level === 'mid' ? brand.blueText : brand.greenText, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, width: 'fit-content' }}>{b.experience_level}</span>
                                <span style={{ color: brand.textSecondary }}>{b.min_salary?.toLocaleString()} {b.currency}</span>
                                <span style={{ fontWeight: 600, color: brand.primary }}>{b.median_salary?.toLocaleString()} {b.currency}</span>
                                <span style={{ color: brand.textSecondary }}>{b.max_salary?.toLocaleString()} {b.currency}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    /* ── Tab 3: Government Benefits ── */
    const benefitsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Government Benefits for UAE Nationals', 'المزايا الحكومية للمواطنين الإماراتيين')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Financial programs, grants, and entitlements available to Emirati citizens.',
                    'البرامج المالية والمنح والاستحقاقات المتاحة للمواطنين الإماراتيين.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                {govBenefits.map((ben, i) => {
                    const isActive = ben.status === t('Active', 'نشط') || ben.status === t('Eligible', 'مؤهل');
                    return (
                        <div key={i} style={{ background: '#fff', borderRadius: 16, border: `1px solid ${brand.border}`, padding: 22, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'border-color 150ms, box-shadow 150ms' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = brand.primary; e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,148,136,0.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = brand.border; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: brand.primarySurface, color: brand.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <ben.Icon style={{ width: 22, height: 22 }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{ben.title}</h3>
                                        <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: isActive ? brand.green : brand.blue, color: isActive ? brand.greenText : brand.blueText }}>{ben.status}</span>
                                    </div>
                                    <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{ben.desc}</p>
                                </div>
                            </div>
                            <button style={{ width: '100%', padding: '10px 0', borderRadius: 12, background: '#fff', color: brand.primary, fontSize: 14, fontWeight: 600, border: `1px solid ${brand.primary}`, cursor: 'pointer', transition: 'all 150ms' }}
                                onMouseEnter={e => { e.currentTarget.style.background = brand.primarySurface; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
                                {t('View Details', 'عرض التفاصيل')}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    /* ── Tab 4: Tools & Resources ── */
    const toolsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Financial Tools & Resources', 'الأدوات والموارد المالية')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Calculators, planners, and guides to help you make informed financial decisions.',
                    'حاسبات ومخططات وأدلة لمساعدتك في اتخاذ قرارات مالية مدروسة.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                {resources.map((r, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 16, border: `1px solid ${brand.border}`, padding: 22, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'border-color 150ms, box-shadow 150ms' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = brand.primary; e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,148,136,0.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = brand.border; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, marginBottom: 14, background: brand.primarySurface, color: brand.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <r.Icon style={{ width: 24, height: 24 }} />
                        </div>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 6 }}>{r.title}</h3>
                        <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, marginBottom: 16 }}>{r.desc}</p>
                        <button style={{ width: '100%', padding: '10px 0', borderRadius: 12, background: brand.primary, color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'background 150ms' }}
                            onMouseEnter={e => e.currentTarget.style.background = brand.primaryDark}
                            onMouseLeave={e => e.currentTarget.style.background = brand.primary}>
                            {r.action}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    const tabs = [
        { id: 'budget', label: t('Budget & Savings', 'الميزانية والادخار'), icon: <Banknote className="h-4 w-4" />, content: budgetTab },
        { id: 'invest', label: t('Investments', 'الاستثمارات'), icon: <TrendingUp className="h-4 w-4" />, content: investTab },
        { id: 'benefits', label: t('Gov. Benefits', 'المزايا الحكومية'), icon: <Shield className="h-4 w-4" />, content: benefitsTab },
        { id: 'tools', label: t('Tools & Resources', 'الأدوات والموارد'), icon: <Calculator className="h-4 w-4" />, content: toolsTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('Financial Planning', 'التخطيط المالي')}
            description={t(
                'Comprehensive financial wellness and planning tools — budgeting, investments, government benefits, and career-aligned financial growth.',
                'أدوات شاملة للتخطيط المالي والعافية المالية — الميزانية والاستثمارات والمزايا الحكومية والنمو المالي المتوافق مع المسار المهني.'
            )}
            icon={<Banknote className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="budget"
            actionButtonText={t('Start Planning', 'ابدأ التخطيط')}
        />
    );
};

export default FinancialPlanningPage;
