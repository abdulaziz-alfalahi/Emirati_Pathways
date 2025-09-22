
export interface TrainingProvider {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  is_verified: boolean;
  partnership_level: string;
  created_at: string;
  updated_at: string;
}

export interface TrainingProgram {
  id: string;
  title: string;
  description?: string;
  category: 'technical_skills' | 'trade_skills' | 'service_skills' | 'entrepreneurship_business';
  subcategory?: string;
  provider_id: string;
  provider?: TrainingProvider;
  duration_weeks?: number;
  schedule_details?: string;
  prerequisites?: string[];
  learning_outcomes?: string[];
  certification_offered: boolean;
  certification_name?: string;
  job_placement_assistance: boolean;
  training_mode: 'in_person' | 'online' | 'hybrid';
  location?: string;
  max_participants?: number;
  current_participants: number;
  price_amount?: number;
  price_currency: string;
  start_date?: string;
  end_date?: string;
  application_deadline?: string;
  status: 'draft' | 'active' | 'full' | 'completed' | 'cancelled';
  featured: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface TrainingApplication {
  id: string;
  user_id: string;
  program_id: string;
  application_data: Record<string, any>;
  status: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewer_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TrainingEnrollment {
  id: string;
  user_id: string;
  program_id: string;
  application_id?: string;
  enrollment_date: string;
  completion_date?: string;
  progress_percentage: number;
  status: string;
  certificate_issued: boolean;
  certificate_url?: string;
  final_grade?: string;
  created_at: string;
  updated_at: string;
}

export interface TrainingFilters {
  category?: string;
  training_mode?: string;
  certification_offered?: boolean;
  job_placement_assistance?: boolean;
  price_range?: [number, number];
  duration_weeks?: [number, number];
  search?: string;
}
