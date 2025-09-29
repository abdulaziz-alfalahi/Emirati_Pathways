
import React, { createContext, useContext, useEffect, useState } from 'react';
import i18n from '../i18n/config';

type Language = 'en' | 'ar';
type Direction = 'ltr' | 'rtl';

interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (language: Language) => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
  defaultLanguage?: Language;
}

export function LanguageProvider({ children, defaultLanguage = 'en' }: LanguageProviderProps) {
  // Initialize state with a safer approach
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('language') : null;
      return (stored as Language) || defaultLanguage;
    } catch (error) {
      console.warn('Failed to read language from localStorage:', error);
      return defaultLanguage;
    }
  });

  const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';
  const isRTL = direction === 'rtl';

  const setLanguage = async (newLanguage: Language) => {
    console.log('Changing language to:', newLanguage);
    console.log('Current i18n language:', i18n.language);
    console.log('i18n isInitialized:', i18n.isInitialized);
    
    setLanguageState(newLanguage);
    
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('language', newLanguage);
      }
    } catch (error) {
      console.warn('Failed to save language to localStorage:', error);
    }
    
    // Change language in i18n
    try {
      await i18n.changeLanguage(newLanguage);
      console.log('Language changed successfully in i18n to:', i18n.language);
      
      // Force a re-render by triggering a storage event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'language',
          newValue: newLanguage,
          oldValue: language
        }));
      }
    } catch (error) {
      console.error('Failed to change language in i18n:', error);
    }
  };

  useEffect(() => {
    console.log('Language effect triggered:', language);
    console.log('i18n current language:', i18n.language);
    
    // Update document direction and language
    if (typeof document !== 'undefined') {
      document.documentElement.dir = direction;
      document.documentElement.lang = language;
      
      // Update CSS custom property for direction-aware styles
      document.documentElement.style.setProperty('--text-direction', direction);
    }
    
    // Set initial language in i18n
    const changeLanguage = async () => {
      try {
        if (i18n.isInitialized) {
          console.log('i18n is initialized, changing language to:', language);
          await i18n.changeLanguage(language);
        } else {
          console.log('i18n not initialized, waiting...');
          // Wait for i18n to initialize
          i18n.on('initialized', async () => {
            console.log('i18n initialized, changing language to:', language);
            await i18n.changeLanguage(language);
          });
        }
      } catch (error) {
        console.error('Failed to initialize language in i18n:', error);
      }
    };
    
    changeLanguage();
  }, [language, direction]);

  const value: LanguageContextType = {
    language,
    direction,
    setLanguage,
    isRTL,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
