import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { navigationGroups } from '@/components/navigation/navigationConfig';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';

interface EnhancedGovernmentHeaderProps {
  showAuthButtons?: boolean;
  currentPage?: string;
  userRole?: string;
}

const EnhancedGovernmentHeader: React.FC<EnhancedGovernmentHeaderProps> = ({
  showAuthButtons = true,
  currentPage = '',
  userRole = ''
}) => {
  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
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
                <h1 className="text-xl font-bold text-slate-900">Dubai Human Development Platform</h1>
                <p className="text-sm text-slate-600">UAE Nationals Career Development</p>
              </Link>
            </div>
          </div>

          {/* Enhanced Navigation Menu */}
          <div className="hidden lg:flex items-center space-x-1">
            <NavigationMenu>
              <NavigationMenuList>
                {navigationGroups.map((group) => (
                  <NavigationMenuItem key={group.id}>
                    <NavigationMenuTrigger className="text-slate-700 hover:text-teal-600 font-medium px-3 py-2 rounded-md transition-colors">
                      {group.name}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                        <div className="row-span-3">
                          <NavigationMenuLink asChild>
                            <Link
                              className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-teal-50 to-teal-600 p-6 no-underline outline-none focus:shadow-md"
                              to={group.items[0]?.href || '/'}
                            >
                              <div className="mb-2 mt-4 text-lg font-medium text-white">
                                {group.name}
                              </div>
                              <p className="text-sm leading-tight text-white/90">
                                {group.description}
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        </div>
                        {group.items.slice(0, 6).map((item) => (
                          <NavigationMenuLink key={item.name} asChild>
                            <Link
                              to={item.href}
                              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-teal-50 hover:text-teal-600 focus:bg-teal-50 focus:text-teal-600"
                            >
                              <div className="text-sm font-medium leading-none flex items-center">
                                <item.icon className="h-4 w-4 mr-2 text-teal-600" />
                                {item.name}
                              </div>
                              <p className="line-clamp-2 text-sm leading-snug text-slate-600">
                                {item.description}
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        ))}
                        {group.items.length > 6 && (
                          <NavigationMenuLink asChild>
                            <Link
                              to={`/${group.id}`}
                              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-teal-50 hover:text-teal-600 focus:bg-teal-50 focus:text-teal-600 border-t border-slate-200 mt-2 pt-3"
                            >
                              <div className="text-sm font-medium leading-none text-teal-600">
                                View All {group.name} →
                              </div>
                              <p className="text-sm leading-snug text-slate-600">
                                See all {group.items.length} options
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        )}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Navigation Actions */}
          <div className="flex items-center space-x-4">
            {showAuthButtons ? (
              <>
                <Link
                  to="/auth"
                  className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
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
            ) : (
              <div className="flex items-center space-x-4">
                {userRole && (
                  <div className="hidden sm:flex items-center space-x-2">
                    <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                    <span className="text-sm text-slate-600 capitalize">{userRole}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">U</span>
                  </div>
                  <span className="hidden sm:block text-sm text-slate-700">UAE National</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className="lg:hidden border-t border-slate-200 py-4">
          <div className="grid grid-cols-2 gap-4">
            {navigationGroups.map((group) => (
              <div key={group.id} className="space-y-2">
                <h3 className="font-medium text-slate-900 text-sm">{group.name}</h3>
                <div className="space-y-1">
                  {group.items.slice(0, 3).map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="block text-sm text-slate-600 hover:text-teal-600 transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                  {group.items.length > 3 && (
                    <Link
                      to={`/${group.id}`}
                      className="block text-sm text-teal-600 font-medium"
                    >
                      +{group.items.length - 3} more →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default EnhancedGovernmentHeader;
