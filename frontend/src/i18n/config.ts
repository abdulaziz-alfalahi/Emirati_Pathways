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
import enCVBuilder from '../locales/en/cv-builder.json';
import arCVBuilder from '../locales/ar/cv-builder.json';
import enAssessments from '../locales/en/assessments.json';
import arAssessments from '../locales/ar/assessments.json';


const resources = {
  en: {
    translation: enTranslations,
    'career-planning-hub': enCareerPlanningHub,
    'career-advisory': enCareerAdvisory,
    'cv-builder': enCVBuilder,
    'assessments': enAssessments
  },
  ar: {
    translation: arTranslations,
    'career-planning-hub': arCareerPlanningHub,
    'career-advisory': arCareerAdvisory,
    'cv-builder': arCVBuilder,
    'assessments': arAssessments
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
    lng: 'en',
    defaultNS: 'translation',
    ns: ['translation', 'career-planning-hub', 'career-advisory', 'cv-builder', 'assessments'],
    keySeparator: false,
    nsSeparator: ':',
    returnObjects: true,
    returnEmptyString: false,
    returnNull: false,
    detection: {
      order: [
        'localStorage',
        'sessionStorage',
        'navigator',
      ],
      lookupLocalStorage: 'preferred-language',
      lookupSessionStorage: 'preferred-language',
      caches: ['localStorage', 'sessionStorage'],
    },
    whitelist: ['en', 'ar'],
    nonExplicitWhitelist: true,
    saveMissing: false, // Disable trying to post missing keys

    react: {
      useSuspense: false,
      bindI18n: 'languageChanged',
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
