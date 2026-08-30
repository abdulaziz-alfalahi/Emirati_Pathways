
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import {
    Users, UserCheck, Calendar, Star, MessageCircle,
    BookOpen, Search, ChevronRight, ChevronLeft, Clock, Briefcase,
    MapPin, Globe, Award, Target, Video, Heart,
    CheckCircle, ArrowRight, ArrowLeft
} from 'lucide-react';
import { restClient } from '@/utils/api';
import { careerLifecycleAPI } from '@/services/intelligenceAPI';
import menteeMentorshipService from '@/services/menteeMentorshipService';
import AiAssistPanel from '@/components/ai/AiAssistPanel';

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

/* Never surface a raw 15-digit Emirates ID or the literal "null" as a person's
   name (C3-MEE-2): fall back to a title, then a generic label. */
const looksLikeEid = (s?: string | null) => !!s && /^\d{15}$/.test(String(s).trim());
const cleanName = (name?: string | null, fallback = 'Mentor') => {
    const n = (name ?? '').toString().trim();
    if (!n || n.toLowerCase() === 'null' || looksLikeEid(n)) return fallback;
    return n;
};

/* ──────────────────────── COMPONENT ──────────────────────── */

const MentorshipPage: React.FC = () => {

    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const t = (en: string, ar: string) => isRTL ? ar : en;
    const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;
    const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

    // Intelligence API state
    const [mentors, setMentors] = useState<any[]>([]);
    const [liveStats, setLiveStats] = useState<any>(null);
    const [myMentors, setMyMentors] = useState<any[]>([]);
    const [mySessions, setMySessions] = useState<any[]>([]);
    const [myCoaching, setMyCoaching] = useState<any[]>([]);
    const [coachDirectory, setCoachDirectory] = useState<any[]>([]);
    const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
    const [notice, setNotice] = useState<string | null>(null);

    // Fetch mentors and stats from backend
    useEffect(() => {
        let cancelled = false;
        async function loadMentors() {
            try {
                const res = await restClient.get('/api/community-mentorship/mentors');
                if (cancelled) return;
                const d = res.data as any;
                if (d?.mentors) {
                    setMentors(d.mentors.map((m: any) => ({
                        name: cleanName(isRTL ? (m.name_ar || m.name) : m.name, t(m.title, m.title_ar || m.title) || t('Mentor', 'مرشد')),
                        title: t(m.title, m.title_ar || m.title),
                        expertise: (m.expertise || []).map((e: string, i: number) =>
                            t(e, (m.expertise_ar || [])[i] || e)
                        ),
                        user_id: m.user_id,
                        rating: m.rating,
                        sessions: m.sessions,
                        location: t(m.location, m.location_ar || m.location),
                        available: m.available,
                        avatar: m.avatar,
                    })));
                }
            } catch (e) {
                // Leave the list empty → an honest empty state renders. Do NOT
                // substitute fabricated mentors (#26).
                console.warn('Mentors API unavailable', e);
                if (!cancelled) setMentors([]);
            }
        }
        async function loadStats() {
            try {
                const res = await restClient.get('/api/community-mentorship/mentorship-stats');
                if (cancelled) return;
                const d = res.data as any;
                if (d?.stats) setLiveStats(d.stats);
            } catch (e) {
                console.warn('Mentorship stats API not available', e);
            }
        }
        async function loadMyMentors() {
            try {
                const rows = await menteeMentorshipService.myMentors();
                if (!cancelled) setMyMentors(rows);
            } catch (e) { console.warn('my-mentors unavailable', e); }
        }
        async function loadMySessions() {
            // Sessions booked by the mentee's mentor (C3-MEE-5). GET added backend-side;
            // degrade to empty if unavailable.
            try {
                const res = await restClient.get('/api/mentor/sessions');
                if (cancelled) return;
                const d = res.data as any;
                setMySessions(d?.data || d?.sessions || []);
            } catch (e) { if (!cancelled) setMySessions([]); }
        }
        async function loadMyCoaching() {
            // The mentee's coaching relationship (C3-MEE-3). No dedicated mentee-facing
            // endpoint exists yet, so this is best-effort and degrades to an honest empty
            // state; see report note on the required backend endpoint.
            try {
                const res = await restClient.get('/api/coach/my-coaching');
                if (cancelled) return;
                const d = res.data as any;
                setMyCoaching(d?.data || d?.coaching || []);
            } catch (e) { if (!cancelled) setMyCoaching([]); }
        }
        async function loadCoachDirectory() {
            // Coaches a mentee can request (C3-MEE-3 coach picker).
            try {
                const res = await restClient.get('/api/coach/directory');
                if (cancelled) return;
                const d = res.data as any;
                setCoachDirectory(d?.coaches || d?.data || []);
            } catch (e) { if (!cancelled) setCoachDirectory([]); }
        }
        loadMentors();
        loadStats();
        loadMyMentors();
        loadMySessions();
        loadMyCoaching();
        loadCoachDirectory();
        return () => { cancelled = true; };
    }, [isRTL]);

    // Request a coach (C3-MEE-3): pick from the directory, POST, then refresh My coaching.
    const requestCoach = async (coachId: string, coachName: string) => {
        try {
            await restClient.post('/api/coach/request', { coach_id: coachId });
            setNotice(t(`Coaching requested with ${coachName}.`, `تم طلب التدريب مع ${coachName}.`));
            try {
                const res = await restClient.get('/api/coach/my-coaching');
                const d = res.data as any;
                setMyCoaching(d?.data || d?.coaching || []);
            } catch { /* keep prior */ }
        } catch (e: any) {
            setNotice(t('Could not request this coach. Please try again.', 'تعذّر طلب هذا المدرب. حاول مرة أخرى.'));
        }
    };

    const reloadMyMentors = useCallback(async () => {
        try { setMyMentors(await menteeMentorshipService.myMentors()); } catch (e) { /* keep */ }
    }, []);

    // Request mentorship for real → creates a pending mentorship_matching the
    // mentor can accept (Rework M3). Falls back to an honest notice on failure.
    const handleRequestMentorship = useCallback(async (mentor: any) => {
        if (!mentor?.user_id) { setNotice(t('This mentor cannot be requested yet.', 'لا يمكن طلب هذا المرشد بعد.')); return; }
        try {
            await menteeMentorshipService.requestMentor(mentor.user_id);
            setRequestedIds(prev => new Set(prev).add(mentor.user_id));
            setNotice(t(`Request sent to ${mentor.name} — awaiting their acceptance.`, `تم إرسال الطلب إلى ${mentor.name} — بانتظار قبوله.`));
            try { await careerLifecycleAPI.completeMilestone('find_mentor'); } catch { /* non-blocking */ }
            reloadMyMentors();
        } catch (e: any) {
            const status = e?.response?.status;
            setNotice(status === 409
                ? t('You already have a request with this mentor.', 'لديك طلب بالفعل مع هذا المرشد.')
                : t('Could not send the request. Please try again.', 'تعذّر إرسال الطلب. حاول مرة أخرى.'));
        }
    }, [reloadMyMentors, isRTL]);

    // Ask an active mentor to verify a skill (feeds the passport + AI recs).
    const handleRequestVerification = useCallback(async (m: any) => {
        const skill = window.prompt(t('Which skill should this mentor verify?', 'أي مهارة تريد أن يوثّقها هذا المرشد؟'));
        if (!skill || !skill.trim()) return;
        try {
            await menteeMentorshipService.requestVerification(m.mentor_user_id, skill.trim());
            setNotice(t('Verification requested.', 'تم طلب التوثيق.'));
        } catch (e) { setNotice(t('Could not request verification.', 'تعذّر طلب التوثيق.')); }
    }, [isRTL]);

    // Book a session with an active mentor.
    const handleBookSession = useCallback(async (m: any) => {
        try {
            await menteeMentorshipService.bookSession({ mentor_user_id: m.mentor_user_id, session_title: 'Mentorship session' });
            setNotice(t('Session booked.', 'تم حجز الجلسة.'));
        } catch (e) { setNotice(t('Could not book a session (is the mentorship active?).', 'تعذّر حجز الجلسة (هل الإرشاد نشط؟).')); }
    }, [isRTL]);

    /* ──────────────────────── DATA ──────────────────────── */

    // A candidate's own mentorships. There is no backend for these yet
    // (no mentorship_relationships table), so they stay empty and render an
    // honest empty state — rather than showing fabricated "your mentorships"
    // to every user (#26).
    const myMentorships: any[] = [];
    const pastMentorships: any[] = [];

    // Six "resources" were listed here — a 12-minute guide, a 45-minute video
    // course, meeting-agenda templates — with read times, and a button that ran
    // a Google search for each title. None of them exists. The platform was
    // advertising documents it does not have and then sending people to a
    // search engine to look for them.
    //
    // Kept as an empty list rather than deleted outright: the tab and its
    // honest empty state stay, so the day real guidance is written there is
    // somewhere for it to go.
    const resources: { title: string; type: string; readTime: string; icon: string }[] = [];

    // Real counts only — no fabricated/inflated numbers (C3-MEE-1). Prefer live
    // stats from the backend; otherwise derive from what we actually loaded.
    const totalMentors = liveStats?.total_mentors ?? mentors.length;
    const ratedMentors = mentors.filter((m) => Number(m.rating) > 0);
    const avgRating = liveStats?.avg_rating
        ?? (ratedMentors.length ? Math.round((ratedMentors.reduce((s, m) => s + Number(m.rating || 0), 0) / ratedMentors.length) * 10) / 10 : null);

    const stats = [
        { value: `${totalMentors}`, label: t('Active Mentors', 'مرشد نشط'), icon: UserCheck },
        { value: `${myMentors.length}`, label: t('My Mentorships', 'إرشاداتي'), icon: Users },
        { value: `${mySessions.length}`, label: t('My Sessions', 'جلساتي'), icon: Calendar },
        ...(liveStats?.total_mentees != null ? [{ value: `${liveStats.total_mentees}`, label: t('Mentees', 'متدرب'), icon: Users }] : []),
        ...(avgRating != null ? [{ value: `${avgRating}/5`, label: t('Avg Rating', 'متوسط التقييم'), icon: Star }] : []),
    ].slice(0, 4);

    /* ── Tab 1: Find Mentors ── */
    const findTab = (
        <div>
            <AiAssistPanel
                feature="mentorship_prep"
                title="AI mentorship prep"
                titleAr="التحضير للإرشاد بالذكاء الاصطناعي"
                getContext={() => ({
                    goals: ['career growth on the EHRDC platform'],
                    mentor_expertise: [...new Set(mentors.flatMap((m: any) => m.expertise || []))].slice(0, 30),
                })}
                className="mb-6"
            />
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Find a Mentor', 'ابحث عن مرشد')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Connect with experienced UAE professionals across technology, finance, energy, aviation, and government — ready to help you grow.',
                    'تواصل مع محترفين إماراتيين ذوي خبرة في التكنولوجيا والمالية والطاقة والطيران والحكومة — مستعدين لمساعدتك على النمو.'
                )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                {mentors.length === 0 && (
                    <div style={{ background: '#fff', borderRadius: 12, border: `1px dashed ${brand.border}`, padding: 24, textAlign: 'center', color: brand.textSecondary, fontSize: 14 }}>
                        {t('No mentors are available right now. Please check back soon.', 'لا يوجد مرشدون متاحون حالياً. يرجى المراجعة قريباً.')}
                    </div>
                )}
                {mentors.map((m, i) => (
                    <div
                        key={i}
                        className="ep-card"
                        style={{
                            background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`,
                            padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
                            transition: 'box-shadow .2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 32 }}>{m.avatar}</span>
                                <div>
                                    <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{m.name}</h3>
                                    <div style={{ fontSize: 12, color: brand.textSecondary }}>{m.title}</div>
                                </div>
                            </div>
                            <span style={{
                                background: m.available ? brand.green : brand.amber,
                                color: m.available ? brand.greenText : brand.amberText,
                                fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99,
                            }}>
                                {m.available ? t('Available', 'متاح') : t('Waitlist', 'قائمة الانتظار')}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {m.expertise.map((e, j) => (
                                <span key={j} style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 11, padding: '2px 8px', borderRadius: 4 }}>{e}</span>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: brand.textSecondary }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Star size={12} style={{ color: '#FBBF24', fill: '#FBBF24' }} /> {m.rating}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={12} /> {m.sessions} {t('sessions', 'جلسة')}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={12} /> {m.location}</span>
                        </div>


                        <button
                            onClick={() => handleRequestMentorship(m)}
                            disabled={requestedIds.has(m.user_id)}
                            style={{
                                background: requestedIds.has(m.user_id) ? '#F3F4F6' : (m.available ? brand.primary : 'transparent'),
                                color: requestedIds.has(m.user_id) ? brand.textSecondary : (m.available ? '#fff' : brand.primary),
                                border: m.available && !requestedIds.has(m.user_id) ? 'none' : `1px solid ${brand.border}`,
                                padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 600,
                                cursor: requestedIds.has(m.user_id) ? 'default' : 'pointer',
                                marginTop: 'auto', width: '100%',
                            }}>
                            {requestedIds.has(m.user_id)
                                ? t('Requested', 'تم الطلب')
                                : m.available ? t('Request Mentorship', 'طلب إرشاد') : t('Join Waitlist', 'انضم لقائمة الانتظار')}
                        </button>

                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 2: My Mentorships ── */
    const myTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('My Mentorships', 'إرشاداتي')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Track your active mentorships, upcoming sessions, and progress toward your goals.',
                    'تابع إرشاداتك النشطة والجلسات القادمة وتقدمك نحو أهدافك.'
                )}
            </p>

            {notice && (
                <div style={{ background: brand.primarySurface, color: brand.primary, border: `1px solid ${brand.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
                    {notice}
                </div>
            )}

            {/* Active + requested (real mentorship_matching rows) */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>{t('My mentors', 'مرشدوني')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                {myMentors.length === 0 && (
                    <div style={{ background: '#fff', borderRadius: 12, border: `1px dashed ${brand.border}`, padding: 24, textAlign: 'center', color: brand.textSecondary, fontSize: 14 }}>
                        {t('You have no mentorships yet. Browse mentors above to request one.', 'ليس لديك أي إرشاد بعد. تصفّح المرشدين أعلاه لطلب إرشاد.')}
                    </div>
                )}
                {myMentors.map((m, i) => {
                    const active = m.is_active || m.match_status === 'active';
                    const statusChip = active
                        ? { bg: brand.green, fg: brand.greenText, label: t('Active', 'نشط') }
                        : m.match_status === 'declined'
                            ? { bg: brand.amber, fg: brand.amberText, label: t('Declined', 'مرفوض') }
                            : { bg: brand.amber, fg: brand.amberText, label: t('Requested', 'مطلوب') };
                    return (
                        <div key={m.id ?? i} className="ep-card" style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                <div>
                                    <h4 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{cleanName(m.mentor_name, m.professional_title || t('Mentor', 'مرشد'))}</h4>
                                    <div style={{ fontSize: 12, color: brand.textSecondary }}>{m.professional_title || t('Mentor', 'مرشد')}</div>
                                </div>
                                <span style={{ background: statusChip.bg, color: statusChip.fg, fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>
                                    {statusChip.label}
                                </span>
                            </div>
                            {active ? (
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <button onClick={() => handleBookSession(m)} style={{ background: brand.primary, color: '#fff', border: 'none', padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <Video size={13} /> {t('Book session', 'حجز جلسة')}
                                    </button>
                                    <button onClick={() => handleRequestVerification(m)} style={{ background: '#fff', color: brand.primary, border: `1px solid ${brand.primary}`, padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                        {t('Request skill verification', 'طلب توثيق مهارة')}
                                    </button>
                                </div>
                            ) : (
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>
                                    {t('Awaiting the mentor’s acceptance.', 'بانتظار قبول المرشد.')}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Upcoming sessions (booked by the mentor) — C3-MEE-5 */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>{t('Upcoming sessions', 'الجلسات القادمة')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {mySessions.length === 0 && (
                    <div style={{ background: '#fff', borderRadius: 12, border: `1px dashed ${brand.border}`, padding: 24, textAlign: 'center', color: brand.textSecondary, fontSize: 14 }}>
                        {t('No sessions scheduled yet.', 'لا توجد جلسات مجدولة بعد.')}
                    </div>
                )}
                {mySessions.map((s, i) => (
                    <div key={s.id ?? i} className="ep-card" style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Video size={20} style={{ color: brand.primary }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{s.session_title || s.title || t('Mentorship session', 'جلسة إرشاد')}</h4>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>
                                {t('with', 'مع')} {cleanName(s.mentor_name, t('your mentor', 'مرشدك'))}
                                {(s.scheduled_date || s.scheduled_at) ? ` · ${new Date(s.scheduled_date || s.scheduled_at).toLocaleString()}` : ''}
                            </div>
                        </div>
                        {s.status && <span style={{ background: brand.blue, color: brand.blueText, fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>{s.status}</span>}
                    </div>
                ))}
            </div>

            {/* Past Mentorships */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>{t('Completed', 'مكتملة')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pastMentorships.length === 0 && (
                    <div style={{ background: '#fff', borderRadius: 12, border: `1px dashed ${brand.border}`, padding: 24, textAlign: 'center', color: brand.textSecondary, fontSize: 14 }}>
                        {t('No completed mentorships yet.', 'لا توجد جلسات إرشاد مكتملة بعد.')}
                    </div>
                )}
                {pastMentorships.map((m, i) => (
                    <div key={i} className="ep-card" style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle size={20} style={{ color: brand.primary }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 2px' }}>{m.topic}</h4>
                            <div style={{ fontSize: 12, color: brand.textSecondary }}>
                                {t('with', 'مع')} <strong>{m.mentor}</strong> · {m.sessions} {t('sessions', 'جلسة')} · {m.period}
                            </div>
                        </div>
                        <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: brand.greenText, marginBottom: 2 }}>{m.outcome}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: isRTL ? 'flex-start' : 'flex-end' }}>
                                <Star size={12} style={{ color: '#FBBF24', fill: '#FBBF24' }} />
                                <span style={{ fontSize: 12, fontWeight: 600, color: brand.textPrimary }}>{m.rating}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ── Tab 3: Become a Mentor ── */
    const becomeTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Become a Mentor', 'كن مرشداً')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Share your expertise with the next generation of UAE professionals. Give back to the community while growing your own leadership skills.',
                    'شارك خبرتك مع الجيل القادم من المحترفين الإماراتيين. ساهم في المجتمع بينما تُطوّر مهاراتك القيادية.'
                )}
            </p>

            {/* Benefits */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
                {[
                    { title: t('Build Leadership Skills', 'بناء مهارات القيادة'), desc: t('Develop coaching and communication abilities', 'طوّر قدرات التدريب والتواصل'), Icon: Target },
                    { title: t('Expand Your Network', 'وسّع شبكتك'), desc: t('Connect with emerging talent across the UAE', 'تواصل مع المواهب الصاعدة في الإمارات'), Icon: Globe },
                    { title: t('Earn Recognition', 'احصل على تقدير'), desc: t('Get certified badges and community awards', 'احصل على شارات معتمدة وجوائز مجتمعية'), Icon: Award },
                    { title: t('Give Back', 'ساهم في المجتمع'), desc: t('Shape the future of UAE workforce development', 'ساهم في تشكيل مستقبل تطوير القوى العاملة الإماراتية'), Icon: Heart },
                ].map((b, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, textAlign: 'center' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                            <b.Icon size={22} style={{ color: brand.primary }} />
                        </div>
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{b.title}</h4>
                        <span style={{ fontSize: 12, color: brand.textSecondary, lineHeight: 1.4 }}>{b.desc}</span>
                    </div>
                ))}
            </div>

            {/* Requirements */}
            <div style={{ background: brand.primarySurface, borderRadius: 12, border: `1px solid ${brand.primary}22`, padding: 24, marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 14px' }}>{t('Requirements', 'المتطلبات')}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                        t('5+ years of professional experience in your field', 'أكثر من 5 سنوات خبرة مهنية في مجالك'),
                        t('Currently employed or recently retired from a UAE-based organization', 'تعمل حالياً أو تقاعدت مؤخراً من مؤسسة إماراتية'),
                        t('Commitment to at least 2 sessions per month for 3 months', 'الالتزام بجلستين على الأقل شهرياً لمدة 3 أشهر'),
                        t('Pass a brief screening interview with our mentorship team', 'اجتياز مقابلة فحص قصيرة مع فريق الإرشاد'),
                    ].map((r, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <CheckCircle size={14} style={{ color: brand.primary, marginTop: 2, flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.5 }}>{r}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mentor onboarding is managed by the EHRDC mentorship team (operators
                enrol and vet mentors) — there is no self-serve apply endpoint, so
                we give honest guidance instead of a dead "Apply" button. */}
            <div style={{ textAlign: 'center', fontSize: 13, color: brand.textSecondary, lineHeight: 1.6, maxWidth: 520, margin: '0 auto' }}>
                {t(
                    'Mentor onboarding is managed by the EHRDC mentorship team. If you meet the requirements above, reach out via the Support chat to register your interest and start the screening process.',
                    'يُدار انضمام المرشدين من قِبل فريق الإرشاد في المجلس. إذا كنت تستوفي المتطلبات أعلاه، تواصل عبر دردشة الدعم لتسجيل اهتمامك وبدء عملية الفرز.'
                )}
            </div>
        </div>
    );

    /* ── Tab 4: Resources ── */
    const resourcesTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Mentorship Resources', 'موارد الإرشاد')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Guides and templates for getting the most out of mentoring will appear here as they are published.',
                    'ستظهر هنا الأدلة والقوالب الخاصة بالاستفادة من الإرشاد عند نشرها.'
                )}
            </p>

            {resources.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: 12, border: `1px dashed ${brand.border}`,
                              padding: 32, textAlign: 'center', fontSize: 13, color: brand.textSecondary }}>
                    {t('No mentoring guides have been published yet.',
                       'لم تُنشر أي أدلة إرشاد بعد.')}
                </div>
            ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {resources.map((r, i) => (
                    <div key={i} className="ep-card" style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: 24 }}>{r.icon}</span>
                            <span style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 4 }}>{r.type}</span>
                        </div>
                        <div>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{r.title}</h4>
                            <div style={{ fontSize: 12, color: brand.textSecondary, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Clock size={12} /> {r.readTime}
                            </div>
                        </div>
                        {/* The "Find this resource" button ran a Google search
                            for the title. When real guidance is published it
                            will carry its own link; until then there is nothing
                            to press. */}
                    </div>
                ))}
            </div>
            )}
        </div>
    );

    /* ── Tab: Coaching ── */
    const coachingTab = (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
                {t('Career Coaching', 'التدريب المهني')}
            </h2>
            <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
                {t(
                    'Work one-on-one with a career coach on a development plan and structured sessions.',
                    'اعمل بشكل فردي مع مدرب مهني على خطة تطوير وجلسات منظمة.'
                )}
            </p>

            {notice && (
                <div style={{ background: brand.primarySurface, color: brand.primary, border: `1px solid ${brand.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
                    {notice}
                </div>
            )}

            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>{t('My coaching', 'تدريبي')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {myCoaching.length === 0 && (
                    <div style={{ background: '#fff', borderRadius: 12, border: `1px dashed ${brand.border}`, padding: 24, textAlign: 'center', color: brand.textSecondary, fontSize: 14 }}>
                        {t('You have no coaching relationship yet.', 'ليس لديك علاقة تدريب بعد.')}
                    </div>
                )}
                {myCoaching.map((c, i) => (
                    <div key={c.id ?? i} className="ep-card" style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h4 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{cleanName(c.coach_name, t('Coach', 'مدرب'))}</h4>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{c.focus_area || t('Career coaching', 'تدريب مهني')}</div>
                            </div>
                            {c.status === 'pending' ? (
                                <span style={{ background: '#fef3e2', color: '#b45309', fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>
                                    {t('Requested — awaiting coach', 'تم الطلب — بانتظار المدرب')}
                                </span>
                            ) : (
                                <span style={{ background: brand.green, color: brand.greenText, fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>
                                    {t('Active', 'نشط')}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Find a coach (C3-MEE-3): pick a coach from the directory and request one */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '24px 0 12px' }}>{t('Find a coach', 'ابحث عن مدرب')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {coachDirectory.length === 0 && (
                    <div style={{ background: '#fff', borderRadius: 12, border: `1px dashed ${brand.border}`, padding: 20, textAlign: 'center', color: brand.textSecondary, fontSize: 14 }}>
                        {t('No coaches are available yet.', 'لا يوجد مدربون متاحون بعد.')}
                    </div>
                )}
                {coachDirectory.map((co, i) => {
                    const already = myCoaching.some((m) => String(m.coach_id) === String(co.id));
                    return (
                        <div key={co.id ?? i} className="ep-card" style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                            <div>
                                <h4 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{cleanName(co.display_name, t('Coach', 'مدرب'))}</h4>
                                <div style={{ fontSize: 12, color: brand.textSecondary }}>{co.specialization || co.bio || t('Career coach', 'مدرب مهني')}</div>
                            </div>
                            <button
                                onClick={() => requestCoach(co.id, cleanName(co.display_name, t('this coach', 'هذا المدرب')))}
                                disabled={already}
                                style={{ background: already ? brand.border : brand.primary, color: already ? brand.textSecondary : '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: already ? 'default' : 'pointer', whiteSpace: 'nowrap' }}
                            >
                                {already ? t('Requested', 'تم الطلب') : t('Request coach', 'اطلب مدربًا')}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    /* ──────────────────────── TABS CONFIG ──────────────────────── */

    // stopPropagation keeps EducationPathwayLayout's content-click delegation from
    // firing a false "Coming soon" toast on the many real action buttons here
    // (request mentorship, book session, request coach, etc.).
    const tabs = [
        { id: 'find', label: t('Find Mentors', 'ابحث عن مرشد'), icon: <Search className="h-4 w-4" />, content: findTab },
        { id: 'my', label: t('My Mentorships', 'إرشاداتي'), icon: <MessageCircle className="h-4 w-4" />, content: myTab },
        { id: 'coaching', label: t('Coaching', 'التدريب'), icon: <Briefcase className="h-4 w-4" />, content: coachingTab },
        { id: 'become', label: t('Become a Mentor', 'كن مرشداً'), icon: <UserCheck className="h-4 w-4" />, content: becomeTab },
        { id: 'resources', label: t('Resources', 'الموارد'), icon: <BookOpen className="h-4 w-4" />, content: resourcesTab },
    ].map(tb => ({ ...tb, content: <div onClick={e => e.stopPropagation()}>{tb.content}</div> }));

    return (
        <EducationPathwayLayout
            title={t('Mentorship Programs', 'برامج الإرشاد')}
            description={t(
                'Connect with experienced UAE professionals for one-on-one guidance — in tech, finance, energy, aviation, government, and more',
                'تواصل مع محترفين إماراتيين ذوي خبرة للإرشاد الفردي — في التكنولوجيا والمالية والطاقة والطيران والحكومة وغيرها'
            )}
            icon={<Users className="h-6 w-6" />}
            stats={stats}
            tabs={tabs}
            defaultTab="find"
        />
    );
};

export default MentorshipPage;
