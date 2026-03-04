import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageContextType {
  language: 'en' | 'ar';
  isRTL: boolean;
  toggleLanguage: () => void;
  setLanguage: (lang: 'en' | 'ar') => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<'en' | 'ar'>('en');
  const [isRTL, setIsRTL] = useState(false);

  // Initialize language from localStorage or browser preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language') as 'en' | 'ar';
    const browserLanguage = navigator.language.startsWith('ar') ? 'ar' : 'en';
    const initialLanguage = savedLanguage || browserLanguage;

    setLanguageState(initialLanguage);
    setIsRTL(initialLanguage === 'ar');
    i18n.changeLanguage(initialLanguage);

    // Set document direction and language
    document.documentElement.dir = initialLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = initialLanguage;

    // Add RTL class to body for CSS styling
    if (initialLanguage === 'ar') {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
  }, [i18n]);

  // Listen for external i18n language changes to stay in sync
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      const lang = (lng === 'ar' ? 'ar' : 'en') as 'en' | 'ar';
      setLanguageState(lang);
      setIsRTL(lang === 'ar');
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
      if (lang === 'ar') {
        document.body.classList.add('rtl');
      } else {
        document.body.classList.remove('rtl');
      }
    };
    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  const setLanguage = (lang: 'en' | 'ar') => {
    setLanguageState(lang);
    setIsRTL(lang === 'ar');
    i18n.changeLanguage(lang);
    localStorage.setItem('preferred-language', lang);

    // Update document direction and language
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;

    // Update body class for RTL styling
    if (lang === 'ar') {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
  };

  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'ar' : 'en';
    setLanguage(newLanguage);
  };

  // Enhanced translation function with fallback
  const t = (key: string, fallback?: string) => {
    const translation = i18n.t(key);
    if (translation === key && fallback) {
      return fallback;
    }
    return translation;
  };

  const value: LanguageContextType = {
    language,
    isRTL,
    toggleLanguage,
    setLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
