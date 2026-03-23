import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { restClient } from '@/utils/api';
import {
  Users, Search, UserPlus, X, Loader2, Mail, Phone,
  Briefcase, ChevronDown, CheckCircle
} from 'lucide-react';

const brand = {
  primary: '#0D9488', primarySurface: '#F0FDFA', border: '#E5E7EB',
  textPrimary: '#111827', textSecondary: '#6B7280', white: '#fff',
  green: '#DCFCE7', greenText: '#166534', amber: '#FEF3C7', amberText: '#92400E',
  red: '#FEE2E2', redText: '#991B1B',
};

interface WorkspaceContext { workspace: any; companyId: string; userRole: string; isManager: boolean; }

const EmployeeManager: React.FC = () => {
  const { companyId, isManager } = useOutletContext<WorkspaceContext>();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;

  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [statusFilter, setStatusFilter] = useState('active');

  const loadEmployees = async () => {
    try {
      const res = await restClient.get(`/api/workspace/${companyId}/employees?status=${statusFilter}`);
      setEmployees((res as any).data.employees || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadEmployees(); }, [companyId, statusFilter]);

  const searchCandidates = async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await restClient.get(`/api/workspace/${companyId}/search-candidates?q=${encodeURIComponent(q)}`);
      setSearchResults((res as any).data.candidates || []);
    } catch (err) { console.error(err); }
    finally { setSearching(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => searchCandidates(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const addEmployee = async (userId: number) => {
    try {
      await restClient.post(`/api/workspace/${companyId}/employees`, {
        user_id: userId, employment_type: 'full_time', hired_via: 'platform',
      });
      setShowAddModal(false); setSearchQuery(''); setSearchResults([]);
      loadEmployees();
    } catch (err) { console.error(err); }
  };

  const removeEmployee = async (userId: number) => {
    if (!confirm(t('Are you sure you want to remove this employee?', 'هل أنت متأكد أنك تريد إزالة هذا الموظف؟'))) return;
    try {
      await restClient.delete(`/api/workspace/${companyId}/employees/${userId}`);
      loadEmployees();
    } catch (err) { console.error(err); }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, any> = {
      active: { bg: brand.green, color: brand.greenText, label: t('Active', 'نشط') },
      on_leave: { bg: brand.amber, color: brand.amberText, label: t('On Leave', 'إجازة') },
      terminated: { bg: brand.red, color: brand.redText, label: t('Terminated', 'منتهي') },
    };
    const s = styles[status] || styles.active;
    return (
      <span style={{
        background: s.bg, color: s.color, padding: '3px 10px',
        borderRadius: 99, fontSize: 11, fontWeight: 600,
      }}>
        {s.label}
      </span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: brand.textPrimary, margin: 0 }}>
            {t('Employee Management', 'إدارة الموظفين')}
          </h1>
          <p style={{ fontSize: 14, color: brand.textSecondary, marginTop: 4 }}>
            {t('Manage your recruited Emirati employees', 'إدارة الموظفين الإماراتيين المعينين')}
          </p>
        </div>
        {isManager && (
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
              background: brand.primary, color: brand.white, border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <UserPlus size={16} /> {t('Add Employee', 'إضافة موظف')}
          </button>
        )}
      </div>

      {/* Status Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['active', 'on_leave', 'terminated', 'all'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: '6px 14px', borderRadius: 20, border: `1px solid ${brand.border}`,
              background: statusFilter === s ? brand.primary : brand.white,
              color: statusFilter === s ? brand.white : brand.textSecondary,
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}
          >
            {t(s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' '), s === 'all' ? 'الكل' : s === 'active' ? 'نشط' : s === 'on_leave' ? 'إجازة' : 'منتهي')}
          </button>
        ))}
      </div>

      {/* Employee List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} /></div>
      ) : employees.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: brand.textSecondary }}>
          <Users size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>{t('No employees found', 'لم يتم العثور على موظفين')}</p>
          {isManager && (
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                marginTop: 12, padding: '10px 20px', background: brand.primary,
                color: brand.white, border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer',
              }}
            >
              {t('Add Your First Employee', 'أضف أول موظف')}
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {employees.map(emp => (
            <div key={emp.id} style={{
              background: brand.white, borderRadius: 10, border: `1px solid ${brand.border}`,
              padding: 16, display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', background: brand.primarySurface,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: brand.primary, fontWeight: 700, fontSize: 16, flexShrink: 0,
              }}>
                {(emp.full_name || '?')[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>
                    {emp.full_name || 'Employee'}
                  </h4>
                  {statusBadge(emp.status)}
                </div>
                <div style={{ fontSize: 12, color: brand.textSecondary, marginTop: 2 }}>
                  {emp.job_title && <span>{emp.job_title}</span>}
                  {emp.department && <span> · {emp.department}</span>}
                </div>
                <div style={{ fontSize: 11, color: brand.textSecondary, marginTop: 2 }}>
                  {emp.email && <span style={{ marginRight: 12 }}><Mail size={11} style={{ verticalAlign: 'middle' }} /> {emp.email}</span>}
                  {emp.phone && <span><Phone size={11} style={{ verticalAlign: 'middle' }} /> {emp.phone}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: brand.textSecondary }}>
                  {emp.assigned_resources || 0} {t('resources', 'موارد')}
                </span>
                {isManager && emp.status === 'active' && (
                  <button
                    onClick={() => removeEmployee(emp.user_id)}
                    style={{
                      padding: '5px 10px', borderRadius: 6, border: `1px solid ${brand.border}`,
                      background: brand.white, color: brand.redText, fontSize: 11, cursor: 'pointer',
                    }}
                  >
                    {t('Remove', 'إزالة')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Employee Modal */}
      {isManager && showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setShowAddModal(false)}>
          <div style={{
            background: brand.white, borderRadius: 14, width: 480, maxHeight: '80vh',
            overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: `1px solid ${brand.border}`,
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>
                {t('Add Employee', 'إضافة موظف')}
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} style={{ color: brand.textSecondary }} />
              </button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                background: '#F9FAFB', borderRadius: 8, border: `1px solid ${brand.border}`,
              }}>
                <Search size={16} style={{ color: brand.textSecondary }} />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t('Search by name or email...', 'البحث بالاسم أو البريد الإلكتروني...')}
                  style={{
                    flex: 1, border: 'none', background: 'none', outline: 'none',
                    fontSize: 13, color: brand.textPrimary,
                  }}
                  autoFocus
                />
                {searching && <Loader2 className="animate-spin" size={16} style={{ color: brand.primary }} />}
              </div>

              <div style={{ marginTop: 12, maxHeight: 300, overflowY: 'auto' }}>
                {searchResults.length === 0 && searchQuery.length >= 2 && !searching ? (
                  <p style={{ textAlign: 'center', color: brand.textSecondary, padding: 20, fontSize: 13 }}>
                    {t('No candidates found', 'لم يتم العثور على مرشحين')}
                  </p>
                ) : (
                  searchResults.map(c => (
                    <div key={c.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                      borderBottom: `1px solid ${brand.border}`,
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', background: brand.primarySurface,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: brand.primary, fontWeight: 700, fontSize: 13, flexShrink: 0,
                      }}>
                        {(c.full_name || '?')[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary }}>{c.full_name}</div>
                        <div style={{ fontSize: 11, color: brand.textSecondary }}>{c.email}</div>
                      </div>
                      {c.already_employee ? (
                        <span style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          fontSize: 11, color: brand.greenText, fontWeight: 600,
                        }}>
                          <CheckCircle size={14} /> {t('Already Added', 'تمت الإضافة')}
                        </span>
                      ) : (
                        <button
                          onClick={() => addEmployee(c.id)}
                          style={{
                            padding: '6px 12px', borderRadius: 6, background: brand.primary,
                            color: brand.white, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          {t('Add', 'إضافة')}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManager;
