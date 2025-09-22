// Types for Groq/Llama 4 Scout API integration

export interface CareerAdviceRequest {
  prompt: string;
  context?: {
    userProfile?: UserProfile;
    jobPreferences?: JobPreferences;
    skills?: string[];
  };
}

export interface CareerAdviceResponse {
  advice: string;
  timestamp: Date;
  confidence: number;
}

export interface CVAnalysisRequest {
  cvContent: string;
  targetRole?: string;
}

export interface CVAnalysisResponse {
  score: number;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  timestamp: Date;
}

export interface JobMatchingRequest {
  userProfile: UserProfile;
  availableJobs: JobListing[];
}

export interface JobMatchingResponse {
  matches: JobMatch[];
  timestamp: Date;
}

export interface JobMatch {
  jobId: string;
  matchScore: number;
  reasons: string[];
  recommendations: string[];
}

export interface InterviewPrepRequest {
  jobRole: string;
  company: string;
  userBackground: UserProfile;
}

export interface InterviewPrepResponse {
  commonQuestions: string[];
  preparationTips: string[];
  companyInsights: string[];
  culturalTips: string[];
  timestamp: Date;
}

export interface SkillDevelopmentRequest {
  currentSkills: string[];
  targetRole: string;
  industry: string;
}

export interface SkillDevelopmentResponse {
  skillGaps: string[];
  learningPath: LearningPathItem[];
  certifications: string[];
  timestamp: Date;
}

export interface LearningPathItem {
  skill: string;
  priority: 'high' | 'medium' | 'low';
  resources: string[];
  timeframe: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  nationality?: string;
  education?: EducationItem[];
  experience?: ExperienceItem[];
  skills?: string[];
  languages?: string[];
  certifications?: string[];
  careerGoals?: string;
  preferredIndustries?: string[];
  preferredLocations?: string[];
}

export interface EducationItem {
  institution: string;
  degree: string;
  field: string;
  startDate: Date;
  endDate?: Date;
  gpa?: number;
}

export interface ExperienceItem {
  company: string;
  position: string;
  startDate: Date;
  endDate?: Date;
  description: string;
  achievements?: string[];
}

export interface JobPreferences {
  industries?: string[];
  locations?: string[];
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  jobTypes?: ('full-time' | 'part-time' | 'contract' | 'remote')[];
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  benefits?: string[];
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  jobType: 'full-time' | 'part-time' | 'contract' | 'remote';
  industry: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  postedDate: Date;
  applicationDeadline?: Date;
}

export interface GroqError {
  message: string;
  code?: string;
  details?: any;
}

export interface GroqConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

