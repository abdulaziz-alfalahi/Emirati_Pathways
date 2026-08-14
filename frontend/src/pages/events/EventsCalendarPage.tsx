import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { restClient } from '@/utils/api';
import LocationPicker from '@/components/common/LocationPicker';
import { CalendarDays, MapPin, Building2, Briefcase, Loader2, ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';

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

export const EventsCalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const b = (en: string, ar: string) => (isRTL ? ar : en);
  const [events, setEvents] = useState<any[] | null>(null);

  useEffect(() => {
    restClient.get('/api/events')
      .then(r => setEvents(r.data?.data || []))
      // null = could not load, which is a different statement from "no events"
      .catch(() => setEvents(null));
  }, []);

  const upcoming = (events || []).filter(e => !e.ends_at || new Date(e.ends_at) >= new Date());
  const past = (events || []).filter(e => e.ends_at && new Date(e.ends_at) < new Date());

  /* A cancelled event stays listed rather than disappearing — people were
     phoned and invited, and a silent vanishing sends them to the mall anyway.
     That only helps if the card says so loudly, so the title is struck through,
     the reason is carried on the card itself, and the employer count (a reason
     to attend) gives way to the cancellation. */
  const card = (e: any) => {
    const cancelled = e.status === 'cancelled';
    return (
      <Card key={e.id}
            className={`cursor-pointer transition-shadow hover:shadow-md ${
              cancelled ? 'border-red-200 bg-red-50/40' : 'border-slate-200'}`}
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

  useEffect(() => {
    restClient.get(`/api/events/${eventId}`)
      .then(r => setEv(r.data?.data || null))
      .catch(() => setEv(null))
      .finally(() => setLoading(false));
  }, [eventId]);

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
            <a className="mt-2 inline-block text-sm font-medium text-ehrdc-teal underline"
               href={`https://www.google.com/maps/dir/?api=1&destination=${ev.venue_lat},${ev.venue_lng}`}
               target="_blank" rel="noopener noreferrer">
              {b('Get directions', 'الحصول على الاتجاهات')}
            </a>
          </div>
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

        {ev.status !== 'cancelled' && (
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
