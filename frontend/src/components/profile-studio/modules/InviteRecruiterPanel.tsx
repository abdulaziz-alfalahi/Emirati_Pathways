import React, { useCallback, useEffect, useState } from 'react';
import { Send, UserPlus, X, Eye, Clock, CheckCircle2, Ban } from 'lucide-react';
import { restClient } from '@/utils/api';
import toast from 'react-hot-toast';

/**
 * "Invite a recruiter to view my profile" — replaces the public CV share link
 * (owner, 2026-09-06). The platform is closed: a recruiter sees the candidate
 * inside the platform, after joining, for 30 days, and only while the
 * candidate's consent stands. The list below shows what happened to each
 * invitation and who has looked.
 */
interface Referral {
  id: number;
  recruiter_name: string;
  recruiter_email: string;
  company_name?: string | null;
  company_display_name?: string | null;
  recruiter_account_name?: string | null;
  status: 'pending' | 'granted' | 'revoked' | 'expired';
  grant_expires_at: string;
  view_count: number;
  last_viewed_at?: string | null;
  created_at: string;
}

interface Props { t: (en: string, ar: string) => string; isRTL?: boolean }

const InviteRecruiterPanel: React.FC<Props> = ({ t, isRTL = false }) => {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [rows, setRows] = useState<Referral[]>([]);
  const [form, setForm] = useState({ recruiter_name: '', recruiter_email: '', company_name: '', note: '' });

  const load = useCallback(async () => {
    try {
      const res = await restClient.get('/api/referrals');
      setRows(res.data?.referrals || []);
    } catch { setRows([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.recruiter_name.trim() || !form.recruiter_email.trim()) {
      toast.error(t('Name and work email are required', 'الاسم والبريد الإلكتروني للعمل مطلوبان'));
      return;
    }
    setSending(true);
    try {
      const res = await restClient.post('/api/referrals', form);
      const route = res.data?.referral?.route;
      toast.success(route === 'granted'
        ? t('They are already on the platform — they can view your profile now.', 'هم على المنصة بالفعل — يمكنهم الاطلاع على ملفك الآن.')
        : route === 'company_admins'
          ? t('Their company is on the platform — its admins have been asked to invite them.', 'شركتهم على المنصة — طُلب من مسؤوليها دعوتهم.')
          : t('Invitation recorded — EHRDC will invite their company to the platform.', 'تم تسجيل الدعوة — سيدعو المجلس شركتهم إلى المنصة.'));
      setForm({ recruiter_name: '', recruiter_email: '', company_name: '', note: '' });
      setOpen(false);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || t('Could not send the invitation', 'تعذّر إرسال الدعوة'));
    } finally { setSending(false); }
  };

  const withdraw = async (id: number) => {
    try {
      await restClient.delete(`/api/referrals/${id}`);
      toast.success(t('Invitation withdrawn', 'تم سحب الدعوة'));
      load();
    } catch { toast.error(t('Could not withdraw', 'تعذّر السحب')); }
  };

  const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString(isRTL ? 'ar-AE' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
  const statusChip = (r: Referral) => {
    const map: Record<string, [string, string, React.ReactNode]> = {
      pending: ['bg-amber-50 text-amber-800', t('Awaiting their joining', 'بانتظار انضمامهم'), <Clock size={12} />],
      granted: ['bg-emerald-50 text-emerald-800', t('Can view until', 'يمكنهم الاطلاع حتى') + ' ' + fmt(r.grant_expires_at), <CheckCircle2 size={12} />],
      revoked: ['bg-slate-100 text-slate-600', t('Withdrawn', 'مسحوبة'), <Ban size={12} />],
      expired: ['bg-slate-100 text-slate-600', t('Expired', 'منتهية'), <Clock size={12} />],
    };
    const [cls, label, icon] = map[r.status] || map.expired;
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{icon}{label}</span>;
  };

  return (
    <div className="space-y-3" dir={isRTL ? 'rtl' : 'ltr'}>
      <button type="button" onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50">
        <UserPlus size={18} />
        <span>{t('Invite a recruiter to view my profile', 'دعوة مسؤول توظيف للاطلاع على ملفي')}</span>
      </button>
      <p className="text-xs text-muted-foreground">
        {t('Your CV and contact details never leave the platform. The recruiter joins, views your profile for 30 days, and messages you here.',
           'لا تغادر سيرتك الذاتية وبيانات الاتصال المنصة. ينضم مسؤول التوظيف، ويطّلع على ملفك لمدة 30 يوماً، ويراسلك هنا.')}
      </p>

      {rows.length > 0 && (
        <ul className="divide-y rounded-lg border bg-white">
          {rows.map((r) => (
            <li key={r.id} className="p-3 text-sm flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-foreground truncate">{r.recruiter_name}
                  <span className="text-muted-foreground font-normal"> · {r.company_display_name || r.company_name || r.recruiter_email}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {statusChip(r)}
                  {r.status === 'granted' && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye size={12} />{r.view_count > 0
                        ? t(`Viewed ${r.view_count}× · last ${fmt(r.last_viewed_at)}`, `اطّلع ${r.view_count} مرة · آخرها ${fmt(r.last_viewed_at)}`)
                        : t('Not viewed yet', 'لم يطّلع بعد')}
                    </span>
                  )}
                </div>
              </div>
              {(r.status === 'pending' || r.status === 'granted') && (
                <button type="button" onClick={() => withdraw(r.id)} title={t('Withdraw', 'سحب')}
                  className="shrink-0 text-xs text-red-700 hover:underline">{t('Withdraw', 'سحب')}</button>
              )}
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{t('Invite a recruiter', 'دعوة مسؤول توظيف')}</h3>
              <button type="button" onClick={() => setOpen(false)} aria-label={t('Close', 'إغلاق')}><X size={18} /></button>
            </div>
            {([
              ['recruiter_name', t('Recruiter name', 'اسم مسؤول التوظيف'), t('e.g. Sara Al Ali', 'مثال: سارة العلي'), true],
              ['recruiter_email', t('Work email', 'البريد الإلكتروني للعمل'), 'name@company.ae', true],
              ['company_name', t('Company', 'الشركة'), t('e.g. ADNOC', 'مثال: أدنوك'), false],
            ] as Array<[keyof typeof form, string, string, boolean]>).map(([key, label, ph, req]) => (
              <div key={key} className="space-y-1">
                <label className="text-sm font-medium">{label}{req ? ' *' : ''}</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form[key]} placeholder={ph}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
              </div>
            ))}
            <div className="space-y-1">
              <label className="text-sm font-medium">{t('Note (optional)', 'ملاحظة (اختياري)')}</label>
              <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} value={form.note}
                placeholder={t('e.g. We spoke at the open day on 2 September', 'مثال: تحدثنا في اليوم المفتوح في 2 سبتمبر')}
                onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
            <p className="text-xs text-muted-foreground">
              {t('If they are already on the platform they can view your profile at once. Otherwise EHRDC invites their company, and the recruiter joins through UAE PASS. You can withdraw at any time.',
                 'إذا كانوا على المنصة يمكنهم الاطلاع فوراً. وإلا يدعو المجلس شركتهم، وينضم مسؤول التوظيف عبر الهوية الرقمية. يمكنك السحب في أي وقت.')}
            </p>
            <button type="button" onClick={submit} disabled={sending}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-2.5 rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50">
              <Send size={16} />{sending ? t('Sending…', 'جارٍ الإرسال…') : t('Send invitation', 'إرسال الدعوة')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InviteRecruiterPanel;
