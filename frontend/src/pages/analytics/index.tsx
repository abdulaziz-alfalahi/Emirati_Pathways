import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users, Shield, TestTube, TrendingUp, Settings, Activity, Eye, Database, Target, BookOpen } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { UserJourneyVisualization } from '@/components/analytics/UserJourneyVisualization';
import { AnalyticsConsentManager } from '@/components/analytics/AnalyticsConsentManager';
import { AdminAnalyticsDashboard } from '@/components/analytics/AdminAnalyticsDashboard';
import RecommendationAnalytics from '@/components/dashboard/RecommendationAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProfessionalGrowthLayout, StatItem, TabItem } from '@/components/professional-growth/ProfessionalGrowthLayout';
import { ProfessionalGrowthTabContent } from '@/components/professional-growth/ProfessionalGrowthTabContent';

const AnalyticsPage: React.FC = () => {
  const { t } = useTranslation('analytics');
  const { user } = useAuth();
  const { activeRole } = useRole();
  const [activeTab, setActiveTab] = useState('journey');

  const isAdmin = activeRole === 'administrator' || activeRole === 'super_user';

  // Analytics-focused statistics with Professional Growth styling
  const stats: StatItem[] = [
    {
      value: t('stats.dataPoints', "2.5M+"),
      label: t('stats.dataPointsLabel', "Data Points Collected"),
      icon: Database
    },
    {
      value: t('stats.insights', "150+"),
      label: t('stats.insightsLabel', "Insights Generated"), 
      icon: TrendingUp
    },
    {
      value: t('stats.privacy', "99.8%"),
      label: t('stats.privacyLabel', "Privacy Compliance Rate"),
      icon: Shield
    },
    {
      value: t('stats.engagement', "87%"),
      label: t('stats.engagementLabel', "User Engagement Score"),
      icon: Activity
    }
  ];

  const tabs: TabItem[] = [
    {
      id: 'journey',
      label: t('tabs.journey.label', 'My Journey'),
      icon: <TrendingUp className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title={t('tabs.journey.title', "Personal Analytics Journey")}
          icon={<TrendingUp className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description={t('tabs.journey.description', "Track your progress and insights across your professional development journey")}
        >
          <UserJourneyVisualization />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: 'recommendations',
      label: t('tabs.recommendations.label', 'AI Insights'),
      icon: <Target className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title={t('tabs.recommendations.title', "Personalized Recommendations")}
          icon={<Target className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description={t('tabs.recommendations.description', "AI-powered insights and recommendations tailored to your career goals")}
        >
          <RecommendationAnalytics />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: 'consent',
      label: t('tabs.consent.label', 'Privacy Settings'),
      icon: <Shield className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title={t('tabs.consent.title', "Privacy & Data Protection")}
          icon={<Shield className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description={t('tabs.consent.description', "Manage your data sharing preferences and privacy settings")}
        >
          <div className="space-y-6">
            <Card className="bg-[rgb(var(--pg-background))] border-[rgb(var(--pg-secondary))]/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-[rgb(var(--pg-secondary))] mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-2">{t('tabs.consent.privacyTitle', "Privacy & Data Protection")}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('tabs.consent.privacyDescription', "All analytics data is anonymized and encrypted. We use this information to improve your experience and platform functionality. You maintain full control over your data sharing preferences through the Privacy Settings tab.")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <AnalyticsConsentManager />
          </div>
        </ProfessionalGrowthTabContent>
      )
    }
  ];

  // Add admin tabs if user is admin
  if (isAdmin) {
    tabs.push(
      {
        id: 'platform',
        label: t('tabs.platform.label', 'Platform Analytics'),
        icon: <BarChart3 className="h-4 w-4" />,
        content: (
          <ProfessionalGrowthTabContent
            title={t('tabs.platform.title', "Platform Analytics Dashboard")}
            icon={<BarChart3 className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
            description={t('tabs.platform.description', "Comprehensive platform analytics and administrative insights")}
          >
            <AdminAnalyticsDashboard />
          </ProfessionalGrowthTabContent>
        )
      },
      {
        id: 'abtesting',
        label: t('tabs.abtesting.label', 'A/B Testing'),
        icon: <TestTube className="h-4 w-4" />,
        content: (
          <ProfessionalGrowthTabContent
            title={t('tabs.abtesting.title', "A/B Testing Interface")}
            icon={<TestTube className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
            description={t('tabs.abtesting.description', "Manage and monitor A/B tests for continuous platform improvement")}
          >
            <div className="text-center py-12">
              <TestTube className="h-16 w-16 text-[rgb(var(--pg-secondary))] mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">{t('tabs.abtesting.contentTitle', "A/B Testing Interface")}</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                {t('tabs.abtesting.contentDescription', "Advanced A/B testing interface coming soon. This will include experiment creation, variant management, and statistical analysis tools.")}
              </p>
              <Button 
                variant="outline" 
                className="border-[rgb(var(--pg-secondary))] text-[rgb(var(--pg-secondary))] hover:bg-[rgb(var(--pg-secondary))] hover:text-white"
              >
                <Settings className="h-4 w-4 mr-2" />
                {t('tabs.abtesting.configureButton', "Configure Tests")}
              </Button>
            </div>
          </ProfessionalGrowthTabContent>
        )
      }
    );
  }

  if (!user) {
    return (
      <ProfessionalGrowthLayout
        title={t('title', "Analytics & Insights")}
        description={t('description', "Comprehensive analytics across your citizen lifecycle journey with privacy-first data insights")}
        icon={<BarChart3 className="h-8 w-8 text-white" />}
        stats={stats}
        tabs={[
          {
            id: 'signin',
            label: t('signin.label', 'Sign In Required'),
            icon: <Eye className="h-4 w-4" />,
            content: (
              <ProfessionalGrowthTabContent
                title={t('signin.title', "Analytics Access Required")}
                icon={<BarChart3 className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
                description={t('signin.description', "Please sign in to view your analytics and journey insights")}
              >
                <div className="text-center py-16">
                  <BarChart3 className="h-16 w-16 text-[rgb(var(--pg-secondary))] mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold mb-2">{t('signin.contentTitle', "Analytics Access Required")}</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    {t('signin.contentDescription', "Please sign in to view your analytics and journey insights.")}
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/auth'} 
                    size="lg"
                    className="bg-[rgb(var(--pg-secondary))] hover:bg-[rgb(var(--pg-secondary))]/90 text-white"
                  >
                    {t('signin.button', "Sign In to Continue")}
                  </Button>
                </div>
              </ProfessionalGrowthTabContent>
            )
          }
        ]}
        defaultTab="signin"
        showProgress={true}
        progressStep={2}
        totalSteps={4}
        stepLabel={t('progressLabel', "Analytics Setup")}
        ctaTitle={t('cta.title', "Ready to Explore More?")}
        ctaDescription={t('cta.description', "Discover additional insights and tools to accelerate your professional growth journey.")}
        ctaActionLabel={t('cta.actionLabel', "Explore Professional Growth")}
        ctaActionHref="/professional-certifications"
      />
    );
  }

  return (
    <ProfessionalGrowthLayout
      title={t('title', "Analytics & Insights")}
      description={t('description', "Comprehensive analytics across your citizen lifecycle journey with privacy-first data insights")}
      icon={<BarChart3 className="h-8 w-8 text-white" />}
      stats={stats}
      tabs={tabs}
      defaultTab="journey"
      showProgress={true}
      progressStep={2}
      totalSteps={4}
      stepLabel={t('progressLabel', "Analytics Dashboard")}
      ctaTitle={t('cta.title', "Ready to Explore More?")}
      ctaDescription={t('cta.description', "Discover additional insights and tools to accelerate your professional growth journey.")}
      ctaActionLabel={t('cta.actionLabel', "Explore Professional Growth")}
      ctaActionHref="/professional-certifications"
    />
  );
};

export default AnalyticsPage;

