import type {
  Skill,
  UserSkill,
  SkillOpportunity,
  SkillApplication,
  ProjectCollaboration,
  SkillExchangeRequest,
  SkillFilters,
  SkillLevel,
  OpportunityType,
  ApplicationStatus,
  ProjectStatus
} from '@/types/skillsMarketplace';

// Extended types for database responses
interface SkillOpportunityWithExtras extends SkillOpportunity {
  skills?: Skill[];
  application_count?: number;
}

export class SkillsMarketplaceService {
  // Skills Management
  async getAllSkills(): Promise<Skill[]> {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getSkillsByCategory(): Promise<Record<string, Skill[]>> {
    const skills = await this.getAllSkills();
    return skills.reduce((acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = [];
      }
      acc[skill.category].push(skill);
      return acc;
    }, {} as Record<string, Skill[]>);
  }

  async createSkill(skillData: { name: string; category: string; description?: string }): Promise<Skill> {
    const { data, error } = await supabase
      .from('skills')
      .insert(skillData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // User Skills Management
  async getUserSkills(userId?: string): Promise<UserSkill[]> {
    // TODO: Connect to Flask API - const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!targetUserId) return [];

    const { data, error } = await supabase
      .from('user_skills')
      .select(`
        *,
        skill:skills(*)
      `)
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async addUserSkill(skillData: {
    skill_id: string;
    skill_level: SkillLevel;
    years_experience: number;
    description?: string;
    portfolio_links?: string[];
  }): Promise<UserSkill> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_skills')
      .insert({
        user_id: user.user.id,
        ...skillData,
        portfolio_links: skillData.portfolio_links || []
      })
      .select(`
        *,
        skill:skills(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async updateUserSkill(skillId: string, updates: Partial<UserSkill>): Promise<UserSkill> {
    const { data, error } = await supabase
      .from('user_skills')
      .update(updates)
      .eq('id', skillId)
      .select(`
        *,
        skill:skills(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async deleteUserSkill(skillId: string): Promise<void> {
    const { error } = await supabase
      .from('user_skills')
      .delete()
      .eq('id', skillId);

    if (error) throw error;
  }

  // Opportunities Management
  async getOpportunities(filters?: SkillFilters): Promise<SkillOpportunityWithExtras[]> {
    let query = supabase
      .from('skill_opportunities')
      .select(`
        *,
        creator:profiles!skill_opportunities_created_by_fkey(id, full_name, email)
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (filters?.opportunity_type) {
      query = query.eq('opportunity_type', filters.opportunity_type);
    }

    if (filters?.skill_level) {
      query = query.eq('skill_level_required', filters.skill_level);
    }

    if (filters?.is_remote !== undefined) {
      query = query.eq('is_remote', filters.is_remote);
    }

    if (filters?.budget_min) {
      query = query.gte('budget_amount', filters.budget_min);
    }

    if (filters?.budget_max) {
      query = query.lte('budget_amount', filters.budget_max);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Get skills for each opportunity
    const opportunities: SkillOpportunityWithExtras[] = data || [];
    for (const opportunity of opportunities) {
      if (opportunity.required_skills?.length > 0) {
        const { data: skills } = await supabase
          .from('skills')
          .select('*')
          .in('id', opportunity.required_skills);
        opportunity.skills = skills || [];
      }

      // Get application count
      const { count } = await supabase
        .from('skill_applications')
        .select('*', { count: 'exact', head: true })
        .eq('opportunity_id', opportunity.id);
      opportunity.application_count = count || 0;
    }

    return opportunities;
  }

  async getOpportunityById(id: string): Promise<SkillOpportunityWithExtras | null> {
    const { data, error } = await supabase
      .from('skill_opportunities')
      .select(`
        *,
        creator:profiles!skill_opportunities_created_by_fkey(id, full_name, email)
      `)
      .eq('id', id)
      .single();

    if (error) return null;

    const opportunity: SkillOpportunityWithExtras = data;

    // Get required skills
    if (opportunity.required_skills?.length > 0) {
      const { data: skills } = await supabase
        .from('skills')
        .select('*')
        .in('id', opportunity.required_skills);
      opportunity.skills = skills || [];
    }

    return opportunity;
  }

  async createOpportunity(opportunityData: {
    title: string;
    description: string;
    opportunity_type: OpportunityType;
    required_skills: string[];
    skill_level_required: SkillLevel;
    duration_hours?: number;
    budget_amount?: number;
    budget_currency?: string;
    location?: string;
    is_remote: boolean;
    deadline?: string;
    max_applicants?: number;
  }): Promise<SkillOpportunity> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('skill_opportunities')
      .insert({
        created_by: user.user.id,
        ...opportunityData,
        max_applicants: opportunityData.max_applicants || 5
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateOpportunity(id: string, updates: Partial<SkillOpportunity>): Promise<SkillOpportunity> {
    const { data, error } = await supabase
      .from('skill_opportunities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserOpportunities(): Promise<SkillOpportunityWithExtras[]> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];

    const { data, error } = await supabase
      .from('skill_opportunities')
      .select(`
        *,
        creator:profiles!skill_opportunities_created_by_fkey(id, full_name, email)
      `)
      .eq('created_by', user.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Applications Management
  async submitApplication(applicationData: {
    opportunity_id: string;
    cover_letter?: string;
    proposed_timeline?: string;
    proposed_budget?: number;
    portfolio_links?: string[];
  }): Promise<SkillApplication> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('skill_applications')
      .insert({
        applicant_id: user.user.id,
        ...applicationData,
        portfolio_links: applicationData.portfolio_links || []
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getApplicationsForOpportunity(opportunityId: string): Promise<SkillApplication[]> {
    const { data, error } = await supabase
      .from('skill_applications')
      .select(`
        *,
        applicant:profiles!skill_applications_applicant_id_fkey(id, full_name, email)
      `)
      .eq('opportunity_id', opportunityId)
      .order('applied_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getUserApplications(): Promise<SkillApplication[]> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];

    const { data, error } = await supabase
      .from('skill_applications')
      .select(`
        *,
        opportunity:skill_opportunities(
          *,
          creator:profiles!skill_opportunities_created_by_fkey(id, full_name, email)
        )
      `)
      .eq('applicant_id', user.user.id)
      .order('applied_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateApplicationStatus(applicationId: string, status: ApplicationStatus): Promise<SkillApplication> {
    const { data, error } = await supabase
      .from('skill_applications')
      .update({ status })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) throw error;

    // If accepted, create collaboration
    if (status === 'accepted') {
      const application = data;
      await this.createCollaboration(application);
    }

    return data;
  }

  // Collaborations Management
  async createCollaboration(application: SkillApplication): Promise<ProjectCollaboration> {
    const { data: opportunity } = await supabase
      .from('skill_opportunities')
      .select('*')
      .eq('id', application.opportunity_id)
      .single();

    if (!opportunity) throw new Error('Opportunity not found');

    const { data, error } = await supabase
      .from('project_collaborations')
      .insert({
        opportunity_id: application.opportunity_id,
        client_id: opportunity.created_by,
        collaborator_id: application.applicant_id,
        application_id: application.id,
        agreed_timeline: application.proposed_timeline,
        agreed_budget: application.proposed_budget
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserCollaborations(): Promise<ProjectCollaboration[]> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];

    const { data, error } = await supabase
      .from('project_collaborations')
      .select(`
        *,
        opportunity:skill_opportunities(*),
        client:profiles!project_collaborations_client_id_fkey(id, full_name, email),
        collaborator:profiles!project_collaborations_collaborator_id_fkey(id, full_name, email)
      `)
      .or(`client_id.eq.${user.user.id},collaborator_id.eq.${user.user.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateCollaboration(id: string, updates: Partial<ProjectCollaboration>): Promise<ProjectCollaboration> {
    const { data, error } = await supabase
      .from('project_collaborations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Skill Exchange Requests
  async createExchangeRequest(requestData: {
    offered_skill_id: string;
    requested_skill_id: string;
    title: string;
    description?: string;
    duration_hours?: number;
  }): Promise<SkillExchangeRequest> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('skill_exchange_requests')
      .insert({
        requester_id: user.user.id,
        ...requestData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getExchangeRequests(): Promise<SkillExchangeRequest[]> {
    const { data, error } = await supabase
      .from('skill_exchange_requests')
      .select(`
        *,
        offered_skill:skills!skill_exchange_requests_offered_skill_id_fkey(*),
        requested_skill:skills!skill_exchange_requests_requested_skill_id_fkey(*),
        requester:profiles!skill_exchange_requests_requester_id_fkey(id, full_name, email)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getUserExchangeRequests(): Promise<SkillExchangeRequest[]> {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];

    const { data, error } = await supabase
      .from('skill_exchange_requests')
      .select(`
        *,
        offered_skill:skills!skill_exchange_requests_offered_skill_id_fkey(*),
        requested_skill:skills!skill_exchange_requests_requested_skill_id_fkey(*),
        matched_user:profiles!skill_exchange_requests_matched_with_fkey(id, full_name, email)
      `)
      .eq('requester_id', user.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

export const skillsMarketplaceService = new SkillsMarketplaceService();
