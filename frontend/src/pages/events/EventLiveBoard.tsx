import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
    Building2, Users, UserCheck, Briefcase, RefreshCw, AlertTriangle,
} from 'lucide-react';

/**
 * The live turnout board for one open day, shared by link.
 *
 * WHY THIS PAGE EXISTS
 *
 * Owner, 2026-08-27: something like the board the Ithra exhibition runs at
 * ops.eif.gov.ae — a live tracker that goes on a screen at the venue and gets
 * passed to a partner ministry. Ours is the same idea with an off switch: the
 * link is unguessable, revocable, and dies with the event (migration 091).
 *
 * WHAT IS DELIBERATELY NOT HERE
 *
 * Hiring outcomes — interviewed, offered, hired. Those are commercially
 * sensitive to the employers standing in the room, and a live "hired: 2" beside
 * "340 attended" becomes a published statistic the moment the link is
 * forwarded. The API does not send them, so this page could not show them even
 * if a future edit tried.
 *
 * THREE THINGS THIS BOARD REFUSES TO DO
 *
 *   1. It never shows a number it does not have. A demographic split drawn from
 *      one profile in eight is not a finding; every breakdown carries its
 *      coverage, and below a threshold it says so instead of drawing a chart.
 *      This board goes on a wall and gets photographed — a misleading pie is
 *      not recoverable.
 *   2. It does not project or extrapolate. Every figure is counted from
 *      recorded rows.
 *   3. It does not pretend to be live when it is not. If a refresh fails the
 *      last good figures stay on screen with the time they were taken, rather
 *      than silently ageing or blanking mid-event.
 *
 * ARABIC LEADS. The audience is a venue in the UAE and a government partner,
 * and this is the one screen where the reference we were pointed at is entirely
 * in Arabic.
 */

const REFRESH_MS = 30_000;
/** Below this, a demographic split describes too few people to be worth drawing. */
const MIN_COVERAGE_PERCENT = 60;
const MIN_KNOWN = 5;

const brand = {
    bg: '#0B1F3A', panel: '#12294A', line: '#1E3A5F',
    text: '#F8FAFC', dim: '#94A3B8',
    teal: '#2DD4BF', amber: '#FBBF24', rose: '#FB7185', sky: '#38BDF8',
};

interface Bucket { bucket: string; n: number; }
interface Breakdown {
    buckets: Bucket[];
    known: number;
    total: number;
    coverage_percent: number | null;
}
interface Board {
    event: {
        title?: string; title_ar?: string; venue?: string; venue_ar?: string;
        starts_at?: string | null; ends_at?: string | null; status?: string;
    };
    totals: {
        employers: number; vacancies: number; registered: number;
        attended: number; walk_ins: number; self_check_in: number;
    };
    employers: { name: string; industry?: string | null }[];
    gender: Breakdown;
    education: Breakdown;
    as_of: string;
}

const GENDER_AR: Record<string, string> = {
    Male: 'ذكور', Female: 'إناث', male: 'ذكور', female: 'إناث',
};

