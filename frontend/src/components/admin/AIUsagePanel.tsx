import React, { useCallback, useEffect, useState } from 'react';
import { restClient } from '@/utils/api';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { Card } from '@/components/ui/card';
import { Brain, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';

/**
 * AI USAGE AND SPEND (migration 069, GET /api/admin/ai-usage)
 *
 * Until this shipped, nobody could say what the platform spent on AI: the token
 * counter lived in memory, died on every restart, and its only reader was called
 * from nowhere. This panel is the reader.
 *
 * TWO HONESTY RULES, both load-bearing:
 *
 * 1. The money figure is an ESTIMATE derived from a configured price list, not
 *    an invoice. It is labelled as such everywhere it appears. Presenting a
 *    derived number as billing truth is the defect class in GH #26.
 *
 * 2. "No data yet" and "zero spend" are different statements. When the backend
 *    reports available=false, or no calls have been recorded, this says so
 *    rather than rendering 0.00 — a confident zero would be read as a
 *    measurement when it means we have no reading at all.
 */

interface Totals {
  calls: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost_aed: number;
  failed_calls: number;
  retry_calls: number;
}

interface Breakdown {
  task_type?: string | null;
  model?: string;
  calls: number;
  tokens: number;
  estimated_cost_aed: number;
  avg_latency_ms?: number | null;
}

interface UsageData {
  days: number;
  totals: Totals | Record<string, never>;
  by_task: Breakdown[];
  by_model: Breakdown[];
  available: boolean;
}

const WINDOWS = [7, 30, 90];

interface Props {
  /** Compact drops the breakdown tables — for the Operations Center, where this
   *  is one section among many rather than the subject of the page. */
  compact?: boolean;
  defaultDays?: number;
}

const AIUsagePanel: React.FC<Props> = ({ compact = false, defaultDays = 30 }) => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const t = (en: string, ar: string) => (isRTL ? ar : en);
  const locale = isRTL ? 'ar-AE' : 'en-US';

  const [days, setDays] = useState(defaultDays);
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (window: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await restClient.get(`/api/admin/ai-usage?days=${window}`);
      setData(res.data?.data ?? null);
    } catch (e: any) {
      setError(e?.response?.status === 403
        ? t('You do not have access to AI usage data.', 'ليس لديك صلاحية الوصول إلى بيانات استخدام الذكاء الاصطناعي.')
        : t('Could not load AI usage.', 'تعذر تحميل بيانات استخدام الذكاء الاصطناعي.'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [isRTL]);

  useEffect(() => { load(days); }, [days, load]);

  const num = (n: number) => (n ?? 0).toLocaleString(locale);
  const aed = (n: number) => (n ?? 0).toLocaleString(locale, {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });

  const totals = (data?.totals ?? {}) as Totals;
  const hasReading = !!data?.available && (totals.calls ?? 0) > 0;

  /* ── States that are not data ──────────────────────────────────────────── */

  const Frame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <Brain size={16} className="text-primary" aria-hidden="true" />
        <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">
          {t('AI Usage & Spend', 'استخدام الذكاء الاصطناعي والإنفاق')}
        </h2>
        <div className="ms-auto flex items-center gap-2">
          <div className="flex rounded-md border border-border" role="group"
               aria-label={t('Time window', 'الفترة الزمنية')}>
            {WINDOWS.map((w) => (
              <button
                key={w}
                onClick={() => setDays(w)}
                aria-pressed={days === w}
                className={`px-2 py-1 text-xs font-medium transition-colors ${
                  days === w ? 'bg-accent text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span dir="ltr">{w}d</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => load(days)}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground"
            aria-label={t('Refresh', 'تحديث')}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
          </button>
        </div>
      </div>
      {children}
    </Card>
  );

  if (loading && !data) {
    return (
      <Frame>
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          {t('Loading…', 'جارٍ التحميل…')}
        </div>
      </Frame>
    );
  }

  if (error) {
    return (
      <Frame>
        <div className="flex items-start gap-2 rounded-md border border-edge-warning bg-tint-warning p-3 text-sm text-foreground">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
          <span>{error}</span>
        </div>
      </Frame>
    );
  }

  // Deliberately distinct from "zero spend". Recording began when migration 069
  // was deployed; before that there is nothing to show, and a 0.00 here would
  // be read as a measurement.
  if (!hasReading) {
    return (
      <Frame>
        <p className="py-6 text-center text-sm text-muted-foreground">
          {data?.available === false
            ? t('Usage data is not available right now.',
                'بيانات الاستخدام غير متاحة حالياً.')
            : t('No AI calls recorded in this period yet.',
                'لم يتم تسجيل أي استدعاءات للذكاء الاصطناعي في هذه الفترة بعد.')}
        </p>
      </Frame>
    );
  }

  /* ── The reading ───────────────────────────────────────────────────────── */

  const wasted = (totals.failed_calls ?? 0) + (totals.retry_calls ?? 0);

  const Stat = ({ label, value, hint, tone }: {
    label: string; value: React.ReactNode; hint?: string; tone?: 'warning';
  }) => (
    <div className={`rounded-md border px-3 py-3 ${
      tone === 'warning' ? 'border-edge-warning bg-tint-warning' : 'border-border bg-muted'
    }`}>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div dir="ltr" className={`text-xl font-bold tabular-nums ${
        tone === 'warning' ? 'text-warning' : 'text-foreground'
      } ${isRTL ? 'text-end' : ''}`}>{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );

  const Table = ({ title, rows, keyLabel, showLatency }: {
    title: string; rows: Breakdown[]; keyLabel: string; showLatency?: boolean;
  }) => (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="py-1.5 text-start font-medium">{keyLabel}</th>
              <th className="py-1.5 text-end font-medium">{t('Calls', 'الاستدعاءات')}</th>
              <th className="py-1.5 text-end font-medium">{t('Tokens', 'الرموز')}</th>
              {showLatency && (
                <th className="py-1.5 text-end font-medium">{t('Avg ms', 'متوسط م.ث')}</th>
              )}
              <th className="py-1.5 text-end font-medium">{t('Est. AED', 'التكلفة التقديرية')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border/50 last:border-0">
                <td className="py-1.5 font-medium text-foreground">
                  {r.task_type ?? r.model ?? t('Unspecified', 'غير محدد')}
                </td>
                <td dir="ltr" className="py-1.5 text-end tabular-nums text-muted-foreground">{num(r.calls)}</td>
                <td dir="ltr" className="py-1.5 text-end tabular-nums text-muted-foreground">{num(r.tokens)}</td>
                {showLatency && (
                  <td dir="ltr" className="py-1.5 text-end tabular-nums text-muted-foreground">
                    {r.avg_latency_ms != null ? num(r.avg_latency_ms) : '—'}
                  </td>
                )}
                <td dir="ltr" className="py-1.5 text-end font-semibold tabular-nums text-foreground">
                  {aed(r.estimated_cost_aed)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <Frame>
      <div className={`grid gap-3 ${compact ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-4'}`}>
        <Stat label={t('Calls', 'الاستدعاءات')} value={num(totals.calls)} />
        <Stat label={t('Tokens', 'الرموز')} value={num(totals.total_tokens)} />
        <Stat
          label={t('Estimated spend', 'الإنفاق التقديري')}
          value={`${aed(totals.estimated_cost_aed)}`}
          hint={t('AED — estimate, not an invoice', 'درهم — تقدير وليس فاتورة')}
        />
        <Stat
          label={t('Retries & failures', 'إعادة المحاولات والإخفاقات')}
          value={num(wasted)}
          hint={t('Billed, nothing delivered', 'محتسبة دون نتيجة')}
          tone={wasted > 0 ? 'warning' : undefined}
        />
      </div>

      {!compact && (
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <Table
            title={t('By task', 'حسب المهمة')}
            rows={data!.by_task}
            keyLabel={t('Task', 'المهمة')}
          />
          <Table
            title={t('By model', 'حسب النموذج')}
            rows={data!.by_model}
            keyLabel={t('Model', 'النموذج')}
            showLatency
          />
        </div>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
        {t(
          'Cost is estimated from the configured price list, not billed usage. One row is recorded per API response, so retries are counted — each is separately billed.',
          'التكلفة تقديرية بناءً على قائمة الأسعار المهيأة وليست استهلاكاً مفوتراً. يتم تسجيل سجل لكل استجابة، لذا تُحتسب إعادة المحاولات لأن كلاً منها يُفوتر بشكل منفصل.'
        )}
      </p>
    </Frame>
  );
};

export default AIUsagePanel;
