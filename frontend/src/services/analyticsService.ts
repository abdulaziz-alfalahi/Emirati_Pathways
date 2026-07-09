import { UserRole } from '@/types/auth';

interface RoleSwitchEvent {
  user_id: string;
  from_role: UserRole | null;
  to_role: UserRole;
  timestamp: string;
  session_id: string;
}

interface AnalyticsEvent {
  event_type: string;
  event_data: Record<string, any>;
  user_id?: string;
  timestamp: string;
  session_id: string;
}

class AnalyticsService {
  private sessionId: string;

  constructor() {
    // Generate a session ID for this browser session
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async trackRoleSwitch(fromRole: UserRole | null, toRole: UserRole): Promise<void> {
    try {
      // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const event: RoleSwitchEvent = {
        user_id: user.user.id,
        from_role: fromRole,
        to_role: toRole,
        timestamp: new Date().toISOString(),
        session_id: this.sessionId
      };

      await this.trackEvent('role_switch', event);

      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Role Switch Analytics:', event);
      }
    } catch (error) {
      console.warn('Failed to track role switch:', error);
    }
  }

  async trackEvent(eventType: string, eventData: Record<string, any>): Promise<void> {
    try {
      // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
      
      const analyticsEvent: AnalyticsEvent = {
        event_type: eventType,
        event_data: eventData,
        user_id: user.user?.id,
        timestamp: new Date().toISOString(),
        session_id: this.sessionId
      };

      // Store in localStorage for now (could be sent to analytics service later)
      const existingEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      existingEvents.push(analyticsEvent);
      
      // Keep only the last 100 events to prevent localStorage bloat
      if (existingEvents.length > 100) {
        existingEvents.splice(0, existingEvents.length - 100);
      }
      
      localStorage.setItem('analytics_events', JSON.stringify(existingEvents));

    } catch (error) {
      console.warn('Failed to track analytics event:', error);
    }
  }

  getRoleSwitchingPatterns(): RoleSwitchEvent[] {
    try {
      const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      return events.filter((event: AnalyticsEvent) => event.event_type === 'role_switch')
                  .map((event: AnalyticsEvent) => event.event_data as RoleSwitchEvent);
    } catch (error) {
      console.warn('Failed to get role switching patterns:', error);
      return [];
    }
  }

  getMostUsedRoles(): { role: UserRole; count: number }[] {
    const patterns = this.getRoleSwitchingPatterns();
    const roleCounts: Record<string, number> = {};

    patterns.forEach(pattern => {
      if (pattern.to_role) {
        roleCounts[pattern.to_role] = (roleCounts[pattern.to_role] || 0) + 1;
      }
    });

    return Object.entries(roleCounts)
      .map(([role, count]) => ({ role: role as UserRole, count }))
      .sort((a, b) => b.count - a.count);
  }
}

export const analyticsService = new AnalyticsService();
