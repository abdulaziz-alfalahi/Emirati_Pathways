// Cross-Phase Data Integration Types

export type CitizenPhase = 'education' | 'career' | 'professional' | 'lifelong';

export type CitizenLifecycleStage = 
  | 'candidate'           // Education Pathway
  | 'graduate'          // Transition from Education to Career
  | 'candidate'        // Career Entry - Job Searching
  | 'early_career'      // Career Entry - First Jobs
  | 'mid_career'        // Professional Growth
  | 'senior_career'     // Professional Growth - Leadership
  | 'entrepreneur'      // Professional Growth - Business
  | 'mentor'            // Lifelong Engagement - Giving Back
  | 'candidate'           // Lifelong Engagement - Post Career
  | 'volunteer';        // Lifelong Engagement - Community Service

export interface CitizenJourneyProfile {
  id: string;
  user_id: string;
  current_phase: CitizenPhase;
  current_stage: CitizenLifecycleStage;
  journey_start_date: string;
  phase_transition_history: PhaseTransition[];
  achievements: CrossPhaseAchievement[];
  skills_portfolio: SkillsPortfolio;
  interests_and_goals: InterestsAndGoals;
  preferences: CitizenPreferences;
  privacy_settings: PrivacySettings;
  created_at: string;
  updated_at: string;
}

export interface PhaseTransition {
  id: string;
  from_phase: CitizenPhase;
  to_phase: CitizenPhase;
  from_stage: CitizenLifecycleStage;
  to_stage: CitizenLifecycleStage;
  transition_date: string;
  transition_reason: string;
  achievements_carried_forward: string[];
  skills_gained: string[];
  mentor_recommendations?: string[];
  transition_score: number; // Success score for the transition
  created_at: string;
}

export interface CrossPhaseAchievement {
  id: string;
  user_id: string;
  phase: CitizenPhase;
  achievement_type: 'education' | 'career' | 'skill' | 'leadership' | 'community' | 'innovation';
  title: string;
  description: string;
  verification_status: 'verified' | 'pending' | 'self_reported';
  verification_source?: string;
  skills_demonstrated: string[];
  impact_score: number;
  date_achieved: string;
  expires_at?: string;
  blockchain_credential_id?: string;
  created_at: string;
}

export interface SkillsPortfolio {
  technical_skills: SkillCategory[];
  soft_skills: SkillCategory[];
  leadership_skills: SkillCategory[];
  entrepreneurial_skills: SkillCategory[];
  community_engagement_skills: SkillCategory[];
  certifications: Certification[];
  skill_gaps: SkillGap[];
  skill_development_plan: SkillDevelopmentPlan[];
  updated_at: string;
}

export interface SkillCategory {
  category_name: string;
  skills: Skill[];
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  verification_status: 'verified' | 'assessed' | 'self_reported';
  last_validated: string;
}

export interface Skill {
  skill_name: string;
  proficiency_level: number; // 1-10 scale
  years_experience?: number;
  last_used?: string;
  endorsed_by?: string[];
  certifications?: string[];
  projects_applied?: string[];
}

export interface SkillGap {
  skill_name: string;
  current_level: number;
  target_level: number;
  importance: 'critical' | 'important' | 'nice_to_have';
  learning_resources: string[];
  estimated_learning_time: number; // in hours
  mentor_availability: boolean;
}

export interface SkillDevelopmentPlan {
  skill_name: string;
  current_level: number;
  target_level: number;
  learning_path: LearningMilestone[];
  estimated_completion: string;
  mentor_assigned?: string;
  progress_percentage: number;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
}

export interface LearningMilestone {
  milestone_title: string;
  description: string;
  resources: string[];
  estimated_hours: number;
  completion_criteria: string;
  completed: boolean;
  completed_date?: string;
}

export interface Certification {
  certification_name: string;
  issuing_organization: string;
  issued_date: string;
  expiry_date?: string;
  verification_url?: string;
  skills_covered: string[];
  blockchain_verified: boolean;
}

