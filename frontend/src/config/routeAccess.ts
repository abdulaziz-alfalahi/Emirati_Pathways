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

// NOT LISTED: /board-meeting/:meetingId.
//
// Who may join a board meeting is decided per MEETING, from the attendee list,
// by POST /api/board/meetings/<id>/join — not by role. A role gate here refused
// invited guests at the door: the subject expert brought in for one agenda item
// is not a board member, which made additional attendees (PR #469) and the
// waiting room (PR #471) unreachable by the people they exist for (PRs #472,
// #474). Opening the page is not the same as getting in; anyone not on the list
// still gets "Unable to join" from the API.
/**
 * A growth operator is assigned to DOMAINS, and each domain grants the role the
 * platform ALREADY HAS for that domain — "company" grants employer_relations,
 * the role the Users tab calls "Company Onboarding Operator".
 *
 * It did not always. Each domain used to grant growth_operator_<domain>, a
 * second name for a job that already had one. The same person then appeared as
 * an operator on one screen, as nothing on another, and with a third label on a
 * third — reported 2026-08-27 as "the role is showing in one place but not the
 * other". Owner's decision the same day: keep talent_operator and
 * employer_relations. The parallel family had one holder across all seven of
 * its names; the roles it duplicated had eleven.
 *
 * Mirrors GROWTH_OPERATOR_DOMAIN_ROLES in backend/auth/access_control.py, which
 * is where the authorisation decision is actually made.
 */
export const GROWTH_OPERATOR_DOMAIN_ROLES: Record<string, string> = {
  candidate: 'talent_operator',
  company: 'employer_relations',
  education: 'education_operator',
  assessment: 'assessment_operator',
  mentorship: 'mentorship_operator',
  community: 'community_operator',
  monitoring: 'platform_operator',
};

export const GROWTH_OPERATOR_DOMAINS = Object.keys(GROWTH_OPERATOR_DOMAIN_ROLES);

/** Retired spellings. Still admitted so nobody is locked out mid-sweep. */
export const LEGACY_GROWTH_OPERATOR_ROLES: readonly string[] =
  GROWTH_OPERATOR_DOMAINS.map(d => `growth_operator_${d}`);

/**
 * Every role that reaches a growth-operator page, retired spellings included.
 * Spread into the route lists below; the established names also appear there
 * by hand, and a duplicate in a membership check costs nothing.
 */
export const GROWTH_OPERATOR_ROLES: readonly string[] = [
  ...new Set([
    ...Object.values(GROWTH_OPERATOR_DOMAIN_ROLES),
    ...LEGACY_GROWTH_OPERATOR_ROLES,
  ]),
];

/** The domain a role covers, or null. Understands the retired spelling too. */
export const domainForRole = (role: string | null | undefined): string | null => {
  const key = (role || '').trim().toLowerCase();
  const direct = Object.entries(GROWTH_OPERATOR_DOMAIN_ROLES)
    .find(([, r]) => r === key);
  if (direct) return direct[0];
  if (key.startsWith('growth_operator_')) {
    const legacy = key.slice('growth_operator_'.length);
    return legacy in GROWTH_OPERATOR_DOMAIN_ROLES ? legacy : null;
  }
  return null;
};

const DECLARED_ROUTE_ROLES: Record<string, readonly string[]> = {
  '/admin-dashboard': ['admin'],
  '/admin/role-requests': ['admin'],
  '/admin/school-programs': ['admin', 'content_manager', 'khda_staff'],
  '/admin/user-roles': ['admin', 'super_admin'],
  '/advisor-dashboard': ['admin', 'advisor'],
  '/applications': ['candidate'],
  '/assessment-operator-dashboard': ['admin', 'assessment_operator', 'growth_operator', 'operator', 'platform_administrator', 'super_admin', ...GROWTH_OPERATOR_ROLES],
  '/assessor-dashboard': ['assessor'],
  '/board-secretary': ['admin', 'board_operator', 'platform_operator'],
  '/call-center-dashboard': ['admin', 'call_center_agent'],
  '/candidate-dashboard': ['candidate'],
  '/candidate-profile/:candidateId': ['admin', 'call_center_agent', 'career_services_operator', 'employer_admin', 'operator', 'recruiter'],
  // '/candidate/profile/*' is deliberately absent: it is the user's OWN
  // profile and is open to any signed-in user (see App.tsx).
  '/career-services-crm': ['admin', 'career_services_operator', 'operator'],
  '/career-services-dashboard': ['admin', 'career_services_operator', 'operator'],
  '/coach-dashboard': ['admin', 'coach'],
  '/community-operator-dashboard': ['admin', 'community_operator', 'growth_operator', 'operator', 'platform_administrator', 'super_admin', ...GROWTH_OPERATOR_ROLES],
  '/cv-builder': ['candidate'],
  '/demographics': ['admin', 'board_member', 'career_services_operator', 'compliance_auditor', 'platform_operator'],
  '/education-operator-dashboard': ['admin', 'education_operator', 'growth_operator', 'operator', 'platform_administrator', 'super_admin', ...GROWTH_OPERATOR_ROLES],
  '/educator-dashboard': ['training_provider'],
  '/events/manage': ['admin', 'call_center_agent', 'career_services_operator', 'operator', 'platform_administrator', 'super_admin'],
  // board_operator is the board SECRETARY. They were admitted to
  // /board-secretary but not here, so the person who prepares the board pack,
  // schedules the meetings and writes the minutes could not see the dashboard
  // the members read (fb_1787129641). ExecutiveDashboard's own canManageBoard
  // already listed board_operator — the page always expected them; the route
  // was the only thing keeping them out.
  '/executive': ['admin', 'board_chairman', 'board_member', 'board_operator', 'compliance_auditor', 'platform_operator'],
  '/government-dashboard': ['admin', 'compliance_auditor', 'platform_operator'],
  '/growth-operator-dashboard': ['admin', 'assessment_operator', 'community_operator', 'education_operator', 'employer_relations', 'growth_operator', 'mentorship_operator', 'operator', 'platform_operator', 'talent_operator', ...GROWTH_OPERATOR_ROLES],
  '/growth-operator-dashboard/:domain': ['admin', 'assessment_operator', 'community_operator', 'education_operator', 'employer_relations', 'growth_operator', 'mentorship_operator', 'operator', 'platform_operator', 'talent_operator', ...GROWTH_OPERATOR_ROLES],
  '/guardian-dashboard': ['parent'],
  '/hr-dashboard': ['employer_admin'],
  '/internship-coordinator-dashboard': ['admin', 'internship_coordinator'],
  '/mentor-dashboard': ['mentor'],
  '/mentorship-operator-dashboard': ['admin', 'growth_operator', 'mentorship_operator', 'operator', 'platform_administrator', 'super_admin', ...GROWTH_OPERATOR_ROLES],
  '/nafis-talent-dashboard': ['admin', 'growth_operator', 'operator', 'platform_administrator', 'super_admin', 'talent_operator', ...GROWTH_OPERATOR_ROLES],
  '/operations-center': ['admin', 'platform_administrator', 'platform_operator', 'super_admin'],
  '/operations-center/display': ['admin', 'platform_administrator', 'platform_operator', 'super_admin'],
  '/operator-dashboard': ['admin', 'operator'],
  '/professional-dev-dashboard': ['admin', 'growth_operator', 'operator', 'platform_administrator', 'professional_dev_operator', 'super_admin', ...GROWTH_OPERATOR_ROLES],
  '/recruiter-dashboard': ['employer_admin', 'recruiter'],
  '/recruiter/*': ['employer_admin', 'recruiter'],
  '/recruiter/jd-builder': ['employer_admin', 'recruiter'],
  '/recruiter/shortlist/:jdId': ['admin', 'employer_admin', 'recruiter'],
  '/service-catalog': ['admin', 'board_member', 'compliance_auditor', 'platform_operator'],
  '/student-dashboard': ['candidate'],
  '/training-center-dashboard': ['admin', 'training_provider'],
  '/workspace/:companyId': ['admin', 'candidate', 'employee', 'employer_admin', 'employer_relations', 'growth_operator', 'recruiter', 'seeker', ...GROWTH_OPERATOR_ROLES],
};

/**
 * The same role reached several of these lists twice — once written out and
 * once again through ...GROWTH_OPERATOR_ROLES, which since the 2026-08-27
 * unification contains those very names. A duplicate changes no decision (these
 * are membership tests) but it makes the lists unreadable and it made them
 * differ from the identical declarations in App.tsx.
 */
export const ROUTE_ROLES: Record<string, readonly string[]> = Object.fromEntries(
  Object.entries(DECLARED_ROUTE_ROLES).map(([path, roles]) => [path, [...new Set(roles)]]),
);

/**
 * Roles permitted to open `path`, or null when the route is not gated.
 * Handles the wildcard and parameter forms used in App.tsx
 * (`/recruiter/*`, `/workspace/:companyId`).
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
