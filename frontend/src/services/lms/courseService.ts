import { BaseLMSService } from './baseLMSService';
import type { Course, CreateCourseData, CourseStatus } from '@/types/lms';

export class CourseService extends BaseLMSService {
  async createCourse(courseData: CreateCourseData): Promise<Course> {
    try {
      const user = await this.getCurrentUser();

      const { data, error } = await supabase
        .from('courses')
        .insert({
          ...courseData,
          instructor_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw this.handleError(error, 'createCourse');
    }
  }

  async getCourses(filters?: { status?: CourseStatus; category?: string; featured?: boolean }): Promise<Course[]> {
    try {
      // TODO: Connect to Flask API - let query = supabase.from('courses').select('*');

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.featured) {
        query = query.eq('is_featured', filters.featured);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      throw this.handleError(error, 'getCourses');
    }
  }

  async getCourse(id: string): Promise<Course | null> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw this.handleError(error, 'getCourse');
    }
  }

  async updateCourse(id: string, updates: Partial<CreateCourseData>): Promise<Course> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw this.handleError(error, 'updateCourse');
    }
  }
}

export const courseService = new CourseService();
