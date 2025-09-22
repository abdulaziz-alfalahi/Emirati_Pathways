
import { supabase } from '@/integrations/supabase/client';
import { LegacyProject, ProjectContribution } from '@/types/legacyProject';

export const legacyProjectService = {
  // Get all active legacy projects
  async getActiveProjects(): Promise<LegacyProject[]> {
    const { data, error } = await supabase
      .from('legacy_projects')
      .select('*')
      .in('project_status', ['proposal', 'active', 'completed'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as LegacyProject[];
  },

  // Get user's contributions
  async getUserContributions(userId: string): Promise<ProjectContribution[]> {
    const { data, error } = await supabase
      .from('project_contributions')
      .select(`
        *,
        project:legacy_projects(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ProjectContribution[];
  },

  // Create a new legacy project
  async createProject(
    projectData: Omit<LegacyProject, 'id' | 'created_at' | 'updated_at' | 'current_funding'>
  ): Promise<LegacyProject> {
    const { data, error } = await supabase
      .from('legacy_projects')
      .insert(projectData)
      .select()
      .single();

    if (error) throw error;
    return data as LegacyProject;
  },

  // Submit a contribution to a project
  async submitContribution(
    contributionData: Omit<ProjectContribution, 'id' | 'created_at' | 'updated_at' | 'contribution_date'>
  ): Promise<ProjectContribution> {
    const { data, error } = await supabase
      .from('project_contributions')
      .insert(contributionData)
      .select()
      .single();

    if (error) throw error;
    return data as ProjectContribution;
  },

  // Get featured projects
  async getFeaturedProjects(): Promise<LegacyProject[]> {
    const { data, error } = await supabase
      .from('legacy_projects')
      .select('*')
      .eq('is_featured', true)
      .in('project_status', ['proposal', 'active', 'completed'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as LegacyProject[];
  }
};
