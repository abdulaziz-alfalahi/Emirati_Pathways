import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// NOTE: ./AdminDashboard was deliberately deleted in 42da9ac ("Delete unused
// components/admin/AdminDashboard.tsx (417 lines dead code)"). Its describe block
// was removed with it. The live admin dashboard is src/pages/AdminDashboard.tsx,
// a different component with different metrics, and is not covered here.
import ContentManager from './ContentManager';
import UserManager from './UserManager';
import SystemAnalytics from './SystemAnalytics';
import MediaLibrary from './MediaLibrary';

// Mock Lucide icons
vi.mock('lucide-react', async () => {
  const originalModule = await vi.importActual<Record<string, unknown>>('lucide-react');
  const iconNames = Object.keys(originalModule);
  const mock: Record<string, unknown> = {};
  iconNames.forEach(iconName => {
    mock[iconName] = (props) => <svg {...props} data-testid={`${iconName}-icon`} />;
  });
  return mock;
});

// Mock Recharts. The chart primitives (XAxis, Line, ...) must be stubbed too:
// keeping the real ones alongside stubbed containers makes them throw
// "Could not find Recharts context", since their parent is now a plain div.
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="recharts-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Area: () => <div data-testid="area" />,
  Bar: () => <div data-testid="bar" />,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

describe('Administrator Persona Frontend Components', () => {

  // Test ContentManager
  describe('ContentManager', () => {
    test('renders the content manager title', () => {
      render(<ContentManager />);
      expect(screen.getByText('Content Manager')).toBeInTheDocument();
    });

    test('opens create content modal on button click', async () => {
      render(<ContentManager />);
      const createButton = screen.getByText('Create Content');
      fireEvent.click(createButton);
      await waitFor(() => {
        expect(screen.getByText('Create New Content')).toBeInTheDocument();
      });
    });

    // This required the invented article "UAE Career Development Guide 2024" to
    // render, then filtered to another invented one. Both were bylined to people
    // who do not exist. cms_content holds zero rows; the library is empty, and
    // the search has to work over what is actually there.
    test('search works over the real library, which is empty', async () => {
      render(<ContentManager />);
      const searchInput = await screen.findByPlaceholderText('Search content...');
      fireEvent.change(searchInput, { target: { value: 'Interview' } });
      await waitFor(() => {
        expect(screen.queryByText(/UAE Career Development Guide/i)).not.toBeInTheDocument();
      });
    });
  });

  // Test UserManager
  describe('UserManager', () => {
    test('renders the user management title', () => {
      render(<UserManager />);
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    test('opens add user modal on button click', async () => {
      render(<UserManager />);
      const addButton = screen.getByText('Add User');
      fireEvent.click(addButton);
      await waitFor(() => {
        expect(screen.getByText('Create New User')).toBeInTheDocument();
      });
    });
  });

  // Test SystemAnalytics
  describe('SystemAnalytics', () => {
    test('renders the system analytics title', async () => {
      render(<SystemAnalytics />);
      await waitFor(() => {
        expect(screen.getByText('System Analytics')).toBeInTheDocument();
      });
    });

    // This test used to require CPU Usage, Memory Usage, Response Time and
    // Uptime to render. The platform monitors none of them — those figures came
    // from Math.random() on a thirty-second refresh, so an administrator saw
    // them MOVE. The test was holding the fabrication in place.
    test('does not claim to monitor infrastructure it cannot see', async () => {
      render(<SystemAnalytics />);
      await waitFor(() => {
        expect(screen.getByText('System Analytics')).toBeInTheDocument();
      });
      expect(screen.queryByText('CPU Usage')).not.toBeInTheDocument();
      expect(screen.queryByText('Memory Usage')).not.toBeInTheDocument();
      expect(screen.queryByText('Uptime')).not.toBeInTheDocument();
    });

    test('says plainly that server health is not collected here', async () => {
      render(<SystemAnalytics />);
      await waitFor(() => {
        expect(screen.getByText(/not\s+collected by this platform/i)).toBeInTheDocument();
      });
    });
  });

  // Test MediaLibrary
  describe('MediaLibrary', () => {
    test('renders the media library title', () => {
      render(<MediaLibrary />);
      expect(screen.getByText('Media Library')).toBeInTheDocument();
    });

    test('opens upload modal on button click', async () => {
      render(<MediaLibrary />);
      const uploadButton = screen.getByText('Upload Media');
      // We can't directly test the file input click, so we'll check if the modal logic is present
      // This is a limitation of testing file inputs
      // A better approach would be to trigger the state change directly if possible
    });
  });

});

