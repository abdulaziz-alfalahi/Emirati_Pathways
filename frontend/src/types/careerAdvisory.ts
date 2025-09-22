
// Define the types we need for the Career Advisory feature
export type CareerAdvisor = {
  id: string;
  user_id: string;
  specialization: string;
  bio: string | null;
  availability: Record<string, any> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  // User profile information retrieved via join
  user_profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
};

export type AdvisorySession = {
  id: string;
  user_id: string;
  advisor_id: string;
  status: "scheduled" | "completed" | "cancelled" | "in_progress";
  scheduled_date: string;
  completed_date: string | null;
  topic: string;
  details: string | null;
  notes: string | null;
  rating: number | null;
  feedback: string | null;
  video_call_url: string | null;
  created_at: string;
  updated_at: string | null;
  is_interview: boolean;
  interview_type: "mock" | "practice" | "technical" | "behavioral" | null;
  interview_questions: string[] | null;
  // Related data joined from other tables
  career_advisors?: {
    specialization: string;
    user_id: string;
    user_profiles?: {
      full_name: string | null;
      avatar_url: string | null;
    };
  };
  candidate_profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
};

// API keys type that includes HireVue
export interface ApiKeys {
  id: string;
  linkedin_client_id: string | null;
  linkedin_client_secret: string | null;
  mapbox_access_token: string | null;
  uaepass_client_id: string | null;
  uaepass_client_secret: string | null;
  hirevue_api_key: string | null;
  created_at: string | null;
  updated_at: string | null;
}
