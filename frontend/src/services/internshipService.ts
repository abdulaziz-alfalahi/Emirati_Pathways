import { supabase } from '@/integrations/supabase/client';
import { Internship, InternshipApplication, InternshipWithApplications } from '@/types/internships';

export interface InternshipFilters {
  industry?: string[];
  isPaid?: boolean;
  location?: string[];
  search?: string;
}

export interface PaginatedInternshipsResult {
  internships: Internship[];
  totalCount: number;
  hasMore: boolean;
}

export interface InternshipQueryOptions {
  page?: number;
  pageSize?: number;
  filters?: InternshipFilters;
}

/**
 * Fetch internships with pagination and optimized queries to prevent N+1 problems
 */
export const getInternshipsPaginated = async (
  options: InternshipQueryOptions = {}
): Promise<PaginatedInternshipsResult> => {
  const { page = 1, pageSize = 20, filters } = options;
  const offset = (page - 1) * pageSize;

  try {
    // Build query with all necessary joins to prevent N+1 queries
    let query = supabase
      .from('internships')
      .select(`
        *,
        applications:internship_applications(count),
        creator:profiles!internships_created_by_fkey(
          id,
          full_name,
          email
        )
      `, { count: 'exact' })
      .eq('is_active', true);

    // Apply filters
    if (filters) {
      if (filters.industry && filters.industry.length > 0) {
        query = query.in('industry', filters.industry);
      }
      
      if (filters.isPaid !== undefined) {
        query = query.eq('is_paid', filters.isPaid);
      }
      
      if (filters.location && filters.location.length > 0) {
        // Use OR condition for location matching
        const locationConditions = filters.location
          .map(loc => `location.ilike.%${loc}%`)
          .join(',');
        query = query.or(locationConditions);
      }
      
      if (filters.search) {
        const searchTerm = `%${filters.search.toLowerCase()}%`;
        query = query.or(`title.ilike.${searchTerm},company.ilike.${searchTerm},description.ilike.${searchTerm}`);
      }
    }

    // Apply pagination and ordering
    query = query
      .range(offset, offset + pageSize - 1)
      .order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    const internships = (data || []).map(internship => ({
      ...internship,
      // Extract application count from aggregated data
      applicationCount: internship.applications?.[0]?.count || 0
    }));

    return {
      internships,
      totalCount: count || 0,
      hasMore: (count || 0) > offset + pageSize
    };
  } catch (error) {
    console.error('Error fetching internships:', error);
    throw error;
  }
};

/**
 * Legacy function for backward compatibility
 */
export const getInternships = async (filters?: InternshipFilters): Promise<Internship[]> => {
  const result = await getInternshipsPaginated({
    page: 1,
    pageSize: 1000, // Large page size for "all" results
    filters
  });
  return result.internships;
};

/**
 * Create a new internship listing
 */
export const createInternship = async (internshipData: Omit<Internship, 'id' | 'created_at'>): Promise<Internship> => {
  try {
    const { data, error } = await supabase
      .from('internships')
      .insert([internshipData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating internship:', error);
    throw error;
  }
};

/**
 * Update internship status (active/inactive)
 */
export const updateInternshipStatus = async (internshipId: string, isActive: boolean): Promise<void> => {
  try {
    const { error } = await supabase
      .from('internships')
      .update({ is_active: isActive })
      .eq('id', internshipId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating internship status:', error);
    throw error;
  }
};

/**
 * Get internships with application counts for management
 */
export const getInternshipsWithApplicationCounts = async (userId: string): Promise<InternshipWithApplications[]> => {
  try {
    const { data, error } = await supabase
      .from('internships')
      .select(`
        *,
        applications:internship_applications(
          status,
          count
        )
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(internship => {
      const applications = internship.applications || [];
      const statusCounts = {
        pending: 0,
        approved: 0,
        rejected: 0,
        withdrawn: 0
      };

      // Count applications by status
      applications.forEach((app: any) => {
        if (app.status in statusCounts) {
          statusCounts[app.status as keyof typeof statusCounts]++;
        }
      });

      // Calculate total separately to avoid readonly issue
      const totalApplications = statusCounts.pending + statusCounts.approved + statusCounts.rejected + statusCounts.withdrawn;

      return {
        ...internship,
        applications: {
          ...statusCounts,
          total: totalApplications
        }
      };
    });
  } catch (error) {
    console.error('Error fetching internships with application counts:', error);
    throw error;
  }
};

/**
 * Apply for an internship
 */
export const applyForInternship = async (
  internshipId: string,
  userId: string
): Promise<InternshipApplication> => {
  try {
    const { data, error } = await supabase
      .from('internship_applications')
      .insert([
        {
          internship_id: internshipId,
          student_id: userId,
          status: 'pending' as const
        }
      ])
      .select(`
        *,
        internship:internships(*)
      `)
      .single();

    if (error) throw error;
    return data as InternshipApplication;
  } catch (error) {
    console.error('Error applying for internship:', error);
    throw error;
  }
};

/**
 * Get user's internship applications
 */
export const getUserApplications = async (userId: string): Promise<InternshipApplication[]> => {
  try {
    const { data, error } = await supabase
      .from('internship_applications')
      .select(`
        *,
        internship:internships(*)
      `)
      .eq('student_id', userId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return (data || []) as InternshipApplication[];
  } catch (error) {
    console.error('Error fetching user applications:', error);
    throw error;
  }
};
