import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

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
  const { isAuthenticated, user, isLoading } = useAuth(); // Use real AuthContext

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    console.log('🛡️ Protected Route: Not authenticated, redirecting to auth');
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access if roles are specified
  if (allowedRoles.length > 0) {
    // Get user role from context (which handles fallbacks correctly)
    const { getUserRole } = useAuth();
    const userRole = getUserRole();

    // Check if user has any of the allowed roles
    // We check both the primary role and if the user data has a roles array
    // Normalize role for comparison (handle "Job Seeker" vs "job_seeker" vs "candidate")
    const normalizeRole = (r: string) => {
      const lower = r.toLowerCase();
      if (lower === 'job seeker' || lower === 'job_seeker') return 'candidate';
      if (lower === 'hr/recruiter' || lower === 'hr recruiter') return 'recruiter';
      if (lower === 'hr manager' || lower === 'hr_manager') return 'hr_manager';
      return lower;
    };

    const userRoleNormalized = normalizeRole(userRole || '');

    // Check match
    const hasPermission = allowedRoles.some(allowed => {
      const allowedNorm = normalizeRole(allowed);
      return allowedNorm === userRoleNormalized ||
        (user.roles && user.roles.some(r => normalizeRole(r) === allowedNorm));
    });

    if (!hasPermission) {
      console.log(`🛡️ Protected Route: Access denied. User role: ${userRole}, Required: ${allowedRoles.join(', ')}`);

      // In a real app we might redirect to unauthorized, or dashboard
      // For now, redirect to their dashboard if possible
      return <Navigate to="/" replace />; // Fallback to home or specific error page
    }
  }

  console.log(`🛡️ Protected Route: Access granted to ${user.email} (${user.user_type || user.role})`);
  return <>{children}</>;
};

export default ProtectedRoute;
