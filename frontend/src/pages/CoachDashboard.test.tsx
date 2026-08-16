import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * Findings from the production-readiness audit of /coach-dashboard (2026-08-16).
 *
 * The dashboard was already sound — real endpoints, honest empty states, correct
 * authorisation, no dead CTAs. What follows pins the four things that were not,
 * and three of them are the honesty kind that regress quietly because nothing
 * looks broken when they do.
 */

const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock('@/utils/api', () => ({
  restClient: {
    get: (...a: any[]) => mockGet(...a),
    post: (...a: any[]) => mockPost(...a),
  },
}));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'en' } }) }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/components/recruiter/Messages', () => ({ default: () => <div /> }));

// The layout renders stats and the active tab; enough to assert on both.
vi.mock('@/components/layouts/EducationPathwayLayout', () => ({
  EducationPathwayLayout: ({ description, stats, tabs }: any) => (
    <div>
      <p>{description}</p>
      {stats.map((s: any, i: number) => (
        <div key={i} data-testid={`stat-${s.label}`}>{s.value} {s.label}</div>
      ))}
      {tabs[0].content}
    </div>
  ),
}));

import CoachDashboard from './CoachDashboard';

const CLIENT = {
  client_id: '784000000000270', display_name: 'Test Client',
  total_sessions: 1, active_plans: 1,
};

const ok = (data: any) => Promise.resolve({ data });

beforeEach(() => {
  mockGet.mockReset();
  mockPost.mockReset();
});

function wire({ analytics, clients = [CLIENT] }: { analytics: any; clients?: any[] }) {
  mockGet.mockImplementation((url: string) => {
    if (url.includes('/clients')) return ok({ clients });
    if (url.includes('/analytics')) {
      return analytics === 'fail' ? Promise.reject(new Error('500')) : ok(analytics);
    }
    if (url.includes('/requests')) return ok({ requests: [] });
    return ok({});
  });
}

describe('CoachDashboard', () => {
  it('shows an em dash, not zero, when analytics could not be read', async () => {
    // A coach who has run dozens of sessions must not be told "0 Sessions"
    // because a call failed. Zero is a measurement; this is the absence of one.
    wire({ analytics: 'fail' });

    render(<CoachDashboard />);

    await waitFor(() => expect(screen.getByTestId('stat-Sessions')).toHaveTextContent('—'));
    expect(screen.getByTestId('stat-Coaching Hours')).toHaveTextContent('—');
    expect(screen.getByTestId('stat-Active Plans')).toHaveTextContent('—');
    expect(screen.getByTestId('stat-Sessions')).not.toHaveTextContent('0');
  });

  it('still reports client count from its own endpoint when analytics fails', async () => {
    // Clients come from a different call, so their number is a real reading even
    // when analytics is unavailable. Suppressing it too would lose information.
    wire({ analytics: 'fail' });

    render(<CoachDashboard />);

    await waitFor(() => expect(screen.getByTestId('stat-Clients')).toHaveTextContent('1'));
  });

  it('shows a genuine zero as zero', async () => {
    wire({ analytics: { total_sessions: 0, total_coaching_hours: 0, plan_stats: { active: 0 } }, clients: [] });

    render(<CoachDashboard />);

    await waitFor(() => expect(screen.getByTestId('stat-Sessions')).toHaveTextContent('0'));
    expect(screen.getByTestId('stat-Sessions')).not.toHaveTextContent('—');
  });

  it('does not send coach_id — the server derives it from the token', async () => {
    // Passing it implied the server trusted it. It does not, and a reader should
    // not have to read the handler to find that out.
    wire({ analytics: { total_sessions: 1 } });

    render(<CoachDashboard />);

    await waitFor(() => expect(mockGet).toHaveBeenCalled());
    const urls = mockGet.mock.calls.map(c => String(c[0]));
    expect(urls.some(u => u.includes('coach_id'))).toBe(false);
  });

  it('says "1 session", not "1 sessions"', async () => {
    wire({ analytics: { total_sessions: 1 } });

    render(<CoachDashboard />);

    await waitFor(() => expect(screen.getByText(/1 session ·/)).toBeInTheDocument());
    expect(screen.queryByText(/1 sessions/)).not.toBeInTheDocument();
    expect(screen.getByText(/1 active plan(?!s)/)).toBeInTheDocument();
  });

  it('pluralises correctly above one', async () => {
    wire({ analytics: {}, clients: [{ ...CLIENT, total_sessions: 3, active_plans: 2 }] });

    render(<CoachDashboard />);

    await waitFor(() => expect(screen.getByText(/3 sessions · 2 active plans/)).toBeInTheDocument());
  });

  it('no longer promises gap analysis it does not perform', async () => {
    // The endpoint returns a current-skills inventory with no target to compare
    // against. A button labelled "Skill Gaps" promised a coach an analysis that
    // does not exist, in front of a client.
    wire({ analytics: {} });

    render(<CoachDashboard />);

    await waitFor(() => expect(screen.getByText('Skills')).toBeInTheDocument());
    expect(screen.queryByText('Skill Gaps')).not.toBeInTheDocument();
    expect(screen.queryByText(/skill gap analysis/i)).not.toBeInTheDocument();
  });
});
