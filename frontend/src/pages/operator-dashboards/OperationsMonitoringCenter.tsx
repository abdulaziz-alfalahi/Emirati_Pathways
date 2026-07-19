import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import {
    Activity, Users, Building2, Briefcase, BarChart3, Flag, Clock,
    CheckCircle, AlertTriangle, Globe, Zap, UserCheck, Award, Target,
    Video, CalendarCheck, CalendarClock, PlayCircle, ThumbsUp, ThumbsDown,
    FileText, Loader2, MonitorPlay, RefreshCw
} from 'lucide-react';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useOperationsData } from '@/hooks/useOperationsData';

/**
 * OPERATIONS CENTER — AT-DESK SURFACE (/operations-center)
 *
 * Light, standard density, full platform chrome, interactive. This is the
 * operator-at-a-desk view and it lives inside the normal design system.
 *
 * The command-room WALL DISPLAY is a SEPARATE route
 * (/operations-center/display, see OperationsWallDisplay.tsx). A wall display
 * is not "this page, darker": viewing distance changes the design. Splitting
 * the routes is what lets this one be light — dark in a bright office inverts
 * the ergonomics — without taking dark away from the room where it is correct.
 *
 * Colour here comes from tokens, not literals: previously this screen carried
 * its own 18-entry hex palette (a fragmentation exhibit in the audit).
 */

