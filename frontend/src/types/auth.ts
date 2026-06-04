// User Role Types
export type UserRole =
  | 'job_seeker'
  | 'candidate'
  | 'student'
  | 'hr_manager'
  | 'hr'
  | 'recruiter'
  | 'hr_recruiter' // Specific HR Recruiter Role
  | 'educator'
  | 'guardian'
  | 'parent'
  | 'administrator'
  | 'admin'
  // Growth Operator Roles (Domain-Specific)
  | 'growth_operator'
  | 'growth_operator_candidate'
  | 'growth_operator_company'
  | 'growth_operator_education'
  | 'growth_operator_assessment'
  | 'growth_operator_mentorship'
  | 'growth_operator_community'
  | 'growth_operator_monitoring'
  // Specialized Operator Roles
  | 'nafis_talent_operator'
  | 'education_operator'
  | 'professional_dev_operator'
  | 'community_operator'
  | 'operations_monitor'
  | 'operator' // Alias for growth_operator (DB value)
  // Persona Dashboard Roles
  | 'employer'
  | 'government'
  | 'mentor'
  | 'assessor'
  | 'board_member'
  | 'operations_officer'
  // Phase 2-4 New Roles
  | 'advisor'
  | 'coach'
  | 'internship_coordinator'
  | 'training_center_rep'
  | 'call_center_agent'
  | 'retiree';

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
  | 'manage_community_events'
  // Specialized Operator Permissions
  | 'bulk_import_candidates'
  | 'manage_nafis_sync'
  | 'manage_institutions'
  | 'manage_programs'
  | 'manage_training'
  | 'manage_certifications'
  | 'manage_content'
  | 'view_operations_center';

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
  phone: string;
}

export interface RegisterData {
  email: string;
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
  'student': '/student-dashboard',
  'hr_manager': '/hr-dashboard',
  'hr': '/hr-dashboard',
  'recruiter': '/recruiter',
  'hr_recruiter': '/recruiter', // Alias for hr/recruiter role
  'educator': '/educator-dashboard',
  'guardian': '/guardian-dashboard',
  'parent': '/guardian-dashboard',
  'administrator': '/admin-dashboard',
  'admin': '/admin-dashboard',
  // Growth Operator Routes
  'growth_operator': '/growth-operator-dashboard',
  'growth_operator_candidate': '/nafis-talent-dashboard',
  'growth_operator_company': '/growth-operator-dashboard',
  'growth_operator_education': '/education-operator-dashboard',
  'growth_operator_assessment': '/assessment-operator-dashboard',
  'growth_operator_mentorship': '/mentorship-operator-dashboard',
  'growth_operator_community': '/community-operator-dashboard',
  'growth_operator_monitoring': '/operations-center',
  // Specialized Operator Routes
  'nafis_talent_operator': '/nafis-talent-dashboard',
  'education_operator': '/education-operator-dashboard',
  'professional_dev_operator': '/professional-dev-dashboard',
  'community_operator': '/community-operator-dashboard',
  'operations_monitor': '/operations-center',
  'operator': '/growth-operator-dashboard', // DB alias for growth_operator
  // Persona Dashboard Routes
  'employer': '/hr-dashboard', // Consolidated into HR Manager
  'government': '/operations-center',
  'board_member': '/board-portal',
  'operations_officer': '/operations-center',
  'mentor': '/mentor-dashboard',
  'assessor': '/assessor-dashboard',
  // Phase 2-4 New Role Routes
  'advisor': '/advisor-dashboard',
  'coach': '/coach-dashboard',
  'internship_coordinator': '/internship-coordinator-dashboard',
  'training_center_rep': '/training-center-dashboard',
  'call_center_agent': '/call-center-dashboard',
  'retiree': '/candidate-dashboard',
};

