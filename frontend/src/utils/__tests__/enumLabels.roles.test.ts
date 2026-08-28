import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
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


/**
 * The frontend labels are GENERATED from backend/role_labels.py. This asserts
 * they still match it, character for character.
 *
 * Seven maps named these roles before 2026-08-27 — this one, ROLE_DISPLAY_NAMES
 * in types/auth.ts, an Arabic map in UserMenu, identical copies in
 * StaffInvitationsTab and JoinStaffPage, and two on the backend. They disagreed
 * on most of the operator roles, so somebody granted "Company Onboarding
 * Operator" was appointed "Employer Relations" by email and shown a third name
 * in the header. Reported as "the role is showing in one place but not the
 * other", and before that as fb_1785840837.
 *
 * A test is what keeps this one registry from quietly becoming two again.
 */
describe('the labels match the backend registry', () => {
  const python = readFileSync(
    join(__dirname, '..', '..', '..', '..', 'backend', 'role_labels.py'), 'utf-8');

  // Entries look like:  'employer_relations': ('Company Onboarding Operator',
  //                                            'مشغّل انضمام الشركات'),
  // and wrap freely, so the pattern spans newlines rather than assuming one line.
  const backend: Record<string, { en: string; ar: string }> = {};
  const entry = /'([a-z_]+)':\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*\)/g;
  const body = python.slice(python.indexOf('ROLE_LABELS = {'), python.indexOf('\ndef label_for'));
  for (let m = entry.exec(body); m; m = entry.exec(body)) {
    backend[m[1]] = { en: m[2], ar: m[3] };
  }

  it('parsed the backend registry', () => {
    expect(Object.keys(backend).length).toBeGreaterThan(30);
    expect(backend.employer_relations?.en).toBe('Company Onboarding Operator');
  });

  it.each(Object.keys(ROLE_DISPLAY_NAMES))('%s reads the same on both sides', (role) => {
    const expected = backend[role];
    expect(expected, `${role} is not in backend/role_labels.py`).toBeDefined();
    expect(roleLabel(role, 'en')).toBe(expected.en);
    expect(roleLabel(role, 'ar')).toBe(expected.ar);
    expect(ROLE_DISPLAY_NAMES[role as keyof typeof ROLE_DISPLAY_NAMES]).toBe(expected.en);
  });
});
