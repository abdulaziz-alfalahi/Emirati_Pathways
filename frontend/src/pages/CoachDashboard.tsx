
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import { Users, Calendar, FileText, Clock, Plus, Brain, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { restClient } from '@/utils/api';

const brand = {
  primary: '#0D9488', primarySurface: '#F0FDFA', border: '#E5E7EB',
  textPrimary: '#111827', textSecondary: '#6B7280',
  green: '#DCFCE7', greenText: '#166534',
};

const CoachDashboard: React.FC = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;
  const [clients, setClients] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const coachId = user?.id || 1;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [cRes, anRes] = await Promise.allSettled([
          restClient.get(`/api/coach/clients?coach_id=${coachId}`),
          restClient.get(`/api/coach/analytics?coach_id=${coachId}`),
        ]);
        if (cancelled) return;
        if (cRes.status === 'fulfilled') setClients((cRes.value as any).data.clients || []);
        if (anRes.status === 'fulfilled') setAnalytics((anRes.value as any).data);
      } catch (err) { console.error(err); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const clientsTab = (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: brand.textPrimary, marginBottom: 8 }}>
        {t('My Clients', 'عملائي')}
      </h2>
      <p style={{ fontSize: 14, color: brand.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
        {t('Manage your coaching clients, development plans, and session history.', 'إدارة عملاء التدريب وخطط التطوير وسجل الجلسات.')}
      </p>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} /></div>
      ) : clients.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: brand.textSecondary }}>
          <Users size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>{t('No clients assigned yet.', 'لم يتم تعيين عملاء بعد.')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {clients.map((c, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${brand.border}`, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: brand.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center', color: brand.primary, fontWeight: 700, fontSize: 14 }}>
                {(c.full_name || '?')[0]}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: brand.textPrimary, margin: 0 }}>{c.full_name || 'Client'}</h4>
                <div style={{ fontSize: 12, color: brand.textSecondary }}>{c.total_sessions} sessions · {c.active_plans} active plans</div>
              </div>
              <button style={{ background: brand.primary, color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Plus size={12} /> {t('Session', 'جلسة')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const stats = [
    { value: `${analytics?.total_clients || clients.length}`, label: t('Clients', 'عملاء'), icon: Users },
    { value: `${analytics?.total_sessions || 0}`, label: t('Sessions', 'جلسات'), icon: Calendar },
    { value: `${analytics?.total_coaching_hours || 0}h`, label: t('Coaching Hours', 'ساعات'), icon: Clock },
    { value: `${analytics?.plan_stats?.active || 0}`, label: t('Active Plans', 'خطط نشطة'), icon: FileText },
  ];

  const tabs = [
    { id: 'clients', label: t('Clients', 'العملاء'), icon: <Users className="h-4 w-4" />, content: clientsTab },
  ];

  return (
    <EducationPathwayLayout
      title={t('Career Coach', 'المدرب المهني')}
      description={t('Manage development plans, coaching sessions, and skill gap analysis for your clients', 'إدارة خطط التطوير وجلسات التدريب وتحليل فجوات المهارات')}
      icon={<Brain className="h-6 w-6" />}
      stats={stats}
      tabs={tabs}
      defaultTab="clients"
    />
  );
};
export default CoachDashboard;
