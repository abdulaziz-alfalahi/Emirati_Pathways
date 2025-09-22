
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { DesktopMenu } from './DesktopMenu';
import MobileMenu from './MobileMenu';
import { navigationGroups } from '@/components/navigation/navigationConfig';

const Navbar = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  return (
    <header className="w-full border-b bg-background shadow-sm">
      <div className="container mx-auto flex h-16 items-center">
        {isMobile ? (
          <MobileMenu />
        ) : (
          <DesktopMenu navGroups={navigationGroups} />
        )}
      </div>
    </header>
  );
};

export default Navbar;
