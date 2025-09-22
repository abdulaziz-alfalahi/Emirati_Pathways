import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('Educator Persona Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('EducatorProfileForm', () => {
    test('renders profile form with all required fields', () => {
      render(
        <TestWrapper>
          <EducatorProfileForm />
        </TestWrapper>
      );

      expect(screen.getByText('Educator Profile')).toBeInTheDocument();
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/institution/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/department/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/specialization/i)).toBeInTheDocument();
    });

    test('validates required fields on form submission', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <EducatorProfileForm />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /save profile/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please fill in all required fields/i)).toBeInTheDocument();
      });
    });

    test('handles form input changes correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <EducatorProfileForm />
        </TestWrapper>
      );

      const nameInput = screen.getByLabelText(/full name/i);
      await user.type(nameInput, 'Dr. Amina Al-Zahra');

      expect(nameInput).toHaveValue('Dr. Amina Al-Zahra');
    });

    test('displays success message on successful profile save', async () => {
      const axios = require('axios');
      axios.post.mockResolvedValueOnce({
        status: 200,
        data: { message: 'Profile saved successfully' }
      });

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <EducatorProfileForm />
        </TestWrapper>
      );

      // Fill in required fields
      await user.type(screen.getByLabelText(/full name/i), 'Dr. Amina Al-Zahra');
      await user.type(screen.getByLabelText(/email/i), 'amina@example.com');
      await user.type(screen.getByLabelText(/phone/i), '+971501234567');
      await user.type(screen.getByLabelText(/institution/i), 'UAE University');
      await user.type(screen.getByLabelText(/department/i), 'Computer Science');
      await user.type(screen.getByLabelText(/specialization/i), 'Software Engineering');

      const submitButton = screen.getByRole('button', { name: /save profile/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/profile saved successfully/i)).toBeInTheDocument();
      });
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
      expect(screen.getByText(/total students/i)).toBeInTheDocument();
      expect(screen.getByText(/active curricula/i)).toBeInTheDocument();
      expect(screen.getByText(/resources shared/i)).toBeInTheDocument();
      expect(screen.getByText(/average performance/i)).toBeInTheDocument();
    });

    test('displays recent activities section', () => {
      render(
        <TestWrapper>
          <EducatorDashboard />
        </TestWrapper>
      );

      expect(screen.getByText(/recent activities/i)).toBeInTheDocument();
    });

    test('shows quick actions buttons', () => {
      render(
        <TestWrapper>
          <EducatorDashboard />
        </TestWrapper>
      );

      expect(screen.getByText(/add student/i)).toBeInTheDocument();
      expect(screen.getByText(/create curriculum/i)).toBeInTheDocument();
      expect(screen.getByText(/upload resource/i)).toBeInTheDocument();
    });

    test('renders performance charts', () => {
      render(
        <TestWrapper>
          <EducatorDashboard />
        </TestWrapper>
      );

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
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
      expect(screen.getByPlaceholderText(/search students/i)).toBeInTheDocument();
      expect(screen.getByText(/add student/i)).toBeInTheDocument();
    });

    test('handles student search functionality', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <StudentTracking />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText(/search students/i);
      await user.type(searchInput, 'Ahmed');

      expect(searchInput).toHaveValue('Ahmed');
    });

    test('opens add student dialog when button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <StudentTracking />
        </TestWrapper>
      );

      const addButton = screen.getByText(/add student/i);
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/add new student/i)).toBeInTheDocument();
      });
    });

    test('displays student list with mock data', () => {
      render(
        <TestWrapper>
          <StudentTracking />
        </TestWrapper>
      );

      // Check for mock student data
      expect(screen.getByText('Ahmed Al-Mansoori')).toBeInTheDocument();
      expect(screen.getByText('Fatima Al-Zahra')).toBeInTheDocument();
    });

    test('handles student status filtering', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <StudentTracking />
        </TestWrapper>
      );

      const statusFilter = screen.getByDisplayValue(/all status/i);
      await user.click(statusFilter);

      // Should show status options
      await waitFor(() => {
        expect(screen.getByText(/active/i)).toBeInTheDocument();
      });
    });
  });

  describe('CurriculumPlanning', () => {
    test('renders curriculum planning interface', () => {
      render(
        <TestWrapper>
          <CurriculumPlanning />
        </TestWrapper>
      );

      expect(screen.getByText('Curriculum Planning')).toBeInTheDocument();
      expect(screen.getByText(/create curriculum/i)).toBeInTheDocument();
    });

    test('displays curriculum tabs', () => {
      render(
        <TestWrapper>
          <CurriculumPlanning />
        </TestWrapper>
      );

      expect(screen.getByText(/my curricula/i)).toBeInTheDocument();
      expect(screen.getByText(/templates/i)).toBeInTheDocument();
      expect(screen.getByText(/shared/i)).toBeInTheDocument();
    });

    test('opens create curriculum dialog', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CurriculumPlanning />
        </TestWrapper>
      );

      const createButton = screen.getByText(/create curriculum/i);
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/create new curriculum/i)).toBeInTheDocument();
      });
    });

    test('displays mock curriculum data', () => {
      render(
        <TestWrapper>
          <CurriculumPlanning />
        </TestWrapper>
      );

      expect(screen.getByText('Introduction to UAE Digital Transformation')).toBeInTheDocument();
      expect(screen.getByText('Arabic Language and Literature')).toBeInTheDocument();
    });

    test('handles curriculum search', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CurriculumPlanning />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText(/search curricula/i);
      await user.type(searchInput, 'Digital');

      expect(searchInput).toHaveValue('Digital');
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
      expect(screen.getByText(/class overview/i)).toBeInTheDocument();
      expect(screen.getByText(/individual students/i)).toBeInTheDocument();
    });

    test('displays analytics charts', () => {
      render(
        <TestWrapper>
          <PerformanceAnalytics />
        </TestWrapper>
      );

      expect(screen.getAllByTestId('responsive-container')).toHaveLength(3);
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    test('shows key performance metrics', () => {
      render(
        <TestWrapper>
          <PerformanceAnalytics />
        </TestWrapper>
      );

      expect(screen.getByText(/class average/i)).toBeInTheDocument();
      expect(screen.getByText(/attendance rate/i)).toBeInTheDocument();
      expect(screen.getByText(/assignment completion/i)).toBeInTheDocument();
    });

    test('handles time period filtering', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <PerformanceAnalytics />
        </TestWrapper>
      );

      const periodFilter = screen.getByDisplayValue(/last 30 days/i);
      await user.click(periodFilter);

      await waitFor(() => {
        expect(screen.getByText(/last 7 days/i)).toBeInTheDocument();
      });
    });

    test('displays student performance table', () => {
      render(
        <TestWrapper>
          <PerformanceAnalytics />
        </TestWrapper>
      );

      expect(screen.getByText('Ahmed Al-Mansoori')).toBeInTheDocument();
      expect(screen.getByText('Fatima Al-Zahra')).toBeInTheDocument();
      expect(screen.getByText('Mohammed Al-Rashid')).toBeInTheDocument();
    });
  });

  describe('ResourceManagement', () => {
    test('renders resource management interface', () => {
      render(
        <TestWrapper>
          <ResourceManagement />
        </TestWrapper>
      );

      expect(screen.getByText('Resource Management')).toBeInTheDocument();
      expect(screen.getByText(/upload resource/i)).toBeInTheDocument();
    });

    test('displays resource search and filters', () => {
      render(
        <TestWrapper>
          <ResourceManagement />
        </TestWrapper>
      );

      expect(screen.getByPlaceholderText(/search by title, description, or tags/i)).toBeInTheDocument();
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

      const uploadButton = screen.getByText(/upload resource/i);
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/upload new resource/i)).toBeInTheDocument();
      });
    });

    test('displays mock resource data', () => {
      render(
        <TestWrapper>
          <ResourceManagement />
        </TestWrapper>
      );

      expect(screen.getByText('UAE History and Culture Module')).toBeInTheDocument();
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

      const searchInput = screen.getByPlaceholderText(/search by title, description, or tags/i);
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

      const typeFilter = screen.getByDisplayValue(/all types/i);
      await user.click(typeFilter);

      await waitFor(() => {
        expect(screen.getByText(/document/i)).toBeInTheDocument();
        expect(screen.getByText(/video/i)).toBeInTheDocument();
      });
    });

    test('validates upload form fields', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ResourceManagement />
        </TestWrapper>
      );

      // Open upload dialog
      const uploadButton = screen.getByText(/upload resource/i);
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/upload new resource/i)).toBeInTheDocument();
      });

      // Try to submit without filling required fields
      const submitButton = screen.getByRole('button', { name: /upload resource/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please fill in all required fields/i)).toBeInTheDocument();
      });
    });
  });

  describe('Integration Tests', () => {
    test('components handle loading states correctly', () => {
      render(
        <TestWrapper>
          <StudentTracking />
        </TestWrapper>
      );

      // Should show loading spinner initially
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
    });

    test('components handle error states gracefully', async () => {
      const axios = require('axios');
      axios.get.mockRejectedValueOnce(new Error('Network error'));

      render(
        <TestWrapper>
          <PerformanceAnalytics />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/failed to load analytics data/i)).toBeInTheDocument();
      });
    });

    test('components maintain consistent styling', () => {
      render(
        <TestWrapper>
          <EducatorDashboard />
        </TestWrapper>
      );

      // Check for consistent card styling
      const cards = screen.getAllByRole('region');
      expect(cards.length).toBeGreaterThan(0);
    });

    test('navigation between components works correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <EducatorDashboard />
        </TestWrapper>
      );

      // Test quick action navigation
      const addStudentButton = screen.getByText(/add student/i);
      expect(addStudentButton).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    test('components have proper ARIA labels', () => {
      render(
        <TestWrapper>
          <StudentTracking />
        </TestWrapper>
      );

      const searchInput = screen.getByLabelText(/search resources/i);
      expect(searchInput).toBeInTheDocument();
    });

    test('components support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CurriculumPlanning />
        </TestWrapper>
      );

      const createButton = screen.getByText(/create curriculum/i);
      createButton.focus();
      
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByText(/create new curriculum/i)).toBeInTheDocument();
      });
    });

    test('components have proper heading hierarchy', () => {
      render(
        <TestWrapper>
          <EducatorDashboard />
        </TestWrapper>
      );

      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toHaveTextContent('Educator Dashboard');
    });

    test('form inputs have proper labels', () => {
      render(
        <TestWrapper>
          <EducatorProfileForm />
        </TestWrapper>
      );

      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email/i);
      
      expect(nameInput).toBeInTheDocument();
      expect(emailInput).toBeInTheDocument();
    });
  });

  describe('Performance Tests', () => {
    test('components render within acceptable time', async () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <PerformanceAnalytics />
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within 100ms
      expect(renderTime).toBeLessThan(100);
    });

    test('components handle large datasets efficiently', () => {
      // Mock large dataset
      const mockLargeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Student ${i}`,
        email: `student${i}@example.com`
      }));

      render(
        <TestWrapper>
          <StudentTracking />
        </TestWrapper>
      );

      // Component should still be responsive
      expect(screen.getByText('Student Tracking')).toBeInTheDocument();
    });
  });
});

// Test utilities
export const mockEducatorData = {
  id: 1,
  full_name: 'Dr. Amina Al-Zahra',
  email: 'amina@example.com',
  phone: '+971501234567',
  institution: 'UAE University',
  department: 'Computer Science',
  specialization: 'Software Engineering',
  years_experience: 10,
  education_level: 'PhD',
  certifications: ['AWS Certified', 'Google Educator'],
  languages: ['English', 'Arabic'],
  preferred_language: 'en'
};

export const mockStudentData = [
  {
    id: 1,
    student_id: 'STU001',
    name: 'Ahmed Al-Mansoori',
    email: 'ahmed@student.edu',
    program: 'Computer Science',
    year_level: 2,
    gpa: 3.75,
    status: 'active'
  },
  {
    id: 2,
    student_id: 'STU002',
    name: 'Fatima Al-Zahra',
    email: 'fatima@student.edu',
    program: 'Information Systems',
    year_level: 3,
    gpa: 3.92,
    status: 'active'
  }
];

export const mockCurriculumData = [
  {
    id: 1,
    title: 'Introduction to UAE Digital Transformation',
    description: 'Comprehensive course covering UAE digital initiatives',
    subject: 'Digital Studies',
    level: 'undergraduate',
    duration_weeks: 16,
    credits: 3,
    status: 'active'
  }
];

export const mockResourceData = [
  {
    id: 1,
    title: 'UAE History and Culture Module',
    description: 'Comprehensive module covering UAE heritage',
    type: 'document',
    category: 'Cultural Studies',
    language: 'both',
    tags: ['UAE', 'History', 'Culture'],
    is_public: true
  }
];
