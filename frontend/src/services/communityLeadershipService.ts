import { CommunityLeadershipResource } from '@/types/communityLeadership';

export const communityLeadershipService = {
  // Get all active community leadership resources
  async getActiveResources(): Promise<CommunityLeadershipResource[]> {
    const { data, error } = await supabase
      .from('community_leadership_resources')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as CommunityLeadershipResource[];
  },

  // Get resources by type
  async getResourcesByType(type: string): Promise<CommunityLeadershipResource[]> {
    const { data, error } = await supabase
      .from('community_leadership_resources')
      .select('*')
      .eq('status', 'active')
      .eq('type', type)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as CommunityLeadershipResource[];
  },

  // Get featured resources
  async getFeaturedResources(): Promise<CommunityLeadershipResource[]> {
    const { data, error } = await supabase
      .from('community_leadership_resources')
      .select('*')
      .eq('status', 'active')
      .eq('is_featured', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as CommunityLeadershipResource[];
  }
};
