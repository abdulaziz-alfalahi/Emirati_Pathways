/**
 * A removed role must stop being offered.
 *
 * An administrator unticked Board Member and saved; the Users tab showed it
 * gone. The role switcher kept listing it, and kept letting it be selected,
 * through repeated hard refreshes.
 *
 * refreshUser takes role and secondary_roles from the API — correctly — but
 * `roles` was carried over from localStorage on the switched-role path. Nothing
 * ever rewrote that key, so a role removed in the database lived on in the
 * cached array indefinitely. The switcher unions user.roles, so it kept
 * appearing; switchRole validates against the same cached arrays, so it stayed
 * selectable; and ProtectedRoute reads user.roles too, so it also admitted the
 * client to pages the server had stopped allowing.
 *
 * The server still refused the API calls behind those pages — resolve_roles
 * reads the database, never the client — so this was a misleading UI rather
 * than real access. But a guard reading cached authority is the pattern that
 * has caused real defects here before, so it is pinned.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const SRC = readFileSync(join(__dirname, '..', 'AuthContext.tsx'), 'utf-8');

describe('cached roles never outlive the server', () => {
  it('derives roles from the API rather than preserving the stored array', () => {
    expect(SRC).toContain('const _derived = Array.from(new Set([_apiRole, ..._apiSecondary]');
    expect(SRC).toContain('roles: _derived');
  });

  it('derives the user_metadata copy too', () => {
    // ProfileSummary falls back to user_metadata.roles, so a stale copy there
    // would outlive the corrected one.
    expect(SRC).toContain('user_metadata: { ...(mergedData.user_metadata || {}), roles: _derived }');
  });

  it('does not carry the stored roles array into the merged user', () => {
    // The line that caused it: `roles: storedRoleStillValid ? storedUser.roles : undefined`
    expect(SRC).not.toContain('roles: storedRoleStillValid ? storedUser.roles');
  });

  it('still takes secondary_roles from the API', () => {
    expect(SRC).toContain('secondary_roles: apiSecondaryRoles');
  });

  it('still drops a locally switched role the backend no longer allows', () => {
    // Pre-existing guarantee: switching to a role and then losing it must not
    // leave that role active.
    expect(SRC).toContain('const storedRoleStillValid = apiAllRoles.includes(storedRole)');
  });
});
