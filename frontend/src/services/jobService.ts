// Job Service for Emirati Journey Platform
// Handles all job-related API calls to the backend

// Use Vite proxy (empty string) to route through the dev server to the backend (port 5005)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export interface JobData {
  id?: string;
  title: string;
  description: string;
  summary?: string;
  company_name: string;
  department?: string;
  employment_type: string;
  experience_level: string;
  experience_years_min?: number;
  experience_years_max?: number;
  location: {
    emirate: string;
    city: string;
    area?: string;
    is_remote: boolean;
    is_hybrid: boolean;
    remote_percentage?: number;
  };
  salary?: {
    min_salary?: number;
    max_salary?: number;
    currency: string;
    is_negotiable: boolean;
    includes_benefits: boolean;
  };
  requirements?: string[];
  responsibilities?: string[];
  required_skills?: string[];
  preferred_skills?: string[];
  education_requirements?: string[];
  language_requirements?: string[];
  benefits?: string[];
  emiratization_priority: boolean;
  security_clearance_required: boolean;
  visa_sponsorship_available: boolean;
  requires_uae_experience: boolean;
  arabic_language_required: boolean;
  industry?: string;
  job_category?: string;
  tags?: string[];
  application_deadline?: string;
  start_date?: string;
}

export interface JobResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

class JobService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  async createJob(jobData: JobData): Promise<JobResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/jobs/create`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          ...jobData,
          company_id: 'temp-company-id', // This should be set based on the logged-in user's company
          posted_by: 'current-user-id', // This should be set from auth context
          status: 'published',
          priority: 'normal',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create job');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Job created successfully',
      };
    } catch (error) {
      console.error('Error creating job:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getJobs(filters?: {
    emirate?: string;
    industry?: string;
    employment_type?: string;
    experience_level?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<JobResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }

      const url = `${API_BASE_URL}/api/jobs/list${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch jobs');
      }

      return {
        success: true,
        data: data.data || data.jobs || [],
        message: data.message,
      };
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getJobById(jobId: string): Promise<JobResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch job');
      }

      return {
        success: true,
        data: data.data,
        message: data.message,
      };
    } catch (error) {
      console.error('Error fetching job:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async updateJob(jobId: string, jobData: Partial<JobData>): Promise<JobResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(jobData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update job');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Job updated successfully',
      };
    } catch (error) {
      console.error('Error updating job:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async deleteJob(jobId: string): Promise<JobResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete job');
      }

      return {
        success: true,
        message: data.message || 'Job deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting job:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async applyToJob(jobId: string, applicationData?: any): Promise<JobResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(applicationData || {}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to apply to job');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Application submitted successfully',
      };
    } catch (error) {
      console.error('Error applying to job:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getMyJobs(): Promise<JobResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/jobs/my-jobs`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch my jobs');
      }

      return {
        success: true,
        data: data.data || data.jobs || [],
        message: data.message,
      };
    } catch (error) {
      console.error('Error fetching my jobs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getJobApplications(jobId: string): Promise<JobResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/applications`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch job applications');
      }

      return {
        success: true,
        data: data.data || data.applications || [],
        message: data.message,
      };
    } catch (error) {
      console.error('Error fetching job applications:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

export const jobService = new JobService();
export default jobService;

