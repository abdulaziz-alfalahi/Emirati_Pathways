import type { 
  MentorshipSuccessMetric, 
  MentorshipGoal, 
  MentorshipProgressAssessment,
  SuccessMetricsAnalytics 
} from '@/types/mentorship';

export class SuccessMetricsService {
  // Success Metrics Management
  async recordSuccessMetric(metric: Omit<MentorshipSuccessMetric, 'id' | 'created_at'>): Promise<MentorshipSuccessMetric> {
    const { data, error } = await supabase
      .from('mentorship_success_metrics')
      .insert(metric)
      .select()
      .single();

    if (error) throw error;
    return data as MentorshipSuccessMetric;
  }

  async getSuccessMetrics(relationshipId: string): Promise<MentorshipSuccessMetric[]> {
    const { data, error } = await supabase
      .from('mentorship_success_metrics')
      .select('*')
      .eq('relationship_id', relationshipId)
      .order('recorded_at', { ascending: false });

    if (error) throw error;
    return (data || []) as MentorshipSuccessMetric[];
  }

  // Goals Management
  async createGoal(goal: Omit<MentorshipGoal, 'id' | 'created_at' | 'updated_at'>): Promise<MentorshipGoal> {
    const { data, error } = await supabase
      .from('mentorship_goals')
      .insert(goal)
      .select()
      .single();

    if (error) throw error;
    return data as MentorshipGoal;
  }

  async updateGoal(goalId: string, updates: Partial<MentorshipGoal>): Promise<MentorshipGoal> {
    const { data, error } = await supabase
      .from('mentorship_goals')
      .update(updates)
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;
    return data as MentorshipGoal;
  }

  async completeGoal(goalId: string): Promise<MentorshipGoal> {
    const { data, error } = await supabase
      .from('mentorship_goals')
      .update({
        status: 'completed',
        completion_percentage: 100,
        completed_at: new Date().toISOString()
      })
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;

    // Record a success metric for goal completion
    const goal = data as MentorshipGoal;
    await this.recordSuccessMetric({
      relationship_id: goal.relationship_id,
      metric_type: 'goal_completion',
      metric_value: 1,
      metric_details: { goal_id: goalId, goal_title: goal.title },
      recorded_at: new Date().toISOString(),
      recorded_by: goal.created_by
    });

    return goal;
  }

