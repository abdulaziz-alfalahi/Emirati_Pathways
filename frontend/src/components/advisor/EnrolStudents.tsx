import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import {
  UserPlus, Upload, Loader2, CheckCircle2, AlertCircle, Building2, FileSpreadsheet,
} from 'lucide-react';
import studentEnrolmentService, {
  Institution, EnrolRow, BatchResult,
} from '@/services/studentEnrolmentService';

const brand = {
  primary: '#0D9488', primarySurface: '#F0FDFA', border: '#E5E7EB',
  textPrimary: '#111827', textSecondary: '#6B7280',
  red: '#FEE2E2', redText: '#991B1B', green: '#DCFCE7', greenText: '#166534',
};

const UNSCOPED = ['admin', 'administrator', 'super_admin', 'super_user', 'platform_administrator', 'education_operator'];

const field: React.CSSProperties = {
  width: '100%', border: `1px solid ${brand.border}`, borderRadius: 8, padding: '8px 12px',
  fontSize: 14, background: '#fff', color: brand.textPrimary,
};
const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: brand.textSecondary, marginBottom: 4, display: 'block' };
const btn = (variant: 'primary' | 'ghost'): React.CSSProperties => ({
  border: variant === 'primary' ? 'none' : `1px solid ${brand.border}`,
  background: variant === 'primary' ? brand.primary : '#fff',
  color: variant === 'primary' ? '#fff' : brand.textPrimary,
  padding: '9px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 6,
});
const box = (kind: 'err' | 'ok'): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8,
  fontSize: 13, marginBottom: 12,
  background: kind === 'err' ? brand.red : brand.green,
  color: kind === 'err' ? brand.redText : brand.greenText,
});

const errMessage = (e: any, fallback: string) =>
  e?.response?.data?.message || e?.message || fallback;

// Naive CSV → rows. Header row maps flexible column names to EnrolRow.
function parseCsv(text: string): EnrolRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const idx = (names: string[]) => headers.findIndex((h) => names.includes(h));
  const iEid = idx(['emirates_id', 'user_id', 'eid', 'id']);
  const iName = idx(['full_name', 'name']);
  const iProg = idx(['program', 'major']);
  const iGrad = idx(['graduation_date', 'grad_date']);
  const iDob = idx(['date_of_birth', 'dob']);
  const iSid = idx(['student_id', 'student_no']);
  return lines.slice(1).map((line) => {
    const c = line.split(',').map((x) => x.trim());
    return {
      user_id: iEid >= 0 ? c[iEid] : c[0],
      full_name: iName >= 0 ? c[iName] : undefined,
      program: iProg >= 0 ? c[iProg] : undefined,
      graduation_date: iGrad >= 0 ? c[iGrad] : undefined,
      date_of_birth: iDob >= 0 ? c[iDob] : undefined,
      student_id: iSid >= 0 ? c[iSid] : undefined,
    } as EnrolRow;
  }).filter((r) => r.user_id);
}

