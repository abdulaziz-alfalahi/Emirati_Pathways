// Admin Service for Emirati Journey Platform
// Handles all admin-related API calls to the backend
import { getAuthToken } from '@/utils/tokenUtils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

export interface PlatformOverview {
  total_users: number;
  total_jobs: number;
  total_applications: number;
  total_companies: number;
  active_users_today: number;
  new_registrations_today: number;
  jobs_posted_today: number;
  applications_submitted_today: number;
  user_growth_rate: number;
  job_growth_rate: number;
  application_success_rate: number;
  platform_engagement_score: number;
  emiratization_metrics: {
    uae_nationals_percentage: number;
    emiratization_jobs_count: number;
    emiratization_success_rate: number;
  };
  top_industries: Array<{
    industry: string;
    job_count: number;
    application_count: number;
  }>;
  top_emirates: Array<{
    emirate: string;
    user_count: number;
    job_count: number;
  }>;
  recent_activities: Array<{
    type: string;
    description: string;
    timestamp: string;
    user_id?: string;
    user_name?: string;
  }>;
}

export interface UserManagement {
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    emirate: string;
    registration_date: string;
    last_login: string;
    is_active: boolean;
    profile_completion: number;
    applications_count: number;
    jobs_posted_count: number;
  }>;
  total_count: number;
  active_count: number;
  inactive_count: number;
  role_distribution: Record<string, number>;
  emirate_distribution: Record<string, number>;
}

export interface JobAnalytics {
  total_jobs: number;
  active_jobs: number;
  draft_jobs: number;
  closed_jobs: number;
  jobs_by_industry: Record<string, number>;
  jobs_by_emirate: Record<string, number>;
  jobs_by_employment_type: Record<string, number>;
  average_applications_per_job: number;
  top_performing_jobs: Array<{
    id: string;
    title: string;
    company_name: string;
    applications_count: number;
    views_count: number;
    posted_date: string;
  }>;
  emiratization_jobs: {
    total: number;
    percentage: number;
    success_rate: number;
  };
}

export interface ApplicationAnalytics {
  total_applications: number;
  pending_applications: number;
  reviewed_applications: number;
  successful_applications: number;
  rejected_applications: number;
  applications_by_status: Record<string, number>;
  applications_by_industry: Record<string, number>;
  applications_by_emirate: Record<string, number>;
  average_time_to_review: number;
  success_rate_by_industry: Record<string, number>;
  monthly_trends: Array<{
    month: string;
    applications: number;
    success_rate: number;
  }>;
}

export interface AdminResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

class AdminService {
  private getAuthHeaders(): HeadersInit {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  async getPlatformOverview(timeframe: string = 'monthly'): Promise<AdminResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/analytics/platform/overview?timeframe=${timeframe}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch platform overview');
      }

      return {
        success: true,
        data: data.data,
        message: data.message,
      };
    } catch (error) {
      console.error('Error fetching platform overview:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getUserManagement(
    page: number = 1,
    limit: number = 50,
    filters?: {
      role?: string;
      emirate?: string;
      is_active?: boolean;
      search?: string;
    }
  ): Promise<AdminResponse> {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }

      const response = await fetch(
        `${API_BASE_URL}/api/admin/users?${queryParams}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user management data');
      }

      return {
        success: true,
        data: data.data,
        message: data.message,
      };
    } catch (error) {
      console.error('Error fetching user management data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getJobAnalytics(companyId?: string): Promise<AdminResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (companyId) {
        queryParams.append('company_id', companyId);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/analytics/jobs${queryParams.toString() ? `?${queryParams}` : ''}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch job analytics');
      }

      return {
        success: true,
        data: data.data,
        message: data.message,
      };
    } catch (error) {
      console.error('Error fetching job analytics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getApplicationAnalytics(): Promise<AdminResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics/applications`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch application analytics');
      }

      return {
        success: true,
        data: data.data,
        message: data.message,
      };
    } catch (error) {
      console.error('Error fetching application analytics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<AdminResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ is_active: isActive }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user status');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'User status updated successfully',
      };
    } catch (error) {
      console.error('Error updating user status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async updateUserRole(userId: string, role: string): Promise<AdminResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user role');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'User role updated successfully',
      };
    } catch (error) {
      console.error('Error updating user role:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async deleteUser(userId: string): Promise<AdminResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete user');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'User deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getSystemHealth(): Promise<AdminResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/system/health`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch system health');
      }

      return {
        success: true,
        data: data.data,
        message: data.message,
      };
    } catch (error) {
      console.error('Error fetching system health:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getAuditLogs(
    page: number = 1,
    limit: number = 50,
    filters?: {
      action?: string;
      user_id?: string;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<AdminResponse> {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }

      const response = await fetch(
        `${API_BASE_URL}/api/admin/audit-logs?${queryParams}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch audit logs');
      }

      return {
        success: true,
        data: data.data,
        message: data.message,
      };
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async exportData(
    type: 'users' | 'jobs' | 'applications' | 'analytics',
    format: 'csv' | 'excel' | 'json' = 'excel'
  ): Promise<AdminResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/export/${type}?format=${format}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to export data');
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return {
        success: true,
        message: 'Data exported successfully',
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

export const adminService = new AdminService();
export default adminService;

