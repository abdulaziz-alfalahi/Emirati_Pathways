import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { restClient } from '@/utils/api';

/**
 * Dates that can take the service down: the public TLS certificate (checked
 * live through the proxy), the mail app secret, the UAE Pass secret, and
 * anything recorded in EXPIRY_ITEMS (backend/system_expiries.py).
 *
 * One card, two homes: the Admin Dashboard's System tab (/api/admin/...) and
 * the Monitoring Operator's Operations Center (/api/operations/...). The
 * endpoint differs only in who may call it; the payload is the same.
 */
export interface ExpiryItem {
  key: string; label: string; label_ar?: string; detail?: string | null;
  expires_on?: string | null; days_left?: number | null;
  status: 'ok' | 'warning' | 'critical' | 'expired' | 'unknown'; source?: string;
}
export interface ExpiriesPayload { items: ExpiryItem[]; worst: string; checked_at?: string }

interface Props {
  endpoint: string;
  isRTL: boolean;
  /** Reload when this changes (e.g. the tab that shows the card becomes active). */
  active?: boolean;
  compact?: boolean;
}

const toneFor = (status: ExpiryItem['status']) =>
  status === 'expired' || status === 'critical' ? 'text-red-700 bg-red-50'
    : status === 'warning' ? 'text-amber-800 bg-amber-50'
    : status === 'unknown' ? 'text-gray-600 bg-gray-50' : 'text-green-700 bg-green-50';

const ExpiryDatesCard: React.FC<Props> = ({ endpoint, isRTL, active = true, compact = false }) => {
  const b = (en: string, ar: string) => (isRTL ? ar : en);
  const [expiries, setExpiries] = useState<ExpiriesPayload | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    restClient.get(endpoint)
      .then((r) => { if (!cancelled) setExpiries(r.data); })
      .catch(() => { if (!cancelled) setExpiries({ items: [], worst: 'unknown' }); });
    return () => { cancelled = true; };
  }, [endpoint, active]);

  return (
    <Card>
      <CardHeader className={compact ? 'pb-2' : undefined}>
        <CardTitle className="flex items-center gap-2">
          {b('Expiry dates', 'تواريخ الانتهاء')}
          {expiries && expiries.worst !== 'ok' && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${toneFor(expiries.worst as ExpiryItem['status'])}`}>
              {expiries.worst === 'expired' ? b('expired', 'منتهٍ') : expiries.worst === 'critical' ? b('critical', 'حرج')
                : expiries.worst === 'warning' ? b('due soon', 'يقترب') : b('unknown', 'غير معروف')}
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {b('Certificates and secrets the platform depends on. The TLS certificate is checked live; the rest are recorded dates.',
             'الشهادات والأسرار التي تعتمد عليها المنصة. يتم فحص شهادة TLS مباشرة؛ الباقي تواريخ مسجّلة.')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!expiries ? (
          <p className="text-sm text-gray-500">{b('Checking…', 'جارٍ الفحص…')}</p>
        ) : expiries.items.length === 0 ? (
          <p className="text-sm text-gray-500">{b('Could not read the expiry dates.', 'تعذّر قراءة تواريخ الانتهاء.')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-start text-gray-500 border-b">
                  <th className="py-2 pe-4 text-start">{b('Item', 'العنصر')}</th>
                  <th className="py-2 pe-4 text-start">{b('Expires on', 'ينتهي في')}</th>
                  <th className="py-2 pe-4 text-start">{b('Days left', 'الأيام المتبقية')}</th>
                  <th className="py-2 pe-4 text-start">{b('Source', 'المصدر')}</th>
                </tr>
              </thead>
              <tbody>
                {expiries.items.map((it) => (
                  <tr key={it.key} className="border-b last:border-0">
                    <td className="py-2 pe-4 font-medium">
                      {isRTL && it.label_ar ? it.label_ar : it.label}
                      {it.detail ? <span className="block text-xs text-gray-500">{it.detail}</span> : null}
                    </td>
                    <td className="py-2 pe-4">{it.expires_on || b('not recorded', 'غير مسجّل')}</td>
                    <td className="py-2 pe-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${toneFor(it.status)}`}>
                        {it.days_left === null || it.days_left === undefined ? b('unknown', 'غير معروف') : it.days_left < 0 ? b('expired', 'منتهٍ') : it.days_left}
                      </span>
                    </td>
                    <td className="py-2 pe-4 text-gray-500">{it.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expiries.checked_at && (
              <p className="text-xs text-gray-400 mt-2">{b('Checked', 'تم الفحص')} {new Date(expiries.checked_at).toLocaleString(isRTL ? 'ar-AE' : 'en-GB')}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExpiryDatesCard;
