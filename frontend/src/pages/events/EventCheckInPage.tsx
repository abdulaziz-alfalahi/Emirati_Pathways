import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { restClient } from '@/utils/api';
import { CheckCircle2, Loader2, AlertTriangle, UserCircle2 } from 'lucide-react';

/**
 * What the venue QR poster points at.
 *
 * This page is used standing up, on a phone, on mall wifi, by someone who may
 * have joined the platform ninety seconds ago. Everything about it is shaped by
 * that: one action, a number large enough to read at arm's length, and no dead
 * ends — a failure here means a person in a queue with nothing to do next, so
 * every error path names the desk as the way out.
 *
 * There is no check-in code (owner decision): identity is the UAE Pass session.
 * Someone not signed in is sent to sign in and returned here.
 */
const EventCheckInPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const b = (en: string, ar: string) => (isRTL ? ar : en);

  const [state, setState] = useState<'working' | 'done' | 'error'>('working');
  const [token, setToken] = useState<number | null>(null);
  const [already, setAlready] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      // Come back here after signing in — the QR is the only thing they have.
      sessionStorage.setItem('post_login_redirect', `/events/${eventId}/check-in`);
      navigate('/auth', { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await restClient.post(`/api/events/${eventId}/check-in`, {});
        if (cancelled) return;
        const d = res.data?.data || {};
        setToken(d.queue_token ?? null);
        setAlready(!!d.already_registered);
        setEventTitle(d.event_title || '');
        setState('done');
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.response?.data?.message
          || b('We could not register you.', 'تعذّر تسجيلك.'));
        setState('error');
      }
    })();
    return () => { cancelled = true; };
  }, [eventId, isAuthenticated, authLoading]);

  if (authLoading || state === 'working') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <Loader2 className="h-10 w-10 animate-spin text-ehrdc-teal" />
        <p className="text-slate-600">{b('Registering you…', 'جارٍ تسجيلك…')}</p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="rounded-full bg-amber-50 p-4"><AlertTriangle className="h-8 w-8 text-amber-600" /></div>
        <h1 className="text-xl font-semibold text-slate-900">
          {b('We could not register you', 'تعذّر تسجيلك')}
        </h1>
        <p className="max-w-sm text-sm text-slate-600">{error}</p>
        {/* Never a dead end: there is a member of staff a few metres away. */}
        <p className="max-w-sm text-sm font-medium text-slate-800">
          {b('Please go to the registration desk and a member of staff will register you.',
             'يرجى التوجه إلى مكتب التسجيل وسيقوم أحد الموظفين بتسجيلك.')}
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          {b('Try again', 'إعادة المحاولة')}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 text-center" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="rounded-full bg-green-50 p-4 mb-4">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
      </div>

      <h1 className="text-2xl font-bold text-slate-900">
        {already ? b("You're already registered", 'أنت مسجّل بالفعل')
                 : b("You're registered", 'تم تسجيلك')}
      </h1>
      {eventTitle && <p className="mt-1 text-sm text-slate-600">{eventTitle}</p>}

      {/* The number has to be readable at arm's length, held up to a member of
          staff across a desk, in a bright mall. */}
      <div className="my-8 w-full max-w-xs rounded-3xl border-2 border-ehrdc-teal bg-teal-50/60 px-6 py-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {b('Your queue number', 'رقمك في الطابور')}
        </p>
        <p className="mt-2 text-7xl font-black tabular-nums leading-none text-ehrdc-teal">
          {token ?? '—'}
        </p>
      </div>

      <p className="max-w-sm text-sm text-slate-600">
        {b('Please keep this number and wait to be called. Show this screen at the interview desk.',
           'يرجى الاحتفاظ بهذا الرقم وانتظار مناداتك. أظهر هذه الشاشة عند مكتب المقابلات.')}
      </p>

      {/* Owner decision: send them to complete their profile straight away.
          A walk-in has just created an account with almost nothing in it, and
          the wait in the queue is the best chance we will get to fill it. */}
      <div className="mt-8 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 text-start">
        <div className="flex items-start gap-3">
          <UserCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-ehrdc-teal" />
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {b('While you wait — complete your profile', 'أثناء الانتظار — أكمل ملفك الشخصي')}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              {b('Employers here can see your skills and experience. Adding them now takes a couple of minutes and gives you a better chance in the interview.',
                 'يمكن لأصحاب العمل هنا الاطلاع على مهاراتك وخبراتك. إضافتها الآن تستغرق دقيقتين وتمنحك فرصة أفضل في المقابلة.')}
            </p>
            <Button className="mt-3 w-full" onClick={() => navigate('/candidate/profile')}>
              {b('Complete my profile', 'إكمال ملفي الشخصي')}
            </Button>
            <Button variant="ghost" className="mt-1 w-full text-xs"
                    onClick={() => navigate(`/events/${eventId}`)}>
              {b('See the employers at this event', 'عرض أصحاب العمل في هذه الفعالية')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCheckInPage;
