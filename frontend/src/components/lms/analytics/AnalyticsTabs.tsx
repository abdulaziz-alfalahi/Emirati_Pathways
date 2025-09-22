
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, TrendingUp, Clock, Award } from 'lucide-react';
import { EngagementChart } from './EngagementChart';
import { CompletionRatesChart } from './CompletionRatesChart';
import { LearningPatternsChart } from './LearningPatternsChart';
import { CoursePerformanceTable } from './CoursePerformanceTable';

interface AnalyticsData {
  engagementTrend: Array<{ date: string; engagement: number }>;
  completionRates: Array<{ course: string; rate: number }>;
  learningPatterns: Array<{ timeSlot: string; activity: number }>;
}

interface AnalyticsTabsProps {
  data: AnalyticsData;
}

export const AnalyticsTabs: React.FC<AnalyticsTabsProps> = ({ data }) => {
  return (
    <Tabs defaultValue="engagement" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="engagement">Engagement</TabsTrigger>
        <TabsTrigger value="completion">Completion Rates</TabsTrigger>
        <TabsTrigger value="patterns">Learning Patterns</TabsTrigger>
        <TabsTrigger value="performance">Course Performance</TabsTrigger>
      </TabsList>

      <TabsContent value="engagement" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Engagement Trends
            </CardTitle>
            <CardDescription>
              Daily engagement levels across all courses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EngagementChart data={data.engagementTrend} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="completion" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Course Completion Rates
            </CardTitle>
            <CardDescription>
              Completion rates by course over the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CompletionRatesChart data={data.completionRates} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="patterns" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Learning Activity Patterns
            </CardTitle>
            <CardDescription>
              When learners are most active throughout the day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LearningPatternsChart data={data.learningPatterns} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="performance" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Course Performance Overview
            </CardTitle>
            <CardDescription>
              Detailed performance metrics for each course
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CoursePerformanceTable />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
