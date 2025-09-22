
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface StatItem {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export interface EducationPathwayLayoutProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  stats: StatItem[];
  tabs: TabItem[];
  defaultTab: string;
  actionButtonText?: string;
  actionButtonHref?: string;
  academicYear?: string;
}

export const EducationPathwayLayout: React.FC<EducationPathwayLayoutProps> = ({
  title,
  description,
  icon,
  stats,
  tabs,
  defaultTab,
  actionButtonText,
  actionButtonHref,
  academicYear
}) => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-ehrdc-teal via-ehrdc-dark-teal to-ehrdc-neutral-dark text-white py-16 md:py-24 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-white rounded-full transform translate-x-1/2 translate-y-1/2"></div>
          <div className="absolute top-1/2 left-3/4 w-20 h-20 bg-white rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-1/4 left-1/6 w-16 h-16 bg-white rounded-full"></div>
        </div>
        
        <div className="container mx-auto px-4 max-w-7xl text-center relative z-10">
          <div className="flex justify-center mb-6">
            {icon}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            {title}
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl opacity-90 max-w-4xl mx-auto leading-relaxed mb-8">
            {description}
          </p>
          
          {actionButtonText && (
            <Button size="lg" variant="secondary" className="bg-white text-ehrdc-teal hover:bg-gray-100">
              {actionButtonText}
            </Button>
          )}
          
          {academicYear && (
            <div className="mt-6 text-sm opacity-80">
              Academic Year: {academicYear}
            </div>
          )}
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-3">
                  <stat.icon className="h-8 w-8 text-ehrdc-teal" />
                </div>
                <div className="text-3xl font-bold text-ehrdc-teal mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Tabs */}
      <div className="container mx-auto px-4 max-w-7xl py-8">
        <Tabs defaultValue={defaultTab} className="w-full">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-white border min-w-max">
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
    </Layout>
  );
};

export default EducationPathwayLayout;
