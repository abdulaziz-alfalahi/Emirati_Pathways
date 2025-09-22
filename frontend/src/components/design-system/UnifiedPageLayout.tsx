import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Home, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EnhancedHybridGovernmentNav } from '../layout/EnhancedHybridGovernmentNav';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface UnifiedPageLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  showBackButton?: boolean;
  headerActions?: React.ReactNode;
  className?: string;
}

export const UnifiedPageLayout: React.FC<UnifiedPageLayoutProps> = ({
  children,
  title,
  subtitle,
  breadcrumbs = [],
  showBackButton = false,
  headerActions,
  className = ''
}) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <EnhancedHybridGovernmentNav />
      
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <nav className="flex py-3" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                <li>
                  <Link
                    to="/"
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <Home className="h-4 w-4" />
                    <span className="sr-only">{t('navigation.home')}</span>
                  </Link>
                </li>
                {breadcrumbs.map((item, index) => (
                  <li key={index} className="flex items-center">
                    <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
                    {item.href ? (
                      <Link
                        to={item.href}
                        className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-gray-900">
                        {item.label}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {/* Page Title Section */}
          <div className="py-6 md:py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {showBackButton && (
                  <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('common.back')}
                  </button>
                )}
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="mt-2 text-sm md:text-base text-gray-600">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
              {headerActions && (
                <div className="flex items-center space-x-3">
                  {headerActions}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 ${className}`}>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* UAE Government Branding */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src="/api/placeholder/40/40"
                  alt="UAE Government"
                  className="h-10 w-10"
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t('footer.platform_name')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t('footer.government_subtitle')}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {t('footer.description')}
              </p>
              <div className="flex items-center space-x-4">
                <img
                  src="/api/placeholder/80/40"
                  alt="Dubai Government"
                  className="h-8"
                />
                <img
                  src="/api/placeholder/80/40"
                  alt="EHRDC"
                  className="h-8"
                />
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                {t('footer.quick_links')}
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/career-planning-hub"
                    className="text-sm text-gray-600 hover:text-teal-600 transition-colors"
                  >
                    {t('navigation.career_planning')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/job-matching"
                    className="text-sm text-gray-600 hover:text-teal-600 transition-colors"
                  >
                    {t('navigation.job_matching')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/cv-builder"
                    className="text-sm text-gray-600 hover:text-teal-600 transition-colors"
                  >
                    {t('navigation.cv_builder')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/mentorship"
                    className="text-sm text-gray-600 hover:text-teal-600 transition-colors"
                  >
                    {t('navigation.mentorship')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                {t('footer.contact')}
              </h4>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  {t('footer.location')}
                </p>
                <p className="text-sm text-gray-600">
                  {t('footer.phone')}: 048729292
                </p>
                <p className="text-sm text-gray-600">
                  {t('footer.email')}: info@emiratijourney.ae
                </p>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              © 2025 {t('footer.platform_name')}. {t('footer.rights_reserved')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UnifiedPageLayout;
