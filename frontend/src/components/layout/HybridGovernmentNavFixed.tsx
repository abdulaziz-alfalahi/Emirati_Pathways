import React, { useMemo, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Menu, X, ChevronDown, ChevronRight, Globe } from 'lucide-react';
import { navigationGroups, operationsNavGroup } from '@/components/navigation/navigationConfig';
import UserMenu from '@/components/layout/UserMenu';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { NotificationBell } from '@/components/notifications/NotificationSystem';
import { AccessibilityToolbar } from '@/components/accessibility/AccessibilityToolbar';
import { normalizeRole, getDashboardRoute, ROLE_DISPLAY_NAMES } from '@/types/auth';
import { useNavigate } from 'react-router-dom';

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
  userRole: propUserRole = '',
  onLanguageToggle,
  currentLanguage = 'en'
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDropdownEnter = useCallback((groupId: string) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setActiveDropdown(groupId);
  }, []);

  const handleDropdownLeave = useCallback(() => {
    closeTimerRef.current = setTimeout(() => {
      setActiveDropdown(null);
      closeTimerRef.current = null;
    }, 150);
  }, []);

  // Get authentication state
  const authContext = useAuth();
  const { user, isAuthenticated } = authContext;
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();

  // Get user role from authenticated user, fallback to prop
  const userRole = user?.role || propUserRole;

  // ── Role-based nav filtering ──
  // Define which nav items should be HIDDEN for each role category
  const hiddenPathsByRole: Record<string, string[]> = {
    // Government users: hide candidate-focused tools
    government: [
      '/analytics',        // candidate career analytics
      '/cv-builder',       // candidate tool
      '/portfolio',        // candidate tool
      '/interview-preparation', // candidate tool
      '/job-matching',     // candidate tool
      '/gig-marketplace',  // candidate tool
      '/internships',      // candidate tool
      '/emiratization-tracker', // consolidated into gov dashboard
    ],
    // Recruiter / HR: hide gov-only and some candidate tools
    recruiter: ['/emiratization-tracker'],
    hr_recruiter: ['/emiratization-tracker'],
    hr_manager: ['/emiratization-tracker'],
    // Operators: similar to government
    operator: [
      '/analytics',
      '/cv-builder',
      '/portfolio',
      '/interview-preparation',
      '/emiratization-tracker',
    ],
    growth_operator_company: [
      '/analytics',
      '/cv-builder',
      '/portfolio',
      '/interview-preparation',
      '/emiratization-tracker',
    ],
    growth_operator_candidate: [
      '/analytics',
      '/emiratization-tracker',
    ],
  };

  const hiddenPaths = hiddenPathsByRole[userRole.toLowerCase()] || [];

  // Determine if user is an operator/admin who should see the operations nav
  const isOperatorRole = ['operator', 'growth_operator', 'growth_operator_company', 'growth_operator_candidate',
    'growth_operator_education', 'growth_operator_assessment', 'growth_operator_mentorship',
    'growth_operator_community', 'growth_operator_monitoring', 'administrator', 'admin'
  ].includes(userRole.toLowerCase());

  // Filter nav groups — remove blocked items, then remove empty groups
  const filteredNavigationGroups = useMemo(() => {
    const baseGroups = isOperatorRole ? [...navigationGroups, operationsNavGroup] : navigationGroups;
    if (!hiddenPaths.length) return baseGroups;
    return baseGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item => !hiddenPaths.includes(item.href)),
      }))
      .filter(group => group.items.length > 0);
  }, [userRole, hiddenPaths.length, isOperatorRole]);

  const groupKeyMap = useMemo(() => ({
    education: {
      name: 'nav_education_pathway',
      desc: 'nav_education_pathway_desc'
    },
    career: {
      name: 'nav_career_entry',
      desc: 'nav_career_entry_desc'
    },
    professional: {
      name: 'nav_professional_growth',
      desc: 'nav_professional_growth_desc'
    },
    lifelong: {
      name: 'nav_lifelong_engagement',
      desc: 'nav_lifelong_engagement_desc'
    },
    operations: {
      name: 'Operations',
      desc: 'Operator dashboards and management tools'
    }
  }), []);

  // Function to get human-readable role display names
  const getRoleDisplayName = (role: string): string => {
    const roleMapEn: Record<string, string> = {
      'candidate': 'Job Seeker',
      'job_seeker': 'Job Seeker',
      'hr_recruiter': 'Recruiter',
      'recruiter': 'Recruiter',
      'hr_manager': 'HR Manager',
      'parent': 'Parent',
      'mentor': 'Mentor',
      'assessor': 'Assessor',
      'operator': 'Operator',
      'admin': 'Administrator',
      'administrator': 'Administrator',
      'training_center': 'Training Center',
      'educational_institution': 'Educational Institution',
      'government_entity': 'Government Entity',
      'private_sector': 'Private Sector',
      'advisor': 'Academic Advisor',
      'coach': 'Career Coach',
      'internship_coordinator': 'Internship Coordinator',
      'training_center_rep': 'Training Center',
      'call_center_agent': 'Call Center Agent',
    };
    const roleMapAr: Record<string, string> = {
      'candidate': 'باحث عن عمل',
      'job_seeker': 'باحث عن عمل',
      'hr_recruiter': 'مسؤول توظيف',
      'recruiter': 'مسؤول توظيف',
      'hr_manager': 'مدير الموارد البشرية',
      'parent': 'ولي أمر',
      'mentor': 'مرشد',
      'assessor': 'مُقيّم',
      'operator': 'مشغّل',
      'admin': 'مسؤول النظام',
      'administrator': 'مسؤول النظام',
      'training_center': 'مركز تدريب',
      'educational_institution': 'مؤسسة تعليمية',
      'government_entity': 'جهة حكومية',
      'private_sector': 'قطاع خاص',
      'advisor': 'مستشار أكاديمي',
      'coach': 'مدرب مهني',
      'internship_coordinator': 'منسق تدريب عملي',
      'training_center_rep': 'مركز تدريب',
      'call_center_agent': 'موظف مركز اتصال',
    };
    const roleMap = isRTL ? roleMapAr : roleMapEn;
    return roleMap[role.toLowerCase()] || role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const itemKeyByHref: Record<string, { name: string; desc: string }> = {
    '/school-programs': { name: 'nav_item_school_programs', desc: 'nav_item_school_programs_desc' },
    '/knowledge-camps': { name: 'nav_item_summer_camps', desc: 'nav_item_summer_camps_desc' },
    '/scholarships': { name: 'nav_item_scholarships', desc: 'nav_item_scholarships_desc' },
    '/university-programs': { name: 'nav_item_university_programs', desc: 'nav_item_university_programs_desc' },
    '/graduate-programs': { name: 'nav_item_graduate_programs', desc: 'nav_item_graduate_programs_desc' },
    '/lms': { name: 'nav_item_learning_management_system', desc: 'nav_item_learning_management_system_desc' },
    '/industry-exploration': { name: 'nav_item_industry_exploration', desc: 'nav_item_industry_exploration_desc' },
    '/career-hub': { name: 'nav_item_career_hub', desc: 'nav_item_career_hub_desc' },
    '/career-planning-hub': { name: 'nav_item_career_planning_hub', desc: 'nav_item_career_planning_hub_desc' },
    '/financial-planning': { name: 'nav_item_financial_planning', desc: 'nav_item_financial_planning_desc' },
    '/cv-builder': { name: 'nav_item_cv_builder', desc: 'nav_item_cv_builder_desc' },
    '/portfolio': { name: 'nav_item_portfolio', desc: 'nav_item_portfolio_desc' },
    '/interview-preparation': { name: 'nav_item_interview_preparation', desc: 'nav_item_interview_preparation_desc' },
    '/internships': { name: 'nav_item_internships', desc: 'nav_item_internships_desc' },
    '/job-matching': { name: 'nav_item_job_matching', desc: 'nav_item_job_matching_desc' },
    '/gig-marketplace': { name: 'nav_item_gig_marketplace', desc: 'nav_item_gig_marketplace_desc' },
    '/startup-launchpad': { name: 'nav_item_startup_launchpad', desc: 'nav_item_startup_launchpad_desc' },
    '/career-advisory': { name: 'nav_item_career_advisory', desc: 'nav_item_career_advisory_desc' },
    '/assessments': { name: 'nav_item_assessments', desc: 'nav_item_assessments_desc' },
    '/credentials': { name: 'nav_item_credentials', desc: 'nav_item_credentials_desc' },
    '/emiratization-tracker': { name: 'nav_item_emiratization_tracker', desc: 'nav_item_emiratization_tracker_desc' },
    '/analytics': { name: 'nav_item_analytics', desc: 'nav_item_analytics_desc' },
    '/digital-skills-development': { name: 'nav_item_digital_skills', desc: 'nav_item_digital_skills_desc' },
    '/training': { name: 'nav_item_training', desc: 'nav_item_training_desc' },
    '/professional-certifications': { name: 'nav_item_professional_certifications', desc: 'nav_item_professional_certifications_desc' },
    '/blockchain-credentials': { name: 'nav_item_blockchain_credentials', desc: 'nav_item_blockchain_credentials_desc' },
    '/mentorship': { name: 'nav_item_mentorship', desc: 'nav_item_mentorship_desc' },
    '/communities': { name: 'nav_item_communities', desc: 'nav_item_communities_desc' },
    '/youth-development': { name: 'nav_item_youth_development', desc: 'nav_item_youth_development_desc' },
    '/national-service': { name: 'nav_item_national_service', desc: 'nav_item_national_service_desc' },
    '/thought-leadership': { name: 'nav_item_thought_leadership', desc: 'nav_item_thought_leadership_desc' },
    '/share-success-stories': { name: 'nav_item_success_stories', desc: 'nav_item_success_stories_desc' },
    '/retiree': { name: 'nav_item_retiree_services', desc: 'nav_item_retiree_services_desc' },
    '/career-simulator': { name: 'nav_item_career_simulator', desc: 'nav_item_career_simulator_desc' },
    '/career-passport': { name: 'nav_item_career_passport', desc: 'nav_item_career_passport_desc' },
    '/interactive-map': { name: 'nav_item_interactive_map', desc: 'nav_item_interactive_map_desc' }
  };

  return (
    <>
      {/* Main Government Header */}
      <header className="bg-white border-b border-[#E2E5E9] sticky top-0 z-50" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between items-center h-20`}>
            {/* Government Logos Section */}
            <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center space-x-6 ${isRTL ? 'space-x-reverse' : ''}`}>
              <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
                <img
                  src="/dubai-gov-logo.jpg"
                  alt="Government of Dubai"
                  className="h-20 w-auto"
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.08))' }}
                />
                <div className="w-px h-16 bg-slate-300"></div>
                <img
                  src="/ehrdc-logo.png"
                  alt="EHRDC Logo"
                  className="h-20 w-auto"
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.08))' }}
                />
              </div>
              <div className="hidden md:block">
                <Link to="/" className="hover:opacity-80 transition-opacity">
                  <h1 className="text-xl font-bold text-slate-900">{t('platform_title', 'Dubai Human Development Platform')}</h1>
                  <p className="text-sm text-slate-600">{t('platform_subtitle', 'UAE Nationals Career Development')}</p>
                </Link>
              </div>
            </div>

            {/* Navigation Actions */}
            <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>

              {/* Accessibility & Theme Toolbar */}
              <AccessibilityToolbar />

              {/* Language Toggle */}
              <button
                onClick={onLanguageToggle || (() => i18n.changeLanguage(i18n.language === 'en' ? 'ar' : 'en'))}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Switch Language"
              >
                <Globe className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {i18n.language === 'en' ? 'العربية' : 'English'}
                </span>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>

              {/* Notification Bell - Added as per request (Global visibility) */}
              {isAuthenticated && user && (
                <div className="flex items-center">
                  <NotificationBell />
                </div>
              )}

              {/* Authentication Section */}
              {isAuthenticated && user ? (
                <div className="flex items-center space-x-4">
                  {userRole && (
                    (() => {
                      // Compute available roles for switcher
                      const rawRoles = [
                        ...(user?.roles || []),
                        user?.user_type,
                        ...(user?.secondary_roles || [])
                      ].filter(Boolean);
                      const uniqueRoles = Array.from(new Set(
                        rawRoles.map(r => normalizeRole(r as string))
                      )).filter(Boolean) as string[];
                      const hasMultipleRoles = uniqueRoles.length > 1;

                      return (
                        <div className="hidden sm:flex items-center relative">
                          <div className="w-2 h-2 bg-[#006E6D] rounded-full mr-2"></div>
                          {hasMultipleRoles ? (
                            <>
                              <button
                                onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
                                className="flex items-center gap-1 text-sm text-slate-600 hover:text-[#006E6D] transition-colors cursor-pointer"
                              >
                                {getRoleDisplayName(userRole)}
                                <ChevronDown className={`h-3 w-3 transition-transform ${roleSwitcherOpen ? 'rotate-180' : ''}`} />
                              </button>
                              {roleSwitcherOpen && (
                                <div
                                  className="absolute top-full right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 min-w-[180px]"
                                  onMouseLeave={() => setRoleSwitcherOpen(false)}
                                >
                                  {uniqueRoles.map(role => (
                                    <button
                                      key={role}
                                      onClick={async () => {
                                        if (role !== userRole.toLowerCase()) {
                                          await authContext.switchRole(role);
                                          navigate(getDashboardRoute(role));
                                        }
                                        setRoleSwitcherOpen(false);
                                      }}
                                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${normalizeRole(userRole) === role
                                          ? 'bg-[#F0F7F7] text-[#006E6D] font-medium'
                                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                    >
                                      {getRoleDisplayName(role)}
                                      {normalizeRole(userRole) === role && (
                                        <span className="text-xs text-slate-400 ml-2">•</span>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-sm text-slate-600">
                              {(user?.full_name === 'New Member' || (user?.first_name === 'New' && user?.last_name === 'Member'))
                                ? (isRTL ? 'عضو جديد' : 'New Member')
                                : getRoleDisplayName(userRole)}
                            </span>
                          )}
                        </div>
                      );
                    })()
                  )}
                  <UserMenu />
                </div>
              ) : showAuthButtons ? (
                <>
                  <Link
                    to="/auth"
                    className="hidden sm:block text-slate-600 hover:text-slate-900 font-medium transition-colors"
                  >
                    {t('sign_in', 'Sign In')}
                  </Link>
                  <Link
                    to="/auth"
                    className="bg-[#006E6D] hover:bg-[#005A59] text-white px-6 py-2.5 rounded-full font-medium transition-all duration-200 flex items-center"
                  >
                    {t('get_started', 'Get Started')}
                    <ArrowRight className={`w-4 h-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* Dedicated Navigation Bar */}
      <nav className="bg-white text-[#374151] border-b border-[#E2E5E9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`hidden lg:flex items-center justify-center space-x-8 ${isRTL ? 'space-x-reverse' : ''} h-14`}>
            {filteredNavigationGroups.map((group) => (
              <div
                key={group.id}
                className="relative"
                onMouseEnter={() => handleDropdownEnter(group.id)}
                onMouseLeave={handleDropdownLeave}
              >
                <button className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center space-x-1 ${isRTL ? 'space-x-reverse' : ''} px-4 py-2 rounded-xl text-[#374151] hover:bg-[#F0F7F7] hover:text-[#006E6D] transition-colors font-medium`}>
                  <span>{t(groupKeyMap[group.id as keyof typeof groupKeyMap]?.name || '', group.name)}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {activeDropdown === group.id && (
                  <div className={`absolute top-full ${isRTL ? 'right-0' : 'left-0'} mt-1 w-80 bg-white rounded-2xl border border-[#E2E5E9] z-50`} dir={isRTL ? 'rtl' : 'ltr'} style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                    <div className="p-4">
                      <div className="mb-3">
                        <h3 className="font-semibold text-slate-900 text-lg">{t(groupKeyMap[group.id as keyof typeof groupKeyMap]?.name || '', group.name)}</h3>
                        <p className="text-sm text-slate-600">{t(groupKeyMap[group.id as keyof typeof groupKeyMap]?.desc || '', group.description)}</p>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {group.items.map((item) => (
                          <Link
                            key={item.name}
                            to={item.href}
                            className="flex flex-row items-start gap-3 p-3 rounded-xl hover:bg-[#F0F7F7] transition-colors group"
                          >
                            <item.icon className="h-5 w-5 text-[#006E6D] mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="font-medium text-[#1A1A1A] group-hover:text-[#006E6D]">
                                {t(itemKeyByHref[item.href]?.name || '', item.name)}
                              </div>
                              <div className="text-sm text-slate-600 line-clamp-2">
                                {t(itemKeyByHref[item.href]?.desc || '', item.description)}
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
            {/* Our Mission — standalone nav link */}
            <Link
              to="/our-mission"
              className={`px-4 py-2 rounded-xl text-[#374151] hover:bg-[#F0F7F7] hover:text-[#006E6D] transition-colors font-medium ${currentPage === 'mission' ? 'bg-[#F0F7F7] text-[#006E6D]' : ''}`}
            >
              {t('nav_our_mission', isRTL ? 'رسالتنا' : 'Our Mission')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-background border-b border-border shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="space-y-4">
              {/* Mobile Language Toggle */}
              <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between items-center pb-4 border-b border-slate-100`}>
                <span className="text-sm font-medium text-slate-700">{t('language', 'Language')}</span>
                <button
                  onClick={onLanguageToggle}
                  className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''} px-3 py-2 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors`}
                >
                  <Globe className="h-4 w-4" />
                  <span className="text-sm">
                    {currentLanguage === 'en' ? 'العربية' : 'English'}
                  </span>
                </button>
              </div>

              {filteredNavigationGroups.map((group) => (
                <div key={group.id} className="border-b border-slate-100 pb-4 last:border-b-0">
                  <h3 className={`font-semibold text-slate-900 mb-3 flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center`}>
                    <span className={`w-3 h-3 bg-[#006E6D] rounded-full ${isRTL ? 'ml-2' : 'mr-2'}`}></span>
                    {t(groupKeyMap[group.id as keyof typeof groupKeyMap]?.name || '', group.name)}
                  </h3>
                  <div className={`grid grid-cols-1 gap-2 ${isRTL ? 'mr-5' : 'ml-5'}`}>
                    {group.items.slice(0, 4).map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`flex ${isRTL ? 'flex-row-reverse text-right' : 'flex-row text-left'} items-center gap-2 text-[#6B7280] hover:text-[#006E6D] transition-colors py-1`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="text-sm">{t(itemKeyByHref[item.href]?.name || '', item.name)}</span>
                      </Link>
                    ))}
                    {group.items.length > 4 && (
                      <Link
                        to={`/${group.id}`}
                        className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''} text-[#006E6D] font-medium py-1`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <ChevronRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                        <span className="text-sm">{t('view_all_options', 'View all options')} ({group.items.length})</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
              {/* Our Mission — mobile nav link */}
              <div className="border-b border-slate-100 pb-4">
                <Link
                  to="/our-mission"
                  className={`flex ${isRTL ? 'flex-row-reverse text-right' : 'flex-row text-left'} items-center gap-2 text-[#374151] hover:text-[#006E6D] transition-colors py-1 font-semibold`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className={`w-3 h-3 bg-[#006E6D] rounded-full`}></span>
                  <span>{t('nav_our_mission', isRTL ? 'رسالتنا' : 'Our Mission')}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HybridGovernmentNavFixed;
