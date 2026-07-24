
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import { Briefcase, Users, ClipboardList, Building2, Percent, Loader2, Handshake } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { restClient } from '@/utils/api';
import CoordinatorInternshipEngagement from '@/components/internship/CoordinatorInternshipEngagement';

const brand = {
  primary: '#0D9488', primarySurface: '#F0FDFA', border: '#E5E7EB',
  textPrimary: '#111827', textSecondary: '#6B7280',
  amber: '#FEF3C7', amberText: '#92400E', green: '#DCFCE7', greenText: '#166534',
  blue: '#DBEAFE', blueText: '#1E40AF', red: '#FEE2E2', redText: '#991B1B',
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  active: { bg: brand.green, color: brand.greenText },
  pending: { bg: brand.amber, color: brand.amberText },
  completed: { bg: brand.blue, color: brand.blueText },
  cancelled: { bg: brand.red, color: brand.redText },
};

const InternshipCoordinatorDashboard: React.FC = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  const [programs, setPrograms] = useState<any[]>([]);
  const [placements, setPlacements] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const coordId = user?.id || 1;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [pRes, plRes, anRes] = await Promise.allSettled([
          restClient.get(`/api/internship-coord/programs?coordinator_id=${coordId}`),
          restClient.get(`/api/internship-coord/placements?coordinator_id=${coordId}`),
          restClient.get(`/api/internship-coord/analytics?coordinator_id=${coordId}`),
        ]);
        if (cancelled) return;
        if (pRes.status === 'fulfilled') setPrograms((pRes.value as any).data.programs || []);
        if (plRes.status === 'fulfilled') setPlacements((plRes.value as any).data.placements || []);
        if (anRes.status === 'fulfilled') setAnalytics((anRes.value as any).data);
      } catch (err) { console.error(err); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const programsTab = (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>{t('Internship Programs', 'برامج التدريب العملي')}</h2>
      <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>{t('Manage internship programs, track placements, and evaluate outcomes.', 'إدارة برامج التدريب العملي وتتبع التعيينات وتقييم النتائج.')}</p>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} /></div>
      ) : programs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}><p>{t('No programs yet.', 'لا توجد برامج بعد.')}</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
          {programs.map((p, i) => {
            const ss = STATUS_STYLES[p.status] || { bg: '#F3F4F6', color: brand.textSecondary };
            return (
              <div key={i} className="ep-card" style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, transition: 'box-shadow .2s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Briefcase size={20} style={{ color: brand.primary }} />
                  </div>
                  <span style={{ background: ss.bg, color: ss.color, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99 }}>{p.status}</span>
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{p.title}</h4>
                <div style={{ fontSize: 12, color: brand.textSecondary }}>{p.institution} · {p.season} · {p.placement_count} placements</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const placementsTab = (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>{t('Placements', 'التعيينات')}</h2>
      <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>{t('Track student placements across all programs.', 'تتبع تعيينات الطلاب عبر جميع البرامج.')}</p>
      {placements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}><p>{t('No placements yet.', 'لا توجد تعيينات بعد.')}</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {placements.map((p, i) => {
            const ss = STATUS_STYLES[p.status] || { bg: '#F3F4F6', color: brand.textSecondary };
            return (
              <div key={i} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{p.student_name || 'Student'}</h4>
                  <div style={{ fontSize: 12, color: brand.textSecondary }}>{p.position_title} · {p.program_title}</div>
                </div>
                <span style={{ background: ss.bg, color: ss.color, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99 }}>{p.status}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const stats = [
    { value: `${analytics?.total_programs || programs.length}`, label: t('Programs', 'برامج'), icon: ClipboardList },
    { value: `${analytics?.total_placements || placements.length}`, label: t('Placements', 'تعيينات'), icon: Users },
    { value: `${analytics?.placement_rate || 0}%`, label: t('Rate', 'نسبة'), icon: Percent },
    { value: `${analytics?.status_breakdown?.active || 0}`, label: t('Active', 'نشط'), icon: Building2 },
  ];

  const tabs = [
    { id: 'programs', label: t('Programs', 'البرامج'), icon: <ClipboardList className="h-4 w-4" />, content: programsTab },
    { id: 'placements', label: t('Placements', 'التعيينات'), icon: <Users className="h-4 w-4" />, content: placementsTab },
    { id: 'engagement', label: t('Assign & Track', 'الإسناد والمتابعة'), icon: <Handshake className="h-4 w-4" />, content: <CoordinatorInternshipEngagement /> },
  ];

  return (
    <EducationPathwayLayout
      title={t('Internship Coordinator', 'منسق التدريب العملي')}
      description={t('Manage internship programs, track placements, and evaluate student outcomes', 'إدارة برامج التدريب العملي وتتبع التعيينات وتقييم نتائج الطلاب')}
      icon={<Briefcase className="h-6 w-6" />}
      stats={stats}
      tabs={tabs}
      defaultTab="programs"
    />
  );
};
export default InternshipCoordinatorDashboard;
