import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import root translation files
import enTranslations from '../locales/en.json';
import arTranslations from '../locales/ar.json';

// ── English namespace imports ──
import enAnalytics from '../locales/en/analytics.json';
import enAssessments from '../locales/en/assessments.json';
import enBlockchainCredentials from '../locales/en/blockchain-credentials.json';
import enCareerAdvisory from '../locales/en/career-advisory.json';
import enCareerPlanningHub from '../locales/en/career-planning-hub.json';
import enCommon from '../locales/en/common.json';
import enCommunities from '../locales/en/communities.json';
import enCredentials from '../locales/en/credentials.json';
import enCVBuilder from '../locales/en/cv-builder.json';
import enDigitalSkills from '../locales/en/digital-skills-development.json';
import enFinancialPlanning from '../locales/en/financial-planning.json';
import enForms from '../locales/en/forms.json';
import enGraduatePrograms from '../locales/en/graduate-programs.json';
import enHome from '../locales/en/home.json';
import enHomeComplete from '../locales/en/home-complete.json';
import enIndustryExploration from '../locales/en/industry-exploration.json';
import enInternships from '../locales/en/internships.json';
import enInterviewPreparation from '../locales/en/interview-preparation.json';
import enJobs from '../locales/en/jobs.json';
import enLms from '../locales/en/lms.json';
import enMentorship from '../locales/en/mentorship.json';
import enNationalService from '../locales/en/national-service.json';
import enNavigation from '../locales/en/navigation.json';
import enNetworking from '../locales/en/networking.json';
import enPortfolio from '../locales/en/portfolio.json';
import enProfessionalCertifications from '../locales/en/professional-certifications.json';
import enResumeBuilder from '../locales/en/resume-builder.json';
import enRetiree from '../locales/en/retiree.json';
import enScholarships from '../locales/en/scholarships.json';
import enSchoolPrograms from '../locales/en/school-programs.json';
import enShareSuccessStories from '../locales/en/share-success-stories.json';
import enSummerCamps from '../locales/en/summer-camps.json';
import enThoughtLeadership from '../locales/en/thought-leadership.json';
import enTraining from '../locales/en/training.json';
import enUniversityPrograms from '../locales/en/university-programs.json';
import enYouthDevelopment from '../locales/en/youth-development.json';

// ── Arabic namespace imports ──
import arAnalytics from '../locales/ar/analytics.json';
import arAssessments from '../locales/ar/assessments.json';
import arBlockchainCredentials from '../locales/ar/blockchain-credentials.json';
import arCareerAdvisory from '../locales/ar/career-advisory.json';
import arCareerPlanningHub from '../locales/ar/career-planning-hub.json';
import arCommon from '../locales/ar/common.json';
import arCommunities from '../locales/ar/communities.json';
import arCredentials from '../locales/ar/credentials.json';
import arCVBuilder from '../locales/ar/cv-builder.json';
import arDigitalSkills from '../locales/ar/digital-skills-development.json';
import arFinancialPlanning from '../locales/ar/financial-planning.json';
import arForms from '../locales/ar/forms.json';
import arGraduatePrograms from '../locales/ar/graduate-programs.json';
import arHome from '../locales/ar/home.json';
import arHomeComplete from '../locales/ar/home-complete.json';
import arIndustryExploration from '../locales/ar/industry-exploration.json';
import arInternships from '../locales/ar/internships.json';
import arInterviewPreparation from '../locales/ar/interview-preparation.json';
import arJobs from '../locales/ar/jobs.json';
import arLms from '../locales/ar/lms.json';
import arMentorship from '../locales/ar/mentorship.json';
import arNationalService from '../locales/ar/national-service.json';
import arNavigation from '../locales/ar/navigation.json';
import arNetworking from '../locales/ar/networking.json';
import arPortfolio from '../locales/ar/portfolio.json';
import arProfessionalCertifications from '../locales/ar/professional-certifications.json';
import arResumeBuilder from '../locales/ar/resume-builder.json';
import arRetiree from '../locales/ar/retiree.json';
import arScholarships from '../locales/ar/scholarships.json';
import arSchoolPrograms from '../locales/ar/school-programs.json';
import arShareSuccessStories from '../locales/ar/share-success-stories.json';
import arSummerCamps from '../locales/ar/summer-camps.json';
import arThoughtLeadership from '../locales/ar/thought-leadership.json';
import arTraining from '../locales/ar/training.json';
import arUniversityPrograms from '../locales/ar/university-programs.json';
import arYouthDevelopment from '../locales/ar/youth-development.json';

