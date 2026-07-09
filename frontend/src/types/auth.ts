// Emirati Human Development Platform - Core Auth Types

export type Permission =
  // User Management
  | 'manage_users'
  | 'manage_roles'
  | 'impersonate_users'
  | 'view_all_users'
  
  // Content & Jobs
  | 'post_jobs'
  | 'edit_jobs'
  | 'delete_jobs'
  | 'view_all_jobs'
  
  // Candidates
  | 'view_candidates'
  | 'manage_candidates'
  | 'screen_candidates'
  | 'bulk_import_candidates'
  | 'onboard_candidates'
  | 'manage_candidate_engagement'
  
  // Education & Training
  | 'manage_institutions'
  | 'manage_programs'
  | 'manage_training'
  | 'manage_certifications'
  | 'onboard_education'
  | 'manage_education_partnerships'
  
  // Analytics & System
  | 'view_analytics'
  | 'view_all_analytics'
  | 'generate_reports'
  | 'system_settings'
  | 'manage_all'
  | 'manage_positions'
  | 'manage_nafis_sync'
  | 'view_operations_center'
  
  // Profile & Basic Access
  | 'view_jobs'
  | 'apply_jobs'
  | 'manage_profile'
  | 'upload_cv'
  
  // Mentorship & Assessment
  | 'onboard_mentors'
  | 'manage_mentorship_programs'
  | 'onboard_assessment'
  | 'manage_assessment_centers'
  
  // Community & Company
  | 'moderate_communities'
  | 'manage_community_events'
  | 'manage_content'
  | 'onboard_companies'
  | 'manage_company_engagement';

export type GrowthOperatorDomain = 
  | 'candidate' 
  | 'company' 
  | 'education' 
  | 'assessment' 
  | 'mentorship' 
  | 'community';

export type UserRole =
  | 'candidate'
  | 'employer_admin'
  | 'recruiter'
  | 'training_provider'
  | 'parent'
  | 'admin'
  | 'talent_operator'
  | 'employer_relations'
  | 'education_operator'
  | 'assessment_operator'
  | 'mentorship_operator'
  | 'community_operator'
  | 'platform_operator'
  | 'compliance_auditor'
  | 'board_member'
  | 'professional_dev_operator'
  | 'career_services_operator'
  | 'advisor'
  | 'coach'
  | 'internship_coordinator'
  | 'call_center_agent'
  | 'mentor'
  | 'assessor';

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  'candidate': 'Candidate',
  'employer_admin': 'Employer',
  'recruiter': 'Recruiter',
  'training_provider': 'Training Center Representative',
  'parent': 'Parent',
  'admin': 'Administrator',
  'talent_operator': 'Nafis Talent Operator',
  'employer_relations': 'Employer Relations',
  'education_operator': 'Education Operator',
  'assessment_operator': 'Assessment Operator',
  'mentorship_operator': 'Mentorship Operator',
  'community_operator': 'Community & Engagement Operator',
  'platform_operator': 'Platform Operations Officer',
  'compliance_auditor': 'Compliance Auditor',
  'board_member': 'EHDC Board Member',
  'professional_dev_operator': 'Professional Development Operator',
  'career_services_operator': 'Career Services Operator',
  'advisor': 'Academic Advisor',
  'coach': 'Career Coach',
  'internship_coordinator': 'Internship Coordinator',
  'call_center_agent': 'Call Center Agent',
  'mentor': 'Mentor',
  'assessor': 'Assessor'
};

