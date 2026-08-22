import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { restClient } from '@/utils/api';
import { Loader2, Info } from 'lucide-react';

/**
 * The three numbers the platform owner asked for — employed Emiratis, job
 * seekers, and people actually using the platform — on screen, from one source.
 *
 * WHY A SHARED COMPONENT AND NOT A PANEL PER PAGE: these figures go to the
 * board, to the CRM team, and to operators. Three pages each computing "how
 * many job seekers" is three chances to disagree, and a board paper that
 * contradicts a CRM screen discredits both. /api/metrics/populations is the
 * single definition (backend/populations.py); this is its single renderer.
 *
 * WHY EVERY TILE CARRIES TWO NUMBERS: the platform holds 33,510 employed
 * Emiratis and 37 people have ever signed in. "33,510" alone implies a
 * relationship that does not exist; "37" alone throws away real data the
 * Council is required to report. Recorded and registered are both shown, always
 * — the gap IS the current state of the programme, not a blemish to hide.
 *
 * The backend decides which basis a reader may see: employer-side roles get
 * registered only, because a recruiter must not be handed a headline counting
 * people they cannot contact. This component renders what it is given and never
 * infers a missing number.
 */

interface PopulationEntry {
  label_en: string;
  label_ar: string;
  means: string;
  registered: number;
  recorded?: number;
}

interface PopulationsPayload {
  populations: Record<string, PopulationEntry>;
  onboarded: {
    label_en: string;
    label_ar: string;
    signed_in: number;
    via_uaepass: number;
    means: string;
    recorded_total?: number;
  };
  scope_note: string;
  scope_note_ar?: string;
  members_only: boolean;
}

/* Order is deliberate: employed first (the largest and newest population),
   then the people the platform exists to help, then how many it has reached. */
const ORDER = ['employed', 'seeking', 'not_working'];

const ACCENT: Record<string, string> = {
  employed: 'text-[#006E6D]',
  seeking: 'text-amber-600',
  not_working: 'text-slate-700',
};

export const PopulationStrip: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const t = (en: string, ar: string) => (isAr ? ar : en);

  const [data, setData] = useState<PopulationsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    restClient
      .get('/api/metrics/populations')
      .then((r) => {
        if (!alive) return;
        if (r.data?.success) setData(r.data.data);
        else setFailed(true);
      })
      .catch(() => alive && setFailed(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-slate-500 py-6 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">{t('Loading population figures…', 'جاري تحميل أعداد الفئات…')}</span>
      </div>
    );
  }

  /* Say nothing rather than say zero. An empty strip is honest about a failed
     request; a row of 0s would be read as a finding. */
  if (failed || !data) {
    return (
      <div className={`text-sm text-slate-500 py-4 ${className}`}>
        {t(
          'Population figures are unavailable right now.',
          'أعداد الفئات غير متاحة حالياً.',
        )}
      </div>
    );
  }

  const tiles = ORDER.filter((k) => data.populations?.[k]).map((key) => {
    const p = data.populations[key];
    return {
      key,
      label: isAr ? p.label_ar : p.label_en,
      headline: p.recorded ?? p.registered,
      /* When recorded is withheld, the headline IS the registered figure — so
         repeating it underneath would be noise, not disclosure. */
      sub:
        p.recorded === undefined
          ? t('on the platform', 'على المنصة')
          : t(
              `${p.registered.toLocaleString()} registered on the platform`,
              /* Label-then-number, not number-then-plural-noun. Arabic agreement
                 changes with the count (1 / 2 / 3-10 / 11+), and these figures
                 are currently 1 — "1 منهم مسجّلون" is wrong in the exact case
                 the platform is in today. The colon form is correct for every
                 count without special-casing four grammatical branches. */
              `مسجّلون على المنصة: ${p.registered.toLocaleString('ar-AE')}`,
            ),
      means: p.means,
      accent: ACCENT[key] || 'text-slate-900',
    };
  });

  const ob = data.onboarded;
  tiles.push({
    key: 'onboarded',
    label: isAr ? ob.label_ar : ob.label_en,
    headline: ob.signed_in,
    sub:
      ob.recorded_total !== undefined
        ? t(
            `of ${ob.recorded_total.toLocaleString()} people on record`,
            `من أصل ${ob.recorded_total.toLocaleString('ar-AE')} مسجّلين في البيانات`,
          )
        : t('have signed in at least once', 'سجّلوا الدخول مرة واحدة على الأقل'),
    means: ob.means,
    accent: 'text-teal-700',
  });

  return (
    <div className={className} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((tile) => (
          <Card key={tile.key} className="border-none shadow-sm bg-white rounded-2xl">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-slate-500 mb-1" title={tile.means}>
                {tile.label}
              </p>
              <h3 className={`text-3xl font-bold ${tile.accent}`}>
                {Number(tile.headline).toLocaleString(isAr ? 'ar-AE' : 'en-GB')}
              </h3>
              <p className="text-xs text-slate-500 mt-1.5">{tile.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* The basis travels with the numbers. Not a footnote to be cropped out of
          a screenshot — it sits under them, in the same component, always. */}
      <p className="flex items-start gap-1.5 text-xs text-slate-500 mt-3 leading-relaxed">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>{(isAr && data.scope_note_ar) || data.scope_note}</span>
      </p>
    </div>
  );
};

export default PopulationStrip;
