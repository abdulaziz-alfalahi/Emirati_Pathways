import React, { useState, useEffect } from 'react';
import { restClient } from '@/utils/api';
import { BarChart3, Info, RefreshCw, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/context/EnhancedLanguageContext';

/**
 * National Development Priority fairness monitor (#34).
 * Read-only distribution of priority scores + which reasons fire across the
 * candidate pool. No geography; no fabricated KPIs — only what the live
 * data supports, with honest notes for what isn't measurable yet.
 */
interface Snapshot {
  total_candidates: number;
  score_distribution: Array<{ band: string; count: number; pct: number }>;
  reason_frequency: Array<{ code: string; label: string; count: number; pct: number }>;
  strategic_sector: { with_priority_skill: number; without: number };
  summary: { mean_score: number; zero_score_pct: number; max_band_pct: number };
  notes: string[];
}

const Bar: React.FC<{ pct: number; color: string }> = ({ pct, color }) => (
  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
    <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
  </div>
);

const PriorityFairnessPanel: React.FC = () => {
  const { language, isRTL } = useLanguage();
  const t = (en: string, ar: string) => (language === 'ar' ? ar : en);

  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await restClient.get('/api/admin/national-priority-weights/fairness');
      setSnap((res as any).data || res);
    } catch (e: any) {
      setError(e?.response?.data?.error || t('Failed to load fairness data', 'فشل تحميل بيانات الإنصاف'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">{t('Computing distribution…', 'جارٍ حساب التوزيع…')}</div>;
  if (error) return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
      <AlertCircle size={16} /> {error}
    </div>
  );
  if (!snap) return null;

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50"><BarChart3 className="text-indigo-700" size={22} /></div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{t('Priority Score Distribution', 'توزيع درجات الأولوية')}</h2>
            <p className="text-sm text-gray-500">
              {t(`Across ${snap.total_candidates.toLocaleString()} active candidates`, `عبر ${snap.total_candidates.toLocaleString()} مرشح نشط`)}
            </p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm">
          <RefreshCw size={15} /> {t('Refresh', 'تحديث')}
        </button>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t('Mean score', 'المتوسط'), value: snap.summary.mean_score },
          { label: t('Zero-score %', 'نسبة الصفر'), value: `${snap.summary.zero_score_pct}%` },
          { label: t('Top band (76–100) %', 'الفئة العليا %'), value: `${snap.summary.max_band_pct}%` },
        ].map((tile, i) => (
          <div key={i} className="p-4 rounded-xl border border-gray-100 bg-white">
            <div className="text-2xl font-bold text-gray-800">{tile.value}</div>
            <div className="text-xs text-gray-500 mt-1">{tile.label}</div>
          </div>
        ))}
      </div>

      {/* Score bands */}
      <div className="border border-gray-100 rounded-xl p-4 space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{t('Score bands', 'فئات الدرجات')}</div>
        {snap.score_distribution.map(b => (
          <div key={b.band} className="flex items-center gap-3">
            <div className="w-20 text-sm text-gray-600 font-mono">{b.band}</div>
            <Bar pct={b.pct} color="#6366f1" />
            <div className="w-28 text-sm text-gray-500 text-end">{b.count.toLocaleString()} ({b.pct}%)</div>
          </div>
        ))}
      </div>

      {/* Reason firing */}
      <div className="border border-gray-100 rounded-xl p-4 space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{t('How often each reason fires', 'معدل تفعيل كل سبب')}</div>
        {snap.reason_frequency.length === 0 && (
          <div className="text-sm text-gray-400">{t('No reasons fired in the sample.', 'لم يُفعّل أي سبب في العينة.')}</div>
        )}
        {snap.reason_frequency.map(r => (
          <div key={r.code} className="flex items-center gap-3">
            <div className="w-64 text-sm text-gray-700 truncate">{r.label}</div>
            <Bar pct={r.pct} color="#10b981" />
            <div className="w-28 text-sm text-gray-500 text-end">{r.count.toLocaleString()} ({r.pct}%)</div>
          </div>
        ))}
      </div>

      {/* Notes / honesty */}
      <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-4">
        <div className="flex items-center gap-2 text-amber-800 text-sm font-medium mb-2">
          <Info size={15} /> {t('Monitoring notes', 'ملاحظات المراقبة')}
        </div>
        <ul className="list-disc list-inside space-y-1 text-sm text-amber-900/80">
          {snap.notes.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      </div>
    </div>
  );
};

export default PriorityFairnessPanel;