const OperationsMonitoringCenter: React.FC = () => {
    const { language, toggleLanguage } = useLanguage();
    const isRTL = language === 'ar';
    const t = (en: string, ar: string) => (isRTL ? ar : en);

    const {
        data, funnelData, loading, error,
        lastUpdatedAt, secondsSinceUpdate, feedStatus, refresh,
    } = useOperationsData();

    const ph = data?.platform_health;
    const tp = data?.talent_pipeline;
    const ea = data?.employer_activity;
    const it = data?.interview_tracker;
    const ss = data?.shortlist_stats;

    const locale = isRTL ? 'ar-AE' : 'en-US';

    /* ── Building blocks ──────────────────────────────────────────────────── */

    /** A signed delta plus its period label. Only the NUMBER is direction-isolated —
     *  wrapping the whole phrase in dir="ltr" would reorder the Arabic words, while
     *  leaving it unisolated renders "+0" as "0+" inside an RTL run. */
    const Delta = ({ value }: { value: number }) => (
        <>
            <span dir="ltr" className="inline-block">+{value}</span> {t('this wk', 'هذا الأسبوع')}
        </>
    );

    const SectionHeading = ({ icon: Icon, children, aside }: any) => (
        <div className="flex items-center gap-2 mb-4">
            <Icon size={16} className="text-primary" aria-hidden="true" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">{children}</h2>
            {aside && <span className="ms-auto text-xs text-muted-foreground">{aside}</span>}
        </div>
    );

    const BigStat = ({ label, value, icon: Icon, sub, tone = 'primary' }: any) => {
        // Absent readings never wear the success colour — "—" in green reads as
        // healthy when it means we have no reading at all.
        const ok = tone === 'success' && value !== '—' && value !== null && value !== undefined;
        return (
        <Card className="flex items-center gap-4 p-4">
            <div className={`rounded-md p-2 ${ok ? 'bg-tint-success' : 'bg-accent'}`}>
                <Icon size={20} className={ok ? 'text-success' : 'text-primary'} aria-hidden="true" />
            </div>
            <div className="min-w-0">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
                <div className="text-2xl font-extrabold text-foreground tabular-nums">{value}</div>
            </div>
            {sub && (
                <div className="ms-auto text-end">
                    <div className="text-xs text-muted-foreground">{sub.label}</div>
                    {/* dir="ltr" keeps the leading "+" attached to the number: in an
                        RTL run the bidi algorithm otherwise renders "+0" as "0+". */}
                    <div dir="ltr" className="text-sm font-semibold text-success">{sub.value}</div>
                </div>
            )}
        </Card>
        );
    };

    const MetricCard = ({ label, value, icon: Icon, sub }: any) => (
        <div className="flex items-center gap-3 rounded-md border border-border bg-muted px-3 py-3">
            <div className="rounded-sm bg-accent p-1.5">
                <Icon size={16} className="text-primary" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
                <div className="text-xl font-bold text-foreground tabular-nums">{value}</div>
            </div>
            {sub && <div className="text-[11px] text-muted-foreground text-end">{sub}</div>}
        </div>
    );

    /** Emphasis tile — tone maps to a semantic token, never a raw hex. */
    const ToneTile = ({ icon: Icon, value, label, total, tone }: any) => {
        const tones: Record<string, { text: string; border: string; bg: string }> = {
            warning: { text: 'text-warning', border: 'border-edge-warning', bg: 'bg-tint-warning' },
            info: { text: 'text-info', border: 'border-edge-info', bg: 'bg-tint-info' },
            success: { text: 'text-success', border: 'border-edge-success', bg: 'bg-tint-success' },
            danger: { text: 'text-danger', border: 'border-edge-danger', bg: 'bg-tint-danger' },
        };
        const s = tones[tone] ?? tones.info;
        return (
            <div className={`rounded-md border ${s.border} ${s.bg} px-3 py-4 text-center`}>
                <Icon size={20} className={`mx-auto mb-1.5 ${s.text}`} aria-hidden="true" />
                <div className={`text-3xl font-extrabold tabular-nums ${s.text}`}>{value}</div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
                {total !== undefined && (
                    <div className="mt-1 text-[11px] text-muted-foreground">
                        {t('Total:', 'الإجمالي:')} {total}
                    </div>
                )}
            </div>
        );
    };

    /* ── Feed status pill — the desk equivalent of the wall's stale banner ── */
    const feedPill = {
        live: { cls: 'bg-tint-success text-success', label: t('Live', 'مباشر') },
        stale: { cls: 'bg-tint-warning text-warning', label: t('Delayed', 'متأخر') },
        down: { cls: 'bg-tint-danger text-danger', label: t('Feed down', 'انقطاع البث') },
    }[feedStatus];

    return (
        <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
            <HybridGovernmentNavFixed onLanguageToggle={toggleLanguage} currentLanguage={language} />

            <main id="main-content" className="container mx-auto px-4 pb-12" style={{ paddingTop: 100 }}>
                {/* ── Page header ──────────────────────────────────────────── */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            {t('Operations Monitoring Center', 'مركز مراقبة العمليات')}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {t('Platform health and live operational activity', 'صحة المنصة والنشاط التشغيلي المباشر')}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-semibold ${feedPill.cls}`}>
                            <span className="inline-block h-1.5 w-1.5 rounded-pill bg-current" aria-hidden="true" />
                            {feedPill.label}
                        </span>
                        {lastUpdatedAt && (
                            <span className="text-xs text-muted-foreground">
                                {t('Updated', 'آخر تحديث')} {lastUpdatedAt.toLocaleTimeString(locale, { hour12: false })}
                                {feedStatus !== 'live' && ` · ${secondsSinceUpdate}s`}
                            </span>
                        )}
                        <Button variant="outline" size="sm" onClick={refresh} className="gap-1.5">
                            <RefreshCw size={14} aria-hidden="true" />
                            {t('Refresh', 'تحديث')}
                        </Button>
                        <Button asChild size="sm" className="gap-1.5">
                            <Link to="/operations-center/display">
                                <MonitorPlay size={14} aria-hidden="true" />
                                {t('Wall display', 'شاشة الجدار')}
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* ── Loading / error ──────────────────────────────────────── */}
                {loading && !data && (
                    <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
                        <Loader2 size={24} className="animate-spin" aria-hidden="true" />
                        <span className="text-sm">{t('Loading live data…', 'جارٍ تحميل البيانات المباشرة…')}</span>
                    </div>
                )}

                {error && !data && (
                    <div className="flex items-center justify-center gap-3 py-16 text-danger" role="alert">
                        <AlertTriangle size={24} aria-hidden="true" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                {/* Data on screen but the feed has fallen behind. */}
                {data && feedStatus !== 'live' && (
                    <div
                        role="status"
                        className="mb-6 flex items-center gap-3 rounded-md border border-edge-warning bg-tint-warning px-4 py-3 text-sm text-foreground"
                    >
                        <AlertTriangle size={18} className="text-warning shrink-0" aria-hidden="true" />
                        <span>
                            {t(
                                `Figures are ${secondsSinceUpdate}s old — the live feed has not refreshed.`,
                                `البيانات قديمة منذ ${secondsSinceUpdate} ثانية — لم يتم تحديث البث المباشر.`
                            )}
                        </span>
                    </div>
                )}

                {data && (
                    <div className="space-y-6">
                        {/* ── Platform health ──────────────────────────────── */}
                        <section aria-label={t('Platform health', 'صحة المنصة')}>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <BigStat
                                    label={t('Total Users', 'إجمالي المستخدمين')}
                                    value={(ph?.total_users || 0).toLocaleString(locale)}
                                    icon={Activity}
                                    tone="success"
                                    sub={{ label: t('Today', 'اليوم'), value: `+${ph?.registrations_today || 0}` }}
                                />
                                <BigStat
                                    label={t('Registrations This Week', 'تسجيلات الأسبوع')}
                                    value={(ph?.registrations_week || 0).toLocaleString(locale)}
                                    icon={UserCheck}
                                    sub={{ label: t('Today', 'اليوم'), value: `+${ph?.registrations_today || 0}` }}
                                />
                                <BigStat label={t('Uptime', 'التشغيل')} value={ph?.uptime || '—'} icon={Globe} tone="success" />
                                <BigStat label={t('Response Time', 'وقت الاستجابة')} value={ph?.response_time || '—'} icon={Zap} />
                            </div>
                        </section>

                        {/* ── Talent pipeline + employer activity ──────────── */}
                        <div className="grid gap-6 lg:grid-cols-2">
                            <Card className="p-5">
                                <SectionHeading icon={Users}>{t('Talent Pipeline', 'خط الكوادر')}</SectionHeading>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <MetricCard label={t('Candidates', 'المرشحون')} value={tp?.total_candidates || 0} icon={Users} />
                                    <MetricCard label={t('CVs Created', 'السير الذاتية')} value={tp?.total_cvs || 0} icon={FileText} />
                                    <MetricCard
                                        label={t('Applications', 'الطلبات')}
                                        value={tp?.total_applications || 0}
                                        icon={Briefcase}
                                        sub={<Delta value={tp?.applications_week || 0} />}
                                    />
                                    <MetricCard label={t('Placements', 'التوظيف')} value={tp?.placements || 0} icon={Target} />
                                </div>
                            </Card>

                            <Card className="p-5">
                                <SectionHeading icon={Building2}>{t('Employer Activity', 'نشاط أصحاب العمل')}</SectionHeading>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <MetricCard label={t('Companies', 'الشركات')} value={ea?.total_companies || 0} icon={Building2} />
                                    <MetricCard
                                        label={t('Active Vacancies', 'الوظائف الشاغرة')}
                                        value={ea?.active_vacancies || 0}
                                        icon={Briefcase}
                                        sub={<Delta value={ea?.new_jobs_week || 0} />}
                                    />
                                    <MetricCard label={t('Total Jobs', 'إجمالي الوظائف')} value={ea?.total_jobs || 0} icon={Briefcase} />
                                    <MetricCard
                                        label={t('Offers Extended', 'العروض المقدمة')}
                                        value={ea?.total_offers || 0}
                                        icon={Award}
                                        sub={<Delta value={ea?.offers_week || 0} />}
                                    />
                                    {/* Not yet instrumented — shown as unavailable rather than as a zero. */}
                                    <MetricCard label={t('Avg Response Time', 'متوسط وقت الاستجابة')} value="—" icon={Clock} />
                                    <MetricCard label={t('Response Rate', 'نسبة الاستجابة')} value="—" icon={CheckCircle} />
                                </div>
                            </Card>
                        </div>

                        {/* ── Interviews + screening ───────────────────────── */}
                        <div className="grid gap-6 lg:grid-cols-2">
                            <Card className="p-5">
                                <SectionHeading icon={Video} aside={`${t('Total:', 'الإجمالي:')} ${it?.total || 0}`}>
                                    {t('Interview Tracker', 'متتبع المقابلات')}
                                </SectionHeading>
                                <div className="mb-3 grid gap-3 sm:grid-cols-3">
                                    <ToneTile icon={PlayCircle} value={it?.ongoing || 0} label={t('Ongoing Now', 'جارية الآن')} tone="warning" />
                                    <ToneTile icon={CalendarClock} value={it?.upcoming_today || 0} label={t('Upcoming Today', 'القادمة اليوم')} tone="info" />
                                    <ToneTile icon={CalendarCheck} value={it?.conducted_today || 0} label={t('Conducted Today', 'تم اليوم')} tone="success" />
                                </div>
                                <div className="flex gap-4 rounded-md bg-muted px-4 py-3">
                                    <div className="flex-1">
                                        <div className="text-[11px] uppercase text-muted-foreground">{t('Conducted This Week', 'تمت هذا الأسبوع')}</div>
                                        <div className="text-lg font-bold text-success tabular-nums">{it?.conducted_week || 0}</div>
                                    </div>
                                    <div className="w-px bg-border" aria-hidden="true" />
                                    <div className="flex-1">
                                        <div className="text-[11px] uppercase text-muted-foreground">{t('Upcoming This Week', 'القادمة هذا الأسبوع')}</div>
                                        <div className="text-lg font-bold text-info tabular-nums">{it?.upcoming_week || 0}</div>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-5">
                                <SectionHeading icon={BarChart3}>{t('Screening Decisions', 'قرارات الفرز')}</SectionHeading>
                                <div className="mb-4 grid gap-4 sm:grid-cols-2">
                                    <ToneTile
                                        icon={ThumbsUp}
                                        value={ss?.shortlisted_week || 0}
                                        label={t('Shortlisted This Week', 'قائمة مختصرة هذا الأسبوع')}
                                        total={ss?.shortlisted_total || 0}
                                        tone="success"
                                    />
                                    <ToneTile
                                        icon={ThumbsDown}
                                        value={ss?.rejected_week || 0}
                                        label={t('Rejected This Week', 'مرفوض هذا الأسبوع')}
                                        total={ss?.rejected_total || 0}
                                        tone="danger"
                                    />
                                </div>
                                {(ss?.shortlisted_total || 0) + (ss?.rejected_total || 0) > 0 && (() => {
                                    const total = (ss?.shortlisted_total || 0) + (ss?.rejected_total || 0);
                                    const ratio = Math.round(((ss?.shortlisted_total || 0) / total) * 100);
                                    return (
                                        <div>
                                            <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                                                <span>{t('Shortlist Rate', 'نسبة القائمة المختصرة')}</span>
                                                <span className="font-semibold text-foreground">{ratio}%</span>
                                            </div>
                                            <div
                                                className="flex h-1.5 overflow-hidden rounded-pill bg-border"
                                                role="img"
                                                aria-label={t(`Shortlist rate ${ratio} percent`, `نسبة القائمة المختصرة ${ratio} بالمئة`)}
                                            >
                                                <div className="bg-success transition-[width] duration-1000" style={{ width: `${ratio}%` }} />
                                                <div className="bg-danger transition-[width] duration-1000" style={{ width: `${100 - ratio}%` }} />
                                            </div>
                                        </div>
                                    );
                                })()}
                            </Card>
                        </div>

                        {/* ── Emiratization + live feed ────────────────────── */}
                        <div className="grid gap-6 lg:grid-cols-2">
                            <Card className="p-5">
                                <SectionHeading icon={Flag}>{t('Emiratization by Sector', 'التوطين حسب القطاع')}</SectionHeading>
                                {data.emiratization.sectors.length > 0 ? (
                                    <div className="grid gap-3">
                                        {data.emiratization.sectors.map((s, i) => (
                                            <div key={i}>
                                                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                                                    <span className="text-foreground">{s.name}</span>
                                                    <span className="flex gap-3">
                                                        <span>{s.total_jobs} {t('jobs', 'وظيفة')}</span>
                                                        {s.target > 0 && (
                                                            <span className="font-semibold text-warning">{t('target', 'الهدف')}: {s.target}%</span>
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="h-1 rounded-pill bg-border">
                                                    <div
                                                        className={`h-full rounded-pill transition-[width] duration-1000 ${s.target > 0 ? 'bg-warning' : 'bg-primary'}`}
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
                                    <p className="py-6 text-center text-sm text-muted-foreground">{t('No sector data', 'لا توجد بيانات قطاع')}</p>
                                )}
                            </Card>

                            <Card className="p-5">
                                <SectionHeading icon={Activity}>{t('Live Feed', 'التحديثات المباشرة')}</SectionHeading>
                                {data.live_feed.length > 0 ? (
                                    <ul className="divide-y divide-border">
                                        {data.live_feed.map((item, i) => (
                                            <li key={i} className="flex items-center justify-between gap-3 py-2">
                                                <span className="flex items-center gap-2 text-sm text-foreground">
                                                    <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-pill bg-primary" aria-hidden="true" />
                                                    {item.text}
                                                </span>
                                                {/* The API sometimes returns an empty `relative`, which used to
                                                    render a bare "ago" with nothing before it. No timestamp is
                                                    better than a dangling word. */}
                                                {item.relative && (
                                                    <span className="shrink-0 text-[11px] text-muted-foreground">
                                                        {item.relative} {t('ago', 'مضت')}
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="py-6 text-center text-sm text-muted-foreground">{t('No recent activity', 'لا يوجد نشاط حديث')}</p>
                                )}

                                {funnelData && (
                                    <div className="mt-4 border-t border-border pt-4">
                                        <div className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                                            {t('Conversion Funnel', 'قمع التحويل')}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {(() => {
                                                const steps = [
                                                    { label: t('Signups', 'التسجيلات'), value: funnelData.signups || 0 },
                                                    { label: t('Profile Completion', 'إكمال الملف'), value: funnelData.profile_completion || 0 },
                                                    { label: t('Job Applications', 'طلبات التوظيف'), value: funnelData.job_applications || 0 },
                                                ];
                                                // Scale against the LARGEST step, not the first. Live data has the
                                                // first step reporting 0 while later steps are non-zero, which made
                                                // every bar overflow to full width against a divide-by-zero guard.
                                                const peak = Math.max(...steps.map(s => s.value), 1);
                                                return steps.map((step, idx) => (
                                                <div key={idx} className="flex items-center gap-3">
                                                    <div className="w-28 shrink-0 text-xs text-muted-foreground">{step.label}</div>
                                                    <div className="relative h-6 flex-1 overflow-hidden rounded-pill bg-muted">
                                                        <div
                                                            className="flex h-full items-center bg-primary ps-3 transition-[width] duration-1000"
                                                            style={{ width: `${Math.max(5, (step.value / peak) * 100)}%` }}
                                                        >
                                                            <span className="text-[11px] font-bold text-primary-foreground tabular-nums">
                                                                {step.value.toLocaleString(locale)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ));
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default OperationsMonitoringCenter;
