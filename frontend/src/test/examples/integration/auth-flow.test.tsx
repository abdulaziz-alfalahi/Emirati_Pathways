import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { AuthProvider } from '@/context/AuthContext';
import RoleSelector from '@/components/auth/RoleSelector';
import type { UserRole } from '@/types/auth';

// NOTE: this file previously mocked '@/integrations/supabase/client'. Supabase was
// excised from the platform (commit efaae67) and that mock — along with every
// assertion that referenced it — was left commented out, which both broke the file
// syntactically and reduced the remaining tests to tautologies. The Supabase
// assertions are replaced below with assertions against the real component contract.

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle complete role selection flow', async () => {
    const onRolesChange = vi.fn();

    render(
      <AuthProvider>
        <RoleSelector selectedRoles={[]} onRolesChange={onRolesChange} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Select Your Role(s)')).toBeDefined();
    });

    await userEvent.click(screen.getByLabelText('University Student'));

    // Selecting a role must propagate the role's id to the parent.
    expect(onRolesChange).toHaveBeenCalledWith(['university_student']);
  });

  it('should deselect a role that is already selected', async () => {
    const onRolesChange = vi.fn();

    render(
      <AuthProvider>
        <RoleSelector
          selectedRoles={['university_student'] as UserRole[]}
          onRolesChange={onRolesChange}
        />
      </AuthProvider>
    );

    const checkbox = await screen.findByLabelText('University Student');
    expect(checkbox).toBeChecked();

    await userEvent.click(checkbox);
    expect(onRolesChange).toHaveBeenCalledWith([]);
  });

  it('should support selecting multiple roles', async () => {
    // Drive the component with real state so a second selection accumulates
    // rather than replacing the first.
    const Harness = () => {
      const [roles, setRoles] = useState<UserRole[]>([]);
      return (
        <AuthProvider>
          <RoleSelector selectedRoles={roles} onRolesChange={setRoles} />
          <div data-testid="selected">{roles.join(',')}</div>
        </AuthProvider>
      );
    };

    render(<Harness />);

    await userEvent.click(await screen.findByLabelText('University Student'));
    await userEvent.click(screen.getByLabelText('Parent'));

    await waitFor(() => {
      expect(screen.getByTestId('selected').textContent).toBe('university_student,parent');
    });
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
