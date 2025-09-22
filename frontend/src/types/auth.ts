// User Role Types
export type UserRole = 
  | 'job_seeker'
  | 'candidate' 
  | 'hr_manager'
  | 'hr'
  | 'recruiter'
  | 'administrator'
  | 'admin';

// User Status Types
export type UserStatus = 
  | 'active'
  | 'inactive'
  | 'pending'
  | 'suspended';

// Permission Types
export type Permission = 
  | 'view_jobs'
  | 'apply_jobs'
  | 'manage_profile'
  | 'upload_cv'
  | 'manage_candidates'
  | 'view_analytics'
  | 'manage_positions'
  | 'generate_reports'
  | 'post_jobs'
  | 'screen_candidates'
  | 'manage_users'
  | 'system_settings'
  | 'view_all_analytics'
  | 'manage_all';

// Authentication Types
export interface AuthUser {
  id: string | number;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  emirate?: string;
  user_type?: UserRole;
  role?: UserRole;
  roles?: UserRole[];
  status?: UserStatus;
  created_at?: string;
  updated_at?: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  user_metadata?: {
    full_name?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    user_type?: UserRole;
    roles?: UserRole[];
  };
}

// Login/Register Types
export interface LoginCredentials {
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
  user_type: UserRole;
}

// API Response Types
export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    access_token: string;
    refresh_token: string;
    user: AuthUser;
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

// Role Mapping for Dashboard Routes
export const ROLE_DASHBOARD_MAP: Record<UserRole, string> = {
  'job_seeker': '/candidate-dashboard',
  'candidate': '/candidate-dashboard',
  'hr_manager': '/hr-dashboard',
  'hr': '/hr-dashboard',
  'recruiter': '/recruiter-dashboard',
  'administrator': '/admin-dashboard',
  'admin': '/admin-dashboard',
};

// Role Display Names
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  'job_seeker': 'Job Seeker',
  'candidate': 'Candidate',
  'hr_manager': 'HR Manager',
  'hr': 'HR Manager',
  'recruiter': 'Recruiter',
  'administrator': 'Administrator',
  'admin': 'Administrator',
};

// Role Permissions - Fixed typing
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  'job_seeker': ['view_jobs', 'apply_jobs', 'manage_profile', 'upload_cv'],
  'candidate': ['view_jobs', 'apply_jobs', 'manage_profile', 'upload_cv'],
  'hr_manager': ['manage_candidates', 'view_analytics', 'manage_positions', 'generate_reports'],
  'hr': ['manage_candidates', 'view_analytics', 'manage_positions', 'generate_reports'],
  'recruiter': ['manage_candidates', 'post_jobs', 'screen_candidates'],
  'administrator': ['manage_users', 'system_settings', 'view_all_analytics', 'manage_all'],
  'admin': ['manage_users', 'system_settings', 'view_all_analytics', 'manage_all'],
};

// Helper Functions
export const getDashboardRoute = (role: UserRole | string): string => {
  const normalizedRole = role.toLowerCase() as UserRole;
  return ROLE_DASHBOARD_MAP[normalizedRole] || '/candidate-dashboard';
};

export const getRoleDisplayName = (role: UserRole | string): string => {
  const normalizedRole = role.toLowerCase() as UserRole;
  return ROLE_DISPLAY_NAMES[normalizedRole] || 'User';
};

export const hasPermission = (userRole: UserRole | string, permission: Permission): boolean => {
  const normalizedRole = userRole.toLowerCase() as UserRole;
  const permissions = ROLE_PERMISSIONS[normalizedRole] || [];
  return permissions.includes(permission);
};

export const isValidRole = (role: string): role is UserRole => {
  return Object.keys(ROLE_DASHBOARD_MAP).includes(role.toLowerCase());
};

// UAE Emirates
export const UAE_EMIRATES = [
  'Abu Dhabi',
  'Dubai',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah'
] as const;

export type UAEEmirate = typeof UAE_EMIRATES[number];
