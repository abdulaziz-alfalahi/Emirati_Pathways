export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  emirate: string;
  user_type: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    access_token: string;
    refresh_token: string;
    user: {
      id: number;
      email: string;
      full_name: string;
      user_type: string;
      phone: string;
      emirate: string;
      roles?: string[];
      is_new_user?: boolean;
    };
    expires_in: number;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    user_id: number;
    email_verification_required: boolean;
    phone_verification_required: boolean;
  };
}

export interface UserRolesResponse {
  success: boolean;
  data?: {
    roles: string[];
  };
}

import {
  ROLE_DASHBOARD_MAP,
  UserRole
} from '@/types/auth';
import { getAuthToken, clearAuthTokens } from '@/utils/tokenUtils';

// Available roles with metadata
export const AVAILABLE_ROLES = [
  {
    id: 'job_seeker',
    name: 'Job Seeker',
    description: 'Find your dream career with AI-powered job matching',
    dashboard: '/candidate-dashboard'
  },
  {
    id: 'student',
    name: 'Student',
    description: 'Explore scholarships, internships, and educational programs',
    dashboard: '/student-dashboard'
  },
  {
    id: 'hr_manager',
    name: 'HR Manager',
    description: 'Oversee workforce planning and talent strategy',
    dashboard: '/hr-dashboard'
  },
  {
    id: 'recruiter',
    name: 'Recruiter',
    description: 'Source candidates and manage talent pipelines',
    dashboard: '/recruiter'
  },
  {
    id: 'educator',
    name: 'Educator',
    description: 'Enhance student outcomes with curriculum management',
    dashboard: '/educator-dashboard'
  },
  {
    id: 'mentor',
    name: 'Mentor',
    description: 'Guide the next generation of professionals',
    dashboard: '/mentor-dashboard'
  },
  {
    id: 'assessor',
    name: 'Assessor',
    description: 'Evaluate and validate professional competencies',
    dashboard: '/assessor-dashboard'
  },
  {
    id: 'guardian',
    name: 'Guardian / Parent',
    description: 'Monitor your child\'s career journey and milestones',
    dashboard: '/guardian-dashboard'
  }
];

class AuthService {
  private readonly API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ? `${(import.meta as any).env.VITE_API_BASE_URL}/api` : '/api';

  async login(credentials: LoginData): Promise<AuthResponse> {
    try {
      console.log('AuthService: Attempting login to', `${this.API_BASE_URL}/auth/login`);

      const response = await fetch(`${this.API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('AuthService: Login response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('AuthService: Login response data:', {
        success: data.success,
        hasAccessToken: !!data.data?.access_token,
        userRole: data.data?.user?.user_type || data.data?.user?.role
      });

      if (data.success && data.data) {
        localStorage.setItem('access_token', data.data.access_token);
        localStorage.setItem('refresh_token', data.data.refresh_token);
        // Store the user object under 'user'
        const userObj = data.data.user || data.data;
        localStorage.setItem('user', JSON.stringify(userObj));
      }
      return data;
    } catch (error) {
      console.error('AuthService: Login error:', error);
      throw error;
    }
  }

  async register(userData: RegisterData): Promise<RegisterResponse> {
    try {
      console.log('AuthService: Attempting registration to', `${this.API_BASE_URL}/auth/register`);
      console.log('AuthService: Registration data:', {
        email: userData.email,
        user_type: userData.user_type,
        emirate: userData.emirate
      });

      const response = await fetch(`${this.API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      console.log('AuthService: Registration response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('AuthService: Registration response data:', {
        success: data.success,
        message: data.message
      });

      if (data.success && data.data) {
        // Optional: auto-login will handle tokens after register
      }
      return data;
    } catch (error) {
      console.error('AuthService: Registration error:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const refreshed = await response.json();
      if (refreshed?.data?.access_token) {
        localStorage.setItem('access_token', refreshed.data.access_token);
      }
      return refreshed;
    } catch (error) {
      console.error('AuthService: Refresh token error:', error);
      throw error;
    }
  }

  async requestOtp(phone: string): Promise<{ success: boolean; message: string; debug_otp?: string }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      return await response.json();
    } catch (error) {
      console.error('AuthService: Request OTP error:', error);
      return { success: false, message: 'Failed to request OTP' };
    }
  }

