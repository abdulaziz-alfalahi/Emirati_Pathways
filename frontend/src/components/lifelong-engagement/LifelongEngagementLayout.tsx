
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import MobileLayout from '@/components/mobile/MobileLayout';
import { useMobileDetection } from '@/hooks/use-mobile-detection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface Stat {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface LifelongEngagementLayoutProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  stats: Stat[];
  tabs: TabItem[];
  defaultTab: string;
}

export const LifelongEngagementLayout: React.FC<LifelongEngagementLayoutProps> = ({
  title,
  description,
  icon,
  stats,
  tabs,
  defaultTab
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  // Use mobile detection with error boundary
  let isMobile = false;
  let isCapacitor = false;
  
  try {
    const mobileDetection = useMobileDetection();
    isMobile = mobileDetection.isMobile;
    isCapacitor = mobileDetection.isCapacitor;
  } catch (error) {
    console.warn('Mobile detection failed, using defaults:', error);
    // Fallback to basic detection
    if (typeof window !== 'undefined') {
      isMobile = window.innerWidth < 768;
    }
  }

  const content = (
    <div className="min-h-screen bg-gradient-to-br from-ehrdc-teal via-ehrdc-light-teal to-ehrdc-neutral-light">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-ehrdc-teal to-ehrdc-dark-teal text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-white/20 rounded-full p-4">
              {icon}
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            {title}
          </h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-4xl mx-auto leading-relaxed">
            {description}
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <stat.icon className="h-8 w-8 text-ehrdc-teal" />
                </div>
                <div className="text-4xl font-bold text-ehrdc-teal mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8 bg-white border min-w-max">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2 text-ehrdc-teal whitespace-nowrap">
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              <Card>
                <CardContent className="p-6">
                  {tab.content}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );

  if (isMobile || isCapacitor) {
    return <MobileLayout>{content}</MobileLayout>;
  }

  return <Layout>{content}</Layout>;
};
