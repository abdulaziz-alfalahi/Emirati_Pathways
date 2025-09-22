
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import WorkforceAnalytics from '@/components/analytics/WorkforceAnalytics';

export const WorkforceForecastTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workforce Demand Forecasting</CardTitle>
        <CardDescription>
          Predictive analysis of workforce trends and employment opportunities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <WorkforceAnalytics />
      </CardContent>
    </Card>
  );
};
