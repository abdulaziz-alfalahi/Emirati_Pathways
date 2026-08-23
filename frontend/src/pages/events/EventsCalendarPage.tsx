import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { restClient } from '@/utils/api';
import LocationPicker from '@/components/common/LocationPicker';
import { toast } from '@/components/ui/use-toast';
import { CalendarDays, MapPin, Building2, Briefcase, Loader2, ArrowLeft, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';

/**
 * The recruitment open day calendar, for signed-in platform users.
 *
 * Deliberately not public (owner decision): announcements go out on social
 * media and drive people to register on the platform first, so by the time
 * someone attends they already have an account and can check in with UAE Pass.
 */

const fmtDate = (iso?: string | null, ar = false) => {
  if (!iso) return '';
  return new Date(iso).toLocaleString(ar ? 'ar-AE' : 'en-GB',
    { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
};

/* Local calendar-day key. Built from the local date parts rather than
   toISOString(), which converts to UTC first and files a 01:00 event in the UAE
   under the previous day. */
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const EventsCalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const b = (en: string, ar: string) => (isRTL ? ar : en);
  const [events, setEvents] = useState<any[] | null>(null);
  /* The month on screen. Starts on the month containing today, not on the month
     of the first event — someone opening the page wants to know what is on now. */
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  useEffect(() => {
    restClient.get('/api/events')
      .then(r => setEvents(r.data?.data || []))
      // null = could not load, which is a different statement from "no events"
      .catch(() => setEvents(null));
  }, []);

  const upcoming = (events || []).filter(e => !e.ends_at || new Date(e.ends_at) >= new Date());
  const past = (events || []).filter(e => e.ends_at && new Date(e.ends_at) < new Date());

  /* ── The month grid ──────────────────────────────────────────────────────
     Open days are single-day events, so each is filed under its start date.
     The week starts on Sunday, which is how a Gulf wall calendar reads.
     In RTL the grid mirrors on its own — CSS grid follows the container's
     direction — so the weekday order below is correct both ways. */
  const byDay = new Map<string, any[]>();
  for (const e of events || []) {
    if (!e.starts_at) continue;
    const k = dayKey(new Date(e.starts_at));
    byDay.set(k, [...(byDay.get(k) || []), e]);
  }

  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [
    // Blanks so the 1st lands under its real weekday.
    ...Array.from({ length: monthStart.getDay() }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i + 1)),
  ];
  const todayKey = dayKey(new Date());
  const weekdays = isRTL
    ? ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthLabel = cursor.toLocaleDateString(isRTL ? 'ar-AE' : 'en-GB',
    { month: 'long', year: 'numeric' });
  const shiftMonth = (n: number) =>
    setCursor(c => new Date(c.getFullYear(), c.getMonth() + n, 1));

  /* A cancelled event stays listed rather than disappearing — people were
     phoned and invited, and a silent vanishing sends them to the mall anyway.
     That only helps if the card says so loudly, so the title is struck through,
     the reason is carried on the card itself, and the employer count (a reason
     to attend) gives way to the cancellation. */
  const card = (e: any) => {
    const cancelled = e.status === 'cancelled';
    // Same rule as the detail page: marked completed, or the date has passed and
    // nobody has marked it. Without this a finished day carried an employer-count
    // badge and was indistinguishable from one still to come.
    const over = !cancelled && (e.status === 'completed'
      || (!!(e.ends_at || e.starts_at) && new Date(e.ends_at || e.starts_at) < new Date()));
    return (
      <Card key={e.id}
            className={`cursor-pointer transition-shadow hover:shadow-md ${
              cancelled ? 'border-red-200 bg-red-50/40'
                        : over ? 'border-slate-200 bg-slate-50/60'
                               : 'border-slate-200'}`}
            onClick={() => navigate(`/events/${e.id}`)}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className={`font-semibold ${cancelled ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                {isRTL && e.title_ar ? e.title_ar : e.title}
              </h3>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                <CalendarDays className="h-3.5 w-3.5" /> {fmtDate(e.starts_at, isRTL)}
              </p>
              {(e.venue || e.venue_ar) && (
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-600">
                  <MapPin className="h-3.5 w-3.5" /> {isRTL && e.venue_ar ? e.venue_ar : e.venue}
                </p>
              )}
              {cancelled && e.cancellation_reason && (
                <p className="mt-2 text-sm text-red-800">{e.cancellation_reason}</p>
              )}
            </div>
            {cancelled ? (
              <Badge className="shrink-0 border-red-200 bg-red-100 text-red-800">
                {b('Cancelled', 'ملغاة')}
              </Badge>
            ) : over ? (
              <Badge className="shrink-0 border-slate-200 bg-slate-100 text-slate-700">
                {b('Finished', 'انتهت')}
              </Badge>
            ) : e.employer_count > 0 ? (
              <Badge className="shrink-0 border-teal-200 bg-teal-50 text-teal-800">
                {b(`${e.employer_count} employer${e.employer_count === 1 ? '' : 's'}`,
                   `${e.employer_count} جهة توظيف`)}
              </Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <HybridGovernmentNavFixed />
      <div className="mx-auto max-w-4xl px-4 py-8" dir={isRTL ? 'rtl' : 'ltr'}>
        <h1 className="text-2xl font-bold text-slate-900">
          {b('Recruitment open days', 'أيام التوظيف المفتوحة')}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {b('Meet employers in person and interview on the day.',
             'قابل أصحاب العمل شخصياً وأجرِ المقابلة في نفس اليوم.')}
        </p>

        {events !== null && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => shiftMonth(-1)}
                      aria-label={b('Previous month', 'الشهر السابق')}>
                {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
              </Button>
              <p className="text-sm font-semibold text-slate-900">{monthLabel}</p>
              <Button variant="ghost" size="sm" onClick={() => shiftMonth(1)}
                      aria-label={b('Next month', 'الشهر التالي')}>
                {isRTL ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>

            <div className="mt-3 grid grid-cols-7 gap-1 text-center">
              {weekdays.map(w => (
                <div key={w} className="pb-1 text-[11px] font-medium text-slate-500">{w}</div>
              ))}
              {cells.map((d, i) => {
                if (!d) return <div key={`b${i}`} />;
                const k = dayKey(d);
                const dayEvents = byDay.get(k) || [];
                const isToday = k === todayKey;
                return (
                  <div key={k}
                       className={`min-h-[62px] rounded-lg border p-1 text-start align-top ${
                         isToday ? 'border-ehrdc-teal bg-teal-50/40' : 'border-slate-100'}`}>
                    <div className={`text-[11px] ${isToday ? 'font-bold text-ehrdc-teal' : 'text-slate-400'}`}>
                      {d.getDate()}
                    </div>
                    {dayEvents.map(e => {
                      const cancelled = e.status === 'cancelled';
                      // A candidate who has already said they are coming should
                      // see that on the day itself, not only inside the event.
                      const going = !cancelled && !!e.my_response && e.my_response !== 'declined';
                      return (
                        <button key={e.id} onClick={() => navigate(`/events/${e.id}`)}
                                title={isRTL && e.title_ar ? e.title_ar : e.title}
                                className={`mt-1 block w-full truncate rounded px-1 py-0.5 text-start text-[10px] leading-tight ${
                                  cancelled ? 'bg-red-100 text-red-800 line-through'
                                  : going ? 'bg-ehrdc-teal text-white'
                                  : 'bg-teal-50 text-teal-900 hover:bg-teal-100'}`}>
                          {isRTL && e.title_ar ? e.title_ar : e.title}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Without this, a month with nothing in it is indistinguishable
                from a month that failed to load. */}
            {![...byDay.keys()].some(k => k.startsWith(
              `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`)) && (
              <p className="mt-3 text-center text-xs text-slate-500">
                {b('Nothing scheduled this month.', 'لا توجد فعاليات هذا الشهر.')}
              </p>
            )}
          </div>
        )}

        {events === null ? (
          <p className="mt-10 text-center text-sm text-slate-500">
            {b('The events could not be loaded just now.', 'تعذّر تحميل الفعاليات في الوقت الحالي.')}
          </p>
        ) : events.length === 0 ? (
          <p className="mt-10 text-center text-sm text-slate-500">
            {b('No open days are scheduled yet. They will appear here when they are announced.',
               'لا توجد أيام مفتوحة مجدولة بعد. ستظهر هنا عند الإعلان عنها.')}
          </p>
        ) : (
          <>
            <div className="mt-6 space-y-3">{upcoming.map(card)}</div>
            {past.length > 0 && (
              <>
                <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  {b('Past events', 'فعاليات سابقة')}
                </h2>
                <div className="mt-3 space-y-3 opacity-70">{past.map(card)}</div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

export const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const b = (en: string, ar: string) => (isRTL ? ar : en);
  const [ev, setEv] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    restClient.get(`/api/events/${eventId}`)
      .then(r => setEv(r.data?.data || null))
      .catch(() => setEv(null))
      .finally(() => setLoading(false));
  }, [eventId]);

  const setInterest = async (on: boolean) => {
    setBusy(true);
    try {
      const res = on
        ? await restClient.post(`/api/events/${eventId}/interest`, {})
        : await restClient.delete(`/api/events/${eventId}/interest`);
      setEv((prev: any) => ({
        ...prev,
        my_response: on ? (res.data?.data?.response || 'confirmed') : null,
        my_source: on ? (res.data?.data?.source || 'self') : null,
      }));
      toast({
        title: on ? b("You're registered", 'تم تسجيل اهتمامك')
                  : b('Registration withdrawn', 'تم سحب التسجيل'),
        description: on
          ? b('Bring your Emirates ID. On the day, scan the QR at the venue for your queue number.',
              'أحضر هويتك الإماراتية. في يوم الفعالية، امسح رمز الاستجابة السريعة للحصول على رقمك.')
          : undefined,
      });
    } catch (e: any) {
      toast({ title: e?.response?.data?.message
                || b('That did not go through', 'لم تتم العملية'), variant: 'destructive' });
    } finally { setBusy(false); }
  };

  if (loading) {
    return (
      <><HybridGovernmentNavFixed />
        <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-ehrdc-teal" /></div>
      </>
    );
  }
  if (!ev) {
    return (
      <><HybridGovernmentNavFixed />
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <p className="text-slate-600">{b('This event is not available.', 'هذه الفعالية غير متاحة.')}</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/events')}>
            {b('Back to events', 'العودة إلى الفعاليات')}
          </Button>
        </div>
      </>
    );
  }

  const totalVacancies = (ev.employers || []).reduce((n: number, e: any) => n + (e.vacancies?.length || 0), 0);
  // 'declined' counts as not registered: the button is how they change their mind.
  const registered = !!ev.my_response && ev.my_response !== 'declined';
  // Phoned by an agent but not yet confirmed — this is where they confirm.
  const invitedAwaiting = ev.my_response === 'invited';
  const hasPassed = !!(ev.ends_at || ev.starts_at)
    && new Date(ev.ends_at || ev.starts_at) < new Date();
  // TO A READER an event is over for either of two reasons, and the page has to
  // treat them the same: it was marked completed, or its date has passed and
  // nobody has marked it yet. Keying only on the date missed the first case —
  // the event that prompted this was marked completed while still dated in the
  // future (fb_1787480900, 2026-08-23).
  const isOver = ev.status === 'completed' || (ev.status !== 'cancelled' && hasPassed);

  return (
    <>
      <HybridGovernmentNavFixed />
      <div className="mx-auto max-w-3xl px-4 py-8" dir={isRTL ? 'rtl' : 'ltr'}>
        <Button variant="ghost" size="sm" className="mb-3 gap-1" onClick={() => navigate('/events')}>
          {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          {b('All events', 'كل الفعاليات')}
        </Button>

        <h1 className={`text-2xl font-bold ${ev.status === 'cancelled' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
          {isRTL && ev.title_ar ? ev.title_ar : ev.title}
        </h1>

        {/* Placed above everything else: someone opening this page on the day
            needs the cancellation before the venue and the directions, not
            after them. */}
        {ev.status === 'cancelled' && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="flex items-center gap-2 font-semibold text-red-900">
              <AlertTriangle className="h-4 w-4" />
              {b('This open day has been cancelled', 'تم إلغاء هذا اليوم المفتوح')}
            </p>
            {ev.cancellation_reason && (
              <p className="mt-1.5 text-sm text-red-800">{ev.cancellation_reason}</p>
            )}
            <p className="mt-2 text-xs text-red-700">
              {b('Please do not travel to the venue. Other open days appear on the events page.',
                 'يرجى عدم التوجه إلى المكان. تظهر الأيام المفتوحة الأخرى في صفحة الفعاليات.')}
            </p>
          </div>
        )}

        {/* Say so POSITIVELY. The page used to have no finished state at all: it
            silently dropped the register-interest card and said nothing, so a
            reader could not tell whether the day was over or the page was
            broken — and read it as broken (fb_1787480900). Sits above the venue
            for the same reason the cancellation notice does. */}
        {isOver && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="flex items-center gap-2 font-semibold text-slate-800">
              <CheckCircle2 className="h-4 w-4 text-slate-500" />
              {b('This open day has finished', 'انتهى هذا اليوم المفتوح')}
            </p>
            <p className="mt-2 text-xs text-slate-600">
              {b('The employers below took part. Upcoming open days appear on the events page.',
                 'شاركت جهات التوظيف أدناه. تظهر الأيام المفتوحة القادمة في صفحة الفعاليات.')}
            </p>
          </div>
        )}

        <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-700">
          <CalendarDays className="h-4 w-4" /> {fmtDate(ev.starts_at, isRTL)}
        </p>
        {(ev.venue || ev.venue_ar) && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-700">
            <MapPin className="h-4 w-4" /> {isRTL && ev.venue_ar ? ev.venue_ar : ev.venue}
          </p>
        )}
        {(ev.description || ev.description_ar) && (
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-700">
            {isRTL && ev.description_ar ? ev.description_ar : ev.description}
          </p>
        )}

        {/* Read-only map, plus a hand-off to a real maps app — this page is read
            on the way to the venue, and nobody navigates from a static image.
            Withheld once cancelled: "Get directions" is an invitation to travel
            somewhere there is no longer anything to attend. */}
        {ev.status !== 'cancelled' && ev.venue_lat != null && ev.venue_lng != null && (
          <div className="mt-5">
            <LocationPicker lat={ev.venue_lat} lng={ev.venue_lng} readOnly
                            onLocationSelect={() => {}}
                            label={b('Where it is', 'أين يقع')} height="240px" />
            {/* Withheld once the day is over, for the reason already applied to
                a cancelled one: "Get directions" invites travel to somewhere
                there is nothing left to attend. The map stays — where it was
                held is still context. */}
            {!isOver && (
              <a className="mt-2 inline-block text-sm font-medium text-ehrdc-teal underline"
                 href={`https://www.google.com/maps/dir/?api=1&destination=${ev.venue_lat},${ev.venue_lng}`}
                 target="_blank" rel="noopener noreferrer">
                {b('Get directions', 'الحصول على الاتجاهات')}
              </a>
            )}
          </div>
        )}

        {/* Registering interest is only meaningful for an event that is still
            going to happen — offering it on a cancelled or finished day would
            take a commitment nobody can act on. */}
        {ev.status === 'published' && !hasPassed && (
          <Card className="mt-6 border-ehrdc-teal/30 bg-teal-50/40">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              {registered ? (
                <>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-ehrdc-teal" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {b("You're registered for this open day", 'أنت مسجّل في هذا اليوم المفتوح')}
                      </p>
                      <p className="text-xs text-slate-600">
                        {b('Bring your Emirates ID. Scan the QR code at the venue on the day for your queue number.',
                           'أحضر هويتك الإماراتية. امسح رمز الاستجابة السريعة في المكان يوم الفعالية للحصول على رقمك.')}
                      </p>
                    </div>
                  </div>
                  {/* Only a self-registration is the candidate's to withdraw.
                      An agent's phone call is a record of a conversation, and
                      deleting it here would erase the fact that it happened —
                      so that case is a message to the team, not a button. */}
                  {ev.my_source === 'self' ? (
                    <Button variant="outline" size="sm" disabled={busy}
                            onClick={() => setInterest(false)}>
                      {busy && <Loader2 className="me-2 h-3.5 w-3.5 animate-spin" />}
                      {b("I can't make it", 'لا أستطيع الحضور')}
                    </Button>
                  ) : (
                    <p className="max-w-[16rem] text-xs text-slate-500">
                      {b('The EHRDC team registered you by phone. Please call them if you can no longer attend.',
                         'قام فريق المجلس بتسجيلك عبر الهاتف. يرجى الاتصال بهم إذا تعذّر عليك الحضور.')}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {invitedAwaiting
                        ? b('EHRDC invited you to this open day', 'دعاك المجلس إلى هذا اليوم المفتوح')
                        : b('Planning to come?', 'هل تنوي الحضور؟')}
                    </p>
                    <p className="text-xs text-slate-600">
                      {b('Let us know so the employers can expect you.',
                         'أخبرنا لتتمكن جهات التوظيف من توقّع حضورك.')}
                    </p>
                  </div>
                  <Button disabled={busy} onClick={() => setInterest(true)}>
                    {busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                    {invitedAwaiting ? b("Yes, I'll be there", 'نعم، سأحضر')
                                     : b('Register my interest', 'تسجيل اهتمامي')}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="mt-8 border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-ehrdc-teal" />
              {b('Employers attending', 'جهات التوظيف المشاركة')}
              {totalVacancies > 0 && (
                <span className="text-xs font-normal text-slate-500">
                  {b(`· ${totalVacancies} vacancies`, `· ${totalVacancies} شاغر`)}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(ev.employers || []).length === 0 ? (
              /* Say which of the two it is. "No employers yet" and "employers
                 attending but no vacancies published" are different facts. */
              <p className="text-sm text-slate-500">
                {b('Employers for this event have not been confirmed yet.',
                   'لم يتم تأكيد جهات التوظيف لهذه الفعالية بعد.')}
              </p>
            ) : (
              <div className="space-y-4">
                {ev.employers.map((c: any) => (
                  <div key={c.company_id} className="rounded-lg border border-slate-100 p-3">
                    <p className="font-medium text-slate-900">{c.company_name}</p>
                    {c.industry && <p className="text-xs text-slate-500">{c.industry}</p>}
                    {c.vacancies?.length ? (
                      <ul className="mt-2 space-y-1">
                        {c.vacancies.map((v: any) => (
                          <li key={v.id} className="flex items-center gap-1.5 text-sm text-slate-700">
                            <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                            {v.title}
                            {v.location && <span className="text-xs text-slate-400">· {v.location}</span>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-xs text-slate-400">
                        {b('No published vacancies listed yet.', 'لا توجد شواغر منشورة بعد.')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Only 'cancelled' was excluded here, so a COMPLETED event still told
            the reader to turn up on the day and scan a QR for something that
            had already happened — visible in the reporter's screenshot. */}
        {ev.status !== 'cancelled' && !isOver && (
          <p className="mt-6 text-xs leading-relaxed text-slate-500">
            {b('On the day, scan the QR code at the venue to register your attendance and receive your queue number.',
               'في يوم الفعالية، امسح رمز الاستجابة السريعة في المكان لتسجيل حضورك والحصول على رقمك في الطابور.')}
          </p>
        )}
      </div>
    </>
  );
};

export default EventsCalendarPage;
