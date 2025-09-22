
export interface LegacyProject {
  id: string;
  title: string;
  description?: string;
  focus_area?: 'education' | 'environment' | 'healthcare' | 'culture' | 'technology' | 'community' | 'arts';
  initiator_id?: string;
  funding_goal?: number;
  current_funding: number;
  funding_currency: string;
  location?: string;
  project_status: 'proposal' | 'active' | 'completed' | 'paused';
  start_date?: string;
  expected_completion_date?: string;
  requirements?: string;
  skills_needed?: string[];
  impact_metrics?: string;
  image_url?: string;
  website_url?: string;
  contact_email?: string;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectContribution {
  id: string;
  project_id: string;
  user_id: string;
  contribution_type: 'financial' | 'time' | 'skills' | 'resources';
  amount?: number;
  currency: string;
  hours_contributed?: number;
  skills_provided?: string[];
  description?: string;
  contribution_date: string;
  status: 'active' | 'completed' | 'withdrawn';
  created_at: string;
  updated_at: string;
  project?: LegacyProject;
}
