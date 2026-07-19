
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Briefcase, 
  FileText, 
  User, 
  WifiOff 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOfflineStorage } from '@/hooks/use-offline-storage';

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { isOnline } = useOfflineStorage();

  const navItems = [
    {
      icon: Home,
      label: 'Home',
      path: '/',
      id: 'home'
    },
    {
      icon: Briefcase,
      label: 'Jobs',
      path: '/job-matching',
      id: 'jobs'
    },
    {
      icon: FileText,
      label: 'CV',
      path: '/cv-builder',
      id: 'cv'
    },
    {
      icon: WifiOff,
      label: 'Offline',
      path: '/mobile-offline',
      id: 'offline'
    },
    {
      icon: User,
      label: 'Profile',
      path: '/dashboard',
      id: 'profile'
    }
  ];

  return (
    <nav className="fixed bottom-0 start-0 end-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = location.pathname === item.path;
          const isOfflineTab = item.id === 'offline';
          
          return (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200",
                "min-h-[60px] min-w-[60px] touch-manipulation", // Ensure 44px+ touch targets
                "active:scale-95",
                isActive 
                  ? "text-blue-600 bg-blue-50" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
              aria-label={item.label}
            >
              <div className="relative">
                <IconComponent className={cn(
                  "h-5 w-5 mb-1",
                  isOfflineTab && !isOnline && "text-orange-500"
                )} />
                {isOfflineTab && !isOnline && (
                  <div className="absolute -top-1 -end-1 w-2 h-2 bg-orange-500 rounded-full"></div>
                )}
              </div>
              <span className={cn(
                "text-xs font-medium",
                isActive && "text-blue-600"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
