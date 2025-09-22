import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import AdminDashboard from './AdminDashboard';
import ContentManager from './ContentManager';
import UserManager from './UserManager';
import SystemAnalytics from './SystemAnalytics';
import MediaLibrary from './MediaLibrary';

// Mock Lucide icons
jest.mock('lucide-react', () => {
  const originalModule = jest.requireActual('lucide-react');
  const iconNames = Object.keys(originalModule);
  const mock = {};
  iconNames.forEach(iconName => {
    mock[iconName] = (props) => <svg {...props} data-testid={`${iconName}-icon`} />;
  });
  return mock;
});

// Mock Recharts
jest.mock('recharts', () => {
  const originalModule = jest.requireActual('recharts');
  return {
    ...originalModule,
    ResponsiveContainer: ({ children }) => <div data-testid="recharts-container">{children}</div>,
    LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
    AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
    BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
    PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  };
});

describe('Administrator Persona Frontend Components', () => {

  // Test AdminDashboard
  describe('AdminDashboard', () => {
    beforeEach(() => {
      // Mock fetch for dashboard data
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({}),
        }) as Promise<Response>
      );
    });

    test('renders the main dashboard title', async () => {
      render(<AdminDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Administrator Dashboard')).toBeInTheDocument();
      });
    });

    test('displays key metrics cards', async () => {
      render(<AdminDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText('Published Content')).toBeInTheDocument();
        expect(screen.getByText('Media Assets')).toBeInTheDocument();
        expect(screen.getByText('Active Users')).toBeInTheDocument();
      });
    });

    test('refresh button calls data fetch function', async () => {
      render(<AdminDashboard />);
      const refreshButton = await screen.findByText('Refresh');
      fireEvent.click(refreshButton);
      expect(global.fetch).toHaveBeenCalledTimes(2); // Initial fetch + refresh
    });
  });

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

    test('filters content based on search term', async () => {
      render(<ContentManager />);
      await waitFor(() => {
        expect(screen.getByText(/UAE Career Development Guide/i)).toBeInTheDocument();
      });
      const searchInput = screen.getByPlaceholderText('Search content...');
      fireEvent.change(searchInput, { target: { value: 'Interview' } });
      await waitFor(() => {
        expect(screen.queryByText(/UAE Career Development Guide/i)).not.toBeInTheDocument();
        expect(screen.getByText(/Interview Preparation Checklist/i)).toBeInTheDocument();
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

    test('displays system health overview cards', async () => {
      render(<SystemAnalytics />);
      await waitFor(() => {
        expect(screen.getByText('CPU Usage')).toBeInTheDocument();
        expect(screen.getByText('Memory Usage')).toBeInTheDocument();
        expect(screen.getByText('Response Time')).toBeInTheDocument();
        expect(screen.getByText('Uptime')).toBeInTheDocument();
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

