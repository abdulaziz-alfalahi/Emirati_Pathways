import { supabase } from '@/integrations/supabase/client';
import { SummerCamp, CampEnrollment, CampFilters } from '@/types/summerCamps';
import { toast } from '@/hooks/use-toast';

// Status type guard
function isValidEnrollmentStatus(status: string): status is "confirmed" | "cancelled" | "waiting_list" {
  return ["confirmed", "cancelled", "waiting_list"].includes(status);
}

// Helper to transform enrollment data
function transformEnrollment(enrollment: any): CampEnrollment {
  return {
    ...enrollment,
    status: isValidEnrollmentStatus(enrollment.status) ? enrollment.status : "confirmed" // Default to confirmed if invalid
  };
}

// Helper function to transform database data to SummerCamp type
const transformCampData = (data: any): SummerCamp => ({
  ...data,
  // Provide defaults for optional fields that might not exist in DB
  max_participants: data.max_participants || data.capacity,
  registration_deadline: data.registration_deadline || null,
  rating: data.rating || null
});

/**
 * Fetch all summer camps with optional filtering
 * OPTIMIZED: Uses RPC function for better performance
 */
export const getCamps = async (filters?: CampFilters): Promise<SummerCamp[]> => {
  try {
    // Use optimized RPC function directly
    const { data, error } = await supabase
      .rpc('get_camps_with_counts');
      
    if (error) {
      console.error('Error fetching camps:', error);
      throw error;
    }
    
    let filteredData = data || [];
    
    // Apply client-side filtering for now
    if (filters?.searchQuery) {
      const searchTerm = filters.searchQuery.toLowerCase();
      filteredData = filteredData.filter((camp: any) => 
        camp.title.toLowerCase().includes(searchTerm) ||
        camp.description?.toLowerCase().includes(searchTerm) ||
        camp.organizer.toLowerCase().includes(searchTerm)
      );
    }
    
    return filteredData.map(transformCampData);
  } catch (error) {
    console.error('Error in getCamps:', error);
    toast({
      title: "Error",
      description: "Failed to fetch summer camps. Please try again later.",
      variant: "destructive",
    });
    return [];
  }
};

/**
 * Fetch a single camp by ID
 */
export const getCampById = async (id: string): Promise<SummerCamp | null> => {
  try {
    const { data, error } = await supabase
      .from('summer_camps')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching camp details:', error);
      throw error;
    }
    
    return data ? transformCampData(data) : null;
  } catch (error) {
    console.error('Error in getCampById:', error);
    toast({
      title: "Error",
      description: "Failed to fetch camp details. Please try again later.",
      variant: "destructive",
    });
    return null;
  }
};

/**
 * Fetch camps created by a specific institution with enrollment counts
 * OPTIMIZED: Uses RPC function to avoid N+1 query problem
 */
export const getCampsByInstitution = async (userId: string): Promise<SummerCamp[]> => {
  try {
    // Use optimized RPC function directly
    const { data, error } = await supabase
      .rpc('get_camps_with_counts', { institution_id: userId });
      
    if (error) {
      console.error('Error fetching camps with counts:', error);
      throw error;
    }
    
    // Transform to expected format
    return (data || []).map(transformCampData);
  } catch (error) {
    console.error('Error in getCampsByInstitution:', error);
    toast({
      title: "Error",
      description: "Failed to fetch your summer camps. Please try again later.",
      variant: "destructive",
    });
    return [];
  }
};

/**
 * Create a new summer camp
 */
