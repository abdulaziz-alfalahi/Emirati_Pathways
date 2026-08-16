
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import { Users, Calendar, FileText, Clock, Plus, Brain, Loader2, Target, BarChart2, X, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { restClient } from '@/utils/api';
import Messages from '@/components/recruiter/Messages';

const brand = {
  primary: '#0D9488', primarySurface: '#F0FDFA', border: '#E5E7EB',
  textPrimary: '#111827', textSecondary: '#6B7280',
  green: '#DCFCE7', greenText: '#166534',
};

const field: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: `1px solid ${brand.border}`,
  borderRadius: 8, fontSize: 13, color: brand.textPrimary, background: '#fff',
};
const label: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: brand.textSecondary, marginBottom: 5,
};

// A client's display name — never a raw Emirates ID.
const clientName = (c: any): string =>
  c?.display_name || c?.full_name || c?.email || 'Client';

// Where a skill came from, e.g. `self_reported`. Rendered raw it read
// "Self_reported" to the coach — an internal enum leaking into the interface.
const formatSource = (s?: string): string =>
  s ? s.replace(/_/g, '-').replace(/^./, c => c.toUpperCase()) : '';

type ModalKind = 'session' | 'plan' | 'gaps';

const CoachDashboard: React.FC = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;

  /** "1 session" not "1 sessions". Arabic takes the singular at one and the
   *  plural otherwise — enough for the counts shown here, and honest about not
   *  attempting the dual and the 11+ forms, which never appear in this view. */
  const count = (n: number, enOne: string, enMany: string, arOne: string, arMany: string) =>
    isRTL ? `${n} ${n === 1 ? arOne : arMany}` : `${n} ${n === 1 ? enOne : enMany}`;
  const [clients, setClients] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [deciding, setDeciding] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modal, setModal] = useState<{ kind: ModalKind; client: any } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Session form
  const [sessType, setSessType] = useState('one_on_one');
  const [sessDuration, setSessDuration] = useState('60');
  const [sessNotes, setSessNotes] = useState('');
  // Development-plan form
  const [planTitle, setPlanTitle] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [planMilestones, setPlanMilestones] = useState('');
  // Client skills (endpoint is still /skill-gaps; the UI no longer claims gap analysis)
  const [gaps, setGaps] = useState<any>(null);
  const [gapsLoading, setGapsLoading] = useState(false);
  // Skill-gap comparison against a chosen target role (Phase 1)
  const [targetRoles, setTargetRoles] = useState<any[]>([]);
  const [roleKey, setRoleKey] = useState('');
  const [gapData, setGapData] = useState<any>(null);
  const [gapBusy, setGapBusy] = useState(false);
  const [reviewing, setReviewing] = useState<string | null>(null);

  // No coach_id is sent: every one of these endpoints derives the coach from the
  // JWT identity and ignores a query parameter. Passing one implied the server
  // trusted it — it does not, and a reader should not have to check.
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, anRes, pRes] = await Promise.allSettled([
        restClient.get('/api/coach/clients'),
        restClient.get('/api/coach/analytics'),
        restClient.get('/api/coach/requests'),
      ]);
      if (cRes.status === 'fulfilled') setClients((cRes.value as any).data.clients || []);
      // null means the call failed. Kept distinct from zero so the stats strip
      // can say "no reading" instead of asserting a measurement it never got.
      setAnalytics(anRes.status === 'fulfilled' ? (anRes.value as any).data : null);
      if (pRes.status === 'fulfilled') setPending((pRes.value as any).data.requests || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Coaching requests now require the coach to accept (owner decision: like mentors).
  const decideRequest = async (id: string, decision: 'accept' | 'decline') => {
    setDeciding(id);
    try {
      await restClient.post(`/api/coach/requests/${id}/decision`, { decision });
      toast.success(decision === 'accept'
        ? t('Request accepted — client added.', 'تم قبول الطلب — تمت إضافة العميل.')
        : t('Request declined.', 'تم رفض الطلب.'));
      loadData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || t('Could not update the request.', 'تعذّر تحديث الطلب.'));
    } finally { setDeciding(null); }
  };

  const openModal = (kind: ModalKind, client: any) => {
    setSessType('one_on_one'); setSessDuration('60'); setSessNotes('');
    setPlanTitle(''); setPlanDesc(''); setPlanMilestones('');
    setGaps(null);
    setModal({ kind, client });
    if (kind === 'gaps') loadGaps(client);
  };
  const closeModal = () => { if (!submitting) setModal(null); };

  const loadGaps = async (client: any) => {
    setGapsLoading(true);
    setRoleKey(''); setGapData(null);
    try {
      const [skills, roles] = await Promise.allSettled([
        restClient.get(`/api/coach/clients/${client.client_id}/skill-gaps`),
        restClient.get('/api/coach/target-roles'),
      ]);
      if (skills.status === 'fulfilled') setGaps((skills.value as any).data);
      else { toast.error(t('Failed to load skills.', 'تعذّر تحميل المهارات.')); setGaps({ current_skills: [], total_skills: 0 }); }
      // The picker missing is not fatal — the skills list is still usable.
      setTargetRoles(roles.status === 'fulfilled' ? ((roles.value as any).data.roles || []) : []);
    } finally { setGapsLoading(false); }
  };

  const loadGap = async (client: any, key: string) => {
    setRoleKey(key);
    if (!key) { setGapData(null); return; }
    setGapBusy(true);
    try {
      const res = await restClient.get(
        `/api/coach/clients/${client.client_id}/skill-gap?role_key=${encodeURIComponent(key)}`);
      setGapData((res as any).data);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || t('Could not load the comparison.', 'تعذّر تحميل المقارنة.'));
      setGapData(null);
    } finally { setGapBusy(false); }
  };

  // The coach's judgement replaces whatever the platform guessed. `matched` is
  // the held skill they resolved it to — the labelled pair a real resolver will
  // eventually be trained on.
  const review = async (client: any, skillName: string, status: 'held' | 'missing', matched?: string) => {
    setReviewing(skillName);
    try {
      const res = await restClient.post(`/api/coach/clients/${client.client_id}/skill-gap/review`, {
        role_key: roleKey, skill_name: skillName, status, matched_skill: matched || null,
      });
      setGapData((res as any).data.data);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || t('Could not save.', 'تعذّر الحفظ.'));
    } finally { setReviewing(null); }
  };

  const submitSession = async () => {
    if (!modal) return;
    setSubmitting(true);
    try {
      await restClient.post('/api/coach/sessions', {
        client_id: modal.client.client_id,
        session_type: sessType,
        notes: sessNotes,
        duration_minutes: parseInt(sessDuration, 10) || 60,
      });
      toast.success(t('Session booked.', 'تم حجز الجلسة.'));
      setModal(null);
      loadData();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || t('Could not book the session.', 'تعذّر حجز الجلسة.'));
    } finally { setSubmitting(false); }
  };

  const submitPlan = async () => {
    if (!modal) return;
    if (!planTitle.trim()) { toast.error(t('A plan title is required.', 'عنوان الخطة مطلوب.')); return; }
    setSubmitting(true);
    try {
      const milestones = planMilestones.split('\n').map(m => m.trim()).filter(Boolean);
      await restClient.post(`/api/coach/clients/${modal.client.client_id}/development-plan`, {
        title: planTitle.trim(),
        description: planDesc.trim(),
        milestones,
      });
      toast.success(t('Development plan created.', 'تم إنشاء خطة التطوير.'));
      setModal(null);
      loadData();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || t('Could not create the plan.', 'تعذّر إنشاء الخطة.'));
    } finally { setSubmitting(false); }
  };

  const clientsTab = (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
        {t('My Clients', 'عملائي')}
      </h2>
      <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
        {t('Manage your coaching clients, development plans, and session history.', 'إدارة عملاء التدريب وخطط التطوير وسجل الجلسات.')}
      </p>

      {pending.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, marginBottom: 10 }}>
            {t('Pending requests', 'الطلبات المعلقة')} ({pending.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pending.map((r, i) => (
              <div key={r.id || i} style={{ background: brand.primarySurface, borderRadius: 10, border: `1px solid ${brand.border}`, padding: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{clientName(r)}</h4>
                  <div style={{ fontSize: 12, color: brand.textSecondary }}>{t('Requested you as their coach', 'طلبك كمدرب له')}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button disabled={deciding === r.id} onClick={() => decideRequest(r.id, 'accept')} style={{ background: brand.primary, color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: deciding === r.id ? 'default' : 'pointer', opacity: deciding === r.id ? 0.6 : 1 }}>
                    {t('Accept', 'قبول')}
                  </button>
                  <button disabled={deciding === r.id} onClick={() => decideRequest(r.id, 'decline')} style={{ background: '#fff', color: brand.textSecondary, border: `1px solid ${brand.border}`, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: deciding === r.id ? 'default' : 'pointer', opacity: deciding === r.id ? 0.6 : 1 }}>
                    {t('Decline', 'رفض')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} /></div>
      ) : clients.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>
          <Users size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>{t('No clients assigned yet.', 'لم يتم تعيين عملاء بعد.')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {clients.map((c, i) => (
            <div key={c.client_id || i} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center', color: brand.primary, fontWeight: 700, fontSize: 14 }}>
                {clientName(c)[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{clientName(c)}</h4>
                <div style={{ fontSize: 12, color: brand.textSecondary }}>
                  {count(c.total_sessions || 0, 'session', 'sessions', 'جلسة', 'جلسات')}
                  {' · '}
                  {count(c.active_plans || 0, 'active plan', 'active plans', 'خطة نشطة', 'خطط نشطة')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => openModal('session', c)} style={{ background: brand.primary, color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Plus size={12} /> {t('Session', 'جلسة')}
                </button>
                <button onClick={() => openModal('plan', c)} style={{ background: '#fff', color: brand.primary, border: `1px solid ${brand.primary}`, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Target size={12} /> {t('Dev Plan', 'خطة تطوير')}
                </button>
                <button onClick={() => openModal('gaps', c)} style={{ background: '#fff', color: brand.textSecondary, border: `1px solid ${brand.border}`, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <BarChart2 size={12} /> {t('Skills', 'المهارات')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {modal && (
        <div onClick={closeModal} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div onClick={e => e.stopPropagation()} dir={isRTL ? 'rtl' : 'ltr'} style={{ background: '#fff', borderRadius: 14, padding: 22, width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: brand.textPrimary, margin: 0 }}>
                {modal.kind === 'session' && t('Book a Session', 'حجز جلسة')}
                {modal.kind === 'plan' && t('New Development Plan', 'خطة تطوير جديدة')}
                {modal.kind === 'gaps' && t('Skills', 'المهارات')}
              </h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: brand.textSecondary }}><X size={18} /></button>
            </div>
            <p style={{ fontSize: 13, color: brand.textSecondary, marginTop: 0, marginBottom: 16 }}>{clientName(modal.client)}</p>

            {modal.kind === 'session' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={label}>{t('Session type', 'نوع الجلسة')}</label>
                  <select value={sessType} onChange={e => setSessType(e.target.value)} style={field}>
                    <option value="one_on_one">{t('One-on-one', 'فردية')}</option>
                    <option value="group">{t('Group', 'جماعية')}</option>
                    <option value="assessment_review">{t('Assessment review', 'مراجعة تقييم')}</option>
                  </select>
                </div>
                <div>
                  <label style={label}>{t('Duration (minutes)', 'المدة (دقائق)')}</label>
                  <input type="number" min={15} step={15} value={sessDuration} onChange={e => setSessDuration(e.target.value)} style={field} />
                </div>
                <div>
                  <label style={label}>{t('Notes', 'ملاحظات')}</label>
                  <textarea value={sessNotes} onChange={e => setSessNotes(e.target.value)} rows={3} style={{ ...field, resize: 'vertical' }} placeholder={t('What will this session cover?', 'ماذا ستغطي هذه الجلسة؟')} />
                </div>
                <button onClick={submitSession} disabled={submitting} style={{ background: brand.primary, color: '#fff', border: 'none', padding: '10px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? t('Booking…', 'جارٍ الحجز…') : t('Book session', 'حجز الجلسة')}
                </button>
              </div>
            )}

            {modal.kind === 'plan' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={label}>{t('Plan title', 'عنوان الخطة')}</label>
                  <input value={planTitle} onChange={e => setPlanTitle(e.target.value)} style={field} placeholder={t('e.g. Leadership development', 'مثال: تطوير القيادة')} />
                </div>
                <div>
                  <label style={label}>{t('Description', 'الوصف')}</label>
                  <textarea value={planDesc} onChange={e => setPlanDesc(e.target.value)} rows={2} style={{ ...field, resize: 'vertical' }} />
                </div>
                <div>
                  <label style={label}>{t('Milestones (one per line)', 'المعالم (واحد لكل سطر)')}</label>
                  <textarea value={planMilestones} onChange={e => setPlanMilestones(e.target.value)} rows={4} style={{ ...field, resize: 'vertical' }} placeholder={t('Complete a leadership course\nLead a team project', 'أكمل دورة قيادية\nقُد مشروع فريق')} />
                </div>
                <button onClick={submitPlan} disabled={submitting} style={{ background: brand.primary, color: '#fff', border: 'none', padding: '10px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? t('Creating…', 'جارٍ الإنشاء…') : t('Create plan', 'إنشاء الخطة')}
                </button>
              </div>
            )}

            {modal.kind === 'gaps' && (
              <div>
                {/* ── Compare against a target role ────────────────────────
                    A skill is not missing in the abstract; it is missing FOR
                    something. The coach chooses the target — guessing it would
                    compound an already weak match. */}
                {targetRoles.length > 0 && (
                  <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${brand.border}` }}>
                    <label style={label}>{t('Compare against a target role', 'المقارنة مع دور مستهدف')}</label>
                    <select value={roleKey} onChange={e => loadGap(modal.client, e.target.value)} style={field}>
                      <option value="">{t('— none —', '— بدون —')}</option>
                      {targetRoles.map((r: any) => (
                        <option key={r.role_key} value={r.role_key}>
                          {(isRTL && r.role_ar) || r.role} · {(isRTL && r.path_title_ar) || r.path_title}
                        </option>
                      ))}
                    </select>

                    {gapBusy && (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
                        <Loader2 className="animate-spin" size={20} style={{ color: brand.primary }} />
                      </div>
                    )}

                    {!gapBusy && gapData && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                          {([['held', gapData.summary.held, brand.greenText, brand.green],
                             ['missing', gapData.summary.missing, '#991B1B', '#FEE2E2'],
                             ['unclear', gapData.summary.unclear, brand.textSecondary, '#F3F4F6']] as const)
                            .map(([k, n, fg, bg]) => (
                              <div key={k} style={{ flex: 1, background: bg, borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
                                <div style={{ fontSize: 17, fontWeight: 700, color: fg }}>{n}</div>
                                <div style={{ fontSize: 11, color: brand.textSecondary }}>
                                  {k === 'held' ? t('Held', 'متوفرة') : k === 'missing' ? t('Missing', 'ناقصة') : t('Unclear', 'غير محددة')}
                                </div>
                              </div>
                            ))}
                        </div>
                        {/* Said plainly, because an unclear count read as a gap
                            count is the single way this feature misleads. */}
                        <p style={{ fontSize: 11, color: brand.textSecondary, margin: '0 0 12px', lineHeight: 1.5 }}>
                          {t('Unclear means not yet reviewed — not a gap. Only you can mark a skill missing.',
                             'غير محددة تعني لم تُراجع بعد — وليست نقصاً. أنت وحدك من يحدد المهارة كناقصة.')}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {gapData.skills.map((s: any) => (
                            <div key={s.required} style={{ border: `1px solid ${brand.border}`, borderRadius: 8, padding: '8px 10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 13, color: brand.textPrimary, flex: 1, minWidth: 120 }}>{s.required}</span>
                                <span style={{
                                  fontSize: 10, fontWeight: 600, borderRadius: 999, padding: '2px 8px',
                                  background: s.state === 'held' ? brand.green : s.state === 'missing' ? '#FEE2E2' : '#F3F4F6',
                                  color: s.state === 'held' ? brand.greenText : s.state === 'missing' ? '#991B1B' : brand.textSecondary,
                                }}>
                                  {s.state === 'held' ? t('Held', 'متوفرة') : s.state === 'missing' ? t('Missing', 'ناقصة') : t('Unclear', 'غير محددة')}
                                </span>
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <button disabled={reviewing === s.required} onClick={() => review(modal.client, s.required, 'held')}
                                    style={{ background: '#fff', border: `1px solid ${brand.border}`, borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer', color: brand.greenText }}>
                                    {t('Held', 'متوفرة')}
                                  </button>
                                  <button disabled={reviewing === s.required} onClick={() => review(modal.client, s.required, 'missing')}
                                    style={{ background: '#fff', border: `1px solid ${brand.border}`, borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer', color: '#991B1B' }}>
                                    {t('Missing', 'ناقصة')}
                                  </button>
                                </div>
                              </div>
                              {s.matched_skill && (
                                <div style={{ fontSize: 11, color: brand.textSecondary, marginTop: 3 }}>
                                  {t('matched to', 'مطابقة لـ')} “{s.matched_skill}”
                                  {s.decided_by === 'coach' ? ` · ${t('your decision', 'قرارك')}` : ''}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {gapsLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Loader2 className="animate-spin" size={24} style={{ color: brand.primary }} /></div>
                ) : !gaps || (gaps.total_skills || 0) === 0 ? (
                  <div style={{ textAlign: 'center', padding: 24, color: brand.textSecondary, fontSize: 13 }}>
                    <BarChart2 size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                    <p>{t('No skills on record for this client yet.', 'لا توجد مهارات مسجلة لهذا العميل بعد.')}</p>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                      {(['beginner', 'intermediate', 'advanced'] as const).map(lvl => (
                        <div key={lvl} style={{ flex: 1, background: brand.primarySurface, borderRadius: 8, padding: '10px 6px', textAlign: 'center' }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: brand.primary }}>{gaps.skills_by_level?.[lvl] || 0}</div>
                          <div style={{ fontSize: 11, color: brand.textSecondary, textTransform: 'capitalize' }}>{lvl}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {(gaps.current_skills || []).map((s: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${brand.border}`, borderRadius: 8, padding: '8px 12px' }}>
                          <span style={{ fontSize: 13, color: brand.textPrimary }}>{s.name}</span>
                          <span style={{ fontSize: 11, color: brand.textSecondary }}>
                            <span style={{ textTransform: 'capitalize' }}>{s.proficiency_level || '—'}</span>
                            {s.source ? ` · ${formatSource(s.source)}` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // "0" and "we could not read it" are different statements. When the analytics
  // call fails, `analytics` is null and these show an em dash rather than
  // asserting zero sessions to a coach who may have run dozens.
  const metric = (v: any) => (analytics ? `${v ?? 0}` : '—');

  const stats = [
    // Clients is the exception: the client list comes from its own endpoint, so
    // its length is a real reading even when analytics is unavailable.
    { value: `${analytics?.total_clients ?? clients.length}`, label: t('Clients', 'عملاء'), icon: Users },
    { value: metric(analytics?.total_sessions), label: t('Sessions', 'جلسات'), icon: Calendar },
    // The unit lives in the label, not the number — a hardcoded "h" rendered as
    // "0h ساعات" in Arabic.
    { value: metric(analytics?.total_coaching_hours), label: t('Coaching Hours', 'ساعات'), icon: Clock },
    { value: metric(analytics?.plan_stats?.active), label: t('Active Plans', 'خطط نشطة'), icon: FileText },
  ];

  const tabs = [
    { id: 'clients', label: t('Clients', 'العملاء'), icon: <Users className="h-4 w-4" />, content: clientsTab },
    // stopPropagation: EducationPathwayLayout's click delegation would otherwise
    // pop a false "coming soon" toast on the real buttons inside Messages.
    { id: 'messages', label: t('Messages', 'الرسائل'), icon: <MessageSquare className="h-4 w-4" />, content: <div onClick={e => e.stopPropagation()}><Messages senderRole="coach" showNewConversation /></div> },
  ];

  return (
    <EducationPathwayLayout
      title={t('Career Coach', 'المدرب المهني')}
      description={t('Manage development plans, coaching sessions, and client skills', 'إدارة خطط التطوير وجلسات التدريب ومهارات العملاء')}
      icon={<Brain className="h-6 w-6" />}
      stats={stats}
      tabs={tabs}
      defaultTab="clients"
    />
  );
};
export default CoachDashboard;
