
import React from 'react';
import { CareerPageLayout } from '@/components/career/CareerPageLayout';
import { CareerComparisonTool } from '@/components/career-comparison/CareerComparisonTool';
import { SalaryComparison } from '@/components/career-comparison/SalaryComparison';
import { GrowthProjections } from '@/components/career-comparison/GrowthProjections';
import { SkillsAnalysis } from '@/components/career-comparison/SkillsAnalysis';
import { WorkLifeBalance } from '@/components/career-comparison/WorkLifeBalance';
import { PersonalizedInsights } from '@/components/career-comparison/PersonalizedInsights';
import { 
  GitCompare, TrendingUp, BookOpen, Heart, 
  Star, BarChart3, Search, Users
} from 'lucide-react';

const CareerComparisonPage: React.FC = () => {
  const handlePrimaryAction = () => {
    console.log('Start career comparison');
  };

  const handleSecondaryAction = () => {
    console.log('View market data');
  };

  // Define tabs for the Career Entry layout
  const tabs = [
    {
      id: 'comparison',
      label: 'Compare',
      icon: <GitCompare className="h-4 w-4" />,
      content: <CareerComparisonTool />
    },
    {
      id: 'salary',
      label: 'Salary',
      icon: <TrendingUp className="h-4 w-4" />,
      content: <SalaryComparison />
    },
    {
      id: 'growth',
      label: 'Growth',
      icon: <BarChart3 className="h-4 w-4" />,
      content: <GrowthProjections />
    },
    {
      id: 'skills',
      label: 'Skills',
      icon: <BookOpen className="h-4 w-4" />,
      content: <SkillsAnalysis />
    },
    {
      id: 'balance',
      label: 'Balance',
      icon: <Heart className="h-4 w-4" />,
      content: <WorkLifeBalance />
    },
    {
      id: 'insights',
      label: 'Insights',
      icon: <Star className="h-4 w-4" />,
      content: <PersonalizedInsights />
    }
  ];

  return (
    <CareerPageLayout
      // Hero props
      title="Career Path Comparison"
      description="Make informed career decisions by comparing different paths, analyzing market trends, and understanding growth opportunities with data-driven insights."
      heroIcon={<GitCompare className="h-12 w-12" />}
      primaryActionLabel="Start Comparison"
      primaryActionIcon={<GitCompare className="h-5 w-5" />}
      primaryActionOnClick={handlePrimaryAction}
      secondaryActionLabel="View Market Data"
      secondaryActionIcon={<BarChart3 className="h-5 w-5" />}
      secondaryActionOnClick={handleSecondaryAction}
      
      // Stats props
      stats={[
        { value: "500+", label: "Career Paths" },
        { value: "15+", label: "Industries Covered" },
        { value: "Real-time", label: "Market Data" },
        { value: "AI-Powered", label: "Insights" }
      ]}
      
      // Quote props
      quote="Every career path is unique - compare, analyze, and choose the journey that aligns with your dreams and values."
      attribution="UAE Career Excellence Initiative"
      quoteIcon={<Heart className="h-12 w-12" />}
      
      // Tabs props
      tabs={tabs}
      defaultTab="comparison"
    />
  );
};

export default CareerComparisonPage;