  async loginWithOtp(phone: string, code: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/login-with-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await response.json();

      if (data.success && data.data) {
        localStorage.setItem('access_token', data.data.access_token);
        localStorage.setItem('refresh_token', data.data.refresh_token);
        const userObj = data.data.user || data.data;
        localStorage.setItem('user', JSON.stringify(userObj));
      }

      return data;
    } catch (error) {
      console.error('AuthService: Login with OTP error:', error);
      return { success: false, message: 'Failed to login with OTP' } as AuthResponse;
    }
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      const token = getAuthToken();

      const response = await fetch(`${this.API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      // Clear local storage regardless of response
      clearAuthTokens();
      localStorage.removeItem('user');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('AuthService: Logout error:', error);
      // Still clear local storage even if API call fails
      clearAuthTokens();
      localStorage.removeItem('user');
      throw error;
    }
  }

  async getProfile(): Promise<any> {
    try {
      const token = getAuthToken();

      if (!token) {
        throw new Error('No access token found');
      }

      const response = await fetch(`${this.API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('AuthService: Get profile error:', error);
      throw error;
    }
  }

  async getUserRoles(): Promise<UserRolesResponse> {
    try {
      const token = getAuthToken();

      if (!token) {
        throw new Error('No access token found');
      }

      const response = await fetch(`${this.API_BASE_URL}/auth/roles`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('AuthService: Get user roles error:', error);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    const token = getAuthToken();
    const user = this.getUser();
    // Both token and user data must be present for authenticated state
    return !!(token && user);
  }

  getUser(): any {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr && userStr !== 'undefined' && userStr !== 'null') {
        return JSON.parse(userStr);
      }
      return null;
    } catch (error) {
      console.error('AuthService: Error parsing user data:', error);
      // Clear invalid data
      localStorage.removeItem('user');
      clearAuthTokens();
      return null;
    }
  }

  getToken(): string | null {
    return getAuthToken();
  }

