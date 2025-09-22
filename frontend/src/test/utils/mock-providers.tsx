import React from 'react';
import { vi } from 'vitest';
import { mockUser, mockUserRoles, mockMFAStatus } from './mock-data';

// Mock Auth Context
export const mockAuthContext = {
  user: mockUser,
  roles: mockUserRoles,
  loading: false,
  signIn: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
  signUp: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  updateProfile: vi.fn().mockResolvedValue({ error: null }),
};

export const MockAuthProvider = ({ children, value = mockAuthContext }) => (
  <div data-testid="mock-auth-provider">
    {children}
  </div>
);

// Mock Role Context
export const mockRoleContext = {
  roles: mockUserRoles,
  hasRole: vi.fn((role: string) => mockUserRoles.includes(role)),
  isLoading: false,
  refreshRoles: vi.fn(),
};

export const MockRoleProvider = ({ children, value = mockRoleContext }) => (
  <div data-testid="mock-role-provider">
    {children}
  </div>
);

// Mock Theme Context
export const mockThemeContext = {
  theme: 'light' as const,
  setTheme: vi.fn(),
};

export const MockThemeProvider = ({ children, value = mockThemeContext }) => (
  <div data-testid="mock-theme-provider" data-theme={value.theme}>
    {children}
  </div>
);

// Mock MFA Hook
export const mockMFAHook = {
  factors: [],
  activeChallenge: null,
  mfaStatus: mockMFAStatus,
  isLoading: false,
  loadMFAData: vi.fn(),
  createChallenge: vi.fn(),
  verifyChallenge: vi.fn(),
  isMFARequired: vi.fn().mockReturnValue(false),
  requireMFA: vi.fn().mockResolvedValue(true),
  getMFARequirement: vi.fn().mockReturnValue('none'),
};

// Mock Security Hook
export const mockSecurityHook = {
  securityMetrics: {
    suspiciousActivity: 0,
    rateLimitViolations: 0,
    lastSecurityCheck: new Date(),
    securityScore: 100,
  },
  securityEvents: [],
  isMonitoring: false,
  canAccessSecurityData: false,
  checkAuthRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 5, requiresCaptcha: false }),
  checkSensitiveOperationLimit: vi.fn().mockResolvedValue(true),
  validateInput: vi.fn().mockResolvedValue({ valid: true, threats: [] }),
  logSecurityEvent: vi.fn(),
  performSecurityAudit: vi.fn(),
  monitorActivity: vi.fn(),
};

// Mock Supabase
export const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  })),
};
