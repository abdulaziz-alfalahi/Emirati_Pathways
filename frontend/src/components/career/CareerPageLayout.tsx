import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import MobileLayout from '@/components/mobile/MobileLayout';
import { useMobileDetection } from '@/hooks/use-mobile-detection';
import { CareerEntryHeroSection } from '@/components/career/CareerEntryHeroSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface CareerPageLayoutProps {
  // Hero section props
  title: string;
  description: string;
  heroIcon: React.ReactNode;
  primaryActionLabel: string;
  primaryActionIcon?: React.ReactNode;
  primaryActionOnClick?: () => void;
  secondaryActionLabel?: string;
  secondaryActionIcon?: React.ReactNode;
  secondaryActionOnClick?: () => void;
  
  // Stats section props - FIXED: Made optional with default
  stats?: Array<{
    value: string;
    label: string;
  }>;
  
  // Quote section props - FIXED: Made optional
  quote?: string;
  attribution?: string;
  quoteIcon?: React.ReactNode;
  
  // Tabs props
  tabs: TabItem[];
  defaultTab: string;
  
  // Optional gradient override - removed to ensure consistency
}

export const CareerPageLayout: React.FC<CareerPageLayoutProps> = ({
  title,
  description,
  heroIcon,
  primaryActionLabel,
  primaryActionIcon,
  primaryActionOnClick,
  secondaryActionLabel,
  secondaryActionIcon,
  secondaryActionOnClick,
  stats = [], // ✅ FIXED: Default empty array to prevent undefined.map() error
  quote,
  attribution,
  quoteIcon,
  tabs,
  defaultTab
}) => {
  const { isMobile, isCapacitor } = useMobileDetection();
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Use consistent gradient for all Career Entry pages
  const standardGradient = "from-blue-50 via-white to-indigo-50";

  const content = (
    <div className="min-h-screen">
      {/* Hero Section */}
      <CareerEntryHeroSection
        title={title}
        description={description}
        gradient={standardGradient}
        icon={heroIcon}
        primaryActionLabel={primaryActionLabel}
        primaryActionIcon={primaryActionIcon}
        primaryActionOnClick={primaryActionOnClick}
        secondaryActionLabel={secondaryActionLabel}
        secondaryActionIcon={secondaryActionIcon}
        secondaryActionOnClick={secondaryActionOnClick}
      />

      {/* Key Statistics - FIXED: Added null check */}
      {stats && stats.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl font-bold text-ehrdc-teal mb-2">{stat.value}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Quote Section - FIXED: Added null check */}
      {quote && attribution && quoteIcon && (
        <section className="py-16 bg-gradient-to-r from-ehrdc-teal/5 to-ehrdc-blue/5">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex justify-center mb-6">
              {quoteIcon}
            </div>
            <blockquote className="text-2xl font-medium text-gray-900 mb-4">
              "{quote}"
            </blockquote>
            <cite className="text-lg text-muted-foreground">— {attribution}</cite>
          </div>
        </section>
      )}

      {/* Main Content Tabs */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 h-auto p-2 bg-gray-100 rounded-lg">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-ehrdc-teal data-[state=active]:shadow-sm"
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            <div className="mt-8">
              {tabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="mt-0">
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-0">
                      {tab.content}
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>
      </section>
    </div>
  );

  // Return appropriate layout based on device type
  if (isMobile || isCapacitor) {
    return <MobileLayout>{content}</MobileLayout>;
  }

  return <Layout>{content}</Layout>;
};

