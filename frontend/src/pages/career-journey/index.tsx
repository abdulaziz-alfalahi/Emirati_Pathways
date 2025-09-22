
import React, { useState } from 'react';
import { CareerPageLayout } from '@/components/career/CareerPageLayout';
import CareerJourneyVisualization from '@/components/career-journey/CareerJourneyVisualization';
import SkillsGapAnalysis from '@/components/career-journey/SkillsGapAnalysis';
import GoalSetting from '@/components/career-journey/GoalSetting';
import { 
  Navigation, 
  Target, 
  TrendingUp, 
  BarChart3, 
  Compass,
  Map,
  GitCompare,
  Quote
} from 'lucide-react';

const CareerJourneyPage: React.FC = () => {
  // Stats for the layout
  const stats = [
    { value: "500+", label: "Career Paths Mapped" },
    { value: "95%", label: "Goal Achievement Rate" },
    { value: "50K+", label: "Career Milestones Tracked" },
    { value: "AI-Powered", label: "Personalized Insights" }
  ];

  // Tabs content for the layout
  const tabs = [
    {
      id: "journey",
      label: "Journey Map",
      icon: <Map className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Interactive Career Journey Map</h2>
          </div>
          <CareerJourneyVisualization />
        </div>
      )
    },
    {
      id: "goals",
      label: "Goals & Milestones",
      icon: <Target className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Goal Setting & Tracking</h2>
          <GoalSetting />
        </div>
      )
    },
    {
      id: "skills",
      label: "Skills Analysis",
      icon: <TrendingUp className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Skills Gap Analysis</h2>
          <SkillsGapAnalysis />
        </div>
      )
    },
    {
      id: "progress",
      label: "Progress Tracking",
      icon: <BarChart3 className="h-4 w-4" />,
      content: (
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 text-ehrdc-teal mx-auto mb-4" />
          <h3 className="text-2xl font-semibold mb-2">Progress Tracking Dashboard</h3>
          <p className="text-muted-foreground">
            Monitor your career development and achievements over time with detailed analytics and insights.
          </p>
        </div>
      )
    },
    {
      id: "insights",
      label: "AI Insights",
      icon: <Compass className="h-4 w-4" />,
      content: (
        <div className="text-center py-12">
          <Compass className="h-16 w-16 text-ehrdc-teal mx-auto mb-4" />
          <h3 className="text-2xl font-semibold mb-2">AI-Powered Career Insights</h3>
          <p className="text-muted-foreground">
            Get personalized recommendations and insights to accelerate your career growth in the UAE market.
          </p>
        </div>
      )
    },
    {
      id: "comparison",
      label: "Path Comparison",
      icon: <GitCompare className="h-4 w-4" />,
      content: (
        <div className="text-center py-12">
          <GitCompare className="h-16 w-16 text-ehrdc-teal mx-auto mb-4" />
          <h3 className="text-2xl font-semibold mb-2">Career Path Comparison</h3>
          <p className="text-muted-foreground">
            Compare different career paths to make informed decisions about your professional future.
          </p>
        </div>
      )
    }
  ];

  return (
    <CareerPageLayout
      title="Your Career Journey"
      description="Visualize your career path, set milestones, and track your professional development journey with personalized insights and AI-powered recommendations tailored for the UAE's dynamic economy."
      heroIcon={<Navigation className="h-16 w-16" />}
      primaryActionLabel="Start Journey Map"
      primaryActionIcon={<Map className="h-4 w-4" />}
      primaryActionOnClick={() => console.log('Start Journey Map')}
      secondaryActionLabel="Compare Paths"
      secondaryActionIcon={<GitCompare className="h-4 w-4" />}
      secondaryActionOnClick={() => console.log('Compare Paths')}
      stats={stats}
      quote="The journey of a thousand miles begins with one step. In your career, every milestone you achieve brings you closer to your ultimate professional destination."
      attribution="Career Development Philosophy"
      quoteIcon={<Quote className="h-8 w-8" />}
      tabs={tabs}
      defaultTab="journey"
    />
  );
};

export default CareerJourneyPage;