export const createCamp = async (campData: Omit<SummerCamp, 'id' | 'created_at' | 'updated_at'>): Promise<SummerCamp | null> => {
  try {
    const { data, error } = await supabase
      .from('summer_camps')
      .insert([campData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating summer camp:', error);
      throw error;
    }
    
    toast({
      title: "Success",
      description: "Summer camp created successfully.",
    });
    
    return transformCampData(data);
  } catch (error) {
    console.error('Error in createCamp:', error);
    toast({
      title: "Error",
      description: "Failed to create summer camp. Please try again.",
      variant: "destructive",
    });
    return null;
  }
};

/**
 * Update an existing summer camp
 */
export const updateCamp = async (id: string, campData: Partial<SummerCamp>): Promise<SummerCamp | null> => {
  try {
    const { data, error } = await supabase
      .from('summer_camps')
      .update(campData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating summer camp:', error);
      throw error;
    }
    
    toast({
      title: "Success",
      description: "Summer camp updated successfully.",
    });
    
    return transformCampData(data);
  } catch (error) {
    console.error('Error in updateCamp:', error);
    toast({
      title: "Error",
      description: "Failed to update summer camp. Please try again.",
      variant: "destructive",
    });
    return null;
  }
};

/**
 * Enroll a user in a summer camp
 */
export const enrollInCamp = async (campId: string, userId: string): Promise<CampEnrollment | null> => {
  try {
    // First check if the camp has available space
    const camp = await getCampById(campId);
    
    if (!camp) {
      throw new Error('Camp not found');
    }
    
    const maxParticipants = camp.max_participants || camp.capacity;
    if (camp.enrolled >= maxParticipants) {
      toast({
        title: "Cannot Enroll",
        description: "This camp is already at full capacity.",
        variant: "destructive",
      });
      return null;
    }
    
    // Create the enrollment record
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('camp_enrollments')
      .insert([
        {
          camp_id: campId,
          user_id: userId,
          status: 'confirmed',
          payment_status: 'pending'
        }
      ])
      .select()
      .single();
    
    if (enrollmentError) {
      console.error('Error enrolling in camp:', enrollmentError);
      throw enrollmentError;
    }
    
    // Update the enrolled count in the camp
    const { error: updateError } = await supabase
      .from('summer_camps')
      .update({ enrolled: camp.enrolled + 1 })
      .eq('id', campId);
    
    if (updateError) {
      console.error('Error updating camp enrollment count:', updateError);
      // Don't throw here as the enrollment was created
    }
    
    toast({
      title: "Success",
      description: "You have successfully enrolled in this camp.",
    });
    
    return transformEnrollment(enrollment);
  } catch (error: any) {
    console.error('Error in enrollInCamp:', error);
    
    // Handle unique constraint violation (already enrolled)
    if (error.code === '23505') {
      toast({
        title: "Already Enrolled",
        description: "You are already enrolled in this camp.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to enroll in camp. Please try again.",
        variant: "destructive",
      });
    }
    
    return null;
  }
};

/**
 * Cancel a user's enrollment in a camp
 */
export const cancelEnrollment = async (enrollmentId: string, campId: string): Promise<boolean> => {
  try {
    // Get the camp details first
    const camp = await getCampById(campId);
    
    if (!camp) {
      throw new Error('Camp not found');
    }
    
    // Update the enrollment status
    const { error: updateError } = await supabase
      .from('camp_enrollments')
      .update({ status: 'cancelled' })
      .eq('id', enrollmentId);
    
    if (updateError) {
      console.error('Error cancelling enrollment:', updateError);
      throw updateError;
    }
    
    // Update the enrolled count in the camp
    const { error: campUpdateError } = await supabase
      .from('summer_camps')
      .update({ enrolled: Math.max(0, camp.enrolled - 1) })
      .eq('id', campId);
    
    if (campUpdateError) {
      console.error('Error updating camp enrollment count:', campUpdateError);
      // Don't throw as the enrollment was updated
    }
    
    toast({
      title: "Enrollment Cancelled",
      description: "Your enrollment has been cancelled.",
    });
    
    return true;
  } catch (error) {
    console.error('Error in cancelEnrollment:', error);
    toast({
      title: "Error",
      description: "Failed to cancel enrollment. Please try again.",
      variant: "destructive",
    });
    return false;
  }
};

/**
 * Get all enrollments for a specific user
 */
export const getUserEnrollments = async (userId: string): Promise<CampEnrollment[]> => {
  try {
    const { data, error } = await supabase
      .from('camp_enrollments')
      .select(`
        *,
        camp:camp_id (*)
      `)
      .eq('user_id', userId)
      .eq('status', 'confirmed');
    
    if (error) {
      console.error('Error fetching user enrollments:', error);
      throw error;
    }
    
    return data ? data.map(transformEnrollment) : [];
  } catch (error) {
    console.error('Error in getUserEnrollments:', error);
    toast({
      title: "Error",
      description: "Failed to fetch your enrollments. Please try again later.",
      variant: "destructive",
    });
    return [];
  }
};

/**
 * Get all enrollments for a specific camp
 */
export const getCampEnrollments = async (campId: string): Promise<CampEnrollment[]> => {
  try {
    const { data, error } = await supabase
      .from('camp_enrollments')
      .select('*')
      .eq('camp_id', campId);
    
    if (error) {
      console.error('Error fetching camp enrollments:', error);
      throw error;
    }
    
    return data ? data.map(transformEnrollment) : [];
  } catch (error) {
    console.error('Error in getCampEnrollments:', error);
    toast({
      title: "Error",
      description: "Failed to fetch camp enrollments. Please try again later.",
      variant: "destructive",
    });
    return [];
  }
};
