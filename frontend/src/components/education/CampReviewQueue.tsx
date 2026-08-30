import React, { useState, useEffect, useCallback } from 'react';
import { restClient } from '@/utils/api';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { BookOpen, Check, X, Loader2, RefreshCw, Inbox, Plus, AlertTriangle } from 'lucide-react';

/**
 * What the Education Operator decides: which camps the public sees.
 *
 * WHY THIS EXISTS
 *
 * Owner, 2026-08-29: "Which operator should have control over what gets posted?
 * Does the operator post, or do the different stakeholders post, and does the
 * operator review and approve?"
 *
 * Stakeholders post; this screen approves. An operator typing other
 * organisations' camps in by hand becomes the bottleneck for every date change,
 * and the listing goes stale the moment a provider changes something — which is
 * exactly how six seeded camps came to sit unchanged for four months while the
 * public page showed their invented enrolment counts.
 *
 * Sits beside Scout Review, because reviewing a submitted camp is the same act
 * on a different object. See docs/knowledge_camps_design.md.
 */

const brand = {
    cardBg: '#FFFFFF', border: '#E5E7EB',
    textPrimary: '#111827', textSecondary: '#6B7280',
    teal: '#0F766E', tealBg: '#F0FDFA',
    amberBg: '#FFFBEB', amberText: '#B45309',
    redText: '#DC2626', muted: '#F9FAFB',
};

interface Camp {
    id: number;
    title: string;
    title_ar?: string;
    description?: string;
    category?: string;
    age_group?: string;
    location?: string;
    capacity?: number;
    price?: string;
    duration?: string;
    start_date?: string | null;
    end_date?: string | null;
    submitted_at?: string | null;
    institution_name?: string | null;
    training_center_name?: string | null;
    submitted_by_name?: string | null;
    registered?: number;
}

