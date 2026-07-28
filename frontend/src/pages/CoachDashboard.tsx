
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import { Users, Calendar, FileText, Clock, Plus, Brain, Loader2, Target, BarChart2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { restClient } from '@/utils/api';

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

type ModalKind = 'session' | 'plan' | 'gaps';

const CoachDashboard: React.FC = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  const [clients, setClients] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const coachId = user?.id || 1;

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
  // Skill-gaps data
  const [gaps, setGaps] = useState<any>(null);
  const [gapsLoading, setGapsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, anRes] = await Promise.allSettled([
        restClient.get(`/api/coach/clients?coach_id=${coachId}`),
        restClient.get(`/api/coach/analytics?coach_id=${coachId}`),
      ]);
      if (cRes.status === 'fulfilled') setClients((cRes.value as any).data.clients || []);
      if (anRes.status === 'fulfilled') setAnalytics((anRes.value as any).data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [coachId]);

  useEffect(() => { loadData(); }, [loadData]);

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
    try {
      const res = await restClient.get(`/api/coach/clients/${client.client_id}/skill-gaps`);
      setGaps((res as any).data);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || t('Failed to load skill gaps.', 'تعذّر تحميل فجوات المهارات.'));
      setGaps({ current_skills: [], total_skills: 0 });
    } finally { setGapsLoading(false); }
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
                <div style={{ fontSize: 12, color: brand.textSecondary }}>{c.total_sessions || 0} {t('sessions', 'جلسات')} · {c.active_plans || 0} {t('active plans', 'خطط نشطة')}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => openModal('session', c)} style={{ background: brand.primary, color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Plus size={12} /> {t('Session', 'جلسة')}
                </button>
                <button onClick={() => openModal('plan', c)} style={{ background: '#fff', color: brand.primary, border: `1px solid ${brand.primary}`, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Target size={12} /> {t('Dev Plan', 'خطة تطوير')}
                </button>
                <button onClick={() => openModal('gaps', c)} style={{ background: '#fff', color: brand.textSecondary, border: `1px solid ${brand.border}`, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <BarChart2 size={12} /> {t('Skill Gaps', 'فجوات المهارات')}
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
                {modal.kind === 'gaps' && t('Skill Gaps', 'فجوات المهارات')}
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
                          <span style={{ fontSize: 11, color: brand.textSecondary, textTransform: 'capitalize' }}>{s.proficiency_level || '—'}{s.source ? ` · ${s.source}` : ''}</span>
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

  const stats = [
    { value: `${analytics?.total_clients || clients.length}`, label: t('Clients', 'عملاء'), icon: Users },
    { value: `${analytics?.total_sessions || 0}`, label: t('Sessions', 'جلسات'), icon: Calendar },
    { value: `${analytics?.total_coaching_hours || 0}h`, label: t('Coaching Hours', 'ساعات'), icon: Clock },
    { value: `${analytics?.plan_stats?.active || 0}`, label: t('Active Plans', 'خطط نشطة'), icon: FileText },
  ];

  const tabs = [
    { id: 'clients', label: t('Clients', 'العملاء'), icon: <Users className="h-4 w-4" />, content: clientsTab },
  ];

  return (
    <EducationPathwayLayout
      title={t('Career Coach', 'المدرب المهني')}
      description={t('Manage development plans, coaching sessions, and skill gap analysis for your clients', 'إدارة خطط التطوير وجلسات التدريب وتحليل فجوات المهارات')}
      icon={<Brain className="h-6 w-6" />}
      stats={stats}
      tabs={tabs}
      defaultTab="clients"
    />
  );
};
export default CoachDashboard;
