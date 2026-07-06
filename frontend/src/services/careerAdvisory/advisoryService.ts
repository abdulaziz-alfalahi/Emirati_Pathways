import { CareerAdvisor } from "@/types/careerAdvisory";

export const getAdvisors = async (): Promise<CareerAdvisor[]> => {
  try {
    // Try to use optimized function first for better performance
    try {
      const { getAdvisorsWithSessionCounts } = await import('./optimizedAdvisoryService');
      const advisorsWithCounts = await getAdvisorsWithSessionCounts();
      
      // Transform to expected format (remove session_counts for backward compatibility)
      return advisorsWithCounts.map(({ session_counts, ...advisor }) => advisor);
    } catch (optimizedError) {
      console.warn('Optimized advisor fetch failed, falling back to basic query:', optimizedError);
      
      // Fallback to original query
      const { data, error } = await supabase
        .from('career_advisors')
        .select('*, user_profiles:profiles(full_name, avatar_url)')
        .eq('is_active', true);

      if (error) {
        console.error("Error fetching advisors:", error);
        throw error;
      }

      return data as unknown as CareerAdvisor[];
    }
  } catch (error) {
    console.error("Exception in getAdvisors:", error);
    throw error;
  }
};

export const getAdvisorById = async (id: string): Promise<CareerAdvisor | null> => {
  try {
    const { data, error } = await supabase
      .from('career_advisors')
      .select('*, user_profiles:profiles(full_name, avatar_url)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as unknown as CareerAdvisor;
  } catch (error) {
    console.error("Error fetching advisor:", error);
    return null;
  }
};

export const createAdvisor = async (advisor: Omit<CareerAdvisor, "id" | "created_at" | "updated_at">): Promise<CareerAdvisor> => {
  try {
    const { data, error } = await supabase
      .from('career_advisors')
      .insert({
        user_id: advisor.user_id,
        specialization: advisor.specialization,
        bio: advisor.bio,
        availability: advisor.availability,
        is_active: advisor.is_active
      })
      .select()
      .single();

    if (error) throw error;
    return data as unknown as CareerAdvisor;
  } catch (error) {
    console.error("Error creating advisor:", error);
    throw error;
  }
};

export const updateAdvisor = async (id: string, advisor: Partial<Omit<CareerAdvisor, "id" | "created_at" | "updated_at">>): Promise<CareerAdvisor> => {
  try {
    const { data, error } = await supabase
      .from('career_advisors')
      .update(advisor)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as CareerAdvisor;
  } catch (error) {
    console.error("Error updating advisor:", error);
    throw error;
  }
};

export const deleteAdvisor = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('career_advisors')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting advisor:", error);
    throw error;
  }
};

// Add aliases for component compatibility
export const fetchCareerAdvisorById = getAdvisorById;
export const fetchCareerAdvisors = getAdvisors;
