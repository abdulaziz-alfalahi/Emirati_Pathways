
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Globe, ChevronDown, Menu, Phone, Mail, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AccessibilityToolbar } from '@/components/accessibility/AccessibilityToolbar';
import { SkipNavigation } from '@/components/accessibility/SkipNavigation';
import { ColorBlindFilters } from '@/components/accessibility/ColorBlindFilters';

const DubaiGovHeader: React.FC = () => {
  const { user } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality
      console.log('Searching for:', searchQuery);
    }
  };

  return (
    <>
      {/* Skip Navigation Links */}
      <SkipNavigation />
      
      {/* Color Blind Filters */}
      <ColorBlindFilters />
      
      <header className="bg-white border-b border-ehrdc-neutral-light shadow-sm">
        {/* Top utility bar - Government standard */}
        <div className="bg-ehrdc-teal text-white">
          <div className="dubai-container">
            <div className="flex justify-between items-center py-2 text-sm">
              {/* Left side - Empty space or can be removed entirely */}
              <div className="hidden md:flex items-center space-x-6">
                {/* Dubai.ae link removed */}
              </div>

              {/* Right side - Contact, services, authentication, and accessibility */}
              <div className="flex items-center space-x-4">
                <div className="hidden lg:flex items-center space-x-4">
                  <a 
                    href="tel:048729292" 
                    className="flex items-center space-x-1 hover:text-ehrdc-light-teal transition-colors"
                  >
                    <Phone className="h-3 w-3" />
                    <span>048729292</span>
                  </a>
                  <a 
                    href="mailto:recruitment@ehrdc.gov.ae" 
                    className="flex items-center space-x-1 hover:text-ehrdc-light-teal transition-colors"
                  >
                    <Mail className="h-3 w-3" />
                    <span>Contact</span>
                  </a>
                </div>

                {/* Authentication Links */}
                {!user && (
                  <div className="hidden md:flex items-center space-x-3">
                    <Link
                      to="/auth?tab=sign-in"
                      className="text-sm font-medium text-white hover:text-ehrdc-light-teal transition-colors px-3 py-1 rounded-md hover:bg-white/10"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/auth?tab=sign-up"
                      className="text-sm font-medium bg-white text-ehrdc-teal hover:bg-ehrdc-light-teal hover:text-white transition-colors px-3 py-1 rounded-md"
                    >
                      Join Now
                    </Link>
                  </div>
                )}

                {user && (
                  <div className="hidden md:flex items-center space-x-3">
                    <Link
                      to="/dashboard"
                      className="text-sm font-medium bg-white text-ehrdc-teal hover:bg-ehrdc-light-teal hover:text-white transition-colors px-3 py-1 rounded-md"
                    >
                      Dashboard
                    </Link>
                  </div>
                )}

                {/* Accessibility Toolbar */}
                <AccessibilityToolbar />

                {/* Language Switcher */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center space-x-1 hover:text-ehrdc-light-teal transition-colors">
                    <Globe className="h-4 w-4" />
                    <span>العربية</span>
                    <ChevronDown className="h-3 w-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32 bg-white border border-ehrdc-neutral-light shadow-lg">
                    <DropdownMenuItem className="hover:bg-ehrdc-light-teal/20 hover:text-ehrdc-teal">
                      <span className="font-medium">العربية</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-ehrdc-light-teal/20 hover:text-ehrdc-teal">
                      <span>English</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Main header section */}
        <div className="bg-white">
          <div className="dubai-container">
            <div className="flex items-center justify-between py-4">
              {/* Left side - Dubai Government Logo only */}
              <div className="flex items-center">
                <a 
                  href="https://tec.gov.ae/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center hover:opacity-80 transition-opacity"
                  aria-label="Visit Dubai Government TEC Portal"
                >
                  <img 
                    src="/lovable-uploads/8e8dde72-de3d-4664-b8d9-541c109edc51.png"
                    alt="Government of Dubai - The Executive Council"
                    className="h-12 md:h-16"
                  />
                </a>
              </div>

              {/* Center - Search functionality */}
              <div className="flex items-center">
                <div className="relative">
                  {isSearchOpen ? (
                    <form onSubmit={handleSearch} className="flex items-center">
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Search services..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-64 ps-10 pe-4 py-2 border border-ehrdc-neutral-light rounded-lg focus:ring-2 focus:ring-ehrdc-teal focus:border-ehrdc-teal"
                          autoFocus
                          aria-label="Search services"
                        />
                        <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ehrdc-neutral-dark" />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsSearchOpen(false)}
                        className="ms-2 text-ehrdc-neutral-dark hover:text-ehrdc-teal"
                        aria-label="Close search"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </form>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSearchOpen(true)}
                      className="flex items-center space-x-2 text-ehrdc-neutral-dark hover:text-ehrdc-teal hover:bg-ehrdc-light-teal/10 transition-colors"
                      aria-label="Open search"
                    >
                      <Search className="h-4 w-4" />
                      <span className="hidden md:inline">Search</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Right side - EHRDC Logo and mobile menu */}
              <div className="flex items-center space-x-4">
                {/* EHRDC Logo and Platform Name */}
                <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                  <img 
                    src="/lovable-uploads/e4ab7695-235d-451a-a304-556e2bb2b7e8.png"
                    alt="Emirati Human Resources Development Council"
                    className="h-10 md:h-12"
                  />
                  <div className="hidden lg:block">
                    <div className="flex flex-col">
                      <span className="font-bold text-lg text-ehrdc-teal leading-none">Emirati Gateway</span>
                      <span className="text-xs text-ehrdc-neutral-dark opacity-75 leading-none">EHRDC Digital Platform</span>
                    </div>
                  </div>
                </Link>

                {/* Mobile menu trigger */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden text-ehrdc-neutral-dark hover:text-ehrdc-teal"
                  aria-label="Open mobile menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile search overlay */}
        {isSearchOpen && (
          <div className="md:hidden bg-white border-t border-ehrdc-neutral-light p-4">
            <form onSubmit={handleSearch} className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full ps-10 pe-4 py-2 border border-ehrdc-neutral-light rounded-lg focus:ring-2 focus:ring-ehrdc-teal focus:border-ehrdc-teal"
                  autoFocus
                  aria-label="Search services"
                />
                <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ehrdc-neutral-dark" />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsSearchOpen(false)}
                className="border-ehrdc-neutral-light text-ehrdc-neutral-dark hover:text-ehrdc-teal hover:border-ehrdc-teal"
              >
                Cancel
              </Button>
            </form>
          </div>
        )}
      </header>
    </>
  );
};

export default DubaiGovHeader;
