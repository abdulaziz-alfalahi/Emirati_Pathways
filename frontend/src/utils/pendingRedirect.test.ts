import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { setPendingRedirect, readPendingRedirect, clearPendingRedirect } from './pendingRedirect';

/**
 * The venue QR flow shipped once with the check-in page WRITING a redirect key
 * that nothing anywhere READ, so a candidate finished UAE Pass on a dashboard
 * and never received their queue number. These tests pin both halves: the
 * behaviour of the store, and the fact that the two pages still use it.
 */

describe('pendingRedirect', () => {
  beforeEach(() => { localStorage.clear(); clearPendingRedirect(); });
  afterEach(() => { vi.useRealTimers(); });

  it('returns the path that was stored', () => {
    setPendingRedirect('/events/abc-123/check-in');
    expect(readPendingRedirect()).toBe('/events/abc-123/check-in');
  });

  it('survives a page load, which sessionStorage would not', () => {
    // UAE Pass can return in a different tab; the value must still be there.
    setPendingRedirect('/events/abc-123/check-in');
    expect(window.localStorage.getItem('post_login_redirect')).toBeTruthy();
    expect(window.sessionStorage.getItem('post_login_redirect')).toBeNull();
  });

  it('does not consume the value on read — the caller clears it', () => {
    setPendingRedirect('/events/abc/check-in');
    expect(readPendingRedirect()).toBe('/events/abc/check-in');
    expect(readPendingRedirect()).toBe('/events/abc/check-in');
    clearPendingRedirect();
    expect(readPendingRedirect()).toBeNull();
  });

  it('ignores a value older than the window, so a later sign-in is unaffected', () => {
    setPendingRedirect('/events/old-event/check-in');
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 31 * 60 * 1000);
    expect(readPendingRedirect()).toBeNull();
    // and forgets it, rather than re-checking a dead value every sign-in
    vi.useRealTimers();
    expect(localStorage.getItem('post_login_redirect')).toBeNull();
  });

  it('still honours a value inside the window', () => {
    setPendingRedirect('/events/live-event/check-in');
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 29 * 60 * 1000);
    expect(readPendingRedirect()).toBe('/events/live-event/check-in');
  });

  it.each([
    ['//evil.example/steal', 'protocol-relative URL'],
    ['https://evil.example', 'absolute URL'],
    ['javascript:alert(1)', 'javascript: URL'],
    ['events/abc/check-in', 'relative path'],
  ])('refuses to store %s (%s)', (bad) => {
    setPendingRedirect(bad);
    expect(readPendingRedirect()).toBeNull();
  });

  it('rejects an unsafe path planted directly in storage', () => {
    // Defends the read side too, not just our own writes.
    localStorage.setItem('post_login_redirect',
      JSON.stringify({ path: '//evil.example', at: Date.now() }));
    expect(readPendingRedirect()).toBeNull();
  });

  it('survives junk in storage without throwing', () => {
    localStorage.setItem('post_login_redirect', 'not json');
    expect(readPendingRedirect()).toBeNull();
    // A value left by the older sessionStorage version was a bare string.
    localStorage.setItem('post_login_redirect', '/events/abc/check-in');
    expect(readPendingRedirect()).toBeNull();
  });
});

/**
 * The regression that caused the bug was not in the store — it was that the two
 * ends never met. Assert the wiring, not just the helper.
 */
describe('the check-in flow is actually wired to it', () => {
  const read = (...p: string[]) => readFileSync(join(__dirname, '..', ...p), 'utf-8');

  it('EventCheckInPage stores the destination before sending the user to sign in', () => {
    const src = read('pages', 'events', 'EventCheckInPage.tsx');
    expect(src).toMatch(/setPendingRedirect\(/);
    expect(src).toMatch(/from '@\/utils\/pendingRedirect'/);
    // The old hand-rolled key is what nothing read. It must not come back.
    expect(src).not.toMatch(/sessionStorage\.setItem\(\s*['"]post_login_redirect/);
  });

  it('UAEPassCallback reads and clears it', () => {
    const src = read('pages', 'auth', 'UAEPassCallback.tsx');
    expect(src).toMatch(/readPendingRedirect\(/);
    expect(src).toMatch(/clearPendingRedirect\(/);
  });

  it('sends a pending redirect ahead of the new-user detour', () => {
    /* A walk-in scanning the poster IS is_new_user — that is the entire point
       of the QR — so if /welcome is checked first they are diverted away from
       check-in and left in the queue with no number. Order is load-bearing. */
    const src = read('pages', 'auth', 'UAEPassCallback.tsx');
    const pendingAt = src.indexOf('if (pending');
    const newUserAt = src.indexOf('isNewUser)');
    expect(pendingAt).toBeGreaterThan(-1);
    expect(newUserAt).toBeGreaterThan(-1);
    expect(pendingAt).toBeLessThan(newUserAt);
  });
});
