
import { useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePhase } from '@/context/PhaseContext';
import { crossPhaseAnalyticsService, AnalyticsEvent, PhaseTransition, FeatureUsage, UserMilestone } from '@/services/crossPhaseAnalyticsService';

export const useAnalytics = () => {
  const { user } = useAuth();
  const { currentPhase } = usePhase();

  const trackEvent = useCallback((eventType: string, eventData: Record<string, any> = {}) => {
    if (!currentPhase) return;
    
    const event: AnalyticsEvent = {
      phase: currentPhase,
      event_type: eventType,
      event_data: eventData,
      session_id: sessionStorage.getItem('sessionId') || 'unknown'
    };
    
    crossPhaseAnalyticsService.trackEvent(event);
  }, [currentPhase]);

  const trackPhaseTransition = useCallback((transition: PhaseTransition) => {
    crossPhaseAnalyticsService.trackPhaseTransition(transition);
  }, []);

  const trackFeatureUsage = useCallback((usage: FeatureUsage) => {
    crossPhaseAnalyticsService.trackFeatureUsage(usage);
  }, []);

  const trackMilestone = useCallback((milestone: UserMilestone) => {
    crossPhaseAnalyticsService.trackMilestone(milestone);
  }, []);

  const trackPageView = useCallback((pageName: string, additionalData: Record<string, any> = {}) => {
    trackEvent('page_view', {
      page_name: pageName,
      ...additionalData
    });
  }, [trackEvent]);

  const trackUserAction = useCallback((action: string, context: Record<string, any> = {}) => {
    trackEvent('user_action', {
      action,
      ...context
    });
  }, [trackEvent]);

  const trackError = useCallback((error: Error, context: Record<string, any> = {}) => {
    trackEvent('error', {
      error_message: error.message,
      error_stack: error.stack,
      ...context
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPhaseTransition,
    trackFeatureUsage,
    trackMilestone,
    trackPageView,
    trackUserAction,
    trackError
  };
};

export const useFeatureTracking = (featureName: string) => {
  const { currentPhase } = usePhase();
  const startTime = useCallback(() => Date.now(), []);

  const trackFeatureUsage = useCallback((
    actionType: string, 
    duration?: number, 
    success: boolean = true,
    context: Record<string, any> = {}
  ) => {
    if (!currentPhase) return;

    const usage: FeatureUsage = {
      feature_name: featureName,
      phase: currentPhase,
      action_type: actionType,
      duration_seconds: duration ? Math.round(duration / 1000) : undefined,
      success_rate: success ? 1 : 0,
      usage_context: context
    };

    crossPhaseAnalyticsService.trackFeatureUsage(usage);
  }, [featureName, currentPhase]);

  const trackFeatureStart = useCallback((context: Record<string, any> = {}) => {
    const start = startTime();
    trackFeatureUsage('start', undefined, true, { ...context, start_time: start });
    return start;
  }, [trackFeatureUsage, startTime]);

  const trackFeatureEnd = useCallback((startTime: number, success: boolean = true, context: Record<string, any> = {}) => {
    const duration = Date.now() - startTime;
    trackFeatureUsage('end', duration, success, context);
  }, [trackFeatureUsage]);

  return {
    trackFeatureUsage,
    trackFeatureStart,
    trackFeatureEnd
  };
};
