import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Menu, X, ChevronDown, ChevronRight, Globe, Phone, Mail } from 'lucide-react';
import { navigationGroups } from '@/components/navigation/navigationConfig';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from 'react-i18next';

interface EnhancedHybridGovernmentNavProps {
  showAuthButtons?: boolean;
  currentPage?: string;
  userRole?: string;
}

const EnhancedHybridGovernmentNav: React.FC<EnhancedHybridGovernmentNavProps> = ({ 
  showAuthButtons = true, 
  currentPage = '',
  userRole = ''
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { language, setLanguage, isRTL } = useLanguage();
  const { t } = useTranslation();

  const handleLanguageToggle = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <>
      {/* Top Government Contact Bar */}
      <div className="bg-slate-800 text-white py-2 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between items-center`}>
            <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center space-x-6 ${isRTL ? 'space-x-reverse' : ''}`}>
              <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                <Phone className="h-4 w-4" />
                <span>048729292</span>
              </div>
              <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                <Mail className="h-4 w-4" />
                <span>info@emiratijourney.ae</span>
              </div>
            </div>
            
            {/* Language Toggle */}
            <button
              onClick={handleLanguageToggle}
              className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''} px-3 py-1 rounded-md hover:bg-slate-700 transition-colors`}
            >
              <Globe className="h-4 w-4" />
              <span className="font-medium">
                {language === 'en' ? 'العربية' : 'English'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Government Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between items-center h-20`}>
            {/* Government Logos Section */}
            <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center space-x-6 ${isRTL ? 'space-x-reverse' : ''}`}>
              <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
                <img 
                  src="/dubai-gov-logo.jpg" 
                  alt={t('government_of_dubai', 'Government of Dubai')} 
                  className="h-14 w-auto"
                />
                <div className="w-px h-12 bg-slate-300"></div>
                <img 
                  src="/ehrdc-logo.png" 
                  alt={t('ehrdc_logo', 'EHRDC Logo')} 
                  className="h-12 w-auto"
                />
              </div>
              <div className="hidden md:block">
                <Link to="/" className="hover:opacity-80 transition-opacity">
                  <h1 className={`text-xl font-bold text-slate-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('platform_title', 'Emirati Journey Platform')}
                  </h1>
                  <p className={`text-sm text-slate-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('platform_subtitle', 'UAE Nationals Career Development')}
                  </p>
                </Link>
              </div>
            </div>
            
            {/* Navigation Actions */}
            <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>

              {showAuthButtons ? (
                <>
                  <Link 
                    to="/auth" 
                    className="hidden sm:block text-slate-600 hover:text-slate-900 font-medium transition-colors"
                  >
                    {t('sign_in', 'Sign In')}
                  </Link>
                  <Link 
                    to="/auth" 
                    className={`bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200 hover:shadow-lg flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center`}
                  >
                    {t('get_started', 'Get Started')}
                    <ArrowRight className={`w-4 h-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                  </Link>
                </>
              ) : (
                <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
                  {userRole && (
                    <div className={`hidden sm:flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                      <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                      <span className="text-sm text-slate-600 capitalize">{userRole}</span>
                    </div>
                  )}
                  <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                    <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">U</span>
                    </div>
                    <span className="hidden sm:block text-sm text-slate-700">
                      {t('uae_national', 'UAE National')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Dedicated Navigation Bar */}
      <nav className="bg-teal-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`hidden lg:flex items-center justify-center space-x-8 ${isRTL ? 'space-x-reverse' : ''} h-14`}>
            {navigationGroups.map((group) => (
              <div
                key={group.id}
                className="relative"
                onMouseEnter={() => setActiveDropdown(group.id)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center space-x-1 ${isRTL ? 'space-x-reverse' : ''} px-4 py-2 rounded-md text-white hover:bg-teal-700 transition-colors font-medium`}>
                  <span>{t(`nav_${group.id}`, group.name)}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {activeDropdown === group.id && (
                  <div className={`absolute top-full ${isRTL ? 'right-0' : 'left-0'} mt-1 w-80 bg-white rounded-lg shadow-xl border border-slate-200 z-50`}>
                    <div className="p-4">
                      <div className="mb-3">
                        <h3 className={`font-semibold text-slate-900 text-lg ${isRTL ? 'text-right' : 'text-left'}`}>
                          {t(`nav_${group.id}`, group.name)}
                        </h3>
                        <p className={`text-sm text-slate-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {t(`nav_${group.id}_desc`, group.description)}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {group.items.map((item) => (
                          <Link
                            key={item.name}
                            to={item.href}
                            className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3 ${isRTL ? 'space-x-reverse' : ''} p-3 rounded-md hover:bg-teal-50 transition-colors group`}
                          >
                            <item.icon className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                            <div className={isRTL ? 'text-right' : 'text-left'}>
                              <div className="font-medium text-slate-900 group-hover:text-teal-600">
                                {t(`nav_item_${item.name.toLowerCase().replace(/\\s+/g, '_')}`, item.name)}
                              </div>
                              <div className="text-sm text-slate-600 line-clamp-2">
                                {t(`nav_item_${item.name.toLowerCase().replace(/\\s+/g, '_')}_desc`, item.description)}
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
              {navigationGroups.map((group) => (
                <div key={group.id} className="border-b border-slate-100 pb-4 last:border-b-0">
                  <h3 className={`font-semibold text-slate-900 mb-3 flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center`}>
                    <span className={`w-3 h-3 bg-teal-600 rounded-full ${isRTL ? 'ml-2' : 'mr-2'}`}></span>
                    {t(`nav_${group.id}`, group.name)}
                  </h3>
                  <div className={`grid grid-cols-1 gap-2 ${isRTL ? 'mr-5' : 'ml-5'}`}>
                    {group.items.slice(0, 4).map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''} text-slate-600 hover:text-teal-600 transition-colors py-1`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="text-sm">
                          {t(`nav_item_${item.name.toLowerCase().replace(/\\s+/g, '_')}`, item.name)}
                        </span>
                      </Link>
                    ))}
                    {group.items.length > 4 && (
                      <Link
                        to={`/${group.id}`}
                        className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''} text-teal-600 font-medium py-1`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <ChevronRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                        <span className="text-sm">
                          {t('view_all_options', `View all ${group.items.length} options`)}
                        </span>
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

export default EnhancedHybridGovernmentNav;
