
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import UserMenu from './UserMenu';
import { NavItem, NavGroup } from './types';
import MainNav from '@/components/navigation/MainNav';
import { navigationGroups } from '@/components/navigation/navigationConfig';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';

interface DesktopMenuProps {
  navItems?: NavItem[];
  navGroups?: NavGroup[];
}

export const DesktopMenu: React.FC<DesktopMenuProps> = ({ navItems, navGroups }) => {
  const { user } = useAuth();
  const isAuthenticated = !!user;

  // Use provided navGroups or default to the configured navigation groups
  const menuGroups = navGroups || navigationGroups;

  return (
    <>
      {/* Main Navigation */}
      <MainNav navGroups={menuGroups} />

      {/* Right side actions - Language toggle, Theme toggle and user menu */}
      <div className="ms-auto flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
        {isAuthenticated && <UserMenu />}
      </div>
    </>
  );
};
