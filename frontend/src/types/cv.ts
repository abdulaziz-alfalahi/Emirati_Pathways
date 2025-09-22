// src/types/cv.ts

/**
 * This types file is intentionally backward-compatible with older
 * snake_case property names (e.g., personal_info, professional_summary)
 * while also supporting the newer camelCase forms (e.g., personalInfo,
 * professionalSummary). Most fields are optional to play nicely with
 * Partial<T> usage across the builder steps.
 */

/* =========================
 * PERSONAL INFO
 * =======================*/

export interface PersonalInfo {
  // New/camelCase fields (preferred)
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  emiratesId?: string;
  emirate?: string;
  city?: string;
  address?: string;
  dateOfBirth?: string;
  nationality?: string;
  profileSummary?: string;
  arabicFirstName?: string;
  arabicLastName?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  profileImage?: string;

  // Legacy/snake_case aliases used by existing components
  full_name?: string;
  arabic_name?: string;
  emirates_id?: string;
  linkedin?: string;
  portfolio?: string;
}

/* =========================
 * EXPERIENCE
 * =======================*/

export interface Experience {
  id: string;
  // New/camelCase
  jobTitle?: string;
  company?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrentJob?: boolean;
  description?: string;
  achievements?: string[];
  industry?: string;
  employmentType?: 'Full-time' | 'Part-time' | 'Contract' | 'Freelance' | 'Internship';
  skills?: string[];

  // Aliases used by components
  position?: string;                // used in ExperienceStep listing
  isCurrentlyWorking?: boolean;     // used to disable endDate when current
}

/* =========================
 * EDUCATION
 * =======================*/

export interface Education {
  id: string;
  degree: string;
  institution: string;
  startDate: string;
  endDate?: string;

  // Optional, used conditionally in components
  location?: string;
  isCurrentStudy?: boolean;
  isCurrentlyStudying?: boolean;
  gpa?: string;
  description?: string;
  fieldOfStudy?: string;
  honors?: string[];
  achievements?: string[];
}

/* =========================
 * SKILL
 * =======================*/

export interface Skill {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  category: 'Technical' | 'Strategic' | 'Soft' | 'Cultural' | 'Language' | 'Other';
  yearsOfExperience?: number;
  certifications?: string[];

  // Make optional so adding skills in the UI doesn't error
  isStrategic?: boolean;
}

/* =========================
 * LANGUAGE
 * =======================*/

export interface Language {
  id: string;
  name: string;
  proficiency: 'Basic' | 'Conversational' | 'Fluent' | 'Native';

  // Optional flags/details
  isNative?: boolean;
  certifications?: string[];   // plural form used across components
  certificationDate?: string;
  testScore?: string;
}

/* =========================
 * PROJECT
 * =======================*/

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  startDate: string;
  endDate?: string;
  isOngoing?: boolean;
  url?: string;
  githubUrl?: string;
  role?: string;
  achievements?: string[];
}

/* =========================
 * CERTIFICATION
 * =======================*/

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  description?: string;
}

/* =========================
 * REFERENCES
 * =======================*/

export interface Reference {
  id: string;
  name: string;
  position?: string;
  company?: string;
  email?: string;
  phone?: string;
  relationship?: string;
}

/* =========================
 * ENUMS
 * =======================*/

export enum CVTemplate {
  UAE_PROFESSIONAL = 'uae_professional',
  UAE_EXECUTIVE = 'uae_executive',
  UAE_TECHNOLOGY = 'uae_technology',
  UAE_GOVERNMENT = 'uae_government',
  UAE_HEALTHCARE = 'uae_healthcare',
  UAE_CREATIVE = 'uae_creative'
}

export enum CVLanguage {
  ENGLISH = 'en',
  ARABIC = 'ar',
  BILINGUAL = 'bilingual'
}

/**
 * Step keys used across the wizard.
 */
export enum CVStep {
  TEMPLATE_SELECTION = 'template',
  PERSONAL_INFO = 'personal',
  EXPERIENCE = 'experience',
  EDUCATION = 'education',
  SKILLS = 'skills',
  LANGUAGES = 'languages',
  PROJECTS = 'projects',
  REVIEW = 'review'
}

/* =========================
 * STRATEGIC SKILLS (for SkillsStep)
 * =======================*/

export const UAE_STRATEGIC_SKILLS = {
  digital_transformation: [
    'Artificial Intelligence',
    'Machine Learning',
    'Data Science',
    'Cybersecurity',
    'Cloud Computing',
    'Blockchain',
    'IoT',
    'RPA (Robotic Process Automation)',
    'Data Engineering',
    'Data Governance',
    'API Design',
    'DevOps'
  ],
  innovation_leadership: [
    'Design Thinking',
    'Strategic Foresight',
    'Change Management',
    'Product Strategy',
    'OKRs',
    'Innovation Management',
    'Agile Leadership',
    'Growth Strategy',
    'Stakeholder Management',
    'Business Model Innovation'
  ],
  cultural_intelligence: [
    'Arabic Language Proficiency',
    'Cross-cultural Communication',
    'Public Sector Etiquette',
    'Government Protocols',
    'Community Engagement',
    'Intercultural Negotiation',
    'Bilingual Presentations'
  ]
} as const;

/* =========================
 * ANALYTICS
 * =======================*/

export interface CVAnalytics {
  // Newer structured form
  performance_metrics?: {
    views?: number;
    downloads?: number;
    matches?: number;
  };
  market_insights?: {
    demand_score?: number;      // percentage 0-100
    salary_range?: string;      // "AED X - Y"
    trending_skills?: string[];
  };

  // Legacy/flat accessors
  views?: number;
  downloads?: number;
  matches?: number;
  completionScore?: number;
  lastViewed?: string;

  // An alternative structured insight block used elsewhere
  marketInsights?: {
    salaryRange?: { min: number; max: number };
    demandLevel?: 'High' | 'Medium' | 'Low';
    trendingSkills?: string[];
    recommendedImprovements?: string[];
  };
}

/* =========================
 * EXPORT OPTIONS
 * =======================*/

export interface CVExportOptions {
  format: 'pdf' | 'word' | 'json';
  template?: CVTemplate;
  language?: CVLanguage;
  includePhoto?: boolean;
  includeReferences?: boolean;
  optimizeForATS?: boolean;
  includeAnalytics?: boolean;
}

/* =========================
 * VALIDATION RESULT
 * =======================*/

export interface CVValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  completionPercentage: number;
  missingRequiredFields: string[];
  suggestions: string[];
}

/* =========================
 * STEP PROP HELPERS
 * =======================*/

export interface StepComponentProps {
  data: any;
  onChange: (section: string, data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
  onBack?: () => void;
}

export interface ReviewStepProps {
  data: any;
  onEdit: (step: CVStep) => void;
  onSubmit: () => void;
  onPreview: () => void;
  onDownload: () => void;
}

/* =========================
 * CORE CV
 * =======================*/

export interface CV {
  id: string;
  title?: string;

  personalInfo?: PersonalInfo;
  personal_info?: PersonalInfo;          // alias used in some components

  professionalSummary?: string;
  professional_summary?: string;         // alias used in scoring widget

  experience?: Experience[];
  education?: Education[];
  skills?: Skill[];
  languages?: Language[];
  projects?: Project[];
  certifications?: Certification[];
  references?: Reference[];              // added for CVPreview compatibility

  createdAt?: string;
  updatedAt?: string;

  template?: CVTemplate;
  language?: CVLanguage;
  isPublic?: boolean;

  completionScore?: number;
  metadata?: Record<string, any>;
}

/** Alias expected by some imports */
export type CVData = CV;
