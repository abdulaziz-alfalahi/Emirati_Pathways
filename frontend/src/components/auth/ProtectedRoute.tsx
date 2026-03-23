import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { ROLE_DASHBOARD_MAP, normalizeRole } from '@/types/auth';

// Exported helper: map a role string to the correct dashboard path
export const getDashboardPath = (role: string): string => {
  const normalized = normalizeRole(role);
  return (ROLE_DASHBOARD_MAP as Record<string, string>)[normalized] || '/candidate-dashboard';
};

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
  const { isAuthenticated, user, isLoading, getUserRole } = useAuth();

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
    const userRole = getUserRole();

    // Check if user has any of the allowed roles
    // Normalize role for comparison (handle "Job Seeker" vs "job_seeker" vs "candidate")
    const normalizeRole = (r: string) => {
      const lower = r.toLowerCase();
      if (lower === 'job seeker' || lower === 'job_seeker') return 'candidate';
      if (lower === 'hr/recruiter' || lower === 'hr recruiter') return 'recruiter';
      if (lower === 'hr manager' || lower === 'hr_manager') return 'hr_manager';
      return lower;
    };

    const userRoleNormalized = normalizeRole(userRole || '');

    // Administrators can access any route
    const adminRoles = ['administrator', 'admin', 'super_admin', 'platform_administrator'];
    const isAdmin = adminRoles.includes(userRoleNormalized) ||
      (user.roles && user.roles.some(r => adminRoles.includes(normalizeRole(r))));

    // Check match
    const hasPermission = isAdmin || allowedRoles.some(allowed => {
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
