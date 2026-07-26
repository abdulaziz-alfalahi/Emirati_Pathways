import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2, Plus, UserPlus, Loader2, Trash2, ClipboardCheck, Users, AlertCircle, CheckCircle2,
} from 'lucide-react';
import assessmentOperatorService, {
  AssessmentCenter, CenterAssessor,
} from '@/services/assessmentOperatorService';

const c = {
  primary: '#0369A1', tintBg: '#E0F2FE', tintText: '#0369A1',
  card: '#FFFFFF', border: '#E5E7EB', textPrimary: '#0F172A', textSecondary: '#64748B',
  red: '#FEE2E2', redText: '#991B1B', green: '#DCFCE7', greenText: '#166534',
};
const field: React.CSSProperties = {
  width: '100%', border: `1px solid ${c.border}`, borderRadius: 8, padding: '9px 12px',
  fontSize: 14, background: '#fff', color: c.textPrimary, outline: 'none',
};
const primaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, background: c.primary, color: '#fff',
  border: 'none', padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
};
const msgBox = (kind: 'err' | 'ok'): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, fontSize: 13,
  marginBottom: 12, background: kind === 'err' ? c.red : c.green, color: kind === 'err' ? c.redText : c.greenText,
});
const errMessage = (e: any, fb: string) => e?.response?.data?.message || e?.message || fb;

const AssessmentCentersManager: React.FC = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => (isRTL ? ar : en);

  const [centers, setCenters] = useState<AssessmentCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AssessmentCenter | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setCenters(await assessmentOperatorService.centers()); }
    catch (e) { setError(errMessage(e, t('Failed to load assessment centers.', 'تعذّر تحميل مراكز التقييم.'))); }
    finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRTL]);
  useEffect(() => { load(); }, [load]);

  const [name, setName] = useState('');
  const [emirate, setEmirate] = useState('');
  const [industry, setIndustry] = useState('');
  const [creating, setCreating] = useState(false);
  const createCenter = async () => {
    if (!name.trim()) return;
    setCreating(true); setError(null);
    try {
      const ctr = await assessmentOperatorService.createCenter({
        name: name.trim(), emirate: emirate.trim() || undefined, industry: industry.trim() || undefined,
      });
      setName(''); setEmirate(''); setIndustry('');
      await load();
      if (ctr?.id) setSelected(ctr);
    } catch (e) { setError(errMessage(e, t('Failed to create assessment center.', 'تعذّر إنشاء مركز التقييم.'))); }
    finally { setCreating(false); }
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) 1fr', gap: 20, alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: c.card, borderRadius: 12, padding: 18, border: `1px solid ${c.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 600, color: c.textPrimary, marginBottom: 12 }}>
            <Plus size={16} color={c.tintText} />{t('Enrol an assessment center', 'تسجيل مركز تقييم')}
          </div>
          {error && <div style={msgBox('err')}><AlertCircle size={16} /><span>{error}</span></div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('Center name *', 'اسم المركز *')} style={field} />
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={emirate} onChange={(e) => setEmirate(e.target.value)} placeholder={t('Emirate', 'الإمارة')} style={field} />
              <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder={t('Industry', 'القطاع')} style={field} />
            </div>
            <button onClick={createCenter} disabled={!name.trim() || creating} style={{ ...primaryBtn, opacity: !name.trim() || creating ? 0.6 : 1, justifyContent: 'center' }}>
              {creating ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}{t('Create', 'إنشاء')}
            </button>
          </div>
        </div>

        <div style={{ background: c.card, borderRadius: 12, padding: 8, border: `1px solid ${c.border}` }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 24 }}><Loader2 className="animate-spin" size={22} color={c.primary} /></div>
          ) : centers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: c.textSecondary, fontSize: 13 }}>{t('No assessment centers yet.', 'لا توجد مراكز تقييم بعد.')}</div>
          ) : centers.map((ctr) => (
            <button key={ctr.id} onClick={() => setSelected(ctr)} style={{
              width: '100%', textAlign: isRTL ? 'right' : 'left', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: selected?.id === ctr.id ? c.tintBg : 'transparent',
            }}>
              <Building2 size={16} color={c.tintText} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: c.textPrimary }}>{ctr.name}</span>
                <span style={{ fontSize: 12, color: c.textSecondary }}>{[ctr.emirate, ctr.industry].filter(Boolean).join(' · ')}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: c.card, borderRadius: 12, padding: 20, border: `1px solid ${c.border}`, minHeight: 200 }}>
        {!selected ? (
          <div style={{ textAlign: 'center', padding: 48, color: c.textSecondary }}>
            <ClipboardCheck size={40} color={c.border} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 14 }}>{t('Select a center to certify and manage its assessors.', 'اختر مركزًا لاعتماد وإدارة مقيّميه.')}</div>
          </div>
        ) : (
          <AssessorPanel center={selected} t={t} isRTL={isRTL} />
        )}
      </div>
    </div>
  );
};

