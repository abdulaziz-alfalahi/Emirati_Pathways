
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import { restClient } from '@/utils/api';
import { careerLifecycleAPI, skillGraphAPI, type CareerStage, type UserSkill } from '@/services/intelligenceAPI';
import {
    MessageCircle, Video, BookOpen, Lightbulb, BarChart3,
    Play, Star, Clock, Target, Award,
    Users, ChevronRight, ChevronLeft, CheckCircle, Shield, Zap,
    Brain, AlertCircle, UserCheck, Loader2, X, Sparkles, ArrowRight, ArrowLeft
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

interface Question {
    id: number; external_key: string; category: string;
    question_en: string; question_ar?: string; hint_en?: string; hint_ar?: string;
    industry?: string; difficulty?: string; is_uae?: boolean; is_common?: boolean;
}
interface PracticeSpec { source: 'questions' | 'simulator'; mode: string; category: string | null; industry: string | null; questions: Question[]; }

const CATEGORY_META: Record<string, { title: [string, string]; desc: [string, string]; Icon: any; bg: string; color: string }> = {
    behavioral: { title: ['Behavioral', 'سلوكية'], desc: ['Past experiences, teamwork, conflict resolution, and leadership scenarios', 'الخبرات السابقة والعمل الجماعي وحل النزاعات وسيناريوهات القيادة'], Icon: Users, bg: brand.blue, color: brand.blueText },
    technical: { title: ['Technical', 'تقنية'], desc: ['Role-specific technical knowledge, problem-solving, and domain expertise', 'المعرفة التقنية المتخصصة وحل المشكلات والخبرة في المجال'], Icon: Brain, bg: brand.purple, color: brand.purpleText },
    situational: { title: ['Situational', 'ظرفية'], desc: ['Hypothetical workplace scenarios and how you would handle them', 'سيناريوهات افتراضية في بيئة العمل وكيفية التعامل معها'], Icon: AlertCircle, bg: brand.amber, color: brand.amberText },
    cultural_fit: { title: ['Cultural Fit', 'التوافق الثقافي'], desc: ['Values alignment, work style, and UAE workplace culture awareness', 'التوافق القيمي وأسلوب العمل والوعي بثقافة بيئة العمل الإماراتية'], Icon: Shield, bg: brand.green, color: brand.greenText },
    leadership: { title: ['Leadership', 'القيادة'], desc: ['Strategic thinking, team management, and decision-making abilities', 'التفكير الاستراتيجي وإدارة الفريق وقدرات اتخاذ القرار'], Icon: Award, bg: brand.primarySurface, color: brand.primary },
    problem_solving: { title: ['Problem Solving', 'حل المشكلات'], desc: ['Analytical reasoning, case studies, and creative problem approaches', 'التفكير التحليلي ودراسات الحالة والأساليب الإبداعية لحل المشكلات'], Icon: Zap, bg: brand.red, color: brand.redText },
};

const INDUSTRIES: { key: string; label: [string, string] }[] = [
    { key: 'general', label: ['All Industries', 'جميع القطاعات'] },
    { key: 'banking', label: ['Banking & Finance', 'المصارف والتمويل'] },
    { key: 'technology', label: ['Technology', 'التكنولوجيا'] },
    { key: 'healthcare', label: ['Healthcare', 'الرعاية الصحية'] },
    { key: 'government', label: ['Government', 'الحكومة'] },
    { key: 'energy', label: ['Energy & Oil', 'الطاقة والنفط'] },
    { key: 'real_estate', label: ['Real Estate', 'العقارات'] },
];

/* ─────────────────── PRACTICE RUNNER (real AI feedback) ─────────────────── */

const PracticeRunner: React.FC<{
    spec: PracticeSpec;
    isRTL: boolean;
    t: (en: string, ar: string) => string;
    onExit: () => void;
    onComplete: (payload: { mode: string; category: string | null; industry: string | null; total_questions: number; answered: number }) => void;
}> = ({ spec, isRTL, t, onExit, onComplete }) => {
    const { questions } = spec;
    const [idx, setIdx] = useState(0);
    const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ''));
    const [feedback, setFeedback] = useState<string | null>(null);
    const [fbLoading, setFbLoading] = useState(false);
    const [fbError, setFbError] = useState(false);
    const [done, setDone] = useState(false);

    const q = questions[idx];
    const qText = (isRTL && q.question_ar) ? q.question_ar : q.question_en;
    const hText = (isRTL && q.hint_ar) ? q.hint_ar : q.hint_en;
    const setAns = (v: string) => setAnswers(a => a.map((x, i) => (i === idx ? v : x)));

    const getFeedback = async () => {
        setFbLoading(true); setFbError(false); setFeedback(null);
        try {
            const resp = await restClient.post('/api/ai/assist', {
                feature: 'interview_feedback',
                language: isRTL ? 'ar' : 'en',
                context: { question: qText, answer: answers[idx] || '', category: q.category },
            });
            if (resp.data?.success && resp.data?.text) setFeedback(resp.data.text);
            else setFbError(true);
        } catch { setFbError(true); }
        finally { setFbLoading(false); }
    };

    const goTo = (n: number) => { setFeedback(null); setFbError(false); setIdx(n); };

    if (done) {
        const answered = answers.filter(a => a.trim()).length;
        return (
            <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 40, textAlign: 'center' }}>
                <CheckCircle size={40} style={{ color: brand.primary, marginBottom: 12 }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, color: brand.textPrimary, margin: '0 0 6px' }}>{t('Practice complete', 'اكتمل التمرين')}</h3>
                <p style={{ fontSize: 14, color: brand.textSecondary, margin: '0 0 20px' }}>
                    {t(`You answered ${answered} of ${questions.length} questions. This session is saved to your Performance tab.`,
                       `أجبت عن ${answered} من ${questions.length} سؤالاً. حُفظت هذه الجلسة في تبويب الأداء.`)}
                </p>
                <button onClick={() => onComplete({ mode: spec.mode, category: spec.category, industry: spec.industry, total_questions: questions.length, answered })}
                    style={{ background: brand.primary, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    {t('Done', 'تم')}
                </button>
            </div>
        );
    }

    return (
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 24 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: brand.primary }}>
                        {t(`Question ${idx + 1} of ${questions.length}`, `السؤال ${idx + 1} من ${questions.length}`)}
                    </span>
                    <span style={{ background: brand.primarySurface, color: brand.primary, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6 }}>
                        {CATEGORY_META[q.category]?.title[isRTL ? 1 : 0] || q.category}
                    </span>
                </div>
                <button onClick={onExit} title={t('Exit practice', 'إنهاء التمرين')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                    <X size={20} style={{ color: brand.textSecondary }} />
                </button>
            </div>

            {/* Progress bar */}
            <div style={{ height: 6, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden', marginBottom: 18 }}>
                <div style={{ width: `${((idx + 1) / questions.length) * 100}%`, height: '100%', background: brand.primary, borderRadius: 99, transition: 'width .2s' }} />
            </div>

            {/* Question */}
            <h3 style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary, margin: '0 0 10px', lineHeight: 1.5 }}>{qText}</h3>
            {hText && (
                <div style={{ display: 'flex', gap: 8, background: brand.primarySurface, borderRadius: 8, padding: '10px 12px', marginBottom: 16 }}>
                    <Lightbulb size={16} style={{ color: brand.primary, flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 12.5, color: brand.textSecondary, lineHeight: 1.5 }}>{hText}</span>
                </div>
            )}

            {/* Answer */}
            <label style={{ fontSize: 12, fontWeight: 600, color: brand.textSecondary, display: 'block', marginBottom: 6 }}>{t('Your answer', 'إجابتك')}</label>
            <textarea
                value={answers[idx]}
                onChange={e => setAns(e.target.value)}
                rows={6}
                placeholder={t('Type your answer here, then get AI feedback...', 'اكتب إجابتك هنا ثم احصل على ملاحظات الذكاء الاصطناعي...')}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13, resize: 'vertical', boxSizing: 'border-box', direction: isRTL ? 'rtl' : 'ltr', lineHeight: 1.6 }}
            />

            {/* AI feedback */}
            <div style={{ marginTop: 12 }}>
                <button
                    onClick={getFeedback}
                    disabled={fbLoading || !answers[idx].trim()}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: (!answers[idx].trim() || fbLoading) ? '#9CA3AF' : brand.primary,
                        color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}>
                    {fbLoading ? <><Loader2 size={14} className="animate-spin" /> {t('Analyzing...', 'جارٍ التحليل...')}</> : <><Sparkles size={15} /> {t('Get AI feedback', 'احصل على ملاحظات الذكاء الاصطناعي')}</>}
                </button>
            </div>

            {feedback && (
                <div style={{ marginTop: 14, background: '#F0FDFA', border: `1px solid ${brand.primary}33`, borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Sparkles size={15} style={{ color: brand.primary }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: brand.textPrimary }}>{t('Coach feedback', 'ملاحظات المدرب')}</span>
                    </div>
                    <div style={{ fontSize: 13, color: brand.textPrimary, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{feedback}</div>
                </div>
            )}
            {fbError && (
                <div style={{ marginTop: 14, background: brand.amber, border: `1px solid ${brand.amberText}22`, borderRadius: 10, padding: 12, fontSize: 13, color: brand.amberText }}>
                    {t('The AI coach is unavailable right now. Your answer is still saved — try feedback again shortly.', 'مدرب الذكاء الاصطناعي غير متاح حالياً. إجابتك محفوظة — حاول الحصول على الملاحظات بعد قليل.')}
                </div>
            )}

            {/* Nav */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, paddingTop: 16, borderTop: `1px solid ${brand.border}` }}>
                <button
                    onClick={() => goTo(idx - 1)}
                    disabled={idx === 0}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff', color: idx === 0 ? '#D1D5DB' : brand.textSecondary, border: `1px solid ${brand.border}`, padding: '8px 14px', borderRadius: 8, fontSize: 13, cursor: idx === 0 ? 'not-allowed' : 'pointer' }}>
                    {isRTL ? <ArrowRight size={14} /> : <ArrowLeft size={14} />} {t('Previous', 'السابق')}
                </button>
                {idx < questions.length - 1 ? (
                    <button onClick={() => goTo(idx + 1)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: brand.primary, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        {t('Next', 'التالي')} {isRTL ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                    </button>
                ) : (
                    <button onClick={() => setDone(true)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: brand.primary, color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        <CheckCircle size={15} /> {t('Finish', 'إنهاء')}
                    </button>
                )}
            </div>
        </div>
    );
};

/* ──────────────────────── COMPONENT ──────────────────────── */

const InterviewPreparationPage: React.FC = () => {

    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

    // Intelligence: Career Stage + Skill Profile
    const [careerStage, setCareerStage] = useState<CareerStage | null>(null);
    const [userSkills, setUserSkills] = useState<UserSkill[]>([]);

    // Real question bank + sessions
    const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [commonQuestions, setCommonQuestions] = useState<Question[]>([]);
    const [uaeQuestions, setUaeQuestions] = useState<Question[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(true);

    // Practice runner state
    const [practice, setPractice] = useState<PracticeSpec | null>(null);
    const [practiceLoading, setPracticeLoading] = useState(false);
    const [selectedIndustry, setSelectedIndustry] = useState('general');

    const loadSessions = useCallback(async () => {
        setLoadingSessions(true);
        try {
            const resp = await restClient.get('/api/interview-prep/sessions');
            setSessions(resp.data?.sessions || []);
        } catch { /* graceful */ }
        finally { setLoadingSessions(false); }
    }, []);

    useEffect(() => {
        (async () => { try { setCareerStage(await careerLifecycleAPI.getStage()); } catch { /* */ } })();
        (async () => { try { const d = await skillGraphAPI.getUserSkills(); setUserSkills(d.skills || []); } catch { /* */ } })();
        (async () => {
            try {
                const resp = await restClient.get('/api/interview-prep/categories');
                const counts: Record<string, number> = {};
                (resp.data?.categories || []).forEach((c: any) => { counts[c.category] = c.count; });
                setCategoryCounts(counts);
                setTotalQuestions(resp.data?.total || 0);
            } catch { /* */ }
        })();
        (async () => {
            try {
                const resp = await restClient.get('/api/interview-prep/questions', { params: { limit: 100 } });
                const qs: Question[] = resp.data?.questions || [];
                setCommonQuestions(qs.filter(q => q.is_common).slice(0, 4));
                setUaeQuestions(qs.filter(q => q.is_uae).slice(0, 4));
            } catch { /* */ }
        })();
        loadSessions();
    }, [loadSessions]);

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

    /* ── Start a practice run (real questions from the bank) ── */
    const startPractice = async (opts: { source: 'questions' | 'simulator'; mode: string; category?: string; industry?: string; count?: number }) => {
        setPracticeLoading(true);
        try {
            const params: Record<string, string | number> = { limit: 100 };
            if (opts.category) params.category = opts.category;
            if (opts.industry && opts.industry !== 'general') params.industry = opts.industry;
            const resp = await restClient.get('/api/interview-prep/questions', { params });
            let qs: Question[] = resp.data?.questions || [];
            // Shuffle for variety, then cap to the requested count.
            qs = [...qs].sort(() => Math.random() - 0.5);
            if (opts.count) qs = qs.slice(0, opts.count);
            if (!qs.length) return;
            setPractice({ source: opts.source, mode: opts.mode, category: opts.category || null, industry: opts.industry || null, questions: qs });
        } catch { /* */ }
        finally { setPracticeLoading(false); }
    };

    const completePractice = async (payload: { mode: string; category: string | null; industry: string | null; total_questions: number; answered: number }) => {
        try { await restClient.post('/api/interview-prep/sessions', payload); } catch { /* */ }
        setPractice(null);
        loadSessions();
    };

    const stats = [
        { value: String(totalQuestions || Object.values(categoryCounts).reduce((a, b) => a + b, 0)), label: t('Questions', 'أسئلة'), icon: BookOpen },
        { value: String(Object.keys(categoryCounts).length || 6), label: t('Categories', 'فئات'), icon: Target },
        { value: String(sessions.length), label: t('Your Sessions', 'جلساتك'), icon: BarChart3 },
    ];

    /* ── Tab 1: Question Bank ──
       The stopPropagation wrapper prevents EducationPathwayLayout's content-click
       delegation from firing a false "Coming soon / under development" toast on
       these fully-functional buttons. */
    const questionsTab = practice?.source === 'questions' ? (
        <div onClick={e => e.stopPropagation()}>
            <PracticeRunner spec={practice} isRTL={isRTL} t={t} onExit={() => setPractice(null)} onComplete={completePractice} />
        </div>
    ) : (
        <div onClick={e => e.stopPropagation()}>
            {/* Personalized Focus (real) */}
            {(careerStage || userSkills.length > 0) && (
                <div style={{ background: brand.primarySurface, border: `1px solid ${brand.primary}22`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <Zap size={16} style={{ color: brand.primary }} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{t('Your Personalized Focus', 'تركيزك الشخصي')}</span>
                        {careerStage && (
                            <span style={{ background: brand.primary, color: '#fff', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6, marginInlineStart: 'auto' }}>
                                {getFocusAreas().label}
                            </span>
                        )}
                    </div>
                    {careerStage && <p style={{ fontSize: 13, color: brand.textSecondary, margin: '0 0 10px 0', lineHeight: 1.5 }}>{getFocusAreas().emphasis}</p>}
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        {strengthSkills.length > 0 && (
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: brand.greenText, marginBottom: 4 }}>{t('Your Strengths', 'نقاط قوتك')}</div>
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                    {strengthSkills.map((s, i) => <span key={i} style={{ background: brand.green, color: brand.greenText, fontSize: 11, padding: '2px 8px', borderRadius: 6 }}>{s.skill_name}</span>)}
                                </div>
                            </div>
                        )}
                        {growthSkills.length > 0 && (
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: brand.amberText, marginBottom: 4 }}>{t('Areas to Prepare', 'مجالات للتحضير')}</div>
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                    {growthSkills.map((s, i) => <span key={i} style={{ background: brand.amber, color: brand.amberText, fontSize: 11, padding: '2px 8px', borderRadius: 6 }}>{s.skill_name}</span>)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>{t('Interview Question Bank', 'بنك أسئلة المقابلات')}</h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    `Practice ${totalQuestions || 'curated'} real interview questions across ${Object.keys(categoryCounts).length || 6} categories. Pick a category, answer, and get instant AI coaching.`,
                    `تدرّب على ${totalQuestions || ''} سؤال مقابلة حقيقي عبر ${Object.keys(categoryCounts).length || 6} فئات. اختر فئة، أجب، واحصل على توجيه فوري بالذكاء الاصطناعي.`
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {Object.keys(CATEGORY_META).map((key) => {
                    const meta = CATEGORY_META[key];
                    const count = categoryCounts[key] || 0;
                    return (
                        <div key={key}
                            style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, transition: 'box-shadow .2s' }}
                            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)')}
                            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ width: 44, height: 44, borderRadius: 10, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <meta.Icon size={22} style={{ color: meta.color }} />
                                </div>
                                <span style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>
                                    {count} {t('questions', 'سؤال')}
                                </span>
                            </div>
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{meta.title[isRTL ? 1 : 0]}</h3>
                                <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{meta.desc[isRTL ? 1 : 0]}</p>
                            </div>
                            <button
                                onClick={() => startPractice({ source: 'questions', mode: 'category', category: key })}
                                disabled={practiceLoading || count === 0}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: count === 0 ? '#F3F4F6' : brand.primary, color: count === 0 ? brand.textSecondary : '#fff', border: 'none', padding: '9px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: count === 0 ? 'default' : 'pointer', marginTop: 'auto' }}>
                                {practiceLoading ? <Loader2 size={14} className="animate-spin" /> : <>{t('Practice Now', 'تدرّب الآن')} <ChevronIcon size={14} /></>}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Real common + UAE questions (single-question practice) */}
            <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                {[
                    { title: t('Common Questions', 'أسئلة شائعة'), tag: t('Basic', 'أساسي'), items: commonQuestions },
                    { title: t('UAE-Specific Questions', 'أسئلة خاصة بالإمارات'), tag: t('Strategic', 'استراتيجي'), items: uaeQuestions },
                ].map((section, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, marginBottom: 14 }}>{section.title}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {section.items.length === 0 ? (
                                <span style={{ fontSize: 13, color: brand.textSecondary }}>{t('Loading...', 'جارٍ التحميل...')}</span>
                            ) : section.items.map((q, j) => (
                                <button key={j}
                                    onClick={() => setPractice({ source: 'questions', mode: 'single', category: q.category, industry: null, questions: [q] })}
                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: j < section.items.length - 1 ? `1px solid ${brand.border}` : 'none', background: 'none', border: 'none', cursor: 'pointer', textAlign: isRTL ? 'right' : 'left', width: '100%' }}>
                                    <span style={{ fontSize: 13, color: brand.textPrimary }}>{(isRTL && q.question_ar) ? q.question_ar : q.question_en}</span>
                                    <span style={{ background: brand.primarySurface, color: brand.primary, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, whiteSpace: 'nowrap' }}>{section.tag}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: Mock Simulator ── */
    const simulatorModes = [
        { key: 'quick', title: t('Quick Practice', 'تمرين سريع'), duration: t('~10 min', '~10 دقائق'), count: 5, desc: t('Short warm-up with mixed questions', 'إحماء قصير بأسئلة متنوعة'), Icon: Zap, difficulty: t('Easy', 'سهل'), diffKey: 'Easy' },
        { key: 'standard', title: t('Standard Session', 'جلسة قياسية'), duration: t('~20 min', '~20 دقيقة'), count: 10, desc: t('Balanced mock covering key areas', 'مقابلة متوازنة تغطي المجالات الرئيسية'), Icon: MessageCircle, difficulty: t('Medium', 'متوسط'), diffKey: 'Medium' },
        { key: 'full', title: t('Full Interview', 'مقابلة كاملة'), duration: t('~35 min', '~35 دقيقة'), count: 15, desc: t('Complete mock simulating a real session', 'مقابلة كاملة تحاكي جلسة حقيقية'), Icon: Video, difficulty: t('Hard', 'صعب'), diffKey: 'Hard' },
        { key: 'industry', title: t('Industry-Specific', 'حسب القطاع'), duration: t('~20 min', '~20 دقيقة'), count: 10, desc: t('Filtered to your selected industry below', 'مصفّاة حسب القطاع الذي تختاره أدناه'), Icon: Target, difficulty: t('Medium', 'متوسط'), diffKey: 'Medium' },
    ];

    const simulatorTab = practice?.source === 'simulator' ? (
        <div onClick={e => e.stopPropagation()}>
            <PracticeRunner spec={practice} isRTL={isRTL} t={t} onExit={() => setPractice(null)} onComplete={completePractice} />
        </div>
    ) : (
        <div onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>{t('Interview Simulator', 'محاكي المقابلات')}</h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t('Run a timed mock interview from the real question bank and get AI feedback on each answer. Choose a mode — and an industry for the industry-specific mode.',
                   'أجرِ مقابلة تجريبية من بنك الأسئلة الحقيقي واحصل على ملاحظات الذكاء الاصطناعي لكل إجابة. اختر وضعاً — وقطاعاً لوضع القطاع المحدد.')}
            </p>

            {/* Industry selection (real, drives the industry mode) */}
            <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, marginBottom: 14 }}>{t('Choose Your Industry', 'اختر قطاعك')}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {INDUSTRIES.map((ind) => (
                        <button key={ind.key} onClick={() => setSelectedIndustry(ind.key)}
                            style={{ background: ind.key === selectedIndustry ? brand.primarySurface : '#F3F4F6', color: ind.key === selectedIndustry ? brand.primary : brand.textSecondary, border: `1px solid ${ind.key === selectedIndustry ? brand.primary : brand.border}`, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all .2s' }}>
                            {ind.label[isRTL ? 1 : 0]}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {simulatorModes.map((mode) => (
                    <div key={mode.key}
                        style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, transition: 'box-shadow .2s' }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <mode.Icon size={22} style={{ color: brand.primary }} />
                            </div>
                            <span style={{ background: mode.diffKey === 'Easy' ? brand.green : mode.diffKey === 'Medium' ? brand.amber : brand.red, color: mode.diffKey === 'Easy' ? brand.greenText : mode.diffKey === 'Medium' ? brand.amberText : brand.redText, fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>
                                {mode.difficulty}
                            </span>
                        </div>
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{mode.title}</h3>
                            <p style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5, margin: 0 }}>{mode.desc}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: brand.textSecondary }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> {mode.duration}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MessageCircle size={14} /> {mode.count} {t('questions', 'سؤال')}</span>
                        </div>
                        <button
                            onClick={() => startPractice({ source: 'simulator', mode: mode.key, industry: mode.key === 'industry' ? selectedIndustry : undefined, count: mode.count })}
                            disabled={practiceLoading}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: brand.primary, color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 'auto' }}>
                            {practiceLoading ? <Loader2 size={16} className="animate-spin" /> : <><Play size={16} /> {t('Start Session', 'ابدأ الجلسة')}</>}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 3: Tips & Strategies (static reference — legitimate) ── */
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
    const tipsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>{t('Tips & Strategies', 'نصائح واستراتيجيات')}</h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t('Expert advice and proven strategies to help you prepare, perform, and follow up — with UAE-specific guidance for local interviews.',
                   'نصائح خبراء واستراتيجيات مثبتة لمساعدتك في التحضير والأداء والمتابعة — مع إرشادات خاصة بالإمارات للمقابلات المحلية.')}
            </p>
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

    /* ── Tab 4: Performance (real practice history) ── */
    const feedbackTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>{t('Performance & History', 'الأداء والسجل')}</h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t('Your completed practice sessions — see what you practised and how much you answered.',
                   'جلسات التمرين المكتملة — اطّلع على ما تدرّبت عليه وعدد ما أجبت عنه.')}
            </p>
            {loadingSessions ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}><Loader2 size={28} style={{ color: brand.primary }} className="animate-spin" /></div>
            ) : sessions.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: 12, border: `1px dashed ${brand.border}`, padding: 48, textAlign: 'center' }}>
                    <BarChart3 size={28} style={{ color: brand.textSecondary, marginBottom: 10 }} />
                    <p style={{ fontSize: 14, color: brand.textSecondary, margin: 0 }}>
                        {t('No practice sessions yet. Start one from the Question Bank or Simulator, and it will appear here.', 'لا توجد جلسات تمرين بعد. ابدأ واحدة من بنك الأسئلة أو المحاكي وستظهر هنا.')}
                    </p>
                </div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                        {[
                            { label: t('Sessions', 'الجلسات'), value: sessions.length },
                            { label: t('Questions Practised', 'أسئلة تدرّبت عليها'), value: sessions.reduce((a, s) => a + (s.total_questions || 0), 0) },
                            { label: t('Answers Given', 'إجابات قدّمتها'), value: sessions.reduce((a, s) => a + (s.answered || 0), 0) },
                        ].map((m, i) => (
                            <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, textAlign: 'center' }}>
                                <div style={{ fontSize: 28, fontWeight: 700, color: brand.primary }}>{m.value}</div>
                                <span style={{ fontSize: 13, color: brand.textSecondary }}>{m.label}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {sessions.map((s, i) => {
                            const modeLabel: Record<string, string> = { quick: t('Quick Practice', 'تمرين سريع'), standard: t('Standard Session', 'جلسة قياسية'), full: t('Full Interview', 'مقابلة كاملة'), industry: t('Industry-Specific', 'حسب القطاع'), category: t('Category Practice', 'تمرين فئة'), single: t('Single Question', 'سؤال واحد') };
                            const catLabel = s.category ? (CATEGORY_META[s.category]?.title[isRTL ? 1 : 0] || s.category) : null;
                            return (
                                <div key={s.id || i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <MessageCircle size={20} style={{ color: brand.primary }} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{modeLabel[s.mode] || s.mode}{catLabel ? ` · ${catLabel}` : ''}</div>
                                            <div style={{ fontSize: 12, color: brand.textSecondary }}>{s.created_at ? new Date(s.created_at).toLocaleString() : ''}</div>
                                        </div>
                                    </div>
                                    <span style={{ background: brand.green, color: brand.greenText, fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 99, whiteSpace: 'nowrap' }}>
                                        {s.answered}/{s.total_questions} {t('answered', 'مُجاب')}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
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
                'Practise real interview questions with instant AI coaching, run mock sessions, and get expert tips tailored for the UAE job market',
                'تدرّب على أسئلة مقابلات حقيقية مع توجيه فوري بالذكاء الاصطناعي، وأجرِ جلسات تجريبية، واحصل على نصائح خبراء مصممة لسوق العمل الإماراتي'
            )}
            icon={<MessageCircle className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="questions"
        />
    );
};

export default InterviewPreparationPage;
