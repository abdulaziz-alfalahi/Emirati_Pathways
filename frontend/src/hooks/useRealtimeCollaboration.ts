
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { realtimeCollaborationService, CollaborationSession, ActivityFeedItem } from '@/services/collaborativeAssessments/realtimeCollaborationService';

interface UseRealtimeCollaborationProps {
  assessmentId: string;
  enabled?: boolean;
}

export const useRealtimeCollaboration = ({ assessmentId, enabled = true }: UseRealtimeCollaborationProps) => {
  const { user } = useAuth();
  const [activeCollaborators, setActiveCollaborators] = useState<CollaborationSession[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityFeedItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const sessionStartedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !user || !assessmentId) return;

    let mounted = true;

    const initializeCollaboration = async () => {
      try {
        // Start collaboration session
        if (!sessionStartedRef.current) {
          await realtimeCollaborationService.startCollaborationSession(assessmentId, user.id);
          sessionStartedRef.current = true;
        }

        // Fetch initial data
        const [collaborators, activity] = await Promise.all([
          realtimeCollaborationService.getActiveCollaborators(assessmentId),
          realtimeCollaborationService.getRecentActivity(assessmentId)
        ]);

        if (mounted) {
          setActiveCollaborators(collaborators);
          setRecentActivity(activity);
          setIsConnected(true);
        }

        // Subscribe to real-time updates
        realtimeCollaborationService.subscribeToCollaborationUpdates(
          assessmentId,
          (sessions) => {
            if (mounted) {
              setActiveCollaborators(sessions);
            }
          },
          (newActivity) => {
            if (mounted) {
              setRecentActivity(prev => [newActivity, ...prev.slice(0, 19)]);
            }
          }
        );

      } catch (error) {
        console.error('Failed to initialize collaboration:', error);
      }
    };

    initializeCollaboration();

    // Cleanup function
    return () => {
      mounted = false;
      if (sessionStartedRef.current && user) {
        realtimeCollaborationService.endCollaborationSession(assessmentId, user.id);
        sessionStartedRef.current = false;
      }
      realtimeCollaborationService.unsubscribeFromUpdates(assessmentId);
      setIsConnected(false);
    };
  }, [assessmentId, user, enabled]);

  const updateActivity = async (sectionId?: string) => {
    if (!user) return;
    
    try {
      await realtimeCollaborationService.updateSessionActivity(assessmentId, user.id, sectionId);
    } catch (error) {
      console.error('Failed to update activity:', error);
    }
  };

  const logEvaluationSubmitted = async (sectionId: string, criterionId: string) => {
    if (!user) return;

    try {
      await realtimeCollaborationService.logActivity(
        assessmentId,
        user.id,
        'evaluation_submitted',
        { criterion_title: 'Evaluation completed' },
        sectionId,
        criterionId
      );
    } catch (error) {
      console.error('Failed to log evaluation:', error);
    }
  };

  const logSectionStarted = async (sectionId: string, sectionTitle: string) => {
    if (!user) return;

    try {
      await realtimeCollaborationService.logActivity(
        assessmentId,
        user.id,
        'section_started',
        { section_title: sectionTitle },
        sectionId
      );
      await updateActivity(sectionId);
    } catch (error) {
      console.error('Failed to log section start:', error);
    }
  };

  const logCommentAdded = async (sectionId?: string, criterionId?: string) => {
    if (!user) return;

    try {
      await realtimeCollaborationService.logActivity(
        assessmentId,
        user.id,
        'comment_added',
        {},
        sectionId,
        criterionId
      );
    } catch (error) {
      console.error('Failed to log comment:', error);
    }
  };

  return {
    activeCollaborators,
    recentActivity,
    isConnected,
    updateActivity,
    logEvaluationSubmitted,
    logSectionStarted,
    logCommentAdded
  };
};
