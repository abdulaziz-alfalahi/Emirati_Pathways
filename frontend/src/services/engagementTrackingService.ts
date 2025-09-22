
import { supabase } from '@/integrations/supabase/client';

export interface SessionAttendance {
  id: string;
  session_id: string;
  user_id: string;
  event_id: string;
  joined_at: string;
  left_at?: string;
  duration_seconds: number;
  engagement_score: number;
  interactions_count: number;
  created_at: string;
  updated_at: string;
}

export interface BoothInteraction {
  id: string;
  booth_id: string;
  user_id: string;
  event_id: string;
  interaction_type: 'view' | 'chat' | 'download' | 'video_call';
  interaction_data: Record<string, any>;
  duration_seconds: number;
  created_at: string;
}

export interface EngagementAnalytics {
  id: string;
  event_id: string;
  user_id: string;
  total_session_time: number;
  sessions_attended: number;
  booths_visited: number;
  questions_asked: number;
  polls_participated: number;
  networking_connections: number;
  overall_engagement_score: number;
  last_activity: string;
  created_at: string;
  updated_at: string;
}

export interface EventAnalytics {
  id: string;
  event_id: string;
  metric_type: string;
  metric_name: string;
  metric_value: number;
  dimensions: Record<string, any>;
  recorded_at: string;
}

export class EngagementTrackingService {
  static supabase = supabase;

