// Coordinator view of the internship 3-way handshake: assign opportunities to a
// student and track/approve engagements. Self-contained; rendered as a tab inside
// InternshipCoordinatorDashboard.
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Briefcase, Search, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import internshipEngagementService, {
  Engagement,
  Internship,
  stageLabel,
} from '@/services/internshipEngagementService';

const brand = {
  primary: '#0D9488', primarySurface: '#F0FDFA', border: '#E5E7EB',
  textPrimary: '#111827', textSecondary: '#6B7280',
  amber: '#FEF3C7', amberText: '#92400E', green: '#DCFCE7', greenText: '#166534',
  blue: '#DBEAFE', blueText: '#1E40AF', red: '#FEE2E2', redText: '#991B1B',
};

const STAGE_STYLES: Record<Engagement['stage'], { bg: string; color: string }> = {
  proposed: { bg: brand.amber, color: brand.amberText },
  confirmed: { bg: brand.blue, color: brand.blueText },
  active: { bg: brand.green, color: brand.greenText },
  completed: { bg: brand.blue, color: brand.blueText },
  declined: { bg: brand.red, color: brand.redText },
  withdrawn: { bg: '#F3F4F6', color: brand.textSecondary },
};

const SUBSTATUS_STYLES: Record<string, { bg: string; color: string }> = {
  pending: { bg: brand.amber, color: brand.amberText },
  approved: { bg: brand.green, color: brand.greenText },
  accepted: { bg: brand.green, color: brand.greenText },
  granted: { bg: brand.green, color: brand.greenText },
  declined: { bg: brand.red, color: brand.redText },
  denied: { bg: brand.red, color: brand.redText },
};

function errMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { error?: string; message?: string } } ; message?: string };
  return e?.response?.data?.error || e?.response?.data?.message || e?.message || fallback;
}

const pillStyle = (s: { bg: string; color: string }): React.CSSProperties => ({
  background: s.bg, color: s.color, fontSize: 10, fontWeight: 600,
  padding: '3px 8px', borderRadius: 99, whiteSpace: 'nowrap',
});

const btnStyle = (variant: 'primary' | 'danger' | 'ghost'): React.CSSProperties => ({
  fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
  border: variant === 'ghost' ? `1px solid ${brand.border}` : 'none',
  background: variant === 'primary' ? brand.primary : variant === 'danger' ? '#DC2626' : '#fff',
  color: variant === 'ghost' ? brand.textSecondary : '#fff',
});

