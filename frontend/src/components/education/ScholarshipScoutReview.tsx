import React, { useState, useEffect, useCallback } from 'react';
import { restClient } from '@/utils/api';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import {
    Sparkles, Check, X, Loader2, ExternalLink, AlertTriangle,
    Globe, Plus, Trash2, FileSearch,
} from 'lucide-react';

/**
 * Reviewing what the scout proposed.
 *
 * THE REVIEW STEP IS THE PRODUCT. The AI reads an allow-list of government and
 * university pages and proposes drafts; nothing reaches a candidate until a
 * person approves it. An AI that published directly would be a machine for
 * putting unverified claims about money in front of people.
 *
 * Two things this screen has to make easy, because they are what keep the
 * directory honest:
 *
 *   1. CHECKING THE SOURCE. Every draft shows the page it came from and opens
 *      it in one click. A reviewer who cannot see the source is not reviewing,
 *      they are rubber-stamping.
 *
 *   2. SAYING WHY. Rejection requires a reason, and the reason is remembered —
 *      the scout reads the same pages daily, so an unremembered rejection comes
 *      back tomorrow until the operator stops opening the queue.
 *
 * Fields the model left EMPTY are shown as empty and marked "not stated on the
 * page", never quietly filled. A wrong minimum GPA stops a qualified person
 * applying and nobody ever finds out.
 */

const brand = {
    cardBg: '#FFFFFF', border: '#E5E7EB',
    textPrimary: '#1E1B4B', textSecondary: '#6B7280',
    purpleBg: '#F3E8FF', purpleText: '#7C3AED',
    greenBg: '#ECFDF5', greenText: '#059669',
    amberBg: '#FFFBEB', amberText: '#D97706',
    redText: '#DC2626', muted: '#F9FAFB',
};

interface Draft {
    id: number;
    source_url: string;
    source_label?: string | null;
    title?: string | null;
    provider_name?: string | null;
    description?: string | null;
    amount?: number | null;
    coverage_type?: string | null;
    deadline?: string | null;
    min_gpa?: number | null;
    academic_level?: string | null;
    application_link?: string | null;
    link_type?: string;
    scouted_at?: string;
    model?: string | null;
}

interface Source {
    id: number;
    domain: string;
    label?: string | null;
    start_url: string;
    is_active: boolean;
    last_scouted_at?: string | null;
    last_outcome?: string | null;
}

const REJECT_REASONS = [
    ['not_a_scholarship', 'Not a scholarship', 'ليست منحة دراسية'],
    ['duplicate', 'Already listed', 'مُدرجة بالفعل'],
    ['out_of_scope', 'Out of scope', 'خارج النطاق'],
    ['wrong_details', 'Details are wrong', 'التفاصيل غير صحيحة'],
    ['expired', 'Closed or expired', 'مغلقة أو منتهية'],
    ['other', 'Other', 'أخرى'],
] as const;

