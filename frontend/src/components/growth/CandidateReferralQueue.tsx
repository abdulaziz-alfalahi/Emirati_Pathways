import React, { useCallback, useEffect, useState } from 'react';
import { UserPlus, Send, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { restClient } from '@/utils/api';

/**
 * Referrals the growth operators must act on (migration 110): a candidate
 * invited a recruiter whose company is not on the platform (or has nobody
 * to ask). One click issues the company invitation, intended_role=recruiter,
 * through the same magic-link path every employer takes.
 */
interface Row {
  id: number; candidate_name: string; recruiter_name: string; recruiter_email: string;
  company_name?: string | null; company_display_name?: string | null; company_id?: string | null;
  is_verified?: boolean | null; workspace_enabled?: boolean; invitation_status?: string | null;
  note?: string | null; created_at: string;
}

const CandidateReferralQueue: React.FC<{ t: (en: string, ar: string) => string }> = ({ t }) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await restClient.get('/api/referrals/operator');
      setRows(r.data?.referrals || []);
    } catch { setRows([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (rows.length === 0) return null;

  const invite = async (row: Row) => {
    setBusy(row.id);
    try {
      await restClient.post(`/api/referrals/operator/${row.id}/invite`);
      toast.success(t(`Invitation queued for ${row.recruiter_email}`, `تمت جدولة الدعوة إلى ${row.recruiter_email}`));
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || t('Could not issue the invitation', 'تعذّر إصدار الدعوة'));
    } finally { setBusy(null); }
  };

  return (
    <div className="bg-white rounded-xl border border-amber-200 p-5 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <UserPlus className="h-5 w-5 text-amber-700" />
        <h3 className="font-semibold text-gray-900">{t('Recruiters invited by candidates', 'مسؤولو توظيف دعاهم مرشحون')}</h3>
        <span className="ms-auto text-xs bg-amber-100 text-amber-800 rounded-full px-2 py-0.5">{rows.length}</span>
      </div>
      <p className="text-sm text-gray-500 mb-3">
        {t('A candidate asked a recruiter to view their profile. Invite the company so the recruiter can join through UAE PASS; the candidate is told when they do.',
           'طلب مرشح من مسؤول توظيف الاطلاع على ملفه. ادعُ الشركة ليتمكن مسؤول التوظيف من الانضمام عبر الهوية الرقمية؛ يُبلَّغ المرشح عند انضمامه.')}
      </p>
      <ul className="divide-y">
        {rows.map((r) => (
          <li key={r.id} className="py-2 flex items-center justify-between gap-3 text-sm">
            <div className="min-w-0">
              <div className="font-medium truncate">{r.recruiter_name} <span className="text-gray-500 font-normal">· {r.recruiter_email}</span></div>
              <div className="text-xs text-gray-500 truncate inline-flex items-center gap-1">
                <Building2 size={12} />{r.company_display_name || r.company_name || t('Company not given', 'الشركة غير محددة')}
                {r.company_id && <span className="ms-1 rounded bg-blue-50 text-blue-700 px-1">{t('on platform', 'على المنصة')}</span>}
                <span className="ms-2">{t('for', 'لصالح')} {r.candidate_name}</span>
              </div>
              {r.note && <div className="text-xs text-gray-400 italic truncate">“{r.note}”</div>}
            </div>
            {r.invitation_status ? (
              <span className="shrink-0 text-xs text-gray-500">{t('Invitation', 'الدعوة')}: {r.invitation_status}</span>
            ) : (
              <button type="button" disabled={busy === r.id} onClick={() => invite(r)}
                className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-teal-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-teal-700 disabled:opacity-50">
                <Send size={12} />{t('Invite company', 'دعوة الشركة')}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CandidateReferralQueue;
