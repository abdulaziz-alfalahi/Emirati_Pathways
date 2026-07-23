import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { restClient } from '@/utils/api';
import {
  Users, BookOpen, Briefcase, TrendingUp, Award, Loader2,
  UserCheck, Clock, AlertTriangle
} from 'lucide-react';
import AiAssistPanel from '@/components/ai/AiAssistPanel';

const brand = {
  primary: '#0D9488', primarySurface: '#F0FDFA', border: '#E5E7EB',
  textPrimary: '#111827', textSecondary: '#6B7280', white: '#fff',
  green: '#DCFCE7', greenText: '#166534', amber: '#FEF3C7', amberText: '#92400E',
  blue: '#DBEAFE', blueText: '#1E40AF',
};

interface WorkspaceContext {
  workspace: any;
  companyId: string;
  userRole: string;
  isManager: boolean;
}

const WorkspaceDashboard: React.FC = () => {
  const { workspace, companyId, isManager } = useOutletContext<WorkspaceContext>();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await restClient.get(`/api/workspace/${companyId}/stats`);
        setStats((res as any).data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    if (companyId) load();
  }, [companyId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} />
      </div>
    );
  }

  const statCards = [
    {
      icon: Users, label: t('Active Employees', 'الموظفون النشطون'),
      value: stats?.employees?.active_employees || 0,
      bg: brand.primarySurface, color: brand.primary,
    },
    {
      icon: BookOpen, label: t('Assigned Resources', 'الموارد المعينة'),
      value: Object.values(stats?.resources || {}).reduce((sum: number, r: any) => sum + (r.total || 0), 0),
      bg: brand.blue, color: brand.blueText,
    },
    {
      icon: Briefcase, label: t('Active Jobs', 'الوظائف النشطة'),
      value: stats?.jobs?.published || 0,
      bg: brand.green, color: brand.greenText,
    },
    {
      icon: TrendingUp, label: t('Emiratization %', 'نسبة التوطين'),
      value: `${stats?.emiratization_percentage || 0}%`,
      bg: brand.amber, color: brand.amberText,
    },
  ];

  const resourceTypes = [
    { type: 'training', icon: '📚', label: t('Trainings', 'التدريب') },
    { type: 'certification', icon: '🎖️', label: t('Certifications', 'الشهادات') },
    { type: 'mentor', icon: '🧑‍🏫', label: t('Mentors', 'المرشدون') },
    { type: 'coach', icon: '🎯', label: t('Coaches', 'المدربون') },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: brand.textPrimary, margin: 0 }}>
          {t('Workspace Dashboard', 'لوحة مساحة العمل')}
        </h1>
        <p style={{ fontSize: 14, color: brand.textSecondary, marginTop: 4 }}>
          {workspace?.company_name} — {t('Overview of your company workspace', 'نظرة عامة على مساحة عمل شركتك')}
        </p>
      </div>

      {/* AI hiring insights — aggregate workspace stats only, no personal data */}
      <AiAssistPanel
        feature="hiring_insights"
        title="AI hiring insights"
        titleAr="رؤى التوظيف بالذكاء الاصطناعي"
        getContext={() => ({
          open_roles: stats?.jobs?.published ?? 0,
          team_size: stats?.employees?.active_employees ?? 0,
          sector: workspace?.industry || '',
          emiratization_target: workspace?.workspace_settings?.emiratization_target ?? stats?.emiratization_percentage ?? 0,
        })}
        className="mb-6"
      />

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        {statCards.map((card, i) => (
          <div key={i} style={{
            background: brand.white, borderRadius: 12, border: `1px solid ${brand.border}`,
            padding: 18, display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: 10, background: card.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <card.icon size={22} style={{ color: card.color }} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: brand.textPrimary }}>{card.value}</div>
              <div style={{ fontSize: 12, color: brand.textSecondary }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Resource Breakdown */}
      <div style={{ background: brand.white, borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, marginBottom: 14 }}>
          {t('Resource Assignments', 'تعيينات الموارد')}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {resourceTypes.map(rt => {
            const data = stats?.resources?.[rt.type] || { total: 0, completed: 0, in_progress: 0, assigned: 0 };
            return (
              <div key={rt.type} style={{
                borderRadius: 10, border: `1px solid ${brand.border}`, padding: 14,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{rt.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary }}>{rt.label}</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: brand.primary }}>{data.total}</div>
                <div style={{ fontSize: 11, color: brand.textSecondary, marginTop: 4 }}>
                  <span style={{ color: brand.greenText }}>{data.completed}</span> {t('done', 'مكتمل')} · <span style={{ color: brand.amberText }}>{data.in_progress}</span> {t('in progress', 'قيد التنفيذ')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions — Manager Only */}
      {isManager && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { label: t('Add Employee', 'إضافة موظف'), icon: UserCheck, path: 'employees' },
            { label: t('Assign Training', 'تعيين تدريب'), icon: BookOpen, path: 'resources' },
            { label: t('Post a Job', 'نشر وظيفة'), icon: Briefcase, path: 'jobs' },
          ].map((action, i) => (
            <button
              key={i}
              onClick={() => navigate(`/workspace/${companyId}/${action.path}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '14px 16px', borderRadius: 10, border: `1px solid ${brand.border}`,
                background: brand.white, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: brand.primary,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = brand.primarySurface)}
              onMouseLeave={e => (e.currentTarget.style.background = brand.white)}
            >
              <action.icon size={18} />
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkspaceDashboard;
