import React, { useState } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useSearchParams } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ProfessionalGrowthLayout } from '@/components/professional-growth/ProfessionalGrowthLayout';
import { ProfessionalGrowthTabContent } from '@/components/professional-growth/ProfessionalGrowthTabContent';
import { AuthenticationRequired } from '@/components/auth/AuthenticationRequired';
import { AssessmentsList } from '@/components/assessments/AssessmentsList';
import { UserAssessments } from '@/components/assessments/UserAssessments';
import { CoachingRecommendations } from '@/components/assessments/CoachingRecommendations';
import { useAuth } from '@/context/AuthContext';
import { AssessmentUpload } from '@/components/assessments/AssessmentUpload';
import { Button } from '@/components/ui/button';
import {
  ClipboardCheck, Search, Award, Target, Brain,
  FileText, TrendingUp, BookOpen, Users, BarChart3
} from 'lucide-react';

// Create a client
const queryClient = new QueryClient();

const AssessmentsPage = () => {
  console.log('AssessmentsPage component rendering');

  const { t } = useTranslation('assessments');
  const { user, hasRole } = useAuth();
  const [searchParams] = useSearchParams();
  const context = searchParams.get('context');

  // Safely get roles from user object
  const userRoles = user?.roles || [];
  const isAssessmentOrTrainingCenter = userRoles.includes('assessment_center') || userRoles.includes('training_center');

  console.log('User:', user);
  console.log('Context from URL:', context);
  console.log('Roles:', userRoles);

  // Assessment Center Controls Component
  const AssessmentCenterControls = () => (
    <ProfessionalGrowthTabContent
      title={t('centerControls.title')}
      description={t('centerControls.description')}
      icon={<Users className="h-5 w-5 text-[rgb(var(--pg-primary))]" />}
    >
      <div className="space-y-4">
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">{t('upload.title')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('upload.description')}
          </p>
        </div>
        <AssessmentUpload />
      </div>
    </ProfessionalGrowthTabContent>
  );

  // Get context-specific content
  const getContextContent = () => {
    if (context === 'academic') {
      return {
        title: t('contexts.academic.title'),
        description: t('contexts.academic.description')
      };
    } else if (context === 'career') {
      return {
        title: t('contexts.career.title'),
        description: t('contexts.career.description')
      };
    } else {
      return {
        title: t('contexts.general.title'),
        description: t('contexts.general.description')
      };
    }
  };

  const contextContent = getContextContent();

  if (!user) {
    console.log('No user found, showing authentication required');
    return (
      <div className="min-h-screen bg-[rgb(var(--pg-background))]">
        <div className="flex items-center justify-center min-h-screen">
          <AuthenticationRequired
            message={t('authentication.required')}
            icon={<ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />}
          />
        </div>
      </div>
    );
  }

  console.log('User authenticated, rendering main content');

  const stats = [
    {
      value: "500+",
      label: t('stats.assessments'),
      icon: ClipboardCheck
    },
    {
      value: "92%",
      label: t('stats.completionRate'),
      icon: TrendingUp
    },
    {
      value: "15+",
      label: t('stats.categories'),
      icon: Target
    },
    {
      value: "24/7",
      label: t('stats.access'),
      icon: BookOpen
    }
  ];

  const tabs = [
    {
      id: "available",
      label: t('tabs.available.label'),
      icon: <Search className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title={t('tabs.available.title')}
          description={t('tabs.available.description')}
          icon={<Search className="h-5 w-5 text-[rgb(var(--pg-primary))]" />}
          action={
            isAssessmentOrTrainingCenter && (
              <Button className="bg-[rgb(var(--pg-primary))] hover:bg-[rgb(var(--pg-primary))/90]">
                <ClipboardCheck className="h-4 w-4 mr-2" />
                {t('centerControls.features.createAssessment')}
              </Button>
            )
          }
        >
          <div className="space-y-6">
            {isAssessmentOrTrainingCenter && <AssessmentCenterControls />}
            <AssessmentsList />
          </div>
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "in-progress",
      label: t('tabs.inProgress.label'),
      icon: <TrendingUp className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title={t('tabs.inProgress.title')}
          description={t('tabs.inProgress.description')}
          icon={<TrendingUp className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
        >
          <div className="text-center py-12">
            <TrendingUp className="h-16 w-16 text-[rgb(var(--pg-secondary))] mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-2">{t('inProgress.empty.title')}</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              {t('inProgress.empty.description')}
            </p>
            <Button variant="outline" className="border-[rgb(var(--pg-secondary))] text-[rgb(var(--pg-secondary))] hover:bg-[rgb(var(--pg-secondary))] hover:text-white">
              {t('inProgress.empty.action')}
            </Button>
          </div>
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "completed",
      label: t('tabs.completed.label'),
      icon: <Award className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title={t('tabs.completed.title')}
          description={t('tabs.completed.description')}
          icon={<Award className="h-5 w-5 text-[rgb(var(--pg-accent))]" />}
        >
          <div className="space-y-8">
            <UserAssessments />
            <CoachingRecommendations />
          </div>
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "results",
      label: t('tabs.results.label'),
      icon: <BarChart3 className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title={t('tabs.results.title')}
          description={t('tabs.results.description')}
          icon={<BarChart3 className="h-5 w-5 text-[rgb(var(--pg-primary))]" />}
        >
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-[rgb(var(--pg-primary))] mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-2">{t('results.overview.title')}</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              {t('results.empty.description')}
            </p>
            <Button className="bg-[rgb(var(--pg-primary))] hover:bg-[rgb(var(--pg-primary))/90]">
              {t('results.empty.action')}
            </Button>
          </div>
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "skills",
      label: t('tabs.skills.label'),
      icon: <Target className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title={t('tabs.skills.title')}
          description={t('tabs.skills.description')}
          icon={<Target className="h-5 w-5 text-[rgb(var(--pg-accent))]" />}
        >
          <div className="text-center py-12">
            <Target className="h-16 w-16 text-[rgb(var(--pg-accent))] mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-2">{t('skills.title')}</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              {t('skills.mapping.description')}
            </p>
            <Button variant="outline" className="border-[rgb(var(--pg-accent))] text-[rgb(var(--pg-accent))] hover:bg-[rgb(var(--pg-accent))] hover:text-white">
              {t('skills.empty.action')}
            </Button>
          </div>
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "cognitive",
      label: t('tabs.cognitive.label'),
      icon: <Brain className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title={t('tabs.cognitive.title')}
          description={t('tabs.cognitive.description')}
          icon={<Brain className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
        >
          <div className="text-center py-12">
            <Brain className="h-16 w-16 text-[rgb(var(--pg-secondary))] mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-2">{t('cognitive.title')}</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              {t('cognitive.empty.description')}
            </p>
            <Button variant="outline" className="border-[rgb(var(--pg-secondary))] text-[rgb(var(--pg-secondary))] hover:bg-[rgb(var(--pg-secondary))] hover:text-white">
              {t('cognitive.empty.action')}
            </Button>
          </div>
        </ProfessionalGrowthTabContent>
      )
    }
  ];

  console.log('About to render ProfessionalGrowthLayout');

  return (
    <QueryClientProvider client={queryClient}>
      <ProfessionalGrowthLayout
        title={contextContent.title}
        description={contextContent.description}
        icon={<ClipboardCheck className="h-8 w-8" />}
        stats={stats}
        tabs={tabs}
        defaultTab="available"
        showProgress={true}
        progressStep={1}
        totalSteps={4}
        stepLabel={t('progress.steps.discovery')}
        ctaTitle={t('cta.title')}
        ctaDescription={t('cta.description')}
        ctaActionLabel={t('cta.action')}
        ctaActionHref="/assessments?tab=available"
      />
    </QueryClientProvider>
  );
};

const WrappedAssessmentsPage = () => (
  <ErrorBoundary>
    <AssessmentsPage />
  </ErrorBoundary>
);
export default WrappedAssessmentsPage;

