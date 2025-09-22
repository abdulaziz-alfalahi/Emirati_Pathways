// Application Service for Emirati Journey Platform
// Handles all application-related API calls to the backend

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

export interface ApplicationData {
  id?: string;
  job_id: string;
  candidate_id?: string;
  cover_letter?: string;
  expected_salary?: number;
  salary_currency?: string;
  available_from?: string;
  notice_period?: string;
  source?: string;
  referral_source?: string;
  referrer_id?: string;
  candidate_notes?: string;
}

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  status: string;
  cover_letter?: string;
  expected_salary?: number;
  salary_currency: string;
  available_from?: string;
  notice_period?: string;
  source: string;
  referral_source?: string;
  referrer_id?: string;
  candidate_notes?: string;
  recruiter_notes?: string;
  rejection_reason?: string;
  match_score?: number;
  recruiter_rating?: number;
  skills_match_percentage?: number;
  experience_match_percentage?: number;
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
  shortlisted_at?: string;
  rejected_at?: string;
  offer_made_at?: string;
  offer_responded_at?: string;
  reviewed_by?: string;
  hiring_manager_id?: string;
  hr_contact_id?: string;
  job_title?: string;
  company_name?: string;
  candidate_name?: string;
  candidate_email?: string;
}

export interface ApplicationResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

class ApplicationService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  async applyToJob(applicationData: ApplicationData): Promise<ApplicationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/applications/apply`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(applicationData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit application');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Application submitted successfully',
      };
    } catch (error) {
      console.error('Error submitting application:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getMyApplications(): Promise<ApplicationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/applications/my-applications`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch applications');
      }

      return {
        success: true,
        data: data.data || data.applications || [],
        message: data.message,
      };
    } catch (error) {
      console.error('Error fetching applications:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getApplicationById(applicationId: string): Promise<ApplicationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch application');
      }

      return {
        success: true,
        data: data.data,
        message: data.message,
      };
    } catch (error) {
      console.error('Error fetching application:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async updateApplicationStatus(
    applicationId: string, 
    status: string, 
    notes?: string
  ): Promise<ApplicationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status, notes }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update application status');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Application status updated successfully',
      };
    } catch (error) {
      console.error('Error updating application status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async withdrawApplication(applicationId: string, reason?: string): Promise<ApplicationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/withdraw`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to withdraw application');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Application withdrawn successfully',
      };
    } catch (error) {
      console.error('Error withdrawing application:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getJobApplications(jobId: string): Promise<ApplicationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/applications/job/${jobId}`, {
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

  async addRecruiterNotes(
    applicationId: string, 
    notes: string, 
    rating?: number
  ): Promise<ApplicationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/notes`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ recruiter_notes: notes, recruiter_rating: rating }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add notes');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Notes added successfully',
      };
    } catch (error) {
      console.error('Error adding notes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async scheduleInterview(
    applicationId: string,
    interviewData: {
      interview_type: string;
      scheduled_date: string;
      duration_minutes?: number;
      location?: string;
      meeting_link?: string;
      interviewer_name?: string;
      interviewer_email?: string;
      notes?: string;
    }
  ): Promise<ApplicationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/interview`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(interviewData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to schedule interview');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Interview scheduled successfully',
      };
    } catch (error) {
      console.error('Error scheduling interview:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async makeOffer(
    applicationId: string,
    offerData: {
      salary_offered: number;
      currency?: string;
      benefits?: string[];
      start_date?: string;
      offer_expiry_date?: string;
      contract_type?: string;
      probation_period_months?: number;
      notice_period?: string;
      additional_terms?: string;
    }
  ): Promise<ApplicationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/offer`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(offerData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to make offer');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Offer made successfully',
      };
    } catch (error) {
      console.error('Error making offer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async respondToOffer(
    applicationId: string,
    response: 'accept' | 'decline',
    notes?: string
  ): Promise<ApplicationResponse> {
    try {
      const apiResponse = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/offer/respond`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ response, notes }),
      });

      const data = await apiResponse.json();

      if (!apiResponse.ok) {
        throw new Error(data.message || 'Failed to respond to offer');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Offer response submitted successfully',
      };
    } catch (error) {
      console.error('Error responding to offer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getApplicationStats(): Promise<ApplicationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/applications/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch application stats');
      }

      return {
        success: true,
        data: data.data,
        message: data.message,
      };
    } catch (error) {
      console.error('Error fetching application stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

export const applicationService = new ApplicationService();
export default applicationService;