const AssessorPanel: React.FC<{ center: AssessmentCenter; t: (en: string, ar: string) => string; isRTL: boolean }> = ({ center, t, isRTL }) => {
  const [assessors, setAssessors] = useState<CenterAssessor[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ kind: 'err' | 'ok'; text: string } | null>(null);
  const [form, setForm] = useState({ user_id: '', certification_level: '', specialization: '', nqf: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setAssessors(await assessmentOperatorService.assessors(center.id)); }
    catch (e) { setMsg({ kind: 'err', text: errMessage(e, t('Failed to load assessors.', 'تعذّر تحميل المقيّمين.')) }); }
    finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.id]);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!form.user_id.trim()) return;
    setBusy(true); setMsg(null);
    try {
      await assessmentOperatorService.enrolAssessor(center.id, {
        user_id: form.user_id.trim(),
        certification_level: form.certification_level.trim() || undefined,
        specialization: form.specialization.trim() || undefined,
        nqf_authorization_level: form.nqf.trim() || undefined,
      });
      setMsg({ kind: 'ok', text: t('Assessor certified and bound.', 'تم اعتماد المقيّم وربطه.') });
      setForm({ user_id: '', certification_level: '', specialization: '', nqf: '' });
      await load();
    } catch (e) { setMsg({ kind: 'err', text: errMessage(e, t('Failed to certify assessor.', 'تعذّر اعتماد المقيّم.')) }); }
    finally { setBusy(false); }
  };

  const remove = async (m: CenterAssessor) => {
    setMsg(null);
    try { await assessmentOperatorService.removeAssessor(center.id, m.user_id); await load(); }
    catch (e) { setMsg({ kind: 'err', text: errMessage(e, t('Failed to remove assessor.', 'تعذّر إزالة المقيّم.')) }); }
  };

  return (
    <div>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: c.textPrimary, margin: '0 0 4px' }}>{center.name}</h3>
      <p style={{ fontSize: 13, color: c.textSecondary, margin: '0 0 16px' }}>
        {t('Certified assessors of this center grade candidate assessments and may join interview panels.',
           'يقوم المقيّمون المعتمدون في هذا المركز بتقييم المرشحين وقد ينضمون إلى لجان المقابلات.')}
      </p>
      {msg && <div style={msgBox(msg.kind)}>{msg.kind === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}<span>{msg.text}</span></div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8, marginBottom: 10 }}>
        <input value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} placeholder={t('Assessor Emirates ID *', 'رقم هوية المقيّم *')} style={field} />
        <input value={form.certification_level} onChange={(e) => setForm({ ...form, certification_level: e.target.value })} placeholder={t('Certification level', 'مستوى الاعتماد')} style={field} />
        <input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder={t('Specialization', 'التخصص')} style={field} />
        <input value={form.nqf} onChange={(e) => setForm({ ...form, nqf: e.target.value })} placeholder={t('NQF authorization', 'مستوى الإطار الوطني')} style={field} />
      </div>
      <button onClick={add} disabled={!form.user_id.trim() || busy} style={{ ...primaryBtn, opacity: !form.user_id.trim() || busy ? 0.6 : 1, marginBottom: 20 }}>
        {busy ? <Loader2 className="animate-spin" size={14} /> : <UserPlus size={14} />}{t('Certify assessor', 'اعتماد مقيّم')}
      </button>

      <div style={{ fontSize: 12, fontWeight: 700, color: c.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
        {t('Certified Assessors', 'المقيّمون المعتمدون')} ({assessors.length})
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 24 }}><Loader2 className="animate-spin" size={22} color={c.primary} /></div>
      ) : assessors.length === 0 ? (
        <div style={{ fontSize: 13, color: c.textSecondary }}>{t('None yet.', 'لا يوجد بعد.')}</div>
      ) : assessors.map((m) => (
        <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, border: `1px solid ${c.border}`, marginBottom: 6 }}>
          <Users size={15} color={c.tintText} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.textPrimary }}>{m.full_name}</span>
            <span style={{ fontSize: 11, color: c.textSecondary }}>
              {[m.certification_level, m.specialization, m.nqf_authorization_level].filter(Boolean).join(' · ') || m.user_id}
            </span>
          </span>
          <button onClick={() => remove(m)} title={t('Remove', 'إزالة')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: c.redText, padding: 4 }}>
            <Trash2 size={15} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default AssessmentCentersManager;
