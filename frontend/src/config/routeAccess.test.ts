import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ROUTE_ROLES, canOpenPath, rolesForPath } from './routeAccess';

/**
 * ROUTE_ROLES must stay identical to what App.tsx actually enforces, and the
 * navigation must never offer a page the router will refuse (#353).
 */
function rolesDeclaredInApp(): Record<string, string[]> {
  const src = readFileSync(join(__dirname, '..', 'App.tsx'), 'utf-8');
  const found: Record<string, string[]> = {};
  for (const block of src.split('<Route').slice(1)) {
    const path = block.match(/path=["']([^"']+)["']/);
    const roles = block.match(/allowedRoles=\{\[([\s\S]*?)\]\}/);
    if (!path || !roles) continue;
    if (roles.index !== undefined && roles.index > 600) continue;
    found['/' + path[1].replace(/^\//, '')] = [...new Set(
      roles[1].split(',').map(r => r.trim().replace(/['"]/g, '').toLowerCase()).filter(Boolean)
    )].sort();
  }
  return found;
}

describe('routeAccess is the single source of truth', () => {
  it('matches every allowedRoles declaration in App.tsx', () => {
    const declared = rolesDeclaredInApp();
    expect(Object.keys(declared).length).toBeGreaterThan(30);
    for (const [path, roles] of Object.entries(declared)) {
      expect(ROUTE_ROLES[path], `ROUTE_ROLES is missing ${path}`).toBeDefined();
      expect([...(ROUTE_ROLES[path] || [])].sort(),
        `${path} drifted from App.tsx`).toEqual(roles);
    }
  });

  it('has no entry the router does not declare', () => {
    const declared = rolesDeclaredInApp();
    for (const path of Object.keys(ROUTE_ROLES)) {
      expect(declared[path], `${path} is in ROUTE_ROLES but not in App.tsx`).toBeDefined();
    }
  });

  it('refuses a role the route does not allow', () => {
    // Samir's actual case: a career services operator sent to /demographics.
    expect(canOpenPath('/demographics', ['career_services_operator', 'call_center_agent'])).toBe(false);
    expect(canOpenPath('/demographics', ['compliance_auditor'])).toBe(true);
    expect(canOpenPath('/cv-builder', ['career_services_operator'])).toBe(false);
    expect(canOpenPath('/cv-builder', ['candidate'])).toBe(true);
  });

  it('treats an ungated path as open', () => {
    expect(rolesForPath('/scholarships')).toBeNull();
    expect(canOpenPath('/scholarships', ['candidate'])).toBe(true);
  });

  it('resolves wildcard and parameter routes', () => {
    expect(rolesForPath('/recruiter/jd-builder')).toEqual(ROUTE_ROLES['/recruiter/*']);
    expect(rolesForPath('/board-meeting/abc-123')).toEqual(ROUTE_ROLES['/board-meeting/:meetingId']);
  });
});