const CoordinatorInternshipEngagement: React.FC = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => (isRTL ? ar : en);

  // --- Section A: assign opportunities ---
  const [studentId, setStudentId] = useState('');
  const [loadedStudentId, setLoadedStudentId] = useState<string | null>(null);
  const [opportunities, setOpportunities] = useState<Internship[]>([]);
  const [oppsLoading, setOppsLoading] = useState(false);
  const [oppsError, setOppsError] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [assignNotice, setAssignNotice] = useState<string | null>(null);

  // --- Section B: engagements ---
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [engLoading, setEngLoading] = useState(true);
  const [engError, setEngError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);
  const [decliningId, setDecliningId] = useState<number | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  const loadEngagements = useCallback(async () => {
    setEngError(null);
    try {
      const rows = await internshipEngagementService.coordinatorEngagements();
      setEngagements(rows || []);
    } catch (err) {
      setEngError(errMessage(err, t('Failed to load engagements.', 'تعذّر تحميل المشاركات.')));
    } finally {
      setEngLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRTL]);

  useEffect(() => { loadEngagements(); }, [loadEngagements]);

  const loadOpportunities = async () => {
    const sid = studentId.trim();
    if (!sid) return;
    setOppsLoading(true);
    setOppsError(null);
    setAssignNotice(null);
    try {
      const rows = await internshipEngagementService.coordinatorOpportunities(sid);
      setOpportunities(rows || []);
      setLoadedStudentId(sid);
    } catch (err) {
      setOppsError(errMessage(err, t('Failed to load opportunities.', 'تعذّر تحميل الفرص.')));
      setOpportunities([]);
      setLoadedStudentId(null);
    } finally {
      setOppsLoading(false);
    }
  };

  const assign = async (internship: Internship) => {
    if (!loadedStudentId) return;
    setAssigningId(internship.id);
    setOppsError(null);
    setAssignNotice(null);
    try {
      await internshipEngagementService.propose(internship.id, loadedStudentId);
      setAssignNotice(
        isRTL
          ? `تم اقتراح «${internship.title_ar || internship.title}» للطالب ${loadedStudentId}.`
          : `Proposed "${internship.title}" to student ${loadedStudentId}.`
      );
      await loadEngagements();
    } catch (err) {
      setOppsError(errMessage(err, t('Failed to assign this opportunity.', 'تعذّر إسناد هذه الفرصة.')));
    } finally {
      setAssigningId(null);
    }
  };

  const runAction = async (id: number, fn: () => Promise<unknown>, failMsg: string) => {
    setActingId(id);
    setEngError(null);
    try {
      await fn();
      await loadEngagements();
    } catch (err) {
      setEngError(errMessage(err, failMsg));
    } finally {
      setActingId(null);
    }
  };

  const sectionTitle: React.CSSProperties = { fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 };
  const sectionDesc: React.CSSProperties = { fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 };
  const errorBox: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8, background: brand.red, color: brand.redText,
    fontSize: 13, padding: '10px 14px', borderRadius: 8, marginBottom: 16,
  };
  const successBox: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8, background: brand.green, color: brand.greenText,
    fontSize: 13, padding: '10px 14px', borderRadius: 8, marginBottom: 16,
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ---------- Section A: assign opportunities ---------- */}
      <h2 style={sectionTitle}>{t('Assign Opportunities', 'إسناد الفرص')}</h2>
      <p style={sectionDesc}>
        {t('Look up internship opportunities for a student and propose an assignment. The recruiter and the student both need to approve.',
           'ابحث عن فرص التدريب العملي لطالب واقترح إسنادًا. يجب أن يوافق كل من مسؤول التوظيف والطالب.')}
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <input
          value={studentId}
          onChange={e => setStudentId(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') loadOpportunities(); }}
          placeholder={t('Student Emirates ID', 'رقم الهوية الإماراتية للطالب')}
          style={{
            flex: '1 1 260px', maxWidth: 360, fontSize: 14, padding: '8px 12px',
            border: `1px solid ${brand.border}`, borderRadius: 8, color: brand.textPrimary, outline: 'none',
          }}
        />
        <button
          onClick={loadOpportunities}
          disabled={!studentId.trim() || oppsLoading}
          style={{ ...btnStyle('primary'), display: 'flex', alignItems: 'center', gap: 6, opacity: !studentId.trim() || oppsLoading ? 0.6 : 1 }}
        >
          {oppsLoading ? <Loader2 className="animate-spin" size={14} /> : <Search size={14} />}
          {t('Load opportunities', 'تحميل الفرص')}
        </button>
      </div>

      {oppsError && <div style={errorBox}><AlertCircle size={16} /><span>{oppsError}</span></div>}
      {assignNotice && <div style={successBox}><CheckCircle2 size={16} /><span>{assignNotice}</span></div>}

      {oppsLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} />
        </div>
      ) : loadedStudentId === null ? (
        <div style={{ textAlign: 'center', padding: 32, color: brand.textSecondary, fontSize: 13 }}>
          <p>{t('Enter a student Emirates ID to see available opportunities.', 'أدخل رقم الهوية الإماراتية للطالب لعرض الفرص المتاحة.')}</p>
        </div>
      ) : opportunities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, color: brand.textSecondary, fontSize: 13 }}>
          <p>{t('No internship opportunities available right now.', 'لا توجد فرص تدريب عملي متاحة حاليًا.')}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14, marginBottom: 8 }}>
          {opportunities.map(opp => (
            <div key={opp.id} className="ep-card" style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, display: 'flex', flexDirection: 'column', gap: 8, transition: 'box-shadow .2s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Briefcase size={20} style={{ color: brand.primary }} />
                </div>
                {opp.relevant_to_student && (
                  <span style={{ ...pillStyle({ bg: brand.primarySurface, color: brand.primary }), display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Sparkles size={11} />
                    {t('Relevant to student', 'ملائمة للطالب')}
                  </span>
                )}
              </div>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>
                  {isRTL && opp.title_ar ? opp.title_ar : opp.title}
                </h4>
                <div style={{ fontSize: 12, color: brand.textSecondary }}>
                  {[opp.company, opp.sector].filter(Boolean).join(' · ') || t('Details unavailable', 'التفاصيل غير متوفرة')}
                </div>
              </div>
              <div style={{ marginTop: 'auto' }}>
                <button
                  onClick={() => assign(opp)}
                  disabled={assigningId !== null}
                  style={{ ...btnStyle('primary'), display: 'flex', alignItems: 'center', gap: 6, opacity: assigningId !== null ? 0.6 : 1 }}
                >
                  {assigningId === opp.id && <Loader2 className="animate-spin" size={14} />}
                  {t('Assign to student', 'إسناد إلى الطالب')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---------- Section B: engagements ---------- */}
      <div style={{ borderTop: `1px solid ${brand.border}`, margin: '28px 0 24px' }} />
      <h2 style={sectionTitle}>{t('Engagements', 'المشاركات')}</h2>
      <p style={sectionDesc}>
        {t('Track every internship engagement, approve student-initiated applications, and manage the internship lifecycle.',
           'تتبّع جميع مشاركات التدريب العملي، ووافق على الطلبات المقدمة من الطلاب، وأدر دورة حياة التدريب.')}
      </p>

      {engError && <div style={errorBox}><AlertCircle size={16} /><span>{engError}</span></div>}

      {engLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} />
        </div>
      ) : engagements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>
          <p>{t('No engagements yet. Assign an opportunity above to start one.', 'لا توجد مشاركات بعد. أسند فرصة أعلاه لبدء واحدة.')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {engagements.map(eng => {
            const stage = stageLabel(eng.stage);
            const stageStyle = STAGE_STYLES[eng.stage] || { bg: '#F3F4F6', color: brand.textSecondary };
            const needsDecision = eng.stage === 'proposed' && eng.initiated_by === 'student' && eng.coordinator_status === 'pending';
            const busy = actingId === eng.id;
            const subStatuses: { label: string; value: string }[] = [
              { label: t('Recruiter', 'مسؤول التوظيف'), value: eng.recruiter_status },
              { label: t('Student', 'الطالب'), value: eng.student_status },
              { label: t('Coordinator', 'المنسق'), value: eng.coordinator_status },
              ...(eng.parent_consent_status !== 'not_required'
                ? [{ label: t('Parent consent', 'موافقة ولي الأمر'), value: eng.parent_consent_status }]
                : []),
            ];
            return (
              <div key={eng.id} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>
                      {eng.internship_title || t('Internship', 'تدريب عملي')}
                    </h4>
                    <div style={{ fontSize: 12, color: brand.textSecondary, marginTop: 2 }}>
                      {[eng.student_name || eng.user_id, eng.internship_company].filter(Boolean).join(' · ')}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                      {subStatuses.map(s => (
                        <span key={s.label} style={pillStyle(SUBSTATUS_STYLES[s.value] || { bg: '#F3F4F6', color: brand.textSecondary })}>
                          {s.label}: {s.value}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span style={pillStyle(stageStyle)}>{isRTL ? stage.ar : stage.label}</span>
                </div>

                {(needsDecision || eng.stage === 'confirmed' || eng.stage === 'active') && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
                    {busy && <Loader2 className="animate-spin" size={14} style={{ color: brand.primary }} />}
                    {needsDecision && decliningId !== eng.id && (
                      <>
                        <button
                          disabled={busy}
                          onClick={() => runAction(eng.id,
                            () => internshipEngagementService.coordinatorDecision(eng.id, 'approve'),
                            t('Failed to approve.', 'تعذّرت الموافقة.'))}
                          style={{ ...btnStyle('primary'), opacity: busy ? 0.6 : 1 }}
                        >
                          {t('Approve', 'موافقة')}
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => { setDecliningId(eng.id); setDeclineReason(''); }}
                          style={{ ...btnStyle('danger'), opacity: busy ? 0.6 : 1 }}
                        >
                          {t('Decline', 'رفض')}
                        </button>
                      </>
                    )}
                    {needsDecision && decliningId === eng.id && (
                      <>
                        <input
                          value={declineReason}
                          onChange={e => setDeclineReason(e.target.value)}
                          placeholder={t('Reason (optional)', 'السبب (اختياري)')}
                          style={{ flex: '1 1 200px', maxWidth: 320, fontSize: 12, padding: '6px 10px', border: `1px solid ${brand.border}`, borderRadius: 8, outline: 'none' }}
                        />
                        <button
                          disabled={busy}
                          onClick={() => runAction(eng.id,
                            () => internshipEngagementService.coordinatorDecision(eng.id, 'decline', declineReason.trim() || undefined),
                            t('Failed to decline.', 'تعذّر الرفض.')).then(() => setDecliningId(null))}
                          style={{ ...btnStyle('danger'), opacity: busy ? 0.6 : 1 }}
                        >
                          {t('Confirm decline', 'تأكيد الرفض')}
                        </button>
                        <button disabled={busy} onClick={() => setDecliningId(null)} style={btnStyle('ghost')}>
                          {t('Cancel', 'إلغاء')}
                        </button>
                      </>
                    )}
                    {eng.stage === 'confirmed' && (
                      <button
                        disabled={busy}
                        onClick={() => runAction(eng.id,
                          () => internshipEngagementService.begin(eng.id),
                          t('Failed to begin the internship.', 'تعذّر بدء التدريب.'))}
                        style={{ ...btnStyle('primary'), opacity: busy ? 0.6 : 1 }}
                      >
                        {t('Begin', 'بدء')}
                      </button>
                    )}
                    {eng.stage === 'active' && (
                      <button
                        disabled={busy}
                        onClick={() => runAction(eng.id,
                          () => internshipEngagementService.complete(eng.id),
                          t('Failed to complete the internship.', 'تعذّر إكمال التدريب.'))}
                        style={{ ...btnStyle('primary'), opacity: busy ? 0.6 : 1 }}
                      >
                        {t('Complete', 'إكمال')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CoordinatorInternshipEngagement;
