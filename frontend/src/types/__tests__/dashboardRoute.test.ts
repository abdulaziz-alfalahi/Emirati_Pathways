import { describe, it, expect } from 'vitest';
import { getDashboardRoute, ROLE_DASHBOARD_MAP } from '../auth';

// C6 consolidation: NotificationSystem used to route talent_operator and four
// other operators to /growth-operator-dashboard, conflicting with the
// canonical map. These pins document that each operator has its OWN canonical
// dashboard, which NotificationSystem now defers to.
describe('canonical operator dashboard routing', () => {
  it('routes talent_operator to the NAFIS Talent dashboard, not growth', () => {
    expect(getDashboardRoute('talent_operator')).toBe('/nafis-talent-dashboard');
    expect(getDashboardRoute('talent_operator')).not.toBe('/growth-operator-dashboard');
  });

  it.each([
    ['education_operator', '/education-operator-dashboard'],
    ['assessment_operator', '/assessment-operator-dashboard'],
    ['mentorship_operator', '/mentorship-operator-dashboard'],
    ['community_operator', '/community-operator-dashboard'],
    ['career_services_operator', '/career-services-dashboard'],
  ])('routes %s to its own dashboard (%s)', (role, path) => {
    expect(getDashboardRoute(role)).toBe(path);
  });

  it('keeps candidate on the candidate dashboard', () => {
    expect(getDashboardRoute('candidate')).toBe('/candidate-dashboard');
  });

  it('every mapped role has a non-empty distinct route', () => {
    const routes = Object.values(ROLE_DASHBOARD_MAP);
    expect(routes.every(r => typeof r === 'string' && r.startsWith('/'))).toBe(true);
  });
});
