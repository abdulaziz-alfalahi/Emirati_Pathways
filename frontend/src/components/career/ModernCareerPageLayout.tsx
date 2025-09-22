import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Star, Users, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';
import EnhancedHybridGovernmentNav from '@/components/layout/EnhancedHybridGovernmentNav';

interface Stat {
  value: string;
  label: string;
  icon: React.ComponentType<any>;
}

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface ModernCareerPageLayoutProps {
  title: string;
  description: string;
  heroIcon: React.ReactNode;
  primaryActionLabel: string;
  primaryActionIcon?: React.ReactNode;
  secondaryActionLabel?: string;
  stats: Stat[];
  quote?: string;
  attribution?: string;
  quoteIcon?: React.ReactNode;
  tabs: Tab[];
  defaultTab: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export const ModernCareerPageLayout: React.FC<ModernCareerPageLayoutProps> = ({
  title,
  description,
  heroIcon,
  primaryActionLabel,
  primaryActionIcon,
  secondaryActionLabel,
  stats,
  quote,
  attribution,
  quoteIcon,
  tabs,
  defaultTab,
  breadcrumbs = []
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Navigation */}
      <EnhancedHybridGovernmentNav showAuthButtons={false} />

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <nav className={`flex items-center space-x-2 text-sm ${isRTL ? 'space-x-reverse flex-row-reverse' : ''}`}>
              <Link to="/" className="text-slate-500 hover:text-slate-700 transition-colors">
                {t('home', 'Home')}
              </Link>
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  <ChevronDown className={`h-4 w-4 text-slate-400 ${isRTL ? 'rotate-90' : '-rotate-90'}`} />
                  {crumb.href ? (
                    <Link to={crumb.href} className="text-slate-500 hover:text-slate-700 transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-slate-900 font-medium">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center ${isRTL ? 'text-right' : 'text-left'} md:text-center`}>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl mb-8 shadow-lg">
              {heroIcon}
            </div>
            
            <h1 className={`text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight ${isRTL ? 'font-arabic' : ''}`}>
              {title}
            </h1>
            
            <p className={`text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed ${isRTL ? 'font-arabic' : ''}`}>
              {description}
            </p>
            
            <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
              <button className={`bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 hover:shadow-xl hover:scale-105 flex items-center group ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                {primaryActionLabel}
                {primaryActionIcon && (
                  <span className={`${isRTL ? 'mr-2' : 'ml-2'} group-hover:${isRTL ? '-translate-x-1' : 'translate-x-1'} transition-transform`}>
                    {primaryActionIcon}
                  </span>
                )}
              </button>
              
              {secondaryActionLabel && (
                <button className={`text-slate-600 hover:text-slate-900 font-medium transition-colors flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                  {secondaryActionLabel}
                  <ArrowRight className={`w-4 h-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-teal-400/10 to-emerald-400/10 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Stats Section */}
      {stats.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className={`text-center group ${isRTL ? 'text-right' : 'text-left'} md:text-center`}>
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className={`text-3xl font-bold text-slate-900 mb-2 ${isRTL ? 'font-arabic' : ''}`}>
                    {stat.value}
                  </div>
                  <div className={`text-slate-600 ${isRTL ? 'font-arabic' : ''}`}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Quote Section */}
      {quote && (
        <section className="py-16 bg-gradient-to-r from-teal-600 to-emerald-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`text-center ${isRTL ? 'text-right' : 'text-left'} md:text-center`}>
              {quoteIcon && (
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-6">
                  {quoteIcon}
                </div>
              )}
              <blockquote className={`text-2xl lg:text-3xl font-bold text-white mb-6 leading-relaxed ${isRTL ? 'font-arabic' : ''}`}>
                "{quote}"
              </blockquote>
              {attribution && (
                <cite className={`text-teal-100 text-lg ${isRTL ? 'font-arabic' : ''}`}>
                  — {attribution}
                </cite>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Tabs Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tab Navigation */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse flex-row-reverse' : ''} px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-teal-600 text-white shadow-lg'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm'
                }`}
              >
                {tab.icon}
                <span className={isRTL ? 'font-arabic' : ''}>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
            {activeTabContent}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-900">
        <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center ${isRTL ? 'text-right' : 'text-left'} md:text-center`}>
          <h2 className={`text-3xl lg:text-4xl font-bold text-white mb-6 ${isRTL ? 'font-arabic' : ''}`}>
            {t('ready_to_start', 'Ready to Start Your Journey?')}
          </h2>
          <p className={`text-xl text-slate-300 mb-10 leading-relaxed ${isRTL ? 'font-arabic' : ''}`}>
            {t('join_thousands', 'Join thousands of UAE nationals advancing their careers through our platform.')}
          </p>
          
          <div className={`flex flex-col sm:flex-row gap-4 justify-center ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
            <Link 
              to="/auth" 
              className={`bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 hover:shadow-xl flex items-center justify-center group ${isRTL ? 'flex-row-reverse font-arabic' : ''}`}
            >
              {t('get_started_today', 'Get Started Today')}
              <ArrowRight className={`w-5 h-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'} group-hover:${isRTL ? '-translate-x-1' : 'translate-x-1'} transition-transform`} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`grid md:grid-cols-3 gap-8 ${isRTL ? 'text-right' : 'text-left'}`}>
            <div>
              <div className={`flex items-center space-x-4 ${isRTL ? 'space-x-reverse flex-row-reverse' : ''} mb-4`}>
                <img 
                  src="/dubai-gov-logo.jpg" 
                  alt={t('government_of_dubai')} 
                  className="h-10 w-auto opacity-90"
                />
                <div className="w-px h-8 bg-slate-600"></div>
                <img 
                  src="/ehrdc-logo.png" 
                  alt={t('ehrdc_logo')} 
                  className="h-8 w-auto opacity-90"
                />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isRTL ? 'font-arabic' : ''}`}>
                {t('platform_title')}
              </h3>
              <p className={`text-slate-400 text-sm ${isRTL ? 'font-arabic' : ''}`}>
                {t('platform_subtitle')}
              </p>
            </div>
            
            <div>
              <h4 className={`font-semibold mb-4 ${isRTL ? 'font-arabic' : ''}`}>
                {t('quick_links', 'Quick Links')}
              </h4>
              <ul className={`space-y-2 text-slate-400 text-sm ${isRTL ? 'font-arabic' : ''}`}>
                <li><Link to="/" className="hover:text-white transition-colors">{t('home', 'Home')}</Link></li>
                <li><Link to="/career-planning-hub" className="hover:text-white transition-colors">{t('career_planning', 'Career Planning')}</Link></li>
                <li><Link to="/job-matching" className="hover:text-white transition-colors">{t('job_matching', 'Job Matching')}</Link></li>
                <li><Link to="/mentorship" className="hover:text-white transition-colors">{t('mentorship', 'Mentorship')}</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className={`font-semibold mb-4 ${isRTL ? 'font-arabic' : ''}`}>
                {t('contact_info', 'Contact Information')}
              </h4>
              <div className={`space-y-2 text-slate-400 text-sm ${isRTL ? 'font-arabic' : ''}`}>
                <p>048729292</p>
                <p>info@emiratijourney.ae</p>
                <p>{t('footer_location')}</p>
              </div>
            </div>
          </div>
          
          <div className={`mt-8 pt-8 border-t border-slate-800 text-center ${isRTL ? 'text-right' : 'text-left'} md:text-center`}>
            <p className={`text-slate-400 text-sm ${isRTL ? 'font-arabic' : ''}`}>
              {t('footer_copyright')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
