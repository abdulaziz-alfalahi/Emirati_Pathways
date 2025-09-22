// ===== TYPE DEFINITIONS =====

export interface ContactInfo {
  name: string;           // Added for compatibility
  fullName?: string;      // Made optional for flexibility
  email: string;
  phone?: string;
  location?: string;      // Added for compatibility
  address?: string;       // Keep existing for compatibility
  linkedin?: string;      // Added snake_case version
  linkedIn?: string;      // Keep existing camelCase version
  website?: string;
  summary?: string;
}

export interface WorkExperience {
  id: string;
  position: string;
  title?: string;         // Added for compatibility
  company: string;
  location?: string;
  startDate: string;
  start_date?: string;    // Added snake_case version
  endDate?: string;
  end_date?: string;      // Added snake_case version
  description?: string;
  responsibilities?: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  field_of_study?: string;  // Added snake_case version
  startDate?: string;
  start_date?: string;      // Added snake_case version
  endDate: string;
  end_date?: string;        // Added snake_case version
  gpa?: string;             // Added missing property
}

export interface Skills {
  technical: string[];
  soft: string[];
}

export interface Language {
  id: string;
  language: string;
  proficiency: string;
}

export interface Certification {
  id: string;
  name: string;
  issuingOrganization: string;
  issuing_organization?: string;  // Added snake_case version
  date: string;
  expirationDate?: string;
  expiration_date?: string;       // Added snake_case version
}

export interface Project {
  id: string;
  name: string;
  description: string;
  url?: string;
  technologies?: string[];  // Added missing property
}

export interface CVData {
  personalInfo: ContactInfo;
  experience: WorkExperience[];
  education: Education[];
  skills: Skills;
  languages: Language[];
  certifications: Certification[];
  projects: Project[];
}

export interface JobDescription {
  id?: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  employment_type?: string;  // Added for platform compatibility
  remote: boolean;
  work_mode?: string;        // Added for platform compatibility
  description: string;
  requirements: string[] | {   // Made flexible for different formats
    education: Education[];
    experience: { years: number; field?: string; required: boolean; }[];
    skills: any[];
    languages: any[];
    certifications: Certification[];
  };
  responsibilities: string[];
  skills: {
    required: string[];
    preferred: string[];
  };
  experience: {
    minimum: number;
    preferred: number;
  };
  education: {
    level: string;
    field?: string;
  };
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  benefits?: string[];
  applicationDeadline?: string;
  created_at?: string;       // Added for platform compatibility
  updated_at?: string;       // Added for platform compatibility
}

export interface JobMatch {
  jobId: string;
  candidateId: string;
  overallScore: number;
  overall_score?: number;   // Added snake_case version for compatibility
  categoryScores: {
    skills: number;
    experience: number;
    education: number;
    location: number;
    languages: number;
  };
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  priority: 'high' | 'medium' | 'low';
  // Added missing properties for compatibility
  match_details?: any;
  job_title?: string;
  company?: string;
}

// Added missing SkillGap interface
export interface SkillGap {
  skill: string;
  required: boolean;
  hasSkill: boolean;
  proficiencyLevel?: string;
  gapSeverity: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: {
    timestamp: string;
    requestId: string;
    processingTime: number;
  };
}