const EventLiveBoard: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [board, setBoard] = useState<Board | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [gone, setGone] = useState(false);
    const [staleSince, setStaleSince] = useState<Date | null>(null);
    const [clock, setClock] = useState(new Date());
    const timer = useRef<number | null>(null);

    const load = useCallback(async () => {
        try {
            const res = await fetch(`/api/events/live/${token}`);
            if (res.status === 404) { setGone(true); return; }
            if (!res.ok) throw new Error(String(res.status));
            const data = await res.json();
            if (!data?.success) throw new Error('unavailable');
            setBoard(data);
            setStaleSince(null);
            setError(null);
        } catch {
            // Keep the last good figures on screen. A board that blanks or
            // silently ages mid-event is worse than one that says when it last
            // managed to read.
            setStaleSince(prev => prev ?? new Date());
        }
    }, [token]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => {
        timer.current = window.setInterval(load, REFRESH_MS);
        return () => { if (timer.current) window.clearInterval(timer.current); };
    }, [load]);
    useEffect(() => {
        const t = window.setInterval(() => setClock(new Date()), 1000);
        return () => window.clearInterval(t);
    }, []);

    if (gone) {
        return (
            <div dir="rtl" style={{ minHeight: '100vh', background: brand.bg, color: brand.text,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontFamily: 'Readex Pro, Segoe UI, Tahoma, sans-serif' }}>
                <div style={{ textAlign: 'center', maxWidth: 420, padding: 24 }}>
                    <AlertTriangle size={36} color={brand.amber} />
                    <h1 style={{ fontSize: 22, marginTop: 14 }}>هذا الرابط لم يعد متاحاً</h1>
                    <p style={{ color: brand.dim, fontSize: 14 }}>
                        This link is no longer available.
                    </p>
                </div>
            </div>
        );
    }

    if (!board) {
        return (
            <div dir="rtl" style={{ minHeight: '100vh', background: brand.bg, color: brand.dim,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                جارٍ التحميل…
            </div>
        );
    }

    const { event, totals } = board;
    const starts = event.starts_at ? new Date(event.starts_at) : null;
    const title = event.title_ar || event.title || 'يوم مفتوح';
    const venue = event.venue_ar || event.venue;

    const stat = (icon: React.ReactNode, value: number, labelAr: string,
                  labelEn: string, colour: string, note?: string) => (
        <div style={{ background: brand.panel, border: `1px solid ${brand.line}`,
                      borderRadius: 16, padding: '20px 22px', flex: '1 1 200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: colour }}>
                {icon}
                <span style={{ fontSize: 13, fontWeight: 600 }}>{labelAr}</span>
            </div>
            <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.1, marginTop: 8 }}>
                {value.toLocaleString('en-US')}
            </div>
            <div style={{ fontSize: 12, color: brand.dim, marginTop: 2 }}>{labelEn}</div>
            {note && <div style={{ fontSize: 12, color: brand.dim, marginTop: 6 }}>{note}</div>}
        </div>
    );

    /**
     * A breakdown, or an honest statement that there is not enough of it.
     *
     * The bar is drawn from KNOWN values only, and the coverage is printed
     * beside it — otherwise "67% female" from three of eight attendees reads
     * exactly like "67% female" from three hundred.
     */
    const breakdown = (b: Breakdown, titleAr: string, titleEn: string,
                       colours: string[], translate?: Record<string, string>) => {
        // TWO different reasons not to draw this, and they need different
        // wording. "Not enough data" beside "3 of 3 attendees have this" is a
        // contradiction the reader has to resolve; the real reason there is
        // that three people do not make a distribution.
        // TOTAL, not known. `known` is how many have THIS field on file; using
        // it here made the education panel say "1 attendee so far" when three
        // people had turned up and only one had education recorded — which is
        // the other reason entirely, and understates the turnout on a board
        // whose whole job is reporting turnout.
        const tooFewPeople = b.total < MIN_KNOWN;
        const tooLittleKnown = b.coverage_percent === null
            || b.coverage_percent < MIN_COVERAGE_PERCENT;
        const enough = !tooFewPeople && !tooLittleKnown;
        return (
            <div style={{ background: brand.panel, border: `1px solid ${brand.line}`,
                          borderRadius: 16, padding: 20, flex: '1 1 320px' }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{titleAr}</div>
                <div style={{ fontSize: 12, color: brand.dim, marginBottom: 12 }}>{titleEn}</div>

                {!enough ? (
                    <div style={{ color: brand.dim, fontSize: 13, lineHeight: 1.7 }}>
                        {tooFewPeople
                            ? 'عدد الحاضرين لا يكفي لعرض توزيع ذي دلالة'
                            : 'البيانات المتوفرة لا تكفي لعرض هذا التوزيع'}
                        <div style={{ fontSize: 12, marginTop: 4 }}>
                            {tooFewPeople
                                ? `${b.total} حاضراً حتى الآن · too few attendees so far for a meaningful breakdown`
                                : `${b.known} من ${b.total} حاضراً لديهم هذه البيانات · not enough of the attendees have this on file`}
                        </div>
                    </div>
                ) : (
                    <>
                        {b.buckets.map((row, i) => {
                            const pct = Math.round((row.n / b.known) * 100);
                            return (
                                <div key={row.bucket} style={{ marginBottom: 10 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between',
                                                  fontSize: 13, marginBottom: 4 }}>
                                        <span>{translate?.[row.bucket] || row.bucket}</span>
                                        <span style={{ color: brand.dim }}>
                                            {pct}% ({row.n})
                                        </span>
                                    </div>
                                    <div style={{ height: 8, background: brand.line, borderRadius: 99 }}>
                                        <div style={{ width: `${pct}%`, height: '100%',
                                                      background: colours[i % colours.length],
                                                      borderRadius: 99 }} />
                                    </div>
                                </div>
                            );
                        })}
                        <div style={{ fontSize: 11.5, color: brand.dim, marginTop: 10 }}>
                            محسوبة من {b.known} من أصل {b.total} حاضراً ({b.coverage_percent}%)
                        </div>
                    </>
                )}
            </div>
        );
    };

    return (
        <div dir="rtl" style={{ minHeight: '100vh', background: brand.bg, color: brand.text,
                                padding: '22px 26px',
                                fontFamily: 'Readex Pro, Segoe UI, Tahoma, sans-serif' }}>
            {/* Header: what this is, and whether the figures are current. */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16,
                          flexWrap: 'wrap', marginBottom: 22 }}>
                <div style={{ flex: '1 1 320px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 9, height: 9, borderRadius: 99,
                                       background: staleSince ? brand.amber : brand.teal,
                                       boxShadow: `0 0 10px ${staleSince ? brand.amber : brand.teal}` }} />
                        <span style={{ fontSize: 12.5, color: staleSince ? brand.amber : brand.teal,
                                       fontWeight: 700 }}>
                            {staleSince ? 'البيانات غير محدّثة' : 'مباشر'}
                        </span>
                    </div>
                    <h1 style={{ fontSize: 27, fontWeight: 800, margin: '6px 0 2px' }}>{title}</h1>
                    <div style={{ color: brand.dim, fontSize: 14 }}>
                        {venue ? `${venue} · ` : ''}
                        {starts ? starts.toLocaleDateString('ar-AE',
                            { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                    </div>
                </div>
                <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 30, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                        {clock.toLocaleTimeString('en-GB', { hour12: false })}
                    </div>
                    <div style={{ fontSize: 12, color: brand.dim, display: 'flex',
                                  alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                        <RefreshCw size={12} />
                        {staleSince
                            ? `آخر تحديث ناجح ${new Date(board.as_of).toLocaleTimeString('en-GB', { hour12: false })}`
                            : `يُحدَّث كل ${REFRESH_MS / 1000} ثانية`}
                    </div>
                </div>
            </div>

            {staleSince && (
                <div style={{ background: '#422006', border: `1px solid ${brand.amber}55`,
                              color: brand.amber, borderRadius: 12, padding: '10px 14px',
                              marginBottom: 18, fontSize: 13, display: 'flex', gap: 8 }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>
                        تعذّر تحديث الأرقام. المعروض أدناه هو آخر قراءة ناجحة، وليس الوضع الحالي.
                        {' · '}Showing the last successful reading, not the current state.
                    </span>
                </div>
            )}

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
                {stat(<Building2 size={16} />, totals.employers, 'المؤسسات المشاركة',
                      'Participating employers', brand.sky)}
                {stat(<UserCheck size={16} />, totals.attended, 'الحضور',
                      'Checked in', brand.teal,
                      totals.walk_ins ? `منهم ${totals.walk_ins} بدون تسجيل مسبق` : undefined)}
                {stat(<Users size={16} />, totals.registered, 'المسجّلون مسبقاً',
                      'Registered in advance', brand.amber)}
                {/* Vacancies is shown only when there are some. A bare "0" on a
                    screen at a recruitment event reads as a broken board, and
                    right now no participating employer has published one. */}
                {totals.vacancies > 0 && stat(<Briefcase size={16} />, totals.vacancies,
                      'الشواغر المعروضة', 'Published vacancies', brand.rose)}
            </div>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
                {breakdown(board.gender, 'التوزيع النوعي للحضور',
                           'Gender of attendees', [brand.sky, brand.rose], GENDER_AR)}
                {breakdown(board.education, 'المستوى التعليمي للحضور',
                           'Education level of attendees', [brand.teal, brand.amber, brand.sky, brand.rose])}
            </div>

            {board.employers.length > 0 && (
                <div style={{ background: brand.panel, border: `1px solid ${brand.line}`,
                              borderRadius: 16, padding: 20 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>المؤسسات الحاضرة</div>
                    <div style={{ fontSize: 12, color: brand.dim, marginBottom: 12 }}>
                        Employers present
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {board.employers.map((e, i) => (
                            <span key={i} style={{ background: brand.line, borderRadius: 99,
                                                   padding: '6px 14px', fontSize: 13 }}>
                                {e.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ marginTop: 18, fontSize: 11.5, color: brand.dim, textAlign: 'center' }}>
                جميع الأرقام محسوبة من السجلات الفعلية · All figures counted from recorded check-ins
            </div>
        </div>
    );
};

export default EventLiveBoard;
