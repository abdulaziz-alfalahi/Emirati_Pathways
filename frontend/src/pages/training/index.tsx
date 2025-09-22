import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProfessionalGrowthLayout } from '@/components/professional-growth/ProfessionalGrowthLayout';
import { ProfessionalGrowthTabContent } from '@/components/professional-growth/ProfessionalGrowthTabContent';
import { TrainingFilters } from '@/components/training/TrainingFilters';
import { TrainingProgramsList } from '@/components/training/TrainingProgramsList';
import { MyLearningTab } from '@/components/training/MyLearningTab';
import { CompletedTrainingTab } from '@/components/training/CompletedTrainingTab';
import { CertificatesTab } from '@/components/training/CertificatesTab';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Users, Award, TrendingUp, GraduationCap, Building, User, CheckCircle } from 'lucide-react';
import type { TrainingFilters as TrainingFiltersType } from '@/types/training';

const TrainingPage: React.FC = () => {
  const { t } = useTranslation('training');
  const { toast } = useToast();
  const [filters, setFilters] = useState<TrainingFiltersType>({});

  const handleFiltersChange = (newFilters: TrainingFiltersType) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleApplyToProgram = (programId: string) => {
    toast({
      title: t('actions.applicationStarted'),
      description: t('actions.redirectingToForm'),
    });
    // TODO: Implement application flow
  };

  const handleViewDetails = (programId: string) => {
    toast({
      title: t('actions.programDetails'),
      description: t('actions.openingDetails'),
    });
    // TODO: Implement program details view
  };

  const stats = [
    { 
      value: t('stats.trainingPrograms.value'), 
      label: t('stats.trainingPrograms.label'), 
      icon: BookOpen 
    },
    { 
      value: t('stats.graduates.value'), 
      label: t('stats.graduates.label'), 
      icon: Users 
    },
    { 
      value: t('stats.jobPlacementRate.value'), 
      label: t('stats.jobPlacementRate.label'), 
      icon: TrendingUp 
    },
    { 
      value: t('stats.trainingPartners.value'), 
      label: t('stats.trainingPartners.label'), 
      icon: Building 
    }
  ];

  const tabs = [
    {
      id: "available-courses",
      label: t('tabs.availableCourses.label'),
      icon: <BookOpen className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title={t('tabs.availableCourses.title')}
          description={t('tabs.availableCourses.description')}
          icon={<BookOpen className="h-5 w-5 text-[rgb(var(--pg-primary))]" />}
        >
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <TrainingFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
              />
            </div>
            <div className="lg:col-span-3">
              <TrainingProgramsList
                filters={filters}
                onApply={handleApplyToProgram}
                onViewDetails={handleViewDetails}
              />
            </div>
          </div>
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "my-learning",
      label: t('tabs.myLearning.label'),
      icon: <User className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title={t('tabs.myLearning.title')}
          description={t('tabs.myLearning.description')}
          icon={<User className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
        >
          <MyLearningTab />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "completed",
      label: t('tabs.completed.label'),
      icon: <CheckCircle className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title={t('tabs.completed.title')}
          description={t('tabs.completed.description')}
          icon={<CheckCircle className="h-5 w-5 text-[rgb(var(--pg-accent))]" />}
        >
          <CompletedTrainingTab />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "certificates",
      label: t('tabs.certificates.label'),
      icon: <Award className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title={t('tabs.certificates.title')}
          description={t('tabs.certificates.description')}
          icon={<Award className="h-5 w-5 text-[rgb(var(--pg-primary))]" />}
        >
          <CertificatesTab />
        </ProfessionalGrowthTabContent>
      )
    }
  ];

  return (
    <ProfessionalGrowthLayout
      title={t('title')}
      description={t('description')}
      icon={<GraduationCap className="h-12 w-12" />}
      stats={stats}
      tabs={tabs}
      defaultTab="available-courses"
      ctaTitle={t('cta.title')}
      ctaDescription={t('cta.description')}
      ctaActionLabel={t('cta.actionLabel')}
      ctaActionHref="#available-courses"
    />
  );
};

export default TrainingPage;

