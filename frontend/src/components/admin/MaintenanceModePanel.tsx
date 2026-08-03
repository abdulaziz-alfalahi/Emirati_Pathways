import React, { useCallback, useEffect, useState } from 'react';
import { restClient } from '@/utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { AlertTriangle, Loader2, Power, ShieldCheck } from 'lucide-react';

// Platform-wide maintenance switch (owner feedback fb_1785729286). Replaces
// hand-editing files inside the nginx containers on every app node.
// Admins keep full access while it is on, so it can always be switched off here.

interface Props { isRTL?: boolean }

const MaintenanceModePanel: React.FC<Props> = ({ isRTL = false }) => {
  const t = (en: string, ar: string) => (isRTL ? ar : en);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [form, setForm] = useState({ message_en: '', message_ar: '', expected_end: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await restClient.get('/api/admin/maintenance');
      const d = res.data?.data || {};
      setEnabled(!!d.is_enabled);
      setStartedAt(d.started_at || null);
      setForm({
        message_en: d.message_en || '',
        message_ar: d.message_ar || '',
        expected_end: d.expected_end ? String(d.expected_end).slice(0, 16) : '',
      });
    } catch {
      /* leave defaults — the panel still allows enabling */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const apply = async (next: boolean) => {
    if (next && !window.confirm(t(
      'Turn on maintenance mode? Everyone except administrators will be locked out of the platform until you turn it off.',
      'تفعيل وضع الصيانة؟ سيتم منع جميع المستخدمين عدا المسؤولين من استخدام المنصة حتى تقوم بإيقافه.'))) return;
    setSaving(true);
    try {
      await restClient.put('/api/admin/maintenance', {
        is_enabled: next,
        message_en: form.message_en || null,
        message_ar: form.message_ar || null,
        expected_end: form.expected_end || null,
      });
      setEnabled(next);
      toast({
        title: next ? t('Maintenance mode is ON', 'تم تفعيل وضع الصيانة')
                    : t('Maintenance mode is OFF', 'تم إيقاف وضع الصيانة'),
        description: next
          ? t('Users now see the maintenance notice. You still have full access.',
              'يرى المستخدمون الآن إشعار الصيانة. لا يزال لديك وصول كامل.')
          : t('The platform is live again.', 'عادت المنصة للعمل.'),
      });
      load();
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || t('Could not update maintenance mode', 'تعذّر تحديث وضع الصيانة'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={enabled ? 'border-amber-300 bg-amber-50/40' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Power className={`h-5 w-5 ${enabled ? 'text-amber-600' : 'text-slate-400'}`} />
              {t('Maintenance mode', 'وضع الصيانة')}
              {enabled
                ? <Badge className="bg-amber-100 text-amber-800 border-none">{t('ON', 'مُفعّل')}</Badge>
                : <Badge className="bg-slate-100 text-slate-600 border-none">{t('OFF', 'متوقف')}</Badge>}
            </CardTitle>
            <CardDescription className="mt-1">
              {t('Holds all platform traffic during an upgrade. Administrators keep full access, so you can always switch it off from here. Health checks keep passing, so servers are not restarted mid-window.',
                 'يوقف حركة المنصة أثناء التحديث. يحتفظ المسؤولون بصلاحية كاملة، لذا يمكنك دائماً إيقافه من هنا. تستمر فحوص السلامة بالعمل فلا يُعاد تشغيل الخوادم أثناء الصيانة.')}
            </CardDescription>
          </div>
          {loading && <Loader2 className="h-5 w-5 animate-spin text-slate-400 shrink-0" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {enabled && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              {t('Maintenance mode is active — users cannot use the platform.', 'وضع الصيانة نشط — لا يمكن للمستخدمين استخدام المنصة.')}
              {startedAt && ` ${t('Started', 'بدأ')}: ${new Date(startedAt).toLocaleString()}`}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">{t('Message to users (English)', 'الرسالة للمستخدمين (إنجليزي)')}</label>
            <Textarea rows={2} value={form.message_en}
              onChange={(e) => setForm({ ...form, message_en: e.target.value })}
              placeholder={t('We are upgrading the platform and will be back shortly.', 'نقوم بتحديث المنصة وسنعود قريباً.')} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">{t('Message to users (Arabic)', 'الرسالة للمستخدمين (عربي)')}</label>
            <Textarea rows={2} dir="rtl" value={form.message_ar}
              onChange={(e) => setForm({ ...form, message_ar: e.target.value })}
              placeholder="نقوم بتحديث المنصة وسنعود قريباً." />
          </div>
        </div>

        <div className="space-y-1.5 max-w-xs">
          <label className="text-sm font-medium text-slate-700">{t('Expected end (optional)', 'الانتهاء المتوقع (اختياري)')}</label>
          <Input type="datetime-local" value={form.expected_end}
            onChange={(e) => setForm({ ...form, expected_end: e.target.value })} />
        </div>

        <div className="flex items-center gap-3 pt-1">
          {enabled ? (
            <Button onClick={() => apply(false)} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 me-2" />}
              {t('End maintenance — bring the platform back', 'إنهاء الصيانة — إعادة تشغيل المنصة')}
            </Button>
          ) : (
            <Button onClick={() => apply(true)} disabled={saving} className="bg-amber-600 hover:bg-amber-700">
              {saving ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Power className="h-4 w-4 me-2" />}
              {t('Start maintenance', 'بدء الصيانة')}
            </Button>
          )}
          {enabled && (
            <Button variant="outline" onClick={() => apply(true)} disabled={saving}>
              {t('Update message', 'تحديث الرسالة')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MaintenanceModePanel;
