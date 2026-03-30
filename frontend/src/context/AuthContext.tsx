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
      if (e.key === 'user' || e.key === 'access_token') {
        // Re-initialize auth when storage changes
        initializeAuth();
      }
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
          // Background refresh to get latest roles/status
          refreshUser();
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
          let mergedData = profile.data;
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

                mergedData = {
                  ...profile.data,
                  role: storedRoleStillValid ? storedUser.role : profile.data.role,
                  user_type: storedRoleStillValid ? storedUser.user_type : profile.data.user_type,
                  roles: storedRoleStillValid ? storedUser.roles : undefined,
                  secondary_roles: apiSecondaryRoles, // Always from API
                  user_metadata: {
                    ...profile.data.user_metadata,
                    roles: storedRoleStillValid ? storedUser.roles : undefined,
                    user_type: storedRoleStillValid ? storedUser.user_type : profile.data.user_type,
                  }
                };
              }
            } catch (_) { /* parse error — fall through to use API data */ }
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
