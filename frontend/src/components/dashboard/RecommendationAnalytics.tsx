
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity } from 'lucide-react';
import { getActiveTests, getTestResults, getUserTestAssignment } from '@/services/abTestingService';
import { getUserFeedbackStats } from '@/services/recommendationFeedbackService';
import { useAuth } from '@/context/AuthContext';
import AnalyticsOverviewCards from './analytics/AnalyticsOverviewCards';
import ABTestsTab from './analytics/ABTestsTab';
import FeedbackTab from './analytics/FeedbackTab';
import { formatChartData, formatTooltipValue } from './analytics/AnalyticsUtils';

const RecommendationAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [activeTests, setActiveTests] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [userStats, setUserStats] = useState<any>(null);
  const [userAssignment, setUserAssignment] = useState<any>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, [user]);

  const loadAnalyticsData = async () => {
    if (!user) return;

    try {
      // Load active tests
      const tests = getActiveTests();
      setActiveTests(tests);

      // Load test results for each active test
      const results: Record<string, any> = {};
      for (const test of tests) {
        results[test.id] = getTestResults(test.id);
      }
      setTestResults(results);

      // Load user feedback stats
      const stats = await getUserFeedbackStats(user.id);
      setUserStats(stats);

      // Get user's current test assignment
      if (tests.length > 0) {
        const assignment = getUserTestAssignment(user.id, tests[0].id);
        setUserAssignment(assignment);
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recommendation Analytics</CardTitle>
          <CardDescription>Login to view analytics</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="me-2 h-5 w-5" />
            Recommendation Analytics Dashboard
          </CardTitle>
          <CardDescription>
            Performance metrics and A/B testing results for recommendation algorithms
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="abtests">A/B Tests</TabsTrigger>
          <TabsTrigger value="feedback">User Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <AnalyticsOverviewCards 
            userAssignment={userAssignment}
            userStats={userStats}
          />
        </TabsContent>

        <TabsContent value="abtests" className="space-y-4">
          <ABTestsTab
            activeTests={activeTests}
            testResults={testResults}
            formatChartData={formatChartData}
            formatTooltipValue={formatTooltipValue}
          />
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <FeedbackTab />
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Want to see more insights?</h3>
              <p className="text-sm text-muted-foreground">
                Continue providing feedback to unlock detailed analytics
              </p>
            </div>
            <Button onClick={loadAnalyticsData} variant="outline">
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecommendationAnalytics;
