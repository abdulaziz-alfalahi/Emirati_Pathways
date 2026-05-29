import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';

// Mock authService
vi.mock('@/services/authService', () => ({
  authService: {
    isAuthenticated: vi.fn(() => false),
    getUser: vi.fn(() => null),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn().mockResolvedValue({ success: true }),
    getProfile: vi.fn(),
    clearAuth: vi.fn(),
    getToken: vi.fn(() => null),
    getUserRole: vi.fn().mockResolvedValue(null),
    getUserRoles: vi.fn(),
  },
  default: {
    isAuthenticated: vi.fn(() => false),
    getUser: vi.fn(() => null),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn().mockResolvedValue({ success: true }),
    getProfile: vi.fn(),
    clearAuth: vi.fn(),
    getToken: vi.fn(() => null),
    getUserRole: vi.fn().mockResolvedValue(null),
    getUserRoles: vi.fn(),
  },
}));

// Mock types/auth
vi.mock('@/types/auth', () => ({
  normalizeRole: (role: string) => role?.toLowerCase().replace(/\s+/g, '_') || '',
  ROLE_DASHBOARD_MAP: {} as Record<string, string>,
}));

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';

// Helper component that renders auth state
const AuthConsumer: React.FC = () => {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="is-authenticated">{String(auth.isAuthenticated)}</span>
      <span data-testid="user">{auth.user ? JSON.stringify(auth.user) : 'null'}</span>
      <span data-testid="is-loading">{String(auth.isLoading)}</span>
      <button data-testid="sign-out" onClick={() => auth.signOut()}>
        Sign Out
      </button>
    </div>
  );
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <MemoryRouter>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(authService.isAuthenticated).mockReturnValue(false);
    vi.mocked(authService.getUser).mockReturnValue(null);
  });

  test('AuthProvider renders children', () => {
    renderWithProviders(<div data-testid="child">Hello</div>);
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  test('provides default unauthenticated state', async () => {
    renderWithProviders(<AuthConsumer />);

    // Wait for isLoading to settle (initializeAuth runs on mount)
    await act(async () => {
      // Allow any pending promises to resolve
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('null');
  });

  test('useAuth hook returns expected shape', async () => {
    let authValue: any = null;

    const Capture: React.FC = () => {
      authValue = useAuth();
      return null;
    };

    renderWithProviders(<Capture />);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(authValue).toBeDefined();
    expect(authValue).toHaveProperty('user');
    expect(authValue).toHaveProperty('isAuthenticated');
    expect(authValue).toHaveProperty('isLoading');
    expect(authValue).toHaveProperty('signIn');
    expect(authValue).toHaveProperty('signUp');
    expect(authValue).toHaveProperty('signOut');
    expect(authValue).toHaveProperty('refreshUser');
    expect(authValue).toHaveProperty('setUser');
    expect(authValue).toHaveProperty('getUserRole');
    expect(authValue).toHaveProperty('hasRole');
    expect(authValue).toHaveProperty('switchRole');
    expect(typeof authValue.signIn).toBe('function');
    expect(typeof authValue.signOut).toBe('function');
    expect(typeof authValue.getUserRole).toBe('function');
  });

  test('useAuth throws when used outside AuthProvider', () => {
    const BadComponent: React.FC = () => {
      useAuth();
      return null;
    };

    // Suppress the error boundary console output
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      render(
        <MemoryRouter>
          <BadComponent />
        </MemoryRouter>
      );
    }).toThrow('useAuth must be used within an AuthProvider');
    spy.mockRestore();
  });

  test('signOut calls authService.logout and clears state', async () => {
    // Start with authenticated user
    const mockUser = { id: 1, email: 'test@test.com', user_type: 'job_seeker' };
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getUser).mockReturnValue(mockUser);
    vi.mocked(authService.getProfile).mockRejectedValue(new Error('skip'));

    renderWithProviders(<AuthConsumer />);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // Click sign out
    await act(async () => {
      screen.getByTestId('sign-out').click();
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(authService.logout).toHaveBeenCalled();
    expect(authService.clearAuth).toHaveBeenCalled();
  });

  test('provides authenticated state when user exists', async () => {
    const mockUser = { id: 1, email: 'test@test.com', user_type: 'job_seeker' };
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getUser).mockReturnValue(mockUser);
    vi.mocked(authService.getProfile).mockRejectedValue(new Error('skip'));

    renderWithProviders(<AuthConsumer />);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(screen.getByTestId('user')).not.toHaveTextContent('null');
  });
});