export const CampReviewQueue: React.FC = () => {
    const { language } = useLanguage();
    const isAr = language === 'ar';
    const b = (en: string, ar: string) => (isAr ? ar : en);

    const [camps, setCamps] = useState<Camp[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [rejecting, setRejecting] = useState<Camp | null>(null);
    const [reason, setReason] = useState('');

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await restClient.get('/api/knowledge-camps/review-queue');
            setCamps(res.data?.camps || []);
        } catch (e: any) {
            setError(e?.response?.data?.error
                || b('Could not load the review queue', 'تعذّر تحميل قائمة المراجعة'));
        } finally { setLoading(false); }
    }, [language]);

    useEffect(() => { load(); }, [load]);

    const publish = async (camp: Camp) => {
        setBusyId(camp.id); setError(null);
        try {
            const res = await restClient.post(`/api/knowledge-camps/${camp.id}/publish`, {});
            setNotice(res.data?.message || b('Published.', 'تم النشر.'));
            await load();
        } catch (e: any) {
            setError(e?.response?.data?.error || b('Could not publish', 'تعذّر النشر'));
        } finally { setBusyId(null); }
    };

    const reject = async () => {
        if (!rejecting || !reason.trim()) return;
        setBusyId(rejecting.id); setError(null);
        try {
            const res = await restClient.post(
                `/api/knowledge-camps/${rejecting.id}/reject`, { note: reason.trim() });
            setNotice(res.data?.message || b('Returned to the provider.', 'أُعيد إلى الجهة.'));
            setRejecting(null); setReason('');
            await load();
        } catch (e: any) {
            setError(e?.response?.data?.error || b('Could not reject', 'تعذّر الرفض'));
        } finally { setBusyId(null); }
    };

    const provider = (c: Camp) =>
        c.institution_name || c.training_center_name
        || b('entered by an operator', 'أُدخل من قِبل مشغّل');

    return (
        <div dir={isAr ? 'rtl' : 'ltr'} style={{ color: brand.textPrimary }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <BookOpen size={20} color={brand.teal} />
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                    {b('Knowledge Camps — review', 'معسكرات المعرفة — المراجعة')}
                </h2>
                <button onClick={load} disabled={loading}
                        style={{ marginInlineStart: 'auto', background: '#fff',
                                 border: `1px solid ${brand.border}`, borderRadius: 8,
                                 padding: '7px 12px', fontSize: 13, cursor: 'pointer',
                                 display: 'flex', alignItems: 'center', gap: 6 }}>
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    {b('Refresh', 'تحديث')}
                </button>
            </div>
            <p style={{ color: brand.textSecondary, fontSize: 14, marginTop: 0 }}>
                {b('Camps submitted by schools, universities and training centres. Nothing appears on the public Knowledge Camps page until you publish it. Editing a published camp brings it back here.',
                   'معسكرات تقدّمها المدارس والجامعات ومراكز التدريب. لا يظهر أي منها في صفحة معسكرات المعرفة العامة قبل نشرك له. وتعديل معسكر منشور يعيده إلى هنا.')}
            </p>

            {notice && (
                <div style={{ background: brand.tealBg, color: brand.teal, borderRadius: 8,
                              padding: '10px 14px', marginBottom: 12, fontSize: 13 }}>{notice}</div>
            )}
            {error && (
                <div style={{ background: '#FEF2F2', color: brand.redText, borderRadius: 8,
                              padding: '10px 14px', marginBottom: 12, fontSize: 13 }}>{error}</div>
            )}

            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: brand.textSecondary }}>
                    <Loader2 size={16} className="animate-spin" /> {b('Loading…', 'جارٍ التحميل…')}
                </div>
            ) : camps.length === 0 ? (
                <div style={{ background: brand.muted, border: `1px dashed ${brand.border}`,
                              borderRadius: 10, padding: 28, textAlign: 'center', color: brand.textSecondary }}>
                    <Inbox size={22} style={{ marginBottom: 8 }} />
                    <div style={{ fontWeight: 600 }}>
                        {b('Nothing waiting for review', 'لا يوجد ما ينتظر المراجعة')}
                    </div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>
                        {b('Submitted camps appear here. The public page stays empty until one is published.',
                           'تظهر هنا المعسكرات المقدَّمة. وتبقى الصفحة العامة فارغة حتى يُنشر أحدها.')}
                    </div>
                </div>
            ) : camps.map(c => (
                <div key={c.id} style={{ background: brand.cardBg, border: `1px solid ${brand.border}`,
                                         borderRadius: 12, padding: 16, marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ minWidth: 240 }}>
                            <div style={{ fontWeight: 700, fontSize: 15.5 }}>
                                {isAr ? (c.title_ar || c.title) : c.title}
                            </div>
                            <div style={{ color: brand.textSecondary, fontSize: 12.5, marginTop: 3 }}>
                                {provider(c)}
                                {c.submitted_by_name ? ` · ${b('submitted by', 'قدّمها')} ${c.submitted_by_name}` : ''}
                                {c.submitted_at ? ` · ${new Date(c.submitted_at).toLocaleDateString()}` : ''}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                            <button onClick={() => publish(c)} disabled={busyId === c.id}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6,
                                             background: brand.teal, color: '#fff', border: 'none',
                                             borderRadius: 8, padding: '8px 14px', fontWeight: 600,
                                             fontSize: 13, cursor: busyId === c.id ? 'wait' : 'pointer' }}>
                                <Check size={14} /> {b('Publish', 'نشر')}
                            </button>
                            <button onClick={() => { setRejecting(c); setReason(''); }}
                                    disabled={busyId === c.id}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6,
                                             background: '#fff', color: brand.redText,
                                             border: `1px solid ${brand.border}`, borderRadius: 8,
                                             padding: '8px 14px', fontWeight: 600, fontSize: 13,
                                             cursor: 'pointer' }}>
                                <X size={14} /> {b('Return', 'إرجاع')}
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10,
                                  fontSize: 13, color: brand.textSecondary }}>
                        {c.category && <span>{c.category}</span>}
                        {c.age_group && <span>{b('Ages', 'الأعمار')} {c.age_group}</span>}
                        {c.location && <span>{c.location}</span>}
                        {c.duration && <span>{c.duration}</span>}
                        {c.price && <span>{c.price}</span>}
                        {c.capacity ? <span>{b('Capacity', 'السعة')} {c.capacity}</span> : null}
                        {c.start_date && <span>{c.start_date}{c.end_date ? ` → ${c.end_date}` : ''}</span>}
                    </div>

                    {c.description && (
                        <p style={{ marginTop: 10, marginBottom: 0, fontSize: 13.5,
                                    color: brand.textPrimary, whiteSpace: 'pre-wrap' }}>
                            {c.description}
                        </p>
                    )}
                </div>
            ))}

            {rejecting && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
                     onClick={() => setRejecting(null)}>
                    <div onClick={e => e.stopPropagation()} dir={isAr ? 'rtl' : 'ltr'}
                         style={{ background: '#fff', borderRadius: 12, padding: 20,
                                  width: 'min(520px, 92vw)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <AlertTriangle size={18} color={brand.amberText} />
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                                {b('Return this camp to the provider', 'إرجاع هذا المعسكر إلى الجهة')}
                            </h3>
                        </div>
                        {/* The reason is required by the API, not just by this form.
                            A rejection the provider cannot read is one they repeat. */}
                        <p style={{ color: brand.textSecondary, fontSize: 13, marginTop: 0 }}>
                            {b('Say what needs to change. The provider sees this, and it is the only guidance they get.',
                               'وضّح ما يجب تعديله. ستطّلع الجهة على هذا النص، وهو الإرشاد الوحيد الذي تتلقاه.')}
                        </p>
                        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={4}
                                  placeholder={b('e.g. the dates and the age range do not match',
                                                 'مثال: التواريخ والفئة العمرية غير متطابقة')}
                                  style={{ width: '100%', borderRadius: 8, padding: 10, fontSize: 13.5,
                                           border: `1px solid ${brand.border}`, fontFamily: 'inherit' }} />
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                            <button onClick={() => setRejecting(null)}
                                    style={{ background: '#fff', border: `1px solid ${brand.border}`,
                                             borderRadius: 8, padding: '8px 14px', fontSize: 13,
                                             cursor: 'pointer' }}>
                                {b('Cancel', 'إلغاء')}
                            </button>
                            <button onClick={reject} disabled={!reason.trim() || busyId !== null}
                                    style={{ background: reason.trim() ? brand.redText : '#E5E7EB',
                                             color: '#fff', border: 'none', borderRadius: 8,
                                             padding: '8px 14px', fontWeight: 600, fontSize: 13,
                                             cursor: reason.trim() ? 'pointer' : 'not-allowed' }}>
                                {b('Return with this reason', 'إرجاع مع هذا السبب')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CampReviewQueue;
