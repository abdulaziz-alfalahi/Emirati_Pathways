/**
 * CV Service for Emirati Journey Platform
 * Integrates with the backend API for CV parsing, matching, and management
 */

import { authService } from './authService';

// Use Vite proxy (empty string) to route through the dev server to the backend (port 5005)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface CVParseResponse {
  success: boolean;
  message: string;
  data?: {
    cv_id?: string;
    parsed_data?: ParsedCVData;
    matching_score?: number;
    recommendations?: string[];
  };
}

export interface ParsedCVData {
  personal_info?: {
    full_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    nationality?: string;
    emirate?: string;
  };
  experience?: Array<{
    title?: string;
    company?: string;
    duration?: string;
    description?: string;
    skills_used?: string[];
  }>;
  education?: Array<{
    degree?: string;
    institution?: string;
    year?: string;
    grade?: string;
  }>;
  skills?: {
    technical?: string[];
    soft?: string[];
    languages?: string[];
  };
  certifications?: Array<{
    name?: string;
    issuer?: string;
    date?: string;
  }>;
  summary?: string;
  career_objective?: string;
}

export interface JobMatchResponse {
  success: boolean;
  message: string;
  data?: {
    matches?: Array<{
      job_id: string;
      job_title: string;
      company: string;
      match_score: number;
      match_reasons: string[];
      requirements_met: number;
      total_requirements: number;
      location?: string;
      salary_range?: string;
    }>;
    total_matches?: number;
    cv_analysis?: {
      strengths: string[];
      improvement_areas: string[];
      missing_skills: string[];
    };
  };
}

class CVService {
  /**
   * Parse CV from text
   */
  async parseCVText(cvText: string): Promise<CVParseResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/cv/parse-text`, {
        method: 'POST',
        headers: authService.getAuthHeaders(),
        body: JSON.stringify({ cv_text: cvText }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('CV text parsing error:', error);
      return {
        success: false,
        message: 'Network error occurred during CV parsing',
      };
    }
  }

  /**
   * Parse CV from file upload
   */
  async parseCVFile(file: File): Promise<CVParseResponse> {
    try {
      const formData = new FormData();
      formData.append('cv_file', file);

      const response = await fetch(`${API_BASE_URL}/cv/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
        body: formData,
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('CV file parsing error:', error);
      return {
        success: false,
        message: 'Network error occurred during CV file parsing',
      };
    }
  }

  /**
   * Get job matches for a CV
   */
  async getJobMatches(cvId: string, limit: number = 10): Promise<JobMatchResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/matching/matches/${cvId}?limit=${limit}`, {
        method: 'GET',
        headers: authService.getAuthHeaders(),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Job matching error:', error);
      return {
        success: false,
        message: 'Network error occurred during job matching',
      };
    }
  }

  /**
   * Get CV analysis and recommendations
   */
  async getCVAnalysis(cvId: string): Promise<CVParseResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/cv/analyze/${cvId}`, {
        method: 'GET',
        headers: authService.getAuthHeaders(),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('CV analysis error:', error);
      return {
        success: false,
        message: 'Network error occurred during CV analysis',
      };
    }
  }

  /**
   * Save CV data
   */
  async saveCVData(cvData: ParsedCVData): Promise<CVParseResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/cv/save`, {
        method: 'POST',
        headers: authService.getAuthHeaders(),
        body: JSON.stringify({ cv_data: cvData }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('CV save error:', error);
      return {
        success: false,
        message: 'Network error occurred during CV save',
      };
    }
  }

  /**
   * Get user's saved CVs
   */
  async getUserCVs(): Promise<CVParseResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/cv/list`, {
        method: 'GET',
        headers: authService.getAuthHeaders(),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get user CVs error:', error);
      return {
        success: false,
        message: 'Network error occurred while fetching CVs',
      };
    }
  }

  /**
   * Apply to a job
   */
  async applyToJob(jobId: string, cvId: string, coverLetter?: string): Promise<CVParseResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/applications/apply`, {
        method: 'POST',
        headers: authService.getAuthHeaders(),
        body: JSON.stringify({
          job_id: jobId,
          cv_id: cvId,
          cover_letter: coverLetter,
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Job application error:', error);
      return {
        success: false,
        message: 'Network error occurred during job application',
      };
    }
  }

  /**
   * Get application status
   */
  async getApplications(): Promise<CVParseResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/applications/user-applications`, {
        method: 'GET',
        headers: authService.getAuthHeaders(),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get applications error:', error);
      return {
        success: false,
        message: 'Network error occurred while fetching applications',
      };
    }
  }

  /**
   * Get CV ranking/scoring
   */
  async getCVRanking(cvId: string): Promise<CVParseResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/cv/ranking/${cvId}`, {
        method: 'GET',
        headers: authService.getAuthHeaders(),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('CV ranking error:', error);
      return {
        success: false,
        message: 'Network error occurred during CV ranking',
      };
    }
  }
}

// Export singleton instance
export const cvService = new CVService();
export default cvService;

