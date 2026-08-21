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
    /* /demographics ADMITS career services operators as of 2026-08-15 (owner
       decision). This assertion previously expected false — that was Samir's
       reported case, and the resolution was that the page was right and the
       route was wrong, not the other way round. Updated deliberately rather
       than deleted, so the reversal is visible in the history. */
    expect(canOpenPath('/demographics', ['career_services_operator', 'call_center_agent'])).toBe(true);
    expect(canOpenPath('/demographics', ['compliance_auditor'])).toBe(true);
    // Still gated: a plain candidate has no business in talent-pool analytics.
    expect(canOpenPath('/demographics', ['candidate'])).toBe(false);
    expect(canOpenPath('/cv-builder', ['career_services_operator'])).toBe(false);
    expect(canOpenPath('/cv-builder', ['candidate'])).toBe(true);
  });

  it('treats an ungated path as open', () => {
    expect(rolesForPath('/scholarships')).toBeNull();
    expect(canOpenPath('/scholarships', ['candidate'])).toBe(true);
  });

  it('resolves wildcard and parameter routes', () => {
    expect(rolesForPath('/recruiter/jd-builder')).toEqual(ROUTE_ROLES['/recruiter/*']);
    expect(rolesForPath('/workspace/abc-123')).toEqual(ROUTE_ROLES['/workspace/:companyId']);
  });
});

/**
 * The board secretary needs BOTH dashboards (fb_1787129641).
 *
 * "The board secretary should have access to both the Board member dashboard
 * and the board secretary dashboard."
 *
 * board_operator was admitted to /board-secretary but not /executive, so the
 * person who prepares the board pack, schedules the meetings and writes the
 * minutes could not see what the members read.
 */
describe('board secretary access', () => {
  it('reaches the board member dashboard', () => {
    expect(ROUTE_ROLES['/executive']).toContain('board_operator');
  });

  it('still reaches their own secretariat workspace', () => {
    expect(ROUTE_ROLES['/board-secretary']).toContain('board_operator');
  });

  it('did not accidentally widen the secretariat to board members', () => {
    // The secretary needs both. A member does not need the secretariat, and
    // fixing one direction must not open the other.
    expect(ROUTE_ROLES['/board-secretary']).not.toContain('board_member');
  });

  it('leaves the meeting room ungated, because the attendee list decides', () => {
    // Who may join a board meeting is a per-MEETING question, answered by
    // POST /api/board/meetings/<id>/join from the attendee list — not a role
    // question. The role gate that used to live here refused invited guests at
    // the door: a subject expert brought in for one agenda item is not a board
    // member, which made additional attendees (PR #469) and the waiting room
    // (PR #471) unreachable by the people they exist for (PRs #472, #474).
    //
    // The secretary can still join — they are on the attendee list, which is a
    // stronger test than holding a role, since the old gate also admitted a
    // board member who had never been invited to THAT meeting.
    expect(ROUTE_ROLES['/board-meeting/:meetingId']).toBeUndefined();
    expect(rolesForPath('/board-meeting/abc-123')).toBeNull();
  });
});
