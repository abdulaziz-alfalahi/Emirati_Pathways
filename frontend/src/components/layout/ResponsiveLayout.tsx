import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Menu,
  X,
  Home,
  Briefcase,
  Users,
  GraduationCap,
  BarChart3,
  Bell,
  Settings,
  User,
  Search,
  Plus,
  ChevronDown,
  Smartphone,
  Tablet,
  Monitor
} from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationSystem';

// Types
interface ResponsiveLayoutProps {
  children: React.ReactNode;
  userType: string;
  userName?: string;
  unreadNotifications?: number;
  onNavigate?: (path: string) => void;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  badge?: number;
  subItems?: NavigationItem[];
  userTypes?: string[];
}

// Hook for responsive breakpoints
const useResponsive = () => {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;

      if (width < 768) {
        setBreakpoint('mobile');
        setIsMobile(true);
        setIsTablet(false);
      } else if (width < 1024) {
        setBreakpoint('tablet');
        setIsMobile(false);
        setIsTablet(true);
      } else {
        setBreakpoint('desktop');
        setIsMobile(false);
        setIsTablet(false);
      }
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);

    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  return { breakpoint, isMobile, isTablet };
};

// Navigation configuration
const getNavigationItems = (userType: string): NavigationItem[] => {
  const baseItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: '/dashboard'
    },
    {
      id: 'jobs',
      label: 'Jobs',
      icon: Briefcase,
      path: '/jobs',
      subItems: [
        { id: 'job-search', label: 'Search Jobs', icon: Search, path: '/jobs/search' },
        { id: 'my-applications', label: 'My Applications', icon: User, path: '/jobs/applications' },
        { id: 'saved-jobs', label: 'Saved Jobs', icon: Plus, path: '/jobs/saved' }
      ]
    }
  ];

  // Add user-type specific items
  switch (userType) {
    case 'candidate':
      baseItems.push(
        {
          id: 'profile',
          label: 'Profile',
          icon: User,
          path: '/profile',
          subItems: [
            { id: 'personal-info', label: 'Personal Info', icon: User, path: '/profile/personal' },
            { id: 'cv-builder', label: 'CV Builder', icon: Plus, path: '/profile/cv' },
            { id: 'skills', label: 'Skills', icon: GraduationCap, path: '/profile/skills' }
          ]
        },
        {
          id: 'mentoring',
          label: 'Mentoring',
          icon: Users,
          path: '/mentoring'
        }
      );
      break;

    case 'recruiter':
      baseItems.push(
        {
          id: 'candidates',
          label: 'Candidates',
          icon: Users,
          path: '/candidates'
        },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: BarChart3,
          path: '/analytics'
        }
      );
      break;

    case 'mentor':
      baseItems.push(
        {
          id: 'mentees',
          label: 'Mentees',
          icon: Users,
          path: '/mentees'
        },
        {
          id: 'sessions',
          label: 'Sessions',
          icon: GraduationCap,
          path: '/sessions'
        }
      );
      break;

    case 'training_provider':
      baseItems.push(
        {
          id: 'students',
          label: 'Students',
          icon: Users,
          path: '/students'
        },
        {
          id: 'curriculum',
          label: 'Curriculum',
          icon: GraduationCap,
          path: '/curriculum'
        },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: BarChart3,
          path: '/analytics'
        }
      );
      break;
  }

  return baseItems;
};