const ScholarshipScoutReview: React.FC = () => {
    const { language } = useLanguage();
    const isRTL = language === 'ar';
    const t = (en: string, ar: string) => (isRTL ? ar : en);

    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [sources, setSources] = useState<Source[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busyId, setBusyId] = useState<number | null>(null);
    const [edits, setEdits] = useState<Record<number, Partial<Draft>>>({});
    const [rejecting, setRejecting] = useState<Draft | null>(null);
    const [rejectReason, setRejectReason] = useState<string>('duplicate');
    const [rejectNote, setRejectNote] = useState('');
    const [newSource, setNewSource] = useState('');
    const [addingSource, setAddingSource] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [d, s] = await Promise.all([
                restClient.get('/api/education/scholarships/drafts'),
                restClient.get('/api/education/scholarships/sources'),
            ]);
            setDrafts(d.data?.drafts || []);
            setSources(s.data?.sources || []);
        } catch (e: any) {
            setError(e?.response?.data?.error
                || t('Could not load the review queue.', 'تعذّر تحميل قائمة المراجعة.'));
        } finally {
            setLoading(false);
        }
    }, [language]);

    useEffect(() => { load(); }, [load]);

    const field = (d: Draft, key: keyof Draft) =>
        (edits[d.id]?.[key] !== undefined ? edits[d.id][key] : d[key]) as any;

    const setField = (id: number, key: keyof Draft, value: any) =>
        setEdits(p => ({ ...p, [id]: { ...p[id], [key]: value } }));

    const approve = async (d: Draft) => {
        setBusyId(d.id);
        setError('');
        try {
            await restClient.post(`/api/education/scholarships/drafts/${d.id}/approve`,
                                  { ...d, ...(edits[d.id] || {}) });
            setEdits(p => { const n = { ...p }; delete n[d.id]; return n; });
            load();
        } catch (e: any) {
            // The API explains why it refused — a published entry needs an
            // application link — and that is more useful than a generic failure.
            setError(e?.response?.data?.error
                || t('Could not publish that draft.', 'تعذّر نشر المقترح.'));
        } finally { setBusyId(null); }
    };

    const confirmReject = async () => {
        if (!rejecting) return;
        setBusyId(rejecting.id);
        try {
            await restClient.post(`/api/education/scholarships/drafts/${rejecting.id}/reject`,
                                  { reason: rejectReason, note: rejectNote || null });
            setRejecting(null);
            setRejectNote('');
            load();
        } catch (e: any) {
            setError(e?.response?.data?.error
                || t('Could not record that rejection.', 'تعذّر تسجيل الرفض.'));
        } finally { setBusyId(null); }
    };

    const addSource = async () => {
        if (!newSource.trim()) return;
        setAddingSource(true);
        setError('');
        try {
            await restClient.post('/api/education/scholarships/sources',
                                  { start_url: newSource.trim() });
            setNewSource('');
            load();
        } catch (e: any) {
            setError(e?.response?.data?.error
                || t('Could not add that source.', 'تعذّرت إضافة المصدر.'));
        } finally { setAddingSource(false); }
    };

    const removeSource = async (s: Source) => {
        if (!window.confirm(t(
            `Stop scouting ${s.domain}? Drafts it already produced are kept.`,
            `إيقاف المسح لـ ${s.domain}؟ ستبقى المقترحات التي أنتجها.`))) return;
        try {
            await restClient.delete(`/api/education/scholarships/sources/${s.id}`);
            load();
        } catch (e: any) {
            setError(e?.response?.data?.error || t('Could not remove it.', 'تعذّرت الإزالة.'));
        }
    };

    const input = (d: Draft, key: keyof Draft, label: string, opts: any = {}) => {
        const value = field(d, key);
        const empty = value === null || value === undefined || value === '';
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <label style={{ fontSize: 11, color: brand.textSecondary }}>{label}</label>
                <input
                    type={opts.type || 'text'}
                    value={value ?? ''}
                    onChange={e => setField(d.id, key, e.target.value)}
                    style={{
                        padding: '7px 9px', borderRadius: 7, fontSize: 13,
                        border: `1px solid ${empty ? brand.border : brand.purpleText}33`,
                        background: empty ? brand.muted : '#fff',
                    }}
                />
                {/* An empty field means the page did not say. Saying so stops a
                    reviewer assuming the scout simply missed it — and stops
                    anyone filling it from memory. */}
                {empty && (
                    <span style={{ fontSize: 10, color: brand.textSecondary }}>
                        {t('not stated on the page', 'غير مذكور في الصفحة')}
                    </span>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                <Loader2 className="animate-spin" size={22} color={brand.purpleText} />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }} dir={isRTL ? 'rtl' : 'ltr'}>
            <div style={{ maxWidth: 680 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: brand.textPrimary, margin: 0 }}>
                    {t('Scouted scholarships — for your review', 'المنح المكتشفة — بانتظار مراجعتك')}
                </h3>
                <p style={{ fontSize: 13, color: brand.textSecondary, margin: '6px 0 0', lineHeight: 1.7 }}>
                    {t('Each morning the scout reads the sources below and proposes what it finds. Nothing here is visible to candidates until you publish it. Check the source page before approving — and if you turn something down, it will not come back unless the page itself changes.',
                       'كل صباح يقرأ الماسح المصادر أدناه ويقترح ما يجده. لا شيء هنا ظاهر للمرشحين حتى تنشره. راجع صفحة المصدر قبل الموافقة — وإذا رفضت مقترحاً فلن يعود إلا إذا تغيّرت الصفحة نفسها.')}
                </p>
            </div>

            {error && (
                <div style={{ background: brand.amberBg, color: brand.amberText, borderRadius: 8,
                              padding: '10px 12px', fontSize: 13, lineHeight: 1.6 }}>
                    <AlertTriangle size={14} style={{ display: 'inline', marginInlineEnd: 6 }} />{error}
                </div>
            )}

            {/* ── The queue ─────────────────────────────────────────────── */}
            {drafts.length === 0 ? (
                <div style={{ background: brand.cardBg, border: `1px solid ${brand.border}`,
                              borderRadius: 12, padding: 36, textAlign: 'center' }}>
                    <FileSearch size={32} color={brand.textSecondary} style={{ margin: '0 auto 10px' }} />
                    <p style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>
                        {t('Nothing waiting for review', 'لا يوجد ما ينتظر المراجعة')}
                    </p>
                    <p style={{ fontSize: 13, color: brand.textSecondary, margin: '6px 0 0' }}>
                        {sources.filter(s => s.is_active).length === 0
                            ? t('Add a source below and the scout will read it tomorrow morning.',
                                'أضف مصدراً أدناه وسيقرأه الماسح صباح الغد.')
                            : t('The scout found nothing new. That is not the same as it having failed — check the sources below for errors.',
                                'لم يجد الماسح جديداً. وهذا لا يعني أنه أخفق — راجع المصادر أدناه بحثاً عن أخطاء.')}
                    </p>
                </div>
            ) : drafts.map(d => (
                <div key={d.id} style={{ background: brand.cardBg, border: `1px solid ${brand.border}`,
                                         borderRadius: 12, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                                  gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                        <div style={{ minWidth: 240, flex: 1 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                                           fontSize: 11, fontWeight: 600, borderRadius: 999,
                                           padding: '2px 9px', background: brand.purpleBg,
                                           color: brand.purpleText }}>
                                <Sparkles size={11} /> {t('proposed by the scout', 'اقتراح من الماسح')}
                            </span>
                            {/* PROVENANCE, in the reviewer's line of sight. An
                                approved listing must always be traceable to the
                                page it came from. */}
                            <div style={{ fontSize: 12, color: brand.textSecondary, marginTop: 6 }}>
                                {d.source_label || t('source', 'المصدر')}
                                {d.scouted_at ? ` · ${String(d.scouted_at).slice(0, 10)}` : ''}
                                {d.model ? ` · ${d.model}` : ''}
                            </div>
                            <a href={d.source_url} target="_blank" rel="noopener noreferrer"
                               style={{ fontSize: 12, color: brand.purpleText, display: 'inline-flex',
                                        alignItems: 'center', gap: 4, marginTop: 4 }}>
                                <ExternalLink size={12} />
                                {t('Open the page it came from', 'افتح الصفحة التي جاء منها')}
                            </a>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
                        {input(d, 'title', t('Title', 'العنوان'))}
                        {input(d, 'provider_name', t('Provider', 'الجهة'))}
                        {input(d, 'application_link', t('Application link', 'رابط التقديم'))}
                        {input(d, 'deadline', t('Deadline', 'الموعد النهائي'), { type: 'date' })}
                        {input(d, 'academic_level', t('Academic level', 'المرحلة الدراسية'))}
                        {input(d, 'coverage_type', t('Coverage', 'التغطية'))}
                    </div>

                    {d.description && (
                        <div style={{ marginTop: 10, background: brand.muted, borderRadius: 8,
                                      padding: '9px 11px', fontSize: 12, color: brand.textPrimary,
                                      lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                            {d.description}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                        <button onClick={() => approve(d)} disabled={busyId === d.id}
                                style={{ display: 'flex', alignItems: 'center', gap: 6,
                                         background: brand.greenText, color: '#fff', border: 'none',
                                         borderRadius: 8, padding: '8px 14px', fontSize: 13,
                                         fontWeight: 600, cursor: 'pointer' }}>
                            {busyId === d.id ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                            {t('Publish', 'نشر')}
                        </button>
                        <button onClick={() => { setRejecting(d); setRejectReason('duplicate'); }}
                                disabled={busyId === d.id}
                                style={{ display: 'flex', alignItems: 'center', gap: 6,
                                         background: 'transparent', color: brand.redText,
                                         border: `1px solid ${brand.border}`, borderRadius: 8,
                                         padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}>
                            <X size={14} /> {t('Turn down', 'رفض')}
                        </button>
                    </div>
                </div>
            ))}

            {/* ── Reject, with a reason ─────────────────────────────────── */}
            {rejecting && (
                <div style={{ background: brand.cardBg, border: `1px solid ${brand.redText}44`,
                              borderRadius: 12, padding: 16 }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: brand.textPrimary }}>
                        {t('Turn down', 'رفض')}: {rejecting.title}
                    </h4>
                    <p style={{ fontSize: 12, color: brand.textSecondary, margin: '0 0 12px', lineHeight: 1.7 }}>
                        {t('The reason is remembered, so the scout will not propose this again unless the page changes. It is also the answer if anyone later asks why this is not listed.',
                           'يُحفظ السبب، فلن يقترح الماسح هذا مجدداً إلا إذا تغيّرت الصفحة. وهو أيضاً الإجابة إذا سأل أحد لاحقاً لماذا لم تُدرج.')}
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                        {REJECT_REASONS.map(([key, en, ar]) => (
                            <button key={key} onClick={() => setRejectReason(key)}
                                    style={{ fontSize: 12, borderRadius: 999, padding: '5px 12px',
                                             cursor: 'pointer',
                                             border: `1px solid ${rejectReason === key ? brand.purpleText : brand.border}`,
                                             background: rejectReason === key ? brand.purpleBg : 'transparent',
                                             color: rejectReason === key ? brand.purpleText : brand.textSecondary }}>
                                {t(en, ar)}
                            </button>
                        ))}
                    </div>
                    <input value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                           placeholder={t('Anything worth remembering (optional)', 'ملاحظة تستحق الحفظ (اختياري)')}
                           style={{ width: '100%', padding: '8px 10px', borderRadius: 8, fontSize: 13,
                                    border: `1px solid ${brand.border}` }} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button onClick={confirmReject} disabled={busyId === rejecting.id}
                                style={{ background: brand.redText, color: '#fff', border: 'none',
                                         borderRadius: 8, padding: '8px 16px', fontSize: 13,
                                         fontWeight: 600, cursor: 'pointer' }}>
                            {busyId === rejecting.id ? <Loader2 className="animate-spin" size={14} />
                                                     : t('Turn it down', 'رفض المقترح')}
                        </button>
                        <button onClick={() => setRejecting(null)}
                                style={{ background: 'transparent', color: brand.textSecondary,
                                         border: `1px solid ${brand.border}`, borderRadius: 8,
                                         padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>
                            {t('Cancel', 'إلغاء')}
                        </button>
                    </div>
                </div>
            )}

            {/* ── The allow-list ────────────────────────────────────────── */}
            <div style={{ background: brand.cardBg, border: `1px solid ${brand.border}`,
                          borderRadius: 12, padding: 16 }}>
                <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: brand.textPrimary,
                             display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Globe size={15} color={brand.purpleText} />
                    {t('Where the scout is allowed to look', 'أين يُسمح للماسح بالبحث')}
                </h4>
                <p style={{ fontSize: 12, color: brand.textSecondary, margin: '0 0 12px', lineHeight: 1.7 }}>
                    {t('These pages only — the scout never searches the open web. Searching for "UAE scholarships" turns up scam sites and paid agents, and listing one of those even briefly is not something this platform can afford.',
                       'هذه الصفحات فقط — لا يبحث الماسح في الإنترنت المفتوح. فالبحث عن "منح الإمارات" يُظهر مواقع احتيالية ووسطاء بمقابل، وإدراج أحدها ولو لفترة قصيرة أمر لا تحتمله هذه المنصة.')}
                </p>

                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    <input value={newSource} onChange={e => setNewSource(e.target.value)}
                           placeholder="https://www.khda.gov.ae/…"
                           style={{ flex: 1, minWidth: 220, padding: '8px 10px', borderRadius: 8,
                                    fontSize: 13, border: `1px solid ${brand.border}` }} />
                    <button onClick={addSource} disabled={addingSource || !newSource.trim()}
                            style={{ display: 'flex', alignItems: 'center', gap: 6,
                                     background: brand.purpleText, color: '#fff', border: 'none',
                                     borderRadius: 8, padding: '8px 14px', fontSize: 13,
                                     fontWeight: 600, cursor: 'pointer' }}>
                        {addingSource ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                        {t('Add', 'إضافة')}
                    </button>
                </div>

                {sources.length === 0 ? (
                    <p style={{ fontSize: 13, color: brand.textSecondary, margin: 0 }}>
                        {t('No sources yet — the scout has nothing to read.',
                           'لا توجد مصادر بعد — ليس لدى الماسح ما يقرأه.')}
                    </p>
                ) : sources.map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10,
                                             padding: '9px 0', borderTop: `1px solid ${brand.border}` }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary }}>
                                {s.label || s.domain}
                            </span>
                            {!s.is_active && (
                                <span style={{ fontSize: 10, marginInlineStart: 8, borderRadius: 999,
                                               padding: '1px 7px', background: brand.border,
                                               color: brand.textSecondary }}>
                                    {t('paused', 'موقوف')}
                                </span>
                            )}
                            <div style={{ fontSize: 11, color: brand.textSecondary, marginTop: 2,
                                          overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {s.start_url}
                            </div>
                            {/* An unreadable source must be visible. A scout that
                                cannot reach its sources produces nothing, and
                                producing nothing looks exactly like a quiet day. */}
                            {s.last_outcome && (
                                <div style={{ fontSize: 11, marginTop: 3, lineHeight: 1.6,
                                              color: s.last_outcome.startsWith('error')
                                                  ? brand.amberText : brand.textSecondary }}>
                                    {s.last_outcome.startsWith('error') && '⚠ '}
                                    {s.last_outcome}
                                    {s.last_scouted_at ? ` · ${String(s.last_scouted_at).slice(0, 10)}` : ''}
                                </div>
                            )}
                        </div>
                        {s.is_active && (
                            <button title={t('Stop scouting this', 'إيقاف مسح هذا المصدر')}
                                    onClick={() => removeSource(s)}
                                    style={{ background: 'transparent', border: `1px solid ${brand.border}`,
                                             borderRadius: 8, padding: 6, cursor: 'pointer',
                                             color: brand.redText }}>
                                <Trash2 size={13} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ScholarshipScoutReview;
