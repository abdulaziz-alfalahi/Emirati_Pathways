import React, { useState } from 'react';
import { getDisplayName } from '@/utils/nameUtils';
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
import { getDashboardRoute, UserRole, normalizeRole, ROLE_DISPLAY_NAMES } from '@/types/auth';
import { useLanguage } from '@/context/EnhancedLanguageContext';

const ROLE_DISPLAY_NAMES_AR: Record<string, string> = {
  'candidate': 'باحث عن عمل',
  'employer_admin': 'صاحب عمل',
  'recruiter': 'مسؤول توظيف',
  'training_provider': 'مركز تدريب',
  'parent': 'ولي أمر',
  'admin': 'مسؤول النظام',
  'growth_operator': 'مشغّل النمو',
  'talent_operator': 'مشغّل نمو المرشحين',
  'employer_relations': 'مشغّل نمو الشركات',
  'education_operator': 'مشغّل نمو التعليم',
  'assessment_operator': 'مشغّل نمو التقييم',
  'mentorship_operator': 'مشغّل نمو الإرشاد',
  'community_operator': 'مشغّل نمو المجتمع',
  'mentor': 'مرشد',
  'assessor': 'مُقيّم',
};

const UserMenu: React.FC = () => {
  const { language, isRTL } = useLanguage();
  const t = (en: string, ar: string) => (language === 'ar' ? ar : en);

  // Role label helper based on language
  const getRoleLabel = (role: string): string => {
    const key = role.toLowerCase();
    if (isRTL) {
      return ROLE_DISPLAY_NAMES_AR[key] || ROLE_DISPLAY_NAMES[key as UserRole] || role;
    }
    return ROLE_DISPLAY_NAMES[key as UserRole] || role;
  };

  // Add error handling wrapper around useAuth
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    console.error("Auth context not available:", error);
    // Return a sign-in button when context isn't available
    return (
      <Button variant="outline" onClick={() => window.location.href = '/auth'}>
        {t('Sign In', 'تسجيل الدخول')}
      </Button>
    );
  }

  const { user, signOut, getUserRole } = authContext;
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!user) {
    return (
      <Button variant="outline" onClick={() => navigate('/auth')}>
        {t('Sign In', 'تسجيل الدخول')}
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
      const dashboardPath = await getDashboardRoute(getUserRole() || 'candidate');
      navigate(dashboardPath);
    } catch (error) {
      console.error('Dashboard navigation error:', error);
      navigate('/candidate-dashboard'); // Fallback
    }
  };

  const getInitials = () => {
    const displayName = getDisplayName(user);
    if (displayName && displayName !== 'User') {
      return displayName
        .split(' ')
        .map((name: string) => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email?.slice(0, 2).toUpperCase() || 'U';
  };

  const getUserDisplayName = () => {
    return getDisplayName(user, t('User', 'مستخدم'));
  };

  const getCurrentRole = () => {
    const role = getUserRole();
    return role ? getRoleLabel(role) : t('Job Seeker', 'باحث عن عمل');
  };

  const getRoleIcon = (role: string): string => {
    const roleIcons: Record<string, string> = {
      'candidate': '🔍',
      'employer_admin': '👥',
      'recruiter': '💼',
      'admin': '⚙️',
      'mentor': '🎓',
    };
    return roleIcons[normalizeRole(role) as string] || '👤';
  };

  const currentRole = getUserRole() || 'candidate';

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
      <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-64" dir={isRTL ? 'rtl' : 'ltr'}>
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {getUserDisplayName()}
            </p>
            <p className="text-xs leading-none text-muted-foreground" dir="ltr">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Active Role Display */}
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{t('Current Role:', 'الدور الحالي:')}</p>
            <div className="flex items-center gap-2">
              <span className="text-lg">{getRoleIcon(currentRole)}</span>
              <span className="text-sm font-medium">
                {getCurrentRole()}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Role Switching Section */}
        {(() => {
          // Consolidate roles from all sources
          const rawRoles = [
            ...(user.roles || []),
            user.user_type,
            ...(user.secondary_roles || [])
          ].filter(Boolean);

          // Normalize and deduplicate
          let uniqueRoles = Array.from(new Set(
            rawRoles.map(r => normalizeRole(r as string))
          )).filter(Boolean);

          // Filter out the generic 'growth_operator' role if the user has specific domain roles
          const hasSpecificGoRole = uniqueRoles.some(r => typeof r === 'string' && r !== 'growth_operator' && r.startsWith('growth_operator_'));
          if (hasSpecificGoRole) {
            uniqueRoles = uniqueRoles.filter(r => r !== 'growth_operator');
          }

          // Only show switch role section if there's more than one role
          // OR if the user has secondary_roles property (legacy compatibility)
          if (uniqueRoles.length <= 1 && (!user.secondary_roles || user.secondary_roles.length === 0)) {
            return null;
          }

          return (
            <>
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">{t('Switch Role', 'تبديل الدور')}</DropdownMenuLabel>
              {uniqueRoles.map((role) => (
                <DropdownMenuItem
                  key={role}
                  onClick={async () => {
                    const normalized = role as string; // Already normalized
                    if (normalized && normalized !== currentRole) {
                      await authContext.switchRole(normalized);
                      navigate(getDashboardRoute(normalized));
                    }
                  }}
                  className="cursor-pointer flex items-center justify-between"
                  disabled={role === currentRole}
                >
                  <div className="flex items-center gap-2">
                    <span>{getRoleIcon(role as string)}</span>
                    {getRoleLabel(role as string)}
                  </div>
                  {role === currentRole && <span className="text-xs text-muted-foreground">{t('(Current)', '(الحالي)')}</span>}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          );
        })()}

        {/* Request New Role Shortcut */}
        <DropdownMenuItem
          onClick={() => navigate('/candidate/profile/identity')}
          className="cursor-pointer text-primary focus:text-primary"
        >
          <span className={`me-2`}>+</span> {t('Request New Role', 'طلب دور جديد')}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => {
            if (currentRole === 'candidate') {
              navigate('/candidate/profile/identity');
            } else {
              navigate('/profile');
            }
          }}
          className="cursor-pointer"
        >
          {t('Profile', 'الملف الشخصي')}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleDashboardNavigation}
          className="cursor-pointer"
        >
          {t('Dashboard', 'لوحة التحكم')}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer text-destructive focus:text-destructive"
          disabled={isSigningOut}
        >
          {isSigningOut ? t('Signing out...', 'جارٍ تسجيل الخروج...') : t('Sign out', 'تسجيل الخروج')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu >
  );
};

export default UserMenu;
