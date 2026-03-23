
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import { GraduationCap, BookOpen, Users, Award, Plus, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { restClient } from '@/utils/api';

const brand = {
  primary: '#0D9488', primarySurface: '#F0FDFA', border: '#E5E7EB',
  textPrimary: '#111827', textSecondary: '#6B7280',
  amber: '#FEF3C7', amberText: '#92400E',
};

const TrainingCenterDashboard: React.FC = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  const [profile, setProfile] = useState<any>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = user?.id || 1;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [prRes, pgRes] = await Promise.allSettled([
          restClient.get(`/api/training-center/profile?user_id=${userId}`),
          restClient.get(`/api/training-center/programs?user_id=${userId}`),
        ]);
        if (cancelled) return;
        if (prRes.status === 'fulfilled') setProfile((prRes.value as any).data.profile);
        if (pgRes.status === 'fulfilled') setPrograms((pgRes.value as any).data.programs || []);
      } catch (err) { console.error(err); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const programsTab = (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>{t('My Programs', 'برامجي')}</h2>
      <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>{t('Manage your training programs and issue certificates.', 'إدارة برامجك التدريبية وإصدار الشهادات.')}</p>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} /></div>
      ) : programs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>
          <BookOpen size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>{t('No programs yet — add your first training program.', 'لا توجد برامج بعد — أضف أول برنامج تدريبي.')}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
          {programs.map((p, i) => (
            <div key={i} className="ep-card" style={{ background: '#fff', borderRadius: 12, border: `1px solid ${brand.border}`, padding: 18, transition: 'box-shadow .2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={20} style={{ color: brand.primary }} />
                </div>
                <span style={{ background: '#F3F4F6', color: brand.textSecondary, fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 4 }}>{p.category}</span>
              </div>
              <h4 style={{ fontSize: 15, fontWeight: 600, color: brand.textPrimary, margin: '0 0 4px' }}>{p.title_en || p.title}</h4>
              <div style={{ fontSize: 12, color: brand.textSecondary, marginBottom: 12 }}>{p.level} · {p.enrolled_count || 0} students</div>
              <button style={{ background: brand.amber, color: brand.amberText, border: 'none', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Award size={12} /> {t('Issue Certificate', 'إصدار شهادة')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const totalEnrollments = programs.reduce((sum, p) => sum + (p.enrolled_count || 0), 0);

  const stats = [
    { value: `${programs.length}`, label: t('Programs', 'برامج'), icon: BookOpen },
    { value: `${totalEnrollments}`, label: t('Enrollments', 'مسجلون'), icon: Users },
    { value: '0', label: t('Certificates', 'شهادات'), icon: Award },
    { value: profile?.center_name ? '1' : '0', label: t('Centers', 'مراكز'), icon: GraduationCap },
  ];

  const tabs = [
    { id: 'programs', label: t('Programs', 'البرامج'), icon: <BookOpen className="h-4 w-4" />, content: programsTab },
  ];

  return (
    <EducationPathwayLayout
      title={t('Training Center Portal', 'بوابة مركز التدريب')}
      description={t('Manage training programs, track enrollments, and issue certificates with automatic stamp creation', 'إدارة البرامج التدريبية وتتبع المسجلين وإصدار الشهادات')}
      icon={<GraduationCap className="h-6 w-6" />}
      stats={stats}
      tabs={tabs}
      defaultTab="programs"
    />
  );
};
export default TrainingCenterDashboard;
