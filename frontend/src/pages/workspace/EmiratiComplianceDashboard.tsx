import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { restClient } from '@/utils/api';
import {
  Target, TrendingUp, Users, DollarSign, Loader2,
  ArrowUp, ArrowDown, Minus, Calendar, AlertTriangle, CheckCircle
} from 'lucide-react';

const brand = {
  primary: '#0D9488', primarySurface: '#F0FDFA', border: '#E5E7EB',
  textPrimary: '#111827', textSecondary: '#6B7280', white: '#fff',
  green: '#DCFCE7', greenText: '#166534', amber: '#FEF3C7', amberText: '#92400E',
  red: '#FEE2E2', redText: '#991B1B', blue: '#DBEAFE', blueText: '#1E40AF',
};

interface WorkspaceContext { workspace: any; companyId: string; userRole: string; isManager: boolean; }

const EmiratiComplianceDashboard: React.FC = () => {
  const { companyId } = useOutletContext<WorkspaceContext>();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await restClient.get(`/api/workspace/${companyId}/emiratization`);
        setData((res as any).data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [companyId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} />
      </div>
    );
  }

  const hc = data?.headcount || {};
  const salary = data?.salary_support || {};
  const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
    above_target: { bg: brand.green, text: brand.greenText, icon: CheckCircle },
    near_target: { bg: brand.amber, text: brand.amberText, icon: Minus },
    below_target: { bg: brand.red, text: brand.redText, icon: AlertTriangle },
  };
  const sc = statusColors[hc.status] || statusColors.near_target;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: brand.textPrimary, margin: 0 }}>
          {t('Emiratisation & Compliance', 'التوطين والامتثال')}
        </h1>
        <p style={{ fontSize: 14, color: brand.textSecondary, marginTop: 4 }}>
          {t('Track Emirati headcount targets, compliance status, and salary support projections',
             'تتبع أهداف التوطين وحالة الامتثال وتوقعات دعم الرواتب')}
        </p>
      </div>

      {/* Main Gauge + Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Emiratisation Rate Gauge */}
        <div style={{
          background: brand.white, borderRadius: 12, border: `1px solid ${brand.border}`,
          padding: 24, textAlign: 'center', gridColumn: 'span 1',
        }}>
          <div style={{
            width: 120, height: 120, borderRadius: '50%', margin: '0 auto 16px',
            background: `conic-gradient(${brand.primary} ${(hc.current_percentage || 0) * 3.6}deg, ${brand.border} 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 96, height: 96, borderRadius: '50%', background: brand.white,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: brand.primary }}>
                {hc.current_percentage || 0}%
              </span>
              <span style={{ fontSize: 10, color: brand.textSecondary }}>
                {t('Current', 'الحالي')}
              </span>
            </div>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 99, background: sc.bg, color: sc.text,
            fontSize: 12, fontWeight: 600,
          }}>
            <sc.icon size={14} />
            {hc.status === 'above_target' ? t('Above Target', 'فوق الهدف') :
             hc.status === 'near_target' ? t('Near Target', 'قريب من الهدف') :
             t('Below Target', 'تحت الهدف')}
          </div>
          <p style={{ fontSize: 12, color: brand.textSecondary, marginTop: 8 }}>
            {t(`Target: ${hc.target_percentage}%`, `الهدف: ${hc.target_percentage}%`)}
          </p>
        </div>

        {/* Headcount Breakdown */}
        <div style={{
          background: brand.white, borderRadius: 12, border: `1px solid ${brand.border}`,
          padding: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Users size={18} style={{ color: brand.primary }} />
            <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>
              {t('Headcount', 'العدد الوظيفي')}
            </h3>
          </div>
          {[
            { label: t('Total Employees', 'إجمالي الموظفين'), value: hc.total, color: brand.textPrimary },
            { label: t('Emirati Nationals', 'المواطنون الإماراتيون'), value: hc.emirati, color: brand.primary },
            { label: t('Non-Emirati', 'غير إماراتي'), value: hc.non_emirati, color: brand.textSecondary },
            { label: t('Gap to Target', 'الفجوة إلى الهدف'), value: hc.gap_to_target, color: hc.gap_to_target > 0 ? brand.redText : brand.greenText },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: i < 3 ? `1px solid ${brand.border}` : 'none',
            }}>
              <span style={{ fontSize: 13, color: brand.textSecondary }}>{item.label}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: item.color }}>{item.value || 0}</span>
            </div>
          ))}
        </div>

        {/* Salary Support */}
        <div style={{
          background: brand.white, borderRadius: 12, border: `1px solid ${brand.border}`,
          padding: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <DollarSign size={18} style={{ color: brand.primary }} />
            <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>
              {t('NAFIS Salary Support', 'دعم رواتب نافس')}
            </h3>
          </div>
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 11, color: brand.textSecondary, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
              {t('Monthly per Employee', 'شهرياً لكل موظف')}
            </span>
            <div style={{ fontSize: 24, fontWeight: 700, color: brand.primary }}>
              AED {(salary.monthly_per_emirati || 0).toLocaleString()}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 11, color: brand.textSecondary, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
              {t('Current Monthly Total', 'الإجمالي الشهري الحالي')}
            </span>
            <div style={{ fontSize: 20, fontWeight: 700, color: brand.textPrimary }}>
              AED {(salary.current_monthly_total || 0).toLocaleString()}
            </div>
          </div>
          <div style={{
            background: brand.primarySurface, borderRadius: 8, padding: 12,
          }}>
            <span style={{ fontSize: 11, color: brand.textSecondary, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
              {t('Projected Annual', 'الإسقاط السنوي')}
            </span>
            <div style={{ fontSize: 20, fontWeight: 700, color: brand.primary }}>
              AED {(salary.projected_annual || 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Hiring Trend */}
      {(data?.hiring_trend || []).length > 0 && (
        <div style={{
          background: brand.white, borderRadius: 12, border: `1px solid ${brand.border}`,
          padding: 24, marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <TrendingUp size={18} style={{ color: brand.primary }} />
            <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>
              {t('Hiring Trend (Last 6 Months)', 'اتجاه التوظيف (آخر 6 أشهر)')}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto' }}>
            {(data.hiring_trend || []).map((m: any, i: number) => {
              const month = new Date(m.month).toLocaleDateString('en', { month: 'short', year: '2-digit' });
              const emiratiPct = m.hires > 0 ? Math.round(m.emirati_hires / m.hires * 100) : 0;
              return (
                <div key={i} style={{
                  flex: '1 0 100px', textAlign: 'center', padding: 12,
                  background: '#F9FAFB', borderRadius: 8,
                }}>
                  <div style={{ fontSize: 11, color: brand.textSecondary, marginBottom: 8 }}>{month}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: brand.textPrimary }}>{m.hires}</div>
                  <div style={{ fontSize: 11, color: brand.textSecondary }}>{t('hires', 'توظيف')}</div>
                  <div style={{
                    fontSize: 12, fontWeight: 600, marginTop: 6,
                    color: emiratiPct >= 50 ? brand.greenText : brand.amberText,
                  }}>
                    {m.emirati_hires} {t('Emirati', 'إماراتي')} ({emiratiPct}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quarterly Targets */}
      {(data?.targets || []).length > 0 && (
        <div style={{
          background: brand.white, borderRadius: 12, border: `1px solid ${brand.border}`,
          padding: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Calendar size={18} style={{ color: brand.primary }} />
            <h3 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>
              {t('Quarterly Targets', 'الأهداف الفصلية')}
            </h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {data.targets.map((tgt: any, i: number) => (
              <div key={i} style={{
                padding: 14, borderRadius: 8, border: `1px solid ${brand.border}`,
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: brand.textPrimary }}>
                  Q{tgt.quarter} {tgt.year}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: brand.textSecondary }}>{t('Target', 'الهدف')}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: brand.primary }}>{tgt.target_percentage}%</div>
                  </div>
                  {tgt.actual_percentage !== null && (
                    <div>
                      <div style={{ fontSize: 11, color: brand.textSecondary }}>{t('Actual', 'الفعلي')}</div>
                      <div style={{
                        fontSize: 16, fontWeight: 700,
                        color: tgt.actual_percentage >= tgt.target_percentage ? brand.greenText : brand.redText,
                      }}>{tgt.actual_percentage}%</div>
                    </div>
                  )}
                </div>
                {tgt.compliance_status && (
                  <div style={{
                    marginTop: 8, fontSize: 11, fontWeight: 600,
                    padding: '2px 8px', borderRadius: 99, display: 'inline-block',
                    background: tgt.compliance_status === 'on_track' ? brand.green : brand.amber,
                    color: tgt.compliance_status === 'on_track' ? brand.greenText : brand.amberText,
                  }}>
                    {tgt.compliance_status.replace('_', ' ')}
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

export default EmiratiComplianceDashboard;
