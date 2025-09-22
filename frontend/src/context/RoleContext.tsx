import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '@/types/auth';
import { useAuth } from '@/context/AuthContext';
import { analyticsService } from '@/services/analyticsService';

interface RoleContextType {
  activeRole: UserRole | null;
  setActiveRole: (role: UserRole) => void;
  availableRoles: UserRole[];
  // Add currentRole as an alias for backward compatibility
  currentRole: UserRole | null;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeRole, setActiveRoleState] = useState<UserRole | null>(null);
  
  // Get available roles from user's actual roles, with fallback to candidate
  const availableRoles: UserRole[] = user?.roles?.filter(role => 
    // Ensure the role is a valid UserRole type
    ['candidate', 'administrator', 'super_user', 'private_sector_recruiter', 
     'government_representative', 'educational_institution', 'mentor', 
     'career_advisor', 'school_student', 'university_student', 'jobseeker',
     'intern', 'full_time_employee', 'part_time_employee', 'gig_worker',
     'lifelong_learner', 'entrepreneur', 'retiree', 'parent', 'training_center',
     'assessment_center', 'platform_operator', 'national_service_participant',
     'retiree_advocate'].includes(role)
  ) as UserRole[] || ['candidate'];

  // Initialize active role
  useEffect(() => {
    if (availableRoles.length > 0 && !activeRole) {
      // Check localStorage for previously selected role
      const savedRole = localStorage.getItem('activeRole') as UserRole;
      if (savedRole && availableRoles.includes(savedRole)) {
        setActiveRoleState(savedRole);
      } else {
        // Default to first role if no saved role or saved role is invalid
        setActiveRoleState(availableRoles[0]);
      }
    }
  }, [availableRoles, activeRole]);

  const setActiveRole = (role: UserRole) => {
    setActiveRoleState(role);
    localStorage.setItem('activeRole', role);
    
    // Track role change
    analyticsService.trackEvent('role_changed', {
      previous_role: activeRole,
      new_role: role,
      user_id: user?.id
    });
  };

  const value: RoleContextType = {
    activeRole,
    setActiveRole,
    availableRoles,
    currentRole: activeRole // Alias for backward compatibility
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

export default RoleProvider;
