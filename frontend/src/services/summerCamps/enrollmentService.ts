import { CampEnrollment } from '@/types/summerCamps';
import { toast } from '@/hooks/use-toast';
import { handleServiceError, transformEnrollment } from './utils';
import { campQueryService } from './campQueryService';

// Service for enrollment operations
export const enrollmentService = {
  /**
   * Enroll a user in a summer camp
   */
  async enrollInCamp(campId: string, userId: string): Promise<CampEnrollment | null> {
    try {
      // First check if the camp has available space
      const camp = await campQueryService.getCampById(campId);
      
      if (!camp) {
        throw new Error('Camp not found');
      }
      
      if (camp.enrolled >= camp.capacity) {
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
  },

  /**
   * Cancel a user's enrollment in a camp
   */
  async cancelEnrollment(enrollmentId: string, campId: string): Promise<boolean> {
    try {
      // Get the camp details first
      const camp = await campQueryService.getCampById(campId);
      
      if (!camp) {
        throw new Error('Camp not found');
      }
      
      // Update the enrollment status
      const { error: updateError } = await supabase
        .from('camp_enrollments')
        .update({ status: 'cancelled' })
        .eq('id', enrollmentId);
      
      if (updateError) {
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
      handleServiceError(error, 'Failed to cancel enrollment. Please try again.');
      return false;
    }
  },

  /**
   * Get all enrollments for a specific user
   */
  async getUserEnrollments(userId: string): Promise<CampEnrollment[]> {
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
        throw error;
      }
      
      return data ? data.map(transformEnrollment) : [];
    } catch (error) {
      handleServiceError(error, 'Failed to fetch your enrollments. Please try again later.');
      return [];
    }
  },

  /**
   * Get all enrollments for a specific camp
   */
  async getCampEnrollments(campId: string): Promise<CampEnrollment[]> {
    try {
      const { data, error } = await supabase
        .from('camp_enrollments')
        .select('*')
        .eq('camp_id', campId);
      
      if (error) {
        throw error;
      }
      
      return data ? data.map(transformEnrollment) : [];
    } catch (error) {
      handleServiceError(error, 'Failed to fetch camp enrollments. Please try again later.');
      return [];
    }
  }
};
