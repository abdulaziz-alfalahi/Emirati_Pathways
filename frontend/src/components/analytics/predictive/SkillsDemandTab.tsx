
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SkillGapAnalysis from '@/components/analytics/SkillGapAnalysis';

export const SkillsDemandTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills Demand Forecasting</CardTitle>
        <CardDescription>
          Predicted skills requirements and gap analysis for strategic planning
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SkillGapAnalysis />
      </CardContent>
    </Card>
  );
};
