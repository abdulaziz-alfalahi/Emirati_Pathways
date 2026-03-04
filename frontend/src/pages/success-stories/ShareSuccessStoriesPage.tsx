
import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    Star, Users, Briefcase, TrendingUp, Award, Building,
    ArrowRight, ArrowLeft, CheckCircle, Globe, Rocket, Heart,
    Quote, MapPin, ExternalLink, Calendar
} from 'lucide-react';

// Brand tokens
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
    blue: '#DBEAFE',
    blueText: '#1E40AF',
    purple: '#F3E8FF',
    purpleText: '#6B21A8',
};

/* ──────────────────────── COMPONENT ──────────────────────── */

const ShareSuccessStoriesPage: React.FC = () => {

    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

    /* ──────────────────────── DATA ──────────────────────── */

    const successStories = [
        {
            name: t('H.E. Sarah Al Amiri', 'معالي سارة الأميري'),
            role: t('Minister of State for Public Education & Advanced Technology', 'وزيرة دولة للتعليم العام والتكنولوجيا المتقدمة'),
            prevRole: t('Deputy Project Manager, Emirates Mars Mission (Hope Probe)', 'نائبة مدير مشروع الإمارات لاستكشاف المريخ (مسبار الأمل)'),
            company: t('Mohammed bin Rashid Space Centre → UAE Government', 'مركز محمد بن راشد للفضاء ← حكومة الإمارات'),
            sector: t('Space & Technology', 'الفضاء والتكنولوجيا'),
            location: t('Abu Dhabi', 'أبوظبي'),
            avatar: '🚀',
            theme: { bg: '#EFF6FF', accent: '#2563EB', light: '#DBEAFE' },
            story: t(
                "Sarah Al Amiri started as an engineer at the Mohammed bin Rashid Space Centre, rising to lead the science team for the Hope Probe — the UAE's Mars mission. At just 34, she became one of the youngest ministers in the world, championing STEM education and advanced technology for the next generation of Emiratis.",
                'بدأت سارة الأميري كمهندسة في مركز محمد بن راشد للفضاء، لترتقي وتقود الفريق العلمي لمسبار الأمل — مهمة الإمارات إلى المريخ. في عمر 34 عاماً فقط، أصبحت من أصغر الوزراء في العالم، مناصرة لتعليم العلوم والتكنولوجيا المتقدمة للجيل القادم من الإماراتيين.'
            ),
            highlights: [t('Led science team for Mars Hope Probe', 'قادت الفريق العلمي لمسبار الأمل'), t('Youngest minister appointed at 34', 'أصغر وزيرة عُيّنت في سن 34'), t('Forbes 100 Most Powerful Women', 'فوربس أقوى 100 امرأة')],
            quote: t('"We wanted to send a message that an Arab country can reach Mars, and young Emiratis can lead the way."', '"أردنا إرسال رسالة بأن دولة عربية يمكنها الوصول إلى المريخ، وأن الشباب الإماراتي يمكنه قيادة الطريق."'),
        },
        {
            name: t('Mohamed Alabbar', 'محمد العبار'),
            role: t('Founder & Managing Director', 'المؤسس والعضو المنتدب'),
            prevRole: t('Former Director General, Dubai Department of Economic Development', 'المدير العام السابق لدائرة التنمية الاقتصادية في دبي'),
            company: t('Emaar Properties', 'إعمار العقارية'),
            sector: t('Real Estate & Retail', 'العقارات والتجزئة'),
            location: t('Dubai', 'دبي'),
            avatar: '🏗️',
            theme: { bg: '#FFF7ED', accent: '#EA580C', light: '#FFEDD5' },
            story: t(
                "Mohamed Alabbar built Emaar Properties into one of the world's largest real estate developers, creating iconic landmarks including the Burj Khalifa and The Dubai Mall. He went on to launch Noon.com — the Middle East's homegrown e-commerce platform to compete with Amazon. His vision transformed Dubai's skyline and retail landscape.",
                'بنى محمد العبار إعمار العقارية لتصبح واحدة من أكبر شركات التطوير العقاري في العالم، مبتكراً معالم بارزة تشمل برج خليفة ودبي مول. أطلق لاحقاً Noon.com — منصة التجارة الإلكترونية المحلية في الشرق الأوسط لمنافسة أمازون. حوّلت رؤيته أفق دبي ومشهد التجزئة.'
            ),
            highlights: [t("Built Burj Khalifa — world's tallest building", 'بنى برج خليفة — أطول مبنى في العالم'), t("Created The Dubai Mall — world's most visited", 'أنشأ دبي مول — الأكثر زيارة في العالم'), t('Launched Noon.com — regional e-commerce leader', 'أطلق Noon.com — رائد التجارة الإلكترونية الإقليمي')],
            quote: t('"Think big. Start small. But most of all, start."', '"فكّر بشكل كبير. ابدأ صغيراً. لكن الأهم، ابدأ."'),
        },
        {
            name: t('Raja Al Mazrouei', 'رجاء المزروعي'),
            role: t('Executive Vice President', 'نائبة الرئيس التنفيذي'),
            prevRole: t('FinTech Hive Director', 'مديرة FinTech Hive'),
            company: t('DIFC (Dubai International Financial Centre)', 'مركز دبي المالي العالمي'),
            sector: t('FinTech & Financial Services', 'التكنولوجيا المالية والخدمات المالية'),
            location: t('Dubai', 'دبي'),
            avatar: '💳',
            theme: { bg: '#F0FDF4', accent: '#16A34A', light: '#DCFCE7' },
            story: t(
                "Raja Al Mazrouei pioneered the FinTech Hive at DIFC — the first and largest financial technology accelerator in the Middle East. Under her leadership, it became a launchpad for 200+ startups and attracted global partnerships. She was named one of Forbes' Most Powerful Arab Women in Business.",
                'رائدة FinTech Hive في مركز دبي المالي العالمي — أول وأكبر مسرّعة للتكنولوجيا المالية في الشرق الأوسط. تحت قيادتها أصبحت منصة إطلاق لأكثر من 200 شركة ناشئة واستقطبت شراكات عالمية. اختيرت ضمن أقوى سيدات الأعمال العربيات في فوربس.'
            ),
            highlights: [t("Built MENA's first FinTech accelerator", 'بنت أول مسرّعة تكنولوجيا مالية في المنطقة'), t('Supported 200+ startup launches', 'دعمت إطلاق أكثر من 200 شركة ناشئة'), t('Forbes Most Powerful Arab Women in Business', 'فوربس أقوى سيدات الأعمال العربيات')],
            quote: t('"FinTech is not about replacing banks — it\'s about making finance accessible to everyone."', '"التكنولوجيا المالية لا تتعلق باستبدال البنوك — بل بجعل التمويل متاحاً للجميع."'),
        },
        {
            name: t('Khalaf Al Habtoor', 'خلف الحبتور'),
            role: t('Founding Chairman', 'الرئيس المؤسس'),
            prevRole: t('Started as a contractor in the 1970s', 'بدأ كمقاول في السبعينيات'),
            company: t('Al Habtoor Group', 'مجموعة الحبتور'),
            sector: t('Hospitality, Automotive & Construction', 'الضيافة والسيارات والبناء'),
            location: t('Dubai', 'دبي'),
            avatar: '🏨',
            theme: { bg: '#FAF5FF', accent: '#9333EA', light: '#F3E8FF' },
            story: t(
                "Starting with a small contracting business in the 1970s, Khalaf Al Habtoor built one of the UAE's largest conglomerates spanning luxury hotels, automotive dealerships, and real estate. The Al Habtoor Group now operates 12 luxury hotels, is a major Mitsubishi distributor, and employs over 25,000 people. A true rags-to-riches Emirati story.",
                'بدأ بعمل مقاولات صغير في السبعينيات، وبنى خلف الحبتور واحدة من أكبر التكتلات في الإمارات تشمل الفنادق الفاخرة ووكالات السيارات والعقارات. تدير مجموعة الحبتور الآن 12 فندقاً فاخراً وتوزع ميتسوبيشي وتوظف أكثر من 25,000 شخص. قصة نجاح إماراتية حقيقية.'
            ),
            highlights: [t('Built conglomerate from a single contracting firm', 'بنى تكتلاً من شركة مقاولات واحدة'), t('12 luxury hotels worldwide', '12 فندقاً فاخراً حول العالم'), t('Over 25,000 employees across sectors', 'أكثر من 25,000 موظف في قطاعات متعددة')],
            quote: t('"I started with nothing but a dream and a determination to build something lasting for the UAE."', '"بدأت بلا شيء سوى حلم وعزيمة لبناء شيء دائم للإمارات."'),
        },
        {
            name: t('Hussain Sajwani', 'حسين سجواني'),
            role: t('Founder & Chairman', 'المؤسس والرئيس'),
            prevRole: t('Started in catering & food services in the 1980s', 'بدأ في خدمات التموين والطعام في الثمانينيات'),
            company: t('DAMAC Properties', 'داماك العقارية'),
            sector: t('Real Estate & Luxury Development', 'العقارات والتطوير الفاخر'),
            location: t('Dubai', 'دبي'),
            avatar: '🏢',
            theme: { bg: '#FEF2F2', accent: '#DC2626', light: '#FEE2E2' },
            story: t(
                "Hussain Sajwani started with a small catering business before founding DAMAC Properties in 2002 — now one of the largest private luxury real estate developers in the Middle East with projects in 10+ countries. Forbes estimates his net worth at over $4 billion, making him one of the wealthiest self-made Emiratis. DAMAC has delivered 43,000+ homes and built iconic branded residences with Versace, Fendi, and Trump.",
                'بدأ حسين سجواني بعمل تموين صغير قبل تأسيس داماك العقارية في 2002 — الآن من أكبر شركات التطوير العقاري الفاخر الخاص في الشرق الأوسط بمشاريع في أكثر من 10 دول. تقدر فوربس ثروته بأكثر من 4 مليارات دولار. سلّمت داماك أكثر من 43,000 منزل وبنت مساكن فاخرة بعلامات فيرساتشي وفندي وترامب.'
            ),
            highlights: [t('Built DAMAC into a $4B+ real estate empire', 'بنى داماك إلى إمبراطورية عقارية بقيمة 4 مليارات دولار+'), t('43,000+ luxury homes delivered across 10+ countries', 'أكثر من 43,000 منزل فاخر في أكثر من 10 دول'), t('Partnered with Versace, Fendi, and Trump for branded residences', 'شراكة مع فيرساتشي وفندي وترامب للمساكن الفاخرة')],
            quote: t('"I started from zero. Every dirham I made, I reinvested. That\'s how you build something that lasts."', '"بدأت من الصفر. كل درهم ربحته أعدت استثماره. هكذا تبني شيئاً يدوم."'),
        },
        {
            name: t('Abdulla bin Sulayem', 'عبدالله بن سليم'),
            role: t('Executive Chairman', 'الرئيس التنفيذي'),
            prevRole: t('Former Director General, DMCC', 'المدير العام السابق لمركز دبي للسلع المتعددة'),
            company: t('DMCC (Dubai Multi Commodities Centre)', 'مركز دبي للسلع المتعددة'),
            sector: t('Commodities & Free Zones', 'السلع والمناطق الحرة'),
            location: t('Dubai', 'دبي'),
            avatar: '💎',
            theme: { bg: '#FFFBEB', accent: '#D97706', light: '#FEF3C7' },
            story: t(
                "Abdulla bin Sulayem transformed DMCC from a small government initiative into the world's #1 Free Zone — six years running. Under his leadership, DMCC attracted 22,000+ companies from 170 nations and became the commercial backbone of Dubai's trade economy. He proved that Emiratis can build world-class business infrastructure.",
                'حوّل عبدالله بن سليم مركز دبي للسلع المتعددة من مبادرة حكومية صغيرة إلى المنطقة الحرة رقم 1 في العالم — لست سنوات متتالية. استقطب تحت قيادته أكثر من 22,000 شركة من 170 دولة وأصبح العمود الفقري التجاري لاقتصاد دبي التجاري.'
            ),
            highlights: [t("Built world's #1 Free Zone (6 consecutive years)", 'بنى المنطقة الحرة الأولى عالمياً (6 سنوات متتالية)'), t('22,000+ registered companies', 'أكثر من 22,000 شركة مسجلة'), t('Attracts businesses from 170 nations', 'يستقطب أعمالاً من 170 دولة')],
            quote: t('"Free zones are not just about tax benefits — they\'re about creating ecosystems where businesses flourish."', '"المناطق الحرة ليست فقط عن المزايا الضريبية — بل عن خلق بيئات تزدهر فيها الأعمال."'),
        },
        {
            name: t('Noura Al Kaabi', 'نورة الكعبي'),
            role: t('Former Minister of Culture & Youth', 'وزيرة الثقافة والشباب السابقة'),
            prevRole: t('CEO, twofour54 (Abu Dhabi Media Zone)', 'الرئيسة التنفيذية لـ twofour54'),
            company: t('twofour54 → UAE Government', 'twofour54 ← حكومة الإمارات'),
            sector: t('Media & Creative Industries', 'الإعلام والصناعات الإبداعية'),
            location: t('Abu Dhabi', 'أبوظبي'),
            avatar: '🎬',
            theme: { bg: '#FDF4FF', accent: '#A855F7', light: '#F3E8FF' },
            story: t(
                "Noura Al Kaabi built twofour54 into the Middle East's leading media free zone — attracting CNN, Sky News Arabia, and major film productions to Abu Dhabi. She later served as Minister of Culture and Youth, shaping the UAE's creative economy and positioning the country as a global content hub.",
                'بنت نورة الكعبي twofour54 لتصبح المنطقة الإعلامية الحرة الرائدة في الشرق الأوسط — مستقطبة CNN وسكاي نيوز عربية وإنتاجات سينمائية كبرى إلى أبوظبي. شغلت لاحقاً منصب وزيرة الثقافة والشباب، مشكّلة الاقتصاد الإبداعي الإماراتي.'
            ),
            highlights: [t("Built MENA's leading media free zone", 'بنت المنطقة الإعلامية الحرة الرائدة في المنطقة'), t('Attracted CNN, Sky News to Abu Dhabi', 'استقطبت CNN وسكاي نيوز إلى أبوظبي'), t('Shaped UAE creative economy as Minister', 'شكّلت الاقتصاد الإبداعي الإماراتي كوزيرة')],
            quote: t('"Culture is not a luxury — it is the soul of a nation\'s identity and its bridge to the world."', '"الثقافة ليست رفاهية — إنها روح هوية الأمة وجسرها إلى العالم."'),
        },
        {
            name: t('Ahmed Bin Byat', 'أحمد بن بيات'),
            role: t('Former Vice Chairman', 'نائب الرئيس السابق'),
            prevRole: t('CEO, Dubai Holding', 'الرئيس التنفيذي لدبي القابضة'),
            company: t('Dubai Holding', 'دبي القابضة'),
            sector: t('Investment & Technology', 'الاستثمار والتكنولوجيا'),
            location: t('Dubai', 'دبي'),
            avatar: '🌐',
            theme: { bg: '#ECFDF5', accent: '#059669', light: '#D1FAE5' },
            story: t(
                "Ahmed Bin Byat led Dubai Holding — the diversified conglomerate with over $30 billion in assets — through its expansion into technology, real estate, and hospitality. He was instrumental in launching du (Emirates Integrated Telecommunications), bringing telecom competition to the UAE and driving innovation in connectivity.",
                'قاد أحمد بن بيات دبي القابضة — التكتل المتنوع بأصول تتجاوز 30 مليار دولار — خلال توسعها في التكنولوجيا والعقارات والضيافة. كان له دور محوري في إطلاق du (الإمارات للاتصالات المتكاملة)، جالباً المنافسة في قطاع الاتصالات الإماراتي.'
            ),
            highlights: [t('Led $30B+ Dubai Holding portfolio', 'قاد محفظة دبي القابضة بقيمة 30 مليار دولار+'), t('Launched du telecommunications', 'أطلق اتصالات du'), t('Pioneered UAE telecom competition', 'رائد المنافسة في قطاع الاتصالات الإماراتي')],
            quote: t('"Competition drives innovation. When we launched du, we weren\'t just building a network — we were changing an industry."', '"المنافسة تدفع الابتكار. عندما أطلقنا du، لم نكن نبني شبكة فقط — كنا نغيّر صناعة."'),
        },
    ];

    const sectorBreakdown = [
        { sector: t('Technology & Space', 'التكنولوجيا والفضاء'), count: 2, icon: '🚀', color: brand.blue, colorText: brand.blueText },
        { sector: t('Real Estate & Construction', 'العقارات والبناء'), count: 2, icon: '🏗️', color: brand.amber, colorText: brand.amberText },
        { sector: t('Finance & FinTech', 'المالية والتكنولوجيا المالية'), count: 2, icon: '💳', color: brand.green, colorText: brand.greenText },
        { sector: t('Media & Creative', 'الإعلام والإبداع'), count: 1, icon: '🎬', color: brand.purple, colorText: brand.purpleText },
        { sector: t('Trade & Free Zones', 'التجارة والمناطق الحرة'), count: 1, icon: '💎', color: '#FEF3C7', colorText: '#92400E' },
    ];

    const stats = [
        { value: '8', label: t('Success Stories', 'قصة نجاح'), icon: Star },
        { value: '6', label: t('Industry Sectors', 'قطاع صناعي'), icon: Briefcase },
        { value: '$100B+', label: t('Value Created', 'قيمة مُنشأة'), icon: TrendingUp },
        { value: '50K+', label: t('Jobs Generated', 'وظيفة مُولّدة'), icon: Users },
    ];

    /* ── Tab 1: Featured Stories ── */
    const storiesTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Emirati Success in the Private Sector', 'النجاح الإماراتي في القطاع الخاص')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Real stories of Emiratis who built world-class businesses, led breakthrough innovations, and transformed industries — proving that UAE nationals compete at the highest global level.',
                    'قصص حقيقية لإماراتيين بنوا أعمالاً عالمية المستوى وقادوا ابتكارات رائدة وحوّلوا صناعات — مثبتين أن المواطنين الإماراتيين ينافسون على أعلى المستويات العالمية.'
                )}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {successStories.map((s, i) => (
                    <div
                        key={i}
                        style={{
                            background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`,
                            overflow: 'hidden', transition: 'box-shadow .2s', cursor: 'pointer',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                    >
                        {/* Header */}
                        <div style={{ background: s.theme.bg, padding: 20, display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 36 }}>{s.avatar}</span>
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: brand.textPrimary, margin: '0 0 2px' }}>{s.name}</h3>
                                <div style={{ fontSize: 13, color: s.theme.accent, fontWeight: 600 }}>{s.role}</div>
                                <div style={{ fontSize: 12, color: brand.textSecondary, marginTop: 2 }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Building size={11} /> {s.company}</span>
                                    <span style={{ margin: '0 8px' }}>·</span>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><MapPin size={11} /> {s.location}</span>
                                </div>
                            </div>
                            <span style={{ background: s.theme.light, color: s.theme.accent, fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 99 }}>
                                {s.sector}
                            </span>
                        </div>
                        {/* Body */}
                        <div style={{ padding: 20 }}>
                            <p style={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.7, margin: '0 0 14px' }}>{s.story}</p>
                            {/* Highlights */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                                {s.highlights.map((h, j) => (
                                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <CheckCircle size={14} style={{ color: s.theme.accent, flexShrink: 0 }} />
                                        <span style={{ fontSize: 13, color: brand.textPrimary, fontWeight: 500 }}>{h}</span>
                                    </div>
                                ))}
                            </div>
                            {/* Quote */}
                            <blockquote style={{
                                borderLeft: isRTL ? 'none' : `3px solid ${s.theme.accent}`,
                                borderRight: isRTL ? `3px solid ${s.theme.accent}` : 'none',
                                paddingLeft: isRTL ? 0 : 14,
                                paddingRight: isRTL ? 14 : 0,
                                margin: 0,
                                fontSize: 13, color: brand.textPrimary, fontStyle: 'italic', lineHeight: 1.6,
                            }}>
                                {s.quote}
                            </blockquote>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: By Sector ── */
    const sectorTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Emiratis by Sector', 'الإماراتيون حسب القطاع')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Emirati professionals and entrepreneurs are making their mark across every major industry — from space exploration and fintech to hospitality and creative media.',
                    'المهنيون ورواد الأعمال الإماراتيون يتركون بصمتهم في كل صناعة كبرى — من استكشاف الفضاء والتكنولوجيا المالية إلى الضيافة والإعلام الإبداعي.'
                )}
            </p>

            {/* Sector cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
                {sectorBreakdown.map((s, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, textAlign: 'center' }}>
                        <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>{s.icon}</span>
                        <div style={{ fontSize: 22, fontWeight: 700, color: s.colorText }}>{s.count}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary, marginTop: 2 }}>{s.sector}</div>
                    </div>
                ))}
            </div>

            {/* Stories grouped by theme */}
            {[
                { title: t('Builders & Developers', 'البنّاؤون والمطوّرون'), desc: t('Emiratis who built physical and digital infrastructure', 'إماراتيون بنوا البنية التحتية المادية والرقمية'), stories: [successStories[1], successStories[3], successStories[5]] },
                { title: t('Innovators & Disruptors', 'المبتكرون والرواد'), desc: t('Emiratis who pioneered new industries and technologies', 'إماراتيون رائدون في صناعات وتقنيات جديدة'), stories: [successStories[0], successStories[2], successStories[7]] },
                { title: t('Culture & Capital', 'الثقافة ورأس المال'), desc: t("Emiratis who shaped the nation's creative and investment landscape", 'إماراتيون شكّلوا المشهد الإبداعي والاستثماري للأمة'), stories: [successStories[6], successStories[4]] },
            ].map((group, i) => (
                <div key={i} style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{group.title}</h3>
                    <p style={{ fontSize: 13, color: brand.textSecondary, margin: '0 0 12px' }}>{group.desc}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                        {group.stories.map((s, j) => (
                            <div key={j} style={{ background: s.theme.bg, borderRadius: 10, padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                <span style={{ fontSize: 28, flexShrink: 0 }}>{s.avatar}</span>
                                <div>
                                    <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{s.name}</h4>
                                    <div style={{ fontSize: 11, color: s.theme.accent, fontWeight: 600 }}>{s.company}</div>
                                    <div style={{ fontSize: 12, color: brand.textSecondary, marginTop: 4, lineHeight: 1.4 }}>
                                        {s.highlights[0]}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

    /* ── Tab 3: Quotes & Wisdom ── */
    const quotesTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('In Their Own Words', 'بكلماتهم')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Wisdom and insights from Emirati leaders in the private sector — advice on entrepreneurship, leadership, and building world-class businesses from the UAE.',
                    'حكمة ورؤى من القادة الإماراتيين في القطاع الخاص — نصائح حول ريادة الأعمال والقيادة وبناء أعمال عالمية المستوى من الإمارات.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
                {successStories.map((s, i) => (
                    <div key={i} style={{
                        background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`,
                        padding: 24, display: 'flex', flexDirection: 'column', gap: 14,
                    }}>
                        <blockquote style={{
                            fontSize: 15, color: brand.textPrimary, fontStyle: 'italic', lineHeight: 1.7, margin: 0,
                            borderLeft: isRTL ? 'none' : `4px solid ${s.theme.accent}`,
                            borderRight: isRTL ? `4px solid ${s.theme.accent}` : 'none',
                            paddingLeft: isRTL ? 0 : 16,
                            paddingRight: isRTL ? 16 : 0,
                            flex: 1,
                        }}>
                            {s.quote}
                        </blockquote>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 24 }}>{s.avatar}</span>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary }}>{s.name}</div>
                                <div style={{ fontSize: 11, color: s.theme.accent }}>{s.company}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 28, marginTop: 24, textAlign: 'center' }}>
                <Quote size={28} style={{ color: brand.primary, margin: '0 auto 10px' }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, color: brand.textPrimary, margin: '0 0 8px' }}>
                    {t('Share Your Own Success Story', 'شارك قصة نجاحك')}
                </h3>
                <p style={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.6, margin: '0 auto 16px', maxWidth: 500 }}>
                    {t(
                        'Are you an Emirati making an impact in the private sector? Your story could inspire the next generation.',
                        'هل أنت إماراتي تصنع أثراً في القطاع الخاص؟ قصتك يمكن أن تُلهم الجيل القادم.'
                    )}
                </p>
                <button style={{
                    background: brand.primary, color: '#fff', border: 'none', padding: '12px 28px',
                    borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                }}>
                    {t('Submit Your Story', 'أرسل قصتك')} <ArrowIcon size={16} />
                </button>
            </div>
        </div>
    );

    /* ── Tab 4: Impact ── */
    const impactTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Emiratisation Impact', 'أثر التوطين')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'The cumulative impact of Emirati leadership in the private sector — jobs created, value generated, and sectors transformed.',
                    'الأثر التراكمي للقيادة الإماراتية في القطاع الخاص — الوظائف المُنشأة والقيمة المولّدة والقطاعات المحوّلة.'
                )}
            </p>

            {/* Impact metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
                {[
                    { value: '$100B+', label: t('Combined Business Value', 'القيمة التجارية المجمّعة'), icon: '💰', color: brand.amber, colorText: brand.amberText },
                    { value: '50,000+', label: t('Jobs Created', 'وظيفة مُنشأة'), icon: '👥', color: brand.green, colorText: brand.greenText },
                    { value: '8', label: t('Industries Transformed', 'صناعة محوّلة'), icon: '🏢', color: brand.blue, colorText: brand.blueText },
                    { value: '170+', label: t('Countries Reached', 'دولة وصلنا إليها'), icon: '🌍', color: brand.purple, colorText: brand.purpleText },
                ].map((m, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, textAlign: 'center' }}>
                        <span style={{ fontSize: 28, display: 'block', marginBottom: 6 }}>{m.icon}</span>
                        <div style={{ fontSize: 24, fontWeight: 700, color: m.colorText }}>{m.value}</div>
                        <div style={{ fontSize: 13, color: brand.textSecondary, marginTop: 2 }}>{m.label}</div>
                    </div>
                ))}
            </div>

            {/* Key takeaways */}
            <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 24, marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Star size={18} style={{ color: brand.primary }} /> {t('Key Takeaways for Emirati Professionals', 'الدروس الرئيسية للمهنيين الإماراتيين')}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                    {[
                        { title: t('Start Where You Are', 'ابدأ من حيث أنت'), desc: t('Khalaf Al Habtoor started as a contractor — Mohamed Alabbar started in government. Every world-class career begins with a first step.', 'بدأ خلف الحبتور كمقاول — ومحمد العبار بدأ في الحكومة. كل مسيرة عالمية المستوى تبدأ بخطوة أولى.') },
                        { title: t('Think Globally, Act Locally', 'فكّر عالمياً، اعمل محلياً'), desc: t("From DMCC's 170-nation reach to Emaar's global brand, Emirati companies prove that UAE-born businesses can compete worldwide.", 'من وصول مركز دبي للسلع إلى 170 دولة إلى علامة إعمار العالمية، الشركات الإماراتية تثبت أنها تنافس عالمياً.') },
                        { title: t('Innovation is the Differentiator', 'الابتكار هو الفارق'), desc: t('Raja Al Mazrouei pioneered FinTech in MENA, Sarah Al Amiri reached Mars. Innovation opens doors that experience alone cannot.', 'رائدة رجاء المزروعي في التكنولوجيا المالية وسارة الأميري وصلت المريخ. الابتكار يفتح أبواباً لا تستطيع الخبرة وحدها فتحها.') },
                        { title: t('The Private Sector Needs You', 'القطاع الخاص يحتاجك'), desc: t('With Emiratisation targets rising across all sectors, private companies are actively seeking Emirati talent with ambition and drive.', 'مع ارتفاع أهداف التوطين في جميع القطاعات، الشركات الخاصة تبحث بنشاط عن الكفاءات الإماراتية الطموحة.') },
                    ].map((item, i) => (
                        <div key={i} style={{ background: '#F9FAFB', borderRadius: 8, padding: 16 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 6px' }}>{item.title}</h4>
                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Emiratisation progress */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendingUp size={18} style={{ color: brand.primary }} /> {t('Private Sector Emiratisation Progress', 'تقدم التوطين في القطاع الخاص')}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                    {[
                        { label: t('Banking & Finance', 'البنوك والتمويل'), target: '45%', current: '38%', status: t('On Track', 'على المسار') },
                        { label: t('Insurance', 'التأمين'), target: '40%', current: '35%', status: t('Progressing', 'يتقدم') },
                        { label: t('Technology', 'التكنولوجيا'), target: '10%', current: '7%', status: t('Growing Fast', 'نمو سريع') },
                        { label: t('Retail & Hospitality', 'التجزئة والضيافة'), target: '5%', current: '3%', status: t('Early Stage', 'مرحلة مبكرة') },
                    ].map((s, i) => (
                        <div key={i} style={{ background: '#fff', borderRadius: 8, padding: 14 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary, marginBottom: 6 }}>{s.label}</div>
                            <div style={{ fontSize: 12, color: brand.textSecondary, marginBottom: 4 }}>
                                {t('Target', 'الهدف')}: <strong>{s.target}</strong> · {t('Current', 'الحالي')}: <strong>{s.current}</strong>
                            </div>
                            <div style={{ background: '#E5E7EB', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                                <div style={{ background: brand.primary, height: '100%', borderRadius: 99, width: `${(parseFloat(s.current) / parseFloat(s.target)) * 100}%` }} />
                            </div>
                            <div style={{ fontSize: 10, color: brand.primary, fontWeight: 600, marginTop: 4 }}>{s.status}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'stories', label: t('Success Stories', 'قصص النجاح'), icon: <Star className="h-4 w-4" />, content: storiesTab },
        { id: 'sectors', label: t('By Sector', 'حسب القطاع'), icon: <Briefcase className="h-4 w-4" />, content: sectorTab },
        { id: 'quotes', label: t('In Their Words', 'بكلماتهم'), icon: <Quote className="h-4 w-4" />, content: quotesTab },
        { id: 'impact', label: t('Emiratisation Impact', 'أثر التوطين'), icon: <TrendingUp className="h-4 w-4" />, content: impactTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('Emirati Success Stories', 'قصص النجاح الإماراتية')}
            description={t(
                'Real stories of Emiratis who built world-class businesses, led global innovations, and transformed industries from the private sector — inspiring the next generation of UAE talent',
                'قصص حقيقية لإماراتيين بنوا أعمالاً عالمية المستوى وقادوا ابتكارات عالمية وحوّلوا صناعات من القطاع الخاص — ملهمين الجيل القادم من الكفاءات الإماراتية'
            )}
            icon={<Star className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="stories"
        />
    );
};

export default ShareSuccessStoriesPage;
