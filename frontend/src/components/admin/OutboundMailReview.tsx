import React, { useState, useEffect, useCallback } from 'react';
import { restClient } from '@/utils/api';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import {
    Mail, Check, X, Loader2, AlertTriangle, ShieldCheck, ShieldAlert,
    Send, Inbox, User,
} from 'lucide-react';

/**
 * Approving, one at a time, everything the platform wants to email.
 *
 * WHY THIS SCREEN IS SHAPED LIKE THIS
 *
 * On 2026-08-25, hours before the first real mail credentials were configured,
 * a sweep found 46 board-meeting emails and 131 invitation links queued to real
 * recipients — Al Rostamani, Majid Al Futtaim, Gargash Hospital, board offices
 * at dghr.gov.ae. None had been reviewed, and 42 announced test meetings that
 * had already been deleted. Nothing had gone out only because email had never
 * worked.
 *
 * So three deliberate choices here:
 *
 *   1. THE FULL BODY IS SHOWN, never a truncated preview. A reviewer approving
 *      a message to a real employer must read what that employer will read.
 *      Showing a subject line only turns approval into rubber-stamping.
 *
 *   2. THERE IS NO "APPROVE ALL". Per-message approval is the requirement, and
 *      a bulk button would quietly recreate the backlog this replaced.
 *      Approving forty invitations means reading forty messages.
 *
 *   3. THE GATE STATE IS ALWAYS VISIBLE. If sending is switched off, or the
 *      recipient is not on the approved list, the reviewer sees that BEFORE
 *      approving — otherwise they approve, nothing arrives, and they conclude
 *      the platform is broken.
 *
 * Recipient addresses are shown in full. This screen is for administrators
 * deciding whether real people should receive something; hiding who it goes to
 * would defeat the review.
 */

const brand = {
    cardBg: '#FFFFFF', border: '#E5E7EB',
    textPrimary: '#1E1B4B', textSecondary: '#6B7280',
    blueBg: '#EFF6FF', blueText: '#2563EB',
    greenBg: '#ECFDF5', greenText: '#059669',
    amberBg: '#FFFBEB', amberText: '#D97706',
    redBg: '#FEF2F2', redText: '#DC2626',
    muted: '#F9FAFB',
};

interface QueuedMessage {
    id: number;
    to_email: string;
    to_name?: string | null;
    subject: string;
    body_text: string;
    body_html?: string | null;
    kind: string;
    related_type?: string | null;
    related_id?: string | null;
    created_at?: string | null;
    attempts: number;
    last_error?: string | null;
}

interface MailSettings {
    tenant_id: boolean;
    client_id: boolean;
    client_secret: boolean;
    sender_address: string | null;
    sending_enabled: boolean;
    allowed_recipients: string[];
}

