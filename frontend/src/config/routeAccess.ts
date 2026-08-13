/**
 * Route → allowed roles. ONE source of truth for who may open what.
 *
 * WHY THIS EXISTS (#353): the router and the navigation each kept their own
 * hand-maintained role lists, and they disagreed. The navigation offered
 * /demographics to career_services_operator; the route allows only admin,
 * board_member, compliance_auditor and platform_operator. A user clicked a menu
 * item the platform then refused — which, before the access-denied screen, was a
 * silent bounce to the home page and read as a broken button. Five nav items
 * disagreed with their routes; one (/cv-builder) declared nothing at all and was
 * offered to everyone.
 *
 * The values below were EXTRACTED from the allowedRoles declarations in App.tsx,
 * so this map started out identical to what the router already enforced — no
 * access changed when it was introduced. `routeAccess.test.ts` re-parses App.tsx
 * and fails if the two ever drift again.
 *
 * The router remains the ENFORCEMENT point. This map is what lets the navigation
 * agree with it.
 */

export const ROUTE_ROLES: Record<string, readonly string[]> = {
  '/admin-dashboard': ['admin'],
  '/admin/role-requests': ['admin'],
  '/admin/school-programs': ['admin', 'content_manager', 'khda_staff'],
  '/admin/user-roles': ['admin', 'super_admin'],
  '/advisor-dashboard': ['admin', 'advisor'],
  '/applications': ['candidate'],
  '/assessment-operator-dashboard': ['admin', 'assessment_operator', 'growth_operator', 'operator', 'platform_administrator', 'super_admin'],
  '/assessor-dashboard': ['assessor'],
  '/board-meeting/:meetingId': ['admin', 'board_member', 'board_operator', 'platform_operator'],
  '/board-secretary': ['admin', 'board_operator', 'platform_operator'],
  '/call-center-dashboard': ['admin', 'call_center_agent'],
  '/candidate-dashboard': ['candidate'],
  '/candidate-profile/:candidateId': ['admin', 'call_center_agent', 'career_services_operator', 'employer_admin', 'operator', 'recruiter'],
  '/candidate/profile/*': ['candidate', 'employer_admin', 'recruiter'],
  '/career-services-crm': ['admin', 'career_services_operator', 'operator'],
  '/career-services-dashboard': ['admin', 'career_services_operator', 'operator'],
  '/coach-dashboard': ['admin', 'coach'],
  '/community-operator-dashboard': ['admin', 'community_operator', 'growth_operator', 'operator', 'platform_administrator', 'super_admin'],
  '/cv-builder': ['candidate'],
  '/demographics': ['admin', 'board_member', 'compliance_auditor', 'platform_operator'],
  '/education-operator-dashboard': ['admin', 'education_operator', 'growth_operator', 'operator', 'platform_administrator', 'super_admin'],
  '/educator-dashboard': ['training_provider'],
  '/executive': ['admin', 'board_member', 'compliance_auditor', 'platform_operator'],
  '/government-dashboard': ['admin', 'compliance_auditor', 'platform_operator'],
  '/growth-operator-dashboard': ['admin', 'assessment_operator', 'community_operator', 'education_operator', 'employer_relations', 'growth_operator', 'mentorship_operator', 'operator', 'platform_operator', 'talent_operator'],
  '/growth-operator-dashboard/:domain': ['admin', 'assessment_operator', 'community_operator', 'education_operator', 'employer_relations', 'growth_operator', 'mentorship_operator', 'operator', 'platform_operator', 'talent_operator'],
  '/guardian-dashboard': ['parent'],
  '/hr-dashboard': ['employer_admin'],
  '/internship-coordinator-dashboard': ['admin', 'internship_coordinator'],
  '/mentor-dashboard': ['mentor'],
  '/mentorship-operator-dashboard': ['admin', 'growth_operator', 'mentorship_operator', 'operator', 'platform_administrator', 'super_admin'],
  '/nafis-talent-dashboard': ['admin', 'growth_operator', 'operator', 'platform_administrator', 'super_admin', 'talent_operator'],
  '/operations-center': ['admin', 'platform_administrator', 'platform_operator', 'super_admin'],
  '/operations-center/display': ['admin', 'platform_administrator', 'platform_operator', 'super_admin'],
  '/operator-dashboard': ['admin', 'operator'],
  '/professional-dev-dashboard': ['admin', 'growth_operator', 'operator', 'platform_administrator', 'professional_dev_operator', 'super_admin'],
  '/recruiter-dashboard': ['employer_admin', 'recruiter'],
  '/recruiter/*': ['employer_admin', 'recruiter'],
  '/recruiter/jd-builder': ['employer_admin', 'recruiter'],
  '/recruiter/shortlist/:jdId': ['admin', 'employer_admin', 'recruiter'],
  '/service-catalog': ['admin', 'board_member', 'compliance_auditor', 'platform_operator'],
  '/student-dashboard': ['candidate'],
  '/training-center-dashboard': ['admin', 'training_provider'],
  '/workspace/:companyId': ['admin', 'candidate', 'employee', 'employer_admin', 'employer_relations', 'growth_operator', 'recruiter', 'seeker'],
};

/**
 * Roles permitted to open `path`, or null when the route is not gated.
 * Handles the wildcard and parameter forms used in App.tsx
 * (`/recruiter/*`, `/board-meeting/:meetingId`).
 */
export function rolesForPath(path: string): readonly string[] | null {
  if (!path) return null;
  const clean = path.split('?')[0].split('#')[0];
  if (ROUTE_ROLES[clean]) return ROUTE_ROLES[clean];
  for (const [pattern, roles] of Object.entries(ROUTE_ROLES)) {
    if (pattern.endsWith('/*') && clean.startsWith(pattern.slice(0, -2))) return roles;
    if (pattern.includes('/:')) {
      const base = pattern.slice(0, pattern.indexOf('/:'));
      if (clean === base || clean.startsWith(base + '/')) return roles;
    }
  }
  return null;
}

/** True when any of the user's roles may open `path` (ungated paths are open). */
export function canOpenPath(path: string, userRoles: readonly string[]): boolean {
  const required = rolesForPath(path);
  if (!required) return true;
  const mine = new Set(userRoles.map(r => String(r).toLowerCase()));
  return required.some(r => mine.has(r));
}
