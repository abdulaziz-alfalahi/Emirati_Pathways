
import React from 'react';
import MobileBottomNav from './MobileBottomNav';
import MobileMenu from '../layout/MobileMenu';
import { SkipNavigation } from '@/components/accessibility/SkipNavigation';

interface MobileLayoutProps {
  children: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Skip Navigation Links */}
      <SkipNavigation />
      
      {/* Mobile Header */}
      <header className="bg-white border-b border-ehrdc-neutral-light shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3 min-h-[56px]">
          {/* Left: Mobile Menu */}
          <MobileMenu />

          {/* Center: Government and EHRDC Logos */}
          <div className="flex items-center space-x-3 flex-1 justify-center">
            <a 
              href="https://tec.gov.ae/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <img 
                src="/lovable-uploads/8e8dde72-de3d-4664-b8d9-541c109edc51.png"
                alt="Government of Dubai"
                className="h-8"
              />
            </a>
            
            <div className="w-px h-8 bg-ehrdc-neutral-light"></div>
            
            <a 
              href="/home" 
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <img 
                src="/lovable-uploads/e4ab7695-235d-451a-a304-556e2bb2b7e8.png"
                alt="Emirati Human Resources Development Council"
                className="h-8"
              />
            </a>
          </div>

          {/* Right: Empty space for balance */}
          <div className="w-10">
            {/* Empty space to balance the mobile menu button on the left */}
          </div>
        </div>
      </header>

      {/* Main content with bottom padding for navigation */}
      <main id="main-content" className="flex-1 pb-16" tabIndex={-1}>
        {children}
      </main>
      
      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default MobileLayout;
