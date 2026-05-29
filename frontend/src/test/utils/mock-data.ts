import { vi } from 'vitest';
import { User } from '@/integrations/supabase/auth-types';
import { MFAFactor, MFAStatus } from '@/types/mfa';

// Mock user data
export const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  aud: 'authenticated',
  role: 'authenticated',
  confirmation_sent_at: null,
  confirmed_at: '2023-01-01T00:00:00Z',
  last_sign_in_at: '2023-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {},
  identities: [],
  factors: [],
  phone: null,
  email_confirmed_at: '2023-01-01T00:00:00Z',
  phone_confirmed_at: null,
  recovery_sent_at: null,
  new_email: null,
  invited_at: null,
  action_link: null,
  email_change_sent_at: null,
  new_phone: null,
};

export const mockAdminUser: User = {
  ...mockUser,
  id: 'admin-user-id',
  email: 'admin@example.com',
};

// Mock roles
export const mockUserRoles = ['user'];
export const mockAdminRoles = ['administrator', 'user'];

// Mock MFA data
export const mockMFAFactor: MFAFactor = {
  id: 'test-factor-id',
  factor_type: 'totp',
  friendly_name: 'Test Authenticator',
  status: 'verified',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

export const mockMFAStatus: MFAStatus = {
  enabled: true,
  required: false,
  setup_required: false,
  available_methods: ['totp', 'sms'],
  verified_factors: [mockMFAFactor],
};

// Mock form data
export const mockPersonalInfo = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  location: 'New York, NY',
};

export const mockExperience = {
  company: 'Tech Corp',
  position: 'Software Engineer',
  startDate: '2022-01-01',
  endDate: '2023-12-31',
  description: 'Developed web applications using React and Node.js',
  current: false,
};

export const mockEducation = {
  institution: 'University of Technology',
  degree: 'Bachelor of Science',
  field: 'Computer Science',
  startDate: '2018-09-01',
  endDate: '2022-05-31',
  gpa: '3.8',
};

// Mock API responses
export const mockApiResponse = {
  data: [],
  error: null,
  count: 0,
  status: 200,
  statusText: 'OK',
};

export const mockErrorResponse = {
  data: null,
  error: {
    message: 'Test error message',
    details: 'Test error details',
    hint: 'Test error hint',
    code: 'TEST_ERROR',
  },
  count: null,
  status: 400,
  statusText: 'Bad Request',
};

// Mock Supabase client
export const mockSupabaseClient = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    mfa: {
      listFactors: vi.fn().mockResolvedValue({ data: { all: [mockMFAFactor] }, error: null }),
      challenge: vi.fn().mockResolvedValue({ data: { id: 'challenge-id' }, error: null }),
      verify: vi.fn().mockResolvedValue({ data: { access_token: 'token' }, error: null }),
    },
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(mockApiResponse),
    maybeSingle: vi.fn().mockResolvedValue(mockApiResponse),
  })),
};

// Test helpers
export const createMockEvent = (overrides = {}) => ({
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  target: { value: '' },
  ...overrides,
});

export const createMockFile = (name = 'test.pdf', type = 'application/pdf') => {
  return new File(['test content'], name, { type });
};
