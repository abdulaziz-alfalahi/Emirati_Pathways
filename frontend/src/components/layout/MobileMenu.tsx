import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader,
  SheetTitle,
  SheetTrigger 
} from '@/components/ui/sheet';
import { 
  Menu, 
  LogIn, 
  X,
  ChevronRight,
  Home,
  Briefcase,
  GraduationCap,
  FileText,
  MapPin,
  Users,
  Award,
  BarChart3,
  Settings,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessibilityToolbar } from '@/components/accessibility/AccessibilityToolbar';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface MobileMenuProps {
  className?: string;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ className }) => {
  const { user } = useAuth();
  const { t } = useTranslation('common');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const mainNavItems = [
    { icon: Home, labelKey: 'nav.home', path: '/' },
    { icon: Briefcase, labelKey: 'nav.jobMatching', path: '/job-matching' },
    { icon: FileText, labelKey: 'nav.cvBuilder', path: '/cv-builder' },
    { icon: GraduationCap, labelKey: 'nav.scholarships', path: '/scholarships' },
    { icon: MapPin, labelKey: 'nav.careerJourney', path: '/career-journey' },
    { icon: Users, labelKey: 'nav.communities', path: '/communities' },
    { icon: Award, labelKey: 'nav.training', path: '/training' },
    { icon: BarChart3, labelKey: 'nav.analytics', path: '/analytics' }
  ];

  const secondaryNavItems = [
    { icon: Settings, labelKey: 'nav.settings', path: '/settings' },
    { icon: HelpCircle, labelKey: 'nav.helpCenter', path: '/help' }
  ];

  return (
    <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "h-10 w-10 text-ehrdc-neutral-dark hover:text-ehrdc-teal hover:bg-ehrdc-teal/10",
            "focus:ring-2 focus:ring-ehrdc-teal/20",
            className
          )}
          aria-label="Open mobile menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      
      <SheetContent 
        side="left" 
        className="w-80 p-0 bg-white border-r border-ehrdc-neutral-light"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-ehrdc-neutral-light bg-ehrdc-teal">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/e4ab7695-235d-451a-a304-556e2bb2b7e8.png"
                alt="EHRDC"
                className="h-8 w-8"
              />
              <div>
                <SheetTitle className="text-white text-lg font-bold">
                  {t('menu.emiratiGateway')}
                </SheetTitle>
                <p className="text-ehrdc-light-teal text-xs">{t('menu.ehrdcPlatform')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <LanguageToggle />
              <ThemeToggle />
              <AccessibilityToolbar />
            </div>
          </div>
        </SheetHeader>
        
        <div className="flex flex-col h-full">
          {/* User Section */}
          {user && (
            <div className="px-6 py-4 border-b border-ehrdc-neutral-light bg-ehrdc-neutral-light/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-ehrdc-teal rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user.user_metadata?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-ehrdc-neutral-dark">
                    {user.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-ehrdc-neutral-dark/70">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main Navigation */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-4">
              <h3 className="px-2 mb-3 text-xs font-semibold text-ehrdc-neutral-dark/70 uppercase tracking-wide">
                {t('menu.mainMenu')}
              </h3>
              <nav className="space-y-1">
                {mainNavItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-all duration-200",
                        "min-h-[44px] touch-manipulation", // Ensure 44px touch targets
                        "text-ehrdc-neutral-dark hover:text-ehrdc-teal hover:bg-ehrdc-teal/10",
                        "active:scale-98 active:bg-ehrdc-teal/20"
                      )}
                      onClick={closeMenu}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent className="h-5 w-5" />
                        <span>{t(item.labelKey)}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-ehrdc-neutral-dark/40" />
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Secondary Navigation */}
            <div className="px-4 py-4 border-t border-ehrdc-neutral-light">
              <h3 className="px-2 mb-3 text-xs font-semibold text-ehrdc-neutral-dark/70 uppercase tracking-wide">
                {t('menu.support')}
              </h3>
              <nav className="space-y-1">
                {secondaryNavItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-all duration-200",
                        "min-h-[44px] touch-manipulation", // Ensure 44px touch targets
                        "text-ehrdc-neutral-dark hover:text-ehrdc-teal hover:bg-ehrdc-teal/10",
                        "active:scale-98 active:bg-ehrdc-teal/20"
                      )}
                      onClick={closeMenu}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent className="h-5 w-5" />
                        <span>{t(item.labelKey)}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-ehrdc-neutral-dark/40" />
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-ehrdc-neutral-light bg-ehrdc-neutral-light/30">
            {!user ? (
              <div className="space-y-2">
                <Link to="/auth?tab=sign-in" onClick={closeMenu}>
                  <Button variant="outline" className="w-full justify-center border-ehrdc-teal text-ehrdc-teal hover:bg-ehrdc-teal hover:text-white">
                    <LogIn className="h-4 w-4 mr-2" />
                    {t('buttons.signIn')}
                  </Button>
                </Link>
                <Link to="/auth?tab=sign-up" onClick={closeMenu}>
                  <Button className="w-full justify-center ehrdc-button-primary">
                    {t('buttons.joinNow')}
                  </Button>
                </Link>
              </div>
            ) : (
              <Link to="/dashboard" onClick={closeMenu}>
                <Button className="w-full justify-center ehrdc-button-primary">
                  {t('buttons.goToDashboard')}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;
