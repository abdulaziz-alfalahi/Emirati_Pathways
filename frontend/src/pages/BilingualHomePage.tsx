import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Users, 
  Building2, 
  GraduationCap, 
  UserCheck, 
  Award,
  Sparkles,
  Shield,
  Globe,
  TrendingUp,
  CheckCircle,
  Star,
  Play
} from 'lucide-react';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';

// Import translations
import enTranslations from '@/locales/en/home-complete.json';
import arTranslations from '@/locales/ar/home-complete.json';

interface Translation {
  [key: string]: any;
}

const BilingualHomePage: React.FC = () => {
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'ar'>('en');
  const [translations, setTranslations] = useState<Translation>(enTranslations);

  useEffect(() => {
    setTranslations(currentLanguage === 'en' ? enTranslations : arTranslations);
  }, [currentLanguage]);

  const toggleLanguage = () => {
    setCurrentLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  const isRTL = currentLanguage === 'ar';

  const personas = [
    {
      id: 'job_seeker',
      title: translations.personas?.jobSeeker?.title || 'Job Seeker',
      description: translations.personas?.jobSeeker?.description || 'Find your dream career with AI-powered job matching and personalized career guidance',
      icon: Users,
      color: 'bg-blue-500',
      features: [
        translations.personas?.jobSeeker?.features?.aiMatching || 'AI Job Matching',
        translations.personas?.jobSeeker?.features?.cvBuilder || 'CV Builder',
        translations.personas?.jobSeeker?.features?.careerPlanning || 'Career Planning',
        translations.personas?.jobSeeker?.features?.skillAssessment || 'Skill Assessment'
      ],
      getStarted: translations.personas?.jobSeeker?.getStarted || 'Get Started as Job Seeker',
      popular: true
    },
    {
      id: 'hr_recruiter',
      title: translations.personas?.hrRecruiter?.title || 'HR / Recruiter',
      description: translations.personas?.hrRecruiter?.description || 'Streamline hiring with advanced recruitment tools and candidate analytics',
      icon: Building2,
      color: 'bg-green-500',
      features: [
        translations.personas?.hrRecruiter?.features?.talentPipeline || 'Talent Pipeline',
        translations.personas?.hrRecruiter?.features?.videoInterviews || 'Video Interviews',
        translations.personas?.hrRecruiter?.features?.analyticsDashboard || 'Analytics Dashboard',
        translations.personas?.hrRecruiter?.features?.complianceTools || 'Compliance Tools'
      ],
      getStarted: translations.personas?.hrRecruiter?.getStarted || 'Get Started as HR / Recruiter'
    },
    {
      id: 'educator',
      title: translations.personas?.educator?.title || 'Educator',
      description: translations.personas?.educator?.description || 'Enhance student outcomes with curriculum management and industry integration',
      icon: GraduationCap,
      color: 'bg-purple-500',
      features: [
        translations.personas?.educator?.features?.curriculumTools || 'Curriculum Tools',
        translations.personas?.educator?.features?.studentTracking || 'Student Tracking',
        translations.personas?.educator?.features?.industryPartnerships || 'Industry Partnerships',
        translations.personas?.educator?.features?.careerGuidance || 'Career Guidance'
      ],
      getStarted: translations.personas?.educator?.getStarted || 'Get Started as Educator'
    },
    {
      id: 'mentor',
      title: translations.personas?.mentor?.title || 'Mentor',
      description: translations.personas?.mentor?.description || 'Guide the next generation of professionals with AI-powered mentorship matching',
      icon: UserCheck,
      color: 'bg-orange-500',
      features: [
        translations.personas?.mentor?.features?.smartMatching || 'Smart Matching',
        translations.personas?.mentor?.features?.progressTracking || 'Progress Tracking',
        translations.personas?.mentor?.features?.resourceLibrary || 'Resource Library',
        translations.personas?.mentor?.features?.impactAnalytics || 'Impact Analytics'
      ],
      getStarted: translations.personas?.mentor?.getStarted || 'Get Started as Mentor'
    },
    {
      id: 'assessor',
      title: translations.personas?.assessor?.title || 'Assessor',
      description: translations.personas?.assessor?.description || 'Evaluate and validate professional competencies with advanced assessment tools',
      icon: Award,
      color: 'bg-red-500',
      features: [
        translations.personas?.assessor?.features?.competencyValidation || 'Competency Validation',
        translations.personas?.assessor?.features?.certificationTracking || 'Certification Tracking',
        translations.personas?.assessor?.features?.qualityAssurance || 'Quality Assurance',
        translations.personas?.assessor?.features?.analytics || 'Analytics'
      ],
      getStarted: translations.personas?.assessor?.getStarted || 'Get Started as Assessor'
    }
  ];

  const features = [
    {
      icon: Sparkles,
      title: translations.features?.aiIntelligence?.title || 'AI-Powered Intelligence',
      description: translations.features?.aiIntelligence?.description || 'Advanced Gemini 2.5 Pro integration for personalized career guidance and matching'
    },
    {
      icon: Shield,
      title: translations.features?.uaeSecurity?.title || 'UAE-Focused Security',
      description: translations.features?.uaeSecurity?.description || 'Secure platform exclusively for UAE Nationals with government-grade security'
    },
    {
      icon: Globe,
      title: translations.features?.culturalIntelligence?.title || 'Cultural Intelligence',
      description: translations.features?.culturalIntelligence?.description || 'Built-in understanding of UAE workplace culture and Emiratization goals'
    },
    {
      icon: TrendingUp,
      title: translations.features?.professionalGrowth?.title || 'Professional Growth',
      description: translations.features?.professionalGrowth?.description || 'Comprehensive development programs and mentorship opportunities for career advancement'
    }
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 font-dubai ${isRTL ? 'rtl arabic-text' : 'ltr english-text'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Navigation */}
      <HybridGovernmentNavFixed showAuthButtons={true} />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* AI Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-teal-100 text-teal-800 text-sm font-dubai-medium mb-8">
              <Sparkles className="w-4 h-4 mr-2" />
              {translations.hero?.poweredBy || 'Powered by Advanced AI Technology'}
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-dubai-bold text-slate-900 mb-6 leading-tight">
              {translations.hero?.title || 'Empowering UAE Nationals for Career Excellence'}
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              {translations.hero?.subtitle || 'The comprehensive AI-powered platform connecting UAE professionals, employers, educators, mentors, and assessors in one unified ecosystem for career development and growth.'}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/auth"
                className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-xl font-dubai-medium text-lg transition-all duration-200 hover:shadow-lg flex items-center"
              >
                {translations.hero?.startJourney || 'Start Your Journey'}
                <ArrowRight className={`w-5 h-5 ${isRTL ? 'mr-2' : 'ml-2'}`} />
              </Link>
              <button className="flex items-center text-slate-600 hover:text-slate-900 font-dubai-medium text-lg transition-colors">
                <Play className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {translations.hero?.watchDemo || 'Watch Demo'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-dubai-bold text-slate-900 mb-4">
              {translations.whyChoose?.title || 'Why Choose Emirati Journey Platform?'}
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              {translations.whyChoose?.subtitle || 'Built specifically for the UAE market with advanced AI technology and cultural intelligence'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-teal-600" />
                </div>
                <h3 className="text-xl font-dubai-medium text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Professional Pathways */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-dubai-bold text-slate-900 mb-4">
              {translations.pathways?.title || 'Choose Your Professional Path'}
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              {translations.pathways?.subtitle || 'Tailored experiences for every professional role in the UAE career ecosystem'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {personas.map((persona) => (
              <div key={persona.id} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow relative">
                {persona.popular && (
                  <div className="absolute -top-3 left-6">
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-dubai-medium">
                      {translations.pathways?.mostPopular || 'Most Popular'}
                    </span>
                  </div>
                )}
                
                <div className={`w-16 h-16 ${persona.color} rounded-xl flex items-center justify-center mb-6`}>
                  <persona.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-2xl font-dubai-bold text-slate-900 mb-4">{persona.title}</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">{persona.description}</p>

                <div className="space-y-3 mb-8">
                  {persona.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-teal-600 mr-3 flex-shrink-0" />
                      <span className="text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <Link
                  to={`/auth?role=${persona.id}`}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 px-6 rounded-xl font-dubai-medium transition-colors flex items-center justify-center"
                >
                  {persona.getStarted}
                  <ArrowRight className={`w-5 h-5 ${isRTL ? 'mr-2' : 'ml-2'}`} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Language Toggle Floating Button */}
      <button
        onClick={toggleLanguage}
        className="fixed bottom-6 right-6 bg-teal-600 hover:bg-teal-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl z-50"
        title={`Switch to ${currentLanguage === 'en' ? 'Arabic' : 'English'}`}
      >
        <Globe className="w-6 h-6" />
        <span className="sr-only">Toggle Language</span>
      </button>
    </div>
  );
};

export default BilingualHomePage;
