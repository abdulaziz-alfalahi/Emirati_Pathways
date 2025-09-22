import React from 'react';
import { useTranslation } from 'react-i18next';
import { ProfessionalGrowthLayout, StatItem, TabItem } from '@/components/professional-growth/ProfessionalGrowthLayout';
import { ProfessionalGrowthTabContent } from '@/components/professional-growth/ProfessionalGrowthTabContent';
import { ProfessionalCertificationsList } from '@/components/professional-certifications/ProfessionalCertificationsList';
import { Award, Building2, TrendingUp, Users, BookOpen, Calendar, Target } from 'lucide-react';

const ProfessionalCertificationsPage: React.FC = () => {
  const { t } = useTranslation('professional-certifications');

  const stats: StatItem[] = [
    {
      value: t('stats.availableCertifications'),
      label: t('stats.availableCertificationsLabel'),
      icon: Award
    },
    {
      value: t('stats.industrySectors'),
      label: t('stats.industrySectorsLabel'),
      icon: Building2
    },
    {
      value: t('stats.salaryIncrease'),
      label: t('stats.salaryIncreaseLabel'),
      icon: TrendingUp
    },
    {
      value: t('stats.certifiedProfessionals'),
      label: t('stats.certifiedProfessionalsLabel'),
      icon: Users
    }
  ];

  const tabs: TabItem[] = [
    {
      id: "browse",
      label: t('tabs.browse.label'),
      icon: <Award className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title={t('tabs.browse.title')}
          icon={<Award className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description={t('tabs.browse.description')}
        >
          <ProfessionalCertificationsList />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "my-certifications",
      label: t('tabs.myCertifications.label'),
      icon: <BookOpen className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title={t('tabs.myCertifications.title')}
          icon={<BookOpen className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description={t('tabs.myCertifications.description')}
        >
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-[rgb(var(--pg-secondary))] mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-2">{t('tabs.myCertifications.contentTitle')}</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              {t('tabs.myCertifications.contentDescription')}
            </p>
          </div>
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "recommended",
      label: t('tabs.recommended.label'),
      icon: <Target className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title={t('tabs.recommended.title')}
          icon={<Target className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description={t('tabs.recommended.description')}
        >
          <div className="text-center py-12">
            <Target className="h-16 w-16 text-[rgb(var(--pg-secondary))] mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-2">{t('tabs.recommended.contentTitle')}</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              {t('tabs.recommended.contentDescription')}
            </p>
          </div>
        </ProfessionalGrowthTabContent>
      )
    }
  ];

  return (
    <ProfessionalGrowthLayout
      title={t('title')}
      description={t('description')}
      icon={<Award className="h-8 w-8 text-white" />}
      stats={stats}
      tabs={tabs}
      defaultTab="browse"
      showProgress={true}
      progressStep={3}
      totalSteps={5}
      stepLabel={t('progressLabel')}
      ctaTitle={t('cta.title')}
      ctaDescription={t('cta.description')}
      ctaActionLabel={t('cta.actionLabel')}
      ctaActionHref="/leadership"
    />
  );
};

export default ProfessionalCertificationsPage;