export interface InterestsAndGoals {
  career_interests: string[];
  industry_preferences: string[];
  short_term_goals: Goal[];
  long_term_goals: Goal[];
  life_priorities: string[];
  values: string[];
  preferred_work_environment: string[];
  geographic_preferences: string[];
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'career' | 'education' | 'personal' | 'financial' | 'community';
  priority: 'high' | 'medium' | 'low';
  target_date: string;
  progress_percentage: number;
  milestones: GoalMilestone[];
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface GoalMilestone {
  title: string;
  description: string;
  target_date: string;
  completed: boolean;
  completed_date?: string;
}

export interface CitizenPreferences {
  communication_preferences: {
    email_notifications: boolean;
    sms_notifications: boolean;
    push_notifications: boolean;
    newsletter_subscription: boolean;
    mentor_matching_notifications: boolean;
    opportunity_alerts: boolean;
  };
  mentorship_preferences: {
    open_to_mentoring: boolean;
    seeking_mentor: boolean;
    expertise_areas: string[];
    preferred_mentor_experience: string;
    availability: {
      days: string[];
      hours: string[];
      timezone: string;
    };
  };
  opportunity_preferences: {
    job_alerts: boolean;
    training_recommendations: boolean;
    certification_suggestions: boolean;
    networking_events: boolean;
    volunteer_opportunities: boolean;
    preferred_industries: string[];
    preferred_locations: string[];
    remote_work_preference: boolean;
  };
  privacy_level: 'public' | 'government_only' | 'private';
}

export interface PrivacySettings {
  profile_visibility: 'public' | 'registered_users' | 'government_only' | 'private';
  skills_visibility: 'public' | 'mentors_only' | 'government_only' | 'private';
  achievements_visibility: 'public' | 'verified_only' | 'government_only' | 'private';
  contact_information_sharing: boolean;
  anonymous_analytics: boolean;
  data_sharing_consent: {
    educational_institutions: boolean;
    employers: boolean;
    training_providers: boolean;
    government_agencies: boolean;
    mentors: boolean;
    community_organizations: boolean;
  };
  data_retention_preference: 'standard' | 'extended' | 'minimal';
  export_data_rights: boolean;
  delete_data_rights: boolean;
}

// Recommendation Engine Types
export interface CrossPhaseRecommendation {
  id: string;
  user_id: string;
  recommendation_type: 'opportunity' | 'skill_development' | 'mentor' | 'transition' | 'community';
  phase: CitizenPhase;
  title: string;
  description: string;
  confidence_score: number; // 0-100
  reasoning: string[];
  action_items: RecommendationAction[];
  estimated_impact: 'low' | 'medium' | 'high';
  time_sensitivity: 'immediate' | 'soon' | 'flexible';
  resource_requirements: string[];
  success_criteria: string[];
  related_goals: string[];
  expires_at?: string;
  viewed: boolean;
  acted_upon: boolean;
  feedback_rating?: number;
  feedback_notes?: string;
  created_at: string;
}

export interface RecommendationAction {
  action_type: 'apply' | 'enroll' | 'connect' | 'learn' | 'attend' | 'volunteer';
  action_title: string;
  action_description: string;
  action_url?: string;
  estimated_time: number; // in hours
  difficulty_level: 'easy' | 'medium' | 'challenging';
  prerequisites: string[];
  expected_outcome: string;
}

// Progress Tracking Types
export interface CitizenJourneyProgress {
  user_id: string;
  overall_progress_score: number; // 0-100
  phase_progress: PhaseProgress[];
  skill_development_score: number;
  goal_achievement_rate: number;
  network_growth_score: number;
  community_impact_score: number;
  career_advancement_score: number;
  lifelong_learning_score: number;
  milestone_achievements: MilestoneAchievement[];
  improvement_areas: string[];
  strengths: string[];
  next_recommended_actions: string[];
  calculated_at: string;
}

export interface PhaseProgress {
  phase: CitizenPhase;
  stage: CitizenLifecycleStage;
  completion_percentage: number;
  time_in_phase: number; // months
  achievements_count: number;
  skills_developed: number;
  goals_completed: number;
  mentorship_sessions: number;
  community_contributions: number;
  phase_score: number; // 0-100
  readiness_for_next_phase: number; // 0-100
}

export interface MilestoneAchievement {
  milestone_name: string;
  milestone_description: string;
  achievement_date: string;
  phase: CitizenPhase;
  impact_score: number;
  verification_status: 'verified' | 'pending';
  celebration_status: 'celebrated' | 'pending';
}

// Data Integration Types
export interface DataIntegrationRequest {
  id: string;
  requesting_user_id: string;
  target_user_id: string;
  requested_data_types: DataType[];
  request_reason: string;
  requester_organization?: string;
  requester_role?: string;
  data_usage_purpose: string;
  retention_period: number; // days
  sharing_permissions: SharingPermission[];
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  approved_at?: string;
  expires_at?: string;
  revoked_at?: string;
  created_at: string;
}

export type DataType = 
  | 'profile_basic'
  | 'profile_detailed'
  | 'skills_portfolio'
  | 'achievements'
  | 'education_history'
  | 'career_history'
  | 'goals_and_aspirations'
  | 'mentorship_history'
  | 'community_contributions'
  | 'certifications'
  | 'assessment_results'
  | 'progress_analytics';

export interface SharingPermission {
  data_type: DataType;
  access_level: 'read' | 'read_write';
  anonymized: boolean;
  specific_fields?: string[];
  excluded_fields?: string[];
}

// Analytics and Insights Types
export interface CrossPhaseAnalytics {
  user_id: string;
  analytics_period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  engagement_metrics: EngagementMetrics;
  learning_metrics: LearningMetrics;
  career_progression_metrics: CareerProgressionMetrics;
  network_metrics: NetworkMetrics;
  contribution_metrics: ContributionMetrics;
  satisfaction_metrics: SatisfactionMetrics;
  predictive_insights: PredictiveInsight[];
  benchmark_comparison: BenchmarkComparison;
  generated_at: string;
}

export interface EngagementMetrics {
  platform_usage_hours: number;
  sessions_count: number;
  features_used: string[];
  content_consumed: number;
  interactions_count: number;
  goal_updates: number;
  profile_updates: number;
  engagement_score: number; // 0-100
}

export interface LearningMetrics {
  courses_completed: number;
  assessments_taken: number;
  certifications_earned: number;
  skills_developed: number;
  learning_hours: number;
  knowledge_retention_score: number;
  preferred_learning_styles: string[];
  learning_velocity: number; // skills per month
}

export interface CareerProgressionMetrics {
  career_stage_advancement: boolean;
  salary_progression: number; // percentage
  role_advancement: boolean;
  industry_transitions: number;
  job_satisfaction_score: number;
  career_goal_achievement_rate: number;
  networking_effectiveness: number;
  leadership_development_score: number;
}

export interface NetworkMetrics {
  connections_count: number;
  mentors_count: number;
  mentees_count: number;
  professional_network_size: number;
  network_diversity_score: number;
  networking_activity_level: number;
  referral_success_rate: number;
  collaboration_frequency: number;
}

export interface ContributionMetrics {
  community_projects: number;
  volunteer_hours: number;
  mentorship_sessions_given: number;
  knowledge_sharing_activities: number;
  leadership_roles: number;
  social_impact_score: number;
  recognition_received: number;
  contribution_consistency: number;
}

export interface SatisfactionMetrics {
  overall_satisfaction: number; // 0-10
  phase_satisfaction: { [phase in CitizenPhase]: number };
  feature_satisfaction: { [feature: string]: number };
  support_satisfaction: number;
  recommendation_likelihood: number; // NPS
  platform_value_perception: number;
  goal_fulfillment_satisfaction: number;
}

export interface PredictiveInsight {
  insight_type: 'opportunity' | 'risk' | 'trend' | 'recommendation';
  title: string;
  description: string;
  confidence_level: number; // 0-100
  time_horizon: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  impact_assessment: 'low' | 'medium' | 'high' | 'critical';
  suggested_actions: string[];
  data_sources: string[];
  algorithm_version: string;
}

export interface BenchmarkComparison {
  user_percentile: number; // 0-100
  peer_group: string;
  comparison_metrics: {
    skill_development: number;
    career_progression: number;
    network_growth: number;
    community_engagement: number;
    goal_achievement: number;
  };
  areas_of_excellence: string[];
  improvement_opportunities: string[];
  peer_insights: string[];
}

// External Integration Types
export interface ExternalSystemIntegration {
  id: string;
  system_name: string;
  system_type: 'educational_institution' | 'employer_admin' | 'training_provider' | 'certification_body' | 'government_agency';
  integration_status: 'active' | 'inactive' | 'pending' | 'error';
  data_sync_frequency: 'real_time' | 'daily' | 'weekly' | 'monthly';
  supported_data_types: DataType[];
  api_endpoint: string;
  authentication_method: 'oauth' | 'api_key' | 'certificate';
  last_sync_date?: string;
  sync_success_rate: number;
  error_log?: string[];
  compliance_standards: string[];
  created_at: string;
  updated_at: string;
}

export interface DataExportRequest {
  id: string;
  user_id: string;
  export_format: 'json' | 'xml' | 'csv' | 'pdf';
  data_types: DataType[];
  date_range: {
    from: string;
    to: string;
  };
  anonymize_data: boolean;
  include_metadata: boolean;
  delivery_method: 'download' | 'email' | 'api';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  export_url?: string;
  expires_at?: string;
  file_size?: number;
  created_at: string;
  completed_at?: string;
}