// ── All namespace keys ──
const allNamespaces = [
  'translation',
  'analytics', 'assessments', 'blockchain-credentials',
  'career-advisory', 'career-planning-hub', 'common',
  'communities', 'credentials', 'cv-builder',
  'digital-skills-development', 'financial-planning', 'forms',
  'graduate-programs', 'home', 'home-complete',
  'industry-exploration', 'internships', 'interview-preparation',
  'jobs', 'lms', 'mentorship',
  'national-service', 'navigation', 'networking',
  'portfolio', 'professional-certifications', 'resume-builder',
  'retiree', 'scholarships', 'school-programs',
  'share-success-stories', 'summer-camps', 'thought-leadership',
  'training', 'university-programs', 'youth-development',
];

const resources = {
  en: {
    translation: enTranslations,
    'analytics': enAnalytics,
    'assessments': enAssessments,
    'blockchain-credentials': enBlockchainCredentials,
    'career-advisory': enCareerAdvisory,
    'career-planning-hub': enCareerPlanningHub,
    'common': enCommon,
    'communities': enCommunities,
    'credentials': enCredentials,
    'cv-builder': enCVBuilder,
    'digital-skills-development': enDigitalSkills,
    'financial-planning': enFinancialPlanning,
    'forms': enForms,
    'graduate-programs': enGraduatePrograms,
    'home': enHome,
    'home-complete': enHomeComplete,
    'industry-exploration': enIndustryExploration,
    'internships': enInternships,
    'interview-preparation': enInterviewPreparation,
    'jobs': enJobs,
    'lms': enLms,
    'mentorship': enMentorship,
    'national-service': enNationalService,
    'navigation': enNavigation,
    'networking': enNetworking,
    'portfolio': enPortfolio,
    'professional-certifications': enProfessionalCertifications,
    'resume-builder': enResumeBuilder,
    'retiree': enRetiree,
    'scholarships': enScholarships,
    'school-programs': enSchoolPrograms,
    'share-success-stories': enShareSuccessStories,
    'summer-camps': enSummerCamps,
    'thought-leadership': enThoughtLeadership,
    'training': enTraining,
    'university-programs': enUniversityPrograms,
    'youth-development': enYouthDevelopment,
  },
  ar: {
    translation: arTranslations,
    'analytics': arAnalytics,
    'assessments': arAssessments,
    'blockchain-credentials': arBlockchainCredentials,
    'career-advisory': arCareerAdvisory,
    'career-planning-hub': arCareerPlanningHub,
    'common': arCommon,
    'communities': arCommunities,
    'credentials': arCredentials,
    'cv-builder': arCVBuilder,
    'digital-skills-development': arDigitalSkills,
    'financial-planning': arFinancialPlanning,
    'forms': arForms,
    'graduate-programs': arGraduatePrograms,
    'home': arHome,
    'home-complete': arHomeComplete,
    'industry-exploration': arIndustryExploration,
    'internships': arInternships,
    'interview-preparation': arInterviewPreparation,
    'jobs': arJobs,
    'lms': arLms,
    'mentorship': arMentorship,
    'national-service': arNationalService,
    'navigation': arNavigation,
    'networking': arNetworking,
    'portfolio': arPortfolio,
    'professional-certifications': arProfessionalCertifications,
    'resume-builder': arResumeBuilder,
    'retiree': arRetiree,
    'scholarships': arScholarships,
    'school-programs': arSchoolPrograms,
    'share-success-stories': arShareSuccessStories,
    'summer-camps': arSummerCamps,
    'thought-leadership': arThoughtLeadership,
    'training': arTraining,
    'university-programs': arUniversityPrograms,
    'youth-development': arYouthDevelopment,
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
    ns: allNamespaces,
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
    saveMissing: false,

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