  // Session Attendance Tracking
  static async startSessionAttendance(sessionId: string, eventId: string): Promise<SessionAttendance> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('session_attendance')
      .insert({
        session_id: sessionId,
        user_id: user.user.id,
        event_id: eventId,
        joined_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async endSessionAttendance(attendanceId: string): Promise<void> {
    const now = new Date().toISOString();
    
    // First get the current attendance record to calculate duration
    const { data: attendance } = await supabase
      .from('session_attendance')
      .select('joined_at, user_id, event_id')
      .eq('id', attendanceId)
      .single();

    if (!attendance) throw new Error('Attendance record not found');

    const joinedAt = new Date(attendance.joined_at);
    const leftAt = new Date(now);
    const durationSeconds = Math.floor((leftAt.getTime() - joinedAt.getTime()) / 1000);

    const { error } = await supabase
      .from('session_attendance')
      .update({
        left_at: now,
        duration_seconds: durationSeconds
      })
      .eq('id', attendanceId);

    if (error) throw error;

    // Update overall engagement analytics
    await this.updateEngagementAnalytics(attendance.user_id, attendance.event_id, {
      total_session_time: durationSeconds,
      sessions_attended: 1
    });
  }

  static async updateSessionEngagement(attendanceId: string, interactionsCount: number): Promise<void> {
    // Calculate engagement score based on interactions and duration
    const engagementScore = Math.min(interactionsCount * 10, 100);

    const { error } = await supabase
      .from('session_attendance')
      .update({
        interactions_count: interactionsCount,
        engagement_score: engagementScore
      })
      .eq('id', attendanceId);

    if (error) throw error;
  }

  // Booth Interaction Tracking
  static async trackBoothInteraction(
    boothId: string,
    eventId: string,
    interactionType: BoothInteraction['interaction_type'],
    interactionData: Record<string, any> = {},
    durationSeconds: number = 0
  ): Promise<BoothInteraction> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('booth_interaction_tracking')
      .insert({
        booth_id: boothId,
        user_id: user.user.id,
        event_id: eventId,
        interaction_type: interactionType,
        interaction_data: interactionData,
        duration_seconds: durationSeconds
      })
      .select()
      .single();

    if (error) throw error;

    // Update engagement analytics
    await this.updateEngagementAnalytics(user.user.id, eventId, {
      booths_visited: interactionType === 'view' ? 1 : 0
    });

    return {
      ...data,
      interaction_data: data.interaction_data as Record<string, any>,
      interaction_type: data.interaction_type as BoothInteraction['interaction_type']
    };
  }

  static async getBoothInteractionHeatmap(eventId: string): Promise<Record<string, any>> {
    const { data, error } = await supabase
      .from('booth_interaction_tracking')
      .select('booth_id, interaction_type, duration_seconds')
      .eq('event_id', eventId);

    if (error) throw error;

    // Process data to create heatmap
    const heatmap: Record<string, any> = {};
    
    data?.forEach(interaction => {
      if (!heatmap[interaction.booth_id]) {
        heatmap[interaction.booth_id] = {
          total_interactions: 0,
          total_duration: 0,
          interaction_types: {}
        };
      }
      
      heatmap[interaction.booth_id].total_interactions++;
      heatmap[interaction.booth_id].total_duration += interaction.duration_seconds;
      
      if (!heatmap[interaction.booth_id].interaction_types[interaction.interaction_type]) {
        heatmap[interaction.booth_id].interaction_types[interaction.interaction_type] = 0;
      }
      heatmap[interaction.booth_id].interaction_types[interaction.interaction_type]++;
    });

    return heatmap;
  }

  // Engagement Analytics
  static async updateEngagementAnalytics(
    userId: string,
    eventId: string,
    updates: Partial<EngagementAnalytics>
  ): Promise<void> {
    // Get existing analytics or create new
    const { data: existing } = await supabase
      .from('engagement_analytics')
      .select('*')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .single();

    if (existing) {
      // Update existing record
      const updatedData = {
        total_session_time: (existing.total_session_time || 0) + (updates.total_session_time || 0),
        sessions_attended: (existing.sessions_attended || 0) + (updates.sessions_attended || 0),
        booths_visited: (existing.booths_visited || 0) + (updates.booths_visited || 0),
        questions_asked: (existing.questions_asked || 0) + (updates.questions_asked || 0),
        polls_participated: (existing.polls_participated || 0) + (updates.polls_participated || 0),
        networking_connections: (existing.networking_connections || 0) + (updates.networking_connections || 0),
        last_activity: new Date().toISOString(),
        overall_engagement_score: 0 // Will be calculated below
      };

      // Calculate overall engagement score
      updatedData.overall_engagement_score = this.calculateEngagementScore(updatedData);

      const { error } = await supabase
        .from('engagement_analytics')
        .update(updatedData)
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Create new record
      const newData = {
        user_id: userId,
        event_id: eventId,
        total_session_time: updates.total_session_time || 0,
        sessions_attended: updates.sessions_attended || 0,
        booths_visited: updates.booths_visited || 0,
        questions_asked: updates.questions_asked || 0,
        polls_participated: updates.polls_participated || 0,
        networking_connections: updates.networking_connections || 0,
        last_activity: new Date().toISOString(),
        overall_engagement_score: 0 // Will be calculated below
      };

      newData.overall_engagement_score = this.calculateEngagementScore(newData);

      const { error } = await supabase
        .from('engagement_analytics')
        .insert(newData);

      if (error) throw error;
    }
  }

  static calculateEngagementScore(analytics: any): number {
    const weights = {
      session_time: 0.3,
      sessions: 0.2,
      booths: 0.15,
      questions: 0.15,
      polls: 0.1,
      networking: 0.1
    };

    // Normalize values (assuming max values for scoring)
    const normalized = {
      session_time: Math.min((analytics.total_session_time || 0) / 3600, 1), // Max 1 hour
      sessions: Math.min((analytics.sessions_attended || 0) / 5, 1), // Max 5 sessions
      booths: Math.min((analytics.booths_visited || 0) / 10, 1), // Max 10 booths
      questions: Math.min((analytics.questions_asked || 0) / 5, 1), // Max 5 questions
      polls: Math.min((analytics.polls_participated || 0) / 3, 1), // Max 3 polls
      networking: Math.min((analytics.networking_connections || 0) / 10, 1) // Max 10 connections
    };

    const score = Object.entries(weights).reduce((total, [key, weight]) => {
      return total + (normalized[key] * weight * 100);
    }, 0);

    return Math.round(score);
  }

  static async getUserEngagementAnalytics(userId: string, eventId: string): Promise<EngagementAnalytics | null> {
    const { data, error } = await supabase
      .from('engagement_analytics')
      .select('*')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .single();

    if (error) return null;
    return data;
  }

  // Event Analytics
  static async recordEventAnalytic(
    eventId: string,
    metricType: string,
    metricName: string,
    metricValue: number,
    dimensions: Record<string, any> = {}
  ): Promise<void> {
    const { error } = await supabase
      .from('event_analytics')
      .insert({
        event_id: eventId,
        metric_type: metricType,
        metric_name: metricName,
        metric_value: metricValue,
        dimensions
      });

    if (error) throw error;
  }

  static async getEventAnalytics(eventId: string): Promise<EventAnalytics[]> {
    const { data, error } = await supabase
      .from('event_analytics')
      .select('*')
      .eq('event_id', eventId)
      .order('recorded_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(item => ({
      ...item,
      dimensions: item.dimensions as Record<string, any>
    }));
  }

  static async getEngagementLeaderboard(eventId: string, limit: number = 10): Promise<any[]> {
    const { data, error } = await supabase
      .from('engagement_analytics')
      .select(`
        *,
        profiles(full_name, avatar_url)
      `)
      .eq('event_id', eventId)
      .order('overall_engagement_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
}
