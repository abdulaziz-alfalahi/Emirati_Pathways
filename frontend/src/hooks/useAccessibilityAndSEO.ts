
import { useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface SEOData {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
}

interface AccessibilityOptions {
  skipLinkTarget?: string;
  mainContentId?: string;
  navigationId?: string;
}

export const useAccessibilityAndSEO = (
  seoData: SEOData,
  options: AccessibilityOptions = {}
) => {
  const { language, direction, isRTL } = useLanguage();
  
  useEffect(() => {
    // Update document language and direction
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    
    // Update meta tags
    const updateMetaTag = (name: string, content: string, attribute: string = 'name') => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };
    
    // Basic SEO meta tags
    document.title = seoData.title;
    updateMetaTag('description', seoData.description);
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    
    if (seoData.keywords) {
      updateMetaTag('keywords', seoData.keywords);
    }
    
    // Language and direction meta tags
    updateMetaTag('language', language);
    updateMetaTag('content-language', language);
    updateMetaTag('text-direction', direction);
    
    // Open Graph meta tags
    updateMetaTag('og:title', seoData.title, 'property');
    updateMetaTag('og:description', seoData.description, 'property');
    updateMetaTag('og:type', 'website', 'property');
    updateMetaTag('og:locale', language === 'ar' ? 'ar_AE' : 'en_US', 'property');
    
    // Twitter Card meta tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', seoData.title);
    updateMetaTag('twitter:description', seoData.description);
    
    // Canonical URL
    if (seoData.canonicalUrl) {
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', seoData.canonicalUrl);
    }
    
    // Accessibility enhancements
    const body = document.body;
    body.setAttribute('data-language', language);
    body.setAttribute('data-direction', direction);
    
    // Add skip links if not present
    if (options.skipLinkTarget && !document.querySelector('.skip-link')) {
      const skipLink = document.createElement('a');
      skipLink.href = options.skipLinkTarget;
      skipLink.className = 'skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:start-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded';
      skipLink.textContent = language === 'ar' ? 'انتقل إلى المحتوى الرئيسي' : 'Skip to main content';
      skipLink.setAttribute('aria-label', language === 'ar' ? 'انتقل إلى المحتوى الرئيسي' : 'Skip to main content');
      document.body.insertBefore(skipLink, document.body.firstChild);
    }
    
  }, [language, direction, seoData, options]);

  // Generate structured data for JSON-LD
  const generateStructuredData = (campData?: any[]) => {
    const baseStructuredData = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": seoData.title,
      "description": seoData.description,
      "inLanguage": language === 'ar' ? 'ar-AE' : 'en-US',
      "isPartOf": {
        "@type": "WebSite",
        "name": "Emirati Gateway",
        "url": "https://emiratigateway.gov.ae"
      }
    };

    if (campData && campData.length > 0) {
      const events = campData.map(camp => ({
        "@type": "Event",
        "name": camp.title,
        "description": camp.description,
        "location": camp.location,
        "offers": {
          "@type": "Offer",
          "price": camp.price,
          "priceCurrency": "AED"
        },
        "organizer": {
          "@type": "Organization",
          "name": "Emirati Human Resources Development Council"
        }
      }));

      return {
        ...baseStructuredData,
        "mainEntity": events
      };
    }

    return baseStructuredData;
  };

  return {
    generateStructuredData,
    isRTL
  };
};