const EnrolStudents: React.FC = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => (isRTL ? ar : en);

  const isUnscoped = useMemo(() => {
    const roles = [user?.role, ...((user?.secondary_roles as string[]) || [])].filter(Boolean).map(String);
    return roles.some((r) => UNSCOPED.includes(r));
  }, [user]);

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [institutionId, setInstitutionId] = useState<number | ''>('');
  const [loadingInst, setLoadingInst] = useState(true);
  const [instError, setInstError] = useState<string | null>(null);

  const loadInstitutions = useCallback(async () => {
    setLoadingInst(true);
    setInstError(null);
    try {
      const rows = isUnscoped
        ? await studentEnrolmentService.institutions()
        : await studentEnrolmentService.myInstitutions();
      setInstitutions(rows);
      if (rows.length && institutionId === '') setInstitutionId(rows[0].id);
    } catch (e) {
      setInstError(errMessage(e, t('Failed to load institutions.', 'تعذّر تحميل المؤسسات.')));
    } finally {
      setLoadingInst(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnscoped, isRTL]);

  useEffect(() => { loadInstitutions(); }, [loadInstitutions]);

  // ----- single enrol -----
  const [sEid, setSEid] = useState('');
  const [sName, setSName] = useState('');
  const [sProg, setSProg] = useState('');
  const [sGrad, setSGrad] = useState('');
  const [sDob, setSDob] = useState('');
  const [sBusy, setSBusy] = useState(false);
  const [sMsg, setSMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const submitSingle = async () => {
    if (!institutionId || !sEid.trim()) return;
    setSBusy(true); setSMsg(null);
    try {
      await studentEnrolmentService.enrol({
        institution_id: institutionId as number,
        user_id: sEid.trim(), full_name: sName.trim() || undefined,
        program: sProg.trim() || undefined,
        graduation_date: sGrad || undefined, date_of_birth: sDob || undefined,
      });
      setSMsg({ kind: 'ok', text: t('Student enrolled and granted the student role.', 'تم تسجيل الطالب ومنحه دور الطالب.') });
      setSEid(''); setSName(''); setSProg(''); setSGrad(''); setSDob('');
    } catch (e) {
      setSMsg({ kind: 'err', text: errMessage(e, t('Failed to enrol this student.', 'تعذّر تسجيل هذا الطالب.')) });
    } finally { setSBusy(false); }
  };

  // ----- batch enrol -----
  const [csvText, setCsvText] = useState('');
  const [bBusy, setBBusy] = useState(false);
  const [bResult, setBResult] = useState<BatchResult | null>(null);
  const [bError, setBError] = useState<string | null>(null);
  const preview = useMemo(() => parseCsv(csvText), [csvText]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result || ''));
    reader.readAsText(file);
  };

  const submitBatch = async () => {
    if (!institutionId || !preview.length) return;
    setBBusy(true); setBError(null); setBResult(null);
    try {
      const res = await studentEnrolmentService.enrolBatch({
        institution_id: institutionId as number, students: preview,
      });
      setBResult(res);
    } catch (e) {
      setBError(errMessage(e, t('Batch enrolment failed.', 'فشل التسجيل الجماعي.')));
    } finally { setBBusy(false); }
  };

  // ----- admin: create institution -----
  const [newInst, setNewInst] = useState('');
  const [newInstBusy, setNewInstBusy] = useState(false);
  const createInstitution = async () => {
    if (!newInst.trim()) return;
    setNewInstBusy(true);
    try {
      const created = await studentEnrolmentService.createInstitution({ name: newInst.trim() });
      setNewInst('');
      await loadInstitutions();
      if (created?.id) setInstitutionId(created.id);
    } catch (e) {
      setInstError(errMessage(e, t('Failed to create institution.', 'تعذّر إنشاء المؤسسة.')));
    } finally { setNewInstBusy(false); }
  };

  const card: React.CSSProperties = {
    background: '#fff', border: `1px solid ${brand.border}`, borderRadius: 12, padding: 18, marginBottom: 18,
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
        {t('Enrol Students', 'تسجيل الطلاب')}
      </h2>
      <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 20, lineHeight: 1.6 }}>
        {t('Enrol students of your institution by their Emirates ID. This grants the student role and adds them to your caseload. Students who have not signed in yet are pre-created and activated when they log in via UAE Pass.',
           'سجّل طلاب مؤسستك عبر رقم الهوية الإماراتية. يمنح ذلك دور الطالب ويضيفهم إلى قائمتك. الطلاب الذين لم يسجّلوا الدخول بعد يتم إنشاؤهم مسبقًا وتفعيلهم عند تسجيل الدخول عبر الهوية الرقمية.')}
      </p>

      {/* Institution selector */}
      <div style={card}>
        <label style={label}><Building2 size={12} style={{ display: 'inline', marginInlineEnd: 4 }} />{t('Institution', 'المؤسسة')}</label>
        {instError && <div style={box('err')}><AlertCircle size={16} /><span>{instError}</span></div>}
        {loadingInst ? (
          <Loader2 className="animate-spin" size={20} style={{ color: brand.primary }} />
        ) : institutions.length === 0 ? (
          <p style={{ fontSize: 13, color: brand.textSecondary }}>
            {isUnscoped
              ? t('No institutions yet — create one below.', 'لا توجد مؤسسات بعد — أنشئ واحدة أدناه.')
              : t('You are not bound to any institution. Ask an operator to add you as an advisor.', 'لست مرتبطًا بأي مؤسسة. اطلب من المشغّل إضافتك كمستشار.')}
          </p>
        ) : (
          <select value={institutionId} onChange={(e) => setInstitutionId(Number(e.target.value))} style={field}>
            {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        )}
        {isUnscoped && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input value={newInst} onChange={(e) => setNewInst(e.target.value)}
              placeholder={t('New institution name', 'اسم مؤسسة جديدة')} style={field} />
            <button onClick={createInstitution} disabled={!newInst.trim() || newInstBusy} style={btn('ghost')}>
              {newInstBusy ? <Loader2 className="animate-spin" size={14} /> : <Building2 size={14} />}
              {t('Add', 'إضافة')}
            </button>
          </div>
        )}
      </div>

      {/* Single enrol */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 600, color: brand.textPrimary, marginBottom: 12 }}>
          <UserPlus size={16} style={{ color: brand.primary }} />{t('Enrol one student', 'تسجيل طالب واحد')}
        </div>
        {sMsg && <div style={box(sMsg.kind)}>{sMsg.kind === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}<span>{sMsg.text}</span></div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
          <div><label style={label}>{t('Emirates ID *', 'رقم الهوية *')}</label>
            <input value={sEid} onChange={(e) => setSEid(e.target.value)} placeholder="784XXXXXXXXXXXX" style={field} /></div>
          <div><label style={label}>{t('Full name', 'الاسم الكامل')}</label>
            <input value={sName} onChange={(e) => setSName(e.target.value)} style={field} /></div>
          <div><label style={label}>{t('Program', 'البرنامج')}</label>
            <input value={sProg} onChange={(e) => setSProg(e.target.value)} style={field} /></div>
          <div><label style={label}>{t('Graduation date', 'تاريخ التخرج')}</label>
            <input type="date" value={sGrad} onChange={(e) => setSGrad(e.target.value)} style={field} /></div>
          <div><label style={label}>{t('Date of birth', 'تاريخ الميلاد')}</label>
            <input type="date" value={sDob} onChange={(e) => setSDob(e.target.value)} style={field} /></div>
        </div>
        <button onClick={submitSingle} disabled={!institutionId || !sEid.trim() || sBusy}
          style={{ ...btn('primary'), opacity: !institutionId || !sEid.trim() || sBusy ? 0.6 : 1 }}>
          {sBusy ? <Loader2 className="animate-spin" size={14} /> : <UserPlus size={14} />}{t('Enrol student', 'تسجيل الطالب')}
        </button>
      </div>

      {/* Batch enrol */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 600, color: brand.textPrimary, marginBottom: 6 }}>
          <FileSpreadsheet size={16} style={{ color: brand.primary }} />{t('Batch upload (CSV)', 'رفع جماعي (CSV)')}
        </div>
        <p style={{ fontSize: 12, color: brand.textSecondary, marginBottom: 12 }}>
          {t('Columns: emirates_id, full_name, program, graduation_date, date_of_birth, student_id (only emirates_id is required).',
             'الأعمدة: emirates_id, full_name, program, graduation_date, date_of_birth, student_id (رقم الهوية فقط مطلوب).')}
        </p>
        {bError && <div style={box('err')}><AlertCircle size={16} /><span>{bError}</span></div>}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <label style={{ ...btn('ghost'), cursor: 'pointer' }}>
            <Upload size={14} />{t('Choose CSV file', 'اختر ملف CSV')}
            <input type="file" accept=".csv,text/csv" onChange={onFile} style={{ display: 'none' }} />
          </label>
          {preview.length > 0 && (
            <span style={{ fontSize: 13, color: brand.textSecondary, alignSelf: 'center' }}>
              {preview.length} {t('rows parsed', 'صف تم تحليله')}
            </span>
          )}
        </div>
        <textarea value={csvText} onChange={(e) => setCsvText(e.target.value)} rows={5}
          placeholder={'emirates_id,full_name,program\n784XXXXXXXXXXXX,Sara Ali,Computer Science'}
          style={{ ...field, fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }} />
        <div style={{ marginTop: 12 }}>
          <button onClick={submitBatch} disabled={!institutionId || !preview.length || bBusy}
            style={{ ...btn('primary'), opacity: !institutionId || !preview.length || bBusy ? 0.6 : 1 }}>
            {bBusy ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
            {t('Enrol', 'تسجيل')} {preview.length ? `(${preview.length})` : ''}
          </button>
        </div>
        {bResult && (
          <div style={{ marginTop: 14, fontSize: 13 }}>
            <div style={box('ok')}><CheckCircle2 size={16} />
              <span>{bResult.created} {t('created', 'أُنشئ')} · {bResult.updated} {t('updated', 'حُدّث')} · {bResult.failed} {t('failed', 'فشل')}</span>
            </div>
            {bResult.errors.length > 0 && (
              <ul style={{ margin: 0, paddingInlineStart: 18, color: brand.redText }}>
                {bResult.errors.map((er, i) => (
                  <li key={i}>{t('Row', 'صف')} {er.row}{er.user_id ? ` (${er.user_id})` : ''}: {er.error}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnrolStudents;
