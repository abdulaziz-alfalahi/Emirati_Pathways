
import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    Users, Target, BookOpen, Award, Calendar, Heart,
    Star, TrendingUp, ChevronRight, ChevronLeft, CheckCircle, Clock,
    Briefcase, GraduationCap, Lightbulb, Globe, Rocket,
    Shield, Zap, ArrowRight, ArrowLeft
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
    red: '#FEE2E2',
    redText: '#991B1B',
    blue: '#DBEAFE',
    blueText: '#1E40AF',
    purple: '#F3E8FF',
    purpleText: '#6B21A8',
};

/* ──────────────────────── COMPONENT ──────────────────────── */

const YouthDevelopmentPage2: React.FC = () => {

    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;
    const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

    /* ──────────────────────── DATA ──────────────────────── */

    const programs = [
        { title: t('Future Leaders Initiative', 'مبادرة قادة المستقبل'), org: t('Federal Youth Authority', 'الهيئة الاتحادية للشباب'), duration: t('12 months', '12 شهراً'), ageGroup: '18–25', enrolled: 450, capacity: 500, statusKey: 'Open' as const, statusLabel: t('Open', 'مفتوح'), tags: [t('Leadership', 'القيادة'), t('Mentorship', 'الإرشاد'), t('Policy', 'السياسات')], icon: '🏅', desc: t('Comprehensive program developing next-generation Emirati leaders with mentorship, project assignments, and international exposure.', 'برنامج شامل لتطوير الجيل القادم من القادة الإماراتيين من خلال الإرشاد والمهام المشروعية والتعرض الدولي.') },
        { title: t('Youth Innovation Bootcamp', 'معسكر الابتكار الشبابي'), org: t('Dubai Future Foundation', 'مؤسسة دبي للمستقبل'), duration: t('6 weeks', '6 أسابيع'), ageGroup: '16–22', enrolled: 180, capacity: 200, statusKey: 'Open' as const, statusLabel: t('Open', 'مفتوح'), tags: [t('AI', 'الذكاء الاصطناعي'), t('Startups', 'الشركات الناشئة'), t('Innovation', 'الابتكار')], icon: '🚀', desc: t('Intensive bootcamp teaching design thinking, prototyping, and entrepreneurship — with seed funding for top projects.', 'معسكر تدريبي مكثف يُعلّم التفكير التصميمي والنماذج الأولية وريادة الأعمال — مع تمويل أولي لأفضل المشاريع.') },
        { title: t('National Service Career Track', 'المسار المهني للخدمة الوطنية'), org: t('Ministry of Defence', 'وزارة الدفاع'), duration: t('18 months', '18 شهراً'), ageGroup: '18–30', enrolled: 1200, capacity: 1200, statusKey: 'Full' as const, statusLabel: t('Full', 'مكتمل'), tags: [t('Military', 'العسكرية'), t('Discipline', 'الانضباط'), t('Fitness', 'اللياقة')], icon: '🎖️', desc: t('Career-oriented national service combining military training with professional development and certification paths.', 'خدمة وطنية موجهة مهنياً تجمع بين التدريب العسكري والتطوير المهني ومسارات الشهادات.') },
        { title: t('STEM Excellence Academy', 'أكاديمية التميز في العلوم والتكنولوجيا'), org: t('Ministry of Education', 'وزارة التربية والتعليم'), duration: t('9 months', '9 أشهر'), ageGroup: '15–18', enrolled: 320, capacity: 400, statusKey: 'Open' as const, statusLabel: t('Open', 'مفتوح'), tags: [t('Science', 'العلوم'), t('Technology', 'التكنولوجيا'), t('Research', 'البحث')], icon: '🔬', desc: t('Advanced STEM program for high-achieving students — lab research, university prep, and international science olympiad participation.', 'برنامج متقدم في العلوم والتكنولوجيا للطلاب المتفوقين — أبحاث مختبرية والتحضير الجامعي والمشاركة في الأولمبياد العلمي الدولي.') },
        { title: t('Emirati Heritage & Culture Program', 'برنامج التراث والثقافة الإماراتية'), org: t('Dubai Culture & Arts Authority', 'هيئة الثقافة والفنون في دبي'), duration: t('4 months', '4 أشهر'), ageGroup: '14–25', enrolled: 280, capacity: 350, statusKey: 'Open' as const, statusLabel: t('Open', 'مفتوح'), tags: [t('Heritage', 'التراث'), t('Culture', 'الثقافة'), t('Arabic', 'العربية')], icon: '🏛️', desc: t('Deepening cultural identity through Emirati heritage studies, Arabic calligraphy, traditional crafts, and community projects.', 'تعميق الهوية الثقافية من خلال دراسات التراث الإماراتي والخط العربي والحرف التقليدية والمشاريع المجتمعية.') },
        { title: t('Youth Entrepreneurship Lab', 'مختبر ريادة الأعمال الشبابي'), org: t('Khalifa Fund', 'صندوق خليفة'), duration: t('6 months', '6 أشهر'), ageGroup: '18–30', enrolled: 150, capacity: 200, statusKey: 'Open' as const, statusLabel: t('Open', 'مفتوح'), tags: [t('Business', 'الأعمال'), t('Funding', 'التمويل'), t('Pitch', 'العرض')], icon: '💡', desc: t('End-to-end startup program: ideation, business planning, mentorship, and up to AED 100K seed funding for qualifying ventures.', 'برنامج شامل للشركات الناشئة: التفكير وتخطيط الأعمال والإرشاد وتمويل أولي يصل إلى 100 ألف درهم للمشاريع المؤهلة.') },
    ];

    const leadershipPath = [
        { level: 1, title: t('Foundation', 'الأساسيات'), desc: t('Self-awareness, personal values, and basic leadership principles', 'الوعي الذاتي والقيم الشخصية ومبادئ القيادة الأساسية'), color: brand.blue, colorText: brand.blueText },
        { level: 2, title: t('Team Leadership', 'قيادة الفريق'), desc: t('Collaboration, delegation, and managing small project teams', 'التعاون والتفويض وإدارة فرق المشاريع الصغيرة'), color: brand.green, colorText: brand.greenText },
        { level: 3, title: t('Strategic Thinking', 'التفكير الاستراتيجي'), desc: t('Organizational awareness, strategic planning, and decision-making', 'الوعي المؤسسي والتخطيط الاستراتيجي وصنع القرار'), color: brand.purple, colorText: brand.purpleText },
        { level: 4, title: t('Visionary Leadership', 'القيادة الرؤيوية'), desc: t('Mentoring others, driving change, and shaping national strategy', 'إرشاد الآخرين وقيادة التغيير وتشكيل الاستراتيجية الوطنية'), color: brand.amber, colorText: brand.amberText },
    ];

    const skillsData = [
        { category: t('Technical', 'التقنية'), skills: [t('Programming & App Dev', 'البرمجة وتطوير التطبيقات'), t('Data Analysis', 'تحليل البيانات'), t('Digital Marketing', 'التسويق الرقمي'), t('Cybersecurity', 'الأمن السيبراني')], Icon: Zap, bg: brand.blue, color: brand.blueText },
        { category: t('Soft Skills', 'المهارات الشخصية'), skills: [t('Public Speaking', 'الخطابة والإلقاء'), t('Teamwork & Collaboration', 'العمل الجماعي والتعاون'), t('Problem Solving', 'حل المشكلات'), t('Time Management', 'إدارة الوقت')], Icon: Heart, bg: brand.green, color: brand.greenText },
        { category: t('Professional', 'المهنية'), skills: [t('Project Management', 'إدارة المشاريع'), t('Negotiation', 'التفاوض'), t('Financial Literacy', 'الثقافة المالية'), t('Networking', 'بناء العلاقات')], Icon: Briefcase, bg: brand.purple, color: brand.purpleText },
    ];

    const skillLevels = [t('Beginner', 'مبتدئ'), t('Intermediate', 'متوسط'), t('Advanced', 'متقدم'), t('Beginner', 'مبتدئ')];

    const successStories = [
        { name: t('Omar Al Zaabi', 'عمر الزعابي'), age: 22, program: t('Future Leaders Initiative', 'مبادرة قادة المستقبل'), outcome: t('Appointed to Youth Federal Council', 'عُيّن في المجلس الاتحادي للشباب'), quote: t('The program gave me the confidence and skills to represent my generation at the national level.', 'منحني البرنامج الثقة والمهارات لتمثيل جيلي على المستوى الوطني.'), avatar: '👨‍🎓' },
        { name: t('Layla Al Suwaidi', 'ليلى السويدي'), age: 20, program: t('Youth Entrepreneurship Lab', 'مختبر ريادة الأعمال الشبابي'), outcome: t('Founded social enterprise impacting 500+ families', 'أسّست مؤسسة اجتماعية أثّرت في أكثر من 500 عائلة'), quote: t('From idea to AED 100K funding in 6 months — the mentors were incredible.', 'من الفكرة إلى تمويل 100 ألف درهم في 6 أشهر — المرشدون كانوا رائعين.'), avatar: '👩‍💼' },
        { name: t('Khalid Al Rashid', 'خالد الراشد'), age: 24, program: t('STEM Excellence Academy', 'أكاديمية التميز في العلوم والتكنولوجيا'), outcome: t('Full scholarship to MIT', 'منحة كاملة لجامعة MIT'), quote: t('The research experience and international competitions opened doors I never imagined.', 'التجربة البحثية والمسابقات الدولية فتحت أبواباً لم أتخيلها.'), avatar: '👨‍🔬' },
    ];

    const stats = [
        { value: '12,500+', label: t('Participants', 'مشارك'), icon: Users },
        { value: '85+', label: t('Programs', 'برنامج'), icon: Target },
        { value: '200+', label: t('Mentors', 'مرشد'), icon: Award },
        { value: '94%', label: t('Success Rate', 'معدل النجاح'), icon: TrendingUp },
    ];

    /* ── Tab 1: Programs ── */
    const programsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Development Programs', 'برامج التطوير')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Explore 85+ youth development programs across leadership, technology, entrepreneurship, culture, and national service — all designed for young Emiratis.',
                    'استكشف أكثر من 85 برنامجاً لتطوير الشباب في مجالات القيادة والتكنولوجيا وريادة الأعمال والثقافة والخدمة الوطنية — جميعها مصممة للشباب الإماراتي.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                {programs.map((p, i) => (
                    <div
                        key={i}
                        style={{
                            background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`,
                            padding: 20, display: 'flex', flexDirection: 'column', gap: 10,
                            transition: 'box-shadow .2s', cursor: 'pointer',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 28 }}>{p.icon}</span>
                                <div>
                                    <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{p.title}</h3>
                                    <div style={{ fontSize: 12, color: brand.textSecondary }}>{p.org}</div>
                                </div>
                            </div>
                            <span style={{
                                background: p.statusKey === 'Open' ? brand.green : brand.amber,
                                color: p.statusKey === 'Open' ? brand.greenText : brand.amberText,
                                fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99,
                            }}>
                                {p.statusLabel}
                            </span>
                        </div>

                        <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{p.desc}</p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {p.tags.map((tag, j) => (
                                <span key={j} style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 10, padding: '2px 8px', borderRadius: 4 }}>{tag}</span>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: 14, fontSize: 12, color: brand.textSecondary }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={12} /> {p.duration}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Users size={12} /> {t('Ages', 'الأعمار')} {p.ageGroup}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Target size={12} /> {p.enrolled}/{p.capacity}</span>
                        </div>

                        <button style={{
                            background: p.statusKey === 'Open' ? brand.primary : 'transparent',
                            color: p.statusKey === 'Open' ? '#fff' : brand.textSecondary,
                            border: p.statusKey === 'Open' ? 'none' : `1px solid ${brand.border}`,
                            padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            marginTop: 'auto', width: '100%',
                        }}>
                            {p.statusKey === 'Open' ? t('Apply Now', 'قدّم الآن') : t('Join Waitlist', 'انضم لقائمة الانتظار')}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: Leadership ── */
    const leadershipTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Leadership Development Pathway', 'مسار تطوير القيادة')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Structured progression from foundational self-awareness to visionary national leadership — each level builds on the last.',
                    'تقدم منظّم من الوعي الذاتي التأسيسي إلى القيادة الوطنية الرؤيوية — كل مستوى يُبنى على سابقه.'
                )}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
                {leadershipPath.map((l, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: l.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: 18, color: l.colorText }}>
                            {l.level}
                        </div>
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{l.title}</h3>
                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{l.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Opportunities & Recognition */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Globe size={18} style={{ color: brand.primary }} /> {t('Leadership Opportunities', 'فرص القيادة')}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[
                            t('Student Government & Youth Councils', 'الحكومة الطلابية ومجالس الشباب'),
                            t('Community Service Projects', 'مشاريع الخدمة المجتمعية'),
                            t('Government Youth Advisory Bodies', 'الهيئات الاستشارية الشبابية الحكومية'),
                            t('Entrepreneurship Programs', 'برامج ريادة الأعمال'),
                        ].map((o, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <CheckCircle size={14} style={{ color: brand.primary, flexShrink: 0 }} />
                                <span style={{ fontSize: 13, color: brand.textSecondary }}>{o}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Award size={18} style={{ color: brand.primary }} /> {t('Recognition & Awards', 'التقدير والجوائز')}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[
                            { title: t('Youth Leadership Excellence Award', 'جائزة التميز القيادي الشبابي'), desc: t('Annual recognition for exceptional impact', 'تقدير سنوي للأثر الاستثنائي') },
                            { title: t('Innovation Leadership Prize', 'جائزة القيادة الابتكارية'), desc: t('Creative solutions and innovative thinking', 'حلول إبداعية وتفكير ابتكاري') },
                            { title: t('Community Impact Recognition', 'تقدير الأثر المجتمعي'), desc: t('Significant community service contributions', 'مساهمات بارزة في الخدمة المجتمعية') },
                        ].map((a, i) => (
                            <div key={i} style={{ background: '#F9FAFB', borderRadius: 8, padding: 10 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary, marginBottom: 2 }}>{a.title}</div>
                                <div style={{ fontSize: 11, color: brand.textSecondary }}>{a.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    /* ── Tab 3: Skills ── */
    const skillsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Skills Development', 'تطوير المهارات')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Build technical, soft, and professional skills through structured courses, workshops, and hands-on projects.',
                    'ابنِ المهارات التقنية والشخصية والمهنية من خلال الدورات المنظمة وورش العمل والمشاريع العملية.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 24 }}>
                {skillsData.map((s, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <s.Icon size={18} style={{ color: s.color }} />
                            </div>
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{s.category}</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {s.skills.map((sk, j) => (
                                <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 13, color: brand.textSecondary }}>{sk}</span>
                                    <span style={{ background: '#F3F4F6', fontSize: 10, padding: '2px 8px', borderRadius: 4, color: brand.textSecondary }}>
                                        {skillLevels[j]}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <button style={{ background: brand.primary, color: '#fff', border: 'none', padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: 14, width: '100%' }}>
                            {t('Explore Courses', 'استكشف الدورات')}
                        </button>
                    </div>
                ))}
            </div>

            {/* Assessment CTA */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{t('Skills Assessment & Development Plan', 'تقييم المهارات وخطة التطوير')}</h3>
                    <p style={{ fontSize: 13, color: brand.textSecondary, margin: 0 }}>{t('Take a personalized assessment and get a tailored learning roadmap.', 'أجرِ تقييماً مخصصاً واحصل على خارطة طريق تعليمية مصممة لك.')}</p>
                </div>
                <button style={{ background: brand.primary, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {t('Start Assessment', 'ابدأ التقييم')} <ArrowIcon size={16} />
                </button>
            </div>
        </div>
    );

    /* ── Tab 4: Success Stories ── */
    const storiesTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Success Stories', 'قصص النجاح')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Real stories from young Emiratis who transformed their futures through our development programs.',
                    'قصص حقيقية من شباب إماراتيين غيّروا مستقبلهم من خلال برامجنا التطويرية.'
                )}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
                {successStories.map((s, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                            <span style={{ fontSize: 36 }}>{s.avatar}</span>
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{s.name}</h3>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{t('Age', 'العمر')} {s.age} · {s.program}</div>
                            </div>
                        </div>
                        <blockquote style={{ fontSize: 14, color: brand.textPrimary, fontStyle: 'italic', lineHeight: 1.6, margin: '0 0 14px', paddingLeft: isRTL ? 0 : 16, paddingRight: isRTL ? 16 : 0, borderLeft: isRTL ? 'none' : `3px solid ${brand.primary}`, borderRight: isRTL ? `3px solid ${brand.primary}` : 'none' }}>
                            "{s.quote}"
                        </blockquote>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <CheckCircle size={16} style={{ color: brand.primary }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: brand.greenText }}>{s.outcome}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Apply CTA */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24, textAlign: 'center' }}>
                <Rocket size={28} style={{ color: brand.primary, margin: '0 auto 8px' }} />
                <h3 style={{ fontSize: 17, fontWeight: 600, color: brand.textPrimary, margin: '0 0 6px' }}>{t('Start Your Journey', 'ابدأ رحلتك')}</h3>
                <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: '0 0 16px', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
                    {t(
                        'Join 12,500+ young Emiratis building their futures. Apply to a program, find a mentor, and start developing the skills that matter.',
                        'انضم إلى أكثر من 12,500 شاب إماراتي يبنون مستقبلهم. قدّم لبرنامج، ابحث عن مرشد، وابدأ بتطوير المهارات المهمة.'
                    )}
                </p>
                <button style={{ background: brand.primary, color: '#fff', border: 'none', padding: '12px 32px', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    {t('Browse Programs', 'تصفّح البرامج')} <ArrowIcon size={18} />
                </button>
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'programs', label: t('Programs', 'البرامج'), icon: <Target className="h-4 w-4" />, content: programsTab },
        { id: 'leadership', label: t('Leadership', 'القيادة'), icon: <Award className="h-4 w-4" />, content: leadershipTab },
        { id: 'skills', label: t('Skills', 'المهارات'), icon: <BookOpen className="h-4 w-4" />, content: skillsTab },
        { id: 'stories', label: t('Success Stories', 'قصص النجاح'), icon: <Star className="h-4 w-4" />, content: storiesTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('Youth Development', 'تطوير الشباب')}
            description={t(
                "Empowering young Emiratis through 85+ development programs in leadership, technology, entrepreneurship, culture, and national service — building the UAE's future workforce",
                'تمكين الشباب الإماراتي من خلال أكثر من 85 برنامجاً تطويرياً في القيادة والتكنولوجيا وريادة الأعمال والثقافة والخدمة الوطنية — بناء القوى العاملة المستقبلية للإمارات'
            )}
            icon={<Users className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="programs"
        />
    );
};

export default YouthDevelopmentPage2;
