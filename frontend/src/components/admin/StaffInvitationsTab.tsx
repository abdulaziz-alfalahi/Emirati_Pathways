import React, { useCallback, useEffect, useState } from 'react';
import { restClient } from '@/utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Copy, Check, Loader2, RefreshCw, Send, Ban, Link2 } from 'lucide-react';

// Platform-staff magic-link invitations. Non-nationals cannot self-register
// (persona model), so EHRDC staff — the CRM/career-services team, call-centre
// agents, operators — join through a link an admin issues here; the invitee
// completes registration with UAE Pass and receives the invited role.

const ROLE_LABELS: Record<string, { en: string; ar: string }> = {
  career_services_operator: { en: 'Career Services Operator', ar: 'مشغّل خدمات المسار المهني' },
  call_center_agent: { en: 'Call Centre Agent', ar: 'موظف مركز الاتصال' },
  talent_operator: { en: 'Talent Operator', ar: 'مشغّل المواهب' },
  platform_operator: { en: 'Platform Operator', ar: 'مشغّل المنصة' },
  education_operator: { en: 'Education Operator', ar: 'مشغّل التعليم' },
  assessment_operator: { en: 'Assessment Operator', ar: 'مشغّل التقييم' },
  mentorship_operator: { en: 'Mentorship Operator', ar: 'مشغّل الإرشاد' },
  community_operator: { en: 'Community Operator', ar: 'مشغّل المجتمع' },
  professional_dev_operator: { en: 'Professional Development Operator', ar: 'مشغّل التطوير المهني' },
  employer_relations: { en: 'Employer Relations', ar: 'علاقات أصحاب العمل' },
  advisor: { en: 'Academic Advisor', ar: 'المرشد الأكاديمي' },
  internship_coordinator: { en: 'Internship Coordinator', ar: 'منسّق التدريب' },
  assessor: { en: 'Assessor', ar: 'المقيّم' },
  coach: { en: 'Coach', ar: 'المدرب' },
  mentor: { en: 'Mentor', ar: 'الموجّه' },
  compliance_auditor: { en: 'Compliance Auditor', ar: 'مدقق الامتثال' },
};

interface StaffInvitation {
  id: number;
  full_name: string | null;
  email: string | null;
  intended_role: string;
  organization: string | null;
  status: string;
  is_used: boolean;
  expires_at: string | null;
  accepted_at: string | null;
  created_at: string | null;
  magic_link: string;
  invited_by_name?: string | null;
  accepted_by_name?: string | null;
}

interface Props { isRTL?: boolean }

