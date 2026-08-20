/**
 * Editing a scheduled meeting — fb_1787145612.
 *
 * "There is currently no option to edit the meeting agenda after clicking
 * Submit ... new topics may need to be added."
 *
 * The API already supported this: PUT /api/board/meetings/<id> changes only the
 * fields present in the body and refuses a completed or cancelled meeting,
 * because governance history is not rewritten. Only the UI was missing — which
 * is why these tests are about what the component sends and when it offers the
 * control, not about the update itself.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const src = readFileSync(resolve(__dirname, 'ExecutiveDashboard.tsx'), 'utf-8');
const saveFn = src.split('const saveMeeting')[1]?.split('const ')[0] ?? '';

describe('edit meeting', () => {
  it('calls the endpoint that already existed', () => {
    expect(saveFn).toMatch(/restClient\.put\(`\/api\/board\/meetings\/\$\{editingMeeting\.id\}`/);
  });

  it('sends ONLY the fields the form owns', () => {
    // Restating scheduled_at would trip the reschedule path, which notifies
    // every member — an agenda tweak must not tell the board the time changed.
    //
    // Asserted on the REQUEST BODY, not the whole function: the comment above
    // the call explains why scheduled_at is omitted, and matching the function
    // text flagged that prose as if it were the payload.
    const body = saveFn.split('`, {')[1]?.split('});')[0] ?? '';
    expect(body).not.toBe('');
    expect(body).not.toMatch(/scheduled_at/);
    expect(body).not.toMatch(/duration_minutes/);
    for (const field of ['title', 'agenda', 'location']) {
      expect(body).toContain(field);
    }
  });

  it('refuses to save an empty title, as the API does', () => {
    expect(saveFn).toMatch(/editForm\.title\.trim\(\)/);
  });

  it('surfaces the API\'s own refusal rather than a generic failure', () => {
    // "This meeting is closed and can no longer be edited" is the useful text.
    expect(saveFn).toMatch(/response\?\.data\?\.message/);
  });

  it('reloads the list after saving, so the change is visible', () => {
    expect(saveFn).toContain('fetchMeetings()');
  });
});

describe('who is offered the control, and when', () => {
  it('organisers only', () => {
    expect(src).toMatch(/canManageBoard && m\.status !== 'completed'/);
  });

  it('never on a closed meeting — the API would refuse it', () => {
    const guard = src.split('canManageBoard && m.status')[1]?.slice(0, 120) ?? '';
    expect(guard).toContain("'completed'");
    expect(guard).toContain("'cancelled'");
  });

  it('warns that members are not notified of the edit', () => {
    // A secretary who assumes an agenda change reaches the board would be
    // wrong, and would find out at the meeting.
    expect(src).toMatch(/Members are not notified of these changes/);
  });
});
