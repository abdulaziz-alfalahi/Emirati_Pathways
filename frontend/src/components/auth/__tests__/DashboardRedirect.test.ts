import { describe, it, expect } from 'vitest';
import { resolveDashboardPath } from '../DashboardRedirect';

describe('resolveDashboardPath — /dashboard routes by role', () => {
  it('sends a plain candidate to the candidate dashboard', () => {
    expect(resolveDashboardPath({ role: 'candidate' })).toBe('/candidate-dashboard');
  });

  it('sends a recruiter to the recruiter dashboard', () => {
    expect(resolveDashboardPath({ role: 'recruiter' })).toBe('/recruiter-dashboard');
  });

  it('prefers an operator role held in secondary_roles over a candidate primary', () => {
    expect(resolveDashboardPath({ role: 'candidate', secondary_roles: ['talent_operator'] })).toBe('/nafis-talent-dashboard');
  });

  it('falls back to the legacy user_type when role is missing', () => {
    expect(resolveDashboardPath({ user_type: 'admin' })).toBe('/admin-dashboard');
  });

  it('never returns an empty path', () => {
    expect(resolveDashboardPath({})).toBe('/candidate-dashboard');
    expect(resolveDashboardPath(null)).toBe('/candidate-dashboard');
  });
});
