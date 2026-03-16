/**
 * Mock Authentication Service for Development
 * Provides realistic Mobile OTP flow for testing
 */
import { clearAuthTokens } from '@/utils/tokenUtils';

export interface MockUser {
  id: string;
  email?: string;
  first_name: string;
  last_name: string;
  full_name: string;
  user_type: string;
  role: string;
  phone: string;
  emirate: string;
  nationality: string;
  is_verified: boolean;
  profile_data: any;
  avatar?: string;
}

// Pre-defined users for testing
export const TEST_USERS: Record<string, MockUser> = {
  '+971501234567': {
    id: '1',
    email: 'khalid.almazrouei@email.ae',
    first_name: 'Khalid',
    last_name: 'Al Mazrouei',
    full_name: 'Khalid Al Mazrouei',
    user_type: 'candidate',
    role: 'candidate',
    phone: '+971501234567',
    emirate: 'Dubai',
    nationality: 'UAE',
    is_verified: true,
    profile_data: {
      bio: 'Aspiring professional seeking opportunities in the technology sector',
      skills: ['Project Management', 'Communication', 'Data Analysis'],
      location: 'Dubai, UAE'
    },
    avatar: 'KAM'
  },
  '+971502345678': {
    id: '2',
    email: 'zara.saeed@company.ae',
    first_name: 'Zara',
    last_name: 'Saeed',
    full_name: 'Zara Saeed',
    user_type: 'hr_manager',
    role: 'hr_manager',
    phone: '+971502345678',
    emirate: 'Abu Dhabi',
    nationality: 'UAE',
    is_verified: true,
    profile_data: {
      company: 'Emirates Tech Solutions',
      department: 'Human Resources'
    },
    avatar: 'ZSA'
  },
  '+971503456789': {
    id: '3',
    email: 'omar.alrashid@recruitment.ae',
    first_name: 'Omar',
    last_name: 'Al Rashid',
    full_name: 'Omar Al Rashid',
    user_type: 'hr_recruiter', // Updated to match backend
    role: 'hr_recruiter', // Updated to match backend
    phone: '+971503456789',
    emirate: 'Sharjah',
    nationality: 'UAE',
    is_verified: true,
    profile_data: {
      company: 'UAE Talent Solutions'
    },
    avatar: 'OAR'
  },
  '+971507890123': {
    id: '7',
    email: 'admin@emiratijourney.ae',
    first_name: 'System',
    last_name: 'Administrator',
    full_name: 'System Administrator',
    user_type: 'admin',
    role: 'admin',
    phone: '+971507890123',
    emirate: 'Dubai',
    nationality: 'UAE',
    is_verified: true,
    profile_data: {
      permissions: ['Full Access']
    },
    avatar: 'ADM'
  },
  '+971509998888': {
    id: '8',
    email: 'ops@emiratijourney.ae',
    first_name: 'Growth',
    last_name: 'Operator',
    full_name: 'Growth Operator',
    user_type: 'operator',
    role: 'operator',
    phone: '+971509998888',
    emirate: 'Dubai',
    nationality: 'UAE',
    is_verified: true,
    profile_data: {
      permissions: ['Growth Operations', 'Verify Companies']
    },
    avatar: 'OPS'
  }
};

// Legacy support: Export MOCK_USERS as alias
export const MOCK_USERS = TEST_USERS;

export class MockAuthService {
  private static currentUser: MockUser | null = null;
  private static readonly STORAGE_KEY = 'mock_current_user';
  private static readonly USERS_STORAGE_KEY = 'mock_registered_users';

  // Debug: Universal Dev OTP
  static readonly DEV_OTP = '123456';

