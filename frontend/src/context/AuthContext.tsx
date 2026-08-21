import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { normalizeRole } from '@/types/auth'; // Import normalization helper
import { authService } from '@/services/authService';

// User interface with all necessary properties for role-based routing
export interface User {
  id: string | number;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  emirate?: string;
  user_type?: string;  // Primary role field
  role?: string;       // Alternative role field
  company_id?: string; // Company ID for HR users
  company_name?: string; // Company Name for HR users
  roles?: string[];    // Array of roles
  secondary_roles?: string[]; // Secondary roles from backend
  // Supabase/Auth0 style metadata
  user_metadata?: {
    full_name?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    user_type?: string;
    company_id?: string;
    roles?: string[];
    secondary_roles?: string[];
  };
  // Additional properties that might exist
  created_at?: string;
  updated_at?: string;
  email_verified?: boolean;
  phone_verified?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (userData: any) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;  // New method for direct user state updates
  getUserRole: () => string | null;
  hasRole: (role: string) => boolean;
  switchRole: (role: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshingRef = useRef(false);
  const navigate = useNavigate();

  // Check if user is authenticated
  const isAuthenticated = !!user && authService.isAuthenticated();

  // Initialize auth state on mount
  useEffect(() => {
    console.log('AuthProvider mounted');
    initializeAuth();
    return () => console.log('AuthProvider unmounted');
  }, []);

  // Listen for storage events to sync auth state across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== 'user' && e.key !== 'access_token') return;

      /* Adopt the other tab's value directly. This deliberately does NOT call
       * initializeAuth().
       *
       * initializeAuth flips isLoading, and ProtectedRoute renders a
       * full-screen spinner whenever isLoading is true — so a routine
       * cross-tab sync blanked whatever the user was looking at. Worse, it
       * also re-fetched the profile and wrote localStorage['user'] again,
       * which fired a storage event back in the tab that started it. With two
       * tabs open the two woke each other forever, and the venue check-in page
       * flashed between the spinner and the queue number. Two tabs is the
       * normal case here, not an edge one: UAE Pass hands off to its mobile
       * app and returns in a new tab.
       *
       * A storage event already carries the new state. Reading it costs
       * nothing, cannot fail, and — critically — writes nothing back. */
      if (!authService.isAuthenticated()) {
        setUserState(null);
        return;
      }
      const stored = authService.getUser() || null;
      setUserState(prev =>
        JSON.stringify(prev) === JSON.stringify(stored) ? prev : stored);
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen to custom 'auth-change' events if we decide to dispatch them manually
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);

