
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MarketTrendsChart from '@/components/analytics/MarketTrendsChart';

export const SectorGrowthTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sector Growth Projections</CardTitle>
        <CardDescription>
          Industry-specific growth forecasts and market opportunities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MarketTrendsChart />
      </CardContent>
    </Card>
  );
};