// Role Display Names
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  'job_seeker': 'Job Seeker',
  'candidate': 'Candidate',
  'student': 'Student',
  'hr_manager': 'HR Manager',
  'hr': 'HR Manager',
  'recruiter': 'Recruiter',
  'hr_recruiter': 'HR / Recruiter',
  'educator': 'Educator',
  'guardian': 'Guardian / Parent',
  'parent': 'Parent',
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
  'growth_operator_monitoring': 'Growth Operator Monitoring',
  // Specialized Operator Display Names
  'nafis_talent_operator': 'Nafis Talent Operator',
  'education_operator': 'Education Operator',
  'professional_dev_operator': 'Professional Development Operator',
  'community_operator': 'Community & Engagement Operator',
  'operations_monitor': 'Operations Monitoring Center',
  'operator': 'Growth Operator', // DB alias
  // Persona Display Names
  'employer': 'Employer',
  'government': 'Government Official',
  'board_member': 'EHDC Board Member',
  'operations_officer': 'Platform Operations Officer',
  'mentor': 'Mentor',
  'assessor': 'Assessor',
  // Phase 2-4 Display Names
  'advisor': 'Academic Advisor',
  'coach': 'Career Coach',
  'internship_coordinator': 'Internship Coordinator',
  'training_center_rep': 'Training Center Representative',
  'call_center_agent': 'Call Center Agent',
  'retiree': 'Retiree',
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
  'student': ['view_jobs', 'apply_jobs', 'manage_profile'],
  'hr_manager': ['manage_candidates', 'view_analytics', 'manage_positions', 'generate_reports'],
  'hr': ['manage_candidates', 'view_analytics', 'manage_positions', 'generate_reports'],
  'recruiter': ['manage_candidates', 'post_jobs', 'screen_candidates'],
  'hr_recruiter': ['manage_candidates', 'post_jobs', 'screen_candidates'],
  'educator': ['manage_profile'],
  'guardian': ['view_jobs', 'manage_profile'],
  'parent': ['view_jobs', 'manage_profile'],
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
  'growth_operator_monitoring': ['view_operations_center', 'view_all_analytics', 'view_analytics'],
  // Specialized Operator Permissions
  'nafis_talent_operator': ['bulk_import_candidates', 'manage_nafis_sync', 'onboard_candidates', 'manage_candidate_engagement', 'view_analytics'],
  'education_operator': ['manage_institutions', 'manage_programs', 'onboard_education', 'manage_education_partnerships', 'view_analytics'],
  'professional_dev_operator': ['manage_training', 'manage_certifications', 'onboard_mentors', 'onboard_assessment', 'manage_mentorship_programs', 'manage_assessment_centers', 'view_analytics'],
  'community_operator': ['manage_content', 'moderate_communities', 'manage_community_events', 'view_analytics'],
  'operations_monitor': ['view_operations_center', 'view_all_analytics', 'view_analytics'],
  'operator': ['view_analytics'], // DB alias for growth_operator
  // Persona Permissions
  'employer': ['manage_candidates', 'view_analytics', 'post_jobs', 'manage_positions'],
  'government': ['view_all_analytics', 'view_analytics', 'generate_reports'],
  'board_member': ['view_all_analytics', 'view_analytics', 'generate_reports'],
  'operations_officer': ['view_all_analytics', 'view_operations_center', 'view_analytics', 'generate_reports'],
  'mentor': ['view_analytics', 'manage_profile'],
  'assessor': ['view_analytics', 'manage_profile'],
  // Phase 2-4 Permissions
  'advisor': ['view_analytics', 'manage_profile'],
  'coach': ['view_analytics', 'manage_profile'],
  'internship_coordinator': ['view_analytics', 'manage_profile'],
  'training_center_rep': ['view_analytics', 'manage_profile'],
  'call_center_agent': ['view_analytics', 'manage_profile'],
  'retiree': ['view_jobs', 'apply_jobs', 'manage_profile', 'upload_cv'],
};

export const normalizeRole = (role: string): UserRole | string => {
  if (!role) return '';
  // Handle specific edge cases first
  const lowerRole = role.toLowerCase().trim();
  if (lowerRole === 'hr') return 'hr_manager';

  // General normalization: replace spaces with underscores
  // e.g. "HR Manager" -> "hr_manager", "Job Seeker" -> "job_seeker"
  return lowerRole.replace(/\s+/g, '_');
};

export const getDashboardRoute = (role: UserRole | string): string => {
  const normalizedRole = normalizeRole(role) as UserRole;
  return ROLE_DASHBOARD_MAP[normalizedRole] || '/candidate-dashboard';
};

export const getRoleDisplayName = (role: UserRole | string): string => {
  // Try direct lookup first
  const normalizedRole = normalizeRole(role) as UserRole;
  if (ROLE_DISPLAY_NAMES[normalizedRole]) {
    return ROLE_DISPLAY_NAMES[normalizedRole];
  }

  // Fallback to title casing the snake_case or spaced string
  return role
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
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
  return role.toString().startsWith('growth_operator') || role.toString() === 'operator';
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
