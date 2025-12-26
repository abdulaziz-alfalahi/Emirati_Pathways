/**
 * Recruiter Service for Emirati Pathways Platform
 * Centralized API service for all recruiter-related operations
 * 
 * @description This service handles all API interactions for the recruiter dashboard,
 * including candidate management, job postings, interviews, and messaging.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

// ============================================================================
// Type Definitions
// ============================================================================

export type CandidateStatus = 'new' | 'reviewed' | 'shortlisted' | 'interviewed' | 'offered' | 'hired' | 'rejected';
export type VisaStatus = 'sponsored' | 'own_visa' | 'uae_national' | 'requires_visa';
export type ArabicProficiency = 'none' | 'basic' | 'intermediate' | 'fluent' | 'native';
export type Availability = 'immediate' | 'notice_period' | 'flexible';
export type JobType = 'full_time' | 'part_time' | 'contract' | 'internship';
export type WorkMode = 'on_site' | 'remote' | 'hybrid';
export type JobStatus = 'active' | 'paused' | 'closed' | 'draft';
export type InterviewType = 'technical' | 'behavioral' | 'initial' | 'panel' | 'final';
export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
export type InterviewResult = 'passed' | 'failed' | 'pending';

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location: string;
  experience_years: number;
  skills: string[];
  education: string;
  current_position?: string;
  salary_expectation?: string;
  visa_status: VisaStatus;
  availability: Availability;
  match_score?: number;
  cultural_fit_score?: number;
  uae_experience: boolean;
  arabic_proficiency: ArabicProficiency;
  status: CandidateStatus;
  applied_date: string;
  last_interaction?: string;
  notes?: string;
  cv_url?: string;
  profile_image?: string;
}

export interface JobDescription {
  id: string;
  title: string;
  company: string;
  location: string;
  type: JobType;
  work_mode: WorkMode;
  status: JobStatus;
  created_date: string;
  applications_count: number;
  views_count: number;
  shortlisted_count: number;
  hired_count: number;
  quality_score?: number;
  compliance_score?: number;
  uae_alignment_score?: number;
  optimization_potential?: string;
  processing_type: 'basic' | 'enhanced';
  requirements: {
    skills: string[];
    experience: string[];
    education: string[];
    languages: string[];
  };
  enhanced_metadata?: {
    quality_score: number;
    compliance_score: number;
    uae_alignment: number;
    optimization_potential: string;
  };
}

export interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  scheduledDate: string;
  duration: string;
  status: InterviewStatus;
  type: InterviewType;
  videoUrl?: string;
  location?: string;
  feedback?: string;
  result?: InterviewResult;
  interviewerName?: string;
  interviewerEmail?: string;
  notes?: string;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  content: string;
  timestamp: string;
  read: boolean;
  attachments?: string[];
}

export interface DashboardStats {
  total_candidates: number;
  new_applications: number;
  shortlisted: number;
  interviews_scheduled: number;
  offers_pending: number;
  active_jobs: number;
  paused_jobs: number;
  avg_match_score: number;
  avg_time_to_hire: number;
  uae_nationals_percentage: number;
  top_skills: Array<{ skill: string; count: number }>;
  location_distribution: Array<{ location: string; count: number }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ============================================================================
// Recruiter Service Class
// ============================================================================

class RecruiterService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token') || localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || `Request failed with status ${response.status}`,
      };
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message,
    };
  }

  // ============================================================================
  // Dashboard Statistics
  // ============================================================================

  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/recruiter/dashboard/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse<DashboardStats>(response);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard statistics',
      };
    }
  }

  // ============================================================================
  // Candidate Management
  // ============================================================================

  async getCandidates(jobId?: string, filters?: Record<string, unknown>): Promise<ApiResponse<Candidate[]>> {
    try {
      const params = new URLSearchParams();
      if (jobId) params.append('job_id', jobId);
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }

      const url = `${API_BASE_URL}/api/recruiter/candidates${params.toString() ? `?${params}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse<Candidate[]>(response);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch candidates',
      };
    }
  }

  async getCandidateById(candidateId: string): Promise<ApiResponse<Candidate>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/recruiter/candidates/${candidateId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse<Candidate>(response);
    } catch (error) {
      console.error('Error fetching candidate:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch candidate details',
      };
    }
  }

  async updateCandidateStatus(
    candidateId: string,
    status: CandidateStatus,
    notes?: string
  ): Promise<ApiResponse<Candidate>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/recruiter/candidates/${candidateId}/status`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status, notes }),
      });
      return this.handleResponse<Candidate>(response);
    } catch (error) {
      console.error('Error updating candidate status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update candidate status',
      };
    }
  }

  async bulkUpdateCandidates(
    candidateIds: string[],
    action: 'shortlist' | 'reject' | 'archive',
    notes?: string
  ): Promise<ApiResponse<{ updated: number }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/recruiter/candidates/bulk-update`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ candidate_ids: candidateIds, action, notes }),
      });
      return this.handleResponse<{ updated: number }>(response);
    } catch (error) {
      console.error('Error performing bulk update:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to perform bulk update',
      };
    }
  }

  // ============================================================================
  // Job Management
  // ============================================================================

  async getJobs(status?: JobStatus): Promise<ApiResponse<JobDescription[]>> {
    try {
      const params = status ? `?status=${status}` : '';
      const response = await fetch(`${API_BASE_URL}/api/recruiter/jobs${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse<JobDescription[]>(response);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch jobs',
      };
    }
  }

  async getJobById(jobId: string): Promise<ApiResponse<JobDescription>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/recruiter/jobs/${jobId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse<JobDescription>(response);
    } catch (error) {
      console.error('Error fetching job:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch job details',
      };
    }
  }

  async createJob(jobData: Partial<JobDescription>): Promise<ApiResponse<JobDescription>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/recruiter/jobs`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(jobData),
      });
      return this.handleResponse<JobDescription>(response);
    } catch (error) {
      console.error('Error creating job:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create job',
      };
    }
  }

  async updateJob(jobId: string, jobData: Partial<JobDescription>): Promise<ApiResponse<JobDescription>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/recruiter/jobs/${jobId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(jobData),
      });
      return this.handleResponse<JobDescription>(response);
    } catch (error) {
      console.error('Error updating job:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update job',
      };
    }
  }

  async updateJobStatus(jobId: string, status: JobStatus): Promise<ApiResponse<JobDescription>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/recruiter/jobs/${jobId}/status`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      return this.handleResponse<JobDescription>(response);
    } catch (error) {
      console.error('Error updating job status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update job status',
      };
    }
  }

  // ============================================================================
  // Interview Management
  // ============================================================================

  async getInterviews(status?: InterviewStatus): Promise<ApiResponse<Interview[]>> {
    try {
      const params = status ? `?status=${status}` : '';
      const response = await fetch(`${API_BASE_URL}/api/recruiter/interviews${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse<Interview[]>(response);
    } catch (error) {
      console.error('Error fetching interviews:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch interviews',
      };
    }
  }

  async scheduleInterview(interviewData: {
    candidateId: string;
    jobId: string;
    scheduledDate: string;
    duration: string;
    type: InterviewType;
    location?: string;
    videoUrl?: string;
    interviewerName?: string;
    interviewerEmail?: string;
    notes?: string;
  }): Promise<ApiResponse<Interview>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/recruiter/interviews`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(interviewData),
      });
      return this.handleResponse<Interview>(response);
    } catch (error) {
      console.error('Error scheduling interview:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to schedule interview',
      };
    }
  }

  async updateInterviewFeedback(
    interviewId: string,
    feedback: string,
    result: InterviewResult
  ): Promise<ApiResponse<Interview>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/recruiter/interviews/${interviewId}/feedback`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ feedback, result }),
      });
      return this.handleResponse<Interview>(response);
    } catch (error) {
      console.error('Error updating interview feedback:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update interview feedback',
      };
    }
  }

  async cancelInterview(interviewId: string, reason?: string): Promise<ApiResponse<Interview>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/recruiter/interviews/${interviewId}/cancel`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ reason }),
      });
      return this.handleResponse<Interview>(response);
    } catch (error) {
      console.error('Error cancelling interview:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel interview',
      };
    }
  }

  // ============================================================================
  // Messaging
  // ============================================================================

  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/recruiter/messages/conversations`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse<Conversation[]>(response);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch conversations',
      };
    }
  }

  async getMessages(conversationId: string): Promise<ApiResponse<Message[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/recruiter/messages/${conversationId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse<Message[]>(response);
    } catch (error) {
      console.error('Error fetching messages:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch messages',
      };
    }
  }

  async sendMessage(
    recipientId: string,
    content: string,
    attachments?: string[]
  ): Promise<ApiResponse<Message>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/recruiter/messages`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ recipient_id: recipientId, content, attachments }),
      });
      return this.handleResponse<Message>(response);
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
      };
    }
  }

  async markMessagesAsRead(conversationId: string): Promise<ApiResponse<{ updated: number }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/recruiter/messages/${conversationId}/read`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse<{ updated: number }>(response);
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark messages as read',
      };
    }
  }
}

// Export singleton instance
export const recruiterService = new RecruiterService();
export default recruiterService;
