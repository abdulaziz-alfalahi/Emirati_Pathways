import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock tokenUtils
vi.mock('@/utils/tokenUtils', () => ({
  getAuthToken: vi.fn(() => null),
  clearAuthTokens: vi.fn(),
  getAuthHeaders: vi.fn(() => ({ 'Content-Type': 'application/json' })),
}));

// Mock @/types/auth to provide ROLE_DASHBOARD_MAP
vi.mock('@/types/auth', () => ({
  ROLE_DASHBOARD_MAP: {
    job_seeker: '/candidate-dashboard',
    candidate: '/candidate-dashboard',
    student: '/student-dashboard',
    hr_manager: '/hr-dashboard',
    recruiter: '/recruiter',
    educator: '/educator-dashboard',
    mentor: '/mentor-dashboard',
    assessor: '/assessor-dashboard',
    guardian: '/guardian-dashboard',
  } as Record<string, string>,
  UserRole: {},
  normalizeRole: (role: string) => role?.toLowerCase().replace(/\s+/g, '_') || '',
}));

import { authService, AVAILABLE_ROLES } from '@/services/authService';
import { getAuthToken, clearAuthTokens } from '@/utils/tokenUtils';

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('AVAILABLE_ROLES', () => {
    test('is an array with expected role entries', () => {
      expect(Array.isArray(AVAILABLE_ROLES)).toBe(true);
      expect(AVAILABLE_ROLES.length).toBeGreaterThanOrEqual(6);
    });

    test('contains job_seeker role', () => {
      const jobSeeker = AVAILABLE_ROLES.find(r => r.id === 'candidate');
      expect(jobSeeker).toBeDefined();
      expect(jobSeeker!.name).toBe('Job Seeker');
      expect(jobSeeker!.dashboard).toBe('/candidate-dashboard');
    });

    test('contains recruiter role', () => {
      const recruiter = AVAILABLE_ROLES.find(r => r.id === 'recruiter');
      expect(recruiter).toBeDefined();
      expect(recruiter!.name).toBe('Recruiter');
    });

    test('contains student role', () => {
      const student = AVAILABLE_ROLES.find(r => r.id === 'candidate');
      expect(student).toBeDefined();
      expect(student!.name).toBe('Student');
      expect(student!.dashboard).toBe('/student-dashboard');
    });

    test('contains hr_manager role', () => {
      const hr = AVAILABLE_ROLES.find(r => r.id === 'employer_admin');
      expect(hr).toBeDefined();
      expect(hr!.name).toBe('HR Manager');
    });

    test('contains educator, mentor, assessor, guardian roles', () => {
      const roleIds = AVAILABLE_ROLES.map(r => r.id);
      expect(roleIds).toContain('training_provider');
      expect(roleIds).toContain('mentor');
      expect(roleIds).toContain('assessor');
      expect(roleIds).toContain('parent');
    });

    test('each role has id, name, description, and dashboard', () => {
      for (const role of AVAILABLE_ROLES) {
        expect(role.id).toBeTruthy();
        expect(role.name).toBeTruthy();
        expect(role.description).toBeTruthy();
        expect(role.dashboard).toBeTruthy();
      }
    });
  });

  describe('isAuthenticated', () => {
    test('returns false when no token and no user', () => {
      vi.mocked(getAuthToken).mockReturnValue(null);
      expect(authService.isAuthenticated()).toBe(false);
    });

    test('returns true when token exists and user is stored', () => {
      vi.mocked(getAuthToken).mockReturnValue('valid-token');
      localStorage.setItem('user', JSON.stringify({ id: 1, email: 'test@test.com' }));
      expect(authService.isAuthenticated()).toBe(true);
    });

    test('returns false when token exists but no user stored', () => {
      vi.mocked(getAuthToken).mockReturnValue('valid-token');
      // no user in localStorage
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getUser', () => {
    test('returns null when no user in localStorage', () => {
      expect(authService.getUser()).toBeNull();
    });

    test('returns parsed user object from localStorage', () => {
      const mockUser = { id: 1, email: 'test@test.com', user_type: 'candidate' };
      localStorage.setItem('user', JSON.stringify(mockUser));
      expect(authService.getUser()).toEqual(mockUser);
    });

    test('returns null for "undefined" string in localStorage', () => {
      localStorage.setItem('user', 'undefined');
      expect(authService.getUser()).toBeNull();
    });

    test('returns null for "null" string in localStorage', () => {
      localStorage.setItem('user', 'null');
      expect(authService.getUser()).toBeNull();
    });

    test('returns null and clears storage for invalid JSON', () => {
      localStorage.setItem('user', 'invalid-json{{{');
      const result = authService.getUser();
      expect(result).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('getToken', () => {
    test('delegates to getAuthToken', () => {
      vi.mocked(getAuthToken).mockReturnValue('my-token');
      expect(authService.getToken()).toBe('my-token');
    });
  });

  describe('clearAuth', () => {
    test('calls clearAuthTokens and removes user from localStorage', () => {
      localStorage.setItem('user', JSON.stringify({ id: 1 }));
      authService.clearAuth();
      expect(clearAuthTokens).toHaveBeenCalled();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('getAuthHeaders', () => {
    test('includes Content-Type header', () => {
      vi.mocked(getAuthToken).mockReturnValue(null);
      const headers = authService.getAuthHeaders();
      expect(headers['Content-Type']).toBe('application/json');
    });

    test('includes Authorization header when token exists', () => {
      vi.mocked(getAuthToken).mockReturnValue('abc123');
      const headers = authService.getAuthHeaders();
      expect(headers['Authorization']).toBe('Bearer abc123');
    });

    test('does not include Authorization header when no token', () => {
      vi.mocked(getAuthToken).mockReturnValue(null);
      const headers = authService.getAuthHeaders();
      expect(headers['Authorization']).toBeUndefined();
    });
  });

  describe('getUserRole', () => {
    test('returns role from stored user with roles array', async () => {
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'test@test.com',
        roles: ['employer_admin'],
      }));
      const role = await authService.getUserRole();
      expect(role).toBe('employer_admin');
    });

    test('returns role from stored user with user_type field', async () => {
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'test@test.com',
        user_type: 'candidate',
      }));
      const role = await authService.getUserRole();
      expect(role).toBe('candidate');
    });

    test('returns null when no user data exists', async () => {
      vi.mocked(getAuthToken).mockReturnValue(null);
      const role = await authService.getUserRole();
      expect(role).toBeNull();
    });
  });

  describe('getRoleMetadata', () => {
    test('returns metadata for valid role id', () => {
      const metadata = authService.getRoleMetadata('candidate');
      expect(metadata).toBeDefined();
      expect(metadata!.name).toBe('Job Seeker');
    });

    test('returns undefined for unknown role id', () => {
      const metadata = authService.getRoleMetadata('nonexistent_role');
      expect(metadata).toBeUndefined();
    });
  });

  describe('getAvailableRoles', () => {
    test('returns the AVAILABLE_ROLES array', () => {
      const roles = authService.getAvailableRoles();
      expect(roles).toBe(AVAILABLE_ROLES);
    });
  });

  describe('hasRole', () => {
    test('returns true when user has the target role', async () => {
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'test@test.com',
        user_type: 'recruiter',
      }));
      const result = await authService.hasRole('recruiter');
      expect(result).toBe(true);
    });

    test('returns false when user has a different role', async () => {
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'test@test.com',
        user_type: 'candidate',
      }));
      const result = await authService.hasRole('recruiter');
      expect(result).toBe(false);
    });
  });
});
