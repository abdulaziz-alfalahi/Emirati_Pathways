import React, { useState, useEffect, useCallback } from 'react';
import { restClient } from '@/utils/api';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import {
    FileCheck2, Check, Loader2, RefreshCw, AlertTriangle, Archive, Clock,
} from 'lucide-react';

/**
 * The one thing the owner still does by hand.
 *
 * WHY THIS SCREEN EXISTS
 *
 * Per-message approval was right for five sends and wrong for four hundred, so
 * the owner's attention moved from the MESSAGE to the WORDING: approve the text
 * of a message kind once, and operators release the messages that render from
 * it (migration 090).
 *
 * The API for that existed before this screen did, which meant the owner was
 * told to go and approve templates with nowhere to do it. That is the gap this
 * fills.
 *
 * WHAT THE READER NEEDS TO UNDERSTAND BEFORE APPROVING
 *
 *   1. THE FULL TEXT, not a summary. This is the only reading anyone does of
 *      what hundreds of employers and candidates will receive.
 *   2. THAT IT IS A TEMPLATE. Names, links and job titles are placeholders
 *      here; the delivered message has real ones. Shown explicitly, because a
 *      reader who thinks "ZZ-PROBE" is a bug will reject good wording.
 *   3. WHAT APPROVAL ACTUALLY AUTHORISES — every future message of this kind,
 *      until the wording changes. Editing the template invalidates the approval
 *      automatically, and that is worth stating so nobody assumes they have
 *      signed a blank cheque.
 */

const brand = {
    cardBg: '#FFFFFF', border: '#E5E7EB',
    textPrimary: '#1E1B4B', textSecondary: '#6B7280',
    blueBg: '#EFF6FF', blueText: '#2563EB',
    greenBg: '#ECFDF5', greenText: '#059669',
    amberBg: '#FFFBEB', amberText: '#D97706',
    redText: '#DC2626', muted: '#F9FAFB',
};

interface KindState {
    kind: string;
    fingerprint: string;
    /** An approved row exists whose fingerprint matches what the code renders. */
    approved_now: boolean;
    /** An approval exists, but for wording that has since changed. */
    has_stale_approval: boolean;
}

interface Template {
    id: number;
    kind: string;
    version: number;
    fingerprint: string;
    status: 'pending' | 'approved' | 'retired';
    sample_subject: string;
    sample_body: string;
    created_at?: string | null;
    approved_at?: string | null;
    approved_by_name?: string | null;
    /** True only for the version the code renders TODAY. */
    is_current?: boolean;
    note?: string | null;
    /** [english, arabic] pairs describing what changes from message to message. */
    varies?: [string, string][];
}

const KIND_LABELS: Record<string, [string, string]> = {
    seeker_invitation: ['Candidate invitation (NAFIS seeker)', 'دعوة مرشح (باحث نافس)'],
    company_invitation: ['Employer invitation (magic link)', 'دعوة جهة عمل (رابط مباشر)'],
    vacancy_verification: ['Vacancy verification (NAFIS import)', 'التحقق من شاغر (استيراد نافس)'],
};

