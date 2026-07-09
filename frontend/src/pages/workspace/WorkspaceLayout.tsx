import React, { useState, useEffect } from 'react';
import { useParams, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { restClient } from '@/utils/api';
import {
  Building2, Users, BookOpen, Briefcase, Settings, BarChart3,
  Loader2, ChevronRight, LogOut, Target, FileText, Upload,
  Activity, MessageSquare, FolderOpen
} from 'lucide-react';

const brand = {
  primary: '#0D9488', primarySurface: '#F0FDFA', border: '#E5E7EB',
  textPrimary: '#111827', textSecondary: '#6B7280', white: '#fff',
};

const MANAGER_ROLES = ['employer_admin', 'employer_admin', 'recruiter', 'recruiter', 'growth_operator', 'employer_relations', 'admin', 'admin'];

const allNavItems = [
  { path: 'dashboard', icon: BarChart3, labelEn: 'Dashboard', labelAr: 'لوحة القيادة', managerOnly: false },
  { path: 'employees', icon: Users, labelEn: 'Employees', labelAr: 'الموظفون', managerOnly: false },
  { path: 'resources', icon: BookOpen, labelEn: 'Resources', labelAr: 'الموارد', managerOnly: false },
  { path: '_sep1', icon: null as any, labelEn: '', labelAr: '', managerOnly: true, separator: true },
  { path: 'emiratisation', icon: Target, labelEn: 'Emiratisation', labelAr: 'التوطين', managerOnly: true },
  { path: 'analytics', icon: Activity, labelEn: 'Engagement', labelAr: 'المشاركة', managerOnly: true },
  { path: 'mentor-reports', icon: MessageSquare, labelEn: 'Mentor Reports', labelAr: 'تقارير المرشدين', managerOnly: false },
  { path: '_sep2', icon: null as any, labelEn: '', labelAr: '', managerOnly: true, separator: true },
  { path: 'documents', icon: FileText, labelEn: 'Documents', labelAr: 'المستندات', managerOnly: true },
  { path: 'csv-import', icon: Upload, labelEn: 'CSV Import', labelAr: 'استيراد CSV', managerOnly: true },
  { path: 'vault', icon: FolderOpen, labelEn: 'Resource Vault', labelAr: 'خزنة الموارد', managerOnly: false },
  { path: '_sep3', icon: null as any, labelEn: '', labelAr: '', managerOnly: true, separator: true },
  { path: 'jobs', icon: Briefcase, labelEn: 'Jobs', labelAr: 'الوظائف', managerOnly: true },
  { path: 'settings', icon: Settings, labelEn: 'Settings', labelAr: 'الإعدادات', managerOnly: true },
];

const WorkspaceLayout: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Determine user role for RBAC
  const getUserRole = (): string => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u.role || u.user_type || 'candidate';
    } catch { return 'candidate'; }
  };
  const userRole = getUserRole();
  const isManager = MANAGER_ROLES.includes(userRole);
  const navItems = allNavItems.filter(item => !item.managerOnly || isManager);

  useEffect(() => {
    async function load() {
      try {
        const res = await restClient.get(`/api/workspace/${companyId}`);
        setWorkspace((res as any).data.workspace);
      } catch (err) { console.error('Workspace load error:', err); }
      finally { setLoading(false); }
    }
    if (companyId) load();
  }, [companyId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F9FAFB' }}>
        <Loader2 className="animate-spin" size={40} style={{ color: brand.primary }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F9FAFB', direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Sidebar */}
      <aside style={{
        width: 260, background: brand.white, borderRight: `1px solid ${brand.border}`,
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        {/* Company Header */}
        <div style={{ padding: '20px 16px', borderBottom: `1px solid ${brand.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10, background: brand.primarySurface,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Building2 size={22} style={{ color: brand.primary }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: brand.textPrimary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {workspace?.company_name || 'Workspace'}
              </h2>
              <span style={{ fontSize: 11, color: brand.textSecondary }}>{workspace?.industry || ''}</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 8px' }}>
          {navItems.map(item => (
            (item as any).separator ? (
              <div key={item.path} style={{ height: 1, background: brand.border, margin: '8px 12px' }} />
            ) : (
            <NavLink
              key={item.path}
              to={`/workspace/${companyId}/${item.path}`}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8, marginBottom: 2,
                textDecoration: 'none', fontSize: 13, fontWeight: isActive ? 600 : 500,
                color: isActive ? brand.primary : brand.textSecondary,
                background: isActive ? brand.primarySurface : 'transparent',
                transition: 'all 0.15s',
              })}
            >
              <item.icon size={18} />
              {t(item.labelEn, item.labelAr)}
            </NavLink>
            )
          ))}
        </nav>

        {/* Back to Platform */}
        <div style={{ padding: '12px 8px', borderTop: `1px solid ${brand.border}` }}>
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'transparent', color: brand.textSecondary, fontSize: 13,
            }}
          >
            <LogOut size={16} />
            {t('Back to Platform', 'العودة للمنصة')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
        <Outlet context={{ workspace, companyId, userRole, isManager }} />
      </main>
    </div>
  );
};

export default WorkspaceLayout;
