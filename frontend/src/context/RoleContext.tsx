import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, normalizeRole } from '@/types/auth';
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
  
  // Available roles = every role the user actually holds, from all sources
  // (primary role, user_type, roles[], and the authoritative secondary_roles),
  // normalized and de-duplicated. The previous hardcoded allow-list used a stale
  // role vocabulary that silently dropped most assigned roles from the switcher.
  const availableRoles: UserRole[] = React.useMemo(() => {
    if (!user) return ['candidate'] as UserRole[];
    const raw = [
      ...((user as any).roles || []),
      (user as any).role,
      (user as any).user_type,
      ...((user as any).secondary_roles || []),
    ].filter(Boolean) as string[];
    const normalized = Array.from(new Set(raw.map((r) => normalizeRole(r) as string)));
    return (normalized.length ? normalized : ['candidate']) as UserRole[];
  }, [user]);

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
