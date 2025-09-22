
export interface VolunteerOpportunity {
  id: string;
  title: string;
  description?: string;
  organization_name: string;
  organization_contact_email?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  time_commitment?: string;
  skills_required?: string[];
  category?: 'education' | 'environment' | 'healthcare' | 'community' | 'sports' | 'arts' | 'technology';
  max_volunteers?: number;
  current_volunteers: number;
  is_remote: boolean;
  requirements?: string;
  benefits?: string;
  status: 'active' | 'inactive' | 'completed';
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface VolunteerApplication {
  id: string;
  opportunity_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'withdrawn';
  application_message?: string;
  applied_at: string;
  updated_at: string;
  hours_completed: number;
  volunteer_feedback?: string;
  organization_feedback?: string;
  completion_date?: string;
  opportunity?: VolunteerOpportunity;
}
