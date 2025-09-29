/**
 * Mock Authentication Context for Development
 * Provides authentication state management using mock users
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MockAuthService, MockUser } from '@/services/mockAuthService';

interface MockAuthContextType {
  isAuthenticated: boolean;
  user: MockUser | null;
  login: (userType: string) => void;
  logout: () => void;
  switchPersona: (userType: string) => void;
}

const MockAuthContext = createContext<MockAuthContextType | undefined>(undefined);

interface MockAuthProviderProps {
  children: ReactNode;
}

export const MockAuthProvider: React.FC<MockAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<MockUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Initialize mock authentication
    const currentUser = MockAuthService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setIsAuthenticated(true);
    }
  }, []);

  const login = (userType: string) => {
    const mockUser = MockAuthService.setUser(userType);
    setUser(mockUser);
    setIsAuthenticated(true);
    console.log(`🎭 Mock Auth Context: Logged in as ${mockUser.full_name}`);
  };

  const logout = () => {
    MockAuthService.logout();
    setUser(null);
    setIsAuthenticated(false);
    console.log('🎭 Mock Auth Context: Logged out');
  };

  const switchPersona = (userType: string) => {
    const mockUser = MockAuthService.setUser(userType);
    setUser(mockUser);
    setIsAuthenticated(true);
    console.log(`🎭 Mock Auth Context: Switched to ${mockUser.full_name}`);
  };

  const value: MockAuthContextType = {
    isAuthenticated,
    user,
    login,
    logout,
    switchPersona
  };

  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  );
};

export const useMockAuth = (): MockAuthContextType => {
  const context = useContext(MockAuthContext);
  if (context === undefined) {
    throw new Error('useMockAuth must be used within a MockAuthProvider');
  }
  return context;
};

export default MockAuthContext;
