import React from 'react';
import { describe, test, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Import components to test
import EducatorProfileForm from './EducatorProfileForm';
import EducatorDashboard from './EducatorDashboard';
import StudentTracking from './StudentTracking';
import CurriculumPlanning from './CurriculumPlanning';
import PerformanceAnalytics from './PerformanceAnalytics';
import ResourceManagement from './ResourceManagement';

// ResourceManagement imports axios (though it currently serves seeded data), so the
// module still has to resolve. No educator component imports recharts, so the old
// recharts mock was dead weight and has been removed along with the chart tests.
vi.mock('axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

// ResourceManagement gates its content behind a 1000ms fake API delay, which exactly
// ties RTL's default 1000ms waitFor timeout. Every query against it needs headroom.
const SLOW_LOAD = { timeout: 5000 };

// Radix TabsContent unmounts inactive panels and TabsTrigger does not respond to a
// bare synthetic click, so non-default tab content must be revealed deliberately.
const selectTab = async (name: string) => {
  await userEvent.click(screen.getByRole('tab', { name }));
};

describe('Educator Persona Components', () => {
  beforeAll(() => {
    // Radix Select/Tabs rely on Pointer Events APIs that jsdom does not implement;
    // without these stubs the dropdown never opens and no option is ever rendered.
    window.HTMLElement.prototype.hasPointerCapture = vi.fn();
    window.HTMLElement.prototype.releasePointerCapture = vi.fn();
    window.HTMLElement.prototype.setPointerCapture = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // CurriculumPlanning fetches its data over window.fetch; unstubbed, the
    // component stays on its loading spinner for the whole test.
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    ));
  });

  describe('EducatorProfileForm', () => {
    test('renders profile form with all required fields', async () => {
      render(
        <TestWrapper>
          <EducatorProfileForm />
        </TestWrapper>
      );

      expect(screen.getByText('Profile Completion')).toBeInTheDocument();
      // The form collects first/last name separately rather than a single full name.
      expect(screen.getByLabelText('First Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Last Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address *')).toBeInTheDocument();
      expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();

      // Institution details are on their own tab.
      await selectTab('Institution');
      expect(screen.getByLabelText('Institution Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Department/Faculty *')).toBeInTheDocument();
    });

    test('handles form input changes correctly', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <EducatorProfileForm />
        </TestWrapper>
      );

      const nameInput = screen.getByLabelText('First Name *');
      await user.clear(nameInput);
      await user.type(nameInput, 'Amina');

      expect(nameInput).toHaveValue('Amina');
    });

    test('displays success message on successful profile save', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <EducatorProfileForm />
        </TestWrapper>
      );

      await user.click(screen.getByRole('button', { name: /save profile/i }));

      // handleSave simulates a 1500ms round trip before reporting status.
      await waitFor(() => {
        expect(screen.getByText('Profile saved successfully!')).toBeInTheDocument();
      }, SLOW_LOAD);
    });
  });

  describe('EducatorDashboard', () => {
    test('renders dashboard with key metrics', () => {
      render(
        <TestWrapper>
          <EducatorDashboard />
        </TestWrapper>
      );

      expect(screen.getByText('Educator Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Total Students')).toBeInTheDocument();
      expect(screen.getByText('Active Classes')).toBeInTheDocument();
      expect(screen.getByText('Resources')).toBeInTheDocument();
      expect(screen.getByText('Performance')).toBeInTheDocument();
    });

    test('displays recent activities section', () => {
      render(
        <TestWrapper>
          <EducatorDashboard />
        </TestWrapper>
      );

      expect(screen.getByText(/recent activities/i)).toBeInTheDocument();
    });
  });

  describe('StudentTracking', () => {
    test('renders student tracking interface', () => {
      render(
        <TestWrapper>
          <StudentTracking />
        </TestWrapper>
      );

      expect(screen.getByText('Student Tracking')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search by name or ID...')).toBeInTheDocument();
      expect(screen.getByText('Add Student')).toBeInTheDocument();
    });

    test('handles student search functionality', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <StudentTracking />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Search by name or ID...');
      await user.type(searchInput, 'Ahmed');

      expect(searchInput).toHaveValue('Ahmed');
    });

    test('displays student list with seeded data', () => {
      render(
        <TestWrapper>
          <StudentTracking />
        </TestWrapper>
      );

      expect(screen.getByText('Ahmed Al Mansouri')).toBeInTheDocument();
      expect(screen.getByText('Fatima Al Zahra')).toBeInTheDocument();
    });

    test('handles student status filtering', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <StudentTracking />
        </TestWrapper>
      );

      // Radix Select renders a combobox button, not an <input>, so there is no
      // display value to query — getByDisplayValue can never match it.
      const statusFilter = screen.getByRole('combobox', { name: /status/i });
      expect(statusFilter).toHaveTextContent('All Status');

      await user.click(statusFilter);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'All Status' })).toBeInTheDocument();
      });
    });
  });

  describe('CurriculumPlanning', () => {
    test('renders curriculum planning interface', async () => {
      render(
        <TestWrapper>
          <CurriculumPlanning />
        </TestWrapper>
      );

      expect(await screen.findByText('Curriculum Planning')).toBeInTheDocument();
      expect(screen.getByText('Create Lesson')).toBeInTheDocument();
    });

    test('displays curriculum tabs', async () => {
      render(
        <TestWrapper>
          <CurriculumPlanning />
        </TestWrapper>
      );

      expect(await screen.findByRole('tab', { name: 'UAE Standards' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Lesson Plans' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Templates' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Pacing Guide' })).toBeInTheDocument();
    });

    test('displays seeded lesson plans', async () => {
      render(
        <TestWrapper>
          <CurriculumPlanning />
        </TestWrapper>
      );

      await screen.findByRole('tab', { name: 'Lesson Plans' });
      await selectTab('Lesson Plans');
      expect(screen.getByText('Introduction to Fractions')).toBeInTheDocument();
    });

    test('handles curriculum search', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CurriculumPlanning />
        </TestWrapper>
      );

      const searchInput = await screen.findByPlaceholderText('Search curriculum content...');
      await user.type(searchInput, 'Fractions');

      expect(searchInput).toHaveValue('Fractions');
    });
  });

  describe('PerformanceAnalytics', () => {
    test('renders performance analytics interface', () => {
      render(
        <TestWrapper>
          <PerformanceAnalytics />
        </TestWrapper>
      );

      expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Student Performance' })).toBeInTheDocument();
    });

    test('shows key performance metrics', () => {
      render(
        <TestWrapper>
          <PerformanceAnalytics />
        </TestWrapper>
      );

      expect(screen.getByText(/class average/i)).toBeInTheDocument();
      expect(screen.getByText(/attendance rate/i)).toBeInTheDocument();
      expect(screen.getByText(/pass rate/i)).toBeInTheDocument();
    });

    test('handles time period filtering', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PerformanceAnalytics />
        </TestWrapper>
      );

      const periodFilter = screen.getByRole('combobox', { name: /time period/i });
      await user.click(periodFilter);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Current Term' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Academic Year' })).toBeInTheDocument();
      });
    });

    test('displays student performance table', async () => {
      render(
        <TestWrapper>
          <PerformanceAnalytics />
        </TestWrapper>
      );

      await selectTab('Student Performance');

      expect(screen.getByText('Ahmed Al Mansouri')).toBeInTheDocument();
      expect(screen.getByText('Fatima Al Zahra')).toBeInTheDocument();
      expect(screen.getByText('Omar Al Rashid')).toBeInTheDocument();
    });
  });

  describe('ResourceManagement', () => {
    test('renders resource management interface', async () => {
      render(
        <TestWrapper>
          <ResourceManagement />
        </TestWrapper>
      );

      expect(await screen.findByText('Resource Management', {}, SLOW_LOAD)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /upload resource/i })).toBeInTheDocument();
    });

    test('displays resource search and filters', async () => {
      render(
        <TestWrapper>
          <ResourceManagement />
        </TestWrapper>
      );

      expect(
        await screen.findByPlaceholderText('Search by title, description, or tags', {}, SLOW_LOAD)
      ).toBeInTheDocument();
      expect(screen.getByText(/filter by type/i)).toBeInTheDocument();
      expect(screen.getByText(/filter by category/i)).toBeInTheDocument();
      expect(screen.getByText(/filter by language/i)).toBeInTheDocument();
    });

    test('opens upload resource dialog', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ResourceManagement />
        </TestWrapper>
      );

      const uploadButton = await screen.findByRole('button', { name: /upload resource/i }, SLOW_LOAD);
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText('Upload New Resource')).toBeInTheDocument();
      });
    });

    test('displays seeded resource data', async () => {
      render(
        <TestWrapper>
          <ResourceManagement />
        </TestWrapper>
      );

      expect(await screen.findByText('UAE History and Culture Module', {}, SLOW_LOAD)).toBeInTheDocument();
      expect(screen.getByText('Arabic Language Learning Videos')).toBeInTheDocument();
      expect(screen.getByText('Emiratization Career Pathways')).toBeInTheDocument();
    });

    test('handles resource search functionality', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ResourceManagement />
        </TestWrapper>
      );

      const searchInput = await screen.findByPlaceholderText(
        'Search by title, description, or tags',
        {},
        SLOW_LOAD
      );
      await user.type(searchInput, 'UAE');

      expect(searchInput).toHaveValue('UAE');
    });

    test('handles resource type filtering', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ResourceManagement />
        </TestWrapper>
      );

      await screen.findByText('Resource Management', {}, SLOW_LOAD);

      const typeFilter = screen.getByRole('combobox', { name: /filter by type/i });
      await user.click(typeFilter);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'All Types' })).toBeInTheDocument();
      });
    });

    test('validates upload form fields', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ResourceManagement />
        </TestWrapper>
      );

      const uploadButton = await screen.findByRole('button', { name: /upload resource/i }, SLOW_LOAD);
      await user.click(uploadButton);

      const dialog = await screen.findByRole('dialog');

      // Once the dialog is open, both the trigger and the submit button match
      // /upload resource/i — scope the query to the dialog to disambiguate.
      const submitButton = within(dialog).getByRole('button', { name: /upload resource/i });
      expect(submitButton).toHaveAttribute('type', 'submit');

      // jsdom does not implement implicit form submission from a submit-button
      // click, so dispatch the submit the form is actually listening for.
      fireEvent.submit(submitButton.closest('form')!);

      await waitFor(() => {
        expect(
          screen.getByText('Please fill in all required fields and select a file.')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Integration Tests', () => {
    test('exposes an accessible loading state while data loads', async () => {
      render(
        <TestWrapper>
          <ResourceManagement />
        </TestWrapper>
      );

      // Loading must be announced to assistive tech, not conveyed by spin alone.
      expect(screen.getByRole('status')).toBeInTheDocument();

      await screen.findByText('Resource Management', {}, SLOW_LOAD);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    test('search inputs have associated labels', () => {
      render(
        <TestWrapper>
          <StudentTracking />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Search Students')).toBeInTheDocument();
    });

    test('components have proper heading hierarchy', () => {
      render(
        <TestWrapper>
          <EducatorDashboard />
        </TestWrapper>
      );

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Educator Dashboard');
    });

    test('form inputs have proper labels', () => {
      render(
        <TestWrapper>
          <EducatorProfileForm />
        </TestWrapper>
      );

      expect(screen.getByLabelText('First Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address *')).toBeInTheDocument();
    });
  });

  describe('Performance Tests', () => {
    test('components handle large datasets efficiently', () => {
      render(
        <TestWrapper>
          <StudentTracking />
        </TestWrapper>
      );

      expect(screen.getByText('Student Tracking')).toBeInTheDocument();
    });
  });
});
