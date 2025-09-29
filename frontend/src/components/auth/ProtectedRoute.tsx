import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { MockAuthService } from '@/services/mockAuthService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
  redirectTo = '/auth'
}) => {
  const location = useLocation();

  // Check if user is authenticated (mock)
  if (!MockAuthService.isAuthenticated()) {
    console.log('🎭 Mock Auth: Not authenticated, redirecting to auth');
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Get current mock user
  const currentUser = MockAuthService.getCurrentUser();
  if (!currentUser) {
    console.log('🎭 Mock Auth: No user data found, redirecting to auth');
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access if roles are specified
  if (allowedRoles.length > 0) {
    const userRole = currentUser.user_type;
    
    if (!allowedRoles.includes(userRole)) {
      console.log(`🎭 Mock Auth: Access denied. User role: ${userRole}, Required: ${allowedRoles.join(', ')}`);
      
      // Redirect to appropriate dashboard based on user's role
      const dashboardRoute = MockAuthService.getDashboardRoute(userRole);
      return <Navigate to={dashboardRoute} replace />;
    }
  }

  console.log(`🎭 Mock Auth: Access granted to ${currentUser.full_name} (${currentUser.user_type})`);
  return <>{children}</>;
};

export default ProtectedRoute;
