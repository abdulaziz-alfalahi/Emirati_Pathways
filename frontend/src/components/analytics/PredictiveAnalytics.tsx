import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PredictiveAnalyticsHeader } from './predictive/PredictiveAnalyticsHeader';
import { KeyPredictionsSummary } from './predictive/KeyPredictionsSummary';
import { WorkforceForecastTab } from './predictive/WorkforceForecastTab';
import { SkillsDemandTab } from './predictive/SkillsDemandTab';
import { SectorGrowthTab } from './predictive/SectorGrowthTab';
import { EmiratizationTab } from './predictive/EmiratizationTab';

interface PredictiveAnalyticsProps {
  selectedFilters?: {
    emirate: string;
    sector: string;
    timeframe: string;
  };
}

export const PredictiveAnalytics: React.FC<PredictiveAnalyticsProps> = ({
  selectedFilters = { emirate: 'all', sector: 'all', timeframe: '2024' }
}) => {
  const [selectedTimeHorizon, setSelectedTimeHorizon] = useState('5-year');
  const [selectedModel, setSelectedModel] = useState('ml-ensemble');

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <PredictiveAnalyticsHeader
        selectedTimeHorizon={selectedTimeHorizon}
        onTimeHorizonChange={setSelectedTimeHorizon}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />

      {/* Key Predictions Summary */}
      <KeyPredictionsSummary />

      <Tabs defaultValue="workforce-forecast" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workforce-forecast">Workforce Forecast</TabsTrigger>
          <TabsTrigger value="skills-demand">Skills Demand</TabsTrigger>
          <TabsTrigger value="sector-growth">Sector Growth</TabsTrigger>
          <TabsTrigger value="emiratization">Emiratization</TabsTrigger>
        </TabsList>

        <TabsContent value="workforce-forecast" className="space-y-6">
          <WorkforceForecastTab />
        </TabsContent>

        <TabsContent value="skills-demand" className="space-y-6">
          <SkillsDemandTab />
        </TabsContent>

        <TabsContent value="sector-growth" className="space-y-6">
          <SectorGrowthTab />
        </TabsContent>

        <TabsContent value="emiratization" className="space-y-6">
          <EmiratizationTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};
