import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Menu, X, ChevronDown, ChevronRight, Globe } from 'lucide-react';
import { navigationGroups } from '@/components/navigation/navigationConfig';
import UserMenu from '@/components/layout/UserMenu';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

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
    }
  }), []);

  const itemKeyByHref: Record<string, { name: string; desc: string }> = {
    '/school-programs': { name: 'nav_item_school_programs', desc: 'nav_item_school_programs_desc' },
    '/summer-camps': { name: 'nav_item_summer_camps', desc: 'nav_item_summer_camps_desc' },
    '/scholarships': { name: 'nav_item_scholarships', desc: 'nav_item_scholarships_desc' },
    '/university-programs': { name: 'nav_item_university_programs', desc: 'nav_item_university_programs_desc' },
    '/graduate-programs': { name: 'nav_item_graduate_programs', desc: 'nav_item_graduate_programs_desc' },
    '/lms': { name: 'nav_item_learning_management_system', desc: 'nav_item_learning_management_system_desc' },
    '/industry-exploration': { name: 'nav_item_industry_exploration', desc: 'nav_item_industry_exploration_desc' },
    '/career-planning-hub': { name: 'nav_item_career_planning_hub', desc: 'nav_item_career_planning_hub_desc' },
    '/financial-planning': { name: 'nav_item_financial_planning', desc: 'nav_item_financial_planning_desc' },
    '/cv-builder': { name: 'nav_item_cv_builder', desc: 'nav_item_cv_builder_desc' },
    '/portfolio': { name: 'nav_item_portfolio', desc: 'nav_item_portfolio_desc' },
    '/interview-preparation': { name: 'nav_item_interview_preparation', desc: 'nav_item_interview_preparation_desc' },
    '/internships': { name: 'nav_item_internships', desc: 'nav_item_internships_desc' },
    '/job-matching': { name: 'nav_item_job_matching', desc: 'nav_item_job_matching_desc' },
    '/career-advisory': { name: 'nav_item_career_advisory', desc: 'nav_item_career_advisory_desc' },
    '/assessments': { name: 'assessments', desc: 'assessments_desc' },
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
    '/retiree': { name: 'nav_item_retiree_services', desc: 'nav_item_retiree_services_desc' }
  };

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
                  <h1 className="text-xl font-bold text-slate-900">{t('platform_title', 'Emirati Journey Platform')}</h1>
                  <p className="text-sm text-slate-600">{t('platform_subtitle', 'UAE Nationals Career Development')}</p>
                </Link>
              </div>
            </div>
            
            {/* Navigation Actions */}
            <div className="flex items-center space-x-4">
              {/* Language Toggle */}
              {onLanguageToggle && (
                <button
                  onClick={onLanguageToggle}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  title="Switch Language"
                >
                  <Globe className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {currentLanguage === 'en' ? 'العربية' : 'English'}
                  </span>
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>



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
                  <span className="hidden sm:block text-sm text-slate-700">{t('uae_national', 'UAE National')}</span>
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
                    className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200 hover:shadow-lg flex items-center"
                  >
                    {t('get_started', 'Get Started')}
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
                  <span>{t(groupKeyMap[group.id as keyof typeof groupKeyMap]?.name || '', group.name)}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {activeDropdown === group.id && (
                  <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-lg shadow-xl border border-slate-200 z-50">
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
                            className="flex items-start space-x-3 p-3 rounded-md hover:bg-teal-50 transition-colors group"
                          >
                            <item.icon className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-slate-900 group-hover:text-teal-600">
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
                <span className="text-sm font-medium text-slate-700">{t('language', 'Language')}</span>
                <button
                  onClick={onLanguageToggle}
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
                    {t(groupKeyMap[group.id as keyof typeof groupKeyMap]?.name || '', group.name)}
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
                        <span className="text-sm">{t(itemKeyByHref[item.href]?.name || '', item.name)}</span>
                      </Link>
                    ))}
                    {group.items.length > 4 && (
                      <Link
                        to={`/${group.id}`}
                        className="flex items-center space-x-2 text-teal-600 font-medium py-1"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <ChevronRight className="h-4 w-4" />
                        <span className="text-sm">{t('view_all_options', 'View all')} {group.items.length} {t('options', 'options')}</span>
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
