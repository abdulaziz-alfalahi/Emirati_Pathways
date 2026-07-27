
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    Target, BookOpen, Users, TrendingUp, Award,
    CheckCircle, ChevronRight, ChevronLeft, BarChart3,
    Layers, Brain, Star, Clock, Loader2
} from 'lucide-react';
import { restClient } from '@/utils/api';
import AiAssistPanel from '@/components/ai/AiAssistPanel';
import toast from 'react-hot-toast';

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

const DOMAIN_STYLES: Record<string, { bg: string; color: string }> = {
    'Technology': { bg: brand.blue, color: brand.blueText },
    'Business': { bg: brand.amber, color: brand.amberText },
    'Leadership': { bg: brand.purple, color: brand.purpleText },
    'Healthcare': { bg: brand.red, color: brand.redText },
    'Finance': { bg: brand.green, color: brand.greenText },
    'Energy': { bg: brand.primarySurface, color: brand.primary },
};

/* ──────────────────────── COMPONENT ──────────────────────── */

const AssessmentsPage: React.FC = () => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

    const [loading, setLoading] = useState(true);
    const [domains, setDomains] = useState<any[]>([]);
    const [taxonomy, setTaxonomy] = useState<any[]>([]);
    const [assessmentTypes, setAssessmentTypes] = useState<any[]>([]);
    const [userAssessments, setUserAssessments] = useState<any[]>([]);
    const [userSkills, setUserSkills] = useState<any[]>([]);
    const [totalSkills, setTotalSkills] = useState(0);
    const [myRequests, setMyRequests] = useState<any[]>([]);
    const [certifications, setCertifications] = useState<any[]>([]);
    const [requestingTitle, setRequestingTitle] = useState<string | null>(null);
    const [consentingId, setConsentingId] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;
        async function fetchData() {
            setLoading(true);
            try {
                const [assessRes, progressRes, requestsRes, stampsRes] = await Promise.allSettled([
                    restClient.get('/api/skills-development/assessments'),
                    restClient.get('/api/skills-development/user-progress'),
                    restClient.get('/api/skills-development/assessments/my-requests'),
                    restClient.get('/api/career-passport/stamps'),
                ]);
                if (cancelled) return;
                if (assessRes.status === 'fulfilled') {
                    const d = assessRes.value.data as any;
                    if (d?.data) {
                        setDomains(d.data.domains || []);
                        setTaxonomy(d.data.skill_taxonomy || []);
                        setAssessmentTypes(d.data.assessment_types || []);
                        setTotalSkills(d.data.total_skills || 0);
                    }
                }
                if (progressRes.status === 'fulfilled') {
                    const d = progressRes.value.data as any;
                    if (d?.data) {
                        setUserAssessments(d.data.assessments || []);
                        setUserSkills(d.data.skills || []);
                    }
                }
                if (requestsRes.status === 'fulfilled') {
                    const d = requestsRes.value.data as any;
                    if (Array.isArray(d?.data)) setMyRequests(d.data);
                }
                // Certifications minted by passing an assessment land on the career
                // passport as 'certification' stamps (C2 UAT [C2-CAN-2]).
                if (stampsRes.status === 'fulfilled') {
                    const d = stampsRes.value.data as any;
                    const stamps = d?.stamps || d?.data?.stamps || [];
                    if (Array.isArray(stamps)) {
                        setCertifications(stamps.filter((s: any) => s?.category === 'certification'));
                    }
                }
            } catch (e) {
                console.warn('Assessments API not available', e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchData();
        return () => { cancelled = true; };
    }, []);

    const refreshRequests = async () => {
        try {
            const res = await restClient.get('/api/skills-development/assessments/my-requests');
            const d = res.data as any;
            if (Array.isArray(d?.data)) setMyRequests(d.data);
        } catch { /* non-fatal */ }
    };

    const stats = [
        { value: totalSkills > 0 ? `${totalSkills}` : '75+', label: t('Skills Mapped', 'مهارة مصنّفة'), icon: BookOpen },
        { value: domains.length > 0 ? `${domains.length}` : '8', label: t('Domains', 'مجال'), icon: Layers },
        { value: userAssessments.length > 0 ? `${userAssessments.length}` : '0', label: t('Completed', 'مكتمل'), icon: CheckCircle },
        { value: '95%', label: t('Accuracy', 'دقة'), icon: Target },
    ];

    /* ── Assessment requests (candidate → assessor pending pool) ── */
    // Latest request per title (my-requests is ordered newest first).
    const requestByTitle: Record<string, any> = {};
    myRequests.forEach((r: any) => {
        if (r?.title && !requestByTitle[r.title]) requestByTitle[r.title] = r;
    });

    const formatDate = (iso: string | null | undefined) => {
        if (!iso) return '';
        try {
            return new Date(iso).toLocaleDateString(isRTL ? 'ar-AE' : 'en-AE', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch {
            return '';
        }
    };

    const requestAssessment = async (title: string) => {
        if (!title || requestingTitle) return;
        setRequestingTitle(title);
        try {
            await restClient.post('/api/skills-development/assessments/request', { title: `${title} Skills Assessment` });
            // Re-fetch from the server so the new pending request reliably shows,
            // independent of the POST response shape (C2 UAT [C2-CAN-3]: the button
            // looked like a silent no-op when the response shape didn't match).
            await refreshRequests();
            toast.success(t('Assessment requested — an assessor will schedule it.', 'تم طلب التقييم — سيقوم مقيّم بجدولته.'));
        } catch (e: any) {
            if (e?.response?.status === 409) {
                await refreshRequests();
                toast(t('You already have an open request for this assessment.', 'لديك بالفعل طلب مفتوح لهذا التقييم.'));
            } else {
                const msg = e?.response?.data?.message || t('Could not request the assessment. Please try again.', 'تعذّر طلب التقييم. حاول مرة أخرى.');
                toast.error(msg);
            }
        } finally {
            setRequestingTitle(null);
        }
    };

    // Recruiter-requested assessments need the candidate's consent before they
    // proceed to an assessor (Rework B). grant → enters the assessor pool; deny → cancelled.
    const decideConsent = async (id: number, decision: 'grant' | 'deny') => {
        if (!id || consentingId) return;
        setConsentingId(id);
        try {
            await restClient.post(`/api/skills-development/assessments/${id}/consent`, { decision });
            await refreshRequests();
            toast.success(decision === 'grant'
                ? t('Consent granted — the assessor can now proceed.', 'تمت الموافقة — يمكن للمقيّم المتابعة الآن.')
                : t('Request declined.', 'تم رفض الطلب.'));
        } catch (e: any) {
            const msg = e?.response?.data?.message || t('Could not record your decision. Please try again.', 'تعذّر تسجيل قرارك. حاول مرة أخرى.');
            toast.error(msg);
        } finally {
            setConsentingId(null);
        }
    };

    // Recruiter-requested assessments still awaiting the candidate's consent —
    // surfaced at the top of the landing tab so the action isn't below the fold
    // (C2 UAT [C2-CAN-5]).
    const pendingConsent = myRequests.filter((r: any) => r.recruiter_requested && r.consent_status === 'pending');

    const requestStatusChip = (r: any) => {
        let bg = brand.amber, fg = brand.amberText, label = t('Requested — awaiting assessor', 'مطلوب — بانتظار المقيّم');
        if (r.status === 'scheduled' || r.status === 'in_progress') {
            bg = brand.blue; fg = brand.blueText;
            label = `${t('Scheduled', 'مجدول')}${r.scheduled_at ? ` ${formatDate(r.scheduled_at)}` : ''}`;
        } else if (r.status === 'completed') {
            const passed = r.result === 'pass' || r.result === 'passed';
            bg = passed ? brand.green : (r.result ? brand.red : brand.green);
            fg = passed ? brand.greenText : (r.result ? brand.redText : brand.greenText);
            const scorePart = r.score !== null && r.score !== undefined ? `${Math.round(r.score)}%` : '';
            const resultPart = r.result ? (passed ? t('Passed', 'ناجح') : t('Failed', 'راسب')) : t('Completed', 'مكتمل');
            label = scorePart ? `${scorePart} · ${resultPart}` : resultPart;
        }
        return (
            <span style={{ background: bg, color: fg, fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {label}
            </span>
        );
    };

    /* ── Consent banner (recruiter-requested, awaiting consent) ── */
    const consentBanner = pendingConsent.length > 0 ? (
        <div style={{ background: brand.amber, border: `1px solid ${brand.amberText}33`, borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Star size={18} style={{ color: brand.amberText }} />
                <h3 style={{ fontSize: 15, fontWeight: 700, color: brand.amberText, margin: 0 }}>
                    {t('A recruiter has requested an assessment — your consent is needed', 'طلب مسؤول توظيف تقييمًا — مطلوبة موافقتك')}
                </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pendingConsent.map((r: any, i: number) => (
                    <div key={r.id ?? i} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>{r.title}</div>
                            <div style={{ fontSize: 12, color: brand.textSecondary, marginTop: 2 }}>
                                {t('Your consent is needed before results can be shared with the recruiter.', 'مطلوبة موافقتك قبل مشاركة النتائج مع مسؤول التوظيف.')}
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <button onClick={() => decideConsent(r.id, 'grant')} disabled={consentingId === r.id}
                                style={{ background: brand.green, color: brand.greenText, border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                {consentingId === r.id ? <Loader2 className="animate-spin" size={13} /> : null}{t('Consent', 'أوافق')}
                            </button>
                            <button onClick={() => decideConsent(r.id, 'deny')} disabled={consentingId === r.id}
                                style={{ background: '#fff', color: brand.redText, border: `1px solid ${brand.border}`, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                                {t('Decline', 'أرفض')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    ) : null;

    /* ── Tab 1: Skill Domains ── */
    const domainsTab = (
        <div>
            {consentBanner}
            <AiAssistPanel
                feature="skills_gap"
                title="AI skills-gap analysis"
                titleAr="تحليل فجوة المهارات بالذكاء الاصطناعي"
                getContext={() => ({
                    assessment_results: userAssessments.slice(0, 30).map((a: any) => ({
                        title: a.title,
                        score: a.score,
                        max_score: a.max_score,
                        status: a.status,
                    })),
                    skills: userSkills
                        .map((s: any) => (typeof s === 'string' ? s : s?.name))
                        .filter(Boolean)
                        .slice(0, 30),
                    target_role: 'career growth on the EHRDC platform',
                })}
                className="mb-6"
            />
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Skill Domains & Taxonomy', 'مجالات المهارات والتصنيف')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    `Explore ${totalSkills} mapped skills across ${domains.length} domains — discover where your strengths align with UAE market demand.`,
                    `استكشف ${totalSkills} مهارة مصنّفة عبر ${domains.length} مجالات — اكتشف أين تتوافق نقاط قوتك مع طلب السوق الإماراتي.`
                )}
            </p>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                    <Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} />
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                    {domains.map((d, i) => {
                        const style = DOMAIN_STYLES[d.name] || { bg: brand.primarySurface, color: brand.primary };
                        return (
                            <div
                                key={i}
                                style={{
                                    background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`,
                                    padding: 20, transition: 'box-shadow .2s', cursor: 'pointer',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)')}
                                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 10, background: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Brain size={22} style={{ color: style.color }} />
                                    </div>
                                    <span style={{ background: style.bg, color: style.color, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 99 }}>
                                        {d.skill_count} {t('skills', 'مهارة')}
                                    </span>
                                </div>
                                <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 8px' }}>{d.name}</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                                    {(d.skills || []).map((s: string, j: number) => (
                                        <span key={j} style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 11, padding: '3px 8px', borderRadius: 4 }}>{s}</span>
                                    ))}
                                </div>
                                {requestByTitle[d.name] ? (
                                    requestStatusChip(requestByTitle[d.name])
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => requestAssessment(d.name)}
                                        disabled={requestingTitle === d.name}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600,
                                            color: brand.primary, cursor: requestingTitle === d.name ? 'wait' : 'pointer',
                                            background: 'none', border: 'none', padding: 0,
                                            opacity: requestingTitle === d.name ? 0.6 : 1,
                                        }}
                                    >
                                        {requestingTitle === d.name
                                            ? <Loader2 className="animate-spin" size={14} />
                                            : null}
                                        {t('Take Assessment', 'ابدأ التقييم')} <ChevronIcon size={14} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    /* ── Tab 2: My Assessment Results ── */
    const resultsTab = (
        <div>
            <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                    {t('My assessment requests', 'طلبات التقييم الخاصة بي')}
                </h2>
                <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 16, lineHeight: 1.6 }}>
                    {t('Assessments you have requested — an assessor will schedule and conduct them.', 'التقييمات التي طلبتها — سيقوم مقيّم بجدولتها وإجرائها.')}
                </p>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                        <Loader2 className="animate-spin" size={24} style={{ color: brand.primary }} />
                    </div>
                ) : myRequests.length === 0 ? (
                    <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, textAlign: 'center', color: brand.textSecondary, fontSize: 13 }}>
                        {t('No assessment requests yet — use "Take Assessment" on a skill domain to request one.', 'لا توجد طلبات تقييم بعد — استخدم "ابدأ التقييم" في أحد مجالات المهارات لطلب تقييم.')}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {myRequests.map((r: any, i: number) => (
                            <div key={r.id ?? i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>
                                        {r.title}
                                        {r.recruiter_requested && (
                                            <span style={{ marginInlineStart: 8, fontSize: 10, fontWeight: 600, color: brand.blueText, background: brand.blue, padding: '2px 8px', borderRadius: 99 }}>
                                                {t('Recruiter-requested', 'بطلب من مسؤول التوظيف')}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: 12, color: brand.textSecondary, marginTop: 2 }}>
                                        {r.scheduled_at
                                            ? `${t('Scheduled for', 'مجدول في')} ${formatDate(r.scheduled_at)}`
                                            : t('Not scheduled yet', 'لم تتم الجدولة بعد')}
                                        {r.score !== null && r.score !== undefined
                                            ? ` · ${t('Score:', 'النتيجة:')} ${Math.round(r.score)}%`
                                            : ''}
                                    </div>
                                </div>
                                {r.recruiter_requested && r.consent_status === 'pending' ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: 11, color: brand.amberText }}>
                                            {t('Your consent is needed to share results', 'مطلوبة موافقتك لمشاركة النتائج')}
                                        </span>
                                        <button onClick={() => decideConsent(r.id, 'grant')} disabled={consentingId === r.id}
                                            style={{ background: brand.green, color: brand.greenText, border: 'none', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                            {consentingId === r.id ? <Loader2 className="animate-spin" size={12} /> : null}{t('Consent', 'أوافق')}
                                        </button>
                                        <button onClick={() => decideConsent(r.id, 'deny')} disabled={consentingId === r.id}
                                            style={{ background: '#fff', color: brand.redText, border: `1px solid ${brand.border}`, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                            {t('Decline', 'أرفض')}
                                        </button>
                                    </div>
                                ) : r.consent_status === 'denied' ? (
                                    <span style={{ background: brand.red, color: brand.redText, fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 99 }}>{t('Declined', 'مرفوض')}</span>
                                ) : requestStatusChip(r)}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('My Assessment Results', 'نتائج تقييماتي')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t('Your completed assessments and scores — understand your strengths and areas for improvement.', 'تقييماتك المكتملة ونتائجك — افهم نقاط قوتك ومجالات التطوير.')}
            </p>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                    <Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} />
                </div>
            ) : userAssessments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 50, color: brand.textSecondary }}>
                    <Target size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <p style={{ fontSize: 15 }}>{t('No assessments completed yet.', 'لم تُكمل أي تقييم بعد.')}</p>
                    <p style={{ fontSize: 13 }}>{t('Start with a skill domain to take your first assessment!', 'ابدأ بمجال مهاري لإجراء أول تقييم لك!')}</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {userAssessments.map((a, i) => {
                        const pct = a.max_score > 0 ? Math.round((a.score / a.max_score) * 100) : a.score;
                        const bg = pct >= 80 ? brand.green : pct >= 60 ? brand.amber : brand.red;
                        const fg = pct >= 80 ? brand.greenText : pct >= 60 ? brand.amberText : brand.redText;
                        return (
                            <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <div>
                                        <h4 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{a.title}</h4>
                                        <div style={{ fontSize: 12, color: brand.textSecondary }}>
                                            {a.type} · {a.sector}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ width: 54, height: 54, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span style={{ fontSize: 18, fontWeight: 700, color: fg }}>{pct}%</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ height: 6, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
                                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: pct >= 80 ? '#22C55E' : pct >= 60 ? '#F59E0B' : '#EF4444' }} />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 12, color: brand.textSecondary }}>
                                        {t('Score:', 'النتيجة:')} {a.score} / {a.max_score}
                                    </span>
                                    <span style={{
                                        background: a.status === 'completed' ? brand.green : brand.amber,
                                        color: a.status === 'completed' ? brand.greenText : brand.amberText,
                                        fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
                                    }}>
                                        {a.status === 'completed' ? t('Completed', 'مكتمل') : t('In Progress', 'قيد الإنجاز')}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    /* ── Tab 3: Skill Heat Map ── */
    const heatmapTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Market Demand Heat Map', 'خريطة الطلب في السوق')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Skill demand levels according to the UAE market taxonomy — higher demand indicates more job openings requiring this skill.',
                    'مستويات الطلب على المهارات حسب تصنيف سوق الإمارات — الطلب الأعلى يشير إلى فرص عمل أكثر تتطلب هذه المهارة.'
                )}
            </p>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                    <Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} />
                </div>
            ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {taxonomy.slice(0, 40).map((s, i) => {
                        const score = s.demand_score || 0;
                        const bg = score >= 80 ? '#22C55E' : score >= 60 ? brand.primary : score >= 40 ? '#F59E0B' : '#D1D5DB';
                        const fg = score >= 40 ? '#fff' : brand.textPrimary;
                        return (
                            <div
                                key={i}
                                title={`${s.name}: demand score ${score}`}
                                style={{
                                    background: bg, color: fg,
                                    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                                    cursor: 'pointer', transition: 'transform .15s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
                                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                            >
                                {isRTL && s.name_ar ? s.name_ar : s.name}
                                <span style={{ opacity: 0.7, marginLeft: isRTL ? 0 : 6, marginRight: isRTL ? 6 : 0, fontSize: 10 }}>
                                    {score}%
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    /* ── Tab 4: My Certifications ── */
    const certificationsTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('My Certifications', 'شهاداتي')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t('Credentials earned by passing professional assessments — issued by accredited assessment centres.', 'الشهادات التي حصلت عليها باجتياز التقييمات المهنية — صادرة عن مراكز تقييم معتمدة.')}
            </p>
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                    <Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} />
                </div>
            ) : certifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 50, color: brand.textSecondary }}>
                    <Award size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <p style={{ fontSize: 15 }}>{t('No certifications yet.', 'لا توجد شهادات بعد.')}</p>
                    <p style={{ fontSize: 13 }}>{t('Pass an assessment to earn a verified certification.', 'اجتز تقييمًا لتحصل على شهادة موثّقة.')}</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                    {certifications.map((c: any, i: number) => {
                        const meta = c.metadata || {};
                        const rows: Array<[string, any]> = [
                            [t('Issuer', 'الجهة المانحة'), c.issuer],
                            [t('NQF level', 'مستوى الإطار الوطني'), meta.nqf_level],
                            [t('Issued', 'تاريخ الإصدار'), formatDate(c.earned_at)],
                            [t('Expires', 'تاريخ الانتهاء'), formatDate(meta.expires_at)],
                            [t('Certificate no.', 'رقم الشهادة'), meta.certificate_number],
                            [t('Score', 'النتيجة'), meta.score !== undefined && meta.score !== null ? `${Math.round(meta.score)}%` : undefined],
                        ];
                        return (
                            <div key={c.id ?? i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, borderTop: `3px solid ${brand.primary}` }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Award size={20} style={{ color: brand.primary }} />
                                        </div>
                                        <h4 style={{ fontSize: 15, fontWeight: 700, color: brand.textPrimary, margin: 0 }}>
                                            {isRTL && c.title_ar ? c.title_ar : (c.title_en || c.title || t('Certification', 'شهادة'))}
                                        </h4>
                                    </div>
                                    {c.verified && (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: brand.green, color: brand.greenText, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99, whiteSpace: 'nowrap' }}>
                                            <CheckCircle size={11} /> {t('Verified', 'موثّقة')}
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {rows.filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v], j) => (
                                        <div key={j} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12.5 }}>
                                            <span style={{ color: brand.textSecondary }}>{k}</span>
                                            <span style={{ color: brand.textPrimary, fontWeight: 500, textAlign: isRTL ? 'left' : 'right' }}>{v}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const tabs = [
        { id: 'domains', label: t('Skill Domains', 'مجالات المهارات'), icon: <Brain className="h-4 w-4" />, content: domainsTab },
        { id: 'results', label: t('My Results', 'نتائجي'), icon: <BarChart3 className="h-4 w-4" />, content: resultsTab },
        { id: 'certifications', label: t('Certifications', 'الشهادات'), icon: <Award className="h-4 w-4" />, content: certificationsTab },
        { id: 'heatmap', label: t('Market Demand', 'طلب السوق'), icon: <TrendingUp className="h-4 w-4" />, content: heatmapTab },
    ];

    return (
        <EducationPathwayLayout
            title={t('Assessments & Skills', 'التقييمات والمهارات')}
            description={t(
                'Measure your skills against UAE market standards — discover your strengths, identify gaps, and get personalized development recommendations',
                'قِس مهاراتك مقابل معايير سوق الإمارات — اكتشف نقاط قوتك وحدد الفجوات واحصل على توصيات تطوير شخصية'
            )}
            icon={<Target className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="domains"
        />
    );
};

export default AssessmentsPage;
