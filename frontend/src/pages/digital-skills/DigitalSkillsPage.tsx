
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    Code, BookOpen, Users, TrendingUp, Target,
    Zap, ChevronRight, ChevronLeft, Clock, Star, CheckCircle,
    Play, Monitor, Cloud, Shield, Globe,
    Award, BarChart3, Layers, Cpu, Loader2
} from 'lucide-react';
import { restClient } from '@/utils/api';

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

const CATEGORY_ICONS: Record<string, React.FC<any>> = {
    'Cloud Computing': Cloud, 'Software Engineering': Code, 'Cybersecurity': Shield,
    'Artificial Intelligence': Cpu, 'Design': Layers, 'Marketing': Globe,
    'Blockchain': Code, 'DevOps': Monitor, 'Cloud': Cloud,
};
const CATEGORY_STYLES: Record<string, { bg: string; color: string }> = {
    'Cloud Computing': { bg: brand.blue, color: brand.blueText },
    'Software Engineering': { bg: brand.purple, color: brand.purpleText },
    'Cybersecurity': { bg: brand.red, color: brand.redText },
    'Artificial Intelligence': { bg: brand.green, color: brand.greenText },
    'Design': { bg: brand.amber, color: brand.amberText },
    'Marketing': { bg: brand.primarySurface, color: brand.primary },
    'Blockchain': { bg: brand.purple, color: brand.purpleText },
    'DevOps': { bg: brand.blue, color: brand.blueText },
    'Cloud': { bg: brand.blue, color: brand.blueText },
};
const LEVEL_STYLES: Record<string, { bg: string; color: string }> = {
    Beginner: { bg: brand.green, color: brand.greenText },
    Intermediate: { bg: brand.amber, color: brand.amberText },
    Advanced: { bg: brand.red, color: brand.redText },
};

/* ──────────────────────── COMPONENT ──────────────────────── */

