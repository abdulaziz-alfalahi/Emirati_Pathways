
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import { GraduationCap, BookOpen, Users, Award, Plus, Loader2 } from 'lucide-react';
import trainingCenterService, { TrainingCenter } from '@/services/trainingCenterService';

const brand = {
  primary: '#0D9488', primarySurface: '#F0FDFA', border: '#E5E7EB',
  textPrimary: '#111827', textSecondary: '#6B7280',
  amber: '#FEF3C7', amberText: '#92400E',
};

const TrainingCenterDashboard: React.FC = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  const [centers, setCenters] = useState<TrainingCenter[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', category: '', level: '', duration: '', skills: '' });
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const loadPrograms = async () => {
    try { setPrograms(await trainingCenterService.programs()); } catch (err) { console.error(err); }
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [ctrRes, pgRes] = await Promise.allSettled([
          trainingCenterService.myCenters(),
          trainingCenterService.programs(),
        ]);
        if (cancelled) return;
        if (ctrRes.status === 'fulfilled') setCenters(ctrRes.value || []);
        if (pgRes.status === 'fulfilled') setPrograms(pgRes.value || []);
      } catch (err) { console.error(err); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const boundToCenter = centers.length > 0;

  const submitProgram = async () => {
    if (!form.title.trim()) return;
    setSubmitting(true); setNotice(null);
    try {
      await trainingCenterService.createProgram({
        title: form.title.trim(),
        category: form.category.trim() || undefined,
        level: form.level.trim() || undefined,
        duration: form.duration.trim() || undefined,
        skills_covered: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      });
      setNotice({ ok: true, text: t('Program submitted for operator review.', 'تم إرسال البرنامج لمراجعة المشغّل.') });
      setForm({ title: '', category: '', level: '', duration: '', skills: '' });
      await loadPrograms();
    } catch (e: any) {
      setNotice({ ok: false, text: e?.response?.data?.error || e?.response?.data?.message || t('Failed to submit program.', 'تعذّر إرسال البرنامج.') });
    } finally { setSubmitting(false); }
  };

  const inp: React.CSSProperties = { border: `1px solid ${brand.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 14, background: '#fff', color: brand.textPrimary };
  const statusStyle = (s: string) => s === 'published'
    ? { bg: '#DCFCE7', fg: '#166534', label: t('Published', 'منشور') }
    : s === 'rejected'
      ? { bg: '#FEE2E2', fg: '#991B1B', label: t('Rejected', 'مرفوض') }
      : { bg: brand.amber, fg: brand.amberText, label: t('Pending review', 'قيد المراجعة') };

  const programsTab = (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>{t('My Programs', 'برامجي')}</h2>
      <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 20, lineHeight: 1.6 }}>{t('List your training programs. Submitted programs are reviewed by the Professional Development Operator before they appear to candidates.', 'أدرج برامجك التدريبية. تتم مراجعة البرامج المُرسلة من قِبل مشغّل التطوير المهني قبل ظهورها للمرشحين.')}</p>

      {/* Create program */}
      {boundToCenter ? (
        <div style={{ background: '#fff', border: `1px solid ${brand.border}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>
            <Plus size={16} style={{ color: brand.primary }} />{t('Add a program', 'إضافة برنامج')}
          </div>
          {notice && <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, fontSize: 13, background: notice.ok ? '#DCFCE7' : '#FEE2E2', color: notice.ok ? '#166534' : '#991B1B' }}>{notice.text}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 12 }}>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder={t('Program title *', 'عنوان البرنامج *')} style={inp} />
            <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder={t('Category', 'الفئة')} style={inp} />
            <input value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} placeholder={t('Level', 'المستوى')} style={inp} />
            <input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder={t('Duration', 'المدة')} style={inp} />
            <input value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder={t('Skills (comma-separated)', 'المهارات (مفصولة بفواصل)')} style={{ ...inp, gridColumn: '1 / -1' }} />
          </div>
          <button onClick={submitProgram} disabled={!form.title.trim() || submitting}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: brand.primary, color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: !form.title.trim() || submitting ? 0.6 : 1 }}>
            {submitting ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}{t('Submit for review', 'إرسال للمراجعة')}
          </button>
        </div>
      ) : !loading && (
        <div style={{ background: brand.amber, color: brand.amberText, borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 13 }}>
          {t('You are not linked to a training center yet. Ask the Professional Development Operator to add you as a representative.', 'لست مرتبطًا بمركز تدريب بعد. اطلب من مشغّل التطوير المهني إضافتك كممثل.')}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} /></div>
      ) : programs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>
          <BookOpen size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>{t('No programs yet — add your first training program above.', 'لا توجد برامج بعد — أضف أول برنامج تدريبي أعلاه.')}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
          {programs.map((p, i) => {
            const ss = statusStyle(p.status);
            return (
            <div key={i} className="ep-card" style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={20} style={{ color: brand.primary }} />
                </div>
                <span style={{ background: ss.bg, color: ss.fg, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 10 }}>{ss.label}</span>
              </div>
              <h4 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{p.title}</h4>
              <div style={{ fontSize: 12, color: brand.textSecondary }}>{[p.category, p.level].filter(Boolean).join(' · ')}</div>
              <div style={{ fontSize: 12, color: brand.textSecondary, marginTop: 4 }}>{p.enrolled_count || 0} {t('enrolled', 'مسجل')}</div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const totalEnrollments = programs.reduce((sum, p) => sum + (p.enrolled_count || 0), 0);

  const stats = [
    { value: `${programs.length}`, label: t('Programs', 'برامج'), icon: BookOpen },
    { value: `${totalEnrollments}`, label: t('Enrollments', 'مسجلون'), icon: Users },
    { value: '0', label: t('Certificates', 'شهادات'), icon: Award },
    { value: `${centers.length}`, label: t('Centers', 'مراكز'), icon: GraduationCap },
  ];

  const tabs = [
    { id: 'programs', label: t('Programs', 'البرامج'), icon: <BookOpen className="h-4 w-4" />, content: programsTab },
  ];

  return (
    <EducationPathwayLayout
      title={t('Training Center Portal', 'بوابة مركز التدريب')}
      description={t('Manage training programs, track enrollments, and issue certificates with automatic stamp creation', 'إدارة البرامج التدريبية وتتبع المسجلين وإصدار الشهادات')}
      icon={<GraduationCap className="h-6 w-6" />}
      stats={stats}
      tabs={tabs}
      defaultTab="programs"
    />
  );
};
export default TrainingCenterDashboard;
