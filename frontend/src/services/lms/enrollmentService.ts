
import { supabase } from '@/integrations/supabase/client';
import { BaseLMSService } from './baseLMSService';
import type { CourseEnrollment, LessonProgress } from '@/types/lms';

export class EnrollmentService extends BaseLMSService {
  async enrollInCourse(courseId: string): Promise<CourseEnrollment> {
    try {
      const user = await this.getCurrentUser();

      const { data, error } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw this.handleError(error, 'enrollInCourse');
    }
  }

  async getUserEnrollments(): Promise<CourseEnrollment[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          courses:course_id (
            title,
            description,
            thumbnail_url,
            category
          )
        `)
        .eq('user_id', user.user.id)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw this.handleError(error, 'getUserEnrollments');
    }
  }

  async updateLessonProgress(lessonId: string, enrollmentId: string): Promise<LessonProgress> {
    try {
      const user = await this.getCurrentUser();

      const { data, error } = await supabase
        .from('lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          enrollment_id: enrollmentId,
          is_completed: true,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw this.handleError(error, 'updateLessonProgress');
    }
  }

  async getUserLessonProgress(enrollmentId: string): Promise<LessonProgress[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('enrollment_id', enrollmentId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw this.handleError(error, 'getUserLessonProgress');
    }
  }
}

export const enrollmentService = new EnrollmentService();
