import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMFA } from '@/hooks/useMFA';

// Create a complete mock for the Supabase client
const mockSupabase = {
  auth: {
    mfa: {
      listFactors: vi.fn(),
      challenge: vi.fn(),
      verify: vi.fn(),
    },
  },
};

// Mock the Supabase client module
// vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

// Create a simple mock auth context that provides a user
const mockAuthContext = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
  },
  roles: ['user'], // Simple role that doesn't require MFA
  loading: false,
};

// Mock AuthContext with our simple context
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

// Mock toast to prevent any side effects
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('useMFA Hook', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Setup mocks to resolve immediately and successfully
    mockSupabase.auth.mfa.listFactors.mockResolvedValue({
      data: { all: [], totp: [], phone: [] },
      error: null,
    });
    
    mockSupabase.auth.mfa.challenge.mockResolvedValue({
      data: { id: 'challenge-id' },
      error: null,
    });
    
    mockSupabase.auth.mfa.verify.mockResolvedValue({
      data: { access_token: 'token' },
      error: null,
    });
  });

  it('should initialize with default state and complete loading', async () => {
    const { result } = renderHook(() => useMFA());

    // Initially, the hook should start loading
    expect(result.current.factors).toEqual([]);
    expect(result.current.activeChallenge).toBeNull();
    expect(result.current.mfaStatus.enabled).toBe(false);

    // Wait for the useEffect to complete and loading to finish
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 3000 }
    );

    // Verify the mock was called
    expect(mockSupabase.auth.mfa.listFactors).toHaveBeenCalled();
  });

  it('should determine MFA requirement based on roles', () => {
    const { result } = renderHook(() => useMFA());

    const requirement = result.current.getMFARequirement();
    expect(['required', 'optional', 'none']).toContain(requirement);
    // With 'user' role, should be 'none'
    expect(requirement).toBe('none');
  });

  it('should check if MFA is required for specific actions', () => {
    const { result } = renderHook(() => useMFA());

    const isRequired = result.current.isMFARequired('admin_access');
    expect(typeof isRequired).toBe('boolean');
    // With 'user' role and 'none' requirement, should be false
    expect(isRequired).toBe(false);
  });

  it('should handle createChallenge when no factors exist', async () => {
    const { result } = renderHook(() => useMFA());

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Try to create challenge with no factors - should return null
    await act(async () => {
      const challenge = await result.current.createChallenge();
      expect(challenge).toBeNull();
    });
  });

  it('should verify MFA challenge successfully', async () => {
    const { result } = renderHook(() => useMFA());

    await act(async () => {
      const success = await result.current.verifyChallenge(
        'challenge-id',
        '123456',
        'factor-id'
      );
      expect(success).toBe(true);
    });

    expect(mockSupabase.auth.mfa.verify).toHaveBeenCalledWith({
      factorId: 'factor-id',
      challengeId: 'challenge-id',
      code: '123456',
    });
  });
});

