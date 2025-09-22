
import { supabase } from '@/integrations/supabase/client';
import { SummerCamp } from '@/types/summerCamps';
import { toast } from '@/hooks/use-toast';
import { handleServiceError } from './utils';

// Helper function to transform database data to SummerCamp type
const transformCampData = (data: any): SummerCamp => ({
  ...data,
  // Provide defaults for optional fields that might not exist in DB
  max_participants: data.max_participants || data.capacity,
  registration_deadline: data.registration_deadline || null,
  rating: data.rating || null
});

// Service for camp CRUD operations
export const campService = {
  /**
   * Create a new summer camp
   */
  async createCamp(campData: Omit<SummerCamp, 'id' | 'created_at' | 'updated_at'>): Promise<SummerCamp | null> {
    try {
      const { data, error } = await supabase
        .from('summer_camps')
        .insert([campData])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Summer camp created successfully.",
      });
      
      return transformCampData(data);
    } catch (error) {
      handleServiceError(error, 'Failed to create summer camp. Please try again.');
      return null;
    }
  },

  /**
   * Update an existing summer camp
   */
  async updateCamp(id: string, campData: Partial<SummerCamp>): Promise<SummerCamp | null> {
    try {
      const { data, error } = await supabase
        .from('summer_camps')
        .update(campData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Summer camp updated successfully.",
      });
      
      return transformCampData(data);
    } catch (error) {
      handleServiceError(error, 'Failed to update summer camp. Please try again.');
      return null;
    }
  }
};
