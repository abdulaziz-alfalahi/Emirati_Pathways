import type {
  ProfessionalGroup,
  GroupMember,
  GroupPost,
  PostComment,
  GroupResource,
  NetworkingEvent,
  ModerationLog,
  CreateGroupData,
  CreatePostData,
  CreateResourceData,
  CreateEventData,
  GroupPoll,
  PollVote,
  GroupEvent,
  EventRsvp,
  CreatePollData,
  CreateGroupEventData,
  UserInterest,
  GroupRecommendation,
  GroupWithMetrics,
  AdvancedSearchFilters,
  SearchSuggestion
} from '@/types/communities';

export class CommunitiesService {
  // Groups Management
  static async getGroups(filters?: {
    industry?: string;
    category?: string;
    search?: string;
    is_private?: boolean;
  }): Promise<ProfessionalGroup[]> {
    let query = supabase
      .from('professional_groups')
      .select('*')
      .order('member_count', { ascending: false });

    if (filters?.industry) {
      query = query.eq('industry', filters.industry);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.is_private !== undefined) {
      query = query.eq('is_private', filters.is_private);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async getGroupById(id: string): Promise<ProfessionalGroup | null> {
    const { data, error } = await supabase
      .from('professional_groups')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  static async createGroup(groupData: CreateGroupData): Promise<ProfessionalGroup> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('professional_groups')
      .insert({
        creator_id: user.user.id,
        ...groupData
      })
      .select()
      .single();

    if (error) throw error;

    // Add creator as admin member
    await this.joinGroup(data.id, 'admin');

    return data;
  }

  static async getUserGroups(): Promise<ProfessionalGroup[]> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];

    const { data, error } = await supabase
      .from('professional_groups')
      .select(`
        *,
        group_members!inner(*)
      `)
      .eq('group_members.user_id', user.user.id)
      .order('group_members.joined_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Member Management
  static async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        *,
        profiles(id, full_name, email)
      `)
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    
    return (data || []).map(member => ({
      ...member,
      role: member.role as 'admin' | 'moderator' | 'member'
    }));
  }

  static async joinGroup(groupId: string, role: GroupMember['role'] = 'member'): Promise<GroupMember> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: user.user.id,
        role
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      role: data.role as 'admin' | 'moderator' | 'member'
    };
  }

  static async leaveGroup(groupId: string): Promise<void> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.user.id);

    if (error) throw error;
  }

  static async updateMemberRole(groupId: string, userId: string, role: GroupMember['role']): Promise<void> {
    const { error } = await supabase
      .from('group_members')
      .update({ role })
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // Posts and Discussions
  static async getGroupPosts(groupId: string): Promise<GroupPost[]> {
    const { data, error } = await supabase
      .from('group_posts')
      .select(`
        *,
        profiles(id, full_name, avatar_url)
      `)
      .eq('group_id', groupId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(post => ({
      ...post,
      post_type: post.post_type as 'discussion' | 'announcement' | 'resource' | 'event' | 'poll'
    }));
  }

  static async createPost(groupId: string, postData: CreatePostData): Promise<GroupPost> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('group_posts')
      .insert({
        group_id: groupId,
        user_id: user.user.id,
        ...postData
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      post_type: data.post_type as 'discussion' | 'announcement' | 'resource' | 'event' | 'poll'
    };
  }

  static async togglePostLike(postId: string): Promise<boolean> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.user.id)
      .single();

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.user.id);
      
      if (error) throw error;
      return false;
    } else {
      // Like
      const { error } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: user.user.id
        });
      
      if (error) throw error;
      return true;
    }
  }

  static async getPostComments(postId: string): Promise<PostComment[]> {
    const { data, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        profiles(id, full_name, avatar_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async addComment(postId: string, content: string): Promise<PostComment> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: user.user.id,
        content
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Resources
  static async getGroupResources(groupId: string): Promise<GroupResource[]> {
    const { data, error } = await supabase
      .from('group_resources')
      .select(`
        *,
        profiles(id, full_name)
      `)
      .eq('group_id', groupId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Cast resource_type to the proper type
    return (data || []).map(resource => ({
      ...resource,
      resource_type: resource.resource_type as 'document' | 'link' | 'video' | 'image'
    }));
  }

  static async createResource(groupId: string, resourceData: CreateResourceData): Promise<GroupResource> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('group_resources')
      .insert({
        group_id: groupId,
        user_id: user.user.id,
        ...resourceData
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      resource_type: data.resource_type as 'document' | 'link' | 'video' | 'image'
    };
  }

  // Events
  static async getEvents(groupId: string): Promise<NetworkingEvent[]> {
    const { data, error } = await supabase
      .from('networking_events')
      .select(`
        *,
        profiles(id, full_name)
      `)
      .eq('group_id', groupId)
      .gte('end_date', new Date().toISOString())
      .order('start_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async createEvent(groupId: string, eventData: CreateEventData): Promise<NetworkingEvent> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('networking_events')
      .insert({
        group_id: groupId,
        organizer_id: user.user.id,
        ...eventData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Moderation
  static async getModerationLogs(groupId: string): Promise<ModerationLog[]> {
    const { data, error } = await supabase
      .from('moderation_logs')
      .select(`
        *,
        moderator:profiles!moderation_logs_moderator_id_fkey(id, full_name),
        target_user:profiles!moderation_logs_target_user_id_fkey(id, full_name)
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Cast action_type to the proper type
    return (data || []).map(log => ({
      ...log,
      action_type: log.action_type as 'warn' | 'mute' | 'ban' | 'delete_post' | 'pin_post' | 'unpin_post'
    }));
  }

  static async moderatePost(
    groupId: string,
    postId: string,
    action: ModerationLog['action_type'],
    reason?: string
  ): Promise<void> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Perform the action
    if (action === 'delete_post') {
      // TODO: Connect to Flask API - await supabase.from('group_posts').delete().eq('id', postId);
    } else if (action === 'pin_post') {
      // TODO: Connect to Flask API - await supabase.from('group_posts').update({ is_pinned: true }).eq('id', postId);
    } else if (action === 'unpin_post') {
      // TODO: Connect to Flask API - await supabase.from('group_posts').update({ is_pinned: false }).eq('id', postId);
    }

    // Log the action
    // TODO: Connect to Flask API - await supabase.from('moderation_logs').insert({
      group_id: groupId,
      moderator_id: user.user.id,
      target_post_id: postId,
      action_type: action,
      reason
    });
  }

  static async getUserMembershipStatus(groupId: string): Promise<GroupMember | null> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;

    const { data, error } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', user.user.id)
      .single();

    if (error) return null;
    return {
      ...data,
      role: data.role as 'admin' | 'moderator' | 'member'
    };
  }

  // Polls
  static async getGroupPolls(groupId: string): Promise<GroupPoll[]> {
    const { data, error } = await supabase
      .from('group_polls')
      .select(`
        *,
        profiles(id, full_name)
      `)
      .eq('group_id', groupId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(poll => ({
      ...poll,
      options: JSON.parse(poll.options as string)
    }));
  }

  static async createPoll(groupId: string, pollData: CreatePollData): Promise<GroupPoll> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const options = pollData.options.map((text, index) => ({
      id: index,
      text,
      votes: 0
    }));

    const { data, error } = await supabase
      .from('group_polls')
      .insert({
        group_id: groupId,
        user_id: user.user.id,
        title: pollData.title,
        description: pollData.description,
        options: JSON.stringify(options),
        multiple_choice: pollData.multiple_choice,
        expires_at: pollData.expires_at
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      options: JSON.parse(data.options as string)
    };
  }

  static async votePoll(pollId: string, selectedOptions: number[]): Promise<PollVote> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('poll_votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('user_id', user.user.id)
      .single();

    if (existingVote) {
      // Update existing vote
      const { data, error } = await supabase
        .from('poll_votes')
        .update({ selected_options: selectedOptions })
        .eq('poll_id', pollId)
        .eq('user_id', user.user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new vote
      const { data, error } = await supabase
        .from('poll_votes')
        .insert({
          poll_id: pollId,
          user_id: user.user.id,
          selected_options: selectedOptions
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }

  static async getPollVotes(pollId: string): Promise<PollVote[]> {
    const { data, error } = await supabase
      .from('poll_votes')
      .select('*')
      .eq('poll_id', pollId);

    if (error) throw error;
    return data || [];
  }

  // Group Events
  static async getGroupEvents(groupId: string): Promise<GroupEvent[]> {
    const { data, error } = await supabase
      .from('group_events')
      .select(`
        *,
        profiles(id, full_name)
      `)
      .eq('group_id', groupId)
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString())
      .order('start_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async createGroupEvent(groupId: string, eventData: CreateGroupEventData): Promise<GroupEvent> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('group_events')
      .insert({
        group_id: groupId,
        user_id: user.user.id,
        ...eventData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async rsvpEvent(eventId: string, status: EventRsvp['status']): Promise<EventRsvp> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Check if user already has an RSVP
    const { data: existingRsvp } = await supabase
      .from('event_rsvps')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user.user.id)
      .single();

    if (existingRsvp) {
      // Update existing RSVP
      const { data, error } = await supabase
        .from('event_rsvps')
        .update({ status })
        .eq('event_id', eventId)
        .eq('user_id', user.user.id)
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        status: data.status as EventRsvp['status']
      };
    } else {
      // Create new RSVP
      const { data, error } = await supabase
        .from('event_rsvps')
        .insert({
          event_id: eventId,
          user_id: user.user.id,
          status
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        status: data.status as EventRsvp['status']
      };
    }
  }

  static async getEventRsvps(eventId: string): Promise<EventRsvp[]> {
    const { data, error } = await supabase
      .from('event_rsvps')
      .select('*')
      .eq('event_id', eventId);

    if (error) throw error;
    return (data || []).map(rsvp => ({
      ...rsvp,
      status: rsvp.status as EventRsvp['status']
    }));
  }

  // Enhanced Discovery Methods
  static async getRecommendedGroups(): Promise<GroupRecommendation[]> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];

    const { data, error } = await supabase
      .from('group_recommendations')
      .select(`
        *,
        professional_groups(*)
      `)
      .eq('user_id', user.user.id)
      .eq('is_dismissed', false)
      .order('recommendation_score', { ascending: false })
      .limit(10);

    if (error) throw error;
    return (data || []).map(rec => ({
      ...rec,
      group: rec.professional_groups
    }));
  }

  static async getTrendingGroups(limit: number = 10): Promise<GroupWithMetrics[]> {
    // Get groups with recent activity data
    const { data, error } = await supabase
      .from('professional_groups')
      .select(`
        *,
        group_activity_metrics!left(
          id,
          group_id,
          activity_date,
          new_members_count,
          posts_count,
          comments_count,
          likes_count,
          events_count,
          polls_count,
          engagement_score,
          created_at
        )
      `)
      .eq('is_private', false)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      // Fallback to regular groups if query fails
      return this.getGroups({ is_private: false });
    }

    // Calculate trending scores client-side and add metrics
    return (data || []).map(group => {
      const recentMetrics = group.group_activity_metrics?.filter(
        metric => new Date(metric.activity_date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ) || [];
      
      const trendingScore = recentMetrics.reduce((score, metric) => {
        return score + (metric.engagement_score || 0);
      }, 0);

      // Remove the group_activity_metrics from the response and add computed fields
      const { group_activity_metrics, ...groupData } = group;
      
      return {
        ...groupData,
        trending_score: trendingScore,
        recent_activity: recentMetrics.length > 0 ? recentMetrics[0] : undefined
      };
    }).sort((a, b) => (b.trending_score || 0) - (a.trending_score || 0));
  }

  static async getGroupsWithAdvancedFilters(filters: AdvancedSearchFilters): Promise<GroupWithMetrics[]> {
    let query = supabase
      .from('professional_groups')
      .select(`
        *,
        group_activity_metrics!left(
          new_members_count,
          posts_count,
          events_count,
          polls_count,
          engagement_score
        )
      `);

    // Apply filters
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,tags.cs.{${filters.search}}`);
    }
    if (filters.industry) {
      query = query.eq('industry', filters.industry);
    }
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.is_private !== undefined) {
      query = query.eq('is_private', filters.is_private);
    }
    if (filters.min_members) {
      query = query.gte('member_count', filters.min_members);
    }
    if (filters.max_members) {
      query = query.lte('member_count', filters.max_members);
    }
    if (filters.created_after) {
      query = query.gte('created_at', filters.created_after);
    }

    // Apply sorting
    switch (filters.sort_by) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'largest':
        query = query.order('member_count', { ascending: false });
        break;
      case 'trending':
        query = query.order('updated_at', { ascending: false });
        break;
      default:
        query = query.order('member_count', { ascending: false });
    }

    const { data, error } = await query.limit(50);
    if (error) throw error;

    // Log search analytics
    if (filters.search) {
      await this.logSearchAnalytics(filters.search, data?.length || 0, filters);
    }

    return data || [];
  }

  static async getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];

    // Get industry suggestions
    const { data: industryData } = await supabase
      .from('professional_groups')
      .select('industry')
      .ilike('industry', `%${query}%`)
      .not('industry', 'is', null);

    if (industryData) {
      const industries = [...new Set(industryData.map(g => g.industry))];
      industries.forEach(industry => {
        if (industry) {
          suggestions.push({
            type: 'industry',
            value: industry,
            count: industryData.filter(g => g.industry === industry).length
          });
        }
      });
    }

    // Get category suggestions
    const { data: categoryData } = await supabase
      .from('professional_groups')
      .select('category')
      .ilike('category', `%${query}%`)
      .not('category', 'is', null);

    if (categoryData) {
      const categories = [...new Set(categoryData.map(g => g.category))];
      categories.forEach(category => {
        if (category) {
          suggestions.push({
            type: 'category',
            value: category,
            count: categoryData.filter(g => g.category === category).length
          });
        }
      });
    }

    return suggestions.slice(0, 8);
  }

  static async updateUserInterests(interests: Omit<UserInterest, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Delete existing interests
    await supabase
      .from('user_interests')
      .delete()
      .eq('user_id', user.user.id);

    // Insert new interests
    if (interests.length > 0) {
      const { error } = await supabase
        .from('user_interests')
        .insert(
          interests.map(interest => ({
            ...interest,
            user_id: user.user.id
          }))
        );

      if (error) throw error;
    }
  }

  static async getUserInterests(): Promise<UserInterest[]> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];

    const { data, error } = await supabase
      .from('user_interests')
      .select('*')
      .eq('user_id', user.user.id)
      .order('weight', { ascending: false });

    if (error) throw error;
    return (data || []).map(interest => ({
      ...interest,
      interest_type: interest.interest_type as 'industry' | 'skill' | 'topic' | 'career_stage'
    }));
  }

  static async dismissRecommendation(recommendationId: string): Promise<void> {
    const { error } = await supabase
      .from('group_recommendations')
      .update({ is_dismissed: true })
      .eq('id', recommendationId);

    if (error) throw error;
  }

  static async logGroupClick(groupId: string, searchQuery?: string): Promise<void> {
    if (searchQuery) {
      await this.logSearchAnalytics(searchQuery, 1, {}, groupId);
    }
  }

  private static async logSearchAnalytics(
    query: string, 
    resultsCount: number, 
    filters: Record<string, any> = {},
    clickedGroupId?: string
  ): Promise<void> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('group_search_analytics')
      .insert({
        search_query: query,
        user_id: user?.user?.id,
        results_count: resultsCount,
        clicked_group_id: clickedGroupId,
        search_filters: filters
      });

    if (error) console.error('Failed to log search analytics:', error);
  }
}
