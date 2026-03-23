import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { restClient } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import {
  Building2, BookOpen, Award, Users, Target, Loader2,
  Clock, CheckCircle, AlertCircle, ChevronRight
} from 'lucide-react';

const brand = {
  primary: '#0D9488', primarySurface: '#F0FDFA', border: '#E5E7EB',
  textPrimary: '#111827', textSecondary: '#6B7280', white: '#fff',
  green: '#DCFCE7', greenText: '#166534', amber: '#FEF3C7', amberText: '#92400E',
  blue: '#DBEAFE', blueText: '#1E40AF',
};

const RESOURCE_ICONS: Record<string, string> = {
  training: '📚', certification: '🎖️', mentor: '🧑‍🏫', coach: '🎯',
};

/**
 * MyCompanyView — shown inside the Candidate Dashboard.
 * Displays the Emirati employee's company-assigned resources,
 * company info, and progress summary.
 */
const MyCompanyView: React.FC = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await restClient.get(`/api/workspace/me/company-view?user_id=${user?.id || 1}`);
        setData((res as any).data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} />
      </div>
    );
  }

  if (!data?.employed) {
    return (
      <div style={{
        background: brand.white, borderRadius: 12, border: `1px solid ${brand.border}`,
        padding: 32, textAlign: 'center',
      }}>
        <Building2 size={48} style={{ color: brand.textSecondary, opacity: 0.3, margin: '0 auto 12px' }} />
        <h3 style={{ fontSize: 16, fontWeight: 600, color: brand.textPrimary, margin: '0 0 8px' }}>
          {t('No Company Workspace', 'لا توجد مساحة عمل للشركة')}
        </h3>
        <p style={{ fontSize: 13, color: brand.textSecondary, maxWidth: 360, margin: '0 auto' }}>
          {t(
            'You are not currently linked to any company workspace. When a company recruits you through the platform, your workspace access will appear here.',
            'لست مرتبطاً حالياً بأي مساحة عمل. عندما تقوم شركة بتوظيفك عبر المنصة، سيظهر وصول مساحة العمل هنا.'
          )}
        </p>
      </div>
    );
  }

  const statusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle size={16} style={{ color: brand.greenText }} />;
    if (status === 'in_progress') return <Clock size={16} style={{ color: brand.amberText }} />;
    return <AlertCircle size={16} style={{ color: brand.blueText }} />;
  };

  const statusLabel = (status: string) => {
    const labels: Record<string, [string, string]> = {
      assigned: ['Assigned', 'معين'],
      in_progress: ['In Progress', 'قيد التنفيذ'],
      completed: ['Completed', 'مكتمل'],
    };
    const [en, ar] = labels[status] || ['Unknown', 'غير معروف'];
    return t(en, ar);
  };

  return (
    <div>
      {/* Company Cards */}
      {data.companies.map((company: any, idx: number) => (
        <div key={idx} style={{
          background: brand.white, borderRadius: 12, border: `1px solid ${brand.border}`,
          padding: 20, marginBottom: 16, cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
          onClick={() => navigate(`/workspace/${company.company_id}/dashboard`)}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,148,136,0.12)'; e.currentTarget.style.borderColor = brand.primary; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = brand.border; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 10, background: brand.primarySurface,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Building2 size={22} style={{ color: brand.primary }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: brand.textPrimary, margin: 0 }}>
                {company.company_name}
              </h3>
              <div style={{ fontSize: 12, color: brand.textSecondary }}>
                {company.job_title && <span>{company.job_title}</span>}
                {company.department && <span> · {company.department}</span>}
                {company.industry && <span> · {company.industry}</span>}
              </div>
            </div>
            <ChevronRight size={20} style={{ color: brand.textSecondary, flexShrink: 0 }} />
          </div>

          {/* Summary Stats */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
            {Object.entries(data.summary.by_type || {}).filter(([_, v]) => (v as number) > 0).map(([type, count]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 16 }}>{RESOURCE_ICONS[type] || '📋'}</span>
                <span style={{ fontSize: 12, color: brand.textSecondary }}>
                  <strong style={{ color: brand.textPrimary }}>{count as number}</strong> {t(type, type)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Resources */}
      {data.resources.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, marginBottom: 10 }}>
            {t('My Assigned Resources', 'الموارد المعينة لي')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.resources.map((r: any, i: number) => (
              <div key={i} style={{
                background: brand.white, borderRadius: 10, border: `1px solid ${brand.border}`,
                padding: 14, display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{RESOURCE_ICONS[r.resource_type] || '📋'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>
                      {r.resource_name}
                    </h4>
                    {statusIcon(r.status)}
                  </div>
                  {r.resource_description && (
                    <p style={{ fontSize: 11, color: brand.textSecondary, margin: '2px 0 0' }}>{r.resource_description}</p>
                  )}
                  <div style={{ fontSize: 11, color: brand.textSecondary, marginTop: 2 }}>
                    {r.company_name && <span>{r.company_name} · </span>}
                    {statusLabel(r.status)}
                    {r.due_date && <span> · {t('Due', 'الاستحقاق')}: {new Date(r.due_date).toLocaleDateString()}</span>}
                  </div>
                </div>
                {r.progress_percentage > 0 && r.progress_percentage < 100 && (
                  <div style={{ width: 60, textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: brand.primary }}>{r.progress_percentage}%</div>
                    <div style={{
                      height: 4, borderRadius: 2, background: brand.border, marginTop: 4,
                    }}>
                      <div style={{
                        width: `${r.progress_percentage}%`, height: '100%',
                        borderRadius: 2, background: brand.primary,
                      }} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCompanyView;
