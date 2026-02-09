import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from 'react-router-dom';
import { getDashboardRoute, UserRole, normalizeRole } from '@/types/auth';

// Updated role labels for the 4 main roles
const roleLabels: Record<string, string> = {
  'job_seeker': 'Job Seeker',
  'candidate': 'Candidate',
  'hr_manager': 'HR Manager',
  'hr': 'HR Manager',
  'recruiter': 'Recruiter',
  'administrator': 'Administrator',
  'admin': 'Administrator'
};

const UserMenu: React.FC = () => {
  // Add error handling wrapper around useAuth
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    console.error("Auth context not available:", error);
    // Return a sign-in button when context isn't available
    return (
      <Button variant="outline" onClick={() => window.location.href = '/auth'}>
        Sign In
      </Button>
    );
  }

  const { user, signOut, getUserRole } = authContext;
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!user) {
    return (
      <Button variant="outline" onClick={() => navigate('/auth')}>
        Sign In
      </Button>
    );
  }

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleDashboardNavigation = async () => {
    try {
      const dashboardPath = await getDashboardRoute(getUserRole() || 'job_seeker');
      navigate(dashboardPath);
    } catch (error) {
      console.error('Dashboard navigation error:', error);
      navigate('/candidate-dashboard'); // Fallback
    }
  };

  const getInitials = () => {
    // Try different name sources
    const fullName = user.full_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : null);

    if (fullName) {
      return fullName
        .split(' ')
        .map((name: string) => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email?.slice(0, 2).toUpperCase() || 'U';
  };

  const getUserDisplayName = () => {
    return user.full_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : null) ||
      'User';
  };

  const getCurrentRole = () => {
    const role = getUserRole();
    return role ? roleLabels[role.toLowerCase()] || role : 'Job Seeker';
  };

  const getRoleIcon = (role: string): string => {
    const roleIcons: Record<string, string> = {
      'job_seeker': '🔍',
      'candidate': '🔍',
      'hr_manager': '👥',
      'hr': '👥',
      'recruiter': '💼',
      'administrator': '⚙️',
      'admin': '⚙️'
    };
    return roleIcons[normalizeRole(role) as string] || '👤';
  };

  const currentRole = getUserRole() || 'job_seeker';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border-2 border-ehrdc-teal">
            <AvatarFallback className="bg-ehrdc-teal text-white">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {getUserDisplayName()}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Active Role Display */}
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Current Role:</p>
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getRoleIcon(currentRole)}</span>
              <span className="text-sm font-medium">
                {getCurrentRole()}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Role Switching Section */}
        {(user.secondary_roles && user.secondary_roles.length > 0) && (
          <>
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">Switch Role</DropdownMenuLabel>
            {[user.user_type, ...(user.secondary_roles || [])].filter(Boolean).filter((r, i, arr) => arr.indexOf(r) === i).map((role) => (
              <DropdownMenuItem
                key={role}
                onClick={async () => {
                  const normalized = normalizeRole(role!);
                  if (normalized && normalized !== currentRole) {
                    await authContext.switchRole(normalized as string);
                    navigate(getDashboardRoute(normalized as string));
                  }
                }}
                className="cursor-pointer flex items-center justify-between"
                disabled={normalizeRole(role!) === currentRole}
              >
                <div className="flex items-center">
                  <span className="mr-2">{getRoleIcon(role!)}</span>
                  {roleLabels[role!.toLowerCase()] || role}
                </div>
                {normalizeRole(role!) === currentRole && <span className="text-xs text-muted-foreground">(Current)</span>}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Request New Role Shortcut */}
        <DropdownMenuItem
          onClick={() => navigate('/candidate/profile/identity')}
          className="cursor-pointer text-teal-600 focus:text-teal-700"
        >
          <span className="mr-2">+</span> Request New Role
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => {
            if (['job_seeker', 'candidate', 'student'].includes(currentRole.toLowerCase())) {
              navigate('/candidate/profile/identity');
            } else {
              navigate('/profile');
            }
          }}
          className="cursor-pointer"
        >
          Profile
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleDashboardNavigation}
          className="cursor-pointer"
        >
          Dashboard
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer text-destructive focus:text-destructive"
          disabled={isSigningOut}
        >
          {isSigningOut ? 'Signing out...' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
