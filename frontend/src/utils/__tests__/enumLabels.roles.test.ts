import { describe, it, expect } from 'vitest';
import { roleLabel } from '@/utils/enumLabels';
import { ROLE_DISPLAY_NAMES } from '@/types/auth';

/**
 * Every role in the UserRole union must have an Arabic label.
 *
 * Regression cover for a bug that reached staging: the role switcher rendered a
 * mix of Arabic and English. Roles missing from the map fell through to a
 * title-case fallback that SYNTHESISES an English string from the role token
 * ('board_member' -> 'Board Member'), so the English text never existed as copy
 * anywhere and no translation pass could have found it. Eleven operator
 * personas were affected.
 *
 * ROLE_DISPLAY_NAMES is keyed by UserRole, so its runtime keys are the
 * authoritative role list — a role added to the union without an Arabic label
 * fails here rather than in front of a user.
 */

const ARABIC = /[؀-ۿ]/;
const LATIN = /[A-Za-z]/;
const roles = Object.keys(ROLE_DISPLAY_NAMES);

describe('roleLabel — Arabic coverage', () => {
  it('has a role list to check', () => {
    expect(roles.length).toBeGreaterThan(15);
  });

  it.each(roles)('translates %s into Arabic', (role) => {
    const ar = roleLabel(role, 'ar');
    expect(ar, `${role} produced an empty label`).toBeTruthy();
    expect(ARABIC.test(ar), `${role} -> "${ar}" contains no Arabic`).toBe(true);
    expect(LATIN.test(ar), `${role} -> "${ar}" still contains Latin text`).toBe(false);
  });

  it.each(roles)('keeps an English label for %s', (role) => {
    expect(roleLabel(role, 'en')).toBeTruthy();
  });

  it('normalises separators, so board_member and "board member" agree', () => {
    expect(roleLabel('board_member', 'ar')).toBe(roleLabel('board member', 'ar'));
    expect(roleLabel('BOARD_MEMBER', 'ar')).toBe(roleLabel('board_member', 'ar'));
  });

  it('echoes an unknown role rather than rendering an empty string', () => {
    expect(roleLabel('not_a_real_role', 'ar')).toBe('not_a_real_role');
  });
});
