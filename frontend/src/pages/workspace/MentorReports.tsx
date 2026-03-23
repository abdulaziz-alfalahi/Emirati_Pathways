import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { restClient } from '@/utils/api';
import {
  MessageSquare, Plus, Loader2, Star, X, ChevronDown, ChevronUp, User
} from 'lucide-react';

const brand = {
  primary: '#0D9488', primarySurface: '#F0FDFA', border: '#E5E7EB',
  textPrimary: '#111827', textSecondary: '#6B7280', white: '#fff',
  green: '#DCFCE7', greenText: '#166534', amber: '#FEF3C7', amberText: '#92400E',
  red: '#FEE2E2', redText: '#991B1B',
};

interface WorkspaceContext { workspace: any; companyId: string; userRole: string; isManager: boolean; }

const MentorReports: React.FC = () => {
  const { companyId, isManager } = useOutletContext<WorkspaceContext>();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);

  const [form, setForm] = useState({
    employee_id: '', summary: '', rating: 3, report_type: 'progress',
    recommendations: '', is_visible_to_employee: false,
    strengths: '', areas_for_improvement: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [companyId]);

  const loadData = async () => {
    try {
      const [repRes, empRes] = await Promise.all([
        restClient.get(`/api/workspace/${companyId}/mentor-reports`),
        restClient.get(`/api/workspace/${companyId}/employees`),
      ]);
      setReports((repRes as any).data.reports || []);
      setEmployees((empRes as any).data.employees || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const submitReport = async () => {
    if (!form.employee_id || !form.summary) return;
    setSubmitting(true);
    try {
      await restClient.post(`/api/workspace/${companyId}/mentor-reports`, {
        ...form,
        employee_id: parseInt(form.employee_id),
        rating: Number(form.rating),
        strengths: form.strengths ? form.strengths.split(',').map(s => s.trim()) : [],
        areas_for_improvement: form.areas_for_improvement
          ? form.areas_for_improvement.split(',').map(s => s.trim()) : [],
      });
      setShowAdd(false);
      setForm({ employee_id: '', summary: '', rating: 3, report_type: 'progress', recommendations: '', is_visible_to_employee: false, strengths: '', areas_for_improvement: '' });
      loadData();
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} /></div>;

  const typeColors: Record<string, { bg: string; text: string }> = {
    progress: { bg: brand.primarySurface, text: brand.primary },
    milestone: { bg: brand.green, text: brand.greenText },
    concern: { bg: brand.amber, text: brand.amberText },
    completion: { bg: '#DBEAFE', text: '#1E40AF' },
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: brand.textPrimary, margin: 0 }}>
            {t('Mentor & Coach Reports', 'تقارير المرشدين والمدربين')}
          </h1>
          <p style={{ fontSize: 14, color: brand.textSecondary, marginTop: 4 }}>
            {t('Progress reports and feedback from assigned mentors and coaches', 'تقارير التقدم والملاحظات من المرشدين والمدربين المعينين')}
          </p>
        </div>
        {isManager && (
          <button onClick={() => setShowAdd(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
            background: brand.primary, color: brand.white, border: 'none', borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            <Plus size={16} /> {t('New Report', 'تقرير جديد')}
          </button>
        )}
      </div>

      {reports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: brand.textSecondary }}>
          <MessageSquare size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>{t('No mentor reports yet', 'لا توجد تقارير مرشدين بعد')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reports.map(report => {
            const tc = typeColors[report.report_type] || typeColors.progress;
            const isExpanded = expanded === report.id;
            return (
              <div key={report.id} style={{
                background: brand.white, borderRadius: 12, border: `1px solid ${brand.border}`,
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: 18, display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer',
                }} onClick={() => setExpanded(isExpanded ? null : report.id)}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', background: tc.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <MessageSquare size={16} style={{ color: tc.text }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary }}>
                        {report.employee_name || 'Employee'}
                      </span>
                      <span style={{
                        padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600,
                        background: tc.bg, color: tc.text,
                      }}>{report.report_type}</span>
                      {report.rating && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, color: '#F59E0B' }}>
                          <Star size={12} fill="#F59E0B" /> {report.rating}/5
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: brand.textSecondary, margin: 0, lineHeight: 1.5 }}>
                      {isExpanded ? report.summary : (report.summary || '').substring(0, 150) + (report.summary?.length > 150 ? '...' : '')}
                    </p>
                    <div style={{ fontSize: 11, color: brand.textSecondary, marginTop: 6 }}>
                      {report.mentor_name && <span>by {report.mentor_name} · </span>}
                      {new Date(report.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={16} style={{ color: brand.textSecondary }} /> : <ChevronDown size={16} style={{ color: brand.textSecondary }} />}
                </div>

                {isExpanded && (
                  <div style={{ padding: '0 18px 18px', borderTop: `1px solid ${brand.border}`, paddingTop: 14 }}>
                    {report.strengths && report.strengths.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: brand.greenText }}>{t('Strengths', 'نقاط القوة')}:</span>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                          {(typeof report.strengths === 'string' ? JSON.parse(report.strengths) : report.strengths).map((s: string, i: number) => (
                            <span key={i} style={{ padding: '3px 8px', borderRadius: 99, background: brand.green, color: brand.greenText, fontSize: 11 }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {report.areas_for_improvement && (typeof report.areas_for_improvement === 'string' ? JSON.parse(report.areas_for_improvement) : report.areas_for_improvement).length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: brand.amberText }}>{t('Areas for Improvement', 'مجالات التحسين')}:</span>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                          {(typeof report.areas_for_improvement === 'string' ? JSON.parse(report.areas_for_improvement) : report.areas_for_improvement).map((s: string, i: number) => (
                            <span key={i} style={{ padding: '3px 8px', borderRadius: 99, background: brand.amber, color: brand.amberText, fontSize: 11 }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {report.recommendations && (
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: brand.primary }}>{t('Recommendations', 'التوصيات')}:</span>
                        <p style={{ fontSize: 13, color: brand.textSecondary, margin: '4px 0 0' }}>{report.recommendations}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Report Modal */}
      {isManager && showAdd && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setShowAdd(false)}>
          <div style={{
            background: brand.white, borderRadius: 14, width: 520, maxHeight: '85vh', overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: `1px solid ${brand.border}`,
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{t('Submit Mentor Report', 'تقديم تقرير المرشد')}</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} style={{ color: brand.textSecondary }} />
              </button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: brand.textPrimary, marginBottom: 4, display: 'block' }}>
                  {t('Employee', 'الموظف')} *
                </label>
                <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13 }}>
                  <option value="">{t('Select employee...', 'اختر الموظف...')}</option>
                  {employees.map(emp => <option key={emp.user_id} value={emp.user_id}>{emp.full_name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: brand.textPrimary, marginBottom: 4, display: 'block' }}>
                    {t('Report Type', 'نوع التقرير')}
                  </label>
                  <select value={form.report_type} onChange={e => setForm({ ...form, report_type: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13 }}>
                    <option value="progress">{t('Progress', 'تقدم')}</option>
                    <option value="milestone">{t('Milestone', 'إنجاز')}</option>
                    <option value="concern">{t('Concern', 'مخاوف')}</option>
                    <option value="completion">{t('Completion', 'اكتمال')}</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: brand.textPrimary, marginBottom: 4, display: 'block' }}>
                    {t('Rating', 'التقييم')}
                  </label>
                  <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setForm({ ...form, rating: n })} style={{
                        width: 36, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer',
                        background: n <= form.rating ? '#FEF3C7' : '#F9FAFB',
                        color: n <= form.rating ? '#F59E0B' : brand.textSecondary,
                      }}><Star size={16} fill={n <= form.rating ? '#F59E0B' : 'none'} /></button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: brand.textPrimary, marginBottom: 4, display: 'block' }}>
                  {t('Summary', 'الملخص')} *
                </label>
                <textarea value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })}
                  placeholder={t('Describe the employee\'s progress...', 'صف تقدم الموظف...')}
                  rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: brand.textPrimary, marginBottom: 4, display: 'block' }}>
                  {t('Strengths (comma-separated)', 'نقاط القوة (مفصولة بفواصل)')}
                </label>
                <input value={form.strengths} onChange={e => setForm({ ...form, strengths: e.target.value })}
                  placeholder="e.g. Leadership, Communication"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: brand.textPrimary, marginBottom: 4, display: 'block' }}>
                  {t('Areas for Improvement (comma-separated)', 'مجالات التحسين (مفصولة بفواصل)')}
                </label>
                <input value={form.areas_for_improvement} onChange={e => setForm({ ...form, areas_for_improvement: e.target.value })}
                  placeholder="e.g. Time management, Technical skills"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: brand.textPrimary, marginBottom: 4, display: 'block' }}>
                  {t('Recommendations', 'التوصيات')}
                </label>
                <textarea value={form.recommendations} onChange={e => setForm({ ...form, recommendations: e.target.value })}
                  placeholder={t('Next steps and recommendations...', 'الخطوات التالية والتوصيات...')}
                  rows={2} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: brand.textSecondary, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_visible_to_employee} onChange={e => setForm({ ...form, is_visible_to_employee: e.target.checked })} />
                {t('Visible to employee', 'مرئي للموظف')}
              </label>
              <button onClick={submitReport} disabled={!form.employee_id || !form.summary || submitting}
                style={{
                  width: '100%', padding: '12px', background: brand.primary, color: brand.white,
                  border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  opacity: (!form.employee_id || !form.summary || submitting) ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                {submitting ? <Loader2 className="animate-spin" size={16} /> : <MessageSquare size={16} />}
                {submitting ? t('Submitting...', 'جارٍ التقديم...') : t('Submit Report', 'تقديم التقرير')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorReports;
