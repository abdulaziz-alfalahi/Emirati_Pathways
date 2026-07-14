import React, { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import { Award, Shield, Stamp, BookOpen, Users, TrendingUp, Loader2 } from 'lucide-react';

// Lazy load the three credential sub-pages
const ProfessionalCertificationsPage = lazy(() => import('@/pages/professional-certifications/ProfessionalCertificationsPage'));
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
      // Dimmed until certificate-issuer partner integrations are in place — the
      // previous UI presented Math.random() hashes as real "on-chain" verification.
      // Scaffolding is preserved; only the entry point is gated. (#26)
      content: (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Shield className="h-12 w-12 text-slate-400 mb-4" />
          <h3 className="text-xl font-semibold text-slate-700">
            {t('Blockchain Credentials — Coming Soon', 'شهادات البلوك تشين — قريباً')}
          </h3>
          <p className="mt-2 max-w-md text-slate-500">
            {t(
              'On-chain credential verification is being developed in partnership with accredited certificate-issuing entities. It will be enabled once those integrations are in place.',
              'يجري تطوير التحقق من الشهادات عبر البلوك تشين بالشراكة مع الجهات المعتمدة لإصدار الشهادات، وسيتم تفعيله بمجرد اكتمال عمليات التكامل.'
            )}
          </p>
        </div>
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