export interface FormValidation {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

export interface LoadingState {
  isLoading: boolean;
  progress?: number;
  stage?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
  retryable?: boolean;
}

export interface CandidateProfile {
  id: string;
  personalInfo: ContactInfo;
  experience: WorkExperience[];
  education: Education[];
  skills: Skills;
  languages: Language[];
  certifications: Certification[];
  projects: Project[];
  availability: {
    startDate: string;
    noticePeriod: string;
    workType: 'full-time' | 'part-time' | 'contract' | 'freelance';
    remote: boolean;
  };
  preferences: {
    locations: string[];
    industries: string[];
    roles: string[];
    salaryRange: {
      min: number;
      max: number;
      currency: string;
    };
  };
}

export interface CandidateMatch {
  candidate: CandidateProfile;
  match: JobMatch;
  ranking: number;
  lastUpdated: string;
}

export interface InterviewPreparation {
  jobId: string;
  candidateId: string;
  questions: {
    technical: string[];
    behavioral: string[];
    situational: string[];
    companySpecific: string[];
  };
  focusAreas: string[];
  candidateInsights: {
    strengths: string[];
    potentialConcerns: string[];
    discussionPoints: string[];
  };
  interviewType: 'phone' | 'video' | 'in-person' | 'technical' | 'panel';
  estimatedDuration: number;
}

export interface ShortlistEntry {
  id: string;
  jobId: string;
  candidateId: string;
  status: 'pending' | 'contacted' | 'interviewed' | 'offered' | 'hired' | 'rejected';
  addedDate: string;
  notes: string;
  recruiterNotes: string;
  interviewScheduled?: {
    date: string;
    type: string;
    interviewer: string;
  };
}

export interface InterviewFeedback {
  id: string;
  candidateId: string;
  jobId: string;
  interviewDate: string;
  interviewer: string;
  scores: {
    technical: number;
    communication: number;
    cultural: number;
    overall: number;
  };
  feedback: string;
  recommendation: 'hire' | 'reject' | 'second_interview';
  detailedNotes: string;
  interviewerId: string;
}

// Added missing ProcessingResult interface
export interface ProcessingResult {
  jobDescription: JobDescription;
  confidence: number;
  processingTime: number;
  extractionMethod: string;
  languageDetected?: string;
  metadata?: {
    wordCount?: number;
    sections?: string[];
    quality?: number;
  };
}

// ===== API CLIENT CONFIGURATION =====

// Safe environment variable access for React applications
const getEnvVar = (key: string, defaultValue: string): string => {
  // Check for Next.js environment variables
  if (typeof window !== 'undefined') {
    // Browser environment - use runtime config or fallback
    return (window as any).__RUNTIME_CONFIG__?.[key] || defaultValue;
  }
  
  // Server-side or build-time environment
  if (typeof process !== 'undefined' && process.env) {
    // Check for framework-specific prefixes
    return process.env[`NEXT_PUBLIC_${key}`] || 
           process.env[`REACT_APP_${key}`] || 
           process.env[`VITE_${key}`] || 
           process.env[key] || 
           defaultValue;
  }
  
  return defaultValue;
};

const FLASK_API_URL = getEnvVar('FLASK_API_URL', 'http://localhost:5001');

// Generic API client for non-Flask endpoints
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: Math.random().toString(36).substr(2, 9),
          processingTime: 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: Math.random().toString(36).substr(2, 9),
          processingTime: 0
        }
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Flask API client for CV/JD parsing and matching
class FlaskApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = FLASK_API_URL;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        mode: 'cors',
        ...options,
      });

      if (!response.ok) {
        throw new Error(`Flask API Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform Flask response to unified format
      return {
        success: true,
        data: this.transformFlaskResponse(data),
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: data.request_id || Math.random().toString(36).substr(2, 9),
          processingTime: data.processing_time || 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Flask API request failed',
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: Math.random().toString(36).substr(2, 9),
          processingTime: 0
        }
      };
    }
  }

  private transformFlaskResponse(data: any): any {
    // Transform Flask snake_case to camelCase for frontend consistency
    if (data.personal_info) {
      data.personalInfo = {
        name: data.personal_info.name || data.personal_info.full_name,
        fullName: data.personal_info.full_name || data.personal_info.name,
        email: data.personal_info.email,
        phone: data.personal_info.phone,
        location: data.personal_info.location || data.personal_info.address,
        address: data.personal_info.address || data.personal_info.location,
        summary: data.personal_info.summary,
        linkedin: data.personal_info.linkedin,
        linkedIn: data.personal_info.linkedin,
        website: data.personal_info.website
      };
      delete data.personal_info;
    }

    if (data.work_experience) {
      data.experience = data.work_experience.map((exp: any, index: number) => ({
        id: exp.id || `exp_${index}`,
        position: exp.position || exp.title,
        title: exp.title || exp.position,
        company: exp.company,
        location: exp.location,
        startDate: exp.start_date,
        start_date: exp.start_date,
        endDate: exp.end_date,
        end_date: exp.end_date,
        description: exp.description,
        responsibilities: exp.responsibilities
      }));
      delete data.work_experience;
    }

    if (data.education_history) {
      data.education = data.education_history.map((edu: any, index: number) => ({
        id: edu.id || `edu_${index}`,
        institution: edu.institution,
        degree: edu.degree,
        fieldOfStudy: edu.field_of_study,
        field_of_study: edu.field_of_study,
        startDate: edu.start_date,
        start_date: edu.start_date,
        endDate: edu.end_date,
        end_date: edu.end_date,
        gpa: edu.gpa
      }));
      delete data.education_history;
    }

    return data;
  }

  async parseCV(file: File): Promise<ApiResponse<CVData>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<CVData>('/api/cv/parse', {
      method: 'POST',
      body: formData,
    });
  }

  async parseCVText(text: string): Promise<ApiResponse<CVData>> {
    return this.request<CVData>('/api/cv/parse-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
  }

  // ===== JD PARSING METHODS (NEW) =====
  async parseJobDescription(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch(`${this.baseURL}/api/jd/parse`, {
        method: 'POST',
        mode: 'cors',
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: data.data,
          message: data.message,
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: Math.random().toString(36).substr(2, 9),
            processingTime: data.processing_time || 0,
            ...data.metadata
          }
        };
      } else {
        return {
          success: false,
          error: data.error || 'JD parsing failed',
          message: data.message,
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: Math.random().toString(36).substr(2, 9),
            processingTime: 0
          }
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error during JD parsing',
        message: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: Math.random().toString(36).substr(2, 9),
          processingTime: 0
        }
      };
    }
  }

  async parseJobDescriptionText(text: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseURL}/api/jd/parse-text`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: data.data,
          message: data.message,
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: Math.random().toString(36).substr(2, 9),
            processingTime: data.processing_time || 0,
            ...data.metadata
          }
        };
      } else {
        return {
          success: false,
          error: data.error || 'JD text parsing failed',
          message: data.message,
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: Math.random().toString(36).substr(2, 9),
            processingTime: 0
          }
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error during JD text parsing',
        message: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: Math.random().toString(36).substr(2, 9),
          processingTime: 0
        }
      };
    }
  }

  async listJobDescriptions(): Promise<ApiResponse<any[]>> {
    try {
      const response = await fetch(`${this.baseURL}/api/jd/list`, {
        method: 'GET',
        mode: 'cors',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: data.data,
          message: data.message,
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: Math.random().toString(36).substr(2, 9),
            processingTime: 0,
            ...data.metadata
          }
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to list job descriptions',
          message: data.message,
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: Math.random().toString(36).substr(2, 9),
            processingTime: 0
          }
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error while listing job descriptions',
        message: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: Math.random().toString(36).substr(2, 9),
          processingTime: 0
        }
      };
    }
  }

  async getJobDescription(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseURL}/api/jd/${id}`, {
        method: 'GET',
        mode: 'cors',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: data.data,
          message: data.message,
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: Math.random().toString(36).substr(2, 9),
            processingTime: 0,
            ...data.metadata
          }
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to get job description',
          message: data.message,
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: Math.random().toString(36).substr(2, 9),
            processingTime: 0
          }
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error while getting job description',
        message: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: Math.random().toString(36).substr(2, 9),
          processingTime: 0
        }
      };
    }
  }

  async matchCVToJobs(cv: CVData, jobs: JobDescription[]): Promise<ApiResponse<JobMatch[]>> {
    return this.request<JobMatch[]>('/api/matching/cv-to-jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cv, jobs }),
    });
  }

  async findCandidatesForJob(jobDescription: JobDescription, filters?: any): Promise<ApiResponse<CandidateMatch[]>> {
    return this.request<CandidateMatch[]>('/api/matching/job-to-candidates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ job_description: jobDescription, filters }),
    });
  }

  // Added missing findJobsForCandidate function
  async findJobsForCandidate(candidateProfile: CandidateProfile, filters?: any): Promise<ApiResponse<JobMatch[]>> {
    return this.request<JobMatch[]>('/api/matching/candidate-to-jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ candidate: candidateProfile, filters }),
    });
  }

  async bulkCandidateScreening(jobDescription: JobDescription, candidates: CandidateProfile[]): Promise<ApiResponse<CandidateMatch[]>> {
    return this.request<CandidateMatch[]>('/api/matching/bulk-candidate-screening', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ job_description: jobDescription, candidates }),
    });
  }

  async rankCandidates(jobDescription: JobDescription, candidates: CandidateProfile[], weights?: any): Promise<ApiResponse<CandidateMatch[]>> {
    return this.request<CandidateMatch[]>('/api/matching/candidate-ranking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ job_description: jobDescription, candidates, weights }),
    });
  }

  async prepareInterview(jobId: string, candidateId: string, interviewType: string): Promise<ApiResponse<InterviewPreparation>> {
    return this.request<InterviewPreparation>('/api/matching/interview-preparation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ job_id: jobId, candidate_id: candidateId, interview_type: interviewType }),
    });
  }

  async manageShortlist(action: string, data: any): Promise<ApiResponse<ShortlistEntry[]>> {
    return this.request<ShortlistEntry[]>('/api/matching/shortlist-management', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...data }),
    });
  }

  async healthCheck(): Promise<ApiResponse<any>> {
    return this.request<any>('/health', { method: 'GET' });
  }
}

// ===== API INSTANCES =====

const apiClient = new ApiClient();
const flaskClient = new FlaskApiClient();

// ===== CV API =====
export const cvApi = {
  parse: (file: File) => flaskClient.parseCV(file),
  parseText: (text: string) => flaskClient.parseCVText(text),
  save: (cvData: CVData) => apiClient.post<CVData>('/cv/save', cvData),
  get: (id: string) => apiClient.get<CVData>(`/cv/${id}`),
  list: () => apiClient.get<CVData[]>('/cv/list'),
  delete: (id: string) => apiClient.delete(`/cv/${id}`),
  export: (id: string, format: 'pdf' | 'docx') => apiClient.get(`/cv/${id}/export?format=${format}`),
};

// ===== JOB API (UPDATED WITH NEW JD ENDPOINTS) =====
export const jobApi = {
  // File-based parsing
  parse: (file: File) => flaskClient.parseJobDescription(file),
  
  // Text-based parsing (NEW)
  parseText: (text: string) => flaskClient.parseJobDescriptionText(text),
  
  // List all parsed JDs (NEW)
  list: () => flaskClient.listJobDescriptions(),
  
  // Get specific JD by ID (NEW)
  get: (id: string) => flaskClient.getJobDescription(id),
  
  // Save JD (existing)
  save: (jobData: JobDescription) => apiClient.post<JobDescription>('/job/save', jobData),
  
  // Delete JD (existing)
  delete: (id: string) => apiClient.delete(`/job/${id}`),
  
  // Search JDs (existing)
  search: (query: string, filters?: any) => apiClient.post<JobDescription[]>('/job/search', { query, filters }),
};

// ===== MATCHING API =====
export const matchingApi = {
  matchCVToJobs: (cv: CVData, jobs: JobDescription[]) => flaskClient.matchCVToJobs(cv, jobs),
  findCandidatesForJob: (jobDescription: JobDescription, filters?: any) => flaskClient.findCandidatesForJob(jobDescription, filters),
  findJobsForCandidate: (candidateProfile: CandidateProfile, filters?: any) => flaskClient.findJobsForCandidate(candidateProfile, filters), // Added missing function
  bulkScreening: (jobDescription: JobDescription, candidates: CandidateProfile[]) => flaskClient.bulkCandidateScreening(jobDescription, candidates),
  rankCandidates: (jobDescription: JobDescription, candidates: CandidateProfile[], weights?: any) => flaskClient.rankCandidates(jobDescription, candidates, weights),
  matchFiles: (cvFile: File, jdFile: File) => {
    // For backward compatibility with existing /match_files endpoint
    const formData = new FormData();
    formData.append('cv_file', cvFile);
    formData.append('jd_file', jdFile);
    
    return fetch(`${FLASK_API_URL}/match_files`, {
      method: 'POST',
      body: formData,
    }).then(response => response.json());
  },
};

// ===== RECRUITER API =====
export const recruiterApi = {
  findCandidates: (jobDescription: JobDescription, filters?: any) => flaskClient.findCandidatesForJob(jobDescription, filters),
  screenCandidates: (jobDescription: JobDescription, candidates: CandidateProfile[]) => flaskClient.bulkCandidateScreening(jobDescription, candidates),
  rankCandidates: (jobDescription: JobDescription, candidates: CandidateProfile[], weights?: any) => flaskClient.rankCandidates(jobDescription, candidates, weights),
  prepareInterview: (jobId: string, candidateId: string, interviewType: string) => flaskClient.prepareInterview(jobId, candidateId, interviewType),
  manageShortlist: (action: string, data: any) => flaskClient.manageShortlist(action, data),
  
  // Additional recruiter-specific functions
  getCandidateProfile: (id: string) => apiClient.get<CandidateProfile>(`/recruiter/candidates/${id}`),
  updateCandidateStatus: (candidateId: string, status: string, notes?: string) => 
    apiClient.put(`/recruiter/candidates/${candidateId}/status`, { status, notes }),
  scheduleInterview: (candidateId: string, jobId: string, interviewData: any) =>
    apiClient.post(`/recruiter/interviews/schedule`, { candidateId, jobId, ...interviewData }),
  submitInterviewFeedback: (feedback: InterviewFeedback) =>
    apiClient.post('/recruiter/interviews/feedback', feedback),
};

// ===== UTILITY FUNCTIONS =====

export const handleApiError = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const validateCV = (cvData: Partial<CVData>): FormValidation => {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  // Check both name and fullName for compatibility
  if (!cvData.personalInfo?.name && !cvData.personalInfo?.fullName) {
    errors.name = 'Full name is required';
  }
  if (!cvData.personalInfo?.email) {
    errors.email = 'Email address is required';
  }
  if (!cvData.experience || cvData.experience.length === 0) {
    warnings.experience = 'Consider adding work experience to strengthen your CV';
  }
  if (!cvData.education || cvData.education.length === 0) {
    warnings.education = 'Adding education information can improve your profile';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
};

export const validateJobDescription = (jobData: Partial<JobDescription>): FormValidation => {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  if (!jobData.title) {
    errors.title = 'Job title is required';
  }
  if (!jobData.company) {
    errors.company = 'Company name is required';
  }
  if (!jobData.description) {
    errors.description = 'Job description is required';
  }
  if (!jobData.requirements || (Array.isArray(jobData.requirements) && jobData.requirements.length === 0)) {
    warnings.requirements = 'Adding specific requirements helps attract qualified candidates';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
};

// ===== HEALTH CHECK =====
export const healthCheck = () => flaskClient.healthCheck();

// ===== DEFAULT EXPORT =====
export default {
  cv: cvApi,
  job: jobApi,
  matching: matchingApi,
  recruiter: recruiterApi,
  healthCheck,
  handleApiError,
  validateCV,
  validateJobDescription,
};

