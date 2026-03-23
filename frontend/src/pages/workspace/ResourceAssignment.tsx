import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { restClient } from '@/utils/api';
import {
  BookOpen, Award, UserCheck, Target, Plus, Loader2, X,
  Clock, CheckCircle, AlertCircle
} from 'lucide-react';

const brand = {
  primary: '#0D9488', primarySurface: '#F0FDFA', border: '#E5E7EB',
  textPrimary: '#111827', textSecondary: '#6B7280', white: '#fff',
  green: '#DCFCE7', greenText: '#166534', amber: '#FEF3C7', amberText: '#92400E',
  blue: '#DBEAFE', blueText: '#1E40AF', red: '#FEE2E2', redText: '#991B1B',
};

interface WorkspaceContext { workspace: any; companyId: string; userRole: string; isManager: boolean; }

const RESOURCE_TYPES = [
  { value: 'training', icon: '📚', label: 'Training', labelAr: 'تدريب' },
  { value: 'certification', icon: '🎖️', label: 'Certification', labelAr: 'شهادة' },
  { value: 'mentor', icon: '🧑‍🏫', label: 'Mentor', labelAr: 'مرشد' },
  { value: 'coach', icon: '🎯', label: 'Coach', labelAr: 'مدرب' },
];

const ResourceAssignment: React.FC = () => {
  const { companyId, isManager } = useOutletContext<WorkspaceContext>();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;

  const [resources, setResources] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Form state
  const [form, setForm] = useState({
    employee_id: '', resource_type: 'training', resource_name: '',
    resource_description: '', priority: 'normal', due_date: '', notes: '',
  });

  const loadResources = async () => {
    try {
      let url = `/api/workspace/${companyId}/resources?`;
      if (typeFilter) url += `type=${typeFilter}&`;
      if (statusFilter) url += `status=${statusFilter}&`;
      const res = await restClient.get(url);
      setResources((res as any).data.resources || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadEmployees = async () => {
    try {
      const res = await restClient.get(`/api/workspace/${companyId}/employees`);
      setEmployees((res as any).data.employees || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadResources(); loadEmployees(); }, [companyId, typeFilter, statusFilter]);

  const assignResource = async () => {
    if (!form.employee_id || !form.resource_name) return;
    try {
      await restClient.post(`/api/workspace/${companyId}/resources`, form);
      setShowAssignModal(false);
      setForm({ employee_id: '', resource_type: 'training', resource_name: '', resource_description: '', priority: 'normal', due_date: '', notes: '' });
      loadResources();
    } catch (err) { console.error(err); }
  };

  const updateStatus = async (resourceId: string, newStatus: string) => {
    try {
      await restClient.put(`/api/workspace/${companyId}/resources/${resourceId}`, { status: newStatus });
      loadResources();
    } catch (err) { console.error(err); }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={14} style={{ color: brand.greenText }} />;
      case 'in_progress': return <Clock size={14} style={{ color: brand.amberText }} />;
      case 'cancelled': return <AlertCircle size={14} style={{ color: brand.redText }} />;
      default: return <AlertCircle size={14} style={{ color: brand.blueText }} />;
    }
  };

  const statusBadge = (status: string) => {
    const m: Record<string, { bg: string; color: string; label: string }> = {
      assigned: { bg: brand.blue, color: brand.blueText, label: t('Assigned', 'معين') },
      in_progress: { bg: brand.amber, color: brand.amberText, label: t('In Progress', 'قيد التنفيذ') },
      completed: { bg: brand.green, color: brand.greenText, label: t('Completed', 'مكتمل') },
      cancelled: { bg: brand.red, color: brand.redText, label: t('Cancelled', 'ملغي') },
    };
    const s = m[status] || m.assigned;
    return <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{s.label}</span>;
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: brand.textPrimary, margin: 0 }}>
            {t('Resource Assignments', 'تعيينات الموارد')}
          </h1>
          <p style={{ fontSize: 14, color: brand.textSecondary, marginTop: 4 }}>
            {t('Assign trainings, certifications, mentors, and coaches to employees', 'تعيين التدريب والشهادات والمرشدين والمدربين للموظفين')}
          </p>
        </div>
        {isManager && (
          <button
            onClick={() => setShowAssignModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
              background: brand.primary, color: brand.white, border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Plus size={16} /> {t('Assign Resource', 'تعيين مورد')}
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          style={{
            padding: '6px 12px', borderRadius: 8, border: `1px solid ${brand.border}`,
            fontSize: 12, color: brand.textPrimary, background: brand.white, cursor: 'pointer',
          }}
        >
          <option value="">{t('All Types', 'كل الأنواع')}</option>
          {RESOURCE_TYPES.map(rt => (
            <option key={rt.value} value={rt.value}>{rt.icon} {isRTL ? rt.labelAr : rt.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            padding: '6px 12px', borderRadius: 8, border: `1px solid ${brand.border}`,
            fontSize: 12, color: brand.textPrimary, background: brand.white, cursor: 'pointer',
          }}
        >
          <option value="">{t('All Statuses', 'كل الحالات')}</option>
          <option value="assigned">{t('Assigned', 'معين')}</option>
          <option value="in_progress">{t('In Progress', 'قيد التنفيذ')}</option>
          <option value="completed">{t('Completed', 'مكتمل')}</option>
          <option value="cancelled">{t('Cancelled', 'ملغي')}</option>
        </select>
      </div>

      {/* Resource List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} /></div>
      ) : resources.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: brand.textSecondary }}>
          <BookOpen size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>{t('No resources assigned yet', 'لم يتم تعيين موارد بعد')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {resources.map(r => {
            const typeInfo = RESOURCE_TYPES.find(rt => rt.value === r.resource_type) || RESOURCE_TYPES[0];
            return (
              <div key={r.id} style={{
                background: brand.white, borderRadius: 10, border: `1px solid ${brand.border}`,
                padding: 14, display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>{typeInfo.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{r.resource_name}</h4>
                    {statusBadge(r.status)}
                  </div>
                  <div style={{ fontSize: 12, color: brand.textSecondary, marginTop: 2 }}>
                    {t('Assigned to', 'معين إلى')} <strong>{r.employee_name}</strong>
                    {r.assigned_by_name && <span> · {t('by', 'بواسطة')} {r.assigned_by_name}</span>}
                  </div>
                  {r.due_date && (
                    <div style={{ fontSize: 11, color: brand.textSecondary, marginTop: 2 }}>
                      {t('Due', 'الاستحقاق')}: {new Date(r.due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {r.status === 'assigned' && (
                    <button onClick={() => updateStatus(r.id, 'in_progress')}
                      style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${brand.border}`, background: brand.white, color: brand.amberText, fontSize: 11, cursor: 'pointer' }}>
                      {t('Start', 'بدء')}
                    </button>
                  )}
                  {r.status === 'in_progress' && (
                    <button onClick={() => updateStatus(r.id, 'completed')}
                      style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${brand.border}`, background: brand.white, color: brand.greenText, fontSize: 11, cursor: 'pointer' }}>
                      {t('Complete', 'إكمال')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign Resource Modal */}
      {isManager && showAssignModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setShowAssignModal(false)}>
          <div style={{
            background: brand.white, borderRadius: 14, width: 480, maxHeight: '80vh', overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: `1px solid ${brand.border}`,
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>
                {t('Assign Resource', 'تعيين مورد')}
              </h3>
              <button onClick={() => setShowAssignModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} style={{ color: brand.textSecondary }} />
              </button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Employee Select */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: brand.textPrimary, marginBottom: 4, display: 'block' }}>
                  {t('Employee', 'الموظف')} *
                </label>
                <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13 }}>
                  <option value="">{t('Select employee...', 'اختر الموظف...')}</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select>
              </div>
              {/* Type */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: brand.textPrimary, marginBottom: 4, display: 'block' }}>
                  {t('Resource Type', 'نوع المورد')} *
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {RESOURCE_TYPES.map(rt => (
                    <button key={rt.value}
                      onClick={() => setForm({ ...form, resource_type: rt.value })}
                      style={{
                        padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
                        border: `1px solid ${form.resource_type === rt.value ? brand.primary : brand.border}`,
                        background: form.resource_type === rt.value ? brand.primarySurface : brand.white,
                        color: form.resource_type === rt.value ? brand.primary : brand.textSecondary,
                        fontSize: 12, fontWeight: 500,
                      }}>
                      {rt.icon} {isRTL ? rt.labelAr : rt.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Name */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: brand.textPrimary, marginBottom: 4, display: 'block' }}>
                  {t('Resource Name', 'اسم المورد')} *
                </label>
                <input value={form.resource_name} onChange={e => setForm({ ...form, resource_name: e.target.value })}
                  placeholder={t('e.g. Leadership Essentials Program', 'مثال: برنامج أساسيات القيادة')}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              {/* Due Date & Priority */}
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: brand.textPrimary, marginBottom: 4, display: 'block' }}>
                    {t('Due Date', 'الاستحقاق')}
                  </label>
                  <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: brand.textPrimary, marginBottom: 4, display: 'block' }}>
                    {t('Priority', 'الأولوية')}
                  </label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13 }}>
                    <option value="low">{t('Low', 'منخفض')}</option>
                    <option value="normal">{t('Normal', 'عادي')}</option>
                    <option value="high">{t('High', 'عالي')}</option>
                    <option value="urgent">{t('Urgent', 'عاجل')}</option>
                  </select>
                </div>
              </div>
              {/* Notes */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: brand.textPrimary, marginBottom: 4, display: 'block' }}>
                  {t('Notes', 'ملاحظات')}
                </label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={2} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${brand.border}`, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              {/* Submit */}
              <button
                onClick={assignResource}
                disabled={!form.employee_id || !form.resource_name}
                style={{
                  padding: '10px 20px', background: brand.primary, color: brand.white,
                  border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  opacity: (!form.employee_id || !form.resource_name) ? 0.5 : 1,
                }}
              >
                {t('Assign Resource', 'تعيين المورد')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceAssignment;
