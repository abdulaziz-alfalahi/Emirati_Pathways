
import { assessmentCore } from './assessmentCore';
import { mockSessionData } from './mockSessionData';
import { mockCoachingData } from './mockCoachingData';
import { coachingService } from './coachingService';

export {
  assessmentCore,
  mockSessionData,
  mockCoachingData,
  coachingService
};

export type { MockSessionData } from './mockSessionData';
export type { MockCoachingData } from './mockCoachingData';

// Re-export from assessmentService for compatibility
export { 
  fetchAssessments,
  fetchAssessmentById,
  createAssessment,
  scheduleAssessment,
  fetchCoachAssignments,
  fetchUserAssessmentSessions
} from '../assessmentService';
