import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Home, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import EnhancedHybridGovernmentNav from '../layout/EnhancedHybridGovernmentNav';

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
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Navigation Header */}
      <EnhancedHybridGovernmentNav />

      {/* Page Header */}
      <div className="bg-white border-b border-[#E2E5E9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <nav className="flex py-3" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                <li>
                  <Link
                    to="/"
                    className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                  >
                    <Home className="h-4 w-4" />
                    <span className="sr-only">{t('navigation.home')}</span>
                  </Link>
                </li>
                {breadcrumbs.map((item, index) => (
                  <li key={index} className="flex items-center">
                    <ChevronRight className="h-4 w-4 text-[#9CA3AF] mx-2" />
                    {item.href ? (
                      <Link
                        to={item.href}
                        className="text-sm font-medium text-[#6B7280] hover:text-[#1A1A1A] transition-colors"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-[#1A1A1A]">
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
                    className="inline-flex items-center px-3 py-2 border border-[#E2E5E9] text-sm font-medium rounded-xl text-[#374151] bg-white hover:bg-[#F4F5F7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#006E6D]/20 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('common.back')}
                  </button>
                )}
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="mt-2 text-sm md:text-base text-[#6B7280]">
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
      <footer className="bg-[#111827] text-white border-t-2 border-[#006E6D] mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* UAE Government Branding */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src="/dubai-gov-logo.jpg"
                  alt="Government of Dubai"
                  className="h-9 w-auto opacity-90"
                />
                <div className="w-px h-8 bg-gray-700"></div>
                <img
                  src="/ehrdc-logo.png"
                  alt="EHRDC Logo"
                  className="h-8 w-auto opacity-90"
                />
              </div>
              <h3 className="text-base font-semibold mb-1">
                {t('footer.platform_name')}
              </h3>
              <p className="text-gray-500 text-xs mb-3">
                {t('footer.government_subtitle')}
              </p>
              <p className="text-gray-400 text-sm leading-relaxed max-w-md">
                {t('footer.description')}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-medium uppercase tracking-wider text-gray-400 mb-3">
                {t('footer.quick_links')}
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/career-planning-hub"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {t('navigation.career_planning')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/job-matching"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {t('navigation.job_matching')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/cv-builder"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {t('navigation.cv_builder')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/mentorship"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {t('navigation.mentorship')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-sm font-medium uppercase tracking-wider text-gray-400 mb-3">
                {t('footer.contact')}
              </h4>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">
                  {t('footer.location')}
                </p>
                <p className="text-sm text-gray-400">
                  {t('footer.phone')}: 048729292
                </p>
                <p className="text-sm text-gray-400">
                  {t('footer.email')}: info@emiratijourney.ae
                </p>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-6 border-t border-gray-800">
            <p className="text-center text-xs text-gray-500">
              © 2025 {t('footer.platform_name')}. {t('footer.rights_reserved')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UnifiedPageLayout;
