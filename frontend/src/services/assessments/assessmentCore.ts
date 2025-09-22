
import { supabase } from '@/integrations/supabase/client';
import { Assessment } from '@/types/assessments';

export class AssessmentCore {
  async getAssessments(): Promise<Assessment[]> {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching assessments:', error);
      return [];
    }
  }

  async getAssessmentById(id: string): Promise<Assessment | null> {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching assessment:', error);
      return null;
    }
  }

  async createAssessmentSession(assessmentId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from('assessment_sessions')
        .insert([
          {
            assessment_id: assessmentId,
            user_id: userId,
            status: 'started'
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating assessment session:', error);
      return null;
    }
  }
}

export const assessmentCore = new AssessmentCore();
