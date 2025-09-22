export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
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

// Available roles with metadata
export const AVAILABLE_ROLES = [
  {
    id: 'job_seeker',
    name: 'Job Seeker',
    description: 'Find your dream career with AI-powered job matching',
    dashboard: '/candidate-dashboard'
  },
  {
    id: 'hr_recruiter',
    name: 'HR / Recruiter',
    description: 'Streamline hiring with advanced recruitment tools',
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
  }
];

// Role mapping for dashboard routing
const ROLE_DASHBOARD_MAP: Record<string, string> = {
  job_seeker: '/candidate-dashboard',
  hr_recruiter: '/recruiter',
  hr_manager: '/recruiter', // Legacy support
  recruiter: '/recruiter', // Legacy support
  educator: '/educator-dashboard',
  mentor: '/mentor-dashboard',
  assessor: '/assessor-dashboard',
  administrator: '/admin-dashboard'
};

class AuthService {
  private readonly API_BASE_URL = 'http://localhost:5003/api';

  async login(credentials: LoginData ): Promise<AuthResponse> {
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
        userType: data.data?.user?.user_type
      });

            if (data.success && data.data) {
        localStorage.setItem('access_token', data.data.access_token);
        localStorage.setItem('refresh_token', data.data.refresh_token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
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
        localStorage.setItem('access_token', data.data.access_token);
        localStorage.setItem('refresh_token', data.data.refresh_token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
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

      return await response.json();
    } catch (error) {
      console.error('AuthService: Refresh token error:', error);
      throw error;
    }
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${this.API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      // Clear local storage regardless of response
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('AuthService: Logout error:', error);
      // Still clear local storage even if API call fails
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      throw error;
    }
  }

  async getProfile(): Promise<any> {
    try {
      const token = localStorage.getItem('access_token');
      
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
      const token = localStorage.getItem('access_token');
      
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
    const token = localStorage.getItem('access_token');
    return !!token;
  }

  getUser(): any {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('AuthService: Error parsing user data:', error);
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  clearAuth(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  /**
   * Get user roles from stored token or API
   */
  async getUserRole(): Promise<string | null> {
    try {
      // First try to get from stored user data
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        
        // Check for roles array first
        if (userData.roles && userData.roles.length > 0) {
          return userData.roles[0]; // Return primary role
        }
        
        // Fallback to user_type field
        if (userData.user_type) {
          return userData.user_type;
        }
      }

      // If not found, try to fetch from API
      try {
        const response = await this.getUserRoles();
        if (response.success && response.data?.roles && response.data.roles.length > 0) {
          return response.data.roles[0];
        }
      } catch (apiError) {
        console.warn('Could not fetch roles from API, using fallback logic');
      }

      // Final fallback - try to get from current user object
      const currentUser = this.getUser();
      if (currentUser?.user_type) {
        return currentUser.user_type;
      }

      return null;
    } catch (error) {
      console.error('Error getting user role:', error);
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
  async updateUserRoles(primaryRole: string, secondaryRoles: string[] = []): Promise<any> {
    try {
      const token = localStorage.getItem('access_token');
      
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
          secondary_roles: secondaryRoles
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
        localStorage.setItem('access_token', data.data.access_token);
        localStorage.setItem('refresh_token', data.data.refresh_token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
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
