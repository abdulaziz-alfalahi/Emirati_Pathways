import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Menu, X, ChevronDown, ChevronRight, Globe } from 'lucide-react';
import { navigationGroups } from '@/components/navigation/navigationConfig';
import UserMenu from '@/components/layout/UserMenu';
import { useAuth } from '@/context/AuthContext';

interface HybridGovernmentNavProps {
  showAuthButtons?: boolean;
  currentPage?: string;
  userRole?: string;
  onLanguageToggle?: () => void;
  currentLanguage?: 'en' | 'ar';
}

const HybridGovernmentNavFixed: React.FC<HybridGovernmentNavProps> = ({ 
  showAuthButtons = true, 
  currentPage = '',
  userRole = '',
  onLanguageToggle,
  currentLanguage = 'en'
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Get authentication state
  const { user, isAuthenticated } = useAuth();

  return (
    <>
      {/* Main Government Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Government Logos Section */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <img 
                  src="/dubai-gov-logo.jpg" 
                  alt="Government of Dubai" 
                  className="h-14 w-auto"
                />
                <div className="w-px h-12 bg-slate-300"></div>
                <img 
                  src="/ehrdc-logo.png" 
                  alt="EHRDC Logo" 
                  className="h-12 w-auto"
                />
              </div>
              <div className="hidden md:block">
                <Link to="/" className="hover:opacity-80 transition-opacity">
                  <h1 className="text-xl font-bold text-slate-900">Emirati Journey Platform</h1>
                  <p className="text-sm text-slate-600">UAE Nationals Career Development</p>
                </Link>
              </div>
            </div>
            
            {/* Navigation Actions */}
            <div className="flex items-center space-x-4">
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Switch Language"
              >
                <Globe className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {currentLanguage === 'en' ? 'العربية' : 'English'}
                </span>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>

              {/* Language Toggle */}
              {onLanguageToggle && (
                <button
                  onClick={onLanguageToggle}
                  className="flex items-center space-x-2 text-slate-600 hover:text-teal-600 transition-colors px-3 py-2 rounded-lg hover:bg-slate-50"
                  title={`Switch to ${currentLanguage === 'en' ? 'Arabic' : 'English'}`}
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {currentLanguage === 'en' ? 'العربية' : 'English'}
                  </span>
                </button>
              )}

              {/* Authentication Section */}
              {isAuthenticated && user ? (
                <div className="flex items-center space-x-4">
                  {userRole && (
                    <div className="hidden sm:flex items-center space-x-2">
                      <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                      <span className="text-sm text-slate-600 capitalize">
                        {userRole === 'candidate' ? 'Job Seeker' : userRole}
                      </span>
                    </div>
                  )}
                  <span className="hidden sm:block text-sm text-slate-700">UAE National</span>
                  <UserMenu />
                </div>
              ) : showAuthButtons ? (
                <>
                  <Link 
                    to="/auth" 
                    className="hidden sm:block text-slate-600 hover:text-slate-900 font-medium transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/auth" 
                    className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200 hover:shadow-lg flex items-center"
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* Dedicated Navigation Bar */}
      <nav className="bg-teal-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hidden lg:flex items-center justify-center space-x-8 h-14">
            {navigationGroups.map((group) => (
              <div
                key={group.id}
                className="relative"
                onMouseEnter={() => setActiveDropdown(group.id)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="flex items-center space-x-1 px-4 py-2 rounded-md text-white hover:bg-teal-700 transition-colors font-medium">
                  <span>{group.name}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {activeDropdown === group.id && (
                  <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-lg shadow-xl border border-slate-200 z-50">
                    <div className="p-4">
                      <div className="mb-3">
                        <h3 className="font-semibold text-slate-900 text-lg">{group.name}</h3>
                        <p className="text-sm text-slate-600">{group.description}</p>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {group.items.map((item) => (
                          <Link
                            key={item.name}
                            to={item.href}
                            className="flex items-start space-x-3 p-3 rounded-md hover:bg-teal-50 transition-colors group"
                          >
                            <item.icon className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-slate-900 group-hover:text-teal-600">
                                {item.name}
                              </div>
                              <div className="text-sm text-slate-600 line-clamp-2">
                                {item.description}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="space-y-4">
              {/* Mobile Language Toggle */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-700">Language</span>
                <button
                  onClick={toggleLanguage}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  <span className="text-sm">
                    {currentLanguage === 'en' ? 'العربية' : 'English'}
                  </span>
                </button>
              </div>

              {navigationGroups.map((group) => (
                <div key={group.id} className="border-b border-slate-100 pb-4 last:border-b-0">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
                    <span className="w-3 h-3 bg-teal-600 rounded-full mr-2"></span>
                    {group.name}
                  </h3>
                  <div className="grid grid-cols-1 gap-2 ml-5">
                    {group.items.slice(0, 4).map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className="flex items-center space-x-2 text-slate-600 hover:text-teal-600 transition-colors py-1"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="text-sm">{item.name}</span>
                      </Link>
                    ))}
                    {group.items.length > 4 && (
                      <Link
                        to={`/${group.id}`}
                        className="flex items-center space-x-2 text-teal-600 font-medium py-1"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <ChevronRight className="h-4 w-4" />
                        <span className="text-sm">View all {group.items.length} options</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HybridGovernmentNavFixed;
