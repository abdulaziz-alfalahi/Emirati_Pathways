/**
 * Optimized assessment service to resolve N+1 query problems
 * Uses RPC functions and optimized queries for efficient data fetching
 */

export interface UserAssessmentPerformance {
  assessment_id: string;
  assessment_title: string;
  session_count: number;
  average_score: number;
  latest_session_date: string | null;
  coaching_recommended_count: number;
}

/**
 * Get user's assessment performance overview using optimized RPC function
 * OPTIMIZED: Resolves N+1 query problem for assessment performance data
 */
export const getUserAssessmentPerformance = async (userId: string): Promise<UserAssessmentPerformance[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_user_assessment_performance', { target_user_id: userId });

    if (error) {
      console.error("Error fetching user assessment performance:", error);
      throw error;
    }

    return (data || []).map((item: any) => ({
      assessment_id: item.assessment_id,
      assessment_title: item.assessment_title,
      session_count: item.session_count,
      average_score: item.average_score,
      latest_session_date: item.latest_session_date,
      coaching_recommended_count: item.coaching_recommended_count
    }));
  } catch (error) {
    console.error("Exception in getUserAssessmentPerformance:", error);
    throw error;
  }
};

/**
 * Get assessment analytics for training centers with optimized queries
 */
export const getAssessmentAnalytics = async (centerId: string) => {
  try {
    // Get all relevant data in parallel optimized queries
    const [assessmentsResult, sessionsResult, candidateStatsResult] = await Promise.all([
      // Get assessments created by this center
      supabase
        .from('assessments')
        .select('id, title, assessment_type, created_at, is_active')
        .eq('center_id', centerId)
        .eq('is_active', true),
      
      // Get session statistics for all assessments by this center
      supabase
        .from('assessment_sessions')
        .select(`
          id,
          assessment_id,
          user_id,
          status,
          score,
          completed_date,
          coaching_recommended,
          assessments!inner(center_id)
        `)
        .eq('assessments.center_id', centerId)
        .gte('completed_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()), // Last 90 days
      
      // Get unique candidate count
      supabase
        .from('assessment_sessions')
        .select(`
          user_id,
          assessments!inner(center_id)
        `)
        .eq('assessments.center_id', centerId)
        .eq('status', 'completed')
    ]);

    if (assessmentsResult.error || sessionsResult.error || candidateStatsResult.error) {
      console.error("Error fetching assessment analytics:", {
        assessmentsError: assessmentsResult.error,
        sessionsError: sessionsResult.error,
        candidateStatsError: candidateStatsResult.error
      });
      throw new Error("Failed to fetch assessment analytics");
    }

    const assessments = assessmentsResult.data || [];
    const sessions = sessionsResult.data || [];
    const candidateData = candidateStatsResult.data || [];

    // Calculate analytics
    const completedSessions = sessions.filter(s => s.status === 'completed');
    const uniqueCandidates = new Set(candidateData.map(c => c.user_id)).size;
    
    const assessmentStats = assessments.map(assessment => {
      const assessmentSessions = sessions.filter(s => s.assessment_id === assessment.id);
      const completed = assessmentSessions.filter(s => s.status === 'completed');
      
      return {
        id: assessment.id,
        title: assessment.title,
        type: assessment.assessment_type,
        totalSessions: assessmentSessions.length,
        completedSessions: completed.length,
        averageScore: completed.length > 0 
          ? completed.reduce((sum, s) => sum + (s.score || 0), 0) / completed.length 
          : 0,
        coachingRecommendations: completed.filter(s => s.coaching_recommended).length,
        completionRate: assessmentSessions.length > 0 
          ? completed.length / assessmentSessions.length 
          : 0
      };
    });

    return {
      totalAssessments: assessments.length,
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      uniqueCandidates,
      averageScore: completedSessions.length > 0 
        ? completedSessions.reduce((sum, s) => sum + (s.score || 0), 0) / completedSessions.length 
        : 0,
      coachingRecommendations: completedSessions.filter(s => s.coaching_recommended).length,
      assessmentBreakdown: assessmentStats,
      monthlyTrend: generateMonthlyTrend(sessions)
    };
  } catch (error) {
    console.error("Error in getAssessmentAnalytics:", error);
    throw error;
  }
};

/**
 * Get candidate assessment history with optimized query
 */
export const getCandidateAssessmentHistory = async (userId: string, limit: number = 20) => {
  try {
    const { data, error } = await supabase
      .from('assessment_sessions')
      .select(`
        id,
        score,
        status,
        completed_date,
        coaching_recommended,
        feedback,
        assessments (
          id,
          title,
          assessment_type,
          center_id
        )
      `)
      .eq('user_id', userId)
      .order('completed_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching candidate assessment history:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getCandidateAssessmentHistory:", error);
    throw error;
  }
};

/**
 * Helper function to generate monthly trend data
 */
function generateMonthlyTrend(sessions: any[]) {
  const now = new Date();
  const monthlyData: Record<string, { completed: number; total: number }> = {};
  
  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = date.toISOString().substring(0, 7); // YYYY-MM format
    monthlyData[monthKey] = { completed: 0, total: 0 };
  }

  sessions.forEach(session => {
    const sessionDate = new Date(session.completed_date || session.created_at);
    const monthKey = sessionDate.toISOString().substring(0, 7);
    
    if (monthlyData[monthKey]) {
      monthlyData[monthKey].total++;
      if (session.status === 'completed') {
        monthlyData[monthKey].completed++;
      }
    }
  });

  return Object.entries(monthlyData).map(([month, data]) => ({
    month,
    completed: data.completed,
    total: data.total,
    completionRate: data.total > 0 ? data.completed / data.total : 0
  }));
}
