import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

// Create mock functions at module scope
const mockSignOut = vi.fn().mockResolvedValue(undefined);
const mockGetUserRole = vi.fn(() => 'candidate');
const mockSwitchRole = vi.fn();

// Mock useAuth
vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: mockSignOut,
    refreshUser: vi.fn(),
    setUser: vi.fn(),
    getUserRole: mockGetUserRole,
    hasRole: vi.fn(() => false),
    switchRole: mockSwitchRole,
  })),
}));

// Mock the language context
vi.mock('@/context/EnhancedLanguageContext', () => ({
  useLanguage: vi.fn(() => ({
    language: 'en',
    isRTL: false,
    toggleLanguage: vi.fn(),
    setLanguage: vi.fn(),
    t: (key: string) => key,
  })),
}));

// Mock types/auth
vi.mock('@/types/auth', () => ({
  getDashboardRoute: vi.fn(() => '/candidate-dashboard'),
  UserRole: {},
  normalizeRole: (role: string) => role?.toLowerCase().replace(/\s+/g, '_') || '',
  ROLE_DISPLAY_NAMES: {
    job_seeker: 'Job Seeker',
    recruiter: 'Recruiter',
    student: 'Student',
    hr_manager: 'HR Manager',
  } as Record<string, string>,
  ROLE_DASHBOARD_MAP: {} as Record<string, string>,
}));

// Mock nameUtils
vi.mock('@/utils/nameUtils', () => ({
  getDisplayName: vi.fn((user: any, fallback?: string) => {
    if (!user) return fallback || 'User';
    return user.full_name || user.first_name || user.email || fallback || 'User';
  }),
}));

import { useAuth } from '@/context/AuthContext';
import UserMenu from '@/components/layout/UserMenu';

const renderUserMenu = () => {
  return render(
    <MemoryRouter>
      <UserMenu />
    </MemoryRouter>
  );
};

const createMockAuth = (overrides: any = {}) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: mockSignOut,
  refreshUser: vi.fn(),
  setUser: vi.fn(),
  getUserRole: mockGetUserRole,
  hasRole: vi.fn(() => false),
  switchRole: mockSwitchRole,
  ...overrides,
});

describe('UserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders Sign In button when user is not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue(createMockAuth());

    renderUserMenu();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  test('renders avatar button when user is authenticated', () => {
    vi.mocked(useAuth).mockReturnValue(createMockAuth({
      user: {
        id: 1,
        email: 'ahmed@example.com',
        full_name: 'Ahmed Al Maktoum',
        user_type: 'candidate',
      },
      isAuthenticated: true,
    }));

    renderUserMenu();
    // Avatar button should be rendered (it's a DropdownMenuTrigger)
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    // The getInitials logic for "Ahmed Al Maktoum" splits by space:
    // ["Ahmed", "Al", "Maktoum"] → first chars → "AAM" → slice(0,2) → "AA"
    expect(screen.getByText('AA')).toBeInTheDocument();
  });

  test('renders initials from full_name', () => {
    vi.mocked(useAuth).mockReturnValue(createMockAuth({
      user: {
        id: 1,
        email: 'fatima@example.com',
        full_name: 'Fatima Bin Rashid',
        user_type: 'candidate',
      },
      isAuthenticated: true,
    }));

    renderUserMenu();
    // "Fatima Bin Rashid" → F, B, R → "FBR" → slice(0,2) → "FB"
    expect(screen.getByText('FB')).toBeInTheDocument();
  });

  test('opens dropdown menu on pointer interaction', async () => {
    vi.mocked(useAuth).mockReturnValue(createMockAuth({
      user: {
        id: 1,
        email: 'test@example.com',
        full_name: 'Test User',
        user_type: 'candidate',
      },
      isAuthenticated: true,
    }));

    renderUserMenu();

    const button = screen.getByRole('button');

    // Radix dropdown uses pointerdown, not click
    await act(async () => {
      fireEvent.pointerDown(button, { pointerType: 'mouse', button: 0 });
    });

    // Wait for the dropdown content to appear
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Should also show email
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  test('dropdown shows Sign out option', async () => {
    vi.mocked(useAuth).mockReturnValue(createMockAuth({
      user: {
        id: 1,
        email: 'test@example.com',
        full_name: 'Test User',
        user_type: 'candidate',
      },
      isAuthenticated: true,
    }));

    renderUserMenu();

    // Open dropdown
    const button = screen.getByRole('button');
    await act(async () => {
      fireEvent.pointerDown(button, { pointerType: 'mouse', button: 0 });
    });

    await waitFor(() => {
      expect(screen.getByText('Sign out')).toBeInTheDocument();
    });
  });

  test('sign out menu item calls signOut function', async () => {
    vi.mocked(useAuth).mockReturnValue(createMockAuth({
      user: {
        id: 1,
        email: 'test@example.com',
        full_name: 'Test User',
        user_type: 'candidate',
      },
      isAuthenticated: true,
    }));

    renderUserMenu();

    // Open dropdown
    const button = screen.getByRole('button');
    await act(async () => {
      fireEvent.pointerDown(button, { pointerType: 'mouse', button: 0 });
    });

    await waitFor(() => {
      expect(screen.getByText('Sign out')).toBeInTheDocument();
    });

    // Click sign out
    const signOutItem = screen.getByText('Sign out');
    await act(async () => {
      fireEvent.click(signOutItem);
    });

    expect(mockSignOut).toHaveBeenCalled();
  });

  test('dropdown shows Profile and Dashboard menu items', async () => {
    vi.mocked(useAuth).mockReturnValue(createMockAuth({
      user: {
        id: 1,
        email: 'test@example.com',
        full_name: 'Test User',
        user_type: 'candidate',
      },
      isAuthenticated: true,
    }));

    renderUserMenu();

    // Open dropdown
    const button = screen.getByRole('button');
    await act(async () => {
      fireEvent.pointerDown(button, { pointerType: 'mouse', button: 0 });
    });

    await waitFor(() => {
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  test('renders email-based fallback initials when getDisplayName returns email', () => {
    vi.mocked(useAuth).mockReturnValue(createMockAuth({
      user: {
        id: 1,
        email: 'zayed@example.com',
        user_type: 'candidate',
      },
      isAuthenticated: true,
      getUserRole: () => 'candidate',
    }));

    renderUserMenu();
    // getDisplayName(user) returns 'zayed@example.com' (email fallback from mock)
    // getInitials sees displayName = 'zayed@example.com', which is not 'User'
    // splits by space → ['zayed@example.com'] → first char → 'Z'
    // So the avatar shows "Z"
    expect(screen.getByText('Z')).toBeInTheDocument();
  });
});
