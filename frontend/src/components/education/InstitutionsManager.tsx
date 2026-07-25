import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2, Plus, UserPlus, Loader2, Trash2, GraduationCap, Users, AlertCircle, CheckCircle2,
} from 'lucide-react';
import studentEnrolmentService, {
  Institution, StaffMember,
} from '@/services/studentEnrolmentService';

// Matches the Education Operator dashboard palette.
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

const InstitutionsManager: React.FC = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => (isRTL ? ar : en);

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Institution | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      setInstitutions(await studentEnrolmentService.institutions());
    } catch (e) {
      setError(errMessage(e, t('Failed to load institutions.', 'تعذّر تحميل المؤسسات.')));
    } finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRTL]);
  useEffect(() => { load(); }, [load]);

  // create institution
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [type, setType] = useState('university');
  const [emirate, setEmirate] = useState('');
  const [creating, setCreating] = useState(false);
  const createInstitution = async () => {
    if (!name.trim()) return;
    setCreating(true); setError(null);
    try {
      const inst = await studentEnrolmentService.createInstitution({
        name: name.trim(), name_ar: nameAr.trim() || undefined, type, emirate: emirate.trim() || undefined,
      });
      setName(''); setNameAr(''); setEmirate('');
      await load();
      if (inst?.id) setSelected(inst);
    } catch (e) {
      setError(errMessage(e, t('Failed to create institution.', 'تعذّر إنشاء المؤسسة.')));
    } finally { setCreating(false); }
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) 1fr', gap: 20, alignItems: 'start' }}>
      {/* Left: institutions + create */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: c.card, borderRadius: 12, padding: 18, border: `1px solid ${c.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 600, color: c.textPrimary, marginBottom: 12 }}>
            <Plus size={16} color={c.purpleText} />{t('Add institution', 'إضافة مؤسسة')}
          </div>
          {error && <div style={msgBox('err')}><AlertCircle size={16} /><span>{error}</span></div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('Name (English) *', 'الاسم (إنجليزي) *')} style={field} />
            <input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder={t('Name (Arabic)', 'الاسم (عربي)')} style={field} dir="rtl" />
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={type} onChange={(e) => setType(e.target.value)} style={field}>
                <option value="university">{t('University', 'جامعة')}</option>
                <option value="school">{t('School', 'مدرسة')}</option>
                <option value="training">{t('Training', 'تدريب')}</option>
              </select>
              <input value={emirate} onChange={(e) => setEmirate(e.target.value)} placeholder={t('Emirate', 'الإمارة')} style={field} />
            </div>
            <button onClick={createInstitution} disabled={!name.trim() || creating} style={{ ...primaryBtn, opacity: !name.trim() || creating ? 0.6 : 1, justifyContent: 'center' }}>
              {creating ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}{t('Create', 'إنشاء')}
            </button>
          </div>
        </div>

        <div style={{ background: c.card, borderRadius: 12, padding: 8, border: `1px solid ${c.border}` }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 24 }}><Loader2 className="animate-spin" size={22} color={c.primary} /></div>
          ) : institutions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: c.textSecondary, fontSize: 13 }}>{t('No institutions yet.', 'لا توجد مؤسسات بعد.')}</div>
          ) : institutions.map((inst) => (
            <button key={inst.id} onClick={() => setSelected(inst)} style={{
              width: '100%', textAlign: isRTL ? 'right' : 'left', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: selected?.id === inst.id ? c.purpleBg : 'transparent',
            }}>
              <Building2 size={16} color={c.purpleText} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: c.textPrimary }}>{isRTL ? (inst.name_ar || inst.name) : inst.name}</span>
                <span style={{ fontSize: 12, color: c.textSecondary }}>{inst.type}{inst.emirate ? ` · ${inst.emirate}` : ''}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Right: staff for the selected institution */}
      <div style={{ background: c.card, borderRadius: 12, padding: 20, border: `1px solid ${c.border}`, minHeight: 200 }}>
        {!selected ? (
          <div style={{ textAlign: 'center', padding: 48, color: c.textSecondary }}>
            <GraduationCap size={40} color={c.border} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 14 }}>{t('Select an institution to manage its advisors and coordinators.', 'اختر مؤسسة لإدارة مستشاريها والمنسقين.')}</div>
          </div>
        ) : (
          <StaffPanel institution={selected} t={t} isRTL={isRTL} />
        )}
      </div>
    </div>
  );
};

const StaffPanel: React.FC<{ institution: Institution; t: (en: string, ar: string) => string; isRTL: boolean }> = ({ institution, t, isRTL }) => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ kind: 'err' | 'ok'; text: string } | null>(null);
  const [eid, setEid] = useState('');
  const [role, setRole] = useState<'advisor' | 'coordinator'>('advisor');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setStaff(await studentEnrolmentService.listStaff(institution.id));
    } catch (e) {
      setMsg({ kind: 'err', text: errMessage(e, t('Failed to load staff.', 'تعذّر تحميل الطاقم.')) });
    } finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institution.id]);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!eid.trim()) return;
    setBusy(true); setMsg(null);
    try {
      await studentEnrolmentService.addStaff(institution.id, { user_id: eid.trim(), staff_role: role });
      setMsg({ kind: 'ok', text: t('Staff bound and role granted.', 'تم ربط الطاقم ومنح الدور.') });
      setEid('');
      await load();
    } catch (e) {
      setMsg({ kind: 'err', text: errMessage(e, t('Failed to bind staff.', 'تعذّر ربط الطاقم.')) });
    } finally { setBusy(false); }
  };

  const remove = async (m: StaffMember) => {
    setMsg(null);
    try {
      await studentEnrolmentService.removeStaff(institution.id, m.user_id, m.staff_role);
      await load();
    } catch (e) {
      setMsg({ kind: 'err', text: errMessage(e, t('Failed to remove staff.', 'تعذّر إزالة الطاقم.')) });
    }
  };

  const advisors = staff.filter((s) => s.staff_role === 'advisor');
  const coordinators = staff.filter((s) => s.staff_role === 'coordinator');

  const roleGroup = (title: string, members: StaffMember[]) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: c.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>{title} ({members.length})</div>
      {members.length === 0 ? (
        <div style={{ fontSize: 13, color: c.textSecondary }}>{t('None yet.', 'لا يوجد بعد.')}</div>
      ) : members.map((m) => (
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

  return (
    <div>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: c.textPrimary, margin: '0 0 4px' }}>{isRTL ? (institution.name_ar || institution.name) : institution.name}</h3>
      <p style={{ fontSize: 13, color: c.textSecondary, margin: '0 0 16px' }}>
        {t('Advisors enrol and manage this institution’s students; coordinators assign internships to them.',
           'يقوم المستشارون بتسجيل وإدارة طلاب هذه المؤسسة؛ ويسند المنسقون فرص التدريب لهم.')}
      </p>

      {msg && <div style={msgBox(msg.kind)}>{msg.kind === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}<span>{msg.text}</span></div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <input value={eid} onChange={(e) => setEid(e.target.value)} placeholder={t('Staff Emirates ID', 'رقم هوية الطاقم')} style={{ ...field, flex: '1 1 200px' }} />
        <select value={role} onChange={(e) => setRole(e.target.value as 'advisor' | 'coordinator')} style={{ ...field, flex: '0 0 auto', width: 'auto' }}>
          <option value="advisor">{t('Advisor', 'مستشار')}</option>
          <option value="coordinator">{t('Coordinator', 'منسق')}</option>
        </select>
        <button onClick={add} disabled={!eid.trim() || busy} style={{ ...primaryBtn, opacity: !eid.trim() || busy ? 0.6 : 1 }}>
          {busy ? <Loader2 className="animate-spin" size={14} /> : <UserPlus size={14} />}{t('Bind', 'ربط')}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 24 }}><Loader2 className="animate-spin" size={22} color={c.primary} /></div>
      ) : (
        <>
          {roleGroup(t('Academic Advisors', 'المستشارون الأكاديميون'), advisors)}
          {roleGroup(t('Internship Coordinators', 'منسقو التدريب'), coordinators)}
        </>
      )}
    </div>
  );
};

export default InstitutionsManager;
