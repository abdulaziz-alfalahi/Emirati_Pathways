
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface CollaborationSession {
  id: string;
  assessment_id: string;
  user_id: string;
  session_start: string;
  session_end?: string;
  last_activity: string;
  current_section_id?: string;
  status: 'active' | 'idle' | 'disconnected';
  created_at: string;
  updated_at: string;
  user?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface ActivityFeedItem {
  id: string;
  assessment_id: string;
  user_id: string;
  activity_type: 'joined' | 'left' | 'evaluation_submitted' | 'comment_added' | 'section_started' | 'section_completed';
  activity_data: any;
  section_id?: string;
  criterion_id?: string;
  created_at: string;
  user?: {
    full_name?: string;
    avatar_url?: string;
  };
}

class RealtimeCollaborationService {
  private channels: Map<string, RealtimeChannel> = new Map();

  async startCollaborationSession(assessmentId: string, userId: string, sectionId?: string): Promise<CollaborationSession> {
    const { data, error } = await supabase
      .from('assessment_collaboration_sessions')
      .upsert({
        assessment_id: assessmentId,
        user_id: userId,
        current_section_id: sectionId,
        status: 'active',
        last_activity: new Date().toISOString()
      }, {
        onConflict: 'assessment_id,user_id'
      })
      .select(`
        *,
        user:profiles(full_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    // Log join activity
    await this.logActivity(assessmentId, userId, 'joined', {
      section_id: sectionId
    });

    return data as CollaborationSession;
  }

  async endCollaborationSession(assessmentId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('assessment_collaboration_sessions')
      .update({
        session_end: new Date().toISOString(),
        status: 'disconnected'
      })
      .eq('assessment_id', assessmentId)
      .eq('user_id', userId);

    if (error) throw error;

    // Log leave activity
    await this.logActivity(assessmentId, userId, 'left');
  }

  async updateSessionActivity(assessmentId: string, userId: string, sectionId?: string): Promise<void> {
    const { error } = await supabase
      .from('assessment_collaboration_sessions')
      .update({
        last_activity: new Date().toISOString(),
        current_section_id: sectionId,
        status: 'active'
      })
      .eq('assessment_id', assessmentId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async getActiveCollaborators(assessmentId: string): Promise<CollaborationSession[]> {
    const { data, error } = await supabase
      .from('assessment_collaboration_sessions')
      .select(`
        *,
        user:profiles(full_name, avatar_url)
      `)
      .eq('assessment_id', assessmentId)
      .eq('status', 'active')
      .gte('last_activity', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Active within last 5 minutes
      .order('last_activity', { ascending: false });

    if (error) throw error;
    return (data || []) as CollaborationSession[];
  }

  async logActivity(
    assessmentId: string, 
    userId: string, 
    activityType: ActivityFeedItem['activity_type'], 
    activityData: any = {},
    sectionId?: string,
    criterionId?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('assessment_activity_feed')
      .insert({
        assessment_id: assessmentId,
        user_id: userId,
        activity_type: activityType,
        activity_data: activityData,
        section_id: sectionId,
        criterion_id: criterionId
      });

    if (error) {
      console.error('Failed to log activity:', error);
    }
  }

  async getRecentActivity(assessmentId: string, limit: number = 20): Promise<ActivityFeedItem[]> {
    const { data, error } = await supabase
      .from('assessment_activity_feed')
      .select(`
        *,
        user:profiles(full_name, avatar_url)
      `)
      .eq('assessment_id', assessmentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as ActivityFeedItem[];
  }

  subscribeToCollaborationUpdates(
    assessmentId: string,
    onSessionUpdate: (sessions: CollaborationSession[]) => void,
    onActivityUpdate: (activity: ActivityFeedItem) => void
  ): RealtimeChannel {
    const channelName = `assessment_collaboration:${assessmentId}`;
    
    // Remove existing channel if it exists
    if (this.channels.has(channelName)) {
      this.unsubscribeFromUpdates(assessmentId);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assessment_collaboration_sessions',
          filter: `assessment_id=eq.${assessmentId}`
        },
        async () => {
          // Refetch active collaborators when sessions change
          const sessions = await this.getActiveCollaborators(assessmentId);
          onSessionUpdate(sessions);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'assessment_activity_feed',
          filter: `assessment_id=eq.${assessmentId}`
        },
        async (payload) => {
          // Fetch the new activity with user data
          const { data } = await supabase
            .from('assessment_activity_feed')
            .select(`
              *,
              user:profiles(full_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            onActivityUpdate(data as ActivityFeedItem);
          }
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  unsubscribeFromUpdates(assessmentId: string): void {
    const channelName = `assessment_collaboration:${assessmentId}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  subscribeToPresence(
    assessmentId: string,
    userId: string,
    userName: string,
    onPresenceChange: (presences: any) => void
  ): RealtimeChannel {
    const channelName = `assessment_presence:${assessmentId}`;
    
    // Remove existing presence channel if it exists
    if (this.channels.has(channelName)) {
      const existingChannel = this.channels.get(channelName);
      if (existingChannel) {
        supabase.removeChannel(existingChannel);
      }
    }

    const channel = supabase
      .channel(channelName)
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        onPresenceChange(newState);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            user_name: userName,
            online_at: new Date().toISOString(),
          });
        }
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  cleanup(): void {
    this.channels.forEach(channel => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }
}

export const realtimeCollaborationService = new RealtimeCollaborationService();