const DigitalSkillsPage: React.FC = () => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState<any[]>([]);
    const [userSkills, setUserSkills] = useState<any[]>([]);
    const [userCerts, setUserCerts] = useState<any[]>([]);

    useEffect(() => {
        let cancelled = false;
        async function fetchData() {
            setLoading(true);
            try {
                const [coursesRes, progressRes] = await Promise.allSettled([
                    restClient.get('/api/skills-development/courses'),
                    restClient.get('/api/skills-development/user-progress'),
                ]);
                if (cancelled) return;
                if (coursesRes.status === 'fulfilled') {
                    const d = coursesRes.value.data as any;
                    if (d?.data) {
                        setCourses([...(d.data.courses || []), ...(d.data.lms_courses || [])]);
                    }
                }
                if (progressRes.status === 'fulfilled') {
                    const d = progressRes.value.data as any;
                    if (d?.data) {
                        setUserSkills(d.data.skills || []);
                        setUserCerts(d.data.certifications || []);
                    }
                }
            } catch (e) {
                console.warn('Digital Skills API not available', e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchData();
        return () => { cancelled = true; };
    }, []);

    const stats = [
        { value: courses.length > 0 ? `${courses.length}` : '300+', label: t('Courses', 'دورة'), icon: BookOpen },
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
                    `Browse ${courses.length || '300+'} courses across cloud computing, development, cybersecurity, AI, design, and digital marketing.`,
                    `تصفّح ${courses.length || '300+'} دورة في الحوسبة السحابية والتطوير والأمن السيبراني والذكاء الاصطناعي والتصميم والتسويق الرقمي.`
                )}
            </p>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                    <Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} />
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                    {courses.map((c, i) => {
                        const cat = c.category || 'Technology';
                        const catStyle = CATEGORY_STYLES[cat] || { bg: brand.primarySurface, color: brand.primary };
                        const levelStyle = LEVEL_STYLES[c.level] || { bg: '#F3F4F6', color: brand.textSecondary };
                        const IconComp = CATEGORY_ICONS[cat] || Code;
                        return (
                            <div
                                key={c.id || i}
                                style={{
                                    background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`,
                                    padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
                                    transition: 'box-shadow .2s', cursor: 'pointer',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)')}
                                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 10, background: catStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <IconComp size={22} style={{ color: catStyle.color }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <span style={{ background: catStyle.bg, color: catStyle.color, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>
                                            {cat}
                                        </span>
                                        <span style={{ background: levelStyle.bg, color: levelStyle.color, fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>
                                            {c.level}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>
                                        {isRTL && c.title_ar ? c.title_ar : c.title}
                                    </h3>
                                    {c.description && <p style={{ fontSize: 12, color: brand.textSecondary, margin: 0, lineHeight: 1.5 }}>{c.description.slice(0, 100)}{c.description.length > 100 ? '...' : ''}</p>}
                                </div>

                                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: brand.textSecondary }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={12} /> {c.duration}</span>
                                    {c.rating && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Star size={12} style={{ color: '#FBBF24', fill: '#FBBF24' }} /> {c.rating}</span>}
                                    {c.delivery_mode && <span>{c.delivery_mode}</span>}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                    <span style={{ fontSize: 12, color: brand.textSecondary }}>
                                        {c.enrolled ? `${c.enrolled.toLocaleString()} ${t('enrolled', 'مسجّل')}` : ''}
                                    </span>
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
            )}
        </div>
    );

    /* ── Tab 2: My Progress ── */
    const progressTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('My Skills & Progress', 'مهاراتي وتقدمي')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t('Track your skill levels and earned certifications.', 'تابع مستويات مهاراتك وشهاداتك المكتسبة.')}
            </p>

            {/* Skills Overview */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>{t('Skills Overview', 'نظرة عامة على المهارات')}</h3>
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                    <Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} />
                </div>
            ) : userSkills.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: brand.textSecondary, marginBottom: 28 }}>
                    <p>{t('No skills recorded yet. Complete a course to track your skill progress!', 'لم يتم تسجيل مهارات بعد. أكمل دورة لتتبع تقدم مهاراتك!')}</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 28 }}>
                    {userSkills.map((s, i) => {
                        const level = s.score || (s.level === 'Expert' ? 90 : s.level === 'Advanced' ? 75 : s.level === 'Intermediate' ? 50 : 30);
                        return (
                            <div key={i} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 14 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary }}>{s.name}</span>
                                        <span style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 10, padding: '2px 6px', borderRadius: 4 }}>
                                            {s.category}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: level >= 75 ? brand.greenText : level >= 50 ? brand.primary : brand.amberText }}>
                                        {level}%
                                    </span>
                                </div>
                                <div style={{ height: 6, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${level}%`, height: '100%', borderRadius: 99,
                                        background: level >= 75 ? '#22C55E' : level >= 50 ? brand.primary : '#F59E0B',
                                    }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                    <span style={{ fontSize: 10, color: brand.textSecondary }}>{s.level}</span>
                                    {s.verified && <span style={{ fontSize: 10, color: brand.greenText }}>✓ {t('Verified', 'معتمد')}</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Certifications */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>{t('Earned Certifications', 'الشهادات المكتسبة')}</h3>
            {userCerts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: brand.textSecondary }}>
                    <p>{t('No certifications yet.', 'لا شهادات بعد.')}</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {userCerts.map((c, i) => (
                        <div key={i} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Award size={24} style={{ color: brand.primary }} />
                            <div style={{ flex: 1 }}>
                                <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{c.name}</h4>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{c.issuer} · {t('Earned', 'حصل عليها')} {c.issue_date ? new Date(c.issue_date).toLocaleDateString() : ''}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    /* ── Tab 3: Practice Lab ── */
    // Practice lab remains static — these are sandbox definitions, not DB records
    const labs = [
        { title: t('Build a REST API', 'بناء واجهة REST API'), desc: t('Design and implement a RESTful API with Node.js and Express — includes database integration and authentication', 'تصميم وتنفيذ واجهة RESTful API باستخدام Node.js وExpress — يشمل تكامل قاعدة البيانات والمصادقة'), difficulty: t('Intermediate', 'متوسط'), time: t('2 hours', 'ساعتان'), Icon: Code, catBg: brand.purple, catColor: brand.purpleText },
        { title: t('Deploy to AWS', 'النشر على AWS'), desc: t('Launch a full-stack application on AWS using EC2, S3, and RDS', 'إطلاق تطبيق متكامل على AWS'), difficulty: t('Advanced', 'متقدم'), time: t('3 hours', '3 ساعات'), Icon: Cloud, catBg: brand.blue, catColor: brand.blueText },
        { title: t('Security Audit Lab', 'مختبر تدقيق الأمان'), desc: t('Perform a security audit on a sample web application', 'إجراء تدقيق أمني على تطبيق ويب'), difficulty: t('Intermediate', 'متوسط'), time: t('2 hours', 'ساعتان'), Icon: Shield, catBg: brand.red, catColor: brand.redText },
        { title: t('ML Model Training', 'تدريب نموذج تعلم آلي'), desc: t('Train and deploy a machine learning model using Python', 'تدريب ونشر نموذج تعلم آلي باستخدام Python'), difficulty: t('Advanced', 'متقدم'), time: t('4 hours', '4 ساعات'), Icon: Cpu, catBg: brand.green, catColor: brand.greenText },
        { title: t('Responsive Design Challenge', 'تحدي التصميم المتجاوب'), desc: t('Build a pixel-perfect responsive landing page from a Figma mockup', 'بناء صفحة هبوط متجاوبة'), difficulty: t('Beginner', 'مبتدئ'), time: t('1.5 hours', '1.5 ساعة'), Icon: Monitor, catBg: brand.amber, catColor: brand.amberText },
        { title: t('Data Pipeline Project', 'مشروع خط أنابيب البيانات'), desc: t('Create an ETL pipeline that ingests, transforms, and visualizes real UAE government open data', 'إنشاء خط أنابيب ETL'), difficulty: t('Intermediate', 'متوسط'), time: t('3 hours', '3 ساعات'), Icon: BarChart3, catBg: brand.primarySurface, catColor: brand.primary },
    ];

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
                {labs.map((lab, i) => (
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
                ))}
            </div>
        </div>
    );

    const tabs = [
        { id: 'catalog', label: t('Course Catalog', 'كتالوج الدورات'), icon: <BookOpen className="h-4 w-4" />, content: catalogTab },
        { id: 'progress', label: t('My Progress', 'تقدّمي'), icon: <BarChart3 className="h-4 w-4" />, content: progressTab },
        { id: 'lab', label: t('Practice Lab', 'المختبر التطبيقي'), icon: <Code className="h-4 w-4" />, content: labTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('Digital Skills Development', 'تطوير المهارات الرقمية')}
            description={t(
                'Build future-ready technology skills through courses, structured learning paths, hands-on labs, and industry-recognized certifications',
                'ابنِ مهارات تقنية جاهزة للمستقبل من خلال دورات ومسارات تعلم منظمة ومختبرات عملية وشهادات معتمدة من الصناعة'
            )}
            icon={<Code className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="catalog"
        />
    );
};

export default DigitalSkillsPage;
