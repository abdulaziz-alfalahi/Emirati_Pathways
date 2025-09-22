
export interface Mentor {
  id: string;
  user_id: string;
  expertise: string[];
  years_experience?: number;
  bio?: string;
  availability?: {
    days: string[];
    hours: string[];
    timezone: string;
  };
  is_active: boolean;
  is_verified: boolean;
  rating?: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface MentorshipRelationship {
  id: string;
  mentor_id: string;
  mentee_id: string;
  status: 'requested' | 'active' | 'completed' | 'cancelled' | 'accepted';
  goals?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface MentorshipSession {
  id: string;
  relationship_id: string;
  scheduled_date: string;
  duration_minutes: number;
  topic?: string;
  notes?: string;
  video_call_url?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  rating?: number;
  feedback?: string;
  created_at: string;
  updated_at: string;
}

export interface MentorProfile {
  expertise: string[];
  years_experience: number;
  bio: string;
  availability: {
    days: string[];
    hours: string[];
    timezone: string;
  };
  is_active: boolean;
}

export interface MenteePreferences {
  desired_expertise: string[];
  career_goals: string[];
  preferred_communication: string[];
  availability: {
    days: string[];
    hours: string[];
    timezone: string;
  };
  experience_level: 'beginner' | 'intermediate' | 'advanced';
}

export interface MatchSuggestion {
  mentor: Mentor;
  compatibility_score: number;
  match_reasons: string[];
  expertise_match: number;
  availability_match: number;
  experience_compatibility: number;
}

// New types for success metrics tracking
export interface MentorshipSuccessMetric {
  id: string;
  relationship_id: string;
  metric_type: 'goal_completion' | 'skill_improvement' | 'satisfaction_rating' | 'career_progress';
  metric_value: number;
  metric_details?: Record<string, any>;
  recorded_at: string;
  recorded_by: string;
  created_at: string;
}

export interface MentorshipGoal {
  id: string;
  relationship_id: string;
  title: string;
  description?: string;
  target_date?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'cancelled' | 'paused';
  completion_percentage: number;
  completed_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MentorshipProgressAssessment {
  id: string;
  relationship_id: string;
  assessment_period: 'monthly' | 'quarterly' | 'milestone';
  mentee_satisfaction?: number;
  mentor_satisfaction?: number;
  skill_development_rating?: number;
  communication_effectiveness?: number;
  goal_progress_rating?: number;
  areas_of_improvement: string[];
  highlights: string[];
  next_period_focus: string[];
  assessment_notes?: string;
  assessed_by: string;
  assessment_date: string;
  created_at: string;
}

export interface SuccessMetricsAnalytics {
  overall_satisfaction: number;
  goal_completion_rate: number;
  skill_improvement_average: number;
  total_goals: number;
  completed_goals: number;
  active_goals: number;
  recent_assessments: MentorshipProgressAssessment[];
  trend_data: {
    satisfaction_trend: number[];
    goal_completion_trend: number[];
    skill_development_trend: number[];
  };
}
