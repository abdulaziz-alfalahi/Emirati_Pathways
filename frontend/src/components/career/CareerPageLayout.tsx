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

  const content = (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Hero Section — uses EHRDC teal via CareerEntryHeroSection */}
      <CareerEntryHeroSection
        title={title}
        description={description}
        icon={heroIcon}
        primaryActionLabel={primaryActionLabel}
        primaryActionIcon={primaryActionIcon}
        primaryActionOnClick={primaryActionOnClick}
        secondaryActionLabel={secondaryActionLabel}
        secondaryActionIcon={secondaryActionIcon}
        secondaryActionOnClick={secondaryActionOnClick}
      />

      {/* Key Statistics */}
      {stats && stats.length > 0 && (
        <section className="py-12 bg-white border-b border-[#E2E5E9]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-[#006E6D] mb-1">{stat.value}</div>
                  <div className="text-sm text-[#6B7280]">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Quote Section */}
      {quote && attribution && quoteIcon && (
        <section className="py-12 bg-[#F0F7F7]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex justify-center mb-5">
              {quoteIcon}
            </div>
            <blockquote className="text-xl font-medium text-[#1A1A1A] mb-3 leading-relaxed">
              "{quote}"
            </blockquote>
            <cite className="text-sm text-[#6B7280] not-italic">— {attribution}</cite>
          </div>
        </section>
      )}

      {/* Main Content Tabs */}
      <section className="py-12 bg-[#FAFBFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 h-auto p-1.5 bg-white border border-[#E2E5E9] rounded-2xl">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 data-[state=active]:bg-[#006E6D] data-[state=active]:text-white data-[state=active]:shadow-sm"
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-6">
              {tabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="mt-0">
                  <Card className="border border-[#E2E5E9] shadow-sm rounded-2xl">
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

