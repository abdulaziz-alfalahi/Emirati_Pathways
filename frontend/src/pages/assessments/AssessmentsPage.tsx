
import React from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    ClipboardCheck, Search, Award, Target, Brain,
    TrendingUp, BookOpen, BarChart3, ChevronRight, ChevronLeft,
    Clock, Star, CheckCircle, Play, Zap, Users,
    Shield, FileText, Trophy
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

const AssessmentsPage: React.FC = () => {

    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

    /* ──────────────────────── DATA ──────────────────────── */

    const availableAssessments = [
        { title: t('Technical Skills Assessment', 'تقييم المهارات التقنية'), category: t('Technical', 'تقني'), duration: t('45 min', '45 دقيقة'), questions: 40, difficulty: t('Intermediate', 'متوسط'), difficultyKey: 'Intermediate', desc: t('Evaluate your core technical competencies across programming, systems design, and data analysis', 'قيّم كفاءاتك التقنية الأساسية في البرمجة وتصميم الأنظمة وتحليل البيانات'), Icon: Brain, catBg: brand.purple, catColor: brand.purpleText },
        { title: t('Leadership Aptitude Test', 'اختبار الكفاءة القيادية'), category: t('Leadership', 'القيادة'), duration: t('30 min', '30 دقيقة'), questions: 25, difficulty: t('Advanced', 'متقدم'), difficultyKey: 'Advanced', desc: t('Assess your leadership style, decision-making, and team management capabilities', 'قيّم أسلوبك القيادي وقدرتك على اتخاذ القرارات وإدارة الفريق'), Icon: Award, catBg: brand.amber, catColor: brand.amberText },
        { title: t('Communication & Soft Skills', 'التواصل والمهارات الشخصية'), category: t('Soft Skills', 'مهارات شخصية'), duration: t('25 min', '25 دقيقة'), questions: 30, difficulty: t('Beginner', 'مبتدئ'), difficultyKey: 'Beginner', desc: t('Measure your verbal, written, and interpersonal communication effectiveness', 'قِس فعالية تواصلك الشفهي والكتابي والشخصي'), Icon: Users, catBg: brand.blue, catColor: brand.blueText },
        { title: t('Critical Thinking & Problem Solving', 'التفكير النقدي وحل المشكلات'), category: t('Cognitive', 'معرفي'), duration: t('40 min', '40 دقيقة'), questions: 35, difficulty: t('Intermediate', 'متوسط'), difficultyKey: 'Intermediate', desc: t('Test your analytical reasoning, logical thinking, and creative problem-solving abilities', 'اختبر قدراتك في التحليل المنطقي والتفكير الإبداعي وحل المشكلات'), Icon: Zap, catBg: brand.primarySurface, catColor: brand.primary },
        { title: t('Industry Knowledge — Banking & Finance', 'المعرفة القطاعية — المصارف والتمويل'), category: t('Industry', 'قطاعي'), duration: t('35 min', '35 دقيقة'), questions: 30, difficulty: t('Advanced', 'متقدم'), difficultyKey: 'Advanced', desc: t('Validate your knowledge of UAE banking regulations, financial products, and market dynamics', 'تحقّق من معرفتك بأنظمة المصارف الإماراتية والمنتجات المالية وديناميكيات السوق'), Icon: Shield, catBg: brand.green, catColor: brand.greenText },
        { title: t('Digital Literacy Assessment', 'تقييم الإلمام الرقمي'), category: t('Digital', 'رقمي'), duration: t('20 min', '20 دقيقة'), questions: 20, difficulty: t('Beginner', 'مبتدئ'), difficultyKey: 'Beginner', desc: t('Evaluate your proficiency with digital tools, cloud platforms, and modern workplace technology', 'قيّم إتقانك للأدوات الرقمية والمنصات السحابية وتقنيات بيئة العمل الحديثة'), Icon: Target, catBg: brand.red, catColor: brand.redText },
    ];

    const inProgress = [
        { title: t('Technical Skills Assessment', 'تقييم المهارات التقنية'), progress: 65, questionsCompleted: 26, totalQuestions: 40, timeRemaining: t('18 min', '18 دقيقة'), startedDate: t('Feb 17, 2026', '17 فبراير 2026') },
        { title: t('Communication & Soft Skills', 'التواصل والمهارات الشخصية'), progress: 30, questionsCompleted: 9, totalQuestions: 30, timeRemaining: t('20 min', '20 دقيقة'), startedDate: t('Feb 16, 2026', '16 فبراير 2026') },
    ];

    const completedAssessments = [
        { title: t('Digital Literacy Assessment', 'تقييم الإلمام الرقمي'), score: 92, date: t('Feb 10, 2026', '10 فبراير 2026'), badge: t('Digital Expert', 'خبير رقمي'), percentile: t('Top 8%', 'أفضل 8%') },
        { title: t('Critical Thinking & Problem Solving', 'التفكير النقدي وحل المشكلات'), score: 85, date: t('Feb 5, 2026', '5 فبراير 2026'), badge: t('Analytical Thinker', 'مفكر تحليلي'), percentile: t('Top 15%', 'أفضل 15%') },
        { title: t('Leadership Aptitude Test', 'اختبار الكفاءة القيادية'), score: 78, date: t('Jan 28, 2026', '28 يناير 2026'), badge: t('Emerging Leader', 'قائد ناشئ'), percentile: t('Top 25%', 'أفضل 25%') },
    ];

    const skillScores = [
        { name: t('Problem Solving', 'حل المشكلات'), score: 88 },
        { name: t('Communication', 'التواصل'), score: 82 },
        { name: t('Technical Knowledge', 'المعرفة التقنية'), score: 76 },
        { name: t('Leadership', 'القيادة'), score: 78 },
        { name: t('Digital Literacy', 'الإلمام الرقمي'), score: 92 },
        { name: t('Critical Thinking', 'التفكير النقدي'), score: 85 },
    ];

    const stats = [
        { value: '500+', label: t('Assessments', 'تقييم'), icon: ClipboardCheck },
        { value: '92%', label: t('Completion Rate', 'نسبة الإنجاز'), icon: TrendingUp },
        { value: '15+', label: t('Categories', 'فئة'), icon: Target },
        { value: '24/7', label: t('Access', 'متاح'), icon: BookOpen },
    ];

    /* ── Tab 1: Available Assessments ── */
    const availableTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Available Assessments', 'التقييمات المتاحة')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Choose from 500+ assessments across technical, leadership, cognitive, and industry-specific categories to validate and grow your skills.',
                    'اختر من أكثر من 500 تقييم عبر الفئات التقنية والقيادية والمعرفية والقطاعية للتحقق من مهاراتك وتنميتها.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {availableAssessments.map((a, i) => (
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
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: a.catBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <a.Icon size={22} style={{ color: a.catColor }} />
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <span style={{ background: a.catBg, color: a.catColor, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>
                                    {a.category}
                                </span>
                                <span style={{
                                    background: a.difficultyKey === 'Beginner' ? brand.green : a.difficultyKey === 'Intermediate' ? brand.amber : brand.red,
                                    color: a.difficultyKey === 'Beginner' ? brand.greenText : a.difficultyKey === 'Intermediate' ? brand.amberText : brand.redText,
                                    fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
                                }}>
                                    {a.difficulty}
                                </span>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{a.title}</h3>
                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{a.desc}</p>
                        </div>

                        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: brand.textSecondary }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> {a.duration}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FileText size={14} /> {a.questions} {t('questions', 'سؤال')}</span>
                        </div>

                        <button style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            background: brand.primary, color: '#fff', border: 'none',
                            padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            marginTop: 'auto',
                        }}>
                            <Play size={16} /> {t('Start Assessment', 'ابدأ التقييم')}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: In Progress & Completed ── */
    const progressTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('My Progress', 'تقدّمي')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Resume in-progress assessments and review your completed results with badges and percentile rankings.',
                    'أكمل التقييمات الجارية وراجع نتائجك المكتملة مع الشارات وتصنيفات النسب المئوية.'
                )}
            </p>

            {/* In Progress */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>{t('In Progress', 'قيد الإنجاز')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {inProgress.map((a, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <div>
                                <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{a.title}</h4>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>
                                    {t('Started', 'بدأ في')} {a.startedDate} · {a.questionsCompleted}/{a.totalQuestions} {t('questions', 'سؤال')} · {a.timeRemaining} {t('remaining', 'متبقية')}
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
                            <div style={{ width: `${a.progress}%`, height: '100%', background: brand.primary, borderRadius: 99 }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4, fontSize: 12, color: brand.primary, fontWeight: 600 }}>
                            {a.progress}%
                        </div>
                    </div>
                ))}
            </div>

            {/* Completed */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>{t('Completed', 'المكتملة')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {completedAssessments.map((a, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 200 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: a.score >= 85 ? brand.green : a.score >= 75 ? brand.primarySurface : brand.amber, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Trophy size={22} style={{ color: a.score >= 85 ? brand.greenText : a.score >= 75 ? brand.primary : brand.amberText }} />
                            </div>
                            <div>
                                <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{a.title}</h4>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{t('Completed', 'أُكمل في')} {a.date}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ background: brand.primarySurface, color: brand.primary, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>
                                {a.badge}
                            </span>
                            <span style={{ background: brand.green, color: brand.greenText, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>
                                {a.percentile}
                            </span>
                            <span style={{ fontSize: 18, fontWeight: 700, color: a.score >= 85 ? brand.greenText : a.score >= 75 ? brand.primary : brand.amberText }}>
                                {a.score}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 3: Skills Map ── */
    const skillsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Skills Map', 'خريطة المهارات')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Visualize your competency scores across all assessed skill areas — identify strengths and areas for growth.',
                    'تصوّر درجات كفاءتك عبر جميع مجالات المهارات المُقيَّمة — حدّد نقاط القوة ومجالات التطوير.'
                )}
            </p>

            {/* Skill Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
                {skillScores.map((s, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{s.name}</span>
                            <span style={{ fontSize: 16, fontWeight: 700, color: s.score >= 85 ? brand.greenText : s.score >= 75 ? brand.primary : brand.amberText }}>
                                {s.score}%
                            </span>
                        </div>
                        <div style={{ height: 8, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{
                                width: `${s.score}%`, height: '100%', borderRadius: 99,
                                background: s.score >= 85 ? '#22C55E' : s.score >= 75 ? brand.primary : '#F59E0B',
                            }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Overall Summary */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <BarChart3 size={20} style={{ color: brand.primary }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{t('Overall Summary', 'الملخص العام')}</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
                    {[
                        { label: t('Overall Score', 'الدرجة الإجمالية'), value: '83%' },
                        { label: t('Strongest Skill', 'أقوى مهارة'), value: t('Digital Literacy', 'الإلمام الرقمي') },
                        { label: t('Assessments Taken', 'التقييمات المُنجزة'), value: '3' },
                        { label: t('Badges Earned', 'الشارات المُكتسبة'), value: '3' },
                    ].map((stat, i) => (
                        <div key={i} style={{ background: '#fff', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                            <div style={{ fontSize: 18, fontWeight: 700, color: brand.primary }}>{stat.value}</div>
                            <span style={{ fontSize: 12, color: brand.textSecondary }}>{stat.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ── Tab 4: Recommendations ── */
    const recsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Growth Recommendations', 'توصيات التطوير')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Based on your assessment results, here are tailored recommendations to accelerate your professional development.',
                    'بناءً على نتائج تقييمك، إليك توصيات مخصصة لتسريع تطويرك المهني.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 28 }}>
                {[
                    { title: t('Strengthen Technical Skills', 'عزّز المهارات التقنية'), desc: t('Your technical score of 76% suggests focusing on cloud architecture and system design — consider the AWS Solutions Architect certification', 'درجتك التقنية 76% تشير إلى ضرورة التركيز على هندسة السحابة وتصميم الأنظمة — فكّر في شهادة مهندس حلول AWS'), Icon: Brain, area: t('Technical Knowledge', 'المعرفة التقنية'), score: 76 },
                    { title: t('Develop Leadership Presence', 'طوّر الحضور القيادي'), desc: t('At 78%, your leadership aptitude shows potential — enroll in our UAE Leadership Excellence program for hands-on coaching', 'بنسبة 78%، تُظهر كفاءتك القيادية إمكانات واعدة — سجّل في برنامج التميز القيادي الإماراتي للحصول على تدريب عملي'), Icon: Award, area: t('Leadership', 'القيادة'), score: 78 },
                    { title: t('Advance Communication Skills', 'طوّر مهارات التواصل'), desc: t('Build on your 82% communication score by joining Toastmasters UAE or taking our Advanced Business Writing course', 'ابنِ على درجتك 82% في التواصل من خلال الانضمام إلى Toastmasters الإمارات أو التسجيل في دورة الكتابة التجارية المتقدمة'), Icon: Users, area: t('Communication', 'التواصل'), score: 82 },
                    { title: t('Take the Industry Assessment', 'أكمل التقييم القطاعي'), desc: t("You haven't yet completed an industry-specific assessment — banking & finance or technology sectors are strongly recommended", 'لم تُكمل بعد تقييماً خاصاً بالقطاع — يُوصى بشدة بقطاع المصارف والتمويل أو التكنولوجيا'), Icon: Shield, area: t('Industry', 'قطاعي'), score: null },
                ].map((rec, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <rec.Icon size={20} style={{ color: brand.primary }} />
                            </div>
                            {rec.score && (
                                <span style={{ background: rec.score >= 80 ? brand.green : brand.amber, color: rec.score >= 80 ? brand.greenText : brand.amberText, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>
                                    {rec.area}: {rec.score}%
                                </span>
                            )}
                        </div>
                        <div>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{rec.title}</h4>
                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{rec.desc}</p>
                        </div>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: brand.primary, cursor: 'pointer', marginTop: 'auto' }}>
                            {t('Take Action', 'اتّخذ إجراءً')} <ChevronIcon size={14} />
                        </span>
                    </div>
                ))}
            </div>

            {/* Next Steps */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <TrendingUp size={20} style={{ color: brand.primary }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{t('Suggested Next Assessments', 'التقييمات المقترحة التالية')}</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                        t('Project Management Fundamentals (30 min)', 'أساسيات إدارة المشاريع (30 دقيقة)'),
                        t('Emotional Intelligence Assessment (25 min)', 'تقييم الذكاء العاطفي (25 دقيقة)'),
                        t('Data Analysis & Visualization (40 min)', 'تحليل البيانات والتصوير البياني (40 دقيقة)'),
                    ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CheckCircle size={14} style={{ color: brand.primary }} />
                            <span style={{ fontSize: 13, color: brand.textSecondary }}>{item}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'available', label: t('Available', 'المتاحة'), icon: <Search className="h-4 w-4" />, content: availableTab },
        { id: 'progress', label: t('My Progress', 'تقدّمي'), icon: <TrendingUp className="h-4 w-4" />, content: progressTab },
        { id: 'skills', label: t('Skills Map', 'خريطة المهارات'), icon: <Target className="h-4 w-4" />, content: skillsTab },
        { id: 'recommendations', label: t('Recommendations', 'التوصيات'), icon: <Star className="h-4 w-4" />, content: recsTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('Assessments', 'التقييمات')}
            description={t(
                'Validate your skills with 500+ assessments across technical, leadership, and cognitive categories — earn badges and track your growth',
                'تحقّق من مهاراتك عبر أكثر من 500 تقييم في الفئات التقنية والقيادية والمعرفية — اكسب شارات وتابع نموك'
            )}
            icon={<ClipboardCheck className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="available"
        />
    );
};

export default AssessmentsPage;
