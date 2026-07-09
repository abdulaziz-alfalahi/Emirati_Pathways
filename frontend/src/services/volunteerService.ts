import { VolunteerOpportunity, VolunteerApplication } from '@/types/volunteer';

export const volunteerService = {
  // Get all active volunteer opportunities
  async getActiveOpportunities(): Promise<VolunteerOpportunity[]> {
    const { data, error } = await supabase
      .from('volunteer_opportunities')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as VolunteerOpportunity[];
  },

  // Get user's volunteer applications
  async getUserApplications(userId: string): Promise<VolunteerApplication[]> {
    const { data, error } = await supabase
      .from('volunteer_applications')
      .select(`
        *,
        opportunity:volunteer_opportunities(*)
      `)
      .eq('user_id', userId)
      .order('applied_at', { ascending: false });

    if (error) throw error;
    return (data || []) as VolunteerApplication[];
  },

  // Submit a volunteer application
  async submitApplication(
    opportunityId: string, 
    userId: string, 
    message?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('volunteer_applications')
      .insert({
        opportunity_id: opportunityId,
        user_id: userId,
        application_message: message,
        status: 'pending'
      });

    if (error) throw error;
  },

  // Update application status (for organization use)
  async updateApplicationStatus(
    applicationId: string, 
    status: 'approved' | 'rejected' | 'completed'
  ): Promise<void> {
    const { error } = await supabase
      .from('volunteer_applications')
      .update({ status })
      .eq('id', applicationId);

    if (error) throw error;
  },

  // Update volunteer hours (when work is completed)
  async updateVolunteerHours(
    applicationId: string, 
    hours: number, 
    feedback?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('volunteer_applications')
      .update({ 
        hours_completed: hours,
        volunteer_feedback: feedback,
        status: 'completed',
        completion_date: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (error) throw error;
  }
};
