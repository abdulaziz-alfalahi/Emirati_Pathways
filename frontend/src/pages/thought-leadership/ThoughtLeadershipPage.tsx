
import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    BookOpen, Users, Award, Star, Crown, Quote,
    Lightbulb, Globe, Heart, TrendingUp, CheckCircle,
    ArrowRight, ArrowLeft, ExternalLink, Calendar
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
    gold: '#FEF9C3',
    goldText: '#854D0E',
};

/* ──────────────────────── COMPONENT ──────────────────────── */

const ThoughtLeadershipPage2: React.FC = () => {

    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

    /* ──────────────────────── DATA ──────────────────────── */

    const leaders = [
        {
            id: 'zayed',
            name: t('Sheikh Zayed bin Sultan Al Nahyan', 'الشيخ زايد بن سلطان آل نهيان'),
            title: t('Founder of the UAE (1918–2004)', 'مؤسس الإمارات (1918–2004)'),
            era: '1971–2004',
            role: t('Founding Father & First President', 'الأب المؤسس والرئيس الأول'),
            avatar: '🏛️',
            theme: { bg: '#FFF7ED', accent: '#EA580C', light: '#FFEDD5' },
            bio: t(
                "The visionary who transformed seven desert emirates into a unified, modern nation. Sheikh Zayed's wisdom in governance, his commitment to education, and his belief in sharing wealth with all citizens created the foundation for the UAE's extraordinary rise.",
                'الرؤيوي الذي حوّل سبع إمارات صحراوية إلى أمة موحدة وحديثة. حكمة الشيخ زايد في الحكم والتزامه بالتعليم وإيمانه بمشاركة الثروة مع جميع المواطنين أسّس لنهضة الإمارات الاستثنائية.'
            ),
            books: [
                { title: t('Zayed: From Challenges to Union', 'زايد: من التحديات إلى الاتحاد'), author: t('Compiled by National Archives', 'إعداد الأرشيف الوطني'), year: '2005', desc: t('The definitive account of his journey from tribal leader to founding a modern nation-state.', 'السرد الشامل لرحلته من زعيم قبلي إلى مؤسس دولة حديثة.') },
                { title: t('The Sayings of Sheikh Zayed', 'أقوال الشيخ زايد'), author: t('National Archives', 'الأرشيف الوطني'), year: '2004', desc: t('A collection of his most impactful quotes on governance, education, environment, and humanity.', 'مجموعة من أكثر أقواله تأثيراً في الحوكمة والتعليم والبيئة والإنسانية.') },
                { title: t('Zayed and the Environment', 'زايد والبيئة'), author: t('Zayed International Foundation', 'مؤسسة زايد الدولية'), year: '2006', desc: t('His pioneering environmental vision — including desert greening, falcon conservation, and sustainable development.', 'رؤيته البيئية الرائدة — بما في ذلك تخضير الصحراء والحفاظ على الصقور والتنمية المستدامة.') },
            ],
            speeches: [
                { title: t('On Unity', 'عن الوحدة'), quote: t('"A nation without a past has neither a present nor a future."', '"أمة بلا ماضٍ ليس لها حاضر ولا مستقبل."') },
                { title: t('On Wealth', 'عن الثروة'), quote: t('"Wealth is not money. Wealth lies in men. This is where true power lies."', '"الثروة ليست المال. الثروة تكمن في الرجال. هنا تكمن القوة الحقيقية."') },
                { title: t('On Education', 'عن التعليم'), quote: t('"The real asset of any advanced nation is its people, especially the educated ones."', '"الثروة الحقيقية لأي أمة متقدمة هي شعبها، وخاصة المتعلمين منهم."') },
            ],
        },
        {
            id: 'rashid',
            name: t('Sheikh Rashid bin Saeed Al Maktoum', 'الشيخ راشد بن سعيد آل مكتوم'),
            title: t('Builder of Dubai (1912–1990)', 'باني دبي (1912–1990)'),
            era: '1958–1990',
            role: t('Ruler of Dubai & UAE Vice President', 'حاكم دبي ونائب رئيس الدولة'),
            avatar: '🌆',
            theme: { bg: '#EFF6FF', accent: '#2563EB', light: '#DBEAFE' },
            bio: t(
                "The visionary trader who transformed Dubai from a small fishing and pearling village into a global trade hub. Sheikh Rashid built Port Rashid, Dubai Dry Docks, Jebel Ali Port, and the World Trade Centre — laying the infrastructure for Dubai's meteoric rise.",
                'التاجر الرؤيوي الذي حوّل دبي من قرية صيد ولؤلؤ صغيرة إلى مركز تجاري عالمي. بنى الشيخ راشد ميناء راشد وأحواض دبي الجافة وميناء جبل علي ومركز التجارة العالمي — واضعاً البنية التحتية لنهضة دبي المذهلة.'
            ),
            books: [
                { title: t('Rashid: The Son of Dubai', 'راشد: ابن دبي'), author: t('Graeme Wilson', 'غريم ويلسون'), year: '1999', desc: t('The authoritative biography tracing his transformation of Dubai from creek-side trading post to international city.', 'السيرة الذاتية الموثوقة التي تتتبع تحويله لدبي من مركز تجاري على الخور إلى مدينة عالمية.') },
                { title: t('Father of Dubai', 'أبو دبي'), author: t('National Archives', 'الأرشيف الوطني'), year: '2003', desc: t('A photographic and narrative account of his infrastructure vision — ports, bridges, and the open-skies policy.', 'سرد فوتوغرافي وروائي لرؤيته في البنية التحتية — الموانئ والجسور وسياسة الأجواء المفتوحة.') },
                { title: t("Dubai: Life and Times — Through the Lens of Noor Ali Rashid", 'دبي: الحياة والأزمنة — عبر عدسة نور علي راشد'), author: t('Noor Ali Rashid', 'نور علي راشد'), year: '2010', desc: t("Visual chronicle of Dubai's transformation under Sheikh Rashid's leadership, by his official photographer.", 'سجل بصري لتحول دبي في عهد الشيخ راشد، بعدسة مصوره الرسمي.') },
            ],
            speeches: [
                { title: t('On Progress', 'عن التقدم'), quote: t('"My grandfather rode a camel, my father rode a camel, I drive a Mercedes, my son drives a Land Rover, his son will drive a Land Rover, but his son will ride a camel."', '"جدي ركب الجمل، وأبي ركب الجمل، وأنا أقود مرسيدس، وابني يقود لاند روفر، وابنه سيقود لاند روفر، لكن ابنه سيركب الجمل."') },
                { title: t('On Trade', 'عن التجارة'), quote: t('"What is good for the merchants is good for Dubai."', '"ما هو جيد للتجار جيد لدبي."') },
                { title: t('On Infrastructure', 'عن البنية التحتية'), quote: t('"Build the infrastructure and the people will come."', '"ابنِ البنية التحتية وسيأتي الناس."') },
            ],
        },
        {
            id: 'mbz',
            name: t('Sheikh Mohamed bin Zayed Al Nahyan', 'الشيخ محمد بن زايد آل نهيان'),
            title: t('President of the UAE', 'رئيس دولة الإمارات'),
            era: t('2022–Present', '2022–الحاضر'),
            role: t('President of the UAE & Ruler of Abu Dhabi', 'رئيس الدولة وحاكم أبوظبي'),
            avatar: '🇦🇪',
            theme: { bg: '#F0FDF4', accent: '#16A34A', light: '#DCFCE7' },
            bio: t(
                "Continuing his father's legacy, Sheikh Mohamed bin Zayed has steered the UAE toward energy diversification, advanced technology, food security, and global diplomacy. Under his leadership, the UAE hosted COP28, expanded its space programme, and deepened strategic international partnerships.",
                'استكمالاً لإرث والده، قاد الشيخ محمد بن زايد الإمارات نحو تنويع الطاقة والتكنولوجيا المتقدمة والأمن الغذائي والدبلوماسية العالمية. في عهده استضافت الإمارات COP28 ووسّعت برنامجها الفضائي وعمّقت الشراكات الدولية الاستراتيجية.'
            ),
            books: [
                { title: t('Mohamed bin Zayed: A New Day', 'محمد بن زايد: يوم جديد'), author: t('National Archives', 'الأرشيف الوطني'), year: '2019', desc: t('The story of his strategic vision for a post-oil UAE — investment in AI, renewable energy, and education reform.', 'قصة رؤيته الاستراتيجية لإمارات ما بعد النفط — الاستثمار في الذكاء الاصطناعي والطاقة المتجددة وإصلاح التعليم.') },
                { title: t('The UAE Strategy Framework', 'الإطار الاستراتيجي للإمارات'), author: t('UAE Government Publications', 'منشورات حكومة الإمارات'), year: '2023', desc: t('Comprehensive documentation of national strategies under his presidency — from "We the UAE 2031" to energy transition.', 'توثيق شامل للاستراتيجيات الوطنية في عهده — من "نحن الإمارات 2031" إلى التحول في الطاقة.') },
                { title: t('Leadership and Vision', 'القيادة والرؤية'), author: t('Emirates Centre for Strategic Studies', 'مركز الإمارات للدراسات الاستراتيجية'), year: '2021', desc: t('Analysis of his leadership philosophy: pragmatism, long-term thinking, and human capital investment.', 'تحليل فلسفته القيادية: البراغماتية والتفكير طويل الأمد والاستثمار في رأس المال البشري.') },
            ],
            speeches: [
                { title: t('On the Future', 'عن المستقبل'), quote: t('"The UAE\'s greatest resource is its people, and our investment in them will outlast any other."', '"أعظم ثروة للإمارات هي شعبها، واستثمارنا فيهم سيبقى أطول من أي استثمار آخر."') },
                { title: t('On Innovation', 'عن الابتكار'), quote: t('"We must prepare today for the world of tomorrow — innovation is not optional, it is essential."', '"يجب أن نستعد اليوم لعالم الغد — الابتكار ليس اختيارياً، بل ضروري."') },
                { title: t('On Climate', 'عن المناخ'), quote: t('"Climate action is not a burden — it is an opportunity for economic growth and global leadership."', '"العمل المناخي ليس عبئاً — إنه فرصة للنمو الاقتصادي والقيادة العالمية."') },
            ],
        },
        {
            id: 'mbr',
            name: t('Sheikh Mohammed bin Rashid Al Maktoum', 'الشيخ محمد بن راشد آل مكتوم'),
            title: t('Vice President & Prime Minister of the UAE', 'نائب رئيس الدولة ورئيس مجلس الوزراء'),
            era: t('2006–Present', '2006–الحاضر'),
            role: t('Vice President, Prime Minister & Ruler of Dubai', 'نائب رئيس الدولة ورئيس مجلس الوزراء وحاكم دبي'),
            avatar: '🏙️',
            theme: { bg: '#FAF5FF', accent: '#9333EA', light: '#F3E8FF' },
            bio: t(
                "The driving force behind Dubai's global brand, Sheikh Mohammed bin Rashid is a prolific author, poet, and reformer. His visionary governance transformed Dubai into the world's most visited city and a global business capital. He authored multiple bestselling books on leadership and governance.",
                'القوة الدافعة وراء العلامة العالمية لدبي، الشيخ محمد بن راشد مؤلف غزير الإنتاج وشاعر ومصلح. حوّلت حوكمته الرؤيوية دبي إلى أكثر مدن العالم زيارة وعاصمة أعمال عالمية. ألّف كتباً عديدة أصبحت من الأكثر مبيعاً في القيادة والحوكمة.'
            ),
            books: [
                { title: t('My Vision: Challenges in the Race for Excellence', 'رؤيتي: التحديات في سباق التميز'), author: t('Sheikh Mohammed bin Rashid Al Maktoum', 'الشيخ محمد بن راشد آل مكتوم'), year: '2012', desc: t("His personal account of Dubai's journey and leadership principles — a bestseller translated into 20+ languages.", 'سرده الشخصي لرحلة دبي ومبادئ القيادة — كتاب من الأكثر مبيعاً تُرجم إلى أكثر من 20 لغة.') },
                { title: t('Flashes of Thought', 'ومضات فكر'), author: t('Sheikh Mohammed bin Rashid Al Maktoum', 'الشيخ محمد بن راشد آل مكتوم'), year: '2013', desc: t('Collected wisdom on governance, innovation, and building a world-class nation — insights from decades of leadership.', 'حكمة مجمّعة في الحوكمة والابتكار وبناء أمة عالمية المستوى — رؤى من عقود من القيادة.') },
                { title: t('Reflections on Happiness & Positivity', 'تأملات في السعادة والإيجابية'), author: t('Sheikh Mohammed bin Rashid Al Maktoum', 'الشيخ محمد بن راشد آل مكتوم'), year: '2017', desc: t("His philosophy on creating a happy society — the blueprint behind the UAE's Ministry of Happiness and national well-being strategy.", 'فلسفته في إنشاء مجتمع سعيد — المخطط وراء وزارة السعادة واستراتيجية الرفاهية الوطنية.') },
                { title: t('The Race: The Story of the Arab Quest for Peace', 'قصتي: 50 قصة في خمسين عاماً'), author: t('Sheikh Mohammed bin Rashid Al Maktoum', 'الشيخ محمد بن راشد آل مكتوم'), year: '2007', desc: t("A masterwork of modern Arabic poetry reflecting on heritage, peace, and the Arab world's aspirations.", 'عمل شعري عربي حديث يتأمل في التراث والسلام وتطلعات العالم العربي.') },
                { title: t('Spirit of the Union', 'روح الاتحاد'), author: t('Sheikh Mohammed bin Rashid Al Maktoum', 'الشيخ محمد بن راشد آل مكتوم'), year: '2011', desc: t("Poems celebrating the UAE's 40th National Day — themes of unity, heritage, and national pride.", "قصائد تحتفي باليوم الوطني الأربعين للإمارات — موضوعات الوحدة والتراث والفخر الوطني.") },
            ],
            speeches: [
                { title: t('On Leadership', 'عن القيادة'), quote: t('"In a race, there is no room for stopping. You either win or you lose."', '"في السباق، لا مكان للتوقف. إما أن تفوز أو تخسر."') },
                { title: t('On Government', 'عن الحكومة'), quote: t('"Government is not a business. It is a service. And service means putting people first."', '"الحكومة ليست عملاً تجارياً. إنها خدمة. والخدمة تعني وضع الناس أولاً."') },
                { title: t('On Excellence', 'عن التميز'), quote: t('"The word \'impossible\' is not in the dictionary of leaders."', '"كلمة \'مستحيل\' ليست في قاموس القادة."') },
            ],
        },
    ];

    const coreValues = [
        { icon: '🤝', title: t('Unity & Federation', 'الوحدة والاتحاد'), desc: t('Building a nation from seven diverse emirates — strength through solidarity', 'بناء أمة من سبع إمارات متنوعة — القوة من خلال التضامن') },
        { icon: '📚', title: t('Education as Foundation', 'التعليم كأساس'), desc: t('Investing in human capital as the true wealth of the nation', 'الاستثمار في رأس المال البشري باعتباره الثروة الحقيقية للأمة') },
        { icon: '🌍', title: t('Global Engagement', 'الانخراط العالمي'), desc: t('Tolerance, diplomacy, and cultural bridges connecting East and West', 'التسامح والدبلوماسية والجسور الثقافية التي تربط الشرق بالغرب') },
        { icon: '🌱', title: t('Sustainability', 'الاستدامة'), desc: t('Environmental stewardship from desert greening to clean energy leadership', 'الرعاية البيئية من تخضير الصحراء إلى قيادة الطاقة النظيفة') },
        { icon: '🚀', title: t('Innovation & Ambition', 'الابتكار والطموح'), desc: t('Nothing is impossible — from Burj Khalifa to the Mars Hope Probe', 'لا شيء مستحيل — من برج خليفة إلى مسبار الأمل إلى المريخ') },
        { icon: '❤️', title: t('Happiness & Well-being', 'السعادة والرفاهية'), desc: t('Government as a service — putting citizen happiness at the centre of policy', 'الحكومة كخدمة — وضع سعادة المواطن في صميم السياسة') },
    ];

    const stats = [
        { value: '4', label: t('Visionary Leaders', 'قادة رؤيويون'), icon: Crown },
        { value: '20+', label: t('Publications', 'منشور'), icon: BookOpen },
        { value: '50+', label: t('Years of Wisdom', 'عام من الحكمة'), icon: Star },
        { value: t('1 Nation', 'أمة واحدة'), label: t('United Vision', 'رؤية موحدة'), icon: Globe },
    ];

    /* ── Tab 1: Leaders' Library ── */
    const libraryTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t("The Leaders' Library", 'مكتبة القادة')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    "All biography books, publications, and written works of the UAE's founding fathers and current leaders — in one place. Study the vision that built a nation.",
                    'جميع كتب السيرة الذاتية والمنشورات والأعمال المكتوبة لآباء الإمارات المؤسسين والقادة الحاليين — في مكان واحد. ادرس الرؤية التي بنت أمة.'
                )}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {leaders.map((leader) => (
                    <div key={leader.id}>
                        {/* Leader header */}
                        <div style={{ background: leader.theme.bg, borderRadius: 12, padding: 20, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
                            <span style={{ fontSize: 36 }}>{leader.avatar}</span>
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: brand.textPrimary, margin: '0 0 2px' }}>{leader.name}</h3>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{leader.role} · {leader.era}</div>
                            </div>
                        </div>
                        {/* Books */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                            {leader.books.map((book, j) => (
                                <div
                                    key={j}
                                    style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 16, display: 'flex', flexDirection: 'column', gap: 6, transition: 'box-shadow .2s', cursor: 'pointer' }}
                                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)')}
                                    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <BookOpen size={16} style={{ color: leader.theme.accent, flexShrink: 0 }} />
                                        <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{book.title}</h4>
                                    </div>
                                    <div style={{ fontSize: 11, color: leader.theme.accent, fontWeight: 600 }}>{book.author} · {book.year}</div>
                                    <p style={{ fontSize: 12, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{book.desc}</p>
                                    <button style={{ background: leader.theme.light, color: leader.theme.accent, border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', marginTop: 'auto', alignSelf: isRTL ? 'flex-end' : 'flex-start' }}>
                                        {t('Learn More', 'اعرف المزيد')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: Speeches & Quotes ── */
    const speechesTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Speeches & Quotes', 'الخطابات والاقتباسات')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    "The most powerful words from the UAE's leaders — on unity, governance, education, innovation, and the human spirit. Guiding the nation and serving as role models for generations.",
                    'أقوى الكلمات من قادة الإمارات — عن الوحدة والحوكمة والتعليم والابتكار والروح الإنسانية. ترشد الأمة وتكون قدوة للأجيال.'
                )}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                {leaders.map((leader) => (
                    <div key={leader.id}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                            <span style={{ fontSize: 28 }}>{leader.avatar}</span>
                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{leader.name}</h3>
                                <div style={{ fontSize: 11, color: brand.textSecondary }}>{leader.title}</div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                            {leader.speeches.map((s, j) => (
                                <div key={j} style={{ background: leader.theme.bg, borderRadius: 10, padding: 18, borderLeft: isRTL ? 'none' : `4px solid ${leader.theme.accent}`, borderRight: isRTL ? `4px solid ${leader.theme.accent}` : 'none' }}>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: leader.theme.accent, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        {s.title}
                                    </div>
                                    <blockquote style={{ fontSize: 14, color: brand.textPrimary, fontStyle: 'italic', lineHeight: 1.7, margin: 0 }}>
                                        {s.quote}
                                    </blockquote>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 3: Biographies ── */
    const biographiesTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Leader Biographies', 'السِّيَر الذاتية للقادة')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'The stories behind the visionaries who built the UAE from desert sands into a global powerhouse — from federation to the world stage.',
                    'القصص وراء الرؤيويين الذين بنوا الإمارات من رمال الصحراء إلى قوة عالمية — من الاتحاد إلى المسرح العالمي.'
                )}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {leaders.map((leader) => (
                    <div key={leader.id} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, overflow: 'hidden' }}>
                        <div style={{ background: leader.theme.bg, padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                            <span style={{ fontSize: 42, lineHeight: 1 }}>{leader.avatar}</span>
                            <div>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: brand.textPrimary, margin: '0 0 4px' }}>{leader.name}</h3>
                                <div style={{ fontSize: 13, color: leader.theme.accent, fontWeight: 600 }}>{leader.role}</div>
                                <div style={{ fontSize: 12, color: brand.textSecondary, marginTop: 2 }}>{leader.era}</div>
                            </div>
                        </div>
                        <div style={{ padding: 24 }}>
                            <p style={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.7, margin: '0 0 16px' }}>
                                {leader.bio}
                            </p>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <span style={{ background: leader.theme.light, color: leader.theme.accent, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6 }}>
                                    📚 {leader.books.length} {t('Publications', 'منشور')}
                                </span>
                                <span style={{ background: leader.theme.light, color: leader.theme.accent, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6 }}>
                                    🎙️ {leader.speeches.length} {t('Key Speeches', 'خطابات رئيسية')}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 4: Values & Legacy ── */
    const valuesTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Core Values & National Legacy', 'القيم الجوهرية والإرث الوطني')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    "The enduring principles drawn from the UAE's leaders — values that guide the nation's present and shape its future.",
                    'المبادئ الخالدة المستقاة من قادة الإمارات — قيم ترشد حاضر الأمة وتشكّل مستقبلها.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 28 }}>
                {coreValues.map((v, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, textAlign: 'center' }}>
                        <span style={{ fontSize: 32, display: 'block', marginBottom: 10 }}>{v.icon}</span>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 6px' }}>{v.title}</h3>
                        <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{v.desc}</p>
                    </div>
                ))}
            </div>

            {/* Guiding Vision CTA */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 28, textAlign: 'center' }}>
                <Crown size={28} style={{ color: brand.primary, margin: '0 auto 10px' }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, color: brand.textPrimary, margin: '0 0 8px' }}>
                    {t('"A nation without a past has neither a present nor a future"', '"أمة بلا ماضٍ ليس لها حاضر ولا مستقبل"')}
                </h3>
                <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.6, margin: '0 0 6px', maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
                    — {t('Sheikh Zayed bin Sultan Al Nahyan', 'الشيخ زايد بن سلطان آل نهيان')}
                </p>
                <p style={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.6, margin: '16px auto 20px', maxWidth: 600 }}>
                    {t(
                        'These words remind every Emirati that understanding the vision and values of our leaders is essential to carrying their legacy forward. Study their works. Live their values. Build the future they imagined.',
                        'هذه الكلمات تذكّر كل إماراتي بأن فهم رؤية قادتنا وقيمهم ضروري لحمل إرثهم. ادرس أعمالهم. عِش قيمهم. ابنِ المستقبل الذي تخيّلوه.'
                    )}
                </p>
                <button style={{ background: brand.primary, color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    {t('Explore the Library', 'استكشف المكتبة')} <ArrowIcon size={18} />
                </button>
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'library', label: t("Leaders' Library", 'مكتبة القادة'), icon: <BookOpen className="h-4 w-4" />, content: libraryTab },
        { id: 'speeches', label: t('Speeches & Quotes', 'الخطابات والاقتباسات'), icon: <Quote className="h-4 w-4" />, content: speechesTab },
        { id: 'biographies', label: t('Biographies', 'السِّيَر الذاتية'), icon: <Crown className="h-4 w-4" />, content: biographiesTab },
        { id: 'values', label: t('Values & Legacy', 'القيم والإرث'), icon: <Heart className="h-4 w-4" />, content: valuesTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('Thought Leadership', 'القيادة الفكرية')}
            description={t(
                "The biography books, publications, speeches, and wisdom of the UAE's founding fathers and current leaders — all in one place, guiding the nation and serving as role models for every Emirati",
                'كتب السيرة الذاتية والمنشورات والخطابات وحكمة آباء الإمارات المؤسسين والقادة الحاليين — في مكان واحد، ترشد الأمة وتكون قدوة لكل إماراتي'
            )}
            icon={<Crown className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="library"
        />
    );
};

export default ThoughtLeadershipPage2;