  /**
   * Get standard auth headers for API requests
   */
  getAuthHeaders(): Record<string, string> {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  clearAuth(): void {
    clearAuthTokens();
    localStorage.removeItem('user');
  }

  /**
   * Get user roles from stored token or API
   */
  async getUserRole(): Promise<string | null> {
    try {
      // First try to get from stored user data
      const storedUser = localStorage.getItem('user');
      if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
        const userData = JSON.parse(storedUser);

        // Check for roles array first
        if (userData.roles && userData.roles.length > 0) {
          return userData.roles[0]; // Return primary role
        }

        // Check for specific role field first
        if (userData.role) {
          return userData.role;
        }

        // Fallback to user_type field
        if (userData.user_type) {
          return userData.user_type;
        }
      }

      // Final fallback - try to get from current user object
      const currentUser = this.getUser();
      if (currentUser?.user_type) {
        return currentUser.user_type;
      }

      // Only try API if we have a valid token and are authenticated
      const token = getAuthToken();
      if (token && this.isAuthenticated()) {
        try {
          const response = await this.getUserRoles();
          if (response.success && response.data) {
            const roles = (response as any).data.roles;
            const user_type = (response as any).data.user_type;
            if (user_type) return user_type;
            if (Array.isArray(roles) && roles.length > 0) return roles[0];
          }
        } catch (apiError) {
          console.warn('Could not fetch roles from API, using fallback logic');
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting user role:', error);
      // Clear invalid data on error
      localStorage.removeItem('user');
      clearAuthTokens();
      return null;
    }
  }

  /**
   * Get dashboard route based on user role
   */
  async getDashboardRoute(): Promise<string> {
    try {
      const role = await this.getUserRole();

      console.log('AuthService: Determining dashboard route for role:', role);

      // Use the role mapping for consistent routing
      const dashboardRoute = ROLE_DASHBOARD_MAP[role?.toLowerCase() || ''];

      if (dashboardRoute) {
        console.log('AuthService: Routing to:', dashboardRoute);
        return dashboardRoute;
      }

      // Legacy fallback logic
      switch (role?.toLowerCase()) {
        case 'hr_manager':
        case 'hr manager':
        case 'hr':
          console.log('AuthService: Routing to HR Dashboard (legacy)');
          return '/hr-dashboard';
        case 'recruiter':
          console.log('AuthService: Routing to Recruiter Dashboard (legacy)');
          return '/recruiter-dashboard';
        case 'administrator':
        case 'admin':
          console.log('AuthService: Routing to Admin Dashboard (legacy)');
          return '/admin-dashboard';
        case 'student':
          console.log('AuthService: Routing to Student Dashboard (legacy fallback)');
          return '/student-dashboard';
        case 'guardian':
        case 'parent':
          console.log('AuthService: Routing to Guardian Dashboard (legacy)');
          return '/guardian-dashboard';
        case 'job_seeker':
        case 'candidate':
        case 'job seeker':
        default:
          console.log('AuthService: Routing to Candidate Dashboard (default)');
          return '/candidate-dashboard';
      }
    } catch (error) {
      console.error('Error determining dashboard route:', error);
      return '/candidate-dashboard'; // Default fallback
    }
  }

  /**
   * Check if user has specific role
   */
  async hasRole(targetRole: string): Promise<boolean> {
    try {
      const userRole = await this.getUserRole();
      return userRole?.toLowerCase() === targetRole.toLowerCase();
    } catch (error) {
      console.error('Error checking user role:', error);
      return false;
    }
  }

  // =============================================
  // UAE Pass Authentication
  // =============================================

  /**
   * Get UAE Pass authorization URL from the backend.
   * The frontend should redirect the user to this URL.
   *
   * @param returnUrl - Optional URL to redirect to after auth
   * @returns The UAE Pass authorization URL
   */
  async getUAEPassLoginUrl(returnUrl?: string): Promise<string> {
    try {
      const params = returnUrl ? `?return_url=${encodeURIComponent(returnUrl)}` : '';
      const response = await fetch(`${this.API_BASE_URL}/auth/uaepass/login${params}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to get UAE Pass login URL: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data?.authorization_url) {
        return data.data.authorization_url;
      }
      throw new Error('No authorization URL returned');
    } catch (error) {
      console.error('AuthService: UAE Pass login URL error:', error);
      throw error;
    }
  }

  /**
   * Get UAE Pass logout URL.
   * The frontend should redirect the user to this URL to complete logout.
   */
  async getUAEPassLogoutUrl(): Promise<string | null> {
    try {
      const token = getAuthToken();
      const response = await fetch(`${this.API_BASE_URL}/auth/uaepass/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.data?.logout_url || null;
      }
      return null;
    } catch (error) {
      console.warn('AuthService: UAE Pass logout URL fetch failed:', error);
      return null;
    }
  }

  /**
   * Check if the current user authenticated via UAE Pass
   */
  isUAEPassUser(): boolean {
    const user = this.getUser();
    return user?.auth_method === 'uaepass';
  }

  /**
   * Get available roles for selection
   */
  getAvailableRoles(): typeof AVAILABLE_ROLES {
    return AVAILABLE_ROLES;
  }

  /**
   * Get role metadata by ID
   */
  getRoleMetadata(roleId: string) {
    return AVAILABLE_ROLES.find(role => role.id === roleId);
  }

  /**
   * Update user roles (for future multi-role support)
   */
  async updateUserRoles(primaryRole: string, secondaryRoles: string[] = [], metadata: any = {}): Promise<any> {
    try {
      const token = getAuthToken();

      if (!token) {
        throw new Error('No access token found');
      }

      const response = await fetch(`${this.API_BASE_URL}/auth/update-roles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          primary_role: primaryRole,
          secondary_roles: secondaryRoles,
          metadata: metadata
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Update local storage with new user data if successful
      if (data.success && data.data?.user) {
        localStorage.setItem('user', JSON.stringify(data.data.user));
      }

      if (data.success && data.data) {
        if (data.data.access_token) localStorage.setItem('access_token', data.data.access_token);
        if (data.data.refresh_token) localStorage.setItem('refresh_token', data.data.refresh_token);
        // Store the user object under 'user'
        if (data.data.user) {
          localStorage.setItem('user', JSON.stringify(data.data.user));
        }
      }
      return data;
    } catch (error) {
      console.error('AuthService: Update roles error:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
export default authService;
