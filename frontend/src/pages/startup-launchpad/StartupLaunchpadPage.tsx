
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import { getStartupPrograms, type StartupProgram } from '@/services/careerServicesAPI';
import AiAssistPanel from '@/components/ai/AiAssistPanel';
import {
    Rocket, Building2, Banknote, Users, BookOpen, ChevronRight, ChevronLeft, Star,
    TrendingUp, CheckCircle, Target, Sparkles, Shield, Award, Heart,
    Lightbulb, MapPin, Calendar, Clock, DollarSign, BarChart3, Globe,
    FileText, Download, ExternalLink, ArrowRight, Zap, Eye, Send, MessageSquare,
    Loader2
} from 'lucide-react';

const brand = {
    primary: '#0D9488', primaryDark: '#0F766E', primarySurface: '#F0FDFA',
    border: '#E5E7EB', textPrimary: '#111827', textSecondary: '#6B7280',
    amber: '#FEF3C7', amberText: '#92400E', green: '#DCFCE7', greenText: '#166534',
    red: '#FEE2E2', redText: '#991B1B', blue: '#DBEAFE', blueText: '#1E40AF',
    purple: '#F3E8FF', purpleText: '#6B21A8', pink: '#FCE7F3', pinkText: '#9D174D',
    orange: '#FFF7ED', orangeText: '#C2410C',
};

/* ── Fallback programs (used when DB is empty) ── */
const FALLBACK_PROGRAMS = [
    { name: 'Khalifa Fund for Enterprise Development', name_ar: 'صندوق خليفة لتطوير المشاريع', description: 'Comprehensive support for Emirati entrepreneurs including financing, training, mentoring, and marketing assistance', description_ar: 'دعم شامل لرواد الأعمال الإماراتيين يشمل التمويل والتدريب والإرشاد والمساعدة التسويقية', location: 'Abu Dhabi', location_ar: 'أبوظبي', type: 'Accelerator', focus: ['All Sectors'], website: 'https://khalifafund.ae', _funding: 'Up to AED 3M', _duration: '12–24 months', _featured: true },
    { name: 'Hub71', name_ar: 'Hub71', description: "Abu Dhabi's global tech ecosystem offering incentive packages, venture capital access, and a community of 200+ startups", description_ar: 'المنظومة التقنية العالمية في أبوظبي تقدم حزم حوافز ووصولاً لرأس المال الجريء ومجتمعاً يضم 200+ شركة ناشئة', location: 'Abu Dhabi', location_ar: 'أبوظبي', type: 'Incubator', focus: ['Technology'], website: 'https://hub71.com', _funding: 'Up to AED 2M incentives', _duration: '12 months', _featured: true },
    { name: 'Dubai SME (Mohammed bin Rashid Establishment)', name_ar: 'مؤسسة محمد بن راشد لتنمية المشاريع', description: 'Support for SMEs in Dubai through business incubation, funding programs, market access, and regulatory assistance', description_ar: 'دعم المشاريع الصغيرة والمتوسطة في دبي من خلال الحضانة والتمويل والوصول للأسواق والمساعدة التنظيمية', location: 'Dubai', location_ar: 'دبي', type: 'Government', focus: ['All Sectors'], website: '#', _funding: 'Up to AED 500K', _duration: '6–18 months', _featured: false },
    { name: 'Sharjah Entrepreneurship Center (Sheraa)', name_ar: 'مركز الشارقة لريادة الأعمال (شراع)', description: 'Startup accelerator and incubator offering mentorship, co-working spaces, and seed funding for early-stage ventures', description_ar: 'مسرّعة ومحتضنة أعمال تقدم الإرشاد ومساحات العمل المشتركة والتمويل الأولي للمشاريع الناشئة', location: 'Sharjah', location_ar: 'الشارقة', type: 'Accelerator', focus: ['Technology', 'Social Enterprise'], website: '#', _funding: 'Up to AED 300K', _duration: '3–6 months', _featured: false },
    { name: 'ADIO Startup Program', name_ar: 'برنامج أديو للشركات الناشئة', description: 'Financial and non-financial incentives for innovative startups to establish and scale in Abu Dhabi', description_ar: 'حوافز مالية وغير مالية للشركات الناشئة المبتكرة للتأسيس والتوسع في أبوظبي', location: 'Abu Dhabi', location_ar: 'أبوظبي', type: 'Government', focus: ['FinTech', 'HealthTech', 'AgriTech'], website: '#', _funding: 'Varies by program', _duration: 'Ongoing', _featured: true },
    { name: 'in5 Innovation Centers', name_ar: 'مراكز in5 للابتكار', description: 'Enabling platform for entrepreneurs through state-of-the-art facilities, mentoring, funding access, and networking in tech, media, and design', description_ar: 'منصة تمكينية لرواد الأعمال من خلال مرافق متطورة وإرشاد ووصول للتمويل والتواصل في التكنولوجيا والإعلام والتصميم', location: 'Dubai', location_ar: 'دبي', type: 'Incubator', focus: ['Tech', 'Media', 'Design'], website: '#', _funding: 'Subsidized workspace + grants', _duration: '12 months renewable', _featured: false },
];