const StaffInvitationsTab: React.FC<Props> = ({ isRTL = false }) => {
  const t = (en: string, ar: string) => (isRTL ? ar : en);
  const roleLabel = (r: string) => (ROLE_LABELS[r] ? (isRTL ? ROLE_LABELS[r].ar : ROLE_LABELS[r].en) : r);

  const [invitations, setInvitations] = useState<StaffInvitation[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [copiedId, setCopiedId] = useState<number | 'new' | null>(null);
  const [lastLink, setLastLink] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', intended_role: '', organization: '', notes: '', expiry_days: '7',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [inv, r] = await Promise.all([
        restClient.get('/api/admin/staff-invitations'),
        restClient.get('/api/admin/staff-invitations/roles'),
      ]);
      setInvitations(inv.data?.invitations || []);
      setRoles(r.data?.roles || []);
    } catch {
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const copy = async (text: string, id: number | 'new') => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API needs a secure context/permission — fall back so the
      // admin never loses the link.
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: t('Magic link copied', 'تم نسخ الرابط') });
  };

  const submit = async () => {
    if (!form.full_name.trim() || !form.intended_role) {
      toast({ title: t('Name and role are required', 'الاسم والدور مطلوبان'), variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      const res = await restClient.post('/api/admin/staff-invitations', {
        ...form, expiry_days: Number(form.expiry_days) || 7,
      });
      const link = res.data?.magic_link;
      setLastLink(link || null);
      toast({ title: t('Invitation created', 'تم إنشاء الدعوة'), description: t('Copy the link and share it with the invitee.', 'انسخ الرابط وشاركه مع المدعو.') });
      setForm({ full_name: '', email: '', phone: '', intended_role: '', organization: '', notes: '', expiry_days: '7' });
      load();
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || t('Could not create the invitation', 'تعذّر إنشاء الدعوة'), variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const revoke = async (id: number) => {
    try {
      await restClient.delete(`/api/admin/staff-invitations/${id}`);
      toast({ title: t('Invitation revoked', 'تم إلغاء الدعوة') });
      load();
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || t('Could not revoke', 'تعذّر الإلغاء'), variant: 'destructive' });
    }
  };

  const statusBadge = (inv: StaffInvitation) => {
    const map: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-800',
      accepted: 'bg-emerald-100 text-emerald-800',
      expired: 'bg-slate-100 text-slate-600',
      revoked: 'bg-rose-100 text-rose-800',
    };
    return <Badge className={`${map[inv.status] || 'bg-slate-100 text-slate-600'} border-none`}>{inv.status}</Badge>;
  };

  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-teal-700" />{t('Invite platform staff', 'دعوة موظفي المنصة')}</CardTitle>
          <CardDescription>
            {t('Staff who are not UAE nationals cannot self-register. Issue a magic link here — the invitee completes registration with UAE Pass and receives the role you choose.',
               'لا يمكن للموظفين من غير مواطني الدولة التسجيل ذاتياً. أصدر رابطاً سحرياً هنا — يكمل المدعو التسجيل عبر الهوية الرقمية ويحصل على الدور الذي تختاره.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">{t('Full name', 'الاسم الكامل')} *</label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder={t('e.g. Sara Haddad', 'مثال: سارة حداد')} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">{t('Role', 'الدور')} *</label>
              <Select value={form.intended_role} onValueChange={(v) => setForm({ ...form, intended_role: v })}>
                <SelectTrigger><SelectValue placeholder={t('Select a role', 'اختر الدور')} /></SelectTrigger>
                <SelectContent>
                  {roles.map((r) => <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">{t('Email (optional)', 'البريد الإلكتروني (اختياري)')}</label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@ehrdc.gov.ae" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">{t('Phone (optional)', 'الهاتف (اختياري)')}</label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9715..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">{t('Team / department (optional)', 'الفريق / القسم (اختياري)')}</label>
              <Input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} placeholder={t('e.g. CRM Team', 'مثال: فريق إدارة المرشحين')} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">{t('Link valid for (days)', 'صلاحية الرابط (أيام)')}</label>
              <Input type="number" min={1} max={30} value={form.expiry_days} onChange={(e) => setForm({ ...form, expiry_days: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">{t('Notes (optional)', 'ملاحظات (اختياري)')}</label>
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={submit} disabled={sending} className="bg-[#006E6D] hover:bg-[#005A59]">
              {sending ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Send className="h-4 w-4 me-2" />}
              {t('Create invitation', 'إنشاء الدعوة')}
            </Button>
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 me-2 ${loading ? 'animate-spin' : ''}`} />{t('Refresh', 'تحديث')}
            </Button>
          </div>

          {lastLink && (
            <div className="mt-2 rounded-xl border border-teal-200 bg-teal-50/60 p-4">
              <p className="text-sm font-medium text-teal-900 mb-2 flex items-center gap-2">
                <Link2 className="h-4 w-4" />{t('Magic link ready — share it with the invitee', 'الرابط جاهز — شاركه مع المدعو')}
              </p>
              <div className="flex gap-2">
                <Input readOnly value={lastLink} className="font-mono text-xs bg-white" onFocus={(e) => e.currentTarget.select()} />
                <Button variant="outline" onClick={() => copy(lastLink, 'new')}>
                  {copiedId === 'new' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Issued invitations', 'الدعوات الصادرة')}</CardTitle>
          <CardDescription>{t('Copy a link again at any time, or revoke one that has not been used.', 'يمكنك نسخ الرابط مجدداً في أي وقت أو إلغاء دعوة لم تُستخدم.')}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-teal-700" /></div>
          ) : invitations.length === 0 ? (
            <p className="text-center text-slate-500 py-12">{t('No invitations issued yet.', 'لم تصدر أي دعوات بعد.')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 border-y border-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-start font-medium">{t('Invitee', 'المدعو')}</th>
                    <th className="px-4 py-3 text-start font-medium">{t('Role', 'الدور')}</th>
                    <th className="px-4 py-3 text-start font-medium">{t('Status', 'الحالة')}</th>
                    <th className="px-4 py-3 text-start font-medium">{t('Expires', 'ينتهي')}</th>
                    <th className="px-4 py-3 text-end font-medium">{t('Actions', 'الإجراءات')}</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv) => (
                    <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{inv.full_name || '—'}</div>
                        <div className="text-xs text-slate-500">{inv.email || inv.organization || ''}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{roleLabel(inv.intended_role)}</td>
                      <td className="px-4 py-3">
                        {statusBadge(inv)}
                        {inv.status === 'accepted' && inv.accepted_by_name && (
                          <div className="text-xs text-slate-500 mt-1">{inv.accepted_by_name}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{fmt(inv.expires_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {inv.status === 'pending' && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => copy(inv.magic_link, inv.id)}>
                                {copiedId === inv.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                <span className="ms-1.5">{t('Copy link', 'نسخ الرابط')}</span>
                              </Button>
                              <Button size="sm" variant="outline" className="text-rose-700 border-rose-200 hover:bg-rose-50" onClick={() => revoke(inv.id)}>
                                <Ban className="h-3.5 w-3.5 me-1.5" />{t('Revoke', 'إلغاء')}
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffInvitationsTab;
