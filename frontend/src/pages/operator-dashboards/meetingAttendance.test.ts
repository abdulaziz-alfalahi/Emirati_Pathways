/**
 * Per-meeting attendance — the factual record the minutes must state.
 *
 * Scope was set deliberately (owner, 2026-08-20): "Attendance is needed, but
 * participation is not now." Attendance is a fact about a meeting. Participation
 * rates are a judgement about named individuals over time, and that is going to
 * the chairman before anything is built.
 *
 * These tests exist mostly to hold that line, and to stop measured figures being
 * presented as more certain than they are.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const src = readFileSync(resolve(__dirname, 'ExecutiveDashboard.tsx'), 'utf-8');

describe('scope: attendance, not participation', () => {
  it('reads one meeting at a time', () => {
    expect(src).toMatch(/\/api\/board\/meetings\/\$\{m\.id\}\/attendance/);
  });

  it('does not aggregate across meetings', () => {
    // A per-member rate over time is the thing being withheld pending the
    // chairman's alignment.
    for (const forbidden of ['attendance_rate', 'participationRate', 'acrossMeetings']) {
      expect(src).not.toContain(forbidden);
    }
  });

  it('records why the performance view is absent, so it is not read as an oversight', () => {
    expect(src).toMatch(/PARTICIPATION half[\s\S]{0,200}NOT built/);
  });
});

describe('nothing is stated more confidently than it was measured', () => {
  it('distinguishes "could not load" from "nobody came"', () => {
    const fn = src.split('const openAttendance')[1]?.split('const presenceLabel')[0] ?? '';
    expect(fn).toContain('setAttendance(null)');
    expect(src).toMatch(/could not be loaded/);
    expect(src).toMatch(/No attendance was recorded/);
  });

  it('never shows "0 min" for someone who did not join', () => {
    // 0 reads as a measurement of their presence rather than an absence of one.
    const fn = src.split('const presenceLabel')[1]?.split('\n  const ')[0] ?? '';
    expect(fn).toMatch(/Did not join/);
    expect(fn).toMatch(/present_seconds > 0/);
  });

  it('omits the percentage when the backend sends null', () => {
    const fn = src.split('const presenceLabel')[1]?.split('\n  const ')[0] ?? '';
    expect(fn).toMatch(/pct != null/);
  });

  it('marks an assumed interval as an upper bound', () => {
    // Closed by the meeting ending rather than the member leaving.
    expect(src).toContain('duration_is_upper_bound');
    expect(src).toMatch(/at most/);
  });

  it('says when times are measured against the scheduled length', () => {
    expect(src).toContain('meeting_ran');
    expect(src).toMatch(/scheduled length/);
  });
});

describe('observers', () => {
  it('are labelled as not counting toward quorum', () => {
    // The rapporteur is present to record the meeting, not counted in it.
    expect(src).toMatch(/Observer — not counted toward quorum/);
  });
});