export const ROLE_DASHBOARD_MAP: Record<UserRole, string> = {
  'candidate': '/candidate-dashboard',
  'employer_admin': '/hr-dashboard',
  'recruiter': '/recruiter',
  'training_provider': '/educator-dashboard',
  'parent': '/guardian-dashboard',
  'admin': '/admin-dashboard',
  'talent_operator': '/nafis-talent-dashboard',
  'employer_relations': '/growth-operator-dashboard',
  'education_operator': '/education-operator-dashboard',
  'assessment_operator': '/assessment-operator-dashboard',
  'mentorship_operator': '/mentorship-operator-dashboard',
  'community_operator': '/community-operator-dashboard',
  'platform_operator': '/operations-center',
  'compliance_auditor': '/demographics',
  'board_member': '/executive',
  'professional_dev_operator': '/professional-dev-dashboard',
  'career_services_operator': '/career-services-dashboard',
  'advisor': '/advisor-dashboard',
  'coach': '/coach-dashboard',
  'internship_coordinator': '/internship-coordinator-dashboard',
  'call_center_agent': '/call-center-dashboard',
  'mentor': '/mentor-dashboard',
  'assessor': '/assessor-dashboard'
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

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  'candidate': ['view_jobs', 'apply_jobs', 'manage_profile', 'upload_cv'],
  'employer_admin': ['manage_candidates', 'view_analytics', 'post_jobs', 'manage_positions'],
  'recruiter': ['manage_candidates', 'post_jobs', 'screen_candidates'],
  'training_provider': ['view_analytics', 'manage_profile'],
  'parent': ['view_jobs', 'manage_profile'],
  'admin': ['manage_users', 'system_settings', 'view_all_analytics', 'manage_all'],
  'talent_operator': ['bulk_import_candidates', 'manage_nafis_sync', 'onboard_candidates', 'manage_candidate_engagement', 'view_analytics'],
  'employer_relations': ['onboard_companies', 'manage_company_engagement', 'view_analytics'],
  'education_operator': ['manage_institutions', 'manage_programs', 'onboard_education', 'manage_education_partnerships', 'view_analytics'],
  'assessment_operator': ['onboard_assessment', 'manage_assessment_centers', 'view_analytics'],
  'mentorship_operator': ['onboard_mentors', 'manage_mentorship_programs', 'view_analytics'],
  'community_operator': ['manage_content', 'moderate_communities', 'manage_community_events', 'view_analytics'],
  'platform_operator': ['view_all_analytics', 'view_operations_center', 'view_analytics', 'generate_reports'],
  'compliance_auditor': ['view_all_analytics', 'view_analytics', 'generate_reports'],
  'board_member': ['view_all_analytics', 'view_analytics', 'generate_reports'],
  'professional_dev_operator': ['manage_training', 'manage_certifications', 'onboard_mentors', 'onboard_assessment', 'manage_mentorship_programs', 'manage_assessment_centers', 'view_analytics'],
  'career_services_operator': ['view_analytics'],
  'advisor': ['view_analytics', 'manage_profile'],
  'coach': ['view_analytics', 'manage_profile'],
  'internship_coordinator': ['view_analytics', 'manage_profile'],
  'call_center_agent': ['view_analytics', 'manage_profile'],
  'mentor': ['view_analytics', 'manage_profile'],
  'assessor': ['view_analytics', 'manage_profile']
};

export const normalizeRole = (role: string): UserRole | string => {
  if (!role) return '';
  const lowerRole = role.toLowerCase().trim();
  
  // Map aliases to standard internal role IDs
  if (['admin', 'administrator', 'super_admin', 'platform_administrator', 'system_administrator'].includes(lowerRole)) {
    return 'admin';
  }
  if (['candidate', 'job seeker', 'job_seeker', 'jobseeker'].includes(lowerRole)) {
    return 'candidate';
  }
  if (['employer_admin', 'hr manager', 'hr_manager'].includes(lowerRole)) {
    return 'employer_admin';
  }
  if (['recruiter', 'hr recruiter', 'hr_recruiter', 'hr/recruiter'].includes(lowerRole)) {
    return 'recruiter';
  }
  if (['training_provider', 'training_center', 'training provider'].includes(lowerRole)) {
    return 'training_provider';
  }
  
  return lowerRole.replace(/\s+/g, '_');
};

export const getDashboardRoute = (role: UserRole | string): string => {
  const normalizedRole = normalizeRole(role) as UserRole;
  return ROLE_DASHBOARD_MAP[normalizedRole] || '/candidate-dashboard';
};

export const getRoleDisplayName = (role: UserRole | string): string => {
  const normalizedRole = normalizeRole(role) as UserRole;
  if (ROLE_DISPLAY_NAMES[normalizedRole]) {
    return ROLE_DISPLAY_NAMES[normalizedRole];
  }
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
  return role.toString().startsWith('growth_operator') || role.toString().endsWith('_operator');
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
