import React from 'react';
import Layout from '@/components/layout/Layout';
import MobileLayout from '@/components/mobile/MobileLayout';
import { useMobileDetection } from '@/hooks/use-mobile-detection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LucideIcon, TrendingUp, Award, Users, Lightbulb, ChevronRight, Target, Zap, Network } from 'lucide-react';

export interface GrowthStat {
  value: string;
  label: string;
  icon: LucideIcon;
  trend?: string;
}

export interface GrowthTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export interface ProfessionalGrowthLayoutProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  stats: GrowthStat[];
  tabs: GrowthTab[];
  defaultTab: string;
  progressLabel?: string;
  progressValue?: number;
  milestones?: string[];
}

export const ProfessionalGrowthLayout: React.FC<ProfessionalGrowthLayoutProps> = ({
  title,
  description,
  icon,
  stats,
  tabs,
  defaultTab,
  progressLabel = "Your Growth Progress",
  progressValue = 65,
  milestones = []
}) => {
  const { isMobile, isCapacitor } = useMobileDetection();

  const content = (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-indigo-600/10" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-purple-300/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-pink-300/20 rounded-full blur-xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-indigo-300/10 rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative dubai-container">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-xl">
                  {icon}
                </div>
                <div className="absolute -top-2 -right-2 p-1 bg-yellow-400 rounded-full">
                  <Zap className="h-4 w-4 text-yellow-800" />
                </div>
              </div>
            </div>
            
            <Badge className="mb-6 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 hover:from-purple-200 hover:to-pink-200 border-0">
              <TrendingUp className="h-4 w-4 mr-2" />
              Professional Growth
            </Badge>
            
            <h1 className="dubai-text-heading-1 text-ehrdc-neutral-dark mb-6">
              {title}
            </h1>
            
            <p className="dubai-text-body-large text-ehrdc-neutral-dark/70 mb-8 max-w-3xl mx-auto">
              {description}
            </p>

            {/* Progress Section */}
            {progressValue > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 mb-8 max-w-md mx-auto border border-purple-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-ehrdc-neutral-dark">{progressLabel}</span>
                  <span className="text-sm text-purple-600 font-semibold">{progressValue}%</span>
                </div>
                <Progress value={progressValue} className="h-2 mb-3" />
                <p className="text-xs text-ehrdc-neutral-dark/60">
                  Keep going! You&apos;re making excellent progress on your professional development journey.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 shadow-lg"
              >
                <Target className="h-4 w-4 mr-2" />
                Set Growth Goals
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 py-3 border-purple-200 hover:bg-purple-50"
              >
                <Award className="h-4 w-4 mr-2" />
                View Achievements
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/60 backdrop-blur-sm">
        <div className="dubai-container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center border-0 shadow-sm bg-white/90 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
                      <stat.icon className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-ehrdc-neutral-dark mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-ehrdc-neutral-dark/70 mb-2">
                    {stat.label}
                  </div>
                  {stat.trend && (
                    <div className="text-xs text-green-600 font-medium">
                      ↗ {stat.trend}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones Section */}
      {milestones.length > 0 && (
        <section className="py-8 bg-gradient-to-r from-purple-600/5 to-pink-600/5">
          <div className="dubai-container">
            <div className="text-center mb-8">
              <h3 className="text-lg font-semibold text-ehrdc-neutral-dark mb-2">Recent Milestones</h3>
              <p className="text-sm text-ehrdc-neutral-dark/70">Celebrating your professional achievements</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {milestones.map((milestone, index) => (
                <Badge key={index} variant="secondary" className="bg-white/80 text-ehrdc-neutral-dark">
                  <Award className="h-3 w-3 mr-1 text-yellow-500" />
                  {milestone}
                </Badge>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content Tabs */}
      <section className="py-16">
        <div className="dubai-container">
          <Tabs defaultValue={defaultTab} className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="grid w-full max-w-3xl grid-cols-2 lg:grid-cols-4 bg-white/90 backdrop-blur-sm shadow-sm border border-purple-100">
                {tabs.map((tab) => (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id}
                    className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-100 data-[state=active]:to-pink-100 data-[state=active]:text-purple-800"
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="mt-8">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 lg:p-8 shadow-sm border border-purple-100">
                  {tab.content}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Networking & Collaboration Section */}
      <section className="py-16 bg-gradient-to-r from-indigo-600/5 via-purple-600/5 to-pink-600/5">
        <div className="dubai-container">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg">
                <Network className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <h2 className="dubai-text-heading-2 text-ehrdc-neutral-dark mb-4">
              Connect & Collaborate
            </h2>
            
            <p className="dubai-text-body text-ehrdc-neutral-dark/70 mb-8">
              Join a thriving community of professionals, share knowledge, and accelerate your growth through meaningful connections.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="text-center border-0 bg-white/90 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="pt-6">
                  <div className="p-3 bg-blue-100 rounded-lg mx-auto w-fit mb-4">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mb-2">5,000+</div>
                  <div className="text-sm text-ehrdc-neutral-dark/70">Active Professionals</div>
                </CardContent>
              </Card>

              <Card className="text-center border-0 bg-white/90 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="pt-6">
                  <div className="p-3 bg-green-100 rounded-lg mx-auto w-fit mb-4">
                    <Lightbulb className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-600 mb-2">1,200+</div>
                  <div className="text-sm text-ehrdc-neutral-dark/70">Knowledge Sessions</div>
                </CardContent>
              </Card>

              <Card className="text-center border-0 bg-white/90 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="pt-6">
                  <div className="p-3 bg-purple-100 rounded-lg mx-auto w-fit mb-4">
                    <Award className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-purple-600 mb-2">300+</div>
                  <div className="text-sm text-ehrdc-neutral-dark/70">Industry Mentors</div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3"
              >
                <Network className="h-4 w-4 mr-2" />
                Join Network
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 py-3 border-purple-200 hover:bg-purple-50"
              >
                Explore Communities
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  if (isMobile || isCapacitor) {
    return <MobileLayout>{content}</MobileLayout>;
  }

  return <Layout>{content}</Layout>;
};

export default ProfessionalGrowthLayout;
