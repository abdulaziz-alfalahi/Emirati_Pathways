import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import {
    Activity, Users, Building2, Briefcase, Flag, UserCheck, Award, Target,
    PlayCircle, CalendarClock, CalendarCheck, ThumbsUp, ThumbsDown,
    AlertTriangle, WifiOff, Loader2, FileText, Globe, Zap,
} from 'lucide-react';
import { useOperationsData } from '@/hooks/useOperationsData';

/**
 * OPERATIONS CENTER — COMMAND-ROOM WALL DISPLAY (/operations-center/display)
 *
 * This is NOT "the operations dashboard, darker". Viewing distance (3–5m)
 * changes the design, so this route is built to a different brief:
 *
 *  · DARK is correct ergonomics here, not styling — a dim room, long shifts,
 *    status that must read as luminous. Scoped via [data-theme="control-room"],
 *    which re-points the SAME semantic tokens. Not a second design language,
 *    and not an app-wide dark theme (the platform is light only).
 *  · AMBIENT posture ([data-density="ambient"]) — the far end of the density
 *    dial, LOOSER than Guided. The constraint is distance, not screen space.
 *  · NO INTERACTION MODEL. Nobody touches a wall: no hover, tooltips, tabs or
 *    controls, and nothing is hidden behind them. Every number is on screen.
 *  · ONE VIEWPORT, NO SCROLLING. Content off-screen on a wall does not exist.
 *  · TYPE SCALES WITH THE SCREEN. Sizes are clamp(vw) rather than fixed rem,
 *    because the panel size is unknown at build time.
 *  · STALE DATA IS LOUD. An unattended display that freezes looks exactly like
 *    a calm one — so a stalled feed takes over the screen rather than whispering.
 *  · Status never reads by COLOUR ALONE: every state carries an icon and a word
 *    (WCAG 1.4.1, and colour-blind operators exist in every room).
 *
 * Global chrome (header, mega-nav, FABs, toasts) is suppressed for this route
 * in App.tsx — chrome is wasted wall space.
 *
 * SECURITY CONTRACT — long-lived session, READ-ONLY (owner-decided).
 *
 * A wall display cannot re-login, so JWT expiry would silently blank it, and a
 * blank wall in a command room is an outage nobody gets paged for. It therefore
 * runs on a long-lived session. The room is semi-public, so that credential is
 * constrained rather than trusted:
 *
 *   · a DEDICATED account — never a real operator's token
 *   · READ-ONLY — it may GET the two operations endpoints and nothing else
 *   · LOW-PRIVILEGE — no access to PII, no mutating routes, no admin surface
 *   · SCOPED to this route
 *
 * This screen is built to honour that: it issues no writes, exposes no
 * controls, and renders only aggregate counts — no candidate names, no
 * employer records, nothing that identifies a person. Keep it that way. If a
 * future panel here needs per-person data, it needs a different auth story,
 * not a wider token.
 *
 * NOT YET PROVISIONED — the account and the backend scope check still have to
 * be created before this route is deployed to a room.
 */

