
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { ActivityFeedItem } from '@/services/collaborativeAssessments/realtimeCollaborationService';

interface UseRealtimeNotificationsProps {
  recentActivity: ActivityFeedItem[];
  isConnected: boolean;
}

export const useRealtimeNotifications = ({ 
  recentActivity, 
  isConnected 
}: UseRealtimeNotificationsProps) => {
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!isConnected || !user || recentActivity.length === 0) return;

    // Get the most recent activity (first item in the array)
    const latestActivity = recentActivity[0];
    
    // Don't show notifications for the current user's own actions
    if (latestActivity.user_id === user.id) return;

    const userName = latestActivity.user?.full_name || 'Someone';
    
    let title = '';
    let description = '';
    let variant: 'default' | 'destructive' = 'default';

    switch (latestActivity.activity_type) {
      case 'joined':
        title = '👋 New Collaborator';
        description = `${userName} joined the assessment`;
        break;
      case 'left':
        title = '👋 Collaborator Left';
        description = `${userName} left the assessment`;
        variant = 'default';
        break;
      case 'evaluation_submitted':
        title = '✅ Evaluation Submitted';
        description = `${userName} submitted an evaluation`;
        break;
      case 'comment_added':
        title = '💬 New Comment';
        description = `${userName} added a comment`;
        break;
      case 'section_started':
        const sectionTitle = latestActivity.activity_data?.section_title || 'a section';
        title = '🚀 Section Started';
        description = `${userName} started working on ${sectionTitle}`;
        break;
      case 'section_completed':
        title = '🎉 Section Completed';
        description = `${userName} completed a section`;
        break;
      default:
        return;
    }

    toast({
      title,
      description,
      variant,
      duration: 4000,
    });
  }, [recentActivity, isConnected, user, toast]);
};
