
import React from 'react';
import { CareerPageLayout } from '@/components/career/CareerPageLayout';
import { SalaryBenchmarkTool } from '@/components/salary-explorer/SalaryBenchmarkTool';
import { MarketTrendsAnalysis } from '@/components/salary-explorer/MarketTrendsAnalysis';
import { CompensationBreakdown } from '@/components/salary-explorer/CompensationBreakdown';
import { LocationComparison } from '@/components/salary-explorer/LocationComparison';
import { NegotiationGuidance } from '@/components/salary-explorer/NegotiationGuidance';
import { PersonalizedReport } from '@/components/salary-explorer/PersonalizedReport';
import { DollarSign, BarChart3, MapPin, TrendingUp, Target, FileText } from 'lucide-react';

const SalaryExplorerPage: React.FC = () => {
  const handlePrimaryAction = () => {
    console.log('Start salary exploration');
  };

  const handleSecondaryAction = () => {
    console.log('Benchmark salary');
  };

  // Define tabs for the Career Entry layout
  const tabs = [
    {
      id: 'benchmark',
      label: 'Benchmark',
      icon: <BarChart3 className="h-4 w-4" />,
      content: <SalaryBenchmarkTool />
    },
    {
      id: 'trends',
      label: 'Trends',
      icon: <TrendingUp className="h-4 w-4" />,
      content: <MarketTrendsAnalysis />
    },
    {
      id: 'compensation',
      label: 'Compensation',
      icon: <DollarSign className="h-4 w-4" />,
      content: <CompensationBreakdown />
    },
    {
      id: 'location',
      label: 'Location',
      icon: <MapPin className="h-4 w-4" />,
      content: <LocationComparison />
    },
    {
      id: 'negotiation',
      label: 'Negotiation',
      icon: <Target className="h-4 w-4" />,
      content: <NegotiationGuidance />
    },
    {
      id: 'report',
      label: 'Report',
      icon: <FileText className="h-4 w-4" />,
      content: <PersonalizedReport />
    }
  ];

  return (
    <CareerPageLayout
      // Hero props
      title="UAE Salary Explorer"
      description="Make informed salary decisions with comprehensive market data, personalized insights, and negotiation tools tailored for the UAE job market."
      heroIcon={<DollarSign className="h-12 w-12" />}
      primaryActionLabel="Explore Salaries"
      primaryActionIcon={<BarChart3 className="h-5 w-5" />}
      primaryActionOnClick={handlePrimaryAction}
      secondaryActionLabel="Benchmark My Salary"
      secondaryActionIcon={<Target className="h-5 w-5" />}
      secondaryActionOnClick={handleSecondaryAction}
      
      // Stats props
      stats={[
        { value: "500K+", label: "Salary Data Points" },
        { value: "Real-time", label: "Market Updates" },
        { value: "15+", label: "Industry Sectors" },
        { value: "AI-Powered", label: "Insights" }
      ]}
      
      // Quote props
      quote="Knowledge is power in salary negotiations—make informed decisions with real market data and strategic insights."
      attribution="UAE Career Excellence Initiative"
      quoteIcon={<DollarSign className="h-12 w-12" />}
      
      // Tabs props
      tabs={tabs}
      defaultTab="benchmark"
    />
  );
};

export default SalaryExplorerPage;
