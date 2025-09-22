
import { supabase } from '@/integrations/supabase/client';

export interface CareerPath {
  id: string;
  title: string;
  description: string;
  industry: string;
  created_at: string;
  updated_at?: string | null;
  // Additional UI properties for compatibility
  current_stage?: CareerPathStage;
  stages?: CareerPathStage[];
}

export interface CareerPathStage {
  id: string;
  career_path_id: string;
  title: string;
  description?: string | null;
  stage_type: 'education' | 'career';
  order_index: number;
  duration?: string;
  skills?: string[] | null;
  requirements?: string[] | null;
  icon?: string;
  created_at: string;
  updated_at: string | null;
}

export const careerPathService = {
  async getCareerPaths(): Promise<CareerPath[]> {
    try {
      const { data, error } = await supabase
        .from('career_paths')
        .select('*')
        .order('title');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching career paths:', error);
      return [];
    }
  },

  async getCareerPathById(id: string): Promise<CareerPath | null> {
    try {
      const { data, error } = await supabase
        .from('career_paths')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching career path:', error);
      return null;
    }
  },

  async getCareerPathStages(careerPathId: string): Promise<CareerPathStage[]> {
    try {
      const { data, error } = await supabase
        .from('career_path_stages')
        .select('*')
        .eq('career_path_id', careerPathId)
        .order('order_index');

      if (error) throw error;
      return (data || []).map(stage => ({
        ...stage,
        stage_type: stage.stage_type as 'education' | 'career'
      }));
    } catch (error) {
      console.error('Error fetching career path stages:', error);
      return [];
    }
  },

  // Additional methods for compatibility
  async getUserCareerPaths(userId: string) {
    // Transform CareerPath to UserCareerPath format
    const paths = await this.getCareerPaths();
    return paths.map(path => ({
      id: `user-${path.id}`,
      user_id: userId,
      career_path_id: path.id,
      current_stage_id: null,
      started_at: new Date().toISOString(),
      updated_at: null,
      career_path: path,
      steps: [],
      duration: '6 months',
      difficulty: 'intermediate',
      completionPercentage: 0,
      isEnrolled: true
    }));
  },

  async getUserCareerPathDetails(userId: string, pathId: string) {
    const path = await this.getCareerPathById(pathId);
    const stages = await this.getCareerPathStages(pathId);
    return {
      id: `user-${pathId}`,
      user_id: userId,
      career_path_id: pathId,
      current_stage_id: null,
      started_at: new Date().toISOString(),
      updated_at: null,
      career_path: path,
      current_stage: null,
      stages: stages,
      steps: [],
      duration: '6 months',
      difficulty: 'intermediate',
      completionPercentage: 0,
      isEnrolled: true
    };
  },

  async deleteUserCareerPath(userId: string, pathId: string) {
    // Mock implementation
    return { success: true };
  },

  async selectCareerPath(userId: string, pathId: string) {
    // Mock implementation
    return { success: true, pathId };
  },

  async updateUserCareerStage(userId: string, pathId: string, stageId: string) {
    // Mock implementation
    return { success: true, stageId };
  }
};

// Export individual functions for backward compatibility
export const getUserCareerPaths = (userId: string) => careerPathService.getUserCareerPaths(userId);
export const getUserCareerPathDetails = (userId: string, pathId: string) => careerPathService.getUserCareerPathDetails(userId, pathId);
export const deleteUserCareerPath = (userId: string, pathId: string) => careerPathService.deleteUserCareerPath(userId, pathId);
export const selectCareerPath = (userId: string, pathId: string) => careerPathService.selectCareerPath(userId, pathId);
export const getCareerPathById = (id: string) => careerPathService.getCareerPathById(id);
export const updateUserCareerStage = (userId: string, pathId: string, stageId: string) => careerPathService.updateUserCareerStage(userId, pathId, stageId);
export const getCareerPaths = () => careerPathService.getCareerPaths();
