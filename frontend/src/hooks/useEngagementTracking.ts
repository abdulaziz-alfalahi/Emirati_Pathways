
import { useState, useEffect, useRef } from 'react';
import { EngagementTrackingService } from '@/services/engagementTrackingService';
import { toast } from '@/components/ui/use-toast';

interface UseEngagementTrackingProps {
  eventId: string;
  sessionId?: string;
  boothId?: string;
  trackingType: 'session' | 'booth' | 'general';
}

export const useEngagementTracking = ({
  eventId,
  sessionId,
  boothId,
  trackingType
}: UseEngagementTrackingProps) => {
  const [attendanceId, setAttendanceId] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);
  const startTimeRef = useRef<Date | null>(null);
  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Start tracking session attendance
  const startSessionTracking = async () => {
    if (!sessionId || isTracking) return;

    try {
      const attendance = await EngagementTrackingService.startSessionAttendance(sessionId, eventId);
      setAttendanceId(attendance.id);
      setIsTracking(true);
      startTimeRef.current = new Date();
      
      console.log('Started session tracking:', attendance.id);
    } catch (error) {
      console.error('Failed to start session tracking:', error);
    }
  };

  // End tracking session attendance
  const endSessionTracking = async () => {
    if (!attendanceId || !isTracking) return;

    try {
      await EngagementTrackingService.endSessionAttendance(attendanceId);
      setIsTracking(false);
      setAttendanceId(null);
      startTimeRef.current = null;
      
      console.log('Ended session tracking');
    } catch (error) {
      console.error('Failed to end session tracking:', error);
    }
  };

  // Track booth interaction
  const trackBoothInteraction = async (
    interactionType: 'view' | 'chat' | 'download' | 'video_call',
    interactionData: Record<string, any> = {}
  ) => {
    if (!boothId) return;

    try {
      const duration = startTimeRef.current 
        ? Math.floor((new Date().getTime() - startTimeRef.current.getTime()) / 1000)
        : 0;

      await EngagementTrackingService.trackBoothInteraction(
        boothId,
        eventId,
        interactionType,
        interactionData,
        duration
      );

      console.log('Tracked booth interaction:', interactionType);
    } catch (error) {
      console.error('Failed to track booth interaction:', error);
    }
  };

  // Record user interaction (for engagement scoring)
  const recordInteraction = () => {
    setInteractionCount(prev => prev + 1);
    
    // Debounce engagement updates
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }
    
    interactionTimeoutRef.current = setTimeout(() => {
      updateEngagementScore();
    }, 2000);
  };

  // Update engagement score
  const updateEngagementScore = async () => {
    if (!attendanceId || trackingType !== 'session') return;

    try {
      await EngagementTrackingService.updateSessionEngagement(attendanceId, interactionCount);
    } catch (error) {
      console.error('Failed to update engagement score:', error);
    }
  };

  // Record Q&A participation
  const recordQuestionAsked = async () => {
    try {
      // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      await EngagementTrackingService.updateEngagementAnalytics(user.user.id, eventId, {
        questions_asked: 1
      });
      
      recordInteraction();
    } catch (error) {
      console.error('Failed to record question:', error);
    }
  };

  // Record poll participation
  const recordPollParticipation = async () => {
    try {
      // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      await EngagementTrackingService.updateEngagementAnalytics(user.user.id, eventId, {
        polls_participated: 1
      });
      
      recordInteraction();
    } catch (error) {
      console.error('Failed to record poll participation:', error);
    }
  };

  // Record networking connection
  const recordNetworkingConnection = async () => {
    try {
      // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      await EngagementTrackingService.updateEngagementAnalytics(user.user.id, eventId, {
        networking_connections: 1
      });
      
      recordInteraction();
    } catch (error) {
      console.error('Failed to record networking connection:', error);
    }
  };

  // Auto-start tracking based on type
  useEffect(() => {
    if (trackingType === 'session' && sessionId) {
      startSessionTracking();
    } else if (trackingType === 'booth' && boothId) {
      startTimeRef.current = new Date();
      trackBoothInteraction('view');
    }

    return () => {
      if (trackingType === 'session') {
        endSessionTracking();
      }
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };
  }, [trackingType, sessionId, boothId]);

  // Track page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isTracking) {
        endSessionTracking();
      } else if (!document.hidden && sessionId && !isTracking) {
        startSessionTracking();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isTracking, sessionId]);

  return {
    isTracking,
    interactionCount,
    attendanceId,
    startSessionTracking,
    endSessionTracking,
    trackBoothInteraction,
    recordInteraction,
    recordQuestionAsked,
    recordPollParticipation,
    recordNetworkingConnection
  };
};
