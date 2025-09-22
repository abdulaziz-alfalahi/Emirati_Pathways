
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricItem {
  title: string;
  value: string;
  change?: string;
  description: string;
}

interface DashboardOverviewProps {
  metrics: MetricItem[];
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">{metric.title}</CardTitle>
            <CardDescription>{metric.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metric.value}</div>
            {metric.change && (
              <p className="text-xs text-muted-foreground mt-2">{metric.change}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardOverview;
