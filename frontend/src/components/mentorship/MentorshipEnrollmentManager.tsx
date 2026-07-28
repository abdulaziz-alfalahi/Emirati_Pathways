import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus, Loader2, Trash2, Users, GraduationCap, BookOpen, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import mentorshipOperatorService, {
  OperatorMentor, OperatorCoach, MentorshipProgram,
} from '@/services/mentorshipOperatorService';

const c = {
  primary: '#4F46E5', tint: '#E0E7FF', tintText: '#4F46E5',
  card: '#FFFFFF', border: '#E5E7EB', textPrimary: '#312E81', textSecondary: '#6B7280',
  red: '#FEE2E2', redText: '#991B1B', green: '#ECFDF5', greenText: '#059669',
};
const field: React.CSSProperties = { border: `1px solid ${c.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 14, background: '#fff', color: c.textPrimary, outline: 'none', width: '100%' };
const btn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, background: c.primary, color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const box = (k: 'err' | 'ok'): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12, background: k === 'err' ? c.red : c.green, color: k === 'err' ? c.redText : c.greenText });
const err = (e: any, f: string) => e?.response?.data?.message || e?.message || f;
// Never show a raw 15-digit Emirates ID or "null" as a name (C3-MOP-2).
const looksLikeEid = (s?: string | null) => !!s && /^\d{15}$/.test(String(s).trim());
const personName = (name?: string | null, fallback = 'Enrolled') => {
  const n = (name ?? '').toString().trim();
  return (!n || n.toLowerCase() === 'null' || looksLikeEid(n)) ? fallback : n;
};
const card: React.CSSProperties = { background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: 18, marginBottom: 18 };
const rowItem: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, border: `1px solid ${c.border}`, marginBottom: 6 };

const MentorshipEnrollmentManager: React.FC = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => (isRTL ? ar : en);

  const [mentors, setMentors] = useState<OperatorMentor[]>([]);
  const [coaches, setCoaches] = useState<OperatorCoach[]>([]);
  const [programs, setPrograms] = useState<MentorshipProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ kind: 'err' | 'ok'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, co, p] = await Promise.allSettled([
        mentorshipOperatorService.mentors(), mentorshipOperatorService.coaches(), mentorshipOperatorService.programs(),
      ]);
      if (m.status === 'fulfilled') setMentors(m.value);
      if (co.status === 'fulfilled') setCoaches(co.value);
      if (p.status === 'fulfilled') setPrograms(p.value);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const [mForm, setMForm] = useState({ user_id: '', professional_title: '', industry: '', expertise: '' });
  const [coachId, setCoachId] = useState('');
  const [progName, setProgName] = useState('');
  const [busy, setBusy] = useState('');

  const enrolMentor = async () => {
    if (!mForm.user_id.trim()) return;
    setBusy('mentor'); setMsg(null);
    try {
      await mentorshipOperatorService.enrolMentor({
        user_id: mForm.user_id.trim(), professional_title: mForm.professional_title.trim() || undefined,
        industry: mForm.industry.trim() || undefined,
        expertise_areas: mForm.expertise.split(',').map(s => s.trim()).filter(Boolean),
      });
      setMsg({ kind: 'ok', text: t('Mentor enrolled.', 'تم تسجيل المرشد.') });
      setMForm({ user_id: '', professional_title: '', industry: '', expertise: '' });
      await load();
    } catch (e) { setMsg({ kind: 'err', text: err(e, t('Failed to enrol mentor.', 'تعذّر تسجيل المرشد.')) }); }
    finally { setBusy(''); }
  };
  const enrolCoach = async () => {
    if (!coachId.trim()) return;
    setBusy('coach'); setMsg(null);
    try { await mentorshipOperatorService.enrolCoach(coachId.trim()); setMsg({ kind: 'ok', text: t('Coach enrolled.', 'تم تسجيل المدرب.') }); setCoachId(''); await load(); }
    catch (e) { setMsg({ kind: 'err', text: err(e, t('Failed to enrol coach.', 'تعذّر تسجيل المدرب.')) }); }
    finally { setBusy(''); }
  };
  const createProgram = async () => {
    if (!progName.trim()) return;
    setBusy('prog'); setMsg(null);
    try { await mentorshipOperatorService.createProgram({ program_name: progName.trim() }); setMsg({ kind: 'ok', text: t('Program created.', 'تم إنشاء البرنامج.') }); setProgName(''); await load(); }
    catch (e) { setMsg({ kind: 'err', text: err(e, t('Failed to create program.', 'تعذّر إنشاء البرنامج.')) }); }
    finally { setBusy(''); }
  };
  const removeMentor = async (uid: string) => {
    try { await mentorshipOperatorService.removeMentor(uid); await load(); }
    catch (e) { setMsg({ kind: 'err', text: err(e, t('Failed to retire mentor.', 'تعذّر إيقاف المرشد.')) }); }
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      {msg && <div style={box(msg.kind)}>{msg.kind === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}<span>{msg.text}</span></div>}

      {/* Enrol mentor */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 600, color: c.textPrimary, marginBottom: 12 }}>
          <GraduationCap size={16} color={c.tintText} />{t('Enrol a mentor', 'تسجيل مرشد')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 12 }}>
          <input style={field} placeholder={t('Emirates ID *', 'رقم الهوية *')} value={mForm.user_id} onChange={e => setMForm({ ...mForm, user_id: e.target.value })} />
          <input style={field} placeholder={t('Professional title', 'المسمى المهني')} value={mForm.professional_title} onChange={e => setMForm({ ...mForm, professional_title: e.target.value })} />
          <input style={field} placeholder={t('Industry', 'القطاع')} value={mForm.industry} onChange={e => setMForm({ ...mForm, industry: e.target.value })} />
          <input style={field} placeholder={t('Expertise (comma-separated)', 'الخبرات (مفصولة بفواصل)')} value={mForm.expertise} onChange={e => setMForm({ ...mForm, expertise: e.target.value })} />
        </div>
        <button style={{ ...btn, opacity: !mForm.user_id.trim() || busy === 'mentor' ? 0.6 : 1 }} disabled={!mForm.user_id.trim() || busy === 'mentor'} onClick={enrolMentor}>
          {busy === 'mentor' ? <Loader2 className="animate-spin" size={14} /> : <UserPlus size={14} />}{t('Enrol mentor', 'تسجيل المرشد')}
        </button>
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: c.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>{t('Mentors', 'المرشدون')} ({mentors.length})</div>
          {loading ? <Loader2 className="animate-spin" size={20} color={c.primary} /> : mentors.length === 0 ? <div style={{ fontSize: 13, color: c.textSecondary }}>{t('None yet.', 'لا يوجد بعد.')}</div> : mentors.map(m => (
            <div key={m.user_id} style={rowItem}>
              <Users size={15} color={c.tintText} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.textPrimary }}>{personName(m.full_name, m.professional_title || t('Mentor', 'مرشد'))}</span>
                <span style={{ fontSize: 11, color: c.textSecondary }}>{[m.professional_title, m.industry].filter(Boolean).join(' · ') || t('Mentor', 'مرشد')}{m.is_verified ? ' · ✓' : ''}</span>
              </span>
              <button onClick={() => removeMentor(m.user_id)} title={t('Retire', 'إيقاف')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: c.redText, padding: 4 }}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Enrol coach */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 600, color: c.textPrimary, marginBottom: 12 }}>
          <Users size={16} color={c.tintText} />{t('Enrol a coach', 'تسجيل مدرب')}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <input style={{ ...field, flex: '1 1 220px' }} placeholder={t('Coach Emirates ID *', 'رقم هوية المدرب *')} value={coachId} onChange={e => setCoachId(e.target.value)} />
          <button style={{ ...btn, opacity: !coachId.trim() || busy === 'coach' ? 0.6 : 1 }} disabled={!coachId.trim() || busy === 'coach'} onClick={enrolCoach}>
            {busy === 'coach' ? <Loader2 className="animate-spin" size={14} /> : <UserPlus size={14} />}{t('Enrol coach', 'تسجيل المدرب')}
          </button>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: c.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>{t('Coaches', 'المدربون')} ({coaches.length})</div>
        {coaches.map(co => (
          <div key={co.user_id} style={rowItem}><Users size={15} color={c.tintText} /><span style={{ fontSize: 13, color: c.textPrimary }}>{personName(co.full_name, t('Coach', 'مدرب'))}</span></div>
        ))}
        {coaches.length === 0 && <div style={{ fontSize: 13, color: c.textSecondary }}>{t('None yet.', 'لا يوجد بعد.')}</div>}
      </div>

      {/* Programs */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 600, color: c.textPrimary, marginBottom: 12 }}>
          <BookOpen size={16} color={c.tintText} />{t('Mentorship programs', 'برامج الإرشاد')}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <input style={{ ...field, flex: '1 1 220px' }} placeholder={t('New program name *', 'اسم برنامج جديد *')} value={progName} onChange={e => setProgName(e.target.value)} />
          <button style={{ ...btn, opacity: !progName.trim() || busy === 'prog' ? 0.6 : 1 }} disabled={!progName.trim() || busy === 'prog'} onClick={createProgram}>
            {busy === 'prog' ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}{t('Create', 'إنشاء')}
          </button>
        </div>
        {programs.map(p => (
          <div key={p.id} style={rowItem}><BookOpen size={15} color={c.tintText} /><span style={{ fontSize: 13, color: c.textPrimary }}>{p.program_name} <span style={{ color: c.textSecondary, fontSize: 11 }}>{p.program_type}</span></span></div>
        ))}
        {programs.length === 0 && <div style={{ fontSize: 13, color: c.textSecondary }}>{t('No programs yet.', 'لا توجد برامج بعد.')}</div>}
      </div>
    </div>
  );
};

export default MentorshipEnrollmentManager;