      // Check if we have a stored token
      if (authService.isAuthenticated()) {
        // Try to get user from localStorage first
        const storedUser = authService.getUser();
        if (storedUser) {
          setUserState(storedUser);
          // AWAIT the refresh so isLoading stays true until the authoritative
          // roles (esp. secondary_roles) are resolved. Previously this was
          // fire-and-forget, so a first load with a stored user that lacked
          // secondary_roles (e.g. right after login) evaluated ProtectedRoute
          // before roles landed and BOUNCED every operator dashboard to the
          // candidate homepage until a manual reload (C4 [C4-BRD-1]; the
          // recurring first-load routing race seen across all clusters).
          await refreshUser();
        } else {
          // If no stored user, try to fetch from API
          try {
            const profile = await authService.getProfile();
            if (profile.success && profile.data) {
              setUserState(profile.data);
              localStorage.setItem('user', JSON.stringify(profile.data));
            }
          } catch (error) {
            console.error('Failed to fetch user profile:', error);
            // Clear invalid auth state
            await signOut();
          }
        }
      } else {
        // No valid auth, clear user state
        setUserState(null);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authService.login({ email, password });

      if (response.success && response.data) {
        // Store tokens
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('refresh_token', response.data.refresh_token);

        // Store user data
        const userData = response.data.user;
        setUserState(userData);
        localStorage.setItem('user', JSON.stringify(userData));

        console.log('User signed in successfully:', userData);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (userData: any) => {
    try {
      setIsLoading(true);
      const response = await authService.register(userData);

      if (response.success) {
        // For registration, we might need to sign in afterwards
        // or handle email verification flow
        console.log('User registered successfully');

        // Optionally auto-sign in after registration
        if (userData.email && userData.password) {
          await signIn(userData.email, userData.password);
        }
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);

      // Call logout API
      try {
        await authService.logout();
      } catch (error) {
        console.error('Logout API error:', error);
        // Continue with local cleanup even if API fails
      }

      // Clear local state
      setUserState(null);
      authService.clearAuth();
      navigate('/auth'); // Soft redirect

      console.log('User signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      // Still clear local state on error
      setUserState(null);
      authService.clearAuth();
      navigate('/auth'); // Soft redirect
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    // Prevent concurrent refresh calls from stacking up
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      if (authService.isAuthenticated()) {
        const profile = await authService.getProfile();
        if (profile.success && profile.data) {
          const currentUserStr = localStorage.getItem('user');

          // Preserve locally-switched active role — the API always returns the
          // "primary" role, but the user may have switched to a secondary role
          // via switchRole().  We detect this by comparing the stored role with
          // the API role and keeping the stored one when they differ.
          let mergedData: any = profile.data;
          if (currentUserStr) {
            try {
              const storedUser = JSON.parse(currentUserStr);
              const apiRole = normalizeRole(profile.data.role || profile.data.user_type || '');
              const storedRole = normalizeRole(storedUser.role || storedUser.user_type || '');

              if (storedRole && storedRole !== apiRole) {
                // User switched roles locally — preserve the active role
                // BUT always use the API's secondary_roles (authoritative source)
                // An admin may have removed a role since last login
                const apiSecondaryRoles = profile.data.secondary_roles || [];
                const apiAllRoles = [
                  apiRole,
                  ...apiSecondaryRoles.map((r: string) => normalizeRole(r))
                ];

                // Only preserve the stored role if it's still valid per backend
                const storedRoleStillValid = apiAllRoles.includes(storedRole);

                // Only the ACTIVE role is preserved from storage. The role
                // LIST is rebuilt from the API below — carrying it over is what
                // kept a removed role alive in the switcher.
                mergedData = {
                  ...profile.data,
                  role: storedRoleStillValid ? storedUser.role : profile.data.role,
                  user_type: storedRoleStillValid ? storedUser.user_type : profile.data.user_type,
                  secondary_roles: apiSecondaryRoles, // Always from API
                  user_metadata: {
                    ...profile.data.user_metadata,
                    user_type: storedRoleStillValid ? storedUser.user_type : profile.data.user_type,
                  }
                };
              }

              // Preserve the company binding across refreshes.  The /api/auth/profile
              // payload omits company_id/company_name, so replacing the user with it
              // wiped the HR manager's company from the session and broke the entire
              // Team tab — roster, invite-link and add-by-email all 400'd with
              // "company_id is required" on any returning session (C1 UAT [C1-HRM-4]).
              mergedData = { ...mergedData };
              if (mergedData.company_id == null && storedUser.company_id != null) {
                mergedData.company_id = storedUser.company_id;
              }
              if (mergedData.company_name == null && storedUser.company_name != null) {
                mergedData.company_name = storedUser.company_name;
              }
            } catch (_) { /* parse error — fall through to use API data */ }
          }

          // `roles` IS DERIVED, never carried over from storage.
          //
          // The API is authoritative for role/secondary_roles and always wins
          // above — but `roles` was preserved from localStorage on the
          // switched-role path, so a role an administrator had REMOVED lived on
          // in the cached array. The role switcher unions user.roles, so the
          // removed role kept being offered and kept being selectable, through
          // any number of hard refreshes: nothing ever rewrote that key.
          //
          // ProtectedRoute reads user.roles too, so the same stale entry also
          // admitted the client to pages the server had just stopped allowing.
          // The server still refused the API calls behind them — resolve_roles
          // reads the database — so this was a misleading UI rather than real
          // access, but a guard reading cached authority is the exact pattern
          // that has bitten this codebase before.
          //
          // Rebuilt from the two fields the API does send, so removal takes
          // effect on the next refresh with nothing to clear by hand.
          {
            const _apiRole = normalizeRole(profile.data.role || profile.data.user_type || '');
            const _apiSecondary = (profile.data.secondary_roles || [])
              .map((r: string) => normalizeRole(r));
            const _derived = Array.from(new Set([_apiRole, ..._apiSecondary].filter(Boolean)));
            mergedData = {
              ...mergedData,
              roles: _derived,
              // ProfileSummary falls back to user_metadata.roles, so a stale
              // copy there would outlive the one above.
              user_metadata: { ...(mergedData.user_metadata || {}), roles: _derived },
            };
          }

          const newUserStr = JSON.stringify(mergedData);
          // Only update state if actual data changed (compare via localStorage)
          if (currentUserStr !== newUserStr) {
            setUserState(mergedData);
            localStorage.setItem('user', newUserStr);
          }
          // Note: removed the `else if (!user)` branch that used stale closure
          // causing infinite re-renders.  If localStorage already has the user
          // but React state is still null, initializeAuth handles that path.
        }
      }
    } catch (error: any) {
      console.error('Refresh user error:', error);
      // If the token is invalid (401), we must sign out to prevent loops and bad state
      if (error.message && error.message.includes('401')) {
        console.warn('Token expired or invalid during refresh, signing out...');
        setUserState(null);
        authService.clearAuth();
        // Save current URL for deep-link preservation
        const currentPath = window.location.pathname;
        if (currentPath && currentPath !== '/auth' && currentPath !== '/') {
          sessionStorage.setItem('returnUrl', currentPath);
        }
        navigate('/auth');
      }
    } finally {
      refreshingRef.current = false;
    }
  };

  // Direct user state setter for MockLogin and other auth flows
  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
    }
  };

  // Get user's primary role
  const getUserRole = (): string | null => {
    if (!user) return null;

    // Try different role sources in order of preference
    let role = null;
    if (user.roles && user.roles.length > 0) {
      role = user.roles[0];
    } else if (user.role) {
      role = user.role;
    } else if (user.user_type) {
      role = user.user_type;
    } else if (user.user_metadata?.roles && user.user_metadata.roles.length > 0) {
      role = user.user_metadata.roles[0];
    } else if (user.user_metadata?.user_type) {
      role = user.user_metadata.user_type;
    }

    return role ? normalizeRole(role) as string : null;
  };

  // Check if user has specific role
  const hasRole = (targetRole: string): boolean => {
    const userRole = getUserRole();
    return userRole === normalizeRole(targetRole);
  };

  // Switch user's active role context
  const switchRole = async (newRole: string): Promise<void> => {
    // CRITICAL FIX: Read from localStorage to bypass closure staleness
    // When refreshUser() is called immediately before switchRole(), 
    // the 'user' state variable in this closure is still the OLD value.
    let currentUser = user;
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        currentUser = JSON.parse(storedUser);
      }
    } catch (e) {
      console.warn("Failed to parse stored user in switchRole", e);
    }