const typeColorMap: Record<string, { bg: string; color: string }> = {
    'Accelerator': { bg: brand.blue, color: brand.blueText },
    'Incubator': { bg: brand.purple, color: brand.purpleText },
    'Government': { bg: brand.green, color: brand.greenText },
    'Fund': { bg: brand.amber, color: brand.amberText },
};

const StartupLaunchpadPage: React.FC = () => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;

    /* ── State ── */
    const [programs, setPrograms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const data = await getStartupPrograms();
                if (data && data.length > 0) {
                    setPrograms(data);
                } else {
                    setPrograms(FALLBACK_PROGRAMS as any[]);
                }
            } catch (err) {
                console.error('Failed to load startup programs:', err);
                setPrograms(FALLBACK_PROGRAMS as any[]);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    /* ── Shared styles ── */
    const card: React.CSSProperties = { background: '#fff', borderRadius: 16, border: `1px solid ${brand.border}`, padding: 24, marginBottom: 16 };
    const badgeStyle = (bg: string, color: string): React.CSSProperties => ({ background: bg, color, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap' as const });
    const renderStars = (r: number) => <span style={{ display: 'inline-flex', gap: 2 }}>{[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill={i <= r ? '#F59E0B' : 'none'} stroke={i <= r ? '#F59E0B' : '#D1D5DB'} />)}</span>;

    /* ── DATA ── */

    const journeyStages = [
        { stage: t('Ideation', 'التفكير'), icon: Lightbulb, color: brand.blue, textColor: brand.blueText, desc: t('Validate your business idea, conduct market research, and define your value proposition', 'تحقق من فكرة مشروعك، أجرِ بحث السوق، وحدد عرض القيمة الخاص بك'), tasks: [{ text: t('Complete Business Idea Canvas', 'أكمل نموذج فكرة المشروع'), done: true }, { text: t('Market Size Research', 'بحث حجم السوق'), done: true }, { text: t('Competitor Analysis', 'تحليل المنافسين'), done: false }, { text: t('Customer Interviews (10+)', 'مقابلات العملاء (10+)'), done: false }] },
        { stage: t('Validation', 'التحقق'), icon: Target, color: brand.amber, textColor: brand.amberText, desc: t('Build your MVP, test with real customers, and refine your business model', 'ابنِ المنتج الأولي، اختبر مع عملاء حقيقيين، وطوّر نموذج عملك'), tasks: [{ text: t('Build MVP', 'بناء المنتج الأولي'), done: false }, { text: t('Beta User Testing', 'اختبار مع المستخدمين'), done: false }, { text: t('Financial Model', 'النموذج المالي'), done: false }, { text: t('Pitch Deck v1', 'العرض التقديمي v1'), done: false }] },
        { stage: t('Launch', 'الإطلاق'), icon: Rocket, color: brand.green, textColor: brand.greenText, desc: t('Launch your product, acquire first customers, and establish operations', 'أطلق منتجك، واكتسب أول العملاء، وأسّس العمليات'), tasks: [{ text: t('Trade License Registration', 'تسجيل الرخصة التجارية'), done: false }, { text: t('Go-to-Market Strategy', 'استراتيجية دخول السوق'), done: false }, { text: t('First 100 Customers', 'أول 100 عميل'), done: false }, { text: t('Seed Funding Round', 'جولة التمويل الأولي'), done: false }] },
        { stage: t('Growth', 'النمو'), icon: TrendingUp, color: brand.purple, textColor: brand.purpleText, desc: t('Scale operations, expand your team, and prepare for next funding round', 'وسّع العمليات، كبّر فريقك، واستعد لجولة التمويل التالية'), tasks: [{ text: t('Hire Key Team Members', 'توظيف أعضاء رئيسيين'), done: false }, { text: t('Series A Preparation', 'التحضير للسلسلة أ'), done: false }, { text: t('Market Expansion Plan', 'خطة التوسع في السوق'), done: false }, { text: t('Strategic Partnerships', 'شراكات استراتيجية'), done: false }] },
    ];

    const funding = [
        { name: t('Khalifa Fund — Micro Enterprise', 'صندوق خليفة — المشاريع الصغيرة'), amount: t('AED 50K – 250K', '50 – 250 ألف د.إ'), type: t('Soft Loan', 'قرض ميسّر'), eligibility: t('UAE Nationals, 21+, business plan required', 'مواطنون إماراتيون، 21+، خطة عمل مطلوبة'), deadline: t('Rolling', 'مستمر'), catBg: brand.green, catColor: brand.greenText },
        { name: t('Khalifa Fund — SME Finance', 'صندوق خليفة — تمويل المشاريع المتوسطة'), amount: t('AED 250K – 3M', '250 ألف – 3 مليون د.إ'), type: t('Soft Loan', 'قرض ميسّر'), eligibility: t('UAE Nationals, existing business, 2+ years', 'مواطنون إماراتيون، مشروع قائم، سنتان+'), deadline: t('Rolling', 'مستمر'), catBg: brand.blue, catColor: brand.blueText },
        { name: t('Hub71 Incentive Package', 'حزمة حوافز Hub71'), amount: t('Up to AED 2M', 'حتى 2 مليون د.إ'), type: t('Incentive / Grant', 'حافز / منحة'), eligibility: t('Tech startups, accepted into Hub71 program', 'شركات تقنية ناشئة، مقبولة في برنامج Hub71'), deadline: t('Quarterly intake', 'قبول ربع سنوي'), catBg: brand.purple, catColor: brand.purpleText },
        { name: t('Dubai Future Accelerators', 'مسرّعات دبي المستقبل'), amount: t('AED 500K – 1M', '500 ألف – 1 مليون د.إ'), type: t('Grant + Pilot Contract', 'منحة + عقد تجريبي'), eligibility: t('Innovative solutions for government challenges', 'حلول مبتكرة لتحديات حكومية'), deadline: t('Mar 2026', 'مارس 2026'), catBg: brand.amber, catColor: brand.amberText },
        { name: t('Sheraa Seed Fund', 'صندوق شراع الأولي'), amount: t('AED 100K – 300K', '100 – 300 ألف د.إ'), type: t('Equity Investment', 'استثمار بالأسهم'), eligibility: t('Early-stage startups, Sheraa alumni', 'شركات ناشئة مبكرة، خريجو شراع'), deadline: t('Ongoing', 'مستمر'), catBg: brand.pink, catColor: brand.pinkText },
        { name: t('Mohammed bin Rashid Innovation Fund', 'صندوق محمد بن راشد للابتكار'), amount: t('AED 500K – 5M', '500 ألف – 5 مليون د.إ'), type: t('Innovation Grant', 'منحة ابتكار'), eligibility: t('UAE-based startups with innovative solutions', 'شركات ناشئة في الإمارات بحلول مبتكرة'), deadline: t('Apr 2026', 'أبريل 2026'), catBg: brand.orange, catColor: brand.orangeText },
    ];

    const mentors = [
        { name: t('Dr. Sara Al Madani', 'د. سارة المدني'), title: t('Serial Entrepreneur & Board Member', 'رائدة أعمال متسلسلة وعضو مجلس إدارة'), expertise: [t('E-commerce', 'التجارة الإلكترونية'), t('Fashion Tech', 'تكنولوجيا الأزياء'), t('Scaling', 'التوسع')], rating: 4.9, sessions: 87, available: true },
        { name: t('Ahmed Al Falasi', 'أحمد الفلاسي'), title: t('Managing Director, Venture Capital', 'مدير عام، رأس المال الجريء'), expertise: [t('FinTech', 'التقنية المالية'), t('Fundraising', 'جمع التمويل'), t('Strategy', 'الاستراتيجية')], rating: 4.8, sessions: 64, available: true },
        { name: t('Fatima Al Jaber', 'فاطمة الجابر'), title: t('CEO, Construction Tech Startup', 'الرئيس التنفيذي، شركة تقنيات البناء'), expertise: [t('PropTech', 'تقنيات العقارات'), t('B2B Sales', 'مبيعات B2B'), t('Operations', 'العمليات')], rating: 4.7, sessions: 42, available: false },
        { name: t('Khalid Al Ameri', 'خالد العامري'), title: t('Content Creator & Social Entrepreneur', 'صانع محتوى ورائد أعمال اجتماعي'), expertise: [t('Media', 'الإعلام'), t('Social Impact', 'الأثر الاجتماعي'), t('Branding', 'بناء العلامة')], rating: 4.9, sessions: 95, available: true },
        { name: t('Noura Al Kaabi', 'نورة الكعبي'), title: t('Investment Advisor & Board Director', 'مستشارة استثمار وعضو مجلس إدارة'), expertise: [t('HealthTech', 'التقنية الصحية'), t('Governance', 'الحوكمة'), t('Investment', 'الاستثمار')], rating: 4.6, sessions: 38, available: true },
    ];

    const resources = [
        { title: t('Business Plan Template (UAE)', 'قالب خطة العمل (الإمارات)'), desc: t('Comprehensive template aligned with UAE government funding requirements', 'قالب شامل متوافق مع متطلبات التمويل الحكومي الإماراتي'), type: t('Template', 'قالب'), icon: FileText, catBg: brand.blue, catColor: brand.blueText },
        { title: t('UAE Trade License Guide', 'دليل الرخصة التجارية الإماراتية'), desc: t('Step-by-step guide for registering your business across all UAE emirates', 'دليل خطوة بخطوة لتسجيل مشروعك في جميع إمارات الدولة'), type: t('Guide', 'دليل'), icon: BookOpen, catBg: brand.green, catColor: brand.greenText },
        { title: t('Pitch Deck Masterclass', 'دورة العرض التقديمي'), desc: t('Video series on crafting investor-ready pitch decks tailored for GCC VCs', 'سلسلة فيديو لإعداد عروض تقديمية جاهزة للمستثمرين في الخليج'), type: t('Course', 'دورة'), icon: Eye, catBg: brand.purple, catColor: brand.purpleText },
        { title: t('Financial Modelling Toolkit', 'أدوات النمذجة المالية'), desc: t('Excel templates for revenue projections, unit economics, and burn rate tracking', 'قوالب Excel لتوقعات الإيرادات واقتصاديات الوحدة وتتبع معدل الإنفاق'), type: t('Toolkit', 'مجموعة أدوات'), icon: BarChart3, catBg: brand.amber, catColor: brand.amberText },
        { title: t('UAE Intellectual Property Guide', 'دليل الملكية الفكرية في الإمارات'), desc: t('How to protect patents, trademarks, and copyrights in the UAE market', 'كيفية حماية براءات الاختراع والعلامات التجارية وحقوق النشر في السوق الإماراتي'), type: t('Guide', 'دليل'), icon: Shield, catBg: brand.red, catColor: brand.redText },
        { title: t('Market Entry: GCC Expansion', 'دخول السوق: التوسع الخليجي'), desc: t('Research report on expanding from UAE to Saudi Arabia, Bahrain, Qatar, and beyond', 'تقرير بحثي حول التوسع من الإمارات إلى السعودية والبحرين وقطر وما بعدها'), type: t('Report', 'تقرير'), icon: Globe, catBg: brand.pink, catColor: brand.pinkText },
    ];

    /* ── Dynamic Stats ── */
    const uniqueLocations = new Set(programs.map(p => p.location || p.location_ar));
    const stats = [
        { value: String(programs.length), label: t('Programs', 'برنامج'), icon: Rocket },
        { value: t('AED 5B+', '5 مليار+ د.إ'), label: t('Funding Available', 'تمويل متاح'), icon: DollarSign },
        { value: String(uniqueLocations.size), label: t('Emirates', 'إمارات'), icon: MapPin },
        { value: String(mentors.length), label: t('Mentors', 'مرشدين'), icon: Users },
    ];

    /* ── TAB 1: Explore Programs (API-driven) ── */
    const programsTab = (
        <div>
            <AiAssistPanel
                feature="startup_guidance"
                title="AI startup guidance"
                titleAr="إرشاد ريادي بالذكاء الاصطناعي"
                getContext={() => ({
                    idea_stage: 'exploring',
                    sector: Array.from(new Set(programs.slice(0, 30).flatMap((p: any) =>
                        Array.isArray(p.focus) ? p.focus : typeof p.focus === 'string' ? [p.focus] : []
                    ))).slice(0, 30),
                    needs: Array.from(new Set(programs.slice(0, 30).map((p: any) => p.type).filter(Boolean))).slice(0, 30),
                })}
                className="mb-6"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary }}>{t('UAE Startup Programs', 'برامج الشركات الناشئة في الإمارات')}</h2>
                <span style={{ fontSize: 13, color: brand.textSecondary }}>{programs.length} {t('programs', 'برنامج')}</span>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto', color: brand.primary }} />
                </div>
            ) : programs.map((p, i) => {
                const typeColors = typeColorMap[p.type || ''] || { bg: brand.primarySurface, color: brand.primary };
                const focusList = Array.isArray(p.focus) ? p.focus : typeof p.focus === 'string' ? [p.focus] : [];
                return (
                    <div key={p.id || i} style={{ ...card, ...(p._featured ? { borderColor: brand.primary, borderWidth: 1.5 } : {}) }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                            <div style={{ flex: 1, minWidth: 250 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                    <span style={{ fontSize: 17, fontWeight: 600, color: brand.textPrimary }}>
                                        {isRTL ? (p.name_ar || p.name) : p.name}
                                    </span>
                                    {p._featured && <span style={badgeStyle(brand.amber, brand.amberText)}>⭐ {t('Top Program', 'برنامج مميّز')}</span>}
                                </div>
                                <div style={{ display: 'flex', gap: 12, fontSize: 13, color: brand.textSecondary, flexWrap: 'wrap', marginBottom: 8 }}>
                                    {p.location && (
                                        <span><MapPin size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> {isRTL ? (p.location_ar || p.location) : p.location}</span>
                                    )}
                                    {p._duration && <span><Clock size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> {p._duration}</span>}
                                    {p.type && <span><Building2 size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> {p.type}</span>}
                                </div>
                                <p style={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.6, marginBottom: 10 }}>
                                    {isRTL ? (p.description_ar || p.description) : (p.description || '')}
                                </p>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {p.type && <span style={badgeStyle(typeColors.bg, typeColors.color)}>{p.type}</span>}
                                    {focusList.map((f: string, j: number) => (
                                        <span key={j} style={badgeStyle(brand.primarySurface, brand.primary)}>{f}</span>
                                    ))}
                                </div>
                            </div>
                            <div style={{ textAlign: isRTL ? 'left' : 'right', minWidth: 130 }}>
                                {p._funding && (
                                    <>
                                        <div style={{ fontSize: 11, color: brand.textSecondary, marginBottom: 4 }}>{t('Funding', 'التمويل')}</div>
                                        <div style={{ fontSize: 16, fontWeight: 700, color: brand.primary, marginBottom: 12 }}>{p._funding}</div>
                                    </>
                                )}
                                <button
                                    onClick={() => p.website && window.open(p.website, '_blank')}
                                    style={{ padding: '10px 20px', background: brand.primary, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                                >
                                    {t('Apply', 'قدّم')} <ExternalLink size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    /* ── TAB 2: My Journey ── */
    const journeyTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>{t('Your Startup Journey', 'رحلتك الريادية')}</h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>{t('Track your progress through each stage of building your startup.', 'تابع تقدمك عبر كل مرحلة من مراحل بناء شركتك الناشئة.')}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32, position: 'relative' }}>
                {journeyStages.map((s, i) => {
                    const completedTasks = s.tasks.filter(t => t.done).length;
                    const progress = Math.round((completedTasks / s.tasks.length) * 100);
                    const isActive = i === 0;
                    return (
                        <div key={i} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                            <div style={{ width: 48, height: 48, borderRadius: '50%', background: isActive ? s.color : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', border: isActive ? `2px solid ${s.textColor}` : `2px solid ${brand.border}` }}>
                                <s.icon size={20} color={isActive ? s.textColor : brand.textSecondary} />
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? s.textColor : brand.textSecondary }}>{s.stage}</div>
                            <div style={{ fontSize: 11, color: brand.textSecondary }}>{progress}%</div>
                            {i < journeyStages.length - 1 && (
                                <div style={{ position: 'absolute', top: 24, right: isRTL ? 'auto' : 0, left: isRTL ? 0 : 'auto', width: '50%', height: 2, background: brand.border, transform: isRTL ? 'translateX(-50%)' : 'translateX(50%)' }} />
                            )}
                        </div>
                    );
                })}
            </div>
            {journeyStages.map((s, i) => (
                <div key={i} style={{ ...card, borderLeft: isRTL ? 'none' : `4px solid ${s.textColor}`, borderRight: isRTL ? `4px solid ${s.textColor}` : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <s.icon size={20} color={s.textColor} />
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary }}>{s.stage}</h3>
                        <span style={badgeStyle(s.color, s.textColor)}>{s.tasks.filter(t => t.done).length}/{s.tasks.length}</span>
                    </div>
                    <p style={{ fontSize: 13, color: brand.textSecondary, marginBottom: 12, lineHeight: 1.6 }}>{s.desc}</p>
                    <div style={{ display: 'grid', gap: 8 }}>
                        {s.tasks.map((task, j) => (
                            <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: task.done ? brand.green : '#F9FAFB', borderRadius: 10, border: `1px solid ${task.done ? brand.greenText + '30' : brand.border}` }}>
                                <CheckCircle size={16} color={task.done ? brand.greenText : brand.border} fill={task.done ? brand.green : 'none'} />
                                <span style={{ fontSize: 13, color: task.done ? brand.greenText : brand.textPrimary, textDecoration: task.done ? 'line-through' : 'none' }}>{task.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

    /* ── TAB 3: Funding ── */
    const fundingTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Funding & Grants', 'التمويل والمنح')}</h2>
            {funding.map((f, i) => (
                <div key={i} style={card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 250 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 6 }}>{f.name}</h3>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                                <span style={badgeStyle(f.catBg, f.catColor)}>{f.type}</span>
                                <span style={{ fontSize: 12, color: brand.textSecondary }}><Calendar size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {t('Deadline', 'الموعد النهائي')}: {f.deadline}</span>
                            </div>
                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.6 }}><strong>{t('Eligibility', 'الأهلية')}:</strong> {f.eligibility}</p>
                        </div>
                        <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
                            <div style={{ fontSize: 11, color: brand.textSecondary, marginBottom: 4 }}>{t('Amount', 'المبلغ')}</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: brand.primary, marginBottom: 8 }}>{f.amount}</div>
                            <button style={{ padding: '8px 16px', background: brand.primary, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{t('Learn More', 'اعرف المزيد')}</button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    /* ── TAB 4: Mentors ── */
    const mentorTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Mentor Network', 'شبكة المرشدين')}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                {mentors.map((m, i) => (
                    <div key={i} style={card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 2 }}>{m.name}</h3>
                                <p style={{ fontSize: 13, color: brand.textSecondary }}>{m.title}</p>
                            </div>
                            <span style={badgeStyle(m.available ? brand.green : brand.red, m.available ? brand.greenText : brand.redText)}>
                                {m.available ? t('Available', 'متاح') : t('Busy', 'مشغول')}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                            {m.expertise.map((e, j) => <span key={j} style={badgeStyle(brand.blue, brand.blueText)}>{e}</span>)}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{renderStars(Math.round(m.rating))} <span style={{ fontSize: 13, fontWeight: 600 }}>{m.rating}</span></div>
                            <span style={{ fontSize: 12, color: brand.textSecondary }}>{m.sessions} {t('sessions', 'جلسة')}</span>
                        </div>
                        <button disabled={!m.available} style={{ width: '100%', padding: '10px 0', background: m.available ? brand.primary : '#E5E7EB', color: m.available ? '#fff' : brand.textSecondary, border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: m.available ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <MessageSquare size={15} /> {t('Book Session', 'احجز جلسة')}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── TAB 5: Resources ── */
    const resourcesTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 16 }}>{t('Startup Resources', 'موارد ريادة الأعمال')}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                {resources.map((r, i) => (
                    <div key={i} style={card}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: r.catBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <r.icon size={22} color={r.catColor} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary }}>{r.title}</h3>
                                <span style={badgeStyle(r.catBg, r.catColor)}>{r.type}</span>
                            </div>
                        </div>
                        <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.6, marginBottom: 12 }}>{r.desc}</p>
                        <button style={{ padding: '8px 16px', background: '#F9FAFB', color: brand.textPrimary, border: `1px solid ${brand.border}`, borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Download size={14} /> {t('Download', 'تحميل')}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tabs ── */
    const tabs = [
        { id: 'programs', label: t('Explore Programs', 'استكشف البرامج'), icon: <Rocket className="h-4 w-4" />, content: programsTab },
        { id: 'journey', label: t('My Journey', 'رحلتي'), icon: <Target className="h-4 w-4" />, content: journeyTab },
        { id: 'funding', label: t('Funding & Grants', 'التمويل والمنح'), icon: <DollarSign className="h-4 w-4" />, content: fundingTab },
        { id: 'mentors', label: t('Mentor Network', 'شبكة المرشدين'), icon: <Users className="h-4 w-4" />, content: mentorTab },
        { id: 'resources', label: t('Resources', 'الموارد'), icon: <BookOpen className="h-4 w-4" />, content: resourcesTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('Startup Launchpad', 'منصة إطلاق المشاريع')}
            description={t(
                'From idea to IPO — access UAE government programs, funding, mentors, and resources to build your dream venture.',
                'من الفكرة إلى الطرح العام — احصل على برامج حكومية إماراتية وتمويل ومرشدين وموارد لبناء مشروعك.'
            )}
            icon={<Rocket className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="programs"
        />
    );
};

export default StartupLaunchpadPage;
