
import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    Code, BookOpen, Users, TrendingUp, Target,
    Zap, ChevronRight, ChevronLeft, Clock, Star, CheckCircle,
    Play, Monitor, Cloud, Shield, Globe,
    Award, BarChart3, Layers, Cpu
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

const DigitalSkillsPage: React.FC = () => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

    /* ──────────────────────── DATA ──────────────────────── */

    const beginner = t('Beginner', 'مبتدئ');
    const intermediate = t('Intermediate', 'متوسط');
    const advanced = t('Advanced', 'متقدم');

    const levelColor = (lvl: string) => ({
        bg: lvl === beginner ? brand.green : lvl === intermediate ? brand.amber : brand.red,
        text: lvl === beginner ? brand.greenText : lvl === intermediate ? brand.amberText : brand.redText,
    });

    const courses = [
        { title: t('Cloud Computing Fundamentals', 'أساسيات الحوسبة السحابية'), category: t('Cloud', 'سحابية'), level: beginner, duration: t('6 weeks', '6 أسابيع'), modules: 12, enrolled: 2400, rating: 4.8, Icon: Cloud, catBg: brand.blue, catColor: brand.blueText },
        { title: t('Full-Stack Web Development', 'تطوير الويب المتكامل'), category: t('Development', 'تطوير'), level: intermediate, duration: t('12 weeks', '12 أسبوع'), modules: 24, enrolled: 1800, rating: 4.9, Icon: Code, catBg: brand.purple, catColor: brand.purpleText },
        { title: t('Cybersecurity Essentials', 'أساسيات الأمن السيبراني'), category: t('Security', 'أمان'), level: intermediate, duration: t('8 weeks', '8 أسابيع'), modules: 16, enrolled: 1500, rating: 4.7, Icon: Shield, catBg: brand.red, catColor: brand.redText },
        { title: t('Data Science & Machine Learning', 'علم البيانات والتعلم الآلي'), category: t('AI/ML', 'ذكاء اصطناعي'), level: advanced, duration: t('10 weeks', '10 أسابيع'), modules: 20, enrolled: 2100, rating: 4.8, Icon: Cpu, catBg: brand.green, catColor: brand.greenText },
        { title: t('UI/UX Design Masterclass', 'دورة متقدمة في تصميم UI/UX'), category: t('Design', 'تصميم'), level: beginner, duration: t('8 weeks', '8 أسابيع'), modules: 14, enrolled: 1200, rating: 4.6, Icon: Layers, catBg: brand.amber, catColor: brand.amberText },
        { title: t('Digital Marketing & Analytics', 'التسويق الرقمي والتحليلات'), category: t('Marketing', 'تسويق'), level: beginner, duration: t('6 weeks', '6 أسابيع'), modules: 10, enrolled: 3200, rating: 4.7, Icon: Globe, catBg: brand.primarySurface, catColor: brand.primary },
    ];

    const learningPaths = [
        { title: t('Cloud Architect Track', 'مسار مهندس السحابة'), courses: 5, duration: t('6 months', '6 أشهر'), progress: 40, skills: ['AWS', 'Azure', 'Terraform', 'Docker'], Icon: Cloud },
        { title: t('Full-Stack Developer Track', 'مسار مطوّر الويب المتكامل'), courses: 6, duration: t('8 months', '8 أشهر'), progress: 25, skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'], Icon: Code },
        { title: t('AI & Data Science Track', 'مسار الذكاء الاصطناعي وعلم البيانات'), courses: 5, duration: t('7 months', '7 أشهر'), progress: 0, skills: ['Python', 'TensorFlow', 'SQL', 'Pandas'], Icon: Cpu },
    ];

    const myProgress = [
        { course: t('Cloud Computing Fundamentals', 'أساسيات الحوسبة السحابية'), progress: 72, modulesCompleted: 9, totalModules: 12, lastAccessed: t('Today', 'اليوم') },
        { course: t('Cybersecurity Essentials', 'أساسيات الأمن السيبراني'), progress: 45, modulesCompleted: 7, totalModules: 16, lastAccessed: t('Yesterday', 'أمس') },
    ];

    const skills = [
        { name: 'Python', level: 85, category: t('Programming', 'برمجة') },
        { name: t('Cloud (AWS)', 'سحابة (AWS)'), level: 72, category: t('Infrastructure', 'بنية تحتية') },
        { name: 'JavaScript', level: 78, category: t('Programming', 'برمجة') },
        { name: 'SQL', level: 80, category: t('Data', 'بيانات') },
        { name: t('Cybersecurity', 'أمن سيبراني'), level: 45, category: t('Security', 'أمان') },
        { name: t('UI/UX Design', 'تصميم UI/UX'), level: 35, category: t('Design', 'تصميم') },
    ];

    const certifications = [
        { title: t('AWS Cloud Practitioner', 'ممارس AWS السحابي'), issuer: t('Amazon Web Services', 'خدمات أمازون ويب'), earned: t('Jan 2026', 'يناير 2026'), badge: '☁️' },
        { title: t('Google Data Analytics', 'تحليلات بيانات جوجل'), issuer: t('Google', 'جوجل'), earned: t('Dec 2025', 'ديسمبر 2025'), badge: '📊' },
    ];

    const labs = [
        { title: t('Build a REST API', 'بناء واجهة REST API'), desc: t('Design and implement a RESTful API with Node.js and Express — includes database integration and authentication', 'تصميم وتنفيذ واجهة RESTful API باستخدام Node.js وExpress — يشمل تكامل قاعدة البيانات والمصادقة'), difficulty: intermediate, time: t('2 hours', 'ساعتان'), Icon: Code, catBg: brand.purple, catColor: brand.purpleText },
        { title: t('Deploy to AWS', 'النشر على AWS'), desc: t('Launch a full-stack application on AWS using EC2, S3, and RDS — practice infrastructure as code with Terraform', 'إطلاق تطبيق متكامل على AWS باستخدام EC2 وS3 وRDS — تدرب على البنية التحتية ككود مع Terraform'), difficulty: advanced, time: t('3 hours', '3 ساعات'), Icon: Cloud, catBg: brand.blue, catColor: brand.blueText },
        { title: t('Security Audit Lab', 'مختبر تدقيق الأمان'), desc: t('Perform a security audit on a sample web application — identify vulnerabilities and implement fixes', 'إجراء تدقيق أمني على تطبيق ويب نموذجي — تحديد الثغرات وتنفيذ الإصلاحات'), difficulty: intermediate, time: t('2 hours', 'ساعتان'), Icon: Shield, catBg: brand.red, catColor: brand.redText },
        { title: t('ML Model Training', 'تدريب نموذج تعلم آلي'), desc: t('Train and deploy a machine learning model using Python, scikit-learn, and TensorFlow on a real dataset', 'تدريب ونشر نموذج تعلم آلي باستخدام Python وscikit-learn وTensorFlow على مجموعة بيانات حقيقية'), difficulty: advanced, time: t('4 hours', '4 ساعات'), Icon: Cpu, catBg: brand.green, catColor: brand.greenText },
        { title: t('Responsive Design Challenge', 'تحدي التصميم المتجاوب'), desc: t('Build a pixel-perfect responsive landing page from a Figma mockup using HTML, CSS, and JavaScript', 'بناء صفحة هبوط متجاوبة مطابقة تماماً من تصميم Figma باستخدام HTML وCSS وJavaScript'), difficulty: beginner, time: t('1.5 hours', '1.5 ساعة'), Icon: Monitor, catBg: brand.amber, catColor: brand.amberText },
        { title: t('Data Pipeline Project', 'مشروع خط أنابيب البيانات'), desc: t('Create an ETL pipeline that ingests, transforms, and visualizes real UAE government open data', 'إنشاء خط أنابيب ETL يستقبل ويحوّل ويعرض بيانات حكومية إماراتية مفتوحة'), difficulty: intermediate, time: t('3 hours', '3 ساعات'), Icon: BarChart3, catBg: brand.primarySurface, catColor: brand.primary },
    ];

    const stats = [
        { value: '300+', label: t('Courses', 'دورة'), icon: BookOpen },
        { value: '15,000+', label: t('Learners', 'متعلم'), icon: Users },
        { value: '12', label: t('Skill Tracks', 'مسار مهاري'), icon: TrendingUp },
        { value: '92%', label: t('Completion', 'نسبة الإتمام'), icon: Target },
    ];

    /* ── Tab 1: Course Catalog ── */
    const catalogTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Course Catalog', 'كتالوج الدورات')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Browse 300+ courses across cloud computing, development, cybersecurity, AI, design, and digital marketing — all aligned with UAE industry demands.',
                    'تصفّح أكثر من 300 دورة في الحوسبة السحابية والتطوير والأمن السيبراني والذكاء الاصطناعي والتصميم والتسويق الرقمي — جميعها متوافقة مع متطلبات سوق العمل الإماراتي.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {courses.map((c, i) => {
                    const lc = levelColor(c.level);
                    return (
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ width: 44, height: 44, borderRadius: 10, background: c.catBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <c.Icon size={22} style={{ color: c.catColor }} />
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <span style={{ background: c.catBg, color: c.catColor, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>
                                        {c.category}
                                    </span>
                                    <span style={{ background: lc.bg, color: lc.text, fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>
                                        {c.level}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{c.title}</h3>
                                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: brand.textSecondary }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={12} /> {c.duration}</span>
                                    <span>{c.modules} {t('modules', 'وحدة')}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Star size={12} style={{ color: '#FBBF24', fill: '#FBBF24' }} /> {c.rating}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                <span style={{ fontSize: 12, color: brand.textSecondary }}>{c.enrolled.toLocaleString()} {t('enrolled', 'مسجّل')}</span>
                                <button style={{
                                    background: brand.primary, color: '#fff', border: 'none',
                                    padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 4,
                                }}>
                                    <Play size={14} /> {t('Enroll', 'سجّل الآن')}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    /* ── Tab 2: Learning Paths ── */
    const pathsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Learning Paths', 'مسارات التعلم')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Follow structured multi-course tracks designed by industry experts to take you from beginner to job-ready.',
                    'اتبع مسارات دورات منظمة صممها خبراء الصناعة لنقلك من مبتدئ إلى جاهز لسوق العمل.'
                )}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {learningPaths.map((p, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <p.Icon size={22} style={{ color: brand.primary }} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{p.title}</h3>
                                    <div style={{ fontSize: 12, color: brand.textSecondary }}>{p.courses} {t('courses', 'دورات')} · {p.duration}</div>
                                </div>
                            </div>
                            <span style={{ fontSize: 16, fontWeight: 700, color: p.progress > 0 ? brand.primary : brand.textSecondary }}>{p.progress}%</span>
                        </div>

                        <div style={{ height: 8, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
                            <div style={{ width: `${p.progress}%`, height: '100%', background: brand.primary, borderRadius: 99 }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {p.skills.map((s, j) => (
                                    <span key={j} style={{ background: brand.primarySurface, color: brand.primary, fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 4 }}>
                                        {s}
                                    </span>
                                ))}
                            </div>
                            <button style={{
                                background: p.progress > 0 ? brand.primary : '#fff',
                                color: p.progress > 0 ? '#fff' : brand.primary,
                                border: p.progress > 0 ? 'none' : `1px solid ${brand.primary}`,
                                padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            }}>
                                {p.progress > 0 ? t('Continue', 'متابعة') : t('Start Path', 'ابدأ المسار')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 3: My Progress ── */
    const progressTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('My Progress', 'تقدّمي')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Track your active courses, skill levels, and earned certifications in one place.',
                    'تابع دوراتك النشطة ومستويات مهاراتك وشهاداتك المكتسبة في مكان واحد.'
                )}
            </p>

            {/* Active Courses */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>{t('Active Courses', 'الدورات النشطة')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {myProgress.map((p, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <div>
                                <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{p.course}</h4>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>
                                    {p.modulesCompleted}/{p.totalModules} {t('modules', 'وحدة')} · {t('Last accessed', 'آخر دخول')} {p.lastAccessed}
                                </div>
                            </div>
                            <button style={{
                                background: brand.primary, color: '#fff', border: 'none',
                                padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 4,
                            }}>
                                <Play size={14} /> {t('Resume', 'استئناف')}
                            </button>
                        </div>
                        <div style={{ height: 8, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${p.progress}%`, height: '100%', background: brand.primary, borderRadius: 99 }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: isRTL ? 'flex-start' : 'flex-end', marginTop: 4, fontSize: 12, color: brand.primary, fontWeight: 600 }}>
                            {p.progress}%
                        </div>
                    </div>
                ))}
            </div>

            {/* Skills Overview */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>{t('Skills Overview', 'نظرة عامة على المهارات')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 28 }}>
                {skills.map((s, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary }}>{s.name}</span>
                                <span style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 10, padding: '2px 6px', borderRadius: 4 }}>
                                    {s.category}
                                </span>
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: s.level >= 75 ? brand.greenText : s.level >= 50 ? brand.primary : brand.amberText }}>
                                {s.level}%
                            </span>
                        </div>
                        <div style={{ height: 6, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{
                                width: `${s.level}%`, height: '100%', borderRadius: 99,
                                background: s.level >= 75 ? '#22C55E' : s.level >= 50 ? brand.primary : '#F59E0B',
                            }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Certifications */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>{t('Earned Certifications', 'الشهادات المكتسبة')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {certifications.map((c, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 24 }}>{c.badge}</span>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{c.title}</h4>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>{c.issuer} · {t('Earned', 'حصل عليها')} {c.earned}</div>
                        </div>
                        <Award size={20} style={{ color: brand.primary }} />
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 4: Practice Lab ── */
    const labTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Practice Lab', 'المختبر التطبيقي')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Hands-on coding environments and real-world project exercises — practice what you learn in a safe sandbox.',
                    'بيئات برمجة عملية وتمارين مشاريع واقعية — تدرب على ما تعلمته في بيئة آمنة.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {labs.map((lab, i) => {
                    const lc = levelColor(lab.difficulty);
                    return (
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: lab.catBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <lab.Icon size={20} style={{ color: lab.catColor }} />
                                </div>
                                <span style={{ background: lc.bg, color: lc.text, fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>
                                    {lab.difficulty}
                                </span>
                            </div>

                            <div>
                                <h3 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{lab.title}</h3>
                                <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{lab.desc}</p>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: brand.textSecondary }}><Clock size={14} /> {lab.time}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: brand.primary, cursor: 'pointer' }}>
                                    {t('Launch Lab', 'افتح المختبر')} <ChevronIcon size={14} />
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'catalog', label: t('Course Catalog', 'كتالوج الدورات'), icon: <BookOpen className="h-4 w-4" />, content: catalogTab },
        { id: 'paths', label: t('Learning Paths', 'مسارات التعلم'), icon: <TrendingUp className="h-4 w-4" />, content: pathsTab },
        { id: 'progress', label: t('My Progress', 'تقدّمي'), icon: <BarChart3 className="h-4 w-4" />, content: progressTab },
        { id: 'lab', label: t('Practice Lab', 'المختبر التطبيقي'), icon: <Code className="h-4 w-4" />, content: labTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('Digital Skills Development', 'تطوير المهارات الرقمية')}
            description={t(
                'Build future-ready technology skills through 300+ courses, structured learning paths, hands-on labs, and industry-recognized certifications',
                'ابنِ مهارات تقنية جاهزة للمستقبل من خلال أكثر من 300 دورة ومسارات تعلم منظمة ومختبرات عملية وشهادات معتمدة من الصناعة'
            )}
            icon={<Code className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="catalog"
        />
    );
};

export default DigitalSkillsPage;
