import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Loader2, Eye, EyeOff, Radar, CheckCircle2 } from 'lucide-react';
import { restClient } from '@/utils/api';
import { useToast } from '@/hooks/use-toast';

type AvailabilityStatus = 'job_seeking' | 'open_to_opportunities' | 'not_visible';

interface AvailabilityData {
  availability_status: AvailabilityStatus;
  currently_employed: boolean;
  options?: string[];
}

const STATUS_OPTIONS: Array<{
  value: AvailabilityStatus;
  en: string;
  ar: string;
  hintEn: string;
  hintAr: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: 'job_seeking',
    en: 'Actively job seeking',
    ar: 'أبحث عن عمل بنشاط',
    hintEn: 'Visible to recruiters and prioritised in search.',
    hintAr: 'ظاهر لجهات التوظيف ويحظى بالأولوية في البحث.',
    icon: Radar,
  },
  {
    value: 'open_to_opportunities',
    en: 'Open to opportunities',
    ar: 'منفتح على الفرص',
    hintEn: 'Visible to recruiters as a passive candidate.',
    hintAr: 'ظاهر لجهات التوظيف كمرشح غير نشط.',
    icon: Eye,
  },
  {
    value: 'not_visible',
    en: 'Not visible to recruiters',
    ar: 'غير ظاهر لجهات التوظيف',
    hintEn: 'Hidden from recruiter search.',
    hintAr: 'مخفي عن بحث جهات التوظيف.',
    icon: EyeOff,
  },
];

const CandidateAvailabilityControl: React.FC = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => (isRTL ? ar : en);
  const { toast } = useToast();

  const [status, setStatus] = useState<AvailabilityStatus | null>(null);
  const [employed, setEmployed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await restClient.get('/api/profile/availability');
        const data: AvailabilityData | undefined = res.data?.data;
        if (!res.data?.success || !data) {
          throw new Error('bad_response');
        }
        if (cancelled) return;
        setStatus(data.availability_status);
        setEmployed(Boolean(data.currently_employed));
      } catch {
        if (!cancelled) setError(t('Could not load your availability.', 'تعذّر تحميل حالة توفّرك.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = async (next: { availability_status?: AvailabilityStatus; currently_employed?: boolean }) => {
    const prevStatus = status;
    const prevEmployed = employed;
    // Optimistic update
    if (next.availability_status !== undefined) setStatus(next.availability_status);
    if (next.currently_employed !== undefined) setEmployed(next.currently_employed);

    setSaving(true);
    setError(null);
    try {
      const res = await restClient.put('/api/profile/availability', next);
      const data: Partial<AvailabilityData> | undefined = res.data?.data;
      if (!res.data?.success || !data) {
        throw new Error('bad_response');
      }
      if (data.availability_status) setStatus(data.availability_status);
      if (typeof data.currently_employed === 'boolean') setEmployed(data.currently_employed);
      setSavedAt(Date.now());
      toast({
        title: t('Availability updated', 'تم تحديث الحالة'),
        description: t('Your recruiter visibility has been saved.', 'تم حفظ ظهورك لجهات التوظيف.'),
        variant: 'default',
      });
    } catch {
      // Roll back optimistic update
      setStatus(prevStatus);
      setEmployed(prevEmployed);
      setError(t('Could not save. Please try again.', 'تعذّر الحفظ. يُرجى المحاولة مرة أخرى.'));
      toast({
        title: t('Update failed', 'فشل التحديث'),
        description: t('Your availability was not saved.', 'لم يتم حفظ حالة توفّرك.'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-card border border-slate-200/80" dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
        <CardTitle className="flex items-center gap-2 text-base text-foreground">
          <Radar className="h-4 w-4 text-primary" />
          {t('Availability', 'الحالة')}
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          {!saving && savedAt > 0 && !error && (
            <span className="flex items-center gap-1 text-[11px] font-normal text-green-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t('Saved', 'تم الحفظ')}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <p className="text-xs text-muted-foreground">
          {t(
            'Control whether recruiters can find you and how you appear in their search.',
            'تحكّم في إمكانية عثور جهات التوظيف عليك وكيفية ظهورك في بحثهم.'
          )}
        </p>

        {loading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('Loading availability...', 'جاري تحميل الحالة...')}
          </div>
        ) : error && status === null ? (
          <div className="py-3 text-sm text-red-600">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label={t('Availability status', 'حالة التوفّر')}>
              {STATUS_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = status === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={saving}
                    onClick={() => {
                      if (!active) persist({ availability_status: opt.value });
                    }}
                    className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 text-start transition-colors disabled:opacity-60 ${
                      active
                        ? 'border-primary bg-accent'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="flex flex-col">
                      <span className={`text-sm font-dubai-medium ${active ? 'text-primary' : 'text-foreground'}`}>
                        {t(opt.en, opt.ar)}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{t(opt.hintEn, opt.hintAr)}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
              <div className="flex flex-col">
                <span className="text-sm font-dubai-medium text-foreground">
                  {t("I'm currently employed", 'أعمل حالياً')}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {t('Helps recruiters tailor their outreach.', 'يساعد جهات التوظيف على تخصيص تواصلهم.')}
                </span>
              </div>
              <Switch
                checked={employed}
                disabled={saving}
                onCheckedChange={(checked) => persist({ currently_employed: checked })}
                aria-label={t("I'm currently employed", 'أعمل حالياً')}
              />
            </div>

            {error && status !== null && <div className="text-xs text-red-600">{error}</div>}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CandidateAvailabilityControl;