    if (!currentUser) return;

    const targetRoleNormalized = normalizeRole(newRole) as string;

    // Verify user has this role (normalize everything for comparison)
    const allRoles = [
      ...(currentUser.roles || []),
      currentUser.user_type,
      currentUser.role,
      ...(currentUser.secondary_roles || [])
    ]
      .filter(Boolean)
      .map(r => normalizeRole(r as string));

    const hasTargetRole = allRoles.includes(targetRoleNormalized);

    // Also allow switching back to primary role if defined in user_type/role
    // (Already covered by including currentUser.user_type in allRoles above)

    if (hasTargetRole) {
      // Reorder roles array to put the new active role first (so getUserRole picks it up)
      // Reorder roles array to put the new active role first (so getUserRole picks it up)
      // Consolidate all available roles from different sources to ensure none are lost
      const rawRoles = [
        ...(currentUser.roles || []),
        currentUser.user_type,
        currentUser.role,
        ...(currentUser.secondary_roles || [])
      ].filter(Boolean);

      // Normalize and deduplicate
      const uniqueRolesSet = new Set(rawRoles.map(r => normalizeRole(r as string)));

      const otherRoles = Array.from(uniqueRolesSet)
        .filter(r => r !== targetRoleNormalized);

      // Ensure the new role is at the front
      const newRoles = [targetRoleNormalized, ...otherRoles];

      const updatedUser = {
        ...currentUser,
        role: targetRoleNormalized,      // Update explicit active role
        user_type: targetRoleNormalized, // Update legacy user_type to match
        roles: newRoles,                 // Update roles array order
        // Update metadata for consistency if it exists
        user_metadata: {
          ...currentUser.user_metadata,
          roles: newRoles,
          user_type: targetRoleNormalized
        }
      };

      // @ts-ignore
      setUser(updatedUser);
      console.log(`Switched role to ${targetRoleNormalized}`);
    } else {
      console.warn(`Attempted to switch to unauthorized role: ${newRole} (normalized: ${targetRoleNormalized})`);
      // meaningful error for UI
      throw new Error(`You do not have the ${targetRoleNormalized} role.`);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    signIn,
    signUp,
    signOut,
    refreshUser,
    setUser,
    getUserRole,
    hasRole,
    switchRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