  async getGoalsForRelationship(relationshipId: string): Promise<MentorshipGoal[]> {
    const { data, error } = await supabase
      .from('mentorship_goals')
      .select('*')
      .eq('relationship_id', relationshipId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as MentorshipGoal[];
  }

  // Progress Assessments
  async createProgressAssessment(
    assessment: Omit<MentorshipProgressAssessment, 'id' | 'created_at'>
  ): Promise<MentorshipProgressAssessment> {
    const { data, error } = await supabase
      .from('mentorship_progress_assessments')
      .insert(assessment)
      .select()
      .single();

    if (error) throw error;

    // Record satisfaction metrics
    const assessmentData = data as MentorshipProgressAssessment;
    if (assessmentData.mentee_satisfaction) {
      await this.recordSuccessMetric({
        relationship_id: assessmentData.relationship_id,
        metric_type: 'satisfaction_rating',
        metric_value: assessmentData.mentee_satisfaction,
        metric_details: { 
          assessment_id: assessmentData.id, 
          assessment_period: assessmentData.assessment_period,
          type: 'mentee_satisfaction'
        },
        recorded_at: assessmentData.assessment_date,
        recorded_by: assessmentData.assessed_by
      });
    }

    if (assessmentData.skill_development_rating) {
      await this.recordSuccessMetric({
        relationship_id: assessmentData.relationship_id,
        metric_type: 'skill_improvement',
        metric_value: assessmentData.skill_development_rating,
        metric_details: { 
          assessment_id: assessmentData.id, 
          assessment_period: assessmentData.assessment_period 
        },
        recorded_at: assessmentData.assessment_date,
        recorded_by: assessmentData.assessed_by
      });
    }

    return assessmentData;
  }

  async getProgressAssessments(relationshipId: string): Promise<MentorshipProgressAssessment[]> {
    const { data, error } = await supabase
      .from('mentorship_progress_assessments')
      .select('*')
      .eq('relationship_id', relationshipId)
      .order('assessment_date', { ascending: false });

    if (error) throw error;
    return (data || []) as MentorshipProgressAssessment[];
  }

  // Analytics and Reporting
  async getSuccessAnalytics(relationshipId: string): Promise<SuccessMetricsAnalytics> {
    try {
      const [metrics, goals, assessments] = await Promise.all([
        this.getSuccessMetrics(relationshipId),
        this.getGoalsForRelationship(relationshipId),
        this.getProgressAssessments(relationshipId)
      ]);

      // Calculate overall satisfaction
      const satisfactionMetrics = metrics.filter(m => m.metric_type === 'satisfaction_rating');
      const overall_satisfaction = satisfactionMetrics.length > 0
        ? satisfactionMetrics.reduce((sum, m) => sum + m.metric_value, 0) / satisfactionMetrics.length
        : 0;

      // Calculate goal completion rate
      const completed_goals = goals.filter(g => g.status === 'completed').length;
      const total_goals = goals.length;
      const goal_completion_rate = total_goals > 0 ? (completed_goals / total_goals) * 100 : 0;

      // Calculate skill improvement average
      const skillMetrics = metrics.filter(m => m.metric_type === 'skill_improvement');
      const skill_improvement_average = skillMetrics.length > 0
        ? skillMetrics.reduce((sum, m) => sum + m.metric_value, 0) / skillMetrics.length
        : 0;

      // Generate trend data (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const recentMetrics = metrics.filter(m => 
        new Date(m.recorded_at) >= sixMonthsAgo
      );

      const satisfaction_trend = this.generateTrendData(
        recentMetrics.filter(m => m.metric_type === 'satisfaction_rating')
      );
      
      const goal_completion_trend = this.generateGoalCompletionTrend(
        goals.filter(g => g.completed_at && new Date(g.completed_at) >= sixMonthsAgo)
      );
      
      const skill_development_trend = this.generateTrendData(
        recentMetrics.filter(m => m.metric_type === 'skill_improvement')
      );

      return {
        overall_satisfaction,
        goal_completion_rate,
        skill_improvement_average,
        total_goals,
        completed_goals,
        active_goals: goals.filter(g => g.status === 'active').length,
        recent_assessments: assessments.slice(0, 5),
        trend_data: {
          satisfaction_trend,
          goal_completion_trend,
          skill_development_trend
        }
      };
    } catch (error) {
      console.error('Error generating success analytics:', error);
      throw error;
    }
  }

  private generateTrendData(metrics: MentorshipSuccessMetric[]): number[] {
    // Group metrics by month and calculate averages
    const monthlyData: { [key: string]: number[] } = {};
    
    metrics.forEach(metric => {
      const month = new Date(metric.recorded_at).toISOString().slice(0, 7);
      if (!monthlyData[month]) monthlyData[month] = [];
      monthlyData[month].push(metric.metric_value);
    });

    // Generate trend for last 6 months
    const trend: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7);
      
      if (monthlyData[monthKey]) {
        const average = monthlyData[monthKey].reduce((sum, val) => sum + val, 0) / monthlyData[monthKey].length;
        trend.push(average);
      } else {
        trend.push(0);
      }
    }

    return trend;
  }

  private generateGoalCompletionTrend(completedGoals: MentorshipGoal[]): number[] {
    // Count goals completed each month
    const monthlyCompletions: { [key: string]: number } = {};
    
    completedGoals.forEach(goal => {
      if (goal.completed_at) {
        const month = new Date(goal.completed_at).toISOString().slice(0, 7);
        monthlyCompletions[month] = (monthlyCompletions[month] || 0) + 1;
      }
    });

    // Generate trend for last 6 months
    const trend: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7);
      trend.push(monthlyCompletions[monthKey] || 0);
    }

    return trend;
  }

  // Helper method to record career progress
  async recordCareerProgress(
    relationshipId: string, 
    progressValue: number, 
    details: Record<string, any>
  ): Promise<void> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    await this.recordSuccessMetric({
      relationship_id: relationshipId,
      metric_type: 'career_progress',
      metric_value: progressValue,
      metric_details: details,
      recorded_at: new Date().toISOString(),
      recorded_by: user.user.id
    });
  }
}

export const successMetricsService = new SuccessMetricsService();
