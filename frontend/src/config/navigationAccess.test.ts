import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ROUTE_ROLES } from './routeAccess';

/**
 * The navigation must never offer a page the router will refuse.
 *
 * routeAccess.test.ts already pins ROUTE_ROLES to what App.tsx enforces. That
 * catches drift in what is GUARDED — it says nothing about what is OFFERED, and
 * the gap between those two is where users actually live:
 *
 *   fb_1786427865_96351906 — "when clicking on Operations and then selecting
 *   Demographics Analytics, the system redirects me to the Home Page"
 *   fb_1786427655_d66a6702 — the same for Career Entry -> CV Builder
 *
 * Both were correct refusals. The defect was that the menu showed the item at
 * all. Six such items existed when this test was written, one of them added the
 * same day by someone who checked the route guard and not the menu (#353 again,
 * one layer up).
 *
 * A nav entry with no allowedRoles is shown to EVERYONE, so it must point at a
 * route that is open to everyone.
 */

type NavItem = { name: string; href: string; roles: string[] | null };

function navItems(): NavItem[] {
  const src = readFileSync(
    join(__dirname, '..', 'components', 'navigation', 'navigationConfig.ts'), 'utf-8');
  const out: NavItem[] = [];
  for (const block of src.split(/\{\s*\n/)) {
    const href = block.match(/href:\s*'([^']+)'/);
    const name = block.match(/name:\s*'([^']+)'/);
    if (!href || !name) continue;
    const roles = block.match(/allowedRoles:\s*\[([^\]]*)\]/);
    out.push({
      name: name[1],
      href: href[1],
      roles: roles
        ? roles[1].split(',').map(r => r.trim().replace(/['"]/g, '').toLowerCase()).filter(Boolean)
        : null,
    });
  }
  return out;
}

describe('navigation never offers a page the router refuses', () => {
  const items = navItems();

  it('finds the navigation config', () => {
    expect(items.length).toBeGreaterThan(10);
  });

  it.each(items.filter(i => ROUTE_ROLES[i.href]))(
    '$name ($href)',
    ({ href, roles }) => {
      const required = new Set(ROUTE_ROLES[href].map(r => r.toLowerCase()));

      // Shown to everyone, but the route is gated — every signed-in user
      // without one of those roles clicks it and is refused.
      expect(
        roles,
        `is shown to everyone but ${href} is restricted to ${[...required].join(', ')}. ` +
        `Give the nav entry an allowedRoles matching the route, or open the route.`,
      ).not.toBeNull();

      const offeredButRefused = (roles || []).filter(r => !required.has(r));
      expect(
        offeredButRefused,
        `the menu offers ${href} to ${offeredButRefused.join(', ')}, which the router refuses. ` +
        `Either narrow the nav entry or widen the route — but they must agree.`,
      ).toEqual([]);
    },
  );
});
