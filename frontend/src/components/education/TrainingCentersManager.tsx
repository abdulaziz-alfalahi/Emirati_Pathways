import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2, Plus, UserPlus, Loader2, Trash2, GraduationCap, Users, AlertCircle, CheckCircle2,
} from 'lucide-react';
import trainingCenterService, { TrainingCenter, CenterStaff } from '@/services/trainingCenterService';

const c = {
  primary: '#6D28D9', purpleBg: '#F3E8FF', purpleText: '#7C3AED',
  card: '#FFFFFF', border: '#E5E7EB', textPrimary: '#1E1B4B', textSecondary: '#6B7280',
  red: '#FEE2E2', redText: '#991B1B', green: '#ECFDF5', greenText: '#059669',
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

const TrainingCentersManager: React.FC = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => (isRTL ? ar : en);

  const [centers, setCenters] = useState<TrainingCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<TrainingCenter | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setCenters(await trainingCenterService.centers()); }
    catch (e) { setError(errMessage(e, t('Failed to load training centers.', 'تعذّر تحميل مراكز التدريب.'))); }
    finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRTL]);
  useEffect(() => { load(); }, [load]);

  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [website, setWebsite] = useState('');
  const [emirate, setEmirate] = useState('');
  const [creating, setCreating] = useState(false);
  const createCenter = async () => {
    if (!name.trim()) return;
    setCreating(true); setError(null);
    try {
      const ctr = await trainingCenterService.createCenter({
        name: name.trim(), name_ar: nameAr.trim() || undefined,
        website: website.trim() || undefined, emirate: emirate.trim() || undefined,
      });
      setName(''); setNameAr(''); setWebsite(''); setEmirate('');
      await load();
      if (ctr?.id) setSelected(ctr);
    } catch (e) { setError(errMessage(e, t('Failed to create training center.', 'تعذّر إنشاء مركز التدريب.'))); }
    finally { setCreating(false); }
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) 1fr', gap: 20, alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: c.card, borderRadius: 12, padding: 18, border: `1px solid ${c.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 600, color: c.textPrimary, marginBottom: 12 }}>
            <Plus size={16} color={c.purpleText} />{t('Onboard a training center', 'تسجيل مركز تدريب')}
          </div>
          {error && <div style={msgBox('err')}><AlertCircle size={16} /><span>{error}</span></div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('Name (English) *', 'الاسم (إنجليزي) *')} style={field} />
            <input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder={t('Name (Arabic)', 'الاسم (عربي)')} style={field} dir="rtl" />
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={emirate} onChange={(e) => setEmirate(e.target.value)} placeholder={t('Emirate', 'الإمارة')} style={field} />
              <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder={t('Website', 'الموقع')} style={field} />
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
            <div style={{ textAlign: 'center', padding: 24, color: c.textSecondary, fontSize: 13 }}>{t('No training centers yet.', 'لا توجد مراكز تدريب بعد.')}</div>
          ) : centers.map((ctr) => (
            <button key={ctr.id} onClick={() => setSelected(ctr)} style={{
              width: '100%', textAlign: isRTL ? 'right' : 'left', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: selected?.id === ctr.id ? c.purpleBg : 'transparent',
            }}>
              <Building2 size={16} color={c.purpleText} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: c.textPrimary }}>{isRTL ? (ctr.name_ar || ctr.name) : ctr.name}</span>
                <span style={{ fontSize: 12, color: c.textSecondary }}>{[ctr.emirate, ctr.status].filter(Boolean).join(' · ')}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: c.card, borderRadius: 12, padding: 20, border: `1px solid ${c.border}`, minHeight: 200 }}>
        {!selected ? (
          <div style={{ textAlign: 'center', padding: 48, color: c.textSecondary }}>
            <GraduationCap size={40} color={c.border} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 14 }}>{t('Select a training center to manage its representatives.', 'اختر مركز تدريب لإدارة ممثليه.')}</div>
          </div>
        ) : (
          <StaffPanel center={selected} t={t} isRTL={isRTL} />
        )}
      </div>
    </div>
  );
};

const StaffPanel: React.FC<{ center: TrainingCenter; t: (en: string, ar: string) => string; isRTL: boolean }> = ({ center, t, isRTL }) => {
  const [staff, setStaff] = useState<CenterStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ kind: 'err' | 'ok'; text: string } | null>(null);
  const [eid, setEid] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setStaff(await trainingCenterService.listStaff(center.id)); }
    catch (e) { setMsg({ kind: 'err', text: errMessage(e, t('Failed to load representatives.', 'تعذّر تحميل الممثلين.')) }); }
    finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.id]);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!eid.trim()) return;
    setBusy(true); setMsg(null);
    try {
      await trainingCenterService.addStaff(center.id, eid.trim());
      setMsg({ kind: 'ok', text: t('Representative bound and role granted.', 'تم ربط الممثل ومنح الدور.') });
      setEid('');
      await load();
    } catch (e) { setMsg({ kind: 'err', text: errMessage(e, t('Failed to bind representative.', 'تعذّر ربط الممثل.')) }); }
    finally { setBusy(false); }
  };

  const remove = async (m: CenterStaff) => {
    setMsg(null);
    try { await trainingCenterService.removeStaff(center.id, m.user_id); await load(); }
    catch (e) { setMsg({ kind: 'err', text: errMessage(e, t('Failed to remove representative.', 'تعذّر إزالة الممثل.')) }); }
  };

  return (
    <div>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: c.textPrimary, margin: '0 0 4px' }}>{isRTL ? (center.name_ar || center.name) : center.name}</h3>
      <p style={{ fontSize: 13, color: c.textSecondary, margin: '0 0 16px' }}>
        {t('Representatives list this center’s training programs; the operator reviews and publishes them.',
           'يقوم الممثلون بإدراج برامج هذا المركز التدريبية؛ ويقوم المشغّل بمراجعتها ونشرها.')}
      </p>
      {msg && <div style={msgBox(msg.kind)}>{msg.kind === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}<span>{msg.text}</span></div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <input value={eid} onChange={(e) => setEid(e.target.value)} placeholder={t('Representative Emirates ID', 'رقم هوية الممثل')} style={{ ...field, flex: '1 1 220px' }} />
        <button onClick={add} disabled={!eid.trim() || busy} style={{ ...primaryBtn, opacity: !eid.trim() || busy ? 0.6 : 1 }}>
          {busy ? <Loader2 className="animate-spin" size={14} /> : <UserPlus size={14} />}{t('Bind', 'ربط')}
        </button>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: c.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
        {t('Representatives', 'الممثلون')} ({staff.length})
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 24 }}><Loader2 className="animate-spin" size={22} color={c.primary} /></div>
      ) : staff.length === 0 ? (
        <div style={{ fontSize: 13, color: c.textSecondary }}>{t('None yet.', 'لا يوجد بعد.')}</div>
      ) : staff.map((m) => (
        <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, border: `1px solid ${c.border}`, marginBottom: 6 }}>
          <Users size={15} color={c.purpleText} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.textPrimary }}>{m.full_name}</span>
            <span style={{ fontSize: 11, color: c.textSecondary }}>{m.user_id}</span>
          </span>
          <button onClick={() => remove(m)} title={t('Remove', 'إزالة')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: c.redText, padding: 4 }}>
            <Trash2 size={15} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default TrainingCentersManager;
