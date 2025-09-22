
// src/components/resume/types.ts

/**
 * Skill interface to support only object format (not string)
 */
export interface Skill {
  id: string;
  name: string;
  level?: string;
}

/**
 * Language interface for language proficiency
 */
export interface Language {
  id: string;
  name: string;
  proficiency: string;
}

/**
 * Experience entry interface
 */
export interface Experience {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate: string | null;
  current?: boolean;
  description: string;
}

/**
 * Education entry interface
 */
export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location?: string;
  startDate: string;
  endDate: string | null;
  current?: boolean;
  description?: string;
}

/**
 * Personal information interface
 */
export interface Personal {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  website?: string;
  profileImage?: string;
}

/**
 * Metadata for tracking resume processing
 */
export interface ResumeMetadata {
  parsingMethod?: string;
  parsedAt?: string;
  fileType?: string;
  fileSize?: number;
  fileName?: string;
  processingTime?: number;
  processingId?: string;
  sanitized?: boolean;
  sanitizedAt?: string;
  conversionMethod?: string;
  originalFileType?: string;
  originalFileName?: string;
  note?: string;
  failedAttempts?: string[];
  [key: string]: any; // Allow for additional metadata properties
}

/**
 * Complete resume data structure
 */
export interface ResumeData {
  personal: Personal;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  languages: Language[];
  certifications?: Array<{
    id: string;
    name: string;
    issuer?: string;
    date?: string;
    expiryDate?: string;
    url?: string;
  }>;
  projects?: Array<{
    id: string;
    name: string;
    description: string;
    url?: string;
    startDate?: string;
    endDate?: string;
  }>;
  interests?: string[];
  references?: Array<{
    id: string;
    name: string;
    position?: string;
    company?: string;
    contact?: string;
    relationship?: string;
  }>;
  metadata?: ResumeMetadata;
}

/**
 * Resume section types for UI navigation
 */
export type ResumeSection = 
  | 'personal'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'languages'
  | 'certifications'
  | 'projects'
  | 'interests'
  | 'references';

/**
 * Resume template interface
 */
export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
}

/**
 * Resume color scheme options
 */
export type ResumeColorScheme =
  | 'default'
  | 'blue'
  | 'green'
  | 'red'
  | 'purple'
  | 'orange'
  | 'teal'
  | 'custom';

/**
 * Resume format options for export
 */
export type ResumeFormat = 'pdf' | 'docx' | 'txt';

/**
 * Resume settings interface
 */
export interface ResumeSettings {
  template: ResumeTemplate;
  colorScheme: ResumeColorScheme;
  customColor?: string;
  fontSize: 'small' | 'medium' | 'large';
  fontFamily: string;
  showProfileImage: boolean;
  pageSize: 'a4' | 'letter' | 'legal';
  margins: 'narrow' | 'normal' | 'wide';
  sectionOrder: ResumeSection[];
  hiddenSections: ResumeSection[];
}

/**
 * Resume import source options
 */
export type ResumeImportSource = 
  | 'file'
  | 'image'
  | 'linkedin'
  | 'url'
  | 'text';

/**
 * Resume parsing status
 */
export type ResumeParsingStatus = 
  | 'idle'
  | 'processing'
  | 'success'
  | 'error'
  | 'partial';
