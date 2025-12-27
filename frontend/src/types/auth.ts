// User Role Types
export type UserRole = 
  | 'job_seeker'
  | 'candidate' 
  | 'hr_manager'
  | 'hr'
  | 'recruiter'
  | 'administrator'
  | 'admin'
  // Growth Operator Roles (Domain-Specific)
  | 'growth_operator'
  | 'growth_operator_candidate'
  | 'growth_operator_company'
  | 'growth_operator_education'
  | 'growth_operator_assessment'
  | 'growth_operator_mentorship'
  | 'growth_operator_community';

// Growth Operator Domain Types
export type GrowthOperatorDomain = 
  | 'candidate'
  | 'company'
  | 'education'
  | 'assessment'
  | 'mentorship'
  | 'community';

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
  | 'manage_all'
  // Growth Operator Permissions
  | 'onboard_candidates'
  | 'manage_candidate_engagement'
  | 'onboard_companies'
  | 'manage_company_engagement'
  | 'onboard_education'
  | 'manage_education_partnerships'
  | 'onboard_assessment'
  | 'manage_assessment_centers'
  | 'onboard_mentors'
  | 'manage_mentorship_programs'
  | 'moderate_communities'
  | 'manage_community_events';

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
  growth_operator_domains?: GrowthOperatorDomain[];
  user_metadata?: {
    full_name?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    user_type?: UserRole;
    roles?: UserRole[];
    growth_operator_domains?: GrowthOperatorDomain[];
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
  // Growth Operator Routes
  'growth_operator': '/growth-operator-dashboard',
  'growth_operator_candidate': '/growth-operator-dashboard/candidates',
  'growth_operator_company': '/growth-operator-dashboard/companies',
  'growth_operator_education': '/growth-operator-dashboard/education',
  'growth_operator_assessment': '/growth-operator-dashboard/assessment',
  'growth_operator_mentorship': '/growth-operator-dashboard/mentorship',
  'growth_operator_community': '/growth-operator-dashboard/community',
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
  // Growth Operator Display Names
  'growth_operator': 'Growth Operator',
  'growth_operator_candidate': 'Candidate Growth Operator',
  'growth_operator_company': 'Company Growth Operator',
  'growth_operator_education': 'Education Growth Operator',
  'growth_operator_assessment': 'Assessment Growth Operator',
  'growth_operator_mentorship': 'Mentorship Growth Operator',
  'growth_operator_community': 'Community Growth Operator',
};

// Growth Operator Domain Configuration
export const GROWTH_OPERATOR_DOMAINS: Record<GrowthOperatorDomain, {
  label: string;
  description: string;
  icon: string;
  permissions: Permission[];
}> = {
  'candidate': {
    label: 'Candidate Operations',
    description: 'Manage candidate acquisition, engagement, and profile quality',
    icon: 'Users',
    permissions: ['onboard_candidates', 'manage_candidate_engagement', 'view_analytics']
  },
  'company': {
    label: 'Company Operations',
    description: 'Onboard companies and manage employer engagement',
    icon: 'Building',
    permissions: ['onboard_companies', 'manage_company_engagement', 'view_analytics']
  },
  'education': {
    label: 'Education Operations',
    description: 'Partner with schools, universities, and training institutes',
    icon: 'GraduationCap',
    permissions: ['onboard_education', 'manage_education_partnerships', 'view_analytics']
  },
  'assessment': {
    label: 'Assessment Operations',
    description: 'Manage assessment centers and certification bodies',
    icon: 'ClipboardCheck',
    permissions: ['onboard_assessment', 'manage_assessment_centers', 'view_analytics']
  },
  'mentorship': {
    label: 'Mentorship Operations',
    description: 'Onboard mentors and manage coaching programs',
    icon: 'UserCheck',
    permissions: ['onboard_mentors', 'manage_mentorship_programs', 'view_analytics']
  },
  'community': {
    label: 'Community Operations',
    description: 'Moderate communities and manage events',
    icon: 'MessageCircle',
    permissions: ['moderate_communities', 'manage_community_events', 'view_analytics']
  }
};

// Role Permissions
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  'job_seeker': ['view_jobs', 'apply_jobs', 'manage_profile', 'upload_cv'],
  'candidate': ['view_jobs', 'apply_jobs', 'manage_profile', 'upload_cv'],
  'hr_manager': ['manage_candidates', 'view_analytics', 'manage_positions', 'generate_reports'],
  'hr': ['manage_candidates', 'view_analytics', 'manage_positions', 'generate_reports'],
  'recruiter': ['manage_candidates', 'post_jobs', 'screen_candidates'],
  'administrator': ['manage_users', 'system_settings', 'view_all_analytics', 'manage_all'],
  'admin': ['manage_users', 'system_settings', 'view_all_analytics', 'manage_all'],
  // Growth Operator Permissions
  'growth_operator': ['view_analytics'],
  'growth_operator_candidate': ['onboard_candidates', 'manage_candidate_engagement', 'view_analytics'],
  'growth_operator_company': ['onboard_companies', 'manage_company_engagement', 'view_analytics'],
  'growth_operator_education': ['onboard_education', 'manage_education_partnerships', 'view_analytics'],
  'growth_operator_assessment': ['onboard_assessment', 'manage_assessment_centers', 'view_analytics'],
  'growth_operator_mentorship': ['onboard_mentors', 'manage_mentorship_programs', 'view_analytics'],
  'growth_operator_community': ['moderate_communities', 'manage_community_events', 'view_analytics'],
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

export const isGrowthOperatorRole = (role: UserRole | string): boolean => {
  return role.toString().startsWith('growth_operator');
};

export const getGrowthOperatorDomain = (role: UserRole | string): GrowthOperatorDomain | null => {
  const roleStr = role.toString();
  if (!roleStr.startsWith('growth_operator_')) return null;
  return roleStr.replace('growth_operator_', '') as GrowthOperatorDomain;
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