// Mobile Navigation Component
const MobileNavigation: React.FC<{
  items: NavigationItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
  onClose: () => void;
}> = ({ items, currentPath, onNavigate, onClose }) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleNavigate = (path: string) => {
    onNavigate(path);
    onClose();
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="space-y-1">
            <div className="flex items-center">
              <Button
                variant={currentPath === item.path ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start text-left',
                  currentPath === item.path && 'bg-primary text-primary-foreground'
                )}
                onClick={() => handleNavigate(item.path)}
              >
                <item.icon className="h-4 w-4 mr-3" />
                {item.label}
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </Button>
              {item.subItems && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 p-1"
                  onClick={() => toggleExpanded(item.id)}
                >
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      expandedItems.has(item.id) && 'rotate-180'
                    )}
                  />
                </Button>
              )}
            </div>

            {item.subItems && expandedItems.has(item.id) && (
              <div className="ml-6 space-y-1">
                {item.subItems.map((subItem) => (
                  <Button
                    key={subItem.id}
                    variant={currentPath === subItem.path ? 'default' : 'ghost'}
                    size="sm"
                    className={cn(
                      'w-full justify-start text-left',
                      currentPath === subItem.path && 'bg-primary text-primary-foreground'
                    )}
                    onClick={() => handleNavigate(subItem.path)}
                  >
                    <subItem.icon className="h-3 w-3 mr-2" />
                    {subItem.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

// Desktop Sidebar Component
const DesktopSidebar: React.FC<{
  items: NavigationItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
  collapsed?: boolean;
}> = ({ items, currentPath, onNavigate, collapsed = false }) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (itemId: string) => {
    if (collapsed) return;

    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className={cn(
      'h-full bg-white border-r border-gray-200 transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      <ScrollArea className="h-full">
        <div className="p-4 space-y-2">
          {items.map((item) => (
            <div key={item.id} className="space-y-1">
              <div className="flex items-center">
                <Button
                  variant={currentPath === item.path ? 'default' : 'ghost'}
                  className={cn(
                    'justify-start text-left transition-all',
                    collapsed ? 'w-8 h-8 p-0' : 'w-full',
                    currentPath === item.path && 'bg-primary text-primary-foreground'
                  )}
                  onClick={() => onNavigate(item.path)}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className={cn('h-4 w-4', !collapsed && 'mr-3')} />
                  {!collapsed && (
                    <>
                      {item.label}
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Button>
                {item.subItems && !collapsed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 p-1"
                    onClick={() => toggleExpanded(item.id)}
                  >
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        expandedItems.has(item.id) && 'rotate-180'
                      )}
                    />
                  </Button>
                )}
              </div>

              {item.subItems && expandedItems.has(item.id) && !collapsed && (
                <div className="ml-6 space-y-1">
                  {item.subItems.map((subItem) => (
                    <Button
                      key={subItem.id}
                      variant={currentPath === subItem.path ? 'default' : 'ghost'}
                      size="sm"
                      className={cn(
                        'w-full justify-start text-left',
                        currentPath === subItem.path && 'bg-primary text-primary-foreground'
                      )}
                      onClick={() => onNavigate(subItem.path)}
                    >
                      <subItem.icon className="h-3 w-3 mr-2" />
                      {subItem.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

// Top Header Component
const TopHeader: React.FC<{
  userName?: string;
  userType: string;
  isMobile: boolean;
  onMenuClick: () => void;
  onNavigate: (path: string) => void;
}> = ({ userName, userType, isMobile, onMenuClick, onNavigate }) => {
  const getBreakpointIcon = () => {
    if (window.innerWidth < 768) return <Smartphone className="h-4 w-4" />;
    if (window.innerWidth < 1024) return <Tablet className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      <div className="flex items-center space-x-4">
        {isMobile && (
          <Button variant="ghost" size="sm" aria-label="Open navigation menu" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold text-gray-900">
            {isMobile ? 'EHD Platform' : 'Emirati Human Development Platform'}
          </h1>
          {!isMobile && (
            <Badge variant="outline" className="hidden sm:flex">
              {getBreakpointIcon()}
              <span className="ml-1 capitalize">{userType.replace('_', ' ')}</span>
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Search - Hidden on mobile */}
        {!isMobile && (
          <Button variant="ghost" size="sm">
            <Search className="h-4 w-4" />
          </Button>
        )}

        {/* Notifications */}
        <NotificationBell />

        {/* User Menu */}
        <div className="flex items-center space-x-2">
          {!isMobile && userName && (
            <span className="text-sm text-gray-600 hidden md:block">
              {userName}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('/profile')}
            className="rounded-full"
          >
            <User className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('/settings')}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

// Main Responsive Layout Component
const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  userType,
  userName,
  unreadNotifications = 0,
  onNavigate = () => { }
}) => {
  const { breakpoint, isMobile, isTablet } = useResponsive();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentPath, setCurrentPath] = useState('/dashboard');

  const navigationItems = getNavigationItems(userType);

  const handleNavigate = useCallback((path: string) => {
    setCurrentPath(path);
    onNavigate(path);
  }, [onNavigate]);

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Auto-collapse sidebar on tablet
  useEffect(() => {
    if (isTablet) {
      setSidebarCollapsed(true);
    } else if (!isMobile) {
      setSidebarCollapsed(false);
    }
  }, [isTablet, isMobile]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Header */}
      <TopHeader
        userName={userName}
        userType={userType}
        isMobile={isMobile}
        onMenuClick={handleMobileMenuToggle}
        onNavigate={handleNavigate}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <DesktopSidebar
            items={navigationItems}
            currentPath={currentPath}
            onNavigate={handleNavigate}
            collapsed={sidebarCollapsed}
          />
        )}

        {/* Mobile Navigation Sheet */}
        {isMobile && (
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetContent side="left" className="w-80 p-0">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Navigation</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <MobileNavigation
                items={navigationItems}
                currentPath={currentPath}
                onNavigate={handleNavigate}
                onClose={() => setMobileMenuOpen(false)}
              />
            </SheetContent>
          </Sheet>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <div className={cn(
            'h-full',
            isMobile ? 'p-4' : 'p-6'
          )}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation (Optional) */}
      {isMobile && (
        <div className="bg-white border-t border-gray-200 p-2">
          <div className="flex justify-around">
            {navigationItems.slice(0, 4).map((item) => (
              <Button
                key={item.id}
                variant={currentPath === item.path ? 'default' : 'ghost'}
                size="sm"
                className="flex-col h-12 w-12 p-1"
                onClick={() => handleNavigate(item.path)}
              >
                <item.icon className="h-4 w-4" />
                <span className="text-xs mt-1 truncate">{item.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Responsive Debug Info (Development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black text-white text-xs p-2 rounded opacity-50">
          {breakpoint} - {window.innerWidth}px
        </div>
      )}
    </div>
  );
};

export default ResponsiveLayout;
