import React, { useState, useEffect, useCallback } from 'react';
import { restClient } from '@/utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Share2, Copy, Check, Loader2, Ban, Eye, AlertTriangle,
} from 'lucide-react';

/**
 * Creating and withdrawing the public link to an event's live board.
 *
 * WHY THE WARNING IS NOT BOILERPLATE
 *
 * Creating this link publishes live turnout figures for a government programme
 * to anyone who receives it — no login, forwardable, screenshot-able. The
 * operator doing it is usually mid-event and moving quickly, so the panel says
 * plainly what the link exposes BEFORE it is generated, not in a tooltip
 * afterwards.
 *
 * It also says what the link does NOT carry, because that is the question a
 * cautious operator will actually have: hiring outcomes stay out, enforced in
 * the API rather than by this screen choosing not to render them.
 *
 * VIEW COUNTS ARE SHOWN because the question before revoking is always "has
 * anybody actually used this?" — a link opened 200 times is a different
 * decision from one nobody ever followed.
 */

interface ShareLink {
    id: number;
    url: string;
    label?: string | null;
    created_by_name?: string | null;
    created_at?: string | null;
    expires_at?: string | null;
    revoked_at?: string | null;
    view_count: number;
    last_seen_at?: string | null;
}

interface Props {
    eventId: string;
    isRTL?: boolean;
}

const EventShareLinkPanel: React.FC<Props> = ({ eventId, isRTL }) => {
    const b = (en: string, ar: string) => (isRTL ? ar : en);

    const [links, setLinks] = useState<ShareLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await restClient.get(`/api/events/${eventId}/share-link`);
            setLinks(res.data?.links || []);
        } catch (e: any) {
            setError(e?.response?.data?.message
                || b('Could not load the links', 'تعذر تحميل الروابط'));
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => { load(); }, [load]);

    const create = async () => {
        setBusy(true); setError('');
        try {
            await restClient.post(`/api/events/${eventId}/share-link`, {});
            await load();
        } catch (e: any) {
            setError(e?.response?.data?.message
                || b('Could not create a link', 'تعذر إنشاء الرابط'));
        } finally { setBusy(false); }
    };

    const revoke = async (id: number) => {
        setBusy(true); setError('');
        try {
            await restClient.post(`/api/events/share-link/${id}/revoke`, {});
            await load();
        } catch (e: any) {
            setError(e?.response?.data?.message
                || b('Could not revoke', 'تعذر إلغاء الرابط'));
        } finally { setBusy(false); }
    };

    const copy = async (link: ShareLink) => {
        try { await navigator.clipboard.writeText(link.url); } catch { /* field is selectable */ }
        setCopiedId(link.id);
        window.setTimeout(() => setCopiedId(null), 1800);
    };

    const active = links.filter(l => !l.revoked_at);
    const past = links.filter(l => l.revoked_at);

    return (
        <Card className="border-slate-200">
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    {b('Live board — share link', 'لوحة المتابعة — رابط المشاركة')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Said before the link exists, not after. */}
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    <div className="flex gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <div>
                            <p className="font-semibold">
                                {b('Anyone with this link can see it — no sign-in required.',
                                   'أي شخص يملك هذا الرابط يمكنه الاطلاع عليه دون تسجيل دخول.')}
                            </p>
                            <p className="mt-1">
                                {b('It shows participating employers, how many registered and attended, walk-ins, and the gender and education of attendees. It does NOT show hiring outcomes — interviewed, offered or hired.',
                                   'يعرض المؤسسات المشاركة وعدد المسجّلين والحاضرين والحضور دون تسجيل مسبق، إضافة إلى التوزيع النوعي والمستوى التعليمي للحاضرين. ولا يعرض نتائج التوظيف — المقابلات أو العروض أو التعيينات.')}
                            </p>
                            <p className="mt-1">
                                {b('The link stops working shortly after the event ends, and you can revoke it at any time.',
                                   'يتوقف الرابط عن العمل بعد انتهاء الفعالية بفترة قصيرة، ويمكنك إلغاؤه في أي وقت.')}
                            </p>
                        </div>
                    </div>
                </div>

                {error && (
                    <p className="rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</p>
                )}

                {loading ? (
                    <p className="flex items-center gap-2 text-xs text-slate-500">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {b('Loading…', 'جارٍ التحميل…')}
                    </p>
                ) : (
                    <>
                        {active.map(l => (
                            <div key={l.id} className="rounded-lg border border-slate-200 p-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        readOnly
                                        value={l.url}
                                        onFocus={e => e.currentTarget.select()}
                                        className="flex-1 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs"
                                        dir="ltr"
                                    />
                                    <Button size="sm" variant="outline" onClick={() => copy(l)}>
                                        {copiedId === l.id
                                            ? <Check className="h-3.5 w-3.5" />
                                            : <Copy className="h-3.5 w-3.5" />}
                                    </Button>
                                    <Button size="sm" variant="outline" disabled={busy}
                                            onClick={() => revoke(l.id)}
                                            className="text-red-600 hover:text-red-700">
                                        <Ban className="h-3.5 w-3.5 me-1" />
                                        {b('Revoke', 'إلغاء')}
                                    </Button>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <Eye className="h-3 w-3" />
                                        {l.view_count === 0
                                            ? b('never opened', 'لم يُفتح بعد')
                                            : b(`opened ${l.view_count} time(s)`, `فُتح ${l.view_count} مرة`)}
                                    </span>
                                    {l.expires_at && (
                                        <span>
                                            {b('stops working', 'يتوقف')}{' '}
                                            {new Date(l.expires_at).toLocaleString()}
                                        </span>
                                    )}
                                    {l.created_by_name && (
                                        <span>{b('created by', 'أنشأه')} {l.created_by_name}</span>
                                    )}
                                </div>
                            </div>
                        ))}

                        {active.length === 0 && (
                            <p className="text-xs text-slate-500">
                                {b('No active link. Anyone wanting to follow this event needs one.',
                                   'لا يوجد رابط نشط. من يرغب في متابعة هذه الفعالية يحتاج إلى رابط.')}
                            </p>
                        )}

                        <Button size="sm" onClick={create} disabled={busy}>
                            {busy ? <Loader2 className="h-3.5 w-3.5 me-1 animate-spin" />
                                  : <Share2 className="h-3.5 w-3.5 me-1" />}
                            {active.length
                                ? b('Create another link', 'إنشاء رابط آخر')
                                : b('Create a share link', 'إنشاء رابط مشاركة')}
                        </Button>

                        {/* Revoked links stay listed. "Who turned this off and
                            when" is the first question after a link leaks, and a
                            vanished row cannot answer it. */}
                        {past.length > 0 && (
                            <div className="pt-2 text-[11px] text-slate-500">
                                <p className="font-medium">
                                    {b('Revoked', 'روابط ملغاة')} ({past.length})
                                </p>
                                {past.map(l => (
                                    <p key={l.id} className="mt-1">
                                        {new Date(l.revoked_at as string).toLocaleString()}
                                        {' · '}
                                        {l.view_count === 0
                                            ? b('never opened', 'لم يُفتح')
                                            : b(`opened ${l.view_count} time(s)`, `فُتح ${l.view_count} مرة`)}
                                    </p>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default EventShareLinkPanel;
