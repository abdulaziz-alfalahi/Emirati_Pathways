import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { restClient } from '@/utils/api';

/**
 * Candidates who invited THIS recruiter to view their profile (migration 110).
 * Opening a profile from here records the view, which the candidate can see.
 */
interface Referral {
  id: number; candidate_id: string; candidate_name: string; headline?: string | null;
  location?: string | null; note?: string | null; grant_expires_at: string; view_count: number;
}

const CandidateReferralsCard: React.FC<{ isRTL?: boolean }> = ({ isRTL = false }) => {
  const b = (en: string, ar: string) => (isRTL ? ar : en);
  const navigate = useNavigate();
  const [rows, setRows] = useState<Referral[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    restClient.get('/api/referrals/recruiter')
      .then((r) => setRows(r.data?.referrals || []))
      .catch(() => setRows([]))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || rows.length === 0) return null;

  const open = async (r: Referral) => {
    try { await restClient.post(`/api/referrals/recruiter/${r.candidate_id}/viewed`); } catch { /* the view is a courtesy record */ }
    navigate(`/candidate-profile/${r.candidate_id}`);
  };
  const fmt = (iso: string) => new Date(iso).toLocaleDateString(isRTL ? 'ar-AE' : 'en-GB', { day: 'numeric', month: 'short' });

  return (
    <Card className="bg-white border border-teal-100">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base"><UserCheck className="h-5 w-5 text-teal-700" />{b('Invited by candidates', 'دعوات من مرشحين')}</CardTitle>
        <CardDescription>{b('These candidates asked you to view their profile. Each invitation is valid for 30 days.', 'طلب هؤلاء المرشحون منك الاطلاع على ملفاتهم. كل دعوة صالحة 30 يوماً.')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {rows.map((r) => (
            <li key={r.id} className="py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{r.candidate_name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {r.headline || ''}{r.location ? <span className="inline-flex items-center gap-1 ms-2"><MapPin size={11} />{r.location}</span> : null}
                </div>
                {r.note && <div className="text-xs text-muted-foreground mt-0.5 italic truncate">“{r.note}”</div>}
              </div>
              <div className="shrink-0 text-end">
                <button type="button" onClick={() => open(r)} className="text-sm font-medium text-teal-700 hover:underline">{b('View profile', 'عرض الملف')}</button>
                <div className="text-[11px] text-muted-foreground">{b('until', 'حتى')} {fmt(r.grant_expires_at)}</div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default CandidateReferralsCard;
