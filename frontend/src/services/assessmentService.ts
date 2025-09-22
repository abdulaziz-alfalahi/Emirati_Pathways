
import { supabase } from '@/integrations/supabase/client';
import { Assessment } from '@/types/assessments';
import { assessmentCore } from './assessments/assessmentCore';
import { mockSessionData } from './assessments/mockSessionData';
import { mockCoachingData } from './assessments/mockCoachingData';
import { coachingService } from './assessments/coachingService';

export class AssessmentService {
  async getAssessments(): Promise<Assessment[]> {
    return assessmentCore.getAssessments();
  }

  async getAssessmentById(id: string): Promise<Assessment | null> {
    return assessmentCore.getAssessmentById(id);
  }

  async createAssessmentSession(assessmentId: string, userId: string) {
    return assessmentCore.createAssessmentSession(assessmentId, userId);
  }

  async getSessionData(userId: string) {
    return mockSessionData.filter(data => data.user_id === userId);
  }

  async getCoachingData(userId: string) {
    return coachingService.getCoachingData(userId);
  }

  // Additional methods for compatibility
  async fetchAssessments() {
    return this.getAssessments();
  }

  async fetchAssessmentById(id: string) {
    return this.getAssessmentById(id);
  }

  async createAssessment(data: any) {
    // Implementation for creating assessments
    return { id: 'temp-id', ...data };
  }

  async scheduleAssessment(assessmentId: string, date: string) {
    // Implementation for scheduling assessments
    return { assessmentId, scheduledDate: date };
  }

  async fetchCoachAssignments(coachId: string) {
    // Implementation for coach assignments
    return [];
  }

  async fetchUserAssessmentSessions(userId: string) {
    return this.getSessionData(userId);
  }
}

export const assessmentService = new AssessmentService();

// Export individual functions for backward compatibility
export const fetchAssessments = () => assessmentService.fetchAssessments();
export const fetchAssessmentById = (id: string) => assessmentService.fetchAssessmentById(id);
export const createAssessment = (data: any) => assessmentService.createAssessment(data);
export const scheduleAssessment = (assessmentId: string, date: string) => assessmentService.scheduleAssessment(assessmentId, date);
export const fetchCoachAssignments = (coachId: string) => assessmentService.fetchCoachAssignments(coachId);
export const fetchUserAssessmentSessions = (userId: string) => assessmentService.fetchUserAssessmentSessions(userId);
