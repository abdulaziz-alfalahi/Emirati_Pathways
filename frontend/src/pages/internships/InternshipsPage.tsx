
import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    Briefcase, Building2, MapPin, Clock, Calendar,
    ChevronRight, ChevronLeft, Bookmark, CheckCircle, Search,
    TrendingUp, Star, Users, Award, Shield,
    GraduationCap, Banknote, Globe, Zap, Filter
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

/* ──────────────────────── COMPONENT ──────────────────────── */

const InternshipsPage: React.FC = () => {

    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

    /* ──────────────────────── DATA ──────────────────────── */

    const internships = [
        { title: t('Software Engineering Intern', 'متدرب هندسة برمجيات'), company: t('Emirates NBD', 'الإمارات دبي الوطني'), location: t('Dubai', 'دبي'), duration: t('3 months', '3 أشهر'), type: t('Paid', 'مدفوع'), stipend: t('AED 5,000/mo', '5,000 د.إ/شهر'), sector: t('Banking & Finance', 'المصارف والتمويل'), deadline: t('Apr 15, 2026', '15 أبريل 2026'), desc: t('Work with the digital banking team on mobile app features and API development', 'العمل مع فريق الخدمات المصرفية الرقمية على ميزات التطبيق وتطوير واجهات البرمجة'), skills: ['React', 'Node.js', 'SQL'], catBg: brand.blue, catColor: brand.blueText },
        { title: t('Marketing & Communications Intern', 'متدرب تسويق واتصالات'), company: t('Dubai Tourism', 'دبي للسياحة'), location: t('Dubai', 'دبي'), duration: t('6 months', '6 أشهر'), type: t('Paid', 'مدفوع'), stipend: t('AED 4,500/mo', '4,500 د.إ/شهر'), sector: t('Government', 'الحكومة'), deadline: t('Mar 30, 2026', '30 مارس 2026'), desc: t('Support digital marketing campaigns and social media strategy for tourism initiatives', 'دعم حملات التسويق الرقمي واستراتيجية وسائل التواصل لمبادرات السياحة'), skills: [t('Marketing', 'التسويق'), t('Content', 'المحتوى'), t('Analytics', 'التحليلات')], catBg: brand.green, catColor: brand.greenText },
        { title: t('Data Science Intern', 'متدرب علم البيانات'), company: t('Etisalat (e&)', 'اتصالات (e&)'), location: t('Abu Dhabi', 'أبوظبي'), duration: t('4 months', '4 أشهر'), type: t('Paid', 'مدفوع'), stipend: t('AED 6,000/mo', '6,000 د.إ/شهر'), sector: t('Technology', 'التكنولوجيا'), deadline: t('Apr 1, 2026', '1 أبريل 2026'), desc: t('Develop ML models for customer analytics and network optimization projects', 'تطوير نماذج التعلم الآلي لتحليل العملاء ومشاريع تحسين الشبكة'), skills: ['Python', 'TensorFlow', 'SQL'], catBg: brand.purple, catColor: brand.purpleText },
        { title: t('Architecture & Design Intern', 'متدرب هندسة معمارية وتصميم'), company: t('Emaar Properties', 'إعمار العقارية'), location: t('Dubai', 'دبي'), duration: t('3 months', '3 أشهر'), type: t('Paid', 'مدفوع'), stipend: t('AED 4,000/mo', '4,000 د.إ/شهر'), sector: t('Real Estate', 'العقارات'), deadline: t('May 1, 2026', '1 مايو 2026'), desc: t('Contribute to design concepts for upcoming mixed-use developments and community spaces', 'المساهمة في مفاهيم التصميم للمشاريع متعددة الاستخدامات والمساحات المجتمعية القادمة'), skills: ['AutoCAD', 'SketchUp', 'Revit'], catBg: brand.amber, catColor: brand.amberText },
        { title: t('Sustainability & ESG Intern', 'متدرب الاستدامة والحوكمة البيئية'), company: t('ADNOC', 'أدنوك'), location: t('Abu Dhabi', 'أبوظبي'), duration: t('6 months', '6 أشهر'), type: t('Paid', 'مدفوع'), stipend: t('AED 7,000/mo', '7,000 د.إ/شهر'), sector: t('Energy & Oil', 'الطاقة والنفط'), deadline: t('Apr 20, 2026', '20 أبريل 2026'), desc: t('Support environmental impact assessments and sustainability reporting across operational units', 'دعم تقييمات الأثر البيئي وتقارير الاستدامة عبر الوحدات التشغيلية'), skills: [t('Sustainability', 'الاستدامة'), t('Data Analysis', 'تحليل البيانات'), t('Reporting', 'إعداد التقارير')], catBg: brand.primarySurface, catColor: brand.primary },
        { title: t('Healthcare Innovation Intern', 'متدرب ابتكار الرعاية الصحية'), company: t('Cleveland Clinic Abu Dhabi', 'كليفلاند كلينك أبوظبي'), location: t('Abu Dhabi', 'أبوظبي'), duration: t('3 months', '3 أشهر'), type: t('Paid', 'مدفوع'), stipend: t('AED 4,500/mo', '4,500 د.إ/شهر'), sector: t('Healthcare', 'الرعاية الصحية'), deadline: t('Mar 25, 2026', '25 مارس 2026'), desc: t('Research and implement digital health tools for patient engagement and care coordination', 'بحث وتطبيق أدوات الصحة الرقمية لتفاعل المرضى وتنسيق الرعاية'), skills: [t('Research', 'البحث'), t('Health IT', 'تقنية المعلومات الصحية'), 'UX'], catBg: brand.red, catColor: brand.redText },
    ];

    const partnerCompanies = [
        { name: t('Emirates NBD', 'الإمارات دبي الوطني'), sector: t('Banking', 'المصارف'), openings: 4, logo: '🏦' },
        { name: t('Etisalat (e&)', 'اتصالات (e&)'), sector: t('Technology', 'التكنولوجيا'), openings: 6, logo: '📡' },
        { name: t('ADNOC', 'أدنوك'), sector: t('Energy', 'الطاقة'), openings: 5, logo: '⛽' },
        { name: t('Emaar Properties', 'إعمار العقارية'), sector: t('Real Estate', 'العقارات'), openings: 3, logo: '🏗️' },
        { name: t('Dubai Tourism', 'دبي للسياحة'), sector: t('Government', 'الحكومة'), openings: 4, logo: '🏛️' },
        { name: t('Mubadala', 'مبادلة'), sector: t('Investment', 'الاستثمار'), openings: 3, logo: '💼' },
    ];

    const applications = [
        { title: t('Software Engineering Intern', 'متدرب هندسة برمجيات'), company: t('Emirates NBD', 'الإمارات دبي الوطني'), appliedDate: t('Feb 10, 2026', '10 فبراير 2026'), status: t('Under Review', 'قيد المراجعة'), statusColor: brand.amber, statusText: brand.amberText },
        { title: t('Data Science Intern', 'متدرب علم البيانات'), company: t('Etisalat (e&)', 'اتصالات (e&)'), appliedDate: t('Feb 5, 2026', '5 فبراير 2026'), status: t('Interview Scheduled', 'مقابلة مجدولة'), statusColor: brand.green, statusText: brand.greenText },
        { title: t('Marketing Intern', 'متدرب تسويق'), company: t('Dubai Tourism', 'دبي للسياحة'), appliedDate: t('Jan 28, 2026', '28 يناير 2026'), status: t('Under Review', 'قيد المراجعة'), statusColor: brand.amber, statusText: brand.amberText },
    ];

    const tips = [
        { title: t('Start Your Search Early', 'ابدأ البحث مبكراً'), desc: t('Begin looking for internships 3–6 months before your desired start date to maximize your options', 'ابدأ البحث عن التدريب قبل 3–6 أشهر من تاريخ البدء المطلوب لتعظيم خياراتك'), Icon: Calendar },
        { title: t('Tailor Every Application', 'خصّص كل طلب'), desc: t('Customize your cover letter and highlight relevant skills for each specific opportunity', 'خصّص رسالة التقديم وأبرز المهارات ذات الصلة لكل فرصة محددة'), Icon: Star },
        { title: t('Leverage University Services', 'استفد من خدمات الجامعة'), desc: t('Use career services, job fairs, and alumni networks at your university for referrals', 'استخدم خدمات التوظيف ومعارض العمل وشبكات الخريجين في جامعتك للترشيحات'), Icon: GraduationCap },
        { title: t('Build a Strong Online Profile', 'ابنِ ملفاً رقمياً قوياً'), desc: t('Keep your LinkedIn and portfolio up to date — UAE recruiters actively source interns online', 'حافظ على تحديث حسابك في لينكدإن ومعرض أعمالك — مسؤولو التوظيف في الإمارات يبحثون عن المتدربين إلكترونياً'), Icon: Globe },
        { title: t('Network at Industry Events', 'تواصل في الفعاليات المهنية'), desc: t('Attend meetups, conferences, and career expos across Dubai and Abu Dhabi', 'احضر اللقاءات والمؤتمرات ومعارض التوظيف في دبي وأبوظبي'), Icon: Users },
        { title: t('Follow Up Professionally', 'تابع بشكل مهني'), desc: t("Send a polite follow-up email 1–2 weeks after applying if you haven't heard back", 'أرسل بريداً إلكترونياً مهذباً للمتابعة بعد 1–2 أسبوع من التقديم إن لم تتلقَّ رداً'), Icon: CheckCircle },
    ];

    const sectors = [
        t('All Sectors', 'جميع القطاعات'),
        t('Banking & Finance', 'المصارف والتمويل'),
        t('Technology', 'التكنولوجيا'),
        t('Government', 'الحكومة'),
        t('Energy & Oil', 'الطاقة والنفط'),
        t('Real Estate', 'العقارات'),
        t('Healthcare', 'الرعاية الصحية'),
    ];

    const stats = [
        { value: '25+', label: t('Open Internships', 'تدريب متاح'), icon: Briefcase },
        { value: '50+', label: t('Partner Companies', 'شركة شريكة'), icon: Building2 },
        { value: '1,200+', label: t('Placements', 'توظيف'), icon: Award },
        { value: '72%', label: t('Full-time Conversion', 'التحويل لدوام كامل'), icon: TrendingUp },
    ];

    /* ── Tab 1: Opportunities ── */
    const opportunitiesTab = (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary }}>
                    {t('Internship Opportunities', 'فرص التدريب')}
                </h2>
            </div>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 20, lineHeight: 1.6 }}>
                {t(
                    "Explore internships across UAE's top companies — filter by sector, location, and duration to find your ideal placement.",
                    'استكشف فرص التدريب في أبرز شركات الإمارات — فلتر حسب القطاع والموقع والمدة للعثور على التدريب المثالي.'
                )}
            </p>

            {/* Filter bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {sectors.map((s, i) => (
                    <button
                        key={i}
                        style={{
                            background: i === 0 ? brand.primarySurface : '#F3F4F6',
                            color: i === 0 ? brand.primary : brand.textSecondary,
                            border: `1px solid ${i === 0 ? brand.primary : brand.border}`,
                            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                        }}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {/* Listings */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                {internships.map((item, i) => (
                    <div
                        key={i}
                        style={{
                            background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`,
                            padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
                            transition: 'box-shadow .2s', cursor: 'pointer',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                    >
                        {/* Top row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{item.title}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: brand.textSecondary }}>
                                    <Building2 size={14} /> {item.company}
                                </div>
                            </div>
                            <Bookmark size={18} style={{ color: brand.textSecondary, cursor: 'pointer' }} />
                        </div>

                        <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{item.desc}</p>

                        {/* Meta */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12, color: brand.textSecondary }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={13} /> {item.location}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={13} /> {item.duration}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Banknote size={13} /> {item.stipend}</span>
                        </div>

                        {/* Tags */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            <span style={{ background: item.catBg, color: item.catColor, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>
                                {item.sector}
                            </span>
                            <span style={{ background: brand.green, color: brand.greenText, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>
                                {item.type}
                            </span>
                        </div>

                        {/* Skills */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {item.skills.map((sk, j) => (
                                <span key={j} style={{ background: brand.primarySurface, color: brand.primary, fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 4 }}>
                                    {sk}
                                </span>
                            ))}
                        </div>

                        {/* Footer */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                            <span style={{ fontSize: 11, color: brand.textSecondary }}><Calendar size={12} style={{ display: 'inline', verticalAlign: '-2px', ...(isRTL ? { marginLeft: 4 } : { marginRight: 4 }) }} />{t('Deadline:', 'الموعد النهائي:')} {item.deadline}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: brand.primary }}>
                                {t('Apply', 'قدّم')} <ChevronIcon size={14} />
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: My Applications ── */
    const applicationsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('My Applications', 'طلباتي')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Track and manage your submitted internship applications — see status updates and upcoming interview schedules.',
                    'تتبّع وأدِر طلبات التدريب المقدّمة — اطّلع على تحديثات الحالة ومواعيد المقابلات القادمة.'
                )}
            </p>

            {/* Application Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {applications.map((app, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Briefcase size={22} style={{ color: brand.primary }} />
                            </div>
                            <div>
                                <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{app.title}</h4>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{app.company} · {t('Applied', 'تقدّم في')} {app.appliedDate}</div>
                            </div>
                        </div>
                        <span style={{ background: app.statusColor, color: app.statusText, fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 99, whiteSpace: 'nowrap' }}>
                            {app.status}
                        </span>
                    </div>
                ))}
            </div>

            {/* Stats Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {[
                    { label: t('Total Applications', 'إجمالي الطلبات'), value: '3', color: brand.primary },
                    { label: t('Under Review', 'قيد المراجعة'), value: '2', color: brand.amberText },
                    { label: t('Interviews Scheduled', 'مقابلات مجدولة'), value: '1', color: brand.greenText },
                    { label: t('Offers Received', 'عروض مستلمة'), value: '0', color: brand.blueText },
                ].map((stat, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, textAlign: 'center' }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                        <span style={{ fontSize: 13, color: brand.textSecondary }}>{stat.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 3: Partner Companies ── */
    const companiesTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Partner Companies', 'الشركات الشريكة')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Explore 50+ partner organizations across the UAE that actively recruit interns — from government entities to private sector leaders.',
                    'استكشف أكثر من 50 مؤسسة شريكة في الإمارات تستقطب المتدربين بنشاط — من الجهات الحكومية إلى رواد القطاع الخاص.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {partnerCompanies.map((co, i) => (
                    <div
                        key={i}
                        style={{
                            background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`,
                            padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
                            transition: 'box-shadow .2s', cursor: 'pointer',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                                {co.logo}
                            </div>
                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{co.name}</h3>
                                <span style={{ fontSize: 12, color: brand.textSecondary }}>{co.sector}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: `1px solid ${brand.border}` }}>
                            <span style={{ fontSize: 13, color: brand.textSecondary }}>
                                <Briefcase size={14} style={{ display: 'inline', verticalAlign: '-2px', ...(isRTL ? { marginLeft: 4 } : { marginRight: 4 }) }} />
                                {co.openings} {t('open positions', 'وظائف متاحة')}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: brand.primary }}>
                                {t('View', 'عرض')} <ChevronIcon size={14} />
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 4: Tips & Resources ── */
    const tipsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Internship Tips & Resources', 'نصائح ومصادر التدريب')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Expert advice to help you secure, excel in, and convert your internship into a full-time role.',
                    'نصائح خبراء لمساعدتك في الحصول على التدريب والتفوق فيه وتحويله إلى وظيفة بدوام كامل.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 28 }}>
                {tips.map((tip, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, display: 'flex', gap: 14 }}>
                        <div style={{ width: 40, height: 40, minWidth: 40, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <tip.Icon size={20} style={{ color: brand.primary }} />
                        </div>
                        <div>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{tip.title}</h4>
                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{tip.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Conversion Advice */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <TrendingUp size={20} style={{ color: brand.primary }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{t('Converting Your Internship to a Full-time Role', 'تحويل تدريبك إلى وظيفة بدوام كامل')}</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 14 }}>
                    {[
                        { title: t('Exceed Expectations', 'تجاوز التوقعات'), desc: t('Go beyond assigned tasks — propose improvements and take initiative on projects', 'تجاوز المهام المسندة — اقترح تحسينات وبادر بالعمل على المشاريع') },
                        { title: t('Build Relationships', 'ابنِ علاقات'), desc: t('Network with team members, managers, and other departments during your internship', 'تواصل مع أعضاء الفريق والمديرين والأقسام الأخرى أثناء تدريبك') },
                        { title: t('Ask for Feedback', 'اطلب الملاحظات'), desc: t("Request regular feedback and demonstrate how you've actioned it", 'اطلب ملاحظات منتظمة وبيّن كيف طبّقتها') },
                    ].map((item, i) => (
                        <div key={i} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <CheckCircle size={16} style={{ color: brand.primary }} />
                                <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{item.title}</h4>
                            </div>
                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'opportunities', label: t('Opportunities', 'الفرص'), icon: <Briefcase className="h-4 w-4" />, content: opportunitiesTab },
        { id: 'applications', label: t('My Applications', 'طلباتي'), icon: <CheckCircle className="h-4 w-4" />, content: applicationsTab },
        { id: 'companies', label: t('Partner Companies', 'الشركات الشريكة'), icon: <Building2 className="h-4 w-4" />, content: companiesTab },
        { id: 'tips', label: t('Tips & Resources', 'نصائح ومصادر'), icon: <Star className="h-4 w-4" />, content: tipsTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('Internships', 'التدريب العملي')}
            description={t(
                'Gain valuable work experience through paid internships with leading companies across the UAE — your bridge from learning to earning',
                'اكتسب خبرة عملية قيّمة من خلال تدريب مدفوع مع شركات رائدة في الإمارات — جسرك من التعلّم إلى الكسب'
            )}
            icon={<Briefcase className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="opportunities"
        />
    );
};

export default InternshipsPage;
