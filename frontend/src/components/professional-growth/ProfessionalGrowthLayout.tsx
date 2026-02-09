
import React, { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
// Removed: import Layout from '@/components/layout/Layout';
// Added: HybridGovernmentNavFixed to match Home Page
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import DubaiGovStickyBar from '@/components/layout/DubaiGovStickyBar';
import { UnifiedFooter } from '@/components/layout/UnifiedFooter'; // New Shared Footer

import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LucideIcon } from 'lucide-react';
import { getStatColor } from '@/lib/colors';
import {
  ProfessionalGrowthBreadcrumbs,
  RelatedPagesSection,
  QuickAccessNavigation,
  ProfessionalGrowthProgress,
  ProfessionalGrowthCTA
} from './ProfessionalGrowthNavigation';

export interface StatItem {
  value: string;
  label: string;
  icon: LucideIcon;
  color?: string; // Keep for backward compatibility but will be overridden
}

export interface TabItem {
  id: string;
  label: string;
  icon: ReactNode;
  content: ReactNode;
}

interface ProfessionalGrowthLayoutProps {
  title: string;
  description: string;
  icon: ReactNode;
  stats?: StatItem[];
  tabs: TabItem[];
  defaultTab?: string;
  children?: ReactNode;
  showProgress?: boolean;
  progressStep?: number;
  totalSteps?: number;
  stepLabel?: string;
  ctaTitle?: string;
  ctaDescription?: string;
  ctaActionLabel?: string;
  ctaActionHref?: string;
  showQuickAccess?: boolean;
}

export const ProfessionalGrowthLayout: React.FC<ProfessionalGrowthLayoutProps> = ({
  title,
  description,
  icon,
  stats,
  tabs,
  defaultTab,
  children,
  showProgress = false,
  progressStep = 1,
  totalSteps = 1,
  stepLabel = '',
  ctaTitle,
  ctaDescription,
  ctaActionLabel,
  ctaActionHref,
  showQuickAccess = true
}) => {
  const { i18n } = useTranslation();
  const currentLanguage = (i18n.language === 'ar' ? 'ar' : 'en') as 'en' | 'ar';

  const toggleLanguage = () => {
    const next = currentLanguage === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(next);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[rgb(var(--pg-background))]">
      {/* Use HybridGovernmentNavFixed to match Home Page style */}
      <HybridGovernmentNavFixed
        showAuthButtons={true} // Or make this dynamic based on auth context handled inside nav
        onLanguageToggle={toggleLanguage}
        currentLanguage={currentLanguage}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-[rgb(var(--pg-gradient-from))] to-[rgb(var(--pg-gradient-to))] text-white">
          <div className="container mx-auto px-4 py-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                {icon}
              </div>
              <h1 className="text-3xl font-bold">{title}</h1>
            </div>
            <p className="text-xl opacity-90 max-w-3xl">{description}</p>
          </div>
        </div>

        {/* Stats Section */}
        {stats && stats.length > 0 && (
          <section className="py-8 bg-white shadow-sm">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                  const IconComponent = stat.icon;
                  return (
                    <Card key={index} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${getStatColor(index)}`}>
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                            <p className="text-lg font-semibold">{stat.value}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumbs */}
          <ProfessionalGrowthBreadcrumbs />

          {/* Progress Indicator */}
          {showProgress && (
            <ProfessionalGrowthProgress
              currentStep={progressStep}
              totalSteps={totalSteps}
              stepLabel={stepLabel}
            />
          )}

          {children ? (
            children
          ) : (
            <Tabs defaultValue={defaultTab || tabs[0]?.id} className="w-full">
              <TabsList className="mb-6 bg-white border shadow-sm">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {tabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id}>
                  {tab.content}
                </TabsContent>
              ))}
            </Tabs>
          )}

          {/* Call-to-Action Section */}
          {ctaTitle && ctaDescription && ctaActionLabel && ctaActionHref && (
            <ProfessionalGrowthCTA
              title={ctaTitle}
              description={ctaDescription}
              actionLabel={ctaActionLabel}
              actionHref={ctaActionHref}
            />
          )}

          {/* Related Pages */}
          <RelatedPagesSection />
        </div>
        {/* Quick Access Navigation - REMOVED per user feedback
        {showQuickAccess && <QuickAccessNavigation />}
        */}
      </main>

      {/* Unified Footer */}
      <UnifiedFooter />

      {/* Dubai Government Sticky Bar - REMOVED per user feedback */}
      {/* <DubaiGovStickyBar /> */}
    </div>
  );
};

export default ProfessionalGrowthLayout;
