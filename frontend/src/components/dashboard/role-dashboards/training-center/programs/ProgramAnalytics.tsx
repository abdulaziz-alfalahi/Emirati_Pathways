
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';

const ProgramAnalytics: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Program Analytics</CardTitle>
        <CardDescription>Performance metrics by program</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Most Popular Program</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Web Development</div>
                <p className="text-xs text-muted-foreground mt-1">128 trainees enrolled</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Highest Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Data Analysis</div>
                <p className="text-xs text-muted-foreground mt-1">96% completion rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Best Job Placement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Cloud Computing</div>
                <p className="text-xs text-muted-foreground mt-1">88% placement rate</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgramAnalytics;
