import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
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

    // window.addEventListener('storage', handleStorageChange);
    // return () => window.removeEventListener('storage', handleStorageChange);
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
    try {
      if (authService.isAuthenticated()) {
        const profile = await authService.getProfile();
        if (profile.success && profile.data) {
          // Only update if data has changed to prevent infinite loops with storage listener
          const currentUserStr = localStorage.getItem('user');
          const newUserStr = JSON.stringify(profile.data);

          if (currentUserStr !== newUserStr) {
            setUserState(profile.data);
            localStorage.setItem('user', newUserStr);
          } else if (!user) {
            // If we have data but state is null (e.g. first load), set state
            setUserState(profile.data);
          }
        }
      }
    } catch (error: any) {
      console.error('Refresh user error:', error);
      // If the token is invalid (401), we must sign out to prevent loops and bad state
      if (error.message && error.message.includes('401')) {
        console.warn('Token expired or invalid during refresh, signing out...');
        // Instead of calling signOut() which calls API again, just clear state and redirect
        setUserState(null);
        authService.clearAuth();
        navigate('/auth');
      }
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
    if (user.roles && user.roles.length > 0) {
      return user.roles[0];
    }

    if (user.role) {
      return user.role;
    }

    if (user.user_type) {
      return user.user_type;
    }

    if (user.user_metadata?.roles && user.user_metadata.roles.length > 0) {
      return user.user_metadata.roles[0];
    }

    if (user.user_metadata?.user_type) {
      return user.user_metadata.user_type;
    }

    return null;
  };

  // Check if user has specific role
  const hasRole = (targetRole: string): boolean => {
    const userRole = getUserRole();
    return userRole?.toLowerCase() === targetRole.toLowerCase();
  };

  // Switch user's active role context
  const switchRole = async (newRole: string): Promise<void> => {
    if (!user) return;

    // Verify user has this role
    const allRoles = [user.user_type, user.role, ...(user.secondary_roles || [])].filter(Boolean);
    const hasTargetRole = allRoles.some(r => r?.toLowerCase() === newRole.toLowerCase());

    // Also allow switching back to primary role if defined in user_type/role

    if (hasTargetRole || newRole === user.user_type || newRole === user.role) {
      const updatedUser = {
        ...user,
        role: newRole,
        // Also update nested metadata if it exists to be consistent
        user_metadata: {
          ...user.user_metadata,
          roles: [newRole, ...(user.user_metadata?.roles?.slice(1) || [])]
        }
      };

      setUser(updatedUser);
      console.log(`Switched role to ${newRole}`);
    } else {
      console.warn(`Attempted to switch to unauthorized role: ${newRole}`);
      // meaningful error for UI
      throw new Error(`You do not have the ${newRole} role.`);
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
