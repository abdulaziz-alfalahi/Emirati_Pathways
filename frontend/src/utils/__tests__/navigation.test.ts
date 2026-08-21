/**
 * Where "Send Message" sends you.
 *
 * A career services operator opened a candidate's profile, clicked Send
 * Message, and was answered "This page is not available to your role"
 * (fb_1787224622). The conversation had already been created — only the
 * navigation was wrong.
 *
 * The role was missing from ROLE_MESSAGING_ROUTES, and the fallback pointed at
 * /candidate-dashboard. So every unmapped STAFF role was sent to a CANDIDATE
 * route, which the guard then refused. The fallback turned a missing map entry
 * into a dead end, which is why the omission went unnoticed for three roles.
 */
import { describe, it, expect } from 'vitest';

import { getMessagingPath } from '../navigation';

describe('getMessagingPath', () => {
  it('sends the reporting role to its own dashboard, not the candidate one', () => {
    const path = getMessagingPath('career_services_operator');
    expect(path).toBe('/career-services-dashboard?tab=messages');
    expect(path).not.toContain('candidate-dashboard');
  });

  it('carries the conversation it just created', () => {
    expect(getMessagingPath('career_services_operator', { conversationId: '42' }))
      .toBe('/career-services-dashboard?tab=messages&conversationId=42');
  });

  it('resolves the roles the map had spelled differently', () => {
    // The map was keyed 'administrator' and 'hr_manager', but the lookup uses
    // the raw users.role value — so real admins fell through the same hole.
    expect(getMessagingPath('admin')).toBe('/admin-dashboard?tab=messaging');
    expect(getMessagingPath('employer_admin')).toBe('/hr-dashboard?tab=messages');
  });

  it('is case-insensitive about the role', () => {
    expect(getMessagingPath('Career_Services_Operator'))
      .toBe('/career-services-dashboard?tab=messages');
  });

  it('returns null rather than a route the caller cannot open', () => {
    // call_center_agent has no messaging surface at all. Null lets the caller
    // say so; the old fallback silently produced an AccessDenied instead.
    expect(getMessagingPath('call_center_agent')).toBeNull();
    expect(getMessagingPath('')).toBeNull();
  });

  it('still routes candidates to their own dashboard', () => {
    expect(getMessagingPath('candidate')).toBe('/candidate-dashboard?tab=messages');
    expect(getMessagingPath('job_seeker')).toBe('/candidate-dashboard?tab=messages');
  });

  it('never sends a non-candidate role to a candidate route', () => {
    const staff = ['recruiter', 'hr_manager', 'employer_admin', 'admin', 'administrator',
                   'mentor', 'educator', 'assessor', 'growth_operator',
                   'career_services_operator'];
    for (const role of staff) {
      expect(getMessagingPath(role)).not.toContain('/candidate-dashboard');
    }
  });
});