const OutboundMailReview: React.FC = () => {
    const { language } = useLanguage();
    const isAr = language === 'ar';
    const b = (en: string, ar: string) => (isAr ? ar : en);

    const [messages, setMessages] = useState<QueuedMessage[]>([]);
    const [summary, setSummary] = useState<Record<string, number>>({});
    const [settings, setSettings] = useState<MailSettings | null>(null);
    const [configured, setConfigured] = useState(false);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [rejecting, setRejecting] = useState<QueuedMessage | null>(null);
    const [rejectNote, setRejectNote] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [queueRes, configRes] = await Promise.all([
                restClient.get('/api/outbound-mail/queue'),
                restClient.get('/api/outbound-mail/config'),
            ]);
            setMessages(queueRes.data?.messages || []);
            setSummary(queueRes.data?.summary || {});
            setSettings(configRes.data?.settings || null);
            setConfigured(Boolean(configRes.data?.configured));
        } catch (e: any) {
            setError(e?.response?.data?.error || b('Could not load the queue', 'تعذر تحميل قائمة الرسائل'));
        } finally {
            setLoading(false);
        }
    }, [language]);

    useEffect(() => { load(); }, [load]);

    /**
     * Would this message actually be delivered if approved right now?
     *
     * Mirrors the backend gate so the reviewer is told BEFORE approving, rather
     * than approving into a queue that cannot drain. The backend remains the
     * authority — this never lets anything through, it only warns earlier.
     */
    const deliveryBlocker = (m: QueuedMessage): string | null => {
        if (!settings) return null;
        if (!settings.sending_enabled) {
            return b('Sending is switched off for this environment — approving is recorded, but nothing will leave until it is switched on.',
                     'الإرسال متوقف في هذه البيئة — ستُسجَّل الموافقة، لكن لن تُرسل أي رسالة حتى يتم تفعيله.');
        }
        const list = settings.allowed_recipients || [];
        const addr = (m.to_email || '').toLowerCase();
        const domain = addr.includes('@') ? '@' + addr.split('@').pop() : '';
        const allowed = list.some(e => (e.startsWith('@') ? e === domain : e === addr));
        if (!allowed) {
            return b('This recipient is not on the approved list, so this message will not be delivered even once approved.',
                     'هذا المستلم غير مدرج في القائمة المعتمدة، لذا لن تُسلَّم الرسالة حتى بعد الموافقة.');
        }
        return null;
    };

    const approve = async (m: QueuedMessage) => {
        setBusyId(m.id);
        setError(null);
        try {
            await restClient.post(`/api/outbound-mail/${m.id}/approve`, {});
            setNotice(b(`Approved — message to ${m.to_email}`, `تمت الموافقة — رسالة إلى ${m.to_email}`));
            await load();
        } catch (e: any) {
            setError(e?.response?.data?.error || b('Could not approve', 'تعذرت الموافقة'));
        } finally {
            setBusyId(null);
        }
    };

    const confirmReject = async () => {
        if (!rejecting) return;
        setBusyId(rejecting.id);
        setError(null);
        try {
            await restClient.post(`/api/outbound-mail/${rejecting.id}/reject`,
                                  { note: rejectNote || null });
            setNotice(b('Rejected — it will not be sent', 'تم الرفض — لن تُرسل'));
            setRejecting(null);
            setRejectNote('');
            await load();
        } catch (e: any) {
            setError(e?.response?.data?.error || b('Could not reject', 'تعذر الرفض'));
        } finally {
            setBusyId(null);
        }
    };

    const sendApproved = async () => {
        setSending(true);
        setError(null);
        try {
            const { data: res } = await restClient.post('/api/outbound-mail/send-approved', {});
            setNotice(b(`Sent ${res?.sent ?? 0}, failed ${res?.failed ?? 0}, blocked ${res?.blocked ?? 0}`,
                        `أُرسلت ${res?.sent ?? 0}، فشلت ${res?.failed ?? 0}، مُنعت ${res?.blocked ?? 0}`));
            await load();
        } catch (e: any) {
            setError(e?.response?.data?.error || b('Could not send', 'تعذر الإرسال'));
        } finally {
            setSending(false);
        }
    };

    const pill = (label: string, value: number, bg: string, fg: string) => (
        <span style={{ background: bg, color: fg, borderRadius: 999, padding: '2px 10px',
                       fontSize: 12, fontWeight: 600, marginInlineEnd: 8 }}>
            {label}: {value}
        </span>
    );

    return (
        <div dir={isAr ? 'rtl' : 'ltr'} style={{ color: brand.textPrimary }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <Mail size={20} color={brand.blueText} />
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                    {b('Outbound mail — approval required', 'البريد الصادر — يتطلب موافقة')}
                </h2>
            </div>
            <p style={{ color: brand.textSecondary, fontSize: 14, marginTop: 0 }}>
                {b('Every message the platform composes waits here. Read it, then approve or reject it — one at a time. Nothing reaches a real recipient without a decision recorded against your name.',
                   'كل رسالة ينشئها النظام تنتظر هنا. اقرأها ثم وافق عليها أو ارفضها — واحدة تلو الأخرى. لا تصل أي رسالة إلى مستلم حقيقي دون قرار مسجَّل باسمك.')}
            </p>

            {/* Configuration state — visible before anyone approves anything */}
            {settings && (
                <div style={{ background: settings.sending_enabled ? brand.greenBg : brand.amberBg,
                              border: `1px solid ${brand.border}`, borderRadius: 10,
                              padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                        {settings.sending_enabled
                            ? <ShieldCheck size={16} color={brand.greenText} />
                            : <ShieldAlert size={16} color={brand.amberText} />}
                        <span style={{ color: settings.sending_enabled ? brand.greenText : brand.amberText }}>
                            {settings.sending_enabled
                                ? b('Sending is enabled', 'الإرسال مُفعَّل')
                                : b('Sending is switched off — approvals are recorded, nothing leaves', 'الإرسال متوقف — تُسجَّل الموافقات ولا تُرسل أي رسالة')}
                        </span>
                    </div>
                    <div style={{ marginTop: 6, color: brand.textSecondary }}>
                        {b('Approved recipients', 'المستلمون المعتمدون')}:{' '}
                        {settings.allowed_recipients?.length
                            ? settings.allowed_recipients.join(', ')
                            : b('none yet — nobody can be emailed', 'لا أحد بعد — لا يمكن مراسلة أحد')}
                        {' · '}
                        {b('Sender', 'المرسل')}: {settings.sender_address || b('not set', 'غير محدد')}
                        {!configured && ' · ' + b('Microsoft Graph is not fully configured', 'لم تُضبط خدمة Microsoft Graph بالكامل')}
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
                {pill(b('Waiting', 'بالانتظار'), summary.held || 0, brand.amberBg, brand.amberText)}
                {pill(b('Approved', 'موافق عليها'), summary.approved || 0, brand.blueBg, brand.blueText)}
                {pill(b('Sent', 'أُرسلت'), summary.sent || 0, brand.greenBg, brand.greenText)}
                {pill(b('Rejected', 'مرفوضة'), summary.rejected || 0, brand.muted, brand.textSecondary)}
                {(summary.approved || 0) > 0 && (
                    <button onClick={sendApproved} disabled={sending || !configured}
                            style={{ marginInlineStart: 'auto', background: brand.blueText, color: '#fff',
                                     border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 600,
                                     cursor: configured ? 'pointer' : 'not-allowed', opacity: configured ? 1 : 0.5,
                                     display: 'flex', alignItems: 'center', gap: 6 }}>
                        {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                        {b(`Send ${summary.approved} approved`, `إرسال ${summary.approved} رسالة موافق عليها`)}
                    </button>
                )}
            </div>

            {error && (
                <div style={{ background: brand.redBg, color: brand.redText, borderRadius: 8,
                              padding: '10px 14px', marginBottom: 12, fontSize: 13 }}>{error}</div>
            )}
            {notice && (
                <div style={{ background: brand.greenBg, color: brand.greenText, borderRadius: 8,
                              padding: '10px 14px', marginBottom: 12, fontSize: 13 }}>{notice}</div>
            )}

            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: brand.textSecondary }}>
                    <Loader2 size={16} className="animate-spin" /> {b('Loading…', 'جارٍ التحميل…')}
                </div>
            ) : messages.length === 0 ? (
                <div style={{ background: brand.muted, border: `1px dashed ${brand.border}`,
                              borderRadius: 10, padding: 28, textAlign: 'center', color: brand.textSecondary }}>
                    <Inbox size={22} style={{ marginBottom: 8 }} />
                    <div style={{ fontWeight: 600 }}>{b('Nothing is waiting for approval', 'لا توجد رسائل بانتظار الموافقة')}</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>
                        {b('Messages appear here as the platform composes them.', 'تظهر الرسائل هنا عندما ينشئها النظام.')}
                    </div>
                </div>
            ) : messages.map(m => {
                const blocker = deliveryBlocker(m);
                return (
                    <div key={m.id} style={{ background: brand.cardBg, border: `1px solid ${brand.border}`,
                                             borderRadius: 12, padding: 16, marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: 15 }}>{m.subject}</div>
                                <div style={{ color: brand.textSecondary, fontSize: 13, marginTop: 4,
                                              display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                    <User size={13} />
                                    <span style={{ direction: 'ltr', unicodeBidi: 'embed' }}>
                                        {m.to_name ? `${m.to_name} · ` : ''}{m.to_email}
                                    </span>
                                </div>
                            </div>
                            <span style={{ background: brand.muted, color: brand.textSecondary, borderRadius: 999,
                                           padding: '2px 10px', fontSize: 12, height: 'fit-content' }}>
                                {m.kind}
                            </span>
                        </div>

                        {/* The whole message. Not a preview — see the file header. */}
                        <pre style={{ background: brand.muted, border: `1px solid ${brand.border}`,
                                      borderRadius: 8, padding: 12, marginTop: 12, marginBottom: 12,
                                      fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                                      fontFamily: 'inherit', maxHeight: 320, overflowY: 'auto' }}>
                            {m.body_text}
                        </pre>

                        {blocker && (
                            <div style={{ background: brand.amberBg, color: brand.amberText, borderRadius: 8,
                                          padding: '8px 12px', marginBottom: 10, fontSize: 12.5,
                                          display: 'flex', gap: 8 }}>
                                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                                <span>{blocker}</span>
                            </div>
                        )}

                        {m.last_error && (
                            <div style={{ background: brand.redBg, color: brand.redText, borderRadius: 8,
                                          padding: '8px 12px', marginBottom: 10, fontSize: 12.5 }}>
                                {b('Last attempt failed', 'فشلت آخر محاولة')} ({m.attempts}): {m.last_error}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => approve(m)} disabled={busyId === m.id}
                                    style={{ background: brand.greenText, color: '#fff', border: 'none',
                                             borderRadius: 8, padding: '8px 14px', fontWeight: 600,
                                             cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                {busyId === m.id ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                                {b('Approve this message', 'الموافقة على هذه الرسالة')}
                            </button>
                            <button onClick={() => { setRejecting(m); setRejectNote(''); }}
                                    disabled={busyId === m.id}
                                    style={{ background: '#fff', color: brand.redText,
                                             border: `1px solid ${brand.border}`, borderRadius: 8,
                                             padding: '8px 14px', fontWeight: 600, cursor: 'pointer',
                                             display: 'flex', alignItems: 'center', gap: 6 }}>
                                <X size={15} /> {b('Reject', 'رفض')}
                            </button>
                        </div>
                    </div>
                );
            })}

            {rejecting && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
                     onClick={() => setRejecting(null)}>
                    <div onClick={e => e.stopPropagation()} dir={isAr ? 'rtl' : 'ltr'}
                         style={{ background: '#fff', borderRadius: 12, padding: 20, width: 'min(520px, 92vw)' }}>
                        <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>
                            {b('Reject this message?', 'رفض هذه الرسالة؟')}
                        </h3>
                        <p style={{ color: brand.textSecondary, fontSize: 13, marginTop: 0 }}>
                            {b('It will never be sent. The reason is kept with the message.',
                               'لن تُرسل أبدًا. يُحفظ السبب مع الرسالة.')}
                        </p>
                        <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                                  placeholder={b('Why is this being rejected? (optional)', 'لماذا يتم الرفض؟ (اختياري)')}
                                  style={{ width: '100%', minHeight: 84, border: `1px solid ${brand.border}`,
                                           borderRadius: 8, padding: 10, fontSize: 13, fontFamily: 'inherit' }} />
                        <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                            <button onClick={() => setRejecting(null)}
                                    style={{ background: '#fff', border: `1px solid ${brand.border}`,
                                             borderRadius: 8, padding: '8px 14px', cursor: 'pointer' }}>
                                {b('Cancel', 'إلغاء')}
                            </button>
                            <button onClick={confirmReject} disabled={busyId === rejecting.id}
                                    style={{ background: brand.redText, color: '#fff', border: 'none',
                                             borderRadius: 8, padding: '8px 14px', fontWeight: 600, cursor: 'pointer' }}>
                                {b('Reject', 'رفض')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OutboundMailReview;