const OutboundMailTemplates: React.FC = () => {
    const { language } = useLanguage();
    const isAr = language === 'ar';
    const b = (en: string, ar: string) => (isAr ? ar : en);

    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [registering, setRegistering] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [showRetired, setShowRetired] = useState(false);
    // Per kind, whether the wording AS IT READS TODAY is approved. Computed on
    // the server against a live rendering, because a stored 'approved' row only
    // describes the text it was approved for.
    const [kindState, setKindState] = useState<KindState[]>([]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await restClient.get('/api/outbound-mail/templates');
            setTemplates(res.data?.templates || []);
            setKindState(res.data?.kinds || []);
        } catch (e: any) {
            setError(e?.response?.data?.error
                || b('Could not load the templates', 'تعذر تحميل القوالب'));
        } finally {
            setLoading(false);
        }
    }, [language]);

    useEffect(() => { load(); }, [load]);

    /**
     * Re-render every template and record any whose wording has changed.
     * Approves nothing — recording and authorising are separate acts.
     */
    const register = async () => {
        setRegistering(true);
        setError(null);
        try {
            const res = await restClient.post('/api/outbound-mail/templates/register', {});
            const added = res.data?.added || [];
            setNotice(added.length
                ? b(`${added.length} new or changed wording(s) recorded — read and approve below.`,
                    `تم تسجيل ${added.length} صياغة جديدة أو معدّلة — اقرأها ووافق عليها أدناه.`)
                : b('No wording has changed.', 'لم تتغير أي صياغة.'));
            await load();
        } catch (e: any) {
            setError(e?.response?.data?.error || b('Could not check', 'تعذر التحقق'));
        } finally {
            setRegistering(false);
        }
    };

    const approve = async (t: Template) => {
        setBusyId(t.id);
        setError(null);
        try {
            const res = await restClient.post(
                `/api/outbound-mail/templates/${t.id}/approve`, {});
            setNotice(res.data?.message || b('Approved', 'تمت الموافقة'));
            await load();
        } catch (e: any) {
            setError(e?.response?.data?.error || b('Could not approve', 'تعذرت الموافقة'));
        } finally {
            setBusyId(null);
        }
    };

    const label = (kind: string) => {
        const pair = KIND_LABELS[kind];
        return pair ? (isAr ? pair[1] : pair[0]) : kind;
    };

    const visible = templates.filter(t => showRetired || t.status !== 'retired');
    const pendingCount = templates.filter(t => t.status === 'pending').length;
    const kinds = Array.from(new Set(templates.map(t => t.kind)));

    // Reported 2026-08-27: "staff-invitation shows it is already approved."
    // It did — of wording that no longer existed. This asked only whether SOME
    // approved row existed for the kind, which stayed true after the text
    // changed, so the warning below went quiet at exactly the moment it was
    // needed. approved_now compares against what the code renders today.
    const unapproved = kindState.length
        ? kindState.filter(k => !k.approved_now).map(k => k.kind)
        : kinds.filter(k => !templates.some(t => t.kind === k && t.status === 'approved'));
    const stale = kindState.filter(k => k.has_stale_approval).map(k => k.kind);

    return (
        <div dir={isAr ? 'rtl' : 'ltr'} style={{ color: brand.textPrimary }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <FileCheck2 size={20} color={brand.blueText} />
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                    {b('Message wording — approval', 'صياغة الرسائل — الاعتماد')}
                </h2>
                <button onClick={register} disabled={registering}
                        style={{ marginInlineStart: 'auto', background: '#fff',
                                 border: `1px solid ${brand.border}`, borderRadius: 8,
                                 padding: '7px 12px', fontSize: 13, cursor: 'pointer',
                                 display: 'flex', alignItems: 'center', gap: 6 }}>
                    {registering ? <Loader2 size={14} className="animate-spin" />
                                 : <RefreshCw size={14} />}
                    {b('Check for changed wording', 'تحقق من الصياغة المعدّلة')}
                </button>
            </div>
            <p style={{ color: brand.textSecondary, fontSize: 14, marginTop: 0 }}>
                {b('Approve the wording of a message type once. Operators then release individual messages that render from it — you do not review them one by one. If the wording is ever edited, your approval stops applying automatically and it comes back here.',
                   'وافق على صياغة نوع الرسالة مرة واحدة. بعدها يرسل المشغّلون الرسائل المبنية عليها دون مراجعتك لكل رسالة. وإذا عُدّلت الصياغة، تسقط موافقتك تلقائياً وتعود إلى هنا.')}
            </p>

            {stale.length > 0 && (
                <div style={{ background: brand.amberBg, color: brand.amberText,
                              border: `1px solid ${brand.amberText}`, borderRadius: 8,
                              padding: '10px 14px', marginBottom: 12, fontSize: 13,
                              display: 'flex', gap: 8 }}>
                    <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>
                        {b(`The wording changed after you approved it: ${stale.map(label).join(', ')}. Your earlier approval still stands for the old text, but that text is no longer what would be sent — so nothing of this type can go out until you read the new version below and approve it.`,
                           `تغيّرت الصياغة بعد اعتمادك لها: ${stale.map(label).join('، ')}. موافقتك السابقة تخص النص القديم، وهو لم يعد ما سيُرسل — فلا يمكن إرسال هذا النوع حتى تقرأ النسخة الجديدة أدناه وتعتمدها.`)}
                    </span>
                </div>
            )}

            {unapproved.length > 0 && (
                <div style={{ background: brand.amberBg, color: brand.amberText,
                              border: `1px solid ${brand.border}`, borderRadius: 8,
                              padding: '10px 14px', marginBottom: 12, fontSize: 13,
                              display: 'flex', gap: 8 }}>
                    <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>
                        {b(`Nothing can be sent for: ${unapproved.map(label).join(', ')} — operators cannot release messages of a type whose wording has not been approved.`,
                           `لا يمكن إرسال: ${unapproved.map(label).join('، ')} — لا يستطيع المشغّلون إرسال نوع لم تُعتمد صياغته.`)}
                    </span>
                </div>
            )}

            {error && (
                <div style={{ background: '#FEF2F2', color: brand.redText, borderRadius: 8,
                              padding: '10px 14px', marginBottom: 12, fontSize: 13 }}>{error}</div>
            )}
            {notice && (
                <div style={{ background: brand.greenBg, color: brand.greenText, borderRadius: 8,
                              padding: '10px 14px', marginBottom: 12, fontSize: 13 }}>{notice}</div>
            )}

            {templates.some(t => t.status === 'retired') && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 6,
                                fontSize: 12.5, color: brand.textSecondary, marginBottom: 10 }}>
                    <input type="checkbox" checked={showRetired}
                           onChange={e => setShowRetired(e.target.checked)} />
                    {b('Show superseded versions', 'إظهار النسخ السابقة')}
                </label>
            )}

            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: brand.textSecondary }}>
                    <Loader2 size={16} className="animate-spin" /> {b('Loading…', 'جارٍ التحميل…')}
                </div>
            ) : visible.length === 0 ? (
                <div style={{ background: brand.muted, border: `1px dashed ${brand.border}`,
                              borderRadius: 10, padding: 26, textAlign: 'center',
                              color: brand.textSecondary }}>
                    <div style={{ fontWeight: 600 }}>
                        {b('No wording recorded yet', 'لم تُسجَّل أي صياغة بعد')}
                    </div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>
                        {b('Use "Check for changed wording" above to read what the platform would send.',
                           'استخدم "تحقق من الصياغة المعدّلة" أعلاه لقراءة ما سيرسله النظام.')}
                    </div>
                </div>
            ) : visible.map(t => (
                <div key={t.id} style={{ background: brand.cardBg, border: `1px solid ${brand.border}`,
                                         borderRadius: 12, padding: 16, marginBottom: 12,
                                         opacity: t.status === 'retired' ? 0.6 : 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                                  gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 15 }}>{label(t.kind)}</div>
                            <div style={{ color: brand.textSecondary, fontSize: 12.5, marginTop: 2 }}>
                                {b('Version', 'النسخة')} {t.version}
                                {t.status === 'approved' && t.approved_at
                                    ? ` · ${b('approved by', 'اعتمدها')} ${t.approved_by_name || '—'} · ${new Date(t.approved_at).toLocaleDateString()}`
                                    : ''}
                            </div>
                        </div>
                        {/* An approved version that is no longer what the code
                            renders must NOT read "In use" — that sentence is
                            what made the changed wording invisible. */}
                        {(() => {
                            const staleApproval = t.status === 'approved' && t.is_current === false;
                            const tone = staleApproval ? 'amber'
                                       : t.status === 'approved' ? 'green'
                                       : t.status === 'retired' ? 'muted' : 'amber';
                            return (
                                <span style={{
                                    background: tone === 'green' ? brand.greenBg
                                              : tone === 'muted' ? brand.muted : brand.amberBg,
                                    color: tone === 'green' ? brand.greenText
                                         : tone === 'muted' ? brand.textSecondary : brand.amberText,
                                    borderRadius: 999, padding: '3px 12px', fontSize: 12,
                                    fontWeight: 600, height: 'fit-content',
                                    display: 'flex', alignItems: 'center', gap: 5 }}>
                                    {staleApproval ? <AlertTriangle size={13} />
                                     : t.status === 'approved' ? <Check size={13} />
                                     : t.status === 'retired' ? <Archive size={13} /> : <Clock size={13} />}
                                    {staleApproval ? b('Approved, but the wording has since changed',
                                                       'معتمدة، لكن الصياغة تغيّرت بعدها')
                                     : t.status === 'approved' ? b('In use', 'قيد الاستخدام')
                                     : t.status === 'retired' ? b('Superseded', 'نسخة سابقة')
                                     : b('Awaiting your approval', 'بانتظار موافقتك')}
                                </span>
                            );
                        })()}
                    </div>

                    <div style={{ fontSize: 13, marginBottom: 6 }}>
                        <span style={{ color: brand.textSecondary }}>{b('Subject', 'الموضوع')}: </span>
                        {t.sample_subject}
                    </div>

                    {/* WHAT CHANGES, before the sample rather than after it.
                        A sample renders ONE set of values, and a plausible real
                        value reads as fixed text: "ZZ-PROBE-ORG" is obviously a
                        placeholder, "Career Services Operator" is not. Without
                        this, an approver can reasonably conclude every staff
                        invitation names the same role. */}
                    {t.varies && t.varies.length > 0 && (
                        <div style={{ background: brand.blueBg, border: `1px solid ${brand.border}`,
                                      borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: brand.blueText,
                                          marginBottom: 4 }}>
                                {b('What changes in each message', 'ما يتغيّر في كل رسالة')}
                            </div>
                            <ul style={{ margin: 0, paddingInlineStart: 18, fontSize: 12.5,
                                         color: brand.textPrimary }}>
                                {t.varies.map(([en, ar], i) => (
                                    <li key={i} style={{ marginBottom: 2 }}>{isAr ? ar : en}</li>
                                ))}
                            </ul>
                            <div style={{ fontSize: 12, color: brand.textSecondary, marginTop: 6 }}>
                                {b('Everything else below is exactly what the recipient reads.',
                                   'وكل ما عدا ذلك أدناه هو ما يقرأه المستلم تماماً.')}
                            </div>
                        </div>
                    )}

                    {/* The full text. This is the only reading anyone does of what
                        hundreds of people will receive. */}
                    <pre style={{ background: brand.muted, border: `1px solid ${brand.border}`,
                                  borderRadius: 8, padding: 12, fontSize: 13,
                                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                                  fontFamily: 'inherit', maxHeight: 340, overflowY: 'auto',
                                  margin: '0 0 8px' }}>
                        {t.sample_body}
                    </pre>

                    {t.status === 'pending' && (
                        <>
                            <button onClick={() => approve(t)} disabled={busyId === t.id}
                                    style={{ background: brand.greenText, color: '#fff',
                                             border: 'none', borderRadius: 8, padding: '8px 14px',
                                             fontWeight: 600, cursor: 'pointer',
                                             display: 'flex', alignItems: 'center', gap: 6 }}>
                                {busyId === t.id ? <Loader2 size={15} className="animate-spin" />
                                                 : <Check size={15} />}
                                {b('Approve this wording', 'اعتماد هذه الصياغة')}
                            </button>
                            <p style={{ fontSize: 12, color: brand.textSecondary, margin: '8px 0 0' }}>
                                {b('This authorises every future message of this type, until the wording changes. It replaces any version currently in use.',
                                   'هذا يعتمد كل رسالة مستقبلية من هذا النوع حتى تتغير الصياغة، ويحل محل النسخة المستخدمة حالياً.')}
                            </p>
                        </>
                    )}
                </div>
            ))}

            {pendingCount > 0 && (
                <p style={{ fontSize: 12.5, color: brand.textSecondary, marginTop: 14 }}>
                    {b(`${pendingCount} wording(s) waiting for you.`,
                       `${pendingCount} صياغة بانتظارك.`)}
                </p>
            )}
        </div>
    );
};

export default OutboundMailTemplates;
