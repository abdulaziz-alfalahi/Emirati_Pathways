import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
  // Supabase/Auth0 style metadata
  user_metadata?: {
    full_name?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    user_type?: string;
    roles?: string[];
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
  getUserRole: () => string | null;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  const isAuthenticated = !!user && authService.isAuthenticated();

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      // Check if we have a stored token
      if (authService.isAuthenticated()) {
        // Try to get user from localStorage first
        const storedUser = authService.getUser();
        if (storedUser) {
          setUser(storedUser);
        } else {
          // If no stored user, try to fetch from API
          try {
            const profile = await authService.getProfile();
            if (profile.success && profile.data) {
              setUser(profile.data);
              localStorage.setItem('user', JSON.stringify(profile.data));
            }
          } catch (error) {
            console.error('Failed to fetch user profile:', error);
            // Clear invalid auth state
            await signOut();
          }
        }
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
        setUser(userData);
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
      setUser(null);
      authService.clearAuth();
      
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      // Still clear local state on error
      setUser(null);
      authService.clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      if (authService.isAuthenticated()) {
        const profile = await authService.getProfile();
        if (profile.success && profile.data) {
          setUser(profile.data);
          localStorage.setItem('user', JSON.stringify(profile.data));
        }
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  // Get user's primary role
  const getUserRole = (): string | null => {
    if (!user) return null;

    // Try different role sources in order of preference
    if (user.roles && user.roles.length > 0) {
      return user.roles[0];
    }
    
    if (user.user_type) {
      return user.user_type;
    }
    
    if (user.role) {
      return user.role;
    }
    
    if (user.user_metadata?.user_type) {
      return user.user_metadata.user_type;
    }
    
    if (user.user_metadata?.roles && user.user_metadata.roles.length > 0) {
      return user.user_metadata.roles[0];
    }

    return null;
  };

  // Check if user has specific role
  const hasRole = (targetRole: string): boolean => {
    const userRole = getUserRole();
    return userRole?.toLowerCase() === targetRole.toLowerCase();
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    signIn,
    signUp,
    signOut,
    refreshUser,
    getUserRole,
    hasRole,
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
