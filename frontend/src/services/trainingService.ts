import type { TrainingProgram, TrainingProvider, TrainingApplication, TrainingEnrollment, TrainingFilters } from '@/types/training';

export const trainingService = {
  // Get all training programs with filters
  async getTrainingPrograms(filters: TrainingFilters = {}): Promise<TrainingProgram[]> {
    let query = supabase
      .from('training_programs')
      .select(`
        *,
        provider:training_providers(*)
      `)
      .eq('status', 'active')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters.category) {
      query = query.eq('category', filters.category as any);
    }

    if (filters.training_mode) {
      query = query.eq('training_mode', filters.training_mode as any);
    }

    if (filters.certification_offered !== undefined) {
      query = query.eq('certification_offered', filters.certification_offered);
    }

    if (filters.job_placement_assistance !== undefined) {
      query = query.eq('job_placement_assistance', filters.job_placement_assistance);
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching training programs:', error);
      throw error;
    }

    return data || [];
  },

  // Get training program by ID
  async getTrainingProgramById(id: string): Promise<TrainingProgram | null> {
    const { data, error } = await supabase
      .from('training_programs')
      .select(`
        *,
        provider:training_providers(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching training program:', error);
      return null;
    }

    return data;
  },

  // Get training providers
  async getTrainingProviders(): Promise<TrainingProvider[]> {
    const { data, error } = await supabase
      .from('training_providers')
      .select('*')
      .order('partnership_level', { ascending: false })
      .order('name');

    if (error) {
      console.error('Error fetching training providers:', error);
      throw error;
    }

    return data || [];
  },

  // Apply for training program
  async applyForProgram(programId: string, applicationData: Record<string, any>): Promise<TrainingApplication> {
    // TODO: Connect to Flask API - const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to apply');
    }

    const { data, error } = await supabase
      .from('training_applications')
      .insert({
        user_id: user.id,
        program_id: programId,
        application_data: applicationData
      })
      .select()
      .single();

    if (error) {
      console.error('Error submitting application:', error);
      throw error;
    }

    return {
      ...data,
      application_data: data.application_data as Record<string, any>
    };
  },

  // Get user's applications
  async getUserApplications(): Promise<TrainingApplication[]> {
    // TODO: Connect to Flask API - const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('training_applications')
      .select(`
        *,
        program:training_programs(
          *,
          provider:training_providers(*)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user applications:', error);
      throw error;
    }

    return (data || []).map(item => ({
      ...item,
      application_data: item.application_data as Record<string, any>
    }));
  },

  // Get user's enrollments
  async getUserEnrollments(): Promise<TrainingEnrollment[]> {
    // TODO: Connect to Flask API - const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('training_enrollments')
      .select(`
        *,
        program:training_programs(
          *,
          provider:training_providers(*)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user enrollments:', error);
      throw error;
    }

    return data || [];
  }
};
