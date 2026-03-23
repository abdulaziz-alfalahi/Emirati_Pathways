import React, { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import { Award, Shield, Stamp, BookOpen, Users, TrendingUp, Loader2 } from 'lucide-react';

// Lazy load the three credential sub-pages
const ProfessionalCertificationsPage = lazy(() => import('@/pages/professional-certifications/ProfessionalCertificationsPage'));
const BlockchainCredentialsPage = lazy(() => import('@/pages/blockchain-credentials/BlockchainCredentialsPage'));
const CareerPassportPage = lazy(() => import('@/pages/career-passport/CareerPassportPage'));

const brand = {
  primary: '#0D9488',
};

const FallbackLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
    <Loader2 className="animate-spin" size={32} style={{ color: brand.primary }} />
  </div>
);

const CredentialsCenterPage: React.FC = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const t = (en: string, ar: string) => isRTL ? ar : en;

  /* ── Stats ── */
  const stats = [
    { value: '150+', label: t('Certifications', 'شهادة'), icon: Award },
    { value: '12K+', label: t('Credentialed', 'معتمد'), icon: Users },
    { value: '96%', label: t('Pass Rate', 'نسبة النجاح'), icon: TrendingUp },
    { value: '30+', label: t('Partners', 'شريك'), icon: BookOpen },
  ];

  /* ── Tabs — each sub-page is embedded (no duplicate nav/breadcrumbs) ── */
  const tabs = [
    {
      id: 'certifications',
      label: t('Professional Certifications', 'الشهادات المهنية'),
      icon: <Award className="h-4 w-4" />,
      content: (
        <Suspense fallback={<FallbackLoader />}>
          <ProfessionalCertificationsPage embedded />
        </Suspense>
      ),
    },
    {
      id: 'blockchain',
      label: t('Blockchain Credentials', 'شهادات البلوك تشين'),
      icon: <Shield className="h-4 w-4" />,
      content: (
        <Suspense fallback={<FallbackLoader />}>
          <BlockchainCredentialsPage embedded />
        </Suspense>
      ),
    },
    {
      id: 'passport',
      label: t('Career Passport', 'جواز المسيرة المهنية'),
      icon: <Stamp className="h-4 w-4" />,
      content: (
        <Suspense fallback={<FallbackLoader />}>
          <CareerPassportPage embedded />
        </Suspense>
      ),
    },
  ];

  return (
    <EducationPathwayLayout
      title={t('Credentials Center', 'مركز الشهادات')}
      description={t(
        'Discover professional certifications, verify blockchain credentials, and track your career milestones — all in one place',
        'اكتشف الشهادات المهنية وتحقق من شهادات البلوك تشين وتتبع إنجازاتك المهنية — في مكان واحد'
      )}
      icon={<Award className="h-6 w-6" />}
      stats={stats}
      tabs={tabs}
      defaultTab="certifications"
    />
  );
};

export default CredentialsCenterPage;