const OperationsWallDisplay: React.FC = () => {
    const { language } = useLanguage();
    const isRTL = language === 'ar';
    const t = (en: string, ar: string) => (isRTL ? ar : en);
    const locale = isRTL ? 'ar-AE' : 'en-US';

    const { data, loading, lastUpdatedAt, secondsSinceUpdate, feedStatus } = useOperationsData();
    const [clock, setClock] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setClock(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const ph = data?.platform_health;
    const tp = data?.talent_pipeline;
    const ea = data?.employer_activity;
    const it = data?.interview_tracker;
    const ss = data?.shortlist_stats;

    /* Type scale: viewport-relative so one build serves a 27" desk monitor and
       a 75" wall panel. Floor/ceiling keep it sane at both extremes. */
    const TYPE = {
        hero: 'text-[clamp(2.5rem,5.2vw,7rem)]',
        big: 'text-[clamp(1.75rem,3.4vw,4.5rem)]',
        mid: 'text-[clamp(1.1rem,1.7vw,2.25rem)]',
        label: 'text-[clamp(.7rem,.85vw,1.15rem)]',
    };

    const Tile = ({ icon: Icon, label, value, sub, tone = 'default' }: any) => {
        const tones: Record<string, string> = {
            default: 'text-foreground',
            primary: 'text-primary',
            success: 'text-success',
            warning: 'text-warning',
            danger: 'text-danger',
        };
        // A missing value must never wear a status colour. Uptime rendered as a
        // green em dash reads as "healthy" from across the room when it actually
        // means "we have no reading" — the opposite of the truth.
        const unavailable = value === '—' || value === null || value === undefined || value === '';
        if (unavailable) tone = 'muted';
        tones.muted = 'text-muted-foreground';
        return (
            <div className="flex min-w-0 flex-col justify-center rounded-lg border border-border bg-card px-[1.2vw] py-[1vh]">
                <div className={`flex items-center gap-[.5vw] ${TYPE.label} uppercase tracking-wide text-muted-foreground`}>
                    <Icon className="h-[1.4vw] w-[1.4vw] min-h-3 min-w-3 shrink-0" aria-hidden="true" />
                    <span className="truncate">{label}</span>
                </div>
                <div className={`${TYPE.big} font-extrabold tabular-nums leading-tight ${tones[tone]}`}>{value}</div>
                {sub && <div className={`${TYPE.label} text-muted-foreground`}>{sub}</div>}
            </div>
        );
    };

    /* ── Feed status: icon + word + colour, never colour alone ─────────────── */
    const status = {
        live: { icon: Activity, word: t('LIVE', 'مباشر'), cls: 'text-success border-edge-success bg-tint-success' },
        stale: { icon: AlertTriangle, word: t('DELAYED', 'متأخر'), cls: 'text-warning border-edge-warning bg-tint-warning' },
        down: { icon: WifiOff, word: t('FEED DOWN', 'انقطاع البث'), cls: 'text-danger border-edge-danger bg-tint-danger' },
    }[feedStatus];
    const StatusIcon = status.icon;

    return (
        <div
            data-theme="control-room"
            data-density="ambient"
            dir={isRTL ? 'rtl' : 'ltr'}
            className="fixed inset-0 flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground"
        >
            {/* ── Header: identity, feed status, clock ─────────────────────── */}
            <header className="flex shrink-0 items-center justify-between gap-[2vw] border-b border-border px-[2vw] py-[1.2vh]">
                <div className="min-w-0">
                    <div className={`${TYPE.mid} font-bold leading-tight`}>
                        {t('Operations Monitoring Center', 'مركز مراقبة العمليات')}
                    </div>
                    <div className={`${TYPE.label} text-muted-foreground`}>
                        {t('EHRDC Platform Command Center', 'مركز قيادة منصة الهيئة')}
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-[1.5vw]">
                    <div className={`flex items-center gap-[.6vw] rounded-pill border px-[1vw] py-[.4vh] ${status.cls}`}>
                        <StatusIcon className="h-[1.5vw] w-[1.5vw] min-h-4 min-w-4" aria-hidden="true" />
                        <span className={`${TYPE.label} font-bold tracking-wide`}>{status.word}</span>
                    </div>
                    <div className="text-end">
                        <div className={`${TYPE.mid} font-bold tabular-nums leading-none`}>
                            {clock.toLocaleTimeString('en-GB', { hour12: false })}
                        </div>
                        <div className={`${TYPE.label} text-muted-foreground`}>
                            {clock.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Stale / down banner — takes real estate, by design ────────── */}
            {feedStatus !== 'live' && (
                <div
                    role="alert"
                    className={`flex shrink-0 items-center justify-center gap-[1vw] border-b px-[2vw] py-[1.2vh] ${
                        feedStatus === 'down' ? 'border-edge-danger bg-tint-danger' : 'border-edge-warning bg-tint-warning'
                    }`}
                >
                    <AlertTriangle
                        className={`h-[2.2vw] w-[2.2vw] min-h-5 min-w-5 shrink-0 ${feedStatus === 'down' ? 'text-danger' : 'text-warning'}`}
                        aria-hidden="true"
                    />
                    <span className={`${TYPE.mid} font-bold ${feedStatus === 'down' ? 'text-danger' : 'text-warning'}`}>
                        {feedStatus === 'down'
                            ? t(
                                `NOT UPDATING — last refresh ${Math.floor(secondsSinceUpdate / 60)}m ago. Figures below are NOT current.`,
                                `لا يتم التحديث — آخر تحديث قبل ${Math.floor(secondsSinceUpdate / 60)} دقيقة. الأرقام أدناه ليست حالية.`
                            )
                            : t(
                                `Feed delayed — last refresh ${secondsSinceUpdate}s ago.`,
                                `تأخر البث — آخر تحديث قبل ${secondsSinceUpdate} ثانية.`
                            )}
                    </span>
                </div>
            )}

            {/* ── First paint only; afterwards stale data stays up ──────────── */}
            {loading && !data && (
                <div className="flex flex-1 items-center justify-center gap-[1vw] text-muted-foreground">
                    <Loader2 className="h-[3vw] w-[3vw] animate-spin" aria-hidden="true" />
                    <span className={TYPE.mid}>{t('Connecting to live feed…', 'جارٍ الاتصال بالبث المباشر…')}</span>
                </div>
            )}

            {data && (
                <main className="grid min-h-0 flex-1 grid-rows-3 gap-[1vh] p-[1.2vw]">
                    {/* ── Row 1: headline health ───────────────────────────── */}
                    <section className="grid min-h-0 grid-cols-4 gap-[1vw]" aria-label={t('Platform health', 'صحة المنصة')}>
                        <div className="flex min-w-0 flex-col justify-center rounded-lg border border-edge-primary bg-tint-primary px-[1.2vw]">
                            <div className={`${TYPE.label} uppercase tracking-wide text-muted-foreground`}>
                                {t('Total Users', 'إجمالي المستخدمين')}
                            </div>
                            <div className={`${TYPE.hero} font-extrabold tabular-nums leading-none text-primary`}>
                                {(ph?.total_users || 0).toLocaleString(locale)}
                            </div>
                            <div className={`${TYPE.label} text-success`}>
                                {/* Signed numbers need their own direction: in an RTL run the
                                    bidi algorithm moves a leading "+" to the right, so "+0"
                                    renders as "0+". Isolating the token keeps the sign attached. */}
                                <span dir="ltr" className="inline-block">+{ph?.registrations_today || 0}</span>{' '}
                                {t('today', 'اليوم')}
                            </div>
                        </div>
                        <Tile
                            icon={UserCheck}
                            label={t('Registrations This Week', 'تسجيلات الأسبوع')}
                            value={(ph?.registrations_week || 0).toLocaleString(locale)}
                        />
                        <Tile icon={Globe} label={t('Uptime', 'التشغيل')} value={ph?.uptime || '—'} tone="success" />
                        <Tile icon={Zap} label={t('Response Time', 'وقت الاستجابة')} value={ph?.response_time || '—'} />
                    </section>

                    {/* ── Row 2: interviews + screening — the live operational picture ── */}
                    <section className="grid min-h-0 grid-cols-5 gap-[1vw]" aria-label={t('Interviews and screening', 'المقابلات والفرز')}>
                        <Tile icon={PlayCircle} label={t('Ongoing Now', 'جارية الآن')} value={it?.ongoing || 0} tone="warning" />
                        <Tile icon={CalendarClock} label={t('Upcoming Today', 'القادمة اليوم')} value={it?.upcoming_today || 0} tone="primary" />
                        <Tile icon={CalendarCheck} label={t('Conducted Today', 'تم اليوم')} value={it?.conducted_today || 0} tone="success" />
                        <Tile
                            icon={ThumbsUp}
                            label={t('Shortlisted This Week', 'قائمة مختصرة هذا الأسبوع')}
                            value={ss?.shortlisted_week || 0}
                            tone="success"
                            sub={`${t('Total', 'الإجمالي')} ${ss?.shortlisted_total || 0}`}
                        />
                        <Tile
                            icon={ThumbsDown}
                            label={t('Rejected This Week', 'مرفوض هذا الأسبوع')}
                            value={ss?.rejected_week || 0}
                            tone="danger"
                            sub={`${t('Total', 'الإجمالي')} ${ss?.rejected_total || 0}`}
                        />
                    </section>

                    {/* ── Row 3: pipeline, employers, Emiratisation ────────── */}
                    <section className="grid min-h-0 grid-cols-3 gap-[1vw]" aria-label={t('Pipeline and sectors', 'الكوادر والقطاعات')}>
                        <div className="grid min-h-0 grid-cols-2 grid-rows-2 gap-[.8vw]">
                            <Tile icon={Users} label={t('Candidates', 'المرشحون')} value={tp?.total_candidates || 0} />
                            <Tile icon={FileText} label={t('CVs', 'السير الذاتية')} value={tp?.total_cvs || 0} />
                            <Tile icon={Briefcase} label={t('Applications', 'الطلبات')} value={tp?.total_applications || 0} />
                            <Tile icon={Target} label={t('Placements', 'التوظيف')} value={tp?.placements || 0} tone="success" />
                        </div>

                        <div className="grid min-h-0 grid-cols-2 grid-rows-2 gap-[.8vw]">
                            <Tile icon={Building2} label={t('Companies', 'الشركات')} value={ea?.total_companies || 0} />
                            <Tile icon={Briefcase} label={t('Active Vacancies', 'الوظائف الشاغرة')} value={ea?.active_vacancies || 0} tone="primary" />
                            <Tile icon={Briefcase} label={t('Total Jobs', 'إجمالي الوظائف')} value={ea?.total_jobs || 0} />
                            <Tile icon={Award} label={t('Offers Extended', 'العروض المقدمة')} value={ea?.total_offers || 0} />
                        </div>

                        <div className="flex min-h-0 flex-col rounded-lg border border-border bg-card px-[1.2vw] py-[1vh]">
                            <div className={`mb-[.8vh] flex items-center gap-[.5vw] ${TYPE.label} uppercase tracking-wide text-muted-foreground`}>
                                <Flag className="h-[1.4vw] w-[1.4vw] min-h-3 min-w-3" aria-hidden="true" />
                                {t('Emiratization by Sector', 'التوطين حسب القطاع')}
                            </div>
                            {data.emiratization.sectors.length > 0 ? (
                                <div className="flex min-h-0 flex-1 flex-col justify-around gap-[.6vh] overflow-hidden">
                                    {/* Capped to what fits — a wall must never scroll. */}
                                    {data.emiratization.sectors.slice(0, 5).map((s, i) => (
                                        <div key={i}>
                                            <div className={`flex justify-between ${TYPE.label}`}>
                                                <span className="truncate text-foreground">{s.name}</span>
                                                <span className="shrink-0 ps-[.5vw] tabular-nums text-muted-foreground">
                                                    {s.total_jobs}
                                                    {s.target > 0 && <span className="text-warning"> · {s.target}%</span>}
                                                </span>
                                            </div>
                                            <div className="mt-[.3vh] h-[.8vh] min-h-1 rounded-pill bg-border">
                                                <div
                                                    className={`h-full rounded-pill ${s.target > 0 ? 'bg-warning' : 'bg-primary'}`}
                                                    style={{
                                                        width: `${Math.min(
                                                            (s.total_jobs / (data.emiratization.sectors[0]?.total_jobs || 1)) * 100, 100
                                                        )}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={`flex flex-1 items-center justify-center ${TYPE.label} text-muted-foreground`}>
                                    {t('No sector data', 'لا توجد بيانات قطاع')}
                                </div>
                            )}
                        </div>
                    </section>
                </main>
            )}

            {/* ── Footer: provenance. A wall must say when it last heard from the source. ── */}
            <footer className={`flex shrink-0 items-center justify-between border-t border-border px-[2vw] py-[.8vh] ${TYPE.label} text-muted-foreground`}>
                <span>{t('Auto-refresh every 30s', 'تحديث تلقائي كل 30 ثانية')}</span>
                <span className="tabular-nums">
                    {lastUpdatedAt
                        ? `${t('Last update', 'آخر تحديث')} ${lastUpdatedAt.toLocaleTimeString('en-GB', { hour12: false })}`
                        : t('Awaiting first update', 'في انتظار أول تحديث')}
                </span>
            </footer>
        </div>
    );
};

export default OperationsWallDisplay;
