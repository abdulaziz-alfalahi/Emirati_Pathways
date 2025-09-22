
import { useState, useEffect, useCallback } from 'react';
import { matchReEvaluationService } from '@/services/mentorship/matchReEvaluationService';
import { useToast } from '@/hooks/use-toast';
import type { MenteePreferences, MatchSuggestion } from '@/types/mentorship';

export const useMatchReEvaluation = (userId: string | null, preferences: MenteePreferences) => {
  const [isReEvaluating, setIsReEvaluating] = useState(false);
  const [needsReEvaluation, setNeedsReEvaluation] = useState(false);
  const [lastEvaluationTime, setLastEvaluationTime] = useState<Date | null>(null);
  const { toast } = useToast();

  // Check if re-evaluation is needed
  const checkReEvaluationStatus = useCallback(async () => {
    if (!userId) return;

    try {
      const [needsReEval, lastEvalTime] = await Promise.all([
        matchReEvaluationService.checkIfReEvaluationNeeded(userId),
        matchReEvaluationService.getLastEvaluationTime(userId)
      ]);

      setNeedsReEvaluation(needsReEval);
      setLastEvaluationTime(lastEvalTime);
    } catch (error) {
      console.error('Error checking re-evaluation status:', error);
    }
  }, [userId]);

  // Trigger re-evaluation
  const triggerReEvaluation = useCallback(async (): Promise<MatchSuggestion[] | null> => {
    if (!userId) return null;

    setIsReEvaluating(true);
    try {
      const newSuggestions = await matchReEvaluationService.reEvaluateMatches(userId, preferences);
      
      setNeedsReEvaluation(false);
      setLastEvaluationTime(new Date());
      
      toast({
        title: "Matches Updated",
        description: `Found ${newSuggestions.length} updated mentor matches based on your latest preferences.`
      });

      return newSuggestions;
    } catch (error) {
      toast({
        title: "Re-evaluation Failed",
        description: "Failed to update your matches. Please try again later.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsReEvaluating(false);
    }
  }, [userId, preferences, toast]);

  // Schedule re-evaluation when preferences change
  const scheduleReEvaluation = useCallback(async (triggerType: 'mentor_profile_update' | 'mentee_preferences_update' = 'mentee_preferences_update') => {
    if (!userId) return;

    try {
      await matchReEvaluationService.scheduleReEvaluation(userId, triggerType);
      setNeedsReEvaluation(true);
    } catch (error) {
      console.error('Error scheduling re-evaluation:', error);
    }
  }, [userId]);

  // Check status on mount and when userId changes
  useEffect(() => {
    checkReEvaluationStatus();
  }, [checkReEvaluationStatus]);

  // Auto-schedule re-evaluation when preferences change significantly
  useEffect(() => {
    if (userId && preferences.desired_expertise.length > 0) {
      const timer = setTimeout(() => {
        scheduleReEvaluation('mentee_preferences_update');
      }, 2000); // Debounce preference changes

      return () => clearTimeout(timer);
    }
  }, [userId, preferences.desired_expertise, preferences.career_goals, preferences.experience_level, scheduleReEvaluation]);

  return {
    isReEvaluating,
    needsReEvaluation,
    lastEvaluationTime,
    triggerReEvaluation,
    scheduleReEvaluation,
    checkReEvaluationStatus
  };
};
