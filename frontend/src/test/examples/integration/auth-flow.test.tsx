import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/test-utils';
import '@testing-library/jest-dom';
import { AuthProvider } from '@/context/AuthContext';

// NOTE: this file previously mocked '@/integrations/supabase/client'. Supabase was
// excised from the platform (commit efaae67) and that mock — along with every
// assertion that referenced it — was left commented out, which both broke the file
// syntactically and reduced the remaining tests to tautologies.
//
// The three role-selection tests that lived here were removed with the
// RoleSelector component they exercised. That component offered self-service
// selection from a retired persona taxonomy (school_student, gig_worker,
// intern, ...) and even labelled 'candidate' as "Retiree". Nationals onboard as
// Candidate and gain roles by operator grant — self-selection is not how roles
// are assigned — so the tests were asserting behaviour the platform must not have.

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mount AuthProvider without an authenticated session', async () => {
    render(
      <AuthProvider>
        <div data-testid="auth-state">Authenticated</div>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toBeDefined();
    });
  });
});
