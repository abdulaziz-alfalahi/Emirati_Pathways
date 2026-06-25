import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { Button } from '@/components/ui/button';
import {
    Cpu,
    Globe,
    Users,
    BarChart3,
    ArrowRight,
    ExternalLink,
    Building2,
    GraduationCap,
    Shield,
    Handshake,
    Quote,
    ChevronRight,
    Sparkles
} from 'lucide-react';

/* ─── Animated Counter ─── */
const AnimatedCounter: React.FC<{ end: number; suffix?: string; duration?: number }> = ({
    end, suffix = '', duration = 2000
}) => {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated.current) {
                    hasAnimated.current = true;
                    let start = 0;
                    const step = end / (duration / 16);
                    const timer = setInterval(() => {
                        start += step;
                        if (start >= end) {
                            setCount(end);
                            clearInterval(timer);
                        } else {
                            setCount(Math.floor(start));
                        }
                    }, 16);
                }
            },
            { threshold: 0.3 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [end, duration]);

    return (
        <div ref={ref} className="text-4xl font-bold text-teal-700">
            {count.toLocaleString()}{suffix}
        </div>
    );
};

const OurMission: React.FC = () => {
    const { i18n } = useTranslation();
    const { language, toggleLanguage } = useLanguage();
    const navigate = useNavigate();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;

    const pillars = [
        {
            icon: Cpu,
            title: t('AI-Powered Career Intelligence', 'ذكاء اصطناعي للمسار المهني'),
            desc: t('Leveraging cutting-edge AI to match talent with opportunities, predict career trajectories, and deliver personalized guidance.', 'توظيف أحدث تقنيات الذكاء الاصطناعي لمطابقة المواهب مع الفرص والتنبؤ بالمسارات المهنية وتقديم التوجيه المخصص.')
        },
        {
            icon: Globe,
            title: t('Cultural Relevance', 'الملاءمة الثقافية'),
            desc: t('Deeply rooted in Emirati values and the unique socio-economic landscape of the UAE, ensuring locally relevant career paths.', 'متجذرة في القيم الإماراتية والمشهد الاجتماعي والاقتصادي الفريد لدولة الإمارات لضمان مسارات مهنية ملائمة محلياً.')
        },
        {
            icon: Users,
            title: t('Inclusive Ecosystem', 'منظومة شاملة'),
            desc: t('Connecting job seekers, employers, mentors, educators, and government entities in one unified platform.', 'ربط الباحثين عن عمل وأصحاب العمل والمرشدين والمعلمين والجهات الحكومية في منصة موحدة واحدة.')
        },
        {
            icon: BarChart3,
            title: t('Data-Driven Insights', 'رؤى مبنية على البيانات'),
            desc: t('Providing actionable analytics and workforce intelligence to inform policy, drive decisions, and measure impact.', 'تقديم تحليلات عملية وذكاء قوى عاملة لدعم السياسات وتوجيه القرارات وقياس الأثر.')
        },
    ];

    const impactStats = [
        { value: 150, suffix: 'K+', label: t('Users Served', 'مستخدم تم خدمتهم') },
        { value: 45, suffix: 'K', label: t('Jobs Matched', 'وظيفة تم مطابقتها') },
        { value: 92, suffix: '%', label: t('Satisfaction Rate', 'نسبة الرضا') },
        { value: 200, suffix: '+', label: t('Companies Onboarded', 'شركة مسجلة') },
        { value: 12, suffix: '', label: t('Government Partners', 'شريك حكومي') },
    ];

    const partners = [
        { name: t('Dubai Government', 'حكومة دبي'), icon: Building2 },
        { name: t('EHRDC', 'مجلس تنمية الموارد البشرية'), icon: Shield },
        { name: t('MoHRE', 'وزارة الموارد البشرية'), icon: GraduationCap },
        { name: t('Private Sector', 'القطاع الخاص'), icon: Handshake },
    ];

    return (
        <div className={`min-h-screen bg-white ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <HybridGovernmentNavFixed
                showAuthButtons={true}
                currentPage="mission"
                currentLanguage={language}
                onLanguageToggle={toggleLanguage}
            />

            {/* ═══════════════════════════════════════════
                   LEADERSHIP MESSAGE (top of page)
         ═══════════════════════════════════════════ */}
            <section className="bg-slate-50/50 pt-24 pb-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-3">
                            {/* Chairman Portrait */}
                            <div className="bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center p-0">
                                <img
                                    src="/sultan-al-mansoori.jpg"
                                    alt={t('H.E. Eng. Sultan bin Saeed Al Mansoori', 'معالي المهندس سلطان بن سعيد المنصوري')}
                                    className="w-full h-full object-cover object-top"
                                    style={{ minHeight: '280px' }}
                                />
                            </div>

                            {/* Quote */}
                            <div className="md:col-span-2 p-8 md:p-10 flex flex-col justify-center">
                                <Quote className="h-8 w-8 text-teal-200 mb-4" />
                                <blockquote className="text-base text-slate-700 leading-relaxed mb-6 italic">
                                    {t(
                                        '"At EHRDC, we believe that strategic partnerships are the key to realising our goals and nurturing capable national talents who can keep pace with economic transformations, while contributing to strengthening Dubai\'s competitiveness and knowledge-based economy."',
                                        '"في مجلس تنمية الموارد البشرية الإماراتية، نؤمن بأن الشراكات الاستراتيجية هي المفتاح لتحقيق أهدافنا ورعاية الكفاءات الوطنية القادرة على مواكبة التحولات الاقتصادية، مع المساهمة في تعزيز تنافسية دبي واقتصادها القائم على المعرفة."'
                                    )}
                                </blockquote>
                                <div className="border-t border-slate-100 pt-4">
                                    <p className="text-sm font-bold text-slate-900">
                                        {t('H.E. Eng. Sultan bin Saeed Al Mansoori', 'معالي المهندس سلطان بن سعيد المنصوري')}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {t('Chairman, Emirati Human Resources Development Council', 'رئيس مجلس تنمية الموارد البشرية الإماراتية')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
                         HERO SECTION
         ═══════════════════════════════════════════ */}
            <section className="relative overflow-hidden">
                {/* Teal gradient background */}
                <div className="absolute inset-0 bg-gradient-to-b from-teal-50/80 via-teal-50/40 to-white" />
                {/* Subtle geometric pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23006E6D' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />

                <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 text-center">
                    <Badge className="bg-teal-100 text-teal-700 border border-teal-200 text-xs font-medium px-3 py-1 mb-6 inline-flex">
                        <Sparkles className="h-3 w-3" style={{ marginInlineEnd: 6 }} />
                        {t('Dubai Government Initiative', 'مبادرة حكومة دبي')}
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-6">
                        {t('Empowering UAE Nationals', 'تمكين المواطنين الإماراتيين')}
                        <br />
                        <span className="text-teal-700">{t('Through Innovation', 'من خلال الابتكار')}</span>
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
                        {t(
                            'A comprehensive digital platform transforming career development for Emirati nationals through artificial intelligence, cultural relevance, and inclusive collaboration.',
                            'منصة رقمية شاملة تحول التطوير المهني للمواطنين الإماراتيين من خلال الذكاء الاصطناعي والملاءمة الثقافية والتعاون الشامل.'
                        )}
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <Button
                            className="bg-teal-600 hover:bg-teal-700 text-white px-6 h-11 rounded-lg shadow-md"
                            onClick={() => navigate('/auth')}
                        >
                            {t('Get Started', 'ابدأ الآن')} <ArrowRight className="h-4 w-4" style={{ marginInlineStart: 8 }} />
                        </Button>
                        <Button
                            variant="outline"
                            className="border-slate-300 text-slate-700 hover:bg-slate-50 px-6 h-11 rounded-lg"
                            onClick={() => navigate('/')}
                        >
                            {t('Watch Mission Video', 'شاهد فيديو الرسالة')} <ExternalLink className="h-3.5 w-3.5" style={{ marginInlineStart: 8 }} />
                        </Button>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
                    VISION & MISSION CARDS
         ═══════════════════════════════════════════ */}
            <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2 mb-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Vision Card */}
                    <div className="bg-white rounded-xl border border-slate-200 p-8 hover:shadow-lg transition-shadow duration-300">
                        <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center mb-4">
                            <svg className="w-5 h-5 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="3" /><path d="M12 5C5.636 5 2 12 2 12s3.636 7 10 7 10-7 10-7-3.636-7-10-7z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-3">{t('Our Vision', 'رؤيتنا')}</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            {t(
                                'To be the UAE\'s premier digital ecosystem for human capital development, creating a future where every Emirati national has access to world-class career tools, mentorship, and opportunities that align with our nation\'s economic vision.',
                                'أن نكون المنظومة الرقمية الرائدة في الإمارات لتنمية رأس المال البشري، لبناء مستقبل يحظى فيه كل مواطن إماراتي بأدوات مهنية عالمية المستوى وإرشاد وفرص تتماشى مع الرؤية الاقتصادية لوطننا.'
                            )}
                        </p>
                    </div>

                    {/* Mission Card */}
                    <div className="bg-white rounded-xl border border-slate-200 p-8 hover:shadow-lg transition-shadow duration-300">
                        <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center mb-4">
                            <svg className="w-5 h-5 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-3">{t('Our Mission', 'رسالتنا')}</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            {t(
                                'To accelerate Emiratization by empowering UAE nationals with AI-driven career intelligence, forging partnerships between government, education, and the private sector, and creating pathways to sustainable employment and economic growth.',
                                'تسريع التوطين من خلال تمكين المواطنين الإماراتيين بذكاء مهني مدعوم بالذكاء الاصطناعي، وبناء شراكات بين الحكومة والتعليم والقطاع الخاص، وإنشاء مسارات للتوظيف المستدام والنمو الاقتصادي.'
                            )}
                        </p>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
                     STRATEGIC PILLARS
         ═══════════════════════════════════════════ */}
            <section className="bg-slate-50/50 py-16">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                            {t('Our Strategic Pillars', 'ركائزنا الاستراتيجية')}
                        </h2>
                        <p className="text-sm text-slate-500">
                            {t('The core foundations driving our mission to transform careers.', 'الأسس الجوهرية التي تقود مهمتنا لتحويل المسارات المهنية.')}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {pillars.map((pillar, i) => (
                            <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-teal-100 transition-colors">
                                    <pillar.icon className="h-6 w-6 text-teal-600" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 mb-2">{pillar.title}</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">{pillar.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
                      IMPACT NUMBERS
         ═══════════════════════════════════════════ */}
            <section className="py-16">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
                        {impactStats.map((stat, i) => (
                            <div key={i} className="space-y-1">
                                <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>



            {/* ═══════════════════════════════════════════
                   STRATEGIC PARTNERS
         ═══════════════════════════════════════════ */}
            <section className="py-16">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-xl font-bold text-slate-900 mb-8">
                        {t('Strategic Partners', 'الشركاء الاستراتيجيون')}
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {partners.map((partner, i) => (
                            <div key={i} className="flex flex-col items-center gap-3 p-6 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center group-hover:bg-teal-50 transition-colors">
                                    <partner.icon className="h-8 w-8 text-slate-400 group-hover:text-teal-600 transition-colors" />
                                </div>
                                <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700">{partner.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
                        FOOTER
         ═══════════════════════════════════════════ */}
            <footer className="bg-slate-900 text-white py-12">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">E</span>
                            </div>
                            <span className="text-sm font-medium text-slate-300">
                                {t('Emirati Human Development Platform', 'منصة تنمية الموارد البشرية الإماراتية')}
                            </span>
                        </div>
                        <div className="flex items-center gap-6 text-xs text-slate-400">
                            <a href="#" className="hover:text-white transition-colors">{t('Privacy Policy', 'سياسة الخصوصية')}</a>
                            <a href="#" className="hover:text-white transition-colors">{t('Terms of Service', 'شروط الخدمة')}</a>
                            <a href="#" className="hover:text-white transition-colors">{t('Accessibility', 'إمكانية الوصول')}</a>
                        </div>
                    </div>
                    <div className="border-t border-slate-800 mt-6 pt-6 text-center">
                        <p className="text-xs text-slate-500">
                            © 2024 {t('Emirati Human Development Platform. All rights reserved.', 'منصة تنمية الموارد البشرية الإماراتية. جميع الحقوق محفوظة.')}
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

// Need Badge component inline since it's used in hero
const Badge: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
    <span className={`inline-flex items-center rounded-full font-medium ${className}`}>{children}</span>
);

export default OurMission;
