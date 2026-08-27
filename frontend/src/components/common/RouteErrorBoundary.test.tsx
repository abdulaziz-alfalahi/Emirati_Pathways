/**
 * The blank page, and why a boundary is what fixes it.
 *
 * Reported 2026-08-27 as "Request New Role – Blank Page". Reproduced signed in
 * as an operator: ZERO characters rendered. React said what was missing —
 * "Consider adding an error boundary to your tree" — and there was none
 * anywhere in the app.
 *
 * Every route is lazily loaded, so any chunk that fails to fetch unmounted the
 * whole tree. The failure that actually happened was a Vite dev-server
 * "Outdated Optimize Dep" 504 after a deploy, which a reload fixes — which is
 * precisely why it was worth catching, since the user had no way to know that.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import RouteErrorBoundary from './RouteErrorBoundary';

const Boom: React.FC<{ error: Error }> = ({ error }) => { throw error; };

let consoleError: any;
beforeEach(() => { consoleError = vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => consoleError.mockRestore());

describe('RouteErrorBoundary', () => {
  it('renders its children when nothing is wrong', () => {
    render(<RouteErrorBoundary><p>the page</p></RouteErrorBoundary>);
    expect(screen.getByText('the page')).toBeTruthy();
  });

  it('shows something instead of nothing when a route throws', () => {
    render(<RouteErrorBoundary><Boom error={new Error('kaboom')} /></RouteErrorBoundary>);
    // The defect was a page with no content at all.
    expect(document.body.textContent!.trim().length).toBeGreaterThan(30);
    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('recognises a stale chunk and says the platform updated', () => {
    render(
      <RouteErrorBoundary>
        <Boom error={new Error('Failed to fetch dynamically imported module: ProfileStudioPage.tsx')} />
      </RouteErrorBoundary>
    );
    expect(screen.getByText(/platform was updated/i)).toBeTruthy();
    expect(screen.getByText(/nothing you were doing has been lost/i)).toBeTruthy();
  });

  it('recognises the exact Vite failure that was reported', () => {
    render(<RouteErrorBoundary><Boom error={new Error('Outdated Optimize Dep')} /></RouteErrorBoundary>);
    expect(screen.getByText(/platform was updated/i)).toBeTruthy();
  });

  it('words a genuine crash differently from a stale chunk', () => {
    render(<RouteErrorBoundary><Boom error={new Error('cannot read property of undefined')} /></RouteErrorBoundary>);
    // "We just updated, reload" would be a lie about a real bug, and would stop
    // the user reporting it.
    expect(screen.queryByText(/platform was updated/i)).toBeNull();
    expect(screen.getByText(/could not be opened/i)).toBeTruthy();
    expect(screen.getByText(/send feedback/i)).toBeTruthy();
  });

  it('never reloads on its own', () => {
    // A component that throws on every render would reload for ever, and an
    // auto-reloading page cannot be read, reported or escaped.
    const source = RouteErrorBoundary.toString();
    expect(source).not.toMatch(/useEffect|setTimeout/);
  });

  it('logs the failure so a feedback report carries it', () => {
    render(<RouteErrorBoundary><Boom error={new Error('kaboom')} /></RouteErrorBoundary>);
    expect(consoleError).toHaveBeenCalled();
  });

  it('renders in Arabic when asked', () => {
    render(<RouteErrorBoundary isRTL><Boom error={new Error('Loading chunk 3 failed')} /></RouteErrorBoundary>);
    expect(screen.getByText(/تم تحديث المنصة/)).toBeTruthy();
  });
});
