
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import { careerLifecycleAPI, skillGraphAPI, type CareerStage, type UserSkill } from '@/services/intelligenceAPI';
import {
    MessageCircle, Video, BookOpen, Lightbulb, BarChart3,
    Play, Mic, Star, Clock, TrendingUp, Target, Award,
    Users, ChevronRight, ChevronLeft, CheckCircle, Shield, Zap,
    Brain, AlertCircle, UserCheck
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

const InterviewPreparationPage: React.FC = () => {

    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

    // ── Intelligence: Career Stage + Skill Profile ──
    const [careerStage, setCareerStage] = useState<CareerStage | null>(null);
    const [userSkills, setUserSkills] = useState<UserSkill[]>([]);

    useEffect(() => {
        (async () => {
            try {
                const stage = await careerLifecycleAPI.getStage();
                setCareerStage(stage);
            } catch { /* graceful fallback */ }
        })();
        (async () => {
            try {
                const data = await skillGraphAPI.getUserSkills();
                setUserSkills(data.skills || []);
            } catch { /* graceful fallback */ }
        })();
    }, []);

    // Personalized focus based on career stage
    const getFocusAreas = (): { label: string; emphasis: string } => {
        const stage = careerStage?.current_stage || '';
        if (stage === 'candidate' || stage === 'intern')
            return { label: t('Entry Level', 'مستوى مبتدئ'), emphasis: t('Focus on behavioral and situational questions', 'ركّز على الأسئلة السلوكية والمواقف') };
        if (stage === 'mid_career')
            return { label: t('Mid-Career', 'منتصف المسيرة'), emphasis: t('Balance technical depth and leadership scenarios', 'وازن بين العمق التقني وسيناريوهات القيادة') };
        if (stage === 'senior' || stage === 'executive')
            return { label: t('Senior/Executive', 'أقدم/تنفيذي'), emphasis: t('Focus on leadership, strategy, and cultural fit', 'ركّز على القيادة والاستراتيجية والتوافق الثقافي') };
        return { label: t('All Levels', 'جميع المستويات'), emphasis: t('Comprehensive preparation across all question types', 'إعداد شامل عبر جميع أنواع الأسئلة') };
    };

    const strengthSkills = userSkills.filter(s => s.proficiency === 'advanced' || s.proficiency === 'expert').slice(0, 3);
    const growthSkills = userSkills.filter(s => s.proficiency === 'novice' || s.proficiency === 'beginner').slice(0, 3);

    /* ──────────────────────── DATA ──────────────────────── */

    const questionCategories = [
        { title: t('Behavioral', 'سلوكية'), count: 85, desc: t('Past experiences, teamwork, conflict resolution, and leadership scenarios', 'الخبرات السابقة والعمل الجماعي وحل النزاعات وسيناريوهات القيادة'), Icon: Users, catBg: brand.blue, catColor: brand.blueText, level: t('All Levels', 'جميع المستويات') },
        { title: t('Technical', 'تقنية'), count: 120, desc: t('Role-specific technical knowledge, problem-solving, and domain expertise', 'المعرفة التقنية المتخصصة وحل المشكلات والخبرة في المجال'), Icon: Brain, catBg: brand.purple, catColor: brand.purpleText, level: t('Mid–Senior', 'متوسط–أقدم') },
        { title: t('Situational', 'ظرفية'), count: 65, desc: t('Hypothetical workplace scenarios and how you would handle them', 'سيناريوهات افتراضية في بيئة العمل وكيفية التعامل معها'), Icon: AlertCircle, catBg: brand.amber, catColor: brand.amberText, level: t('All Levels', 'جميع المستويات') },
        { title: t('Cultural Fit', 'التوافق الثقافي'), count: 40, desc: t('Values alignment, work style, and UAE workplace culture awareness', 'التوافق القيمي وأسلوب العمل والوعي بثقافة بيئة العمل الإماراتية'), Icon: Shield, catBg: brand.green, catColor: brand.greenText, level: t('All Levels', 'جميع المستويات') },
        { title: t('Leadership', 'القيادة'), count: 55, desc: t('Strategic thinking, team management, and decision-making abilities', 'التفكير الاستراتيجي وإدارة الفريق وقدرات اتخاذ القرار'), Icon: Award, catBg: brand.primarySurface, catColor: brand.primary, level: t('Senior', 'أقدم') },
        { title: t('Problem Solving', 'حل المشكلات'), count: 70, desc: t('Analytical reasoning, case studies, and creative problem approaches', 'التفكير التحليلي ودراسات الحالة والأساليب الإبداعية لحل المشكلات'), Icon: Zap, catBg: brand.red, catColor: brand.redText, level: t('Mid–Senior', 'متوسط–أقدم') },
    ];

    const simulatorModes = [
        { title: t('Quick Practice', 'تمرين سريع'), duration: t('15 min', '15 دقيقة'), questions: 5, desc: t('Short warm-up session with common questions', 'جلسة إحماء قصيرة بأسئلة شائعة'), Icon: Zap, difficulty: t('Easy', 'سهل'), diffKey: 'Easy' },
        { title: t('Standard Session', 'جلسة قياسية'), duration: t('30 min', '30 دقيقة'), questions: 10, desc: t('Balanced mock interview covering key areas', 'مقابلة تجريبية متوازنة تغطي المجالات الرئيسية'), Icon: MessageCircle, difficulty: t('Medium', 'متوسط'), diffKey: 'Medium' },
        { title: t('Full Interview', 'مقابلة كاملة'), duration: t('45 min', '45 دقيقة'), questions: 15, desc: t('Complete mock interview simulating a real session', 'مقابلة تجريبية كاملة تحاكي جلسة حقيقية'), Icon: Video, difficulty: t('Hard', 'صعب'), diffKey: 'Hard' },
        { title: t('Industry-Specific', 'حسب القطاع'), duration: t('30 min', '30 دقيقة'), questions: 10, desc: t('Tailored to Banking, Tech, Healthcare, or Government', 'مصمّمة للمصارف والتقنية والرعاية الصحية أو الحكومة'), Icon: Target, difficulty: t('Medium', 'متوسط'), diffKey: 'Medium' },
    ];

    const industries = [
        t('Banking & Finance', 'المصارف والتمويل'),
        t('Technology', 'التكنولوجيا'),
        t('Healthcare', 'الرعاية الصحية'),
        t('Government', 'الحكومة'),
        t('Energy & Oil', 'الطاقة والنفط'),
        t('Real Estate', 'العقارات'),
    ];

    const generalTips = [
        { title: t('Research the Company', 'ابحث عن الشركة'), desc: t("Study the company's history, values, recent projects, and leadership team before the interview", 'ادرس تاريخ الشركة وقيمها ومشاريعها الأخيرة وفريقها القيادي قبل المقابلة'), Icon: BookOpen },
        { title: t('Practice STAR Method', 'تدرّب على طريقة STAR'), desc: t('Structure answers using Situation, Task, Action, Result for behavioral questions', 'نظّم إجاباتك باستخدام الموقف والمهمة والإجراء والنتيجة للأسئلة السلوكية'), Icon: Star },
        { title: t('Prepare Your Questions', 'حضّر أسئلتك'), desc: t('Have 3–5 thoughtful questions ready about the role, team, and growth opportunities', 'جهّز 3–5 أسئلة مدروسة عن الدور والفريق وفرص النمو'), Icon: MessageCircle },
        { title: t('Dress Professionally', 'ارتدِ ملابس مهنية'), desc: t('Follow UAE business dress code — formal attire shows respect and professionalism', 'اتّبع قواعد اللباس المهني في الإمارات — الملابس الرسمية تعكس الاحترام والمهنية'), Icon: UserCheck },
        { title: t('Be Punctual', 'كن دقيقاً في الموعد'), desc: t('Arrive 10–15 minutes early; for virtual interviews test your setup 30 minutes before', 'احضر قبل 10–15 دقيقة؛ وللمقابلات الافتراضية اختبر إعداداتك قبل 30 دقيقة'), Icon: Clock },
        { title: t('Follow Up Within 24h', 'تابع خلال 24 ساعة'), desc: t('Send a personalized thank-you email referencing specific discussion points', 'أرسل بريد شكر شخصي يشير إلى نقاط محددة من النقاش'), Icon: CheckCircle },
    ];

    const uaeTips = [
        { title: t('Understand UAE Culture', 'افهم ثقافة الإمارات'), desc: t('Demonstrate awareness of Emirati values, traditions, and the multicultural work environment', 'أظهر معرفتك بالقيم والتقاليد الإماراتية وبيئة العمل متعددة الثقافات') },
        { title: t('Align with D33 & Talent33', 'تماشَ مع D33 وTalent33'), desc: t("Show how your skills contribute to Dubai's economic diversification and national talent goals", 'وضّح كيف تسهم مهاراتك في التنويع الاقتصادي لدبي وأهداف الكوادر الوطنية') },
        { title: t('Highlight Multilingual Skills', 'أبرز مهاراتك اللغوية'), desc: t('Arabic proficiency is valued — mention language skills and cross-cultural experience', 'إتقان العربية محل تقدير — اذكر مهاراتك اللغوية وتجربتك بين الثقافات') },
    ];

    const feedbackMetrics = [
        { label: t('Overall Score', 'الدرجة الإجمالية'), value: 82, max: 100 },
        { label: t('Communication', 'التواصل'), value: 78, max: 100 },
        { label: t('Confidence', 'الثقة'), value: 85, max: 100 },
        { label: t('Clarity', 'الوضوح'), value: 80, max: 100 },
        { label: t('Relevance', 'الصلة بالموضوع'), value: 88, max: 100 },
        { label: t('Professionalism', 'المهنية'), value: 90, max: 100 },
    ];

    const sessionHistory = [
        { date: t('15 Feb 2026', '15 فبراير 2026'), type: t('Full Interview', 'مقابلة كاملة'), score: 82, industry: t('Technology', 'التكنولوجيا') },
        { date: t('10 Feb 2026', '10 فبراير 2026'), type: t('Quick Practice', 'تمرين سريع'), score: 76, industry: t('Banking', 'المصارف') },
        { date: t('5 Feb 2026', '5 فبراير 2026'), type: t('Standard Session', 'جلسة قياسية'), score: 88, industry: t('Government', 'الحكومة') },
    ];

    const stats = [
        { value: '500+', label: t('Questions', 'سؤال'), icon: BookOpen },
        { value: '6', label: t('Categories', 'فئات'), icon: Target },
        { value: '4', label: t('Sim. Modes', 'أوضاع المحاكاة'), icon: Video },
        { value: '85%', label: t('Success Rate', 'نسبة النجاح'), icon: TrendingUp },
    ];

    /* ── Tab 1: Question Bank ── */
    const questionsTab = (
        <div>
            {/* Intelligence: Personalized Interview Focus */}
            {(careerStage || userSkills.length > 0) && (
                <div style={{ background: brand.primarySurface, border: `1px solid ${brand.primary}22`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <Zap size={16} style={{ color: brand.primary }} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>
                            {t('Your Personalized Focus', 'تركيزك الشخصي')}
                        </span>
                        {careerStage && (
                            <span style={{ background: brand.primary, color: '#fff', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6, marginLeft: 'auto' }}>
                                {getFocusAreas().label}
                            </span>
                        )}
                    </div>
                    {careerStage && (
                        <p style={{ fontSize: 13, color: brand.textSecondary, margin: '0 0 10px 0', lineHeight: 1.5 }}>
                            {getFocusAreas().emphasis}
                        </p>
                    )}
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        {strengthSkills.length > 0 && (
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: brand.greenText, marginBottom: 4 }}>
                                    {t('Your Strengths', 'نقاط قوتك')}
                                </div>
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                    {strengthSkills.map((s, i) => (
                                        <span key={i} style={{ background: brand.green, color: brand.greenText, fontSize: 11, padding: '2px 8px', borderRadius: 6 }}>
                                            {s.skill_name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {growthSkills.length > 0 && (
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: brand.amberText, marginBottom: 4 }}>
                                    {t('Areas to Prepare', 'مجالات للتحضير')}
                                </div>
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                    {growthSkills.map((s, i) => (
                                        <span key={i} style={{ background: brand.amber, color: brand.amberText, fontSize: 11, padding: '2px 8px', borderRadius: 6 }}>
                                            {s.skill_name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Interview Question Bank', 'بنك أسئلة المقابلات')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Browse 500+ curated questions across 6 categories — practice answers for your target industry and experience level.',
                    'تصفح أكثر من 500 سؤال مختار عبر 6 فئات — تدرّب على الإجابات لقطاعك ومستوى خبرتك المستهدف.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {questionCategories.map((cat, i) => (
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
                        {/* Icon + Count */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: cat.catBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <cat.Icon size={22} style={{ color: cat.catColor }} />
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <span style={{ background: brand.primarySurface, color: brand.primary, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>
                                    {cat.count} {t('Qs', 'س')}
                                </span>
                                <span style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 6 }}>
                                    {cat.level}
                                </span>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{cat.title}</h3>
                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{cat.desc}</p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: brand.primary, marginTop: 'auto' }}>
                            {t('Practice Now', 'تدرّب الآن')} <ChevronIcon size={14} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Common Questions Preview */}
            <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                {[
                    {
                        title: t('Common Questions', 'أسئلة شائعة'),
                        items: [
                            t('Tell me about yourself', 'حدّثني عن نفسك'),
                            t('Why do you want this job?', 'لماذا تريد هذه الوظيفة؟'),
                            t('What are your strengths?', 'ما هي نقاط قوتك؟'),
                            t('Where do you see yourself in 5 years?', 'أين ترى نفسك بعد 5 سنوات؟'),
                        ],
                        tag: t('Basic', 'أساسي'),
                    },
                    {
                        title: t('UAE-Specific Questions', 'أسئلة خاصة بالإمارات'),
                        items: [
                            t('How do you adapt to UAE culture?', 'كيف تتكيّف مع ثقافة الإمارات؟'),
                            t('Contribution to D33 and Talent33?', 'مساهمتك في D33 وTalent33؟'),
                            t('Experience in diverse teams?', 'خبرتك في فرق متنوعة؟'),
                            t('Understanding of Emiratisation?', 'فهمك للتوطين؟'),
                        ],
                        tag: t('Strategic', 'استراتيجي'),
                    },
                ].map((section, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, marginBottom: 14 }}>{section.title}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {section.items.map((q, j) => (
                                <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: j < section.items.length - 1 ? `1px solid ${brand.border}` : 'none' }}>
                                    <span style={{ fontSize: 13, color: brand.textPrimary }}>{q}</span>
                                    <span style={{ background: brand.primarySurface, color: brand.primary, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, whiteSpace: 'nowrap' }}>{section.tag}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: Mock Simulator ── */
    const simulatorTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Interview Simulator', 'محاكي المقابلات')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Practice in a realistic mock interview environment — choose your mode, industry, and receive AI-powered feedback on your performance.',
                    'تدرّب في بيئة مقابلات تجريبية واقعية — اختر وضعك وقطاعك واحصل على ملاحظات مدعومة بالذكاء الاصطناعي عن أدائك.'
                )}
            </p>

            {/* Simulator Modes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 28 }}>
                {simulatorModes.map((mode, i) => (
                    <div
                        key={i}
                        style={{
                            background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`,
                            padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
                            transition: 'box-shadow .2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <mode.Icon size={22} style={{ color: brand.primary }} />
                            </div>
                            <span style={{
                                background: mode.diffKey === 'Easy' ? brand.green : mode.diffKey === 'Medium' ? brand.amber : brand.red,
                                color: mode.diffKey === 'Easy' ? brand.greenText : mode.diffKey === 'Medium' ? brand.amberText : brand.redText,
                                fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
                            }}>
                                {mode.difficulty}
                            </span>
                        </div>

                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{mode.title}</h3>
                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{mode.desc}</p>
                        </div>

                        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: brand.textSecondary }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> {mode.duration}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MessageCircle size={14} /> {mode.questions} {t('questions', 'سؤال')}</span>
                        </div>

                        <button style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            background: brand.primary, color: '#fff', border: 'none',
                            padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            marginTop: 'auto',
                        }}>
                            <Play size={16} /> {t('Start Session', 'ابدأ الجلسة')}
                        </button>
                    </div>
                ))}
            </div>

            {/* Industry Selection */}
            <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, marginBottom: 14 }}>{t('Choose Your Industry', 'اختر قطاعك')}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {industries.map((ind, i) => (
                        <button
                            key={i}
                            style={{
                                background: i === 0 ? brand.primarySurface : '#F3F4F6',
                                color: i === 0 ? brand.primary : brand.textSecondary,
                                border: `1px solid ${i === 0 ? brand.primary : brand.border}`,
                                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                                transition: 'all .2s',
                            }}
                        >
                            {ind}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ── Tab 3: Tips & Strategies ── */
    const tipsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Tips & Strategies', 'نصائح واستراتيجيات')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Expert advice and proven strategies to help you prepare, perform, and follow up — with UAE-specific guidance for local interviews.',
                    'نصائح خبراء واستراتيجيات مثبتة لمساعدتك في التحضير والأداء والمتابعة — مع إرشادات خاصة بالإمارات للمقابلات المحلية.'
                )}
            </p>

            {/* General Tips */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 28 }}>
                {generalTips.map((tip, i) => (
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

            {/* UAE-Specific Tips */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <Shield size={20} style={{ color: brand.primary }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{t('UAE-Specific Interview Tips', 'نصائح المقابلات الخاصة بالإمارات')}</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                    {uaeTips.map((tip, i) => (
                        <div key={i} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <CheckCircle size={16} style={{ color: brand.primary }} />
                                <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{tip.title}</h4>
                            </div>
                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{tip.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ── Tab 4: Performance & Feedback ── */
    const feedbackTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Performance & Feedback', 'الأداء والملاحظات')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Track your mock interview scores, see detailed breakdowns, and identify areas for improvement.',
                    'تتبّع درجات مقابلاتك التجريبية واطّلع على تفاصيل الأداء وحدّد مجالات التحسين.'
                )}
            </p>

            {/* Score Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
                {feedbackMetrics.map((m, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, textAlign: 'center' }}>
                        <span style={{ fontSize: 13, color: brand.textSecondary, fontWeight: 500 }}>{m.label}</span>
                        <div style={{ fontSize: 28, fontWeight: 700, color: m.value >= 85 ? brand.greenText : m.value >= 75 ? brand.primary : brand.amberText, margin: '4px 0 8px' }}>
                            {m.value}%
                        </div>
                        <div style={{ height: 6, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${m.value}%`, height: '100%', background: m.value >= 85 ? '#22C55E' : m.value >= 75 ? brand.primary : '#F59E0B', borderRadius: 99 }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Session History */}
            <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, marginBottom: 14 }}>{t('Session History', 'سجل الجلسات')}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {/* Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 1fr', gap: 12, padding: '8px 0', borderBottom: `1px solid ${brand.border}`, fontSize: 12, fontWeight: 600, color: brand.textSecondary }}>
                        <span>{t('Date', 'التاريخ')}</span><span>{t('Type', 'النوع')}</span><span>{t('Score', 'الدرجة')}</span><span>{t('Industry', 'القطاع')}</span>
                    </div>
                    {sessionHistory.map((s, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 1fr', gap: 12, padding: '12px 0', borderBottom: i < sessionHistory.length - 1 ? `1px solid ${brand.border}` : 'none', fontSize: 13, alignItems: 'center' }}>
                            <span style={{ color: brand.textPrimary, fontWeight: 500 }}>{s.date}</span>
                            <span style={{ color: brand.textSecondary }}>{s.type}</span>
                            <span style={{
                                fontWeight: 600,
                                color: s.score >= 85 ? brand.greenText : s.score >= 75 ? brand.primary : brand.amberText,
                            }}>{s.score}%</span>
                            <span style={{ background: brand.primarySurface, color: brand.primary, fontSize: 11, fontWeight: 500, padding: '2px 10px', borderRadius: 6, width: 'fit-content' }}>{s.industry}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Improvement Suggestions */}
            <div style={{ marginTop: 16, background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <TrendingUp size={18} style={{ color: brand.primary }} />
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{t('Areas for Improvement', 'مجالات التحسين')}</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                        t('Practice structuring answers using the STAR method', 'تدرّب على هيكلة إجاباتك باستخدام طريقة STAR'),
                        t('Work on maintaining eye contact during video interviews', 'اعمل على الحفاظ على التواصل البصري أثناء المقابلات المرئية'),
                        t('Prepare more specific examples for behavioral questions', 'حضّر أمثلة أكثر تحديداً للأسئلة السلوكية'),
                    ].map((tip, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <ChevronIcon size={14} style={{ color: brand.primary }} />
                            <span style={{ fontSize: 13, color: brand.textSecondary }}>{tip}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    const tabs = [
        { id: 'questions', label: t('Question Bank', 'بنك الأسئلة'), icon: <BookOpen className="h-4 w-4" />, content: questionsTab },
        { id: 'simulator', label: t('Mock Simulator', 'محاكي المقابلات'), icon: <Video className="h-4 w-4" />, content: simulatorTab },
        { id: 'tips', label: t('Tips & Strategies', 'نصائح واستراتيجيات'), icon: <Lightbulb className="h-4 w-4" />, content: tipsTab },
        { id: 'feedback', label: t('Performance', 'الأداء'), icon: <BarChart3 className="h-4 w-4" />, content: feedbackTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('Interview Preparation', 'التحضير للمقابلات')}
            description={t(
                'Master your interviews with 500+ curated questions, AI-powered mock simulators, and expert tips tailored for the UAE job market',
                'أتقن مقابلاتك مع أكثر من 500 سؤال مختار ومحاكيات تجريبية بالذكاء الاصطناعي ونصائح خبراء مصممة لسوق العمل الإماراتي'
            )}
            icon={<MessageCircle className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="questions"
        />
    );
};

export default InterviewPreparationPage;
