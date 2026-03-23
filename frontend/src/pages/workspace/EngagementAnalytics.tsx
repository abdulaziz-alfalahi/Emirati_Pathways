import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { restClient } from '@/utils/api';
import {
  BarChart3, TrendingUp, AlertTriangle, Award, Loader2, User, Activity
} from 'lucide-react';

const brand = {
  primary: '#0D9488', primarySurface: '#F0FDFA', border: '#E5E7EB',
  textPrimary: '#111827', textSecondary: '#6B7280', white: '#fff',
  green: '#DCFCE7', greenText: '#166534', amber: '#FEF3C7', amberText: '#92400E',
  red: '#FEE2E2', redText: '#991B1B', blue: '#DBEAFE', blueText: '#1E40AF',
};

interface WorkspaceContext { workspace: any; companyId: string; userRole: string; isManager: boolean; }

const EngagementAnalytics: React.FC = () => {
  const { companyId } = useOutletContext<WorkspaceContext>();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await restClient.get(`/api/workspace/${companyId}/analytics/engagement`);
        setData((res as any).data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [companyId]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} /></div>;

  const summary = data?.summary || {};
  const riskColors: Record<string, { bg: string; text: string }> = {
    high: { bg: brand.red, text: brand.redText },
    medium: { bg: brand.amber, text: brand.amberText },
    low: { bg: brand.green, text: brand.greenText },
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: brand.textPrimary, margin: 0 }}>
          {t('Engagement Analytics', 'تحليلات المشاركة')}
        </h1>
        <p style={{ fontSize: 14, color: brand.textSecondary, marginTop: 4 }}>
          {t('Track employee interaction with trainings, mentors, and coaches', 'تتبع تفاعل الموظفين مع التدريب والمرشدين')}
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: t('Total Employees', 'إجمالي الموظفين'), value: summary.total_employees || 0, icon: User, color: brand.primary },
          { label: t('Avg Engagement', 'متوسط المشاركة'), value: `${summary.average_engagement_score || 0}%`, icon: Activity, color: brand.blueText },
          { label: t('Flight Risks', 'مخاطر الفقد'), value: summary.high_risk_count || 0, icon: AlertTriangle, color: brand.redText },
          { label: t('Top Score', 'أعلى نتيجة'), value: `${summary.top_performer_score || 0}%`, icon: Award, color: brand.greenText },
        ].map((card, i) => (
          <div key={i} style={{
            background: brand.white, borderRadius: 12, border: `1px solid ${brand.border}`,
            padding: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <card.icon size={16} style={{ color: card.color }} />
              <span style={{ fontSize: 12, color: brand.textSecondary }}>{card.label}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        {/* Employee Engagement Table */}
        <div style={{
          background: brand.white, borderRadius: 12, border: `1px solid ${brand.border}`,
          padding: 20, maxHeight: 500, overflowY: 'auto',
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 16px' }}>
            {t('Employee Engagement Scores', 'نتائج مشاركة الموظفين')}
          </h3>
          {(data?.employees || []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>
              <Activity size={40} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
              <p>{t('No engagement data yet', 'لا توجد بيانات مشاركة بعد')}</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px 0', textAlign: 'left', borderBottom: `2px solid ${brand.border}`, color: brand.textSecondary }}>{t('Employee', 'الموظف')}</th>
                  <th style={{ padding: '8px 0', textAlign: 'center', borderBottom: `2px solid ${brand.border}`, color: brand.textSecondary }}>{t('Score', 'النتيجة')}</th>
                  <th style={{ padding: '8px 0', textAlign: 'center', borderBottom: `2px solid ${brand.border}`, color: brand.textSecondary }}>{t('Resources', 'الموارد')}</th>
                  <th style={{ padding: '8px 0', textAlign: 'center', borderBottom: `2px solid ${brand.border}`, color: brand.textSecondary }}>{t('Risk', 'المخاطر')}</th>
                </tr>
              </thead>
              <tbody>
                {(data.employees || []).sort((a: any, b: any) => b.engagement_score - a.engagement_score).map((emp: any) => {
                  const rc = riskColors[emp.risk_level] || riskColors.low;
                  return (
                    <tr key={emp.user_id}>
                      <td style={{ padding: '10px 0', borderBottom: `1px solid ${brand.border}` }}>
                        <div style={{ fontWeight: 600, color: brand.textPrimary }}>{emp.full_name}</div>
                        <div style={{ fontSize: 11, color: brand.textSecondary }}>{emp.job_title || ''} {emp.department && `· ${emp.department}`}</div>
                      </td>
                      <td style={{ padding: '10px 0', borderBottom: `1px solid ${brand.border}`, textAlign: 'center' }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 48, height: 48, borderRadius: '50%',
                          background: `conic-gradient(${brand.primary} ${emp.engagement_score * 3.6}deg, ${brand.border} 0deg)`,
                        }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: '50%', background: brand.white,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700, color: brand.primary,
                          }}>{Math.round(emp.engagement_score)}</div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 0', borderBottom: `1px solid ${brand.border}`, textAlign: 'center', fontSize: 12 }}>
                        <span style={{ color: brand.greenText }}>{emp.completed_resources}</span>
                        <span style={{ color: brand.textSecondary }}>/{emp.total_resources}</span>
                      </td>
                      <td style={{ padding: '10px 0', borderBottom: `1px solid ${brand.border}`, textAlign: 'center' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: rc.bg, color: rc.text }}>
                          {emp.risk_level}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Sidebar: Risks + Top Performers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Flight Risks */}
          <div style={{ background: brand.white, borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <AlertTriangle size={16} style={{ color: brand.redText }} />
              <h3 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>
                {t('Flight Risks', 'مخاطر الفقد')}
              </h3>
            </div>
            {(data?.flight_risks || []).length === 0 ? (
              <p style={{ fontSize: 12, color: brand.textSecondary }}>{t('No flight risks detected', 'لا توجد مخاطر فقد')}</p>
            ) : (data.flight_risks || []).map((emp: any) => (
              <div key={emp.user_id} style={{ padding: '8px 0', borderBottom: `1px solid ${brand.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: brand.red, display: 'flex', alignItems: 'center', justifyContent: 'center', color: brand.redText, fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                  {(emp.full_name || '?')[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: brand.textPrimary }}>{emp.full_name}</div>
                  <div style={{ fontSize: 10, color: brand.textSecondary }}>{emp.job_title}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Top Performers */}
          <div style={{ background: brand.white, borderRadius: 12, border: `1px solid ${brand.border}`, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Award size={16} style={{ color: brand.greenText }} />
              <h3 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>
                {t('Top Performers', 'الأفضل أداءً')}
              </h3>
            </div>
            {(data?.top_performers || []).length === 0 ? (
              <p style={{ fontSize: 12, color: brand.textSecondary }}>{t('No data yet', 'لا توجد بيانات بعد')}</p>
            ) : (data.top_performers || []).map((emp: any, i: number) => (
              <div key={emp.user_id} style={{ padding: '8px 0', borderBottom: `1px solid ${brand.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: i === 0 ? '#FEF3C7' : brand.primarySurface,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: i === 0 ? '#92400E' : brand.primary, fontWeight: 700, fontSize: 12, flexShrink: 0,
                }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: brand.textPrimary }}>{emp.full_name}</div>
                  <div style={{ fontSize: 10, color: brand.textSecondary }}>{emp.job_title}</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: brand.primary }}>{Math.round(emp.engagement_score)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngagementAnalytics;
