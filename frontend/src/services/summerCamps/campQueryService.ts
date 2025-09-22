
import { supabase } from '@/integrations/supabase/client';
import { SummerCamp, CampFilters } from '@/types/summerCamps';
import { toast } from '@/hooks/use-toast';
import { handleServiceError } from './utils';

export interface PaginatedCampsResult {
  camps: SummerCamp[];
  totalCount: number;
  hasMore: boolean;
}

export interface CampQueryOptions {
  page?: number;
  pageSize?: number;
  filters?: CampFilters;
}

// Helper function to transform database data to SummerCamp type
const transformCampData = (data: any): SummerCamp => ({
  ...data,
  // Provide defaults for optional fields that might not exist in DB
  max_participants: data.max_participants || data.capacity,
  registration_deadline: data.registration_deadline || null,
  rating: data.rating || null
});

// Service for querying camps with optimized pagination and N+1 query prevention
export const campQueryService = {
  /**
   * Fetch camps with pagination and optimized queries
   */
  async getCampsPaginated(options: CampQueryOptions = {}): Promise<PaginatedCampsResult> {
    const { page = 1, pageSize = 20, filters } = options;
    const offset = (page - 1) * pageSize;

    try {
      // Build the query with all necessary joins upfront to prevent N+1 queries
      let query = supabase
        .from('summer_camps')
        .select(`
          *,
          enrollments:camp_enrollments(count),
          created_by_profile:profiles!summer_camps_created_by_fkey(
            id,
            full_name,
            email
          )
        `, { count: 'exact' });
      
      // Apply filters
      if (filters) {
        if (filters.category && filters.category.length > 0) {
          query = query.in('category', filters.category);
        }
        
        if (filters.ageGroup && filters.ageGroup.length > 0) {
          query = query.in('age_group', filters.ageGroup);
        }
        
        if (filters.location && filters.location.length > 0) {
          query = query.in('location', filters.location);
        }
        
        if (filters.searchQuery) {
          const searchTerm = `%${filters.searchQuery.toLowerCase()}%`;
          query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm},organizer.ilike.${searchTerm}`);
        }
      }

      // Apply pagination
      query = query
        .range(offset, offset + pageSize - 1)
        .order('created_at', { ascending: false });
      
      const { data, error, count } = await query;
      
      if (error) {
        throw error;
      }
      
      const camps = (data || []).map((camp: any) => transformCampData({
        ...camp,
        // Extract enrollment count from the aggregated data
        enrolled: camp.enrollments?.[0]?.count || 0
      }));

      return {
        camps,
        totalCount: count || 0,
        hasMore: (count || 0) > offset + pageSize
      };
    } catch (error) {
      handleServiceError(error, 'Failed to fetch summer camps. Please try again later.');
      return {
        camps: [],
        totalCount: 0,
        hasMore: false
      };
    }
  },

  /**
   * Fetch all summer camps (legacy method for backward compatibility)
   */
  async getCamps(filters?: CampFilters): Promise<SummerCamp[]> {
    const result = await this.getCampsPaginated({ 
      page: 1, 
      pageSize: 1000, // Large page size for "all" results
      filters 
    });
    return result.camps;
  },

  /**
   * Fetch a single camp by ID with optimized query
   */
  async getCampById(id: string): Promise<SummerCamp | null> {
    try {
      const { data, error } = await supabase
        .from('summer_camps')
        .select(`
          *,
          enrollments:camp_enrollments(
            id,
            user_id,
            status,
            enrolled_at,
            user:profiles(full_name, email)
          ),
          created_by_profile:profiles!summer_camps_created_by_fkey(
            id,
            full_name,
            email
          )
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        return null;
      }

      // Calculate enrolled count from the actual enrollments
      const enrolledCount = data.enrollments?.filter(
        (enrollment: any) => enrollment.status === 'confirmed'
      ).length || 0;

      return transformCampData({
        ...data,
        enrolled: enrolledCount
      });
    } catch (error) {
      handleServiceError(error, 'Failed to fetch camp details. Please try again later.');
      return null;
    }
  },

  /**
   * Fetch camps created by a specific institution with pagination
   */
  async getCampsByInstitutionPaginated(
    userId: string, 
    options: Omit<CampQueryOptions, 'filters'> = {}
  ): Promise<PaginatedCampsResult> {
    const { page = 1, pageSize = 20 } = options;
    const offset = (page - 1) * pageSize;

    try {
      const { data, error, count } = await supabase
        .from('summer_camps')
        .select(`
          *,
          enrollments:camp_enrollments(count)
        `, { count: 'exact' })
        .eq('created_by', userId)
        .range(offset, offset + pageSize - 1)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      const camps = (data || []).map((camp: any) => transformCampData({
        ...camp,
        enrolled: camp.enrollments?.[0]?.count || 0
      }));

      return {
        camps,
        totalCount: count || 0,
        hasMore: (count || 0) > offset + pageSize
      };
    } catch (error) {
      handleServiceError(error, 'Failed to fetch your summer camps. Please try again later.');
      return {
        camps: [],
        totalCount: 0,
        hasMore: false
      };
    }
  },

  /**
   * Legacy method for backward compatibility
   */
  async getCampsByInstitution(userId: string): Promise<SummerCamp[]> {
    const result = await this.getCampsByInstitutionPaginated(userId, { 
      page: 1, 
      pageSize: 1000 
    });
    return result.camps;
  }
};
