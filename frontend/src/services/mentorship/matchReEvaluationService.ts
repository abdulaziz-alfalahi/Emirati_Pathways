import { mentorshipService } from '../mentorshipService';
import type { MenteePreferences, MatchSuggestion } from '@/types/mentorship';

export class MatchReEvaluationService {
  // Track when profiles were last updated to trigger re-evaluation
  async scheduleReEvaluation(userId: string, triggerType: 'mentor_profile_update' | 'mentee_preferences_update'): Promise<void> {
    const { error } = await supabase
      .from('match_re_evaluation_queue')
      .insert({
        user_id: userId,
        trigger_type: triggerType,
        status: 'pending',
        scheduled_for: new Date().toISOString()
      });

    if (error) {
      console.error('Error scheduling re-evaluation:', error);
      throw error;
    }
  }

  // Re-evaluate matches for a specific user
  async reEvaluateMatches(userId: string, preferences: MenteePreferences): Promise<MatchSuggestion[]> {
    try {
      console.log(`Re-evaluating matches for user: ${userId}`);
      
      // Get fresh match suggestions
      const newSuggestions = await mentorshipService.getMatchSuggestions(preferences);
      
      // Store the new matches with timestamp
      await this.storeUpdatedMatches(userId, newSuggestions);
      
      // Mark re-evaluation as completed
      await this.markReEvaluationComplete(userId);
      
      return newSuggestions;
    } catch (error: any) {
      console.error('Error during match re-evaluation:', error);
      await this.markReEvaluationFailed(userId, error.message);
      throw error;
    }
  }

  // Check if user needs re-evaluation based on profile changes
  async checkIfReEvaluationNeeded(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('match_re_evaluation_queue')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .maybeSingle();

    if (error) {
      console.error('Error checking re-evaluation queue:', error);
      return false;
    }

    return !!data;
  }

  // Get the last time matches were evaluated for a user
  async getLastEvaluationTime(userId: string): Promise<Date | null> {
    const { data, error } = await supabase
      .from('match_evaluations')
      .select('evaluated_at')
      .eq('user_id', userId)
      .order('evaluated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error getting last evaluation time:', error);
      return null;
    }

    return data?.evaluated_at ? new Date(data.evaluated_at) : null;
  }

  // Store updated matches in the database
  private async storeUpdatedMatches(userId: string, suggestions: MatchSuggestion[]): Promise<void> {
    const { error } = await supabase
      .from('match_evaluations')
      .insert({
        user_id: userId,
        match_suggestions: JSON.parse(JSON.stringify(suggestions)) as any, // Properly serialize for JSON
        evaluated_at: new Date().toISOString(),
        suggestion_count: suggestions.length
      });

    if (error) {
      console.error('Error storing updated matches:', error);
      throw error;
    }
  }

  // Mark re-evaluation as completed
  private async markReEvaluationComplete(userId: string): Promise<void> {
    const { error } = await supabase
      .from('match_re_evaluation_queue')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error marking re-evaluation complete:', error);
    }
  }

  // Mark re-evaluation as failed
  private async markReEvaluationFailed(userId: string, errorMessage: string): Promise<void> {
    const { error } = await supabase
      .from('match_re_evaluation_queue')
      .update({
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error marking re-evaluation failed:', error);
    }
  }

  // Process pending re-evaluations (this could be called by a background job)
  async processPendingReEvaluations(): Promise<void> {
    const { data: pendingEvaluations, error } = await supabase
      .from('match_re_evaluation_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(10); // Process in batches

    if (error) {
      console.error('Error fetching pending re-evaluations:', error);
      return;
    }

    if (!pendingEvaluations || pendingEvaluations.length === 0) {
      return;
    }

    for (const evaluation of pendingEvaluations) {
      try {
        // For now, use default preferences since we don't have resume_data in profiles
        // This could be enhanced later to store actual user preferences
        const preferences: MenteePreferences = {
          desired_expertise: ['Software Development', 'Data Science'], // Default fallback
          career_goals: ['Skill Development'], // Default fallback
          preferred_communication: ['video_call'],
          availability: {
            days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            hours: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
            timezone: 'UTC+4 (UAE)'
          },
          experience_level: 'intermediate'
        };

        await this.reEvaluateMatches(evaluation.user_id, preferences);
      } catch (error) {
        console.error(`Failed to re-evaluate matches for user ${evaluation.user_id}:`, error);
      }
    }
  }
}

export const matchReEvaluationService = new MatchReEvaluationService();
