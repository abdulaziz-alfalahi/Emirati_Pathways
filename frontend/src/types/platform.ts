// src/types/platform.ts

// Base interfaces for common data patterns
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location?: string;
  linkedin?: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
  };
}

export interface Skill {
  name: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  years_experience?: number;
  verified?: boolean;
  required?: boolean; // For job requirements
  category?: string;
}

export interface Experience {
  id?: string;
  title: string;
  company: string;
  location?: string;
  start_date: string;
  end_date?: string; // null or "present" for current positions
  is_current?: boolean;
  description?: string;
  responsibilities?: string[];
  achievements?: string[];
  skills_used?: string[];
  years?: number; // Calculated field
  duration?: string; // Human-readable duration
}

export interface Education {
  id?: string;
  institution: string;
  degree: string;
  field?: string;
  start_date?: string;
  end_date?: string;
  gpa?: number;
  honors?: string;
  relevant_coursework?: string[];
  level?: 'high school' | 'associate' | 'bachelor' | 'master' | 'phd' | 'doctorate';
  required?: boolean; // For job requirements
}

export interface Language {
  language: string;
  proficiency: 'basic' | 'conversational' | 'fluent' | 'native';
  reading?: 'basic' | 'intermediate' | 'advanced' | 'native';
  writing?: 'basic' | 'intermediate' | 'advanced' | 'native';
  speaking?: 'basic' | 'intermediate' | 'advanced' | 'native';
  required?: boolean; // For job requirements
}

export interface Certification {
  name: string;
  issuer: string;
  issue_date?: string;
  expiry_date?: string;
  credential_id?: string;
  verification_url?: string;
  required?: boolean; // For job requirements
}

// Comprehensive CV/Resume data structure
export interface CVData extends BaseEntity {
  // Personal Information
  personal_info: ContactInfo;
  
  // Professional Summary
  summary?: string;
  objective?: string;
  
  // Experience and Skills
  experience: Experience[];
  skills: Skill[];
  education: Education[];
  languages: Language[];
  certifications: Certification[];
  
  // Additional Sections
  projects?: Array<{
    name: string;
    description: string;
    technologies?: string[];
    url?: string;
    start_date?: string;
    end_date?: string;
  }>;
  
  publications?: Array<{
    title: string;
    publication: string;
    date: string;
    url?: string;
  }>;
  
  awards?: Array<{
    name: string;
    issuer: string;
    date: string;
    description?: string;
  }>;
  
  volunteer_work?: Array<{
    organization: string;
    role: string;
    start_date?: string;
    end_date?: string;
    description?: string;
  }>;
  
  // Metadata
  completeness_score?: number;
  last_updated?: string;
  parsing_metadata?: {
    extraction_method: string;
    confidence_score?: number;
    language_detected?: string;
    character_normalization_applied?: boolean;
    ocr_used?: boolean;
  };
}

// Job Description data structure
export interface JobDescription extends BaseEntity {
  // Basic Information
  title: string;
  company: string;
  location: string;
  employment_type: 'full-time' | 'part-time' | 'contract' | 'temporary' | 'internship' | 'freelance';
  work_mode: 'remote' | 'on-site' | 'hybrid' | 'flexible';
  
  // Job Details
  description: string;
  responsibilities: string[];
  
  // Requirements
  requirements: {
    education: Education[];
    experience: Array<{
      years: number;
      field?: string;
      required: boolean;
    }>;
    skills: Skill[];
    languages: Language[];
    certifications: Certification[];
  };
  
  // Additional Information
  benefits?: string[];
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
    period?: 'hour' | 'month' | 'year';
  };
  
  // Metadata
  application_deadline?: string;
  posted_date?: string;
  keywords?: string[];
  is_active?: boolean;
  
  // Parsing metadata
  parsing_metadata?: {
    extraction_method: string;
    confidence_score?: number;
    language_detected?: string;
    source_format?: string;
  };
}

// Matching result structures
export interface MatchResult {
  overall_score: number;
  category_scores: {
    skills: number;
    experience: number;
    education: number;
    location: number;
    languages: number;
  };
  match_details: {
    skills: {
      matched: string[];
      missing: string[];
    };
    experience: string;
    education: string;
    location: string;
    languages: string;
  };
  recommendations?: string[];
}

export interface JobMatch extends MatchResult {
  job_id: string;
  job_title: string;
  company: string;
  location: string;
  match_timestamp: string;
}

export interface CandidateMatch extends MatchResult {
  candidate_id: string;
  candidate_name: string;
  match_timestamp: string;
}

// User profile and preferences
export interface UserProfile extends BaseEntity {
  user_id: string;
  cv_data?: CVData;
  preferences: {
    job_types: string[];
    locations: string[];
    salary_range?: {
      min: number;
      max: number;
      currency: string;
    };
    work_mode_preferences: string[];
    industry_preferences: string[];
  };
  privacy_settings: {
    profile_visibility: 'public' | 'private' | 'recruiters_only';
    contact_preferences: string[];
    data_sharing_consent: boolean;
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: {
    timestamp: string;
    request_id: string;
    processing_time?: number;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Form state and validation types
export interface FormValidation {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

export interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string;
  progress?: number;
}

export interface ErrorState {
  hasError: boolean;
  errorMessage?: string;
  errorCode?: string;
  retryable?: boolean;
}
