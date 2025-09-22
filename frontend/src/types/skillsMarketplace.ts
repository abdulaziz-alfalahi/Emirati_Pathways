
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type OpportunityType = 'skill_exchange' | 'project_based' | 'consultation' | 'mentoring';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
export type ProjectStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

export interface Skill {
  id: string;
  name: string;
  category: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSkill {
  id: string;
  user_id: string;
  skill_id: string;
  skill_level: SkillLevel;
  years_experience: number;
  description?: string;
  portfolio_links: string[];
  created_at: string;
  updated_at: string;
  skill?: Skill;
}

export interface SkillOpportunity {
  id: string;
  created_by: string;
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
  status: ProjectStatus;
  max_applicants: number;
  created_at: string;
  updated_at: string;
  creator?: any;
  skills?: Skill[];
  application_count?: number;
}

export interface SkillApplication {
  id: string;
  opportunity_id: string;
  applicant_id: string;
  cover_letter?: string;
  proposed_timeline?: string;
  proposed_budget?: number;
  portfolio_links: string[];
  status: ApplicationStatus;
  applied_at: string;
  updated_at: string;
  opportunity?: SkillOpportunity;
  applicant?: any;
}

export interface ProjectCollaboration {
  id: string;
  opportunity_id: string;
  client_id: string;
  collaborator_id: string;
  application_id: string;
  agreed_timeline?: string;
  agreed_budget?: number;
  start_date?: string;
  end_date?: string;
  status: ProjectStatus;
  client_rating?: number;
  collaborator_rating?: number;
  client_feedback?: string;
  collaborator_feedback?: string;
  created_at: string;
  updated_at: string;
  opportunity?: SkillOpportunity;
  client?: any;
  collaborator?: any;
}

export interface SkillExchangeRequest {
  id: string;
  requester_id: string;
  offered_skill_id: string;
  requested_skill_id: string;
  title: string;
  description?: string;
  duration_hours?: number;
  status: ApplicationStatus;
  matched_with?: string;
  created_at: string;
  updated_at: string;
  offered_skill?: Skill;
  requested_skill?: Skill;
  requester?: any;
  matched_user?: any;
}

export interface SkillFilters {
  category?: string;
  skill_level?: SkillLevel;
  opportunity_type?: OpportunityType;
  is_remote?: boolean;
  budget_min?: number;
  budget_max?: number;
  search?: string;
}
