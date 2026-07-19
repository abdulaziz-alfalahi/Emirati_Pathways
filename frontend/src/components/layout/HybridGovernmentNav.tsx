import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import { navigationGroups } from '@/components/navigation/navigationConfig';
import { useAuth } from '@/context/AuthContext';

interface HybridGovernmentNavProps {
  showAuthButtons?: boolean;
  currentPage?: string;
  userRole?: string;
}

const HybridGovernmentNav: React.FC<HybridGovernmentNavProps> = ({
  showAuthButtons = true,
  currentPage = '',
  userRole = ''
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  return (
    <>
      {/* Main Government Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            {/* Government Logos Section */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <img
                  src="/dubai-gov-logo.jpg"
                  alt="Government of Dubai"
                  className="h-20 w-auto"
                />
                <div className="w-px h-16 bg-slate-300"></div>
                <img
                  src="/ehrdc-logo.png"
                  alt="EHRDC Logo"
                  className="h-18 w-auto"
                  style={{ height: '4.5rem' }}
                />
              </div>
              <div className="hidden md:block">
                <Link to="/" className="hover:opacity-80 transition-opacity">
                  <h1 className="text-2xl font-bold text-foreground">Emirati Human Development Platform</h1>
                  <p className="text-sm text-muted-foreground">UAE Nationals Career Development</p>
                </Link>
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              {isAuthenticated && (
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              )}

              {showAuthButtons ? (
                <>
                  <Link
                    to="/auth"
                    className="hidden sm:block text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/auth"
                    className="bg-primary hover:bg-primary text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200 hover:shadow-lg flex items-center"
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4 ms-2" />
                  </Link>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  {userRole && (
                    <div className="hidden sm:flex items-center space-x-2">
                      <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                      <span className="text-sm text-muted-foreground capitalize">{userRole}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">U</span>
                    </div>
                    <span className="hidden sm:block text-sm text-slate-700">UAE National</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Dedicated Navigation Bar */}
      {isAuthenticated && (
        <nav className="bg-primary text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="hidden lg:flex items-center justify-center space-x-8 h-14">
              {navigationGroups.map((group) => (
                <div
                  key={group.id}
                  className="relative"
                  onMouseEnter={() => setActiveDropdown(group.id)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button className="flex items-center space-x-1 px-4 py-2 rounded-md text-white hover:bg-primary transition-colors font-medium">
                    <span>{group.name}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {activeDropdown === group.id && (
                    <div className="absolute top-full start-0 mt-1 w-80 bg-card rounded-lg shadow-xl border border-border z-50">
                      <div className="p-4">
                        <div className="mb-3">
                          <h3 className="font-semibold text-foreground text-lg">{group.name}</h3>
                          <p className="text-sm text-muted-foreground">{group.description}</p>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {group.items.map((item) => (
                            <Link
                              key={item.name}
                              to={item.href}
                              className="flex items-start space-x-3 p-3 rounded-md hover:bg-accent transition-colors group"
                            >
                              <item.icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-medium text-foreground group-hover:text-primary">
                                  {item.name}
                                </div>
                                <div className="text-sm text-muted-foreground line-clamp-2">
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
      )}

      {/* Mobile Navigation Menu */}
      {isAuthenticated && isMobileMenuOpen && (
        <div className="lg:hidden bg-card border-b border-border shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="space-y-4">
              {navigationGroups.map((group) => (
                <div key={group.id} className="border-b border-slate-100 pb-4 last:border-b-0">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center">
                    <span className="w-3 h-3 bg-primary rounded-full me-2"></span>
                    {group.name}
                  </h3>
                  <div className="grid grid-cols-1 gap-2 ms-5">
                    {group.items.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors py-1"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="text-sm">{item.name}</span>
                      </Link>
                    ))}
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

export default HybridGovernmentNav;
