import { supabase } from "@/integrations/supabase/client";
import { CareerAdvisor } from "@/types/careerAdvisory";

/**
 * Optimized career advisory service to resolve N+1 query problems
 * Uses RPC functions for efficient data fetching
 */

export interface AdvisorWithSessionCounts extends CareerAdvisor {
  session_counts: {
    scheduled: number;
    completed: number;
    cancelled: number;
    total: number;
    average_rating: number;
  };
}

/**
 * Get advisors with session counts using optimized RPC function
 * OPTIMIZED: Resolves N+1 query problem for session counts
 */
export const getAdvisorsWithSessionCounts = async (): Promise<AdvisorWithSessionCounts[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_advisors_with_session_counts');

    if (error) {
      console.error("Error fetching advisors with session counts:", error);
      throw error;
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      specialization: item.specialization,
      bio: item.bio,
      availability: item.availability,
      is_active: item.is_active,
      created_at: item.created_at,
      updated_at: item.updated_at,
      session_counts: item.session_counts
    }));
  } catch (error) {
    console.error("Exception in getAdvisorsWithSessionCounts:", error);
    throw error;
  }
};

/**
 * Get advisor performance metrics in a single optimized query
 */
export const getAdvisorPerformanceMetrics = async (advisorId: string) => {
  try {
    const { data, error } = await supabase
      .from('advisory_sessions')
      .select(`
        id,
        status,
        rating,
        scheduled_date,
        completed_date,
        topic
      `)
      .eq('advisor_id', advisorId);

    if (error) {
      console.error("Error fetching advisor performance metrics:", error);
      throw error;
    }

    const sessions = data || [];
    
    const metrics = {
      totalSessions: sessions.length,
      completedSessions: sessions.filter(s => s.status === 'completed').length,
      cancelledSessions: sessions.filter(s => s.status === 'cancelled').length,
      scheduledSessions: sessions.filter(s => s.status === 'scheduled').length,
      averageRating: 0,
      monthlyTrend: [] as Array<{ month: string; sessions: number; rating: number }>
    };

    // Calculate average rating
    const ratedSessions = sessions.filter(s => s.rating !== null);
    if (ratedSessions.length > 0) {
      metrics.averageRating = ratedSessions.reduce((sum, s) => sum + (s.rating || 0), 0) / ratedSessions.length;
    }

    // Calculate monthly trend for the last 6 months
    const now = new Date();
    const monthlyData: Record<string, { sessions: number; ratings: number[] }> = {};
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().substring(0, 7); // YYYY-MM format
      monthlyData[monthKey] = { sessions: 0, ratings: [] };
    }

    sessions.forEach(session => {
      const sessionDate = new Date(session.completed_date || session.scheduled_date);
      const monthKey = sessionDate.toISOString().substring(0, 7);
      
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].sessions++;
        if (session.rating) {
          monthlyData[monthKey].ratings.push(session.rating);
        }
      }
    });

    metrics.monthlyTrend = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      sessions: data.sessions,
      rating: data.ratings.length > 0 
        ? data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length 
        : 0
    }));

    return metrics;
  } catch (error) {
    console.error("Error in getAdvisorPerformanceMetrics:", error);
    throw error;
  }
};

/**
 * Get upcoming sessions for an advisor with user details in a single query
 */
export const getAdvisorUpcomingSessions = async (advisorId: string) => {
  try {
    const { data, error } = await supabase
      .from('advisory_sessions')
      .select(`
        id,
        topic,
        scheduled_date,
        status,
        details,
        user_id,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .eq('advisor_id', advisorId)
      .eq('status', 'scheduled')
      .gte('scheduled_date', new Date().toISOString())
      .order('scheduled_date', { ascending: true })
      .limit(10);

    if (error) {
      console.error("Error fetching advisor upcoming sessions:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getAdvisorUpcomingSessions:", error);
    throw error;
  }
};

/**
 * Get platform-wide advisory statistics in optimized queries
 */
export const getAdvisoryPlatformStatistics = async () => {
  try {
    // Get all statistics in parallel optimized queries
    const [advisorsResult, sessionsResult, ratingsResult] = await Promise.all([
      supabase
        .from('career_advisors')
        .select('id, is_active, specialization')
        .eq('is_active', true),
      
      supabase
        .from('advisory_sessions')
        .select('id, status, rating, completed_date')
        .gte('completed_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()), // Last 30 days
      
      supabase
        .from('advisory_sessions')
        .select('rating')
        .not('rating', 'is', null)
    ]);

    if (advisorsResult.error || sessionsResult.error || ratingsResult.error) {
      console.error("Error fetching platform statistics:", {
        advisorsError: advisorsResult.error,
        sessionsError: sessionsResult.error,
        ratingsError: ratingsResult.error
      });
      throw new Error("Failed to fetch platform statistics");
    }

    const advisors = advisorsResult.data || [];
    const recentSessions = sessionsResult.data || [];
    const allRatings = ratingsResult.data || [];

    // Calculate specialization distribution
    const specializationCounts: Record<string, number> = {};
    advisors.forEach(advisor => {
      specializationCounts[advisor.specialization] = (specializationCounts[advisor.specialization] || 0) + 1;
    });

    return {
      totalActiveAdvisors: advisors.length,
      monthlySessionsCompleted: recentSessions.filter(s => s.status === 'completed').length,
      averagePlatformRating: allRatings.length > 0 
        ? allRatings.reduce((sum, r) => sum + (r.rating || 0), 0) / allRatings.length 
        : 0,
      specializationDistribution: Object.entries(specializationCounts)
        .map(([specialization, count]) => ({ specialization, count }))
        .sort((a, b) => b.count - a.count),
      sessionCompletionRate: recentSessions.length > 0 
        ? recentSessions.filter(s => s.status === 'completed').length / recentSessions.length 
        : 0
    };
  } catch (error) {
    console.error("Error in getAdvisoryPlatformStatistics:", error);
    throw error;
  }
};
