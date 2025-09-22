
import React, { ReactNode } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  return (
    <Layout>
      <div className="min-h-screen bg-[rgb(var(--pg-background))]">
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

        {/* Quick Access Navigation */}
        {showQuickAccess && <QuickAccessNavigation />}
      </div>
    </Layout>
  );
};
