
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Target, 
  Star, 
  Award, 
  BarChart3, 
  Calendar,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react';
import { successMetricsService } from '@/services/mentorship/successMetricsService';
import type { 
  SuccessMetricsAnalytics, 
  MentorshipGoal, 
  MentorshipProgressAssessment 
} from '@/types/mentorship';
import { useToast } from '@/hooks/use-toast';
import { GoalsManager } from './GoalsManager';
import { ProgressAssessmentForm } from './ProgressAssessmentForm';
import { MetricsChart } from './MetricsChart';

interface SuccessMetricsDashboardProps {
  relationshipId: string;
  isCurrentUserMentor: boolean;
}

export const SuccessMetricsDashboard: React.FC<SuccessMetricsDashboardProps> = ({
  relationshipId,
  isCurrentUserMentor
}) => {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<SuccessMetricsAnalytics | null>(null);
  const [goals, setGoals] = useState<MentorshipGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalytics();
  }, [relationshipId]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsData, goalsData] = await Promise.all([
        successMetricsService.getSuccessAnalytics(relationshipId),
        successMetricsService.getGoalsForRelationship(relationshipId)
      ]);
      
      setAnalytics(analyticsData);
      setGoals(goalsData);
    } catch (error) {
      console.error('Error loading success metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load success metrics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoalUpdate = () => {
    loadAnalytics(); // Refresh data when goals are updated
  };

  const handleAssessmentSubmitted = () => {
    loadAnalytics(); // Refresh data when assessment is submitted
    toast({
      title: "Success",
      description: "Progress assessment submitted successfully",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Analytics Available</h3>
            <p className="text-muted-foreground">Start setting goals and conducting assessments to see metrics.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overall_satisfaction.toFixed(1)}/5.0
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={analytics.overall_satisfaction * 20} className="flex-1" />
              <span className="text-sm text-muted-foreground">
                {Math.round(analytics.overall_satisfaction * 20)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goal Completion</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(analytics.goal_completion_rate)}%
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={analytics.goal_completion_rate} className="flex-1" />
              <span className="text-sm text-muted-foreground">
                {analytics.completed_goals}/{analytics.total_goals}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skill Development</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.skill_improvement_average.toFixed(1)}/5.0
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={analytics.skill_improvement_average * 20} className="flex-1" />
              <span className="text-sm text-muted-foreground">
                {Math.round(analytics.skill_improvement_average * 20)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.active_goals}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Goals in progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Recent Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {goals.slice(0, 3).map((goal) => (
                    <div key={goal.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{goal.title}</h4>
                          <Badge 
                            variant={goal.status === 'completed' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {goal.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={goal.completion_percentage} className="flex-1 h-2" />
                          <span className="text-xs text-muted-foreground">
                            {goal.completion_percentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {goals.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No goals set yet. Create your first goal to get started!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Assessments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Recent Assessments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.recent_assessments.map((assessment) => (
                    <div key={assessment.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {assessment.assessment_period}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(assessment.assessment_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {assessment.mentee_satisfaction && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Satisfaction:</span>
                            <span className="font-medium">{assessment.mentee_satisfaction}/5</span>
                          </div>
                        )}
                        {assessment.skill_development_rating && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Skill Dev:</span>
                            <span className="font-medium">{assessment.skill_development_rating}/5</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {analytics.recent_assessments.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No assessments conducted yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="goals">
          <GoalsManager 
            relationshipId={relationshipId}
            goals={goals}
            onGoalUpdate={handleGoalUpdate}
          />
        </TabsContent>

        <TabsContent value="assessments">
          <ProgressAssessmentForm
            relationshipId={relationshipId}
            isCurrentUserMentor={isCurrentUserMentor}
            onAssessmentSubmitted={handleAssessmentSubmitted}
          />
        </TabsContent>

        <TabsContent value="trends">
          <MetricsChart analytics={analytics} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
