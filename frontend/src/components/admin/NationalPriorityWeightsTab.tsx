import React, { useState, useEffect, useCallback } from 'react';
import { restClient } from '@/utils/api';
import { Scale, Save, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import toast from 'react-hot-toast';

/**
 * EHRDC-only editor for the National Development Priority weights (#33).
 * The matching engine reads these live (national_priority_weights table);
 * every save bumps the row version and is audited server-side.
 *
 * Per the owner's scoring rules (#12) this axis is separate from Job Fit
 * and contains NO geography — the editor only exposes points/active.
 */
interface Weight {
  code: string;
  label: string;
  points: number;
  category: string;
  active: boolean;
  version: number;
  updated_at: string | null;
}

const NationalPriorityWeightsTab: React.FC = () => {
  const { language, isRTL } = useLanguage();
  const t = (en: string, ar: string) => (language === 'ar' ? ar : en);

  const [weights, setWeights] = useState<Weight[]>([]);
  const [draft, setDraft] = useState<Record<string, { points: number; active: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await restClient.get('/api/admin/national-priority-weights');
      const rows: Weight[] = (res as any).data?.weights || (res as any).weights || [];
      setWeights(rows);
      setDraft(Object.fromEntries(rows.map(w => [w.code, { points: w.points, active: w.active }])));
    } catch (e: any) {
      setError(e?.response?.data?.error || t('Failed to load weights', 'فشل تحميل الأوزان'));
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => { load(); }, [load]);

  const dirty = weights.filter(w =>
    draft[w.code] && (draft[w.code].points !== w.points || draft[w.code].active !== w.active));

  const save = async () => {
    if (dirty.length === 0) return;
    // Validate before sending — the API also rejects, this is just faster feedback.
    for (const w of dirty) {
      const p = draft[w.code].points;
      if (!Number.isInteger(p) || p < 0) {
        toast.error(t(`Points for "${w.label}" must be a whole number ≥ 0`,
                      `النقاط لـ "${w.label}" يجب أن تكون رقماً صحيحاً ≥ 0`));
        return;
      }
    }
    setSaving(true);
    try {
      const payload = { weights: dirty.map(w => ({ code: w.code, ...draft[w.code] })) };
      await restClient.put('/api/admin/national-priority-weights', payload);
      toast.success(t(`Saved ${dirty.length} change(s)`, `تم حفظ ${dirty.length} تغيير`));
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || t('Save failed', 'فشل الحفظ'));
    } finally {
      setSaving(false);
    }
  };

  const reset = () => setDraft(Object.fromEntries(weights.map(w => [w.code, { points: w.points, active: w.active }])));

  const categories = Array.from(new Set(weights.map(w => w.category)));

  if (loading) {
    return <div className="p-8 text-center text-gray-500">{t('Loading weights…', 'جارٍ تحميل الأوزان…')}</div>;
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-50">
            <Scale className="text-emerald-700" size={22} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {t('National Development Priority Weights', 'أوزان أولوية التنمية الوطنية')}
            </h2>
            <p className="text-sm text-gray-500 max-w-2xl">
              {t('Points a candidate earns on the priority axis. The matching engine reads these live; every change is versioned and audited. This axis is separate from Job Fit and uses no geography.',
                 'النقاط التي يكتسبها المرشح على محور الأولوية. يقرأ محرك المطابقة هذه القيم مباشرة؛ كل تغيير موثّق ومُدقّق. هذا المحور منفصل عن ملاءمة الوظيفة ولا يستخدم الموقع الجغرافي.')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            disabled={dirty.length === 0 || saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm disabled:opacity-50"
          >
            <RotateCcw size={16} /> {t('Reset', 'إعادة')}
          </button>
          <button
            onClick={save}
            disabled={dirty.length === 0 || saving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? t('Saving…', 'جارٍ الحفظ…')
                    : dirty.length > 0 ? t(`Save ${dirty.length} change(s)`, `حفظ ${dirty.length} تغيير`)
                    : t('Saved', 'محفوظ')}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {categories.map(cat => (
        <div key={cat} className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {cat}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs">
                <th className="text-start font-medium px-4 py-2">{t('Signal', 'المؤشر')}</th>
                <th className="text-start font-medium px-4 py-2 w-28">{t('Points', 'النقاط')}</th>
                <th className="text-start font-medium px-4 py-2 w-24">{t('Active', 'مُفعّل')}</th>
                <th className="text-start font-medium px-4 py-2 w-20">{t('Version', 'الإصدار')}</th>
              </tr>
            </thead>
            <tbody>
              {weights.filter(w => w.category === cat).map(w => {
                const d = draft[w.code] || { points: w.points, active: w.active };
                const isDirty = d.points !== w.points || d.active !== w.active;
                return (
                  <tr key={w.code} className={`border-t border-gray-50 ${isDirty ? 'bg-amber-50/50' : ''}`}>
                    <td className="px-4 py-2">
                      <div className="text-gray-800">{w.label}</div>
                      <div className="text-xs text-gray-400 font-mono">{w.code}</div>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number" min={0} step={1}
                        value={d.points}
                        onChange={e => setDraft({ ...draft, [w.code]: { ...d, points: parseInt(e.target.value || '0', 10) } })}
                        className="w-20 px-2 py-1 border border-gray-200 rounded-lg outline-none focus:border-emerald-400"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={d.active}
                          onChange={e => setDraft({ ...draft, [w.code]: { ...d, active: e.target.checked } })}
                          className="w-4 h-4 accent-emerald-600"
                        />
                      </label>
                    </td>
                    <td className="px-4 py-2 text-gray-400">
                      <span className="inline-flex items-center gap-1">
                        {!isDirty && <CheckCircle2 size={13} className="text-gray-300" />}
                        v{w.version}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default NationalPriorityWeightsTab;
