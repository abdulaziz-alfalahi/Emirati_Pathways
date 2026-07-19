import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { NavGroup } from '@/components/layout/types';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { NotificationIcon } from '@/components/notifications/NotificationIcon';

interface MainNavProps {
  navGroups: NavGroup[];
}

const MainNav: React.FC<MainNavProps> = ({ navGroups }) => {
  const { user } = useAuth();
  const { t } = useTranslation('navigation');
  const { language } = useLanguage();
  const location = useLocation();

  // Reverse the order of navigation groups for Arabic (RTL)
  const orderedNavGroups = language === 'ar' ? [...navGroups].reverse() : navGroups;

  return (
    <div className={`flex items-center ${language === 'ar' ? 'space-x-reverse space-x-6' : 'space-x-6'}`}>
      {/* Logo */}
      <Link to="/" className={`flex items-center ${language === 'ar' ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
        <div className="font-bold text-xl text-primary">{t('emiratiGateway')}</div>
      </Link>

      {/* Navigation Menu */}
      <NavigationMenu dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <NavigationMenuList className={language === 'ar' ? 'flex-row-reverse' : ''}>
          {orderedNavGroups.map((group) => (
            <NavigationMenuItem key={group.id}>
              <NavigationMenuTrigger className="text-foreground hover:text-primary">
                {t(`groups.${group.id}.title`)}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  <div className="row-span-3">
                    <NavigationMenuLink asChild>
                      <Link
                        className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-ehrdc-light-teal/50 to-ehrdc-teal p-6 no-underline outline-none focus:shadow-md"
                        to={group.items[0]?.href || '/'}
                      >
                        <div className="mb-2 mt-4 text-lg font-medium text-white">
                          {t(`groups.${group.id}.title`)}
                        </div>
                        <p className="text-sm leading-tight text-white/90">
                          {t(`groups.${group.id}.description`)}
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </div>
                  {group.items.map((item) => {
                    // Map the item name to the translation key
                    const getItemKey = (itemName: string) => {
                      const nameToKeyMap: { [key: string]: string } = {
                        'Knowledge Camps': 'summerCamps',
                        'School Programs': 'schoolPrograms',
                        'Scholarships': 'scholarships',
                        'University Programs': 'universityPrograms',
                        'Learning Management System': 'lms',
                        'Career Planning Hub': 'planningHub',
                        'Graduate Programs': 'graduatePrograms',
                        'Internships': 'internships',
                        'Job Matching': 'jobMatching',
                        'Career Advisory': 'advisory',
                        'Resume Builder': 'resumeBuilder',
                        'Portfolio': 'portfolio',
                        'Interview Preparation': 'interviewPrep',
                        'Digital Skills Development': 'digitalSkills',
                        'Professional Certifications': 'certifications',
                        'Training Programs': 'training',
                        'Assessments': 'assessments',
                        'Mentorship': 'mentorship',
                        'Communities': 'communities',
                        'National Service': 'nationalService',
                        'Youth Development': 'youthDevelopment',
                        'Success Stories': 'successStories',
                        'Blockchain Credentials': 'blockchainCredentials',
                        'Analytics': 'analytics',
                        'Financial Planning': 'financialPlanning',
                        'Thought Leadership': 'thoughtLeadership',
                        'Retiree Services': 'candidate'
                      };
                      return nameToKeyMap[itemName] || itemName.toLowerCase().replace(/\s+/g, '');
                    };

                    const itemKey = getItemKey(item.name);

                    return (
                      <NavigationMenuLink key={item.name} asChild>
                        <Link
                          to={item.href}
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">
                            {t(`groups.${group.id}.items.${itemKey}.title`)}
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            {t(`groups.${group.id}.items.${itemKey}.description`)}
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    );
                  })}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>

      {/* Right side items */}
      <div className={`flex items-center ms-auto ${language === 'ar' ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
        {user && <NotificationIcon />}

        {/* Dashboard link for authenticated users */}
        {user && (
          <Link
            to="/dashboard"
            className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/dashboard' ? 'text-primary' : 'text-foreground'
              }`}
          >
            {t('dashboard')}
          </Link>
        )}
      </div>
    </div>
  );
};

export default MainNav;

