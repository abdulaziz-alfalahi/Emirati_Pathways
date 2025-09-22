
import React, { useEffect, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface AccessibilityManagerProps {
  children: React.ReactNode;
  pageTitle: string;
  pageDescription: string;
  mainContentId?: string;
}

export const AccessibilityManager: React.FC<AccessibilityManagerProps> = ({
  children,
  pageTitle,
  pageDescription,
  mainContentId = 'main-content'
}) => {
  const { language, isRTL } = useLanguage();
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const previousLanguageRef = useRef(language);

  useEffect(() => {
    // Announce language change to screen readers
    if (previousLanguageRef.current !== language && liveRegionRef.current) {
      const announcement = language === 'ar' 
        ? 'تم تغيير اللغة إلى العربية' 
        : 'Language changed to English';
      
      liveRegionRef.current.textContent = announcement;
      
      // Clear the announcement after a short delay
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = '';
        }
      }, 2000);
    }
    
    previousLanguageRef.current = language;
  }, [language]);

  const skipLinkText = language === 'ar' 
    ? 'انتقل إلى المحتوى الرئيسي' 
    : 'Skip to main content';

  const navigationSkipText = language === 'ar'
    ? 'انتقل إلى التنقل'
    : 'Skip to navigation';

  return (
    <>
      {/* Skip Links */}
      <div className="skip-links">
        <a
          href={`#${mainContentId}`}
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
          aria-label={skipLinkText}
        >
          {skipLinkText}
        </a>
        <a
          href="#navigation"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-20 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
          aria-label={navigationSkipText}
        >
          {navigationSkipText}
        </a>
      </div>

      {/* Live Region for Dynamic Announcements */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      />

      {/* Main Content Container */}
      <div
        id={mainContentId}
        role="main"
        aria-label={pageTitle}
        lang={language}
        dir={isRTL ? 'rtl' : 'ltr'}
        className="focus:outline-none"
        tabIndex={-1}
      >
        {/* Page Header for Screen Readers */}
        <div className="sr-only">
          <h1>{pageTitle}</h1>
          <p>{pageDescription}</p>
        </div>
        
        {children}
      </div>
    </>
  );
};
