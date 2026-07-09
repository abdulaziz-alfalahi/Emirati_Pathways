import { BaseLMSService } from './baseLMSService';
import type { CourseModule, CreateModuleData, Lesson, CreateLessonData } from '@/types/lms';

export class ModuleService extends BaseLMSService {
  async createModule(courseId: string, moduleData: CreateModuleData): Promise<CourseModule> {
    try {
      const { data, error } = await supabase
        .from('course_modules')
        .insert({
          ...moduleData,
          course_id: courseId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw this.handleError(error, 'createModule');
    }
  }

  async getCourseModules(courseId: string): Promise<CourseModule[]> {
    try {
      const { data, error } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw this.handleError(error, 'getCourseModules');
    }
  }

  async createLesson(moduleId: string, lessonData: CreateLessonData): Promise<Lesson> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .insert({
          ...lessonData,
          module_id: moduleId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw this.handleError(error, 'createLesson');
    }
  }

  async getModuleLessons(moduleId: string): Promise<Lesson[]> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('module_id', moduleId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw this.handleError(error, 'getModuleLessons');
    }
  }
}

export const moduleService = new ModuleService();
