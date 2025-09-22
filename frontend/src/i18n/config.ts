import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from '../locales/en.json';
import arTranslations from '../locales/ar.json';

// Import namespace-specific translations
import enCareerPlanningHub from '../locales/en/career-planning-hub.json';
import arCareerPlanningHub from '../locales/ar/career-planning-hub.json';
import enCareerAdvisory from '../locales/en/career-advisory.json';
import arCareerAdvisory from '../locales/ar/career-advisory.json';

const resources = {
  en: {
    translation: enTranslations,
    'career-planning-hub': enCareerPlanningHub,
    'career-advisory': enCareerAdvisory
  },
  ar: {
    translation: arTranslations,
    'career-planning-hub': arCareerPlanningHub,
    'career-advisory': arCareerAdvisory
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    


    interpolation: {
      escapeValue: false, // React already does escaping
    },



    // Language-specific configurations
    lng: 'en', // default language
    
    // Namespace configuration
    defaultNS: 'translation',
    ns: ['translation', 'career-planning-hub', 'career-advisory'],

    // Key separator
    keySeparator: '.',
    
    // Nesting separator
    nsSeparator: ':',

    // Pluralization
    pluralSeparator: '_',
    contextSeparator: '_',

    // Formatting
    returnObjects: true,
    returnEmptyString: false,
    returnNull: false,

    // Load path for additional namespaces
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // Language detection options
    detection: {
      order: [
        'localStorage',
        'sessionStorage',
        'navigator',
        'htmlTag',
        'path',
        'subdomain'
      ],
      lookupLocalStorage: 'preferred-language',
      lookupSessionStorage: 'preferred-language',
      lookupFromPathIndex: 0,
      lookupFromSubdomainIndex: 0,
      caches: ['localStorage', 'sessionStorage'],
      excludeCacheFor: ['cimode'],
      checkWhitelist: true
    },

    // Whitelist languages
    whitelist: ['en', 'ar'],
    nonExplicitWhitelist: true,

    // Load languages
    preload: ['en', 'ar'],

    // Clean code
    cleanCode: true,
    
    // Postprocessing
    postProcess: ['interval', 'plural'],

    // Savemissing
    saveMissing: process.env.NODE_ENV === 'development',
    saveMissingTo: 'current',

    // Update missing
    updateMissing: process.env.NODE_ENV === 'development',

    // Missing key handler
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation key: ${key} for language: ${lng}`);
      }
    },

    // Parsers
    parseMissingKeyHandler: (key) => {
      return key;
    },

    // Append namespace to missing key
    appendNamespaceToMissingKey: false,

    // Compatibility
    compatibilityJSON: 'v3',

    // React options
    react: {
      bindI18n: 'languageChanged',
      bindI18nStore: '',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
      useSuspense: false,
    }
  });

// Language change handler
i18n.on('languageChanged', (lng) => {
  // Update document direction
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
  
  // Update body class for styling
  if (lng === 'ar') {
    document.body.classList.add('rtl');
    document.body.classList.remove('ltr');
  } else {
    document.body.classList.add('ltr');
    document.body.classList.remove('rtl');
  }
  
  // Store preference
  localStorage.setItem('preferred-language', lng);
});

// Initialize direction on load
const currentLang = i18n.language || 'en';
document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = currentLang;

if (currentLang === 'ar') {
  document.body.classList.add('rtl');
} else {
  document.body.classList.add('ltr');
}

export default i18n;
