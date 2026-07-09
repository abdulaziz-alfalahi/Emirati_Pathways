import { ResumeData } from '@/components/resume/types';
/**
 * Safely converts ResumeData to any type for storage
 */
function serializeResumeData(resumeData: Partial<ResumeData>): any {
  return JSON.parse(JSON.stringify(resumeData)) as any;
}

/**
 * Safely converts any to ResumeData
 */
function deserializeResumeData(jsonData: any): ResumeData | null {
  try {
    // Basic validation of required structure
    const data = jsonData as any;
    if (!data || typeof data !== 'object' || !data.personal) {
      console.warn('Invalid resume data structure:', data);
      return null;
    }
    return data as ResumeData;
  } catch (error) {
    console.error('Error deserializing resume data:', error);
    return null;
  }
}

/**
 * Save resume data to Supabase
 * @param userId User ID
 * @param resumeData Resume data to save
 * @returns Promise resolving to resume ID
 */
export const saveResumeToSupabase = async (userId: string, resumeData: Partial<ResumeData>): Promise<string> => {
  try {
    // Check if user already has a resume
    const { data: existingResume, error: findError } = await supabase
      .from('resumes')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    let resumeId: string;

    if (findError) {
      console.error('Error checking for existing resume:', findError);
      throw new Error('Failed to check for existing resume');
    }

    if (existingResume?.id) {
      // Use existing resume
      resumeId = existingResume.id;
    } else {
      // Create new resume
      const { data: newResume, error: createError } = await supabase
        .from('resumes')
        .insert({
          user_id: userId,
          title: 'My Resume',
          template_id: 'default',
          theme: 'classic'
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating resume:', createError);
        throw new Error('Failed to create resume');
      }

      if (!newResume) {
        throw new Error('Failed to create resume: No ID returned');
      }

      resumeId = newResume.id;
    }

    // Serialize the resume data to ensure it's JSON compatible
    const jsonData = serializeResumeData(resumeData);

    // Check if resume_data exists for this resume
    const { data: existingData, error: dataFindError } = await supabase
      .from('resume_data')
      .select('id')
      .eq('resume_id', resumeId)
      .maybeSingle();

    if (dataFindError) {
      console.error('Error checking for existing resume data:', dataFindError);
      throw new Error('Failed to check for existing resume data');
    }

    if (existingData?.id) {
      // Update existing data
      const { error: updateError } = await supabase
        .from('resume_data')
        .update({ data: jsonData })
        .eq('id', existingData.id);

      if (updateError) {
        console.error('Error updating resume data:', updateError);
        throw new Error('Failed to update resume data');
      }
    } else {
      // Insert new data
      const { error: insertError } = await supabase
        .from('resume_data')
        .insert({
          resume_id: resumeId,
          data: jsonData
        });

      if (insertError) {
        console.error('Error inserting resume data:', insertError);
        throw new Error('Failed to insert resume data');
      }
    }

    return resumeId;
  } catch (error) {
    console.error('Error saving resume to Supabase:', error);
    throw error;
  }
};

/**
 * Get resume data from Supabase
 * @param resumeId Resume ID
 * @returns Promise resolving to resume data
 */
export const getResumeFromSupabase = async (resumeId: string): Promise<ResumeData | null> => {
  try {
    const { data, error } = await supabase
      .from('resume_data')
      .select('data')
      .eq('resume_id', resumeId)
      .single();
    
    if (error) throw error;
    
    if (!data || !data.data) return null;
    return deserializeResumeData(data.data);
  } catch (error) {
    console.error('Error fetching resume data:', error);
    return null;
  }
};

/**
 * Get all resumes for a user
 * @param userId User ID
 * @returns Promise resolving to array of resumes
 */
export const getUserResumes = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('resumes')
      .select(`
        *,
        resume_data:resume_data(data)
      `)
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user resumes:', error);
    return [];
  }
};

/**
 * Get resume data by ID
 * @param resumeId Resume ID
 * @returns Promise resolving to resume data
 */
export const getResumeData = async (resumeId: string): Promise<ResumeData | null> => {
  return getResumeFromSupabase(resumeId);
};
