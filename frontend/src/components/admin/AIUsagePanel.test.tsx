import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * The panel exists to answer "what do we spend on AI". These tests pin the two
 * ways it could answer dishonestly:
 *
 *   1. rendering 0.00 when the truth is "we have no reading", and
 *   2. presenting an estimate as though it were billed usage.
 *
 * Both are the defect class in GH #26 (fabricated data shown as real), and both
 * are easy to reintroduce with a well-meant tidy-up of the empty state.
 */

const mockGet = vi.fn();

vi.mock('@/utils/api', () => ({
  restClient: { get: (...args: any[]) => mockGet(...args) },
}));

vi.mock('@/context/EnhancedLanguageContext', () => ({
  useLanguage: () => ({ language: 'en', toggleLanguage: vi.fn() }),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...p }: any) => <div {...p}>{children}</div>,
}));

import AIUsagePanel from './AIUsagePanel';

const withData = (over: Record<string, any> = {}) => ({
  data: {
    data: {
      days: 30,
      available: true,
      totals: {
        calls: 120, prompt_tokens: 90_000, completion_tokens: 30_000,
        total_tokens: 120_000, estimated_cost_aed: 12.3456,
        failed_calls: 3, retry_calls: 4,
      },
      by_task: [{ task_type: 'parse', calls: 100, tokens: 100_000, estimated_cost_aed: 10.0 }],
      by_model: [{ model: 'qwen-turbo', calls: 100, tokens: 100_000, estimated_cost_aed: 10.0, avg_latency_ms: 850 }],
      ...over,
    },
  },
});

beforeEach(() => { mockGet.mockReset(); });

describe('AIUsagePanel', () => {
  it('says there is no reading rather than showing a confident zero', async () => {
    // available:false means the table could not be read. Rendering 0.00 here
    // would be read as "we spent nothing", which is a different claim entirely.
    mockGet.mockResolvedValue(withData({ available: false, totals: {}, by_task: [], by_model: [] }));

    render(<AIUsagePanel />);

    await waitFor(() => expect(screen.getByText(/not available right now/i)).toBeInTheDocument());
    expect(screen.queryByText('0.00')).not.toBeInTheDocument();
  });

  it('distinguishes "no calls yet" from "unavailable"', async () => {
    // Recording only began when migration 069 deployed; before any traffic the
    // honest statement is "nothing recorded yet", not "zero spend".
    mockGet.mockResolvedValue(withData({
      totals: { calls: 0, prompt_tokens: 0, completion_tokens: 0, total_tokens: 0,
                estimated_cost_aed: 0, failed_calls: 0, retry_calls: 0 },
      by_task: [], by_model: [],
    }));

    render(<AIUsagePanel />);

    await waitFor(() => expect(screen.getByText(/no ai calls recorded/i)).toBeInTheDocument());
  });

  it('always labels the money as an estimate, never as billed usage', async () => {
    mockGet.mockResolvedValue(withData());

    render(<AIUsagePanel />);

    await waitFor(() => expect(screen.getByText(/estimated spend/i)).toBeInTheDocument());
    expect(screen.getByText(/estimate, not an invoice/i)).toBeInTheDocument();
    expect(screen.getByText(/not billed usage/i)).toBeInTheDocument();
  });

  it('surfaces retries and failures as spend with nothing delivered', async () => {
    // 3 failed + 4 retried = 7. This is the number that argues for or against
    // self-hosting, so it gets its own tile rather than being buried.
    mockGet.mockResolvedValue(withData());

    render(<AIUsagePanel />);

    await waitFor(() => expect(screen.getByText(/retries & failures/i)).toBeInTheDocument());
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText(/billed, nothing delivered/i)).toBeInTheDocument();
  });

  it('shows the by-task breakdown in full mode and hides it when compact', async () => {
    mockGet.mockResolvedValue(withData());
    const { unmount } = render(<AIUsagePanel />);
    await waitFor(() => expect(screen.getByText(/by task/i)).toBeInTheDocument());
    unmount();

    mockGet.mockResolvedValue(withData());
    render(<AIUsagePanel compact />);
    await waitFor(() => expect(screen.getByText(/estimated spend/i)).toBeInTheDocument());
    expect(screen.queryByText(/by task/i)).not.toBeInTheDocument();
  });

  it('requests the window it was given', async () => {
    mockGet.mockResolvedValue(withData());
    render(<AIUsagePanel defaultDays={7} />);
    await waitFor(() => expect(mockGet).toHaveBeenCalledWith('/api/admin/ai-usage?days=7'));
  });

  it('explains a 403 instead of showing an empty dashboard', async () => {
    mockGet.mockRejectedValue({ response: { status: 403 } });

    render(<AIUsagePanel />);

    await waitFor(() => expect(screen.getByText(/do not have access/i)).toBeInTheDocument());
  });
});