  static initialize() {
    // Load saved user from localStorage
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved);
      } catch (error) {
        console.warn('Failed to load saved mock user:', error);
      }
    }
  }

  /**
   * Compatibility method for MockAuthContext and Dev Tools
   * Allows switching persona by role name (e.g. 'candidate', 'recruiter')
   */
  static setUser(userType: string): MockUser {
    // Find a user with the matching user_type or role in TEST_USERS
    const user = Object.values(TEST_USERS).find(u =>
      u.user_type === userType || u.role === userType
    );

    if (!user) {
      console.warn(`Mock user type "${userType}" not found in TEST_USERS`);
      // Fallback to first user or throw
      const fallback = Object.values(TEST_USERS)[0];
      this.loginUser(fallback);
      return fallback;
    }

    this.loginUser(user);
    console.log(`🎭 Mock Auth: Switched to ${user.full_name} (${user.user_type})`);
    return user;
  }

  // Simulate sending OTP
  static async sendOTP(phone: string): Promise<boolean> {
    console.log(`📱 Mock SMS Sent to ${phone}: Use code ${this.DEV_OTP}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  }

  // Verify OTP and Login/Signup
  static async verifyOTP(phone: string, code: string): Promise<{ success: boolean; user?: MockUser; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 800));

    // Robust checking: trim whitespace
    const cleanCode = code.trim();

    // Debug logging
    console.log(`🔐 Verifying OTP: Received '${code}' (cleaned: '${cleanCode}'), Expected '${this.DEV_OTP}'`);

    if (cleanCode !== this.DEV_OTP) {
      return { success: false, error: 'Invalid verification code. Please enter 123456.' };
    }

    // Clean phone number (remove all spaces)
    const cleanPhone = phone.replace(/\s/g, '');

    // Check pre-defined users first
    let user = TEST_USERS[cleanPhone];

    // If not found, check local storage for registered users
    if (!user) {
      const registeredUsers = this.getRegisteredUsers();
      user = registeredUsers[cleanPhone];
    }

    // If still not found, it's a new user -> Sign them up automatically as Candidate
    if (!user) {
      console.log(`🆕 New user detected for phone ${cleanPhone}, creating candidate account...`);
      user = this.registerNewUser(cleanPhone);
    }

    // Perform Login
    await this.loginUser(user);
    return { success: true, user };
  }

  private static getRegisteredUsers(): Record<string, MockUser> {
    try {
      const stored = localStorage.getItem(this.USERS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  private static registerNewUser(phone: string): MockUser {
    const newUser: MockUser = {
      id: `new_${Date.now()}`,
      phone: phone,
      first_name: 'New',
      last_name: 'User',
      full_name: 'New User',
      user_type: 'candidate', // Default to candidate
      role: 'candidate',
      emirate: 'Dubai',
      nationality: 'UAE',
      is_verified: true,
      profile_data: {},
      avatar: 'NU'
    };

    // Save to local storage
    const users = this.getRegisteredUsers();
    users[phone] = newUser;
    localStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify(users));

    return newUser;
  }

  private static async loginUser(user: MockUser) {
    this.currentUser = user;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));

    // Try to get a REAL token from the backend using dev-login (guaranteed token)
    try {
      console.log('🔄 Attempting to fetch REAL backend token via dev-login...');
      // Use relative path to leverage Vite Proxy (or API_BASE_URL logic if moved to api.ts)
      // This ensures it works on Ngrok/Mobile too
      const response = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          role: user.role,
          email: user.email
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.access_token) {
          console.log('✅ Real Backend Token acquired!');
          localStorage.setItem('access_token', data.data.access_token);
          // Also set legacy keys just in case
          localStorage.setItem('accessToken', data.data.access_token);
          localStorage.setItem('auth_token', data.data.access_token);
          return;
        }
      } else {
        console.warn('⚠️ Backend dev-login failed, falling back to mock token');
      }
    } catch (error) {
      console.error('⚠️ Could not connect to backend for token:', error);
    }

    // Fallback if backend is down or auth fails
    localStorage.setItem('access_token', `mock_token_${user.id}`);
    localStorage.setItem('user', JSON.stringify(user));
    console.log(`✅ Logged in as ${user.full_name} (Mock Token)`);
  }

  static logout() {
    this.currentUser = null;
    localStorage.removeItem(this.STORAGE_KEY);
    clearAuthTokens();
    localStorage.removeItem('user');
  }

  static getCurrentUser(): MockUser | null {
    // Always read from localStorage to ensure we have the latest user data
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved);
      } catch (error) {
        console.warn('Failed to parse saved mock user:', error);
      }
    }
    return this.currentUser;
  }

  static isAuthenticated(): boolean {
    // Check localStorage for user data
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved);
        return true;
      } catch (error) {
        return false;
      }
    }
    return this.currentUser !== null;
  }

  static getDashboardRoute(userType?: string): string {
    const type = userType || this.currentUser?.user_type;

    switch (type) {
      case 'candidate':
      case 'job_seeker':
        return '/candidate-dashboard';
      case 'hr_manager':
      case 'hr':
        return '/hr-dashboard';
      case 'recruiter':
      case 'hr_recruiter':
        return '/recruiter-dashboard';
      case 'educator':
        return '/educator-dashboard';
      case 'mentor':
        return '/mentor-dashboard';
      case 'assessor':
        return '/assessor-dashboard';
      case 'operator':
        return '/operator-dashboard';
      case 'admin':
      case 'administrator':
        return '/admin-dashboard';
      default:
        return '/candidate-dashboard';
    }
  }
}

// Initialize on import
MockAuthService.initialize();

