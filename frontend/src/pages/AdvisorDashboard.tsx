
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import { Users, Target, AlertTriangle, BookOpen, BarChart3, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { restClient } from '@/utils/api';

const brand = {
  primary: '#0D9488', primarySurface: '#F0FDFA', border: '#E5E7EB',
  textPrimary: '#111827', textSecondary: '#6B7280',
  amber: '#FEF3C7', amberText: '#92400E', green: '#DCFCE7', greenText: '#166534',
  red: '#FEE2E2', redText: '#991B1B',
};

const AdvisorDashboard: React.FC = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  const [students, setStudents] = useState<any[]>([]);
  const [atRisk, setAtRisk] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const advisorId = user?.id || 1;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [sRes, arRes, anRes] = await Promise.allSettled([
          restClient.get(`/api/advisor/students?advisor_id=${advisorId}`),
          restClient.get(`/api/advisor/at-risk?advisor_id=${advisorId}`),
          restClient.get(`/api/advisor/analytics?advisor_id=${advisorId}`),
        ]);
        if (cancelled) return;
        if (sRes.status === 'fulfilled') setStudents((sRes.value as any).data.students || []);
        if (arRes.status === 'fulfilled') setAtRisk((arRes.value as any).data.at_risk_students || []);
        if (anRes.status === 'fulfilled') setAnalytics((anRes.value as any).data);
      } catch (err) { console.error(err); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const studentsTab = (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
        {t('My Students', 'طلابي')}
      </h2>
      <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
        {t('View and manage your assigned students, track their goals, and provide interventions.', 'عرض وإدارة الطلاب المعيّنين لك وتتبع أهدافهم وتقديم التدخلات.')}
      </p>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} /></div>
      ) : students.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>
          <Users size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>{t('No students assigned yet.', 'لم يتم تعيين طلاب بعد.')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {students.map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center', color: brand.primary, fontWeight: 700, fontSize: 14 }}>
                {(s.full_name || '?')[0]}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{s.full_name || 'Student'}</h4>
                <div style={{ fontSize: 12, color: brand.textSecondary }}>{s.email}</div>
              </div>
              <span style={{
                background: s.risk_level === 'high' ? brand.red : s.risk_level === 'medium' ? brand.amber : brand.green,
                color: s.risk_level === 'high' ? brand.redText : s.risk_level === 'medium' ? brand.amberText : brand.greenText,
                fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99,
              }}>
                {s.open_goals} {t('open goals', 'أهداف مفتوحة')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const atRiskTab = (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
        {t('At-Risk Students', 'طلاب معرضون للخطر')}
      </h2>
      <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
        {t('Students with overdue or stalled goals that need immediate attention.', 'طلاب لديهم أهداف متأخرة أو متوقفة وتحتاج اهتماماً فورياً.')}
      </p>
      {atRisk.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>
          <CheckCircle size={48} style={{ margin: '0 auto 12px', opacity: 0.3, color: brand.primary }} />
          <p style={{ color: brand.primary }}>{t('No at-risk students!', 'لا يوجد طلاب معرضون للخطر!')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {atRisk.map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: brand.red, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={16} style={{ color: brand.redText }} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{s.full_name || 'Student'}</h4>
                <div style={{ fontSize: 12, color: brand.textSecondary }}>{s.overdue_goals} overdue · {s.stalled_goals} stalled</div>
              </div>
              <button style={{ background: brand.primary, color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {t('Intervene', 'تدخل')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const stats = [
    { value: `${analytics?.total_students || students.length}`, label: t('Students', 'طلاب'), icon: Users },
    { value: `${analytics?.completion_rate || 0}%`, label: t('Completion', 'إنجاز'), icon: Target },
    { value: `${atRisk.length}`, label: t('At Risk', 'معرضون'), icon: AlertTriangle },
    { value: `${analytics?.total_interventions || 0}`, label: t('Interventions', 'تدخلات'), icon: BarChart3 },
  ];

  const tabs = [
    { id: 'students', label: t('Students', 'الطلاب'), icon: <Users className="h-4 w-4" />, content: studentsTab },
    { id: 'atrisk', label: t('At Risk', 'معرضون'), icon: <AlertTriangle className="h-4 w-4" />, content: atRiskTab },
  ];

  return (
    <EducationPathwayLayout
      title={t('Academic Advisor', 'المستشار الأكاديمي')}
      description={t('Manage student goals, track at-risk learners, and provide timely interventions', 'إدارة أهداف الطلاب وتتبع المعرّضين للخطر وتقديم التدخلات')}
      icon={<BookOpen className="h-6 w-6" />}
      stats={stats}
      tabs={tabs}
      defaultTab="students"
    />
  );
};
export default AdvisorDashboard;
