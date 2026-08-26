import React, { useState, useEffect, useCallback } from 'react';
import { restClient } from '@/utils/api';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import {
    ShieldCheck, AlertTriangle, Loader2, Play, Pause, FileCheck2,
    Users, Mail, RefreshCw,
} from 'lucide-react';

/**
 * The owner's view of an operation they are no longer inside.
 *
 * WHY THIS SCREEN EXISTS
 *
 * Per-message approval was right for the first five sends and wrong for four
 * hundred: an owner clicking approve on four hundred renderings of one template
 * is not reviewing them, they are rubber-stamping, which is worse than no
 * review because it produces a signature.
 *
 * Owner, 2026-08-26: "I don't want to be the bottleneck. I would let the agents
 * do their job, but I need a mechanism where I can audit and verify the quality
 * of the operation."
 *
 * So this screen answers three questions, in this order, because that is the
 * order in which they matter:
 *
 *   1. IS ANYTHING WRONG RIGHT NOW — drift findings and a pause banner, first,
 *      before any reassuring totals.
 *   2. ON WHOSE AUTHORITY did messages leave — template release, per-message
 *      approval, or nothing at all. "Nothing at all" is the number that says
 *      the mechanism is being routed around.
 *   3. WHAT DID PEOPLE ACTUALLY RECEIVE — a random sample of delivered bodies.
 *
 * The sample is the part that verifies QUALITY. Counts only describe volume,
 * and a summary can look perfectly healthy while every message in it says the
 * wrong thing. It is random rather than most-recent on purpose: the newest
 * messages are the ones an operator was watching as they went, and therefore
 * the least likely to be wrong.
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

interface Drift { severity: string; finding: string; }
interface OperatorRow {
    operator_id: string; operator_name?: string | null;
    released: number; sent: number; failed: number; last_release?: string | null;
}
interface SampleRow {
    id: number; kind: string; to_email: string; to_name?: string | null;
    subject: string; body_text: string; sent_at?: string | null;
    release_basis?: string | null;
}
interface Controls {
    daily_release_cap: number; paused: boolean;
    pause_reason?: string | null; paused_at?: string | null;
}

const OutboundMailAudit: React.FC = () => {
    const { language } = useLanguage();
    const isAr = language === 'ar';
    const b = (en: string, ar: string) => (isAr ? ar : en);

    const [days, setDays] = useState(7);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [totals, setTotals] = useState<Record<string, number>>({});
    const [authority, setAuthority] = useState<Record<string, number>>({});
    const [operators, setOperators] = useState<OperatorRow[]>([]);
    const [failures, setFailures] = useState<any[]>([]);
    const [sample, setSample] = useState<SampleRow[]>([]);
    const [drift, setDrift] = useState<Drift[]>([]);
    const [controls, setControls] = useState<Controls | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await restClient.get('/api/outbound-mail/audit',
                                             { params: { days, sample: 5 } });
            const d = res.data || {};
            setTotals(d.totals || {});
            setAuthority(d.by_authority || {});
            setOperators(d.by_operator || []);
            setFailures(d.recent_failures || []);
            setSample(d.sample || []);
            setDrift(d.drift || []);
            setControls(d.controls || null);
        } catch (e: any) {
            setError(e?.response?.data?.error
                || b('Could not load the audit', 'تعذر تحميل سجل المراجعة'));
        } finally {
            setLoading(false);
        }
    }, [days, language]);

    useEffect(() => { load(); }, [load]);

    const resume = async () => {
        setBusy(true);
        try {
            await restClient.post('/api/outbound-mail/controls/resume', {});
            await load();
        } catch (e: any) {
            setError(e?.response?.data?.error || b('Could not resume', 'تعذر الاستئناف'));
        } finally { setBusy(false); }
    };

    const pause = async () => {
        setBusy(true);
        try {
            await restClient.post('/api/outbound-mail/controls/pause',
                                  { reason: b('paused from the audit view',
                                              'تم الإيقاف من شاشة المراجعة') });
            await load();
        } catch (e: any) {
            setError(e?.response?.data?.error || b('Could not pause', 'تعذر الإيقاف'));
        } finally { setBusy(false); }
    };

    const stat = (label: string, value: number | string, fg = brand.textPrimary) => (
        <div style={{ background: brand.muted, border: `1px solid ${brand.border}`,
                      borderRadius: 10, padding: '10px 14px', minWidth: 120 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: fg }}>{value}</div>
            <div style={{ fontSize: 12, color: brand.textSecondary }}>{label}</div>
        </div>
    );

    const unauthorised = authority.unauthorised || 0;

    return (
        <div dir={isAr ? 'rtl' : 'ltr'} style={{ color: brand.textPrimary }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <ShieldCheck size={20} color={brand.blueText} />
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                    {b('Outbound mail — audit', 'البريد الصادر — المراجعة')}
                </h2>
                <select value={days} onChange={e => setDays(Number(e.target.value))}
                        style={{ marginInlineStart: 'auto', border: `1px solid ${brand.border}`,
                                 borderRadius: 8, padding: '6px 10px', fontSize: 13 }}>
                    {[1, 7, 30, 90].map(d => (
                        <option key={d} value={d}>{b(`Last ${d} day(s)`, `آخر ${d} يوم`)}</option>
                    ))}
                </select>
                <button onClick={load} disabled={loading}
                        style={{ background: '#fff', border: `1px solid ${brand.border}`,
                                 borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>
                    <RefreshCw size={14} />
                </button>
            </div>
            <p style={{ color: brand.textSecondary, fontSize: 14, marginTop: 0 }}>
                {b('You approve the wording once; operators release the messages. This is where you check that what went out is what you approved.',
                   'أنت توافق على الصياغة مرة واحدة، والمشغّلون يرسلون الرسائل. من هنا تتحقق من أن ما أُرسل هو ما وافقت عليه.')}
            </p>

            {error && (
                <div style={{ background: brand.redBg, color: brand.redText, borderRadius: 8,
                              padding: '10px 14px', marginBottom: 12, fontSize: 13 }}>{error}</div>
            )}

            {/* 1. Anything wrong right now — before any reassuring totals. */}
            {controls?.paused && (
                <div style={{ background: brand.redBg, border: `1px solid ${brand.redText}33`,
                              borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8,
                                  fontWeight: 700, color: brand.redText }}>
                        <Pause size={16} /> {b('Sending is paused', 'الإرسال متوقف')}
                    </div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>{controls.pause_reason}</div>
                    <button onClick={resume} disabled={busy}
                            style={{ marginTop: 10, background: brand.greenText, color: '#fff',
                                     border: 'none', borderRadius: 8, padding: '7px 12px',
                                     fontWeight: 600, cursor: 'pointer', display: 'flex',
                                     alignItems: 'center', gap: 6 }}>
                        {busy ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                        {b('Resume sending', 'استئناف الإرسال')}
                    </button>
                </div>
            )}

            {drift.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                    {drift.map((d, i) => (
                        <div key={i} style={{
                            background: d.severity === 'high' ? brand.redBg : brand.amberBg,
                            color: d.severity === 'high' ? brand.redText : brand.amberText,
                            border: `1px solid ${brand.border}`, borderRadius: 8,
                            padding: '9px 12px', marginBottom: 6, fontSize: 13,
                            display: 'flex', gap: 8 }}>
                            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                            <span>{d.finding}</span>
                        </div>
                    ))}
                </div>
            )}

            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: brand.textSecondary }}>
                    <Loader2 size={16} className="animate-spin" /> {b('Loading…', 'جارٍ التحميل…')}
                </div>
            ) : (
                <>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
                        {stat(b('Sent', 'أُرسلت'), totals.sent || 0, brand.greenText)}
                        {stat(b('Waiting', 'بالانتظار'), totals.held || 0, brand.amberText)}
                        {stat(b('Failed', 'فشلت'), totals.failed || 0, brand.redText)}
                        {stat(b('Rejected', 'مرفوضة'), totals.rejected || 0)}
                    </div>

                    {/* 2. On whose authority. */}
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px',
                                 display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FileCheck2 size={16} /> {b('On whose authority', 'بأي صلاحية')}
                    </h3>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                        {stat(b('Approved template', 'قالب معتمد'), authority.template || 0)}
                        {stat(b('Read individually', 'مراجعة فردية'), authority.per_message || 0)}
                        {stat(b('No recorded authority', 'بدون صلاحية مسجلة'), unauthorised,
                              unauthorised ? brand.redText : brand.textPrimary)}
                    </div>
                    <p style={{ fontSize: 12, color: brand.textSecondary, marginTop: 0, marginBottom: 18 }}>
                        {b('"No recorded authority" should always be zero. Anything else means a message left without either a template approval or an individual review.',
                           '"بدون صلاحية مسجلة" يجب أن يكون صفراً دائماً. أي رقم آخر يعني أن رسالة أُرسلت دون موافقة على قالب أو مراجعة فردية.')}
                    </p>

                    {operators.length > 0 && (
                        <>
                            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px',
                                         display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Users size={16} /> {b('Who released what', 'من أرسل ماذا')}
                            </h3>
                            <div style={{ overflowX: 'auto', marginBottom: 18 }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                    <thead>
                                        <tr style={{ background: brand.muted }}>
                                            {[b('Operator', 'المشغّل'), b('Released', 'أُرسلت'),
                                              b('Delivered', 'وصلت'), b('Failed', 'فشلت')].map(h => (
                                                <th key={h} style={{ textAlign: isAr ? 'right' : 'left',
                                                                     padding: '8px 10px',
                                                                     border: `1px solid ${brand.border}` }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {operators.map(o => (
                                            <tr key={o.operator_id}>
                                                <td style={{ padding: '8px 10px', border: `1px solid ${brand.border}` }}>
                                                    {o.operator_name || o.operator_id}
                                                </td>
                                                <td style={{ padding: '8px 10px', border: `1px solid ${brand.border}` }}>{o.released}</td>
                                                <td style={{ padding: '8px 10px', border: `1px solid ${brand.border}` }}>{o.sent}</td>
                                                <td style={{ padding: '8px 10px', border: `1px solid ${brand.border}`,
                                                             color: o.failed ? brand.redText : undefined }}>{o.failed}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* 3. What people actually received. */}
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px',
                                 display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Mail size={16} /> {b('A random sample of what was delivered',
                                              'عيّنة عشوائية مما تم إرساله')}
                    </h3>
                    <p style={{ fontSize: 12, color: brand.textSecondary, marginTop: 0 }}>
                        {b('Random, not the most recent — the newest messages are the ones someone was watching, and the least likely to be wrong.',
                           'عشوائية وليست الأحدث — فالرسائل الأحدث هي التي كان أحدهم يراقبها، وأقلها احتمالاً للخطأ.')}
                    </p>
                    {sample.length === 0 ? (
                        <div style={{ background: brand.muted, border: `1px dashed ${brand.border}`,
                                      borderRadius: 10, padding: 22, textAlign: 'center',
                                      color: brand.textSecondary, fontSize: 13 }}>
                            {b('Nothing has been delivered in this window.',
                               'لم تُرسل أي رسالة خلال هذه الفترة.')}
                        </div>
                    ) : sample.map(m => (
                        <div key={m.id} style={{ background: brand.cardBg, border: `1px solid ${brand.border}`,
                                                 borderRadius: 12, padding: 14, marginBottom: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between',
                                          gap: 10, flexWrap: 'wrap' }}>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>{m.subject}</div>
                                <span style={{ background: brand.blueBg, color: brand.blueText,
                                               borderRadius: 999, padding: '2px 10px', fontSize: 12 }}>
                                    {m.release_basis === 'template'
                                        ? b('template', 'قالب')
                                        : b('read individually', 'مراجعة فردية')}
                                </span>
                            </div>
                            <div style={{ color: brand.textSecondary, fontSize: 12.5, margin: '4px 0 8px',
                                          direction: 'ltr', unicodeBidi: 'embed',
                                          textAlign: isAr ? 'right' : 'left' }}>
                                {m.to_email}{m.sent_at ? ` · ${new Date(m.sent_at).toLocaleString()}` : ''}
                            </div>
                            <pre style={{ background: brand.muted, border: `1px solid ${brand.border}`,
                                          borderRadius: 8, padding: 10, fontSize: 12.5,
                                          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                                          fontFamily: 'inherit', maxHeight: 220, overflowY: 'auto',
                                          margin: 0 }}>
                                {m.body_text}
                            </pre>
                        </div>
                    ))}

                    {failures.length > 0 && (
                        <>
                            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '18px 0 8px',
                                         color: brand.redText }}>
                                {b('Recent failures', 'حالات الفشل الأخيرة')}
                            </h3>
                            {failures.map((f: any) => (
                                <div key={f.id} style={{ background: brand.redBg, borderRadius: 8,
                                                         padding: '8px 12px', marginBottom: 6, fontSize: 12.5 }}>
                                    <strong>{f.to_email}</strong> ({f.kind}) — {f.last_error}
                                </div>
                            ))}
                        </>
                    )}

                    {controls && !controls.paused && (
                        <div style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${brand.border}`,
                                      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 12.5, color: brand.textSecondary }}>
                                {b(`Each operator may release up to ${controls.daily_release_cap} message(s) per day.`,
                                   `يمكن لكل مشغّل إرسال ما يصل إلى ${controls.daily_release_cap} رسالة يومياً.`)}
                            </span>
                            <button onClick={pause} disabled={busy}
                                    style={{ marginInlineStart: 'auto', background: '#fff',
                                             color: brand.redText, border: `1px solid ${brand.border}`,
                                             borderRadius: 8, padding: '7px 12px', fontWeight: 600,
                                             cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Pause size={14} /> {b('Stop all sending', 'إيقاف كل الإرسال')}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default OutboundMailAudit;
