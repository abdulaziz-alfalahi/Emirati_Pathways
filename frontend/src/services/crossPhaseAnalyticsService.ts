import { useAuth } from '@/context/AuthContext';

export interface AnalyticsEvent {
  phase: string;
  event_type: string;
  event_data: Record<string, any>;
  session_id: string;
}

export interface PhaseTransition {
  from_phase?: string;
  to_phase: string;
  transition_reason?: string;
  readiness_score?: number;
  completion_percentage?: number;
  transition_data?: Record<string, any>;
}

export interface FeatureUsage {
  feature_name: string;
  phase: string;
  action_type: string;
  duration_seconds?: number;
  success_rate?: number;
  error_data?: Record<string, any>;
  usage_context?: Record<string, any>;
}

export interface UserMilestone {
  phase: string;
  milestone_type: string;
  milestone_name: string;
  milestone_data?: Record<string, any>;
  points_earned?: number;
}

export interface ConsentSettings {
  essential_analytics: boolean;
  performance_analytics: boolean;
  personalization_analytics: boolean;
  marketing_analytics: boolean;
}

class CrossPhaseAnalyticsService {
  private sessionId: string;
  private isTrackingEnabled: boolean = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeTracking();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async initializeTracking() {
    try {
      // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const consent = await this.getAnalyticsConsent(user.user.id);
        this.isTrackingEnabled = consent?.essential_analytics || false;
      }
    } catch (error) {
      console.warn('Failed to initialize analytics tracking:', error);
      // Default to disabled tracking if initialization fails
      this.isTrackingEnabled = false;
    }
  }

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.isTrackingEnabled) return;

    try {
      // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // TODO: Connect to Flask API - await supabase.from('user_journey_analytics').insert({
        user_id: user.user.id,
        phase: event.phase,
        event_type: event.event_type,
        event_data: event.event_data,
        session_id: this.sessionId,
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.warn('Failed to track analytics event:', error);
    }
  }

  async trackPhaseTransition(transition: PhaseTransition): Promise<void> {
    if (!this.isTrackingEnabled) return;

    try {
      // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // TODO: Connect to Flask API - await supabase.from('phase_transitions').insert({
        user_id: user.user.id,
        from_phase: transition.from_phase,
        to_phase: transition.to_phase,
        transition_reason: transition.transition_reason,
        readiness_score: transition.readiness_score,
        completion_percentage: transition.completion_percentage,
        transition_data: transition.transition_data || {}
      });
    } catch (error) {
      console.warn('Failed to track phase transition:', error);
    }
  }

  async trackFeatureUsage(usage: FeatureUsage): Promise<void> {
    if (!this.isTrackingEnabled) return;

    try {
      // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
      
      // TODO: Connect to Flask API - await supabase.from('feature_usage_analytics').insert({
        user_id: user.user?.id,
        feature_name: usage.feature_name,
        phase: usage.phase,
        action_type: usage.action_type,
        duration_seconds: usage.duration_seconds,
        success_rate: usage.success_rate,
        error_data: usage.error_data,
        usage_context: usage.usage_context || {}
      });
    } catch (error) {
      console.warn('Failed to track feature usage:', error);
    }
  }

  async trackMilestone(milestone: UserMilestone): Promise<void> {
    if (!this.isTrackingEnabled) return;

    try {
      // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // TODO: Connect to Flask API - await supabase.from('user_journey_milestones').insert({
        user_id: user.user.id,
        phase: milestone.phase,
        milestone_type: milestone.milestone_type,
        milestone_name: milestone.milestone_name,
        milestone_data: milestone.milestone_data || {},
        points_earned: milestone.points_earned || 0
      });
    } catch (error) {
      console.warn('Failed to track milestone:', error);
    }
  }

  async updateAnalyticsConsent(consent: ConsentSettings): Promise<void> {
    try {
      // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // TODO: Connect to Flask API - await supabase.from('analytics_consent').upsert({
        user_id: user.user.id,
        essential_analytics: consent.essential_analytics,
        performance_analytics: consent.performance_analytics,
        personalization_analytics: consent.personalization_analytics,
        marketing_analytics: consent.marketing_analytics,
        consent_updated_at: new Date().toISOString(),
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent
      });

      this.isTrackingEnabled = consent.essential_analytics;
    } catch (error) {
      console.warn('Failed to update analytics consent:', error);
    }
  }

  // FIXED: This method was causing the 406 error
  async getAnalyticsConsent(userId: string): Promise<ConsentSettings | null> {
    try {
      // Remove .single() and handle the case where no record exists
      const { data, error } = await supabase
        .from('analytics_consent')
        .select('*')
        .eq('user_id', userId)
        .limit(1);

      // Handle different error cases
      if (error) {
        console.warn('Error fetching analytics consent:', error);
        return this.getDefaultConsentSettings();
      }

      // If no data exists, return default settings
      if (!data || data.length === 0) {
        console.info('No analytics consent record found, using defaults');
        return this.getDefaultConsentSettings();
      }

      // Return the first (and should be only) record
      const consentRecord = data[0];
      return {
        essential_analytics: consentRecord.essential_analytics,
        performance_analytics: consentRecord.performance_analytics,
        personalization_analytics: consentRecord.personalization_analytics,
        marketing_analytics: consentRecord.marketing_analytics
      };
    } catch (error) {
      console.warn('Failed to get analytics consent:', error);
      return this.getDefaultConsentSettings();
    }
  }

  // NEW: Helper method to provide default consent settings
  private getDefaultConsentSettings(): ConsentSettings {
    return {
      essential_analytics: false,
      performance_analytics: false,
      personalization_analytics: false,
      marketing_analytics: false
    };
  }

  // NEW: Method to create initial consent record for new users
  async createInitialConsentRecord(userId: string): Promise<void> {
    try {
      const defaultSettings = this.getDefaultConsentSettings();
      // TODO: Connect to Flask API - await supabase.from('analytics_consent').insert({
        user_id: userId,
        essential_analytics: defaultSettings.essential_analytics,
        performance_analytics: defaultSettings.performance_analytics,
        personalization_analytics: defaultSettings.personalization_analytics,
        marketing_analytics: defaultSettings.marketing_analytics,
        consent_updated_at: new Date().toISOString(),
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.warn('Failed to create initial consent record:', error);
    }
  }

  async getUserJourneyAnalytics(userId: string, timeRange?: { start: Date; end: Date }) {
    try {
      let query = supabase
        .from('user_journey_analytics')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (timeRange) {
        query = query
          .gte('created_at', timeRange.start.toISOString())
          .lte('created_at', timeRange.end.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Failed to get user journey analytics:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.warn('Failed to get user journey analytics:', error);
      return [];
    }
  }

  async getPhaseTransitions(userId: string, timeRange?: { start: Date; end: Date }) {
    try {
      let query = supabase
        .from('phase_transitions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (timeRange) {
        query = query
          .gte('created_at', timeRange.start.toISOString())
          .lte('created_at', timeRange.end.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Failed to get phase transitions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.warn('Failed to get phase transitions:', error);
      return [];
    }
  }

  async getFeatureUsageAnalytics(userId: string, timeRange?: { start: Date; end: Date }) {
    try {
      let query = supabase
        .from('feature_usage_analytics')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (timeRange) {
        query = query
          .gte('created_at', timeRange.start.toISOString())
          .lte('created_at', timeRange.end.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Failed to get feature usage analytics:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.warn('Failed to get feature usage analytics:', error);
      return [];
    }
  }

  async getUserMilestones(userId: string, timeRange?: { start: Date; end: Date }) {
    try {
      let query = supabase
        .from('user_journey_milestones')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (timeRange) {
        query = query
          .gte('created_at', timeRange.start.toISOString())
          .lte('created_at', timeRange.end.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Failed to get user milestones:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.warn('Failed to get user milestones:', error);
      return [];
    }
  }

  private async getClientIP(): Promise<string> {
    try {
      // This is a simplified IP detection - in production you might want to use a service
      return 'client_ip_placeholder';
    } catch (error) {
      return 'unknown';
    }
  }

  // NEW: Method to check if analytics service is working properly
  async healthCheck(): Promise<boolean> {
    try {
      // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false;

      // Try to get consent settings - this should not throw an error now
      const consent = await this.getAnalyticsConsent(user.user.id);
      return consent !== null;
    } catch (error) {
      console.warn('Analytics service health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance with original naming for compatibility
export const crossPhaseAnalyticsService = new CrossPhaseAnalyticsService();
export default crossPhaseAnalyticsService;

