import { describe, it, expect } from 'vitest';
import { bestLandingRole } from '../authService';

// C2: login lands on the most-privileged role's dashboard, so an operator
// whose primary role is still `candidate` (role granted into secondary_roles)
// isn't stranded on the candidate dashboard.
describe('bestLandingRole', () => {
  it('prefers an operator role over candidate', () => {
    expect(bestLandingRole(['candidate', 'career_services_operator'])).toBe('career_services_operator');
    expect(bestLandingRole(['candidate', 'talent_operator'])).toBe('talent_operator');
  });

  it('keeps a pure candidate on candidate', () => {
    expect(bestLandingRole(['candidate'])).toBe('candidate');
    expect(bestLandingRole(['candidate', 'job_seeker'])).toBe('candidate');
  });

  it('picks the highest-privilege role among several', () => {
    expect(bestLandingRole(['candidate', 'recruiter', 'admin'])).toBe('admin');
    expect(bestLandingRole(['recruiter', 'talent_operator'])).toBe('talent_operator');
  });

  it('normalizes aliases and is order-independent', () => {
    expect(bestLandingRole(['career_services_operator', 'candidate'])).toBe('career_services_operator');
    expect(bestLandingRole(['job seeker', 'coach'])).toBe('coach');
  });

  it('returns null for an empty set', () => {
    expect(bestLandingRole([])).toBeNull();
  });
});
