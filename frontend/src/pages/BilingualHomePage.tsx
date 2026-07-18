import React, { useState, useEffect, useRef } from 'react';
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
  Briefcase,
  Heart,
  BarChart3,
  Target,
  Zap,
  Quote
} from 'lucide-react';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import InteractiveDashboardDemo from '@/components/demo/InteractiveDashboardDemo';

// Import translations
import enTranslations from '@/locales/en/home-complete.json';
import arTranslations from '@/locales/ar/home-complete.json';

interface Translation {
  [key: string]: any;
}

/* ------------------------------------------------------------------ */
/*  Animated counter – counts from 0 to target when section scrolls in */
/* ------------------------------------------------------------------ */
const AnimatedCounter: React.FC<{ target: number; suffix?: string; duration?: number }> = ({
  target,
  suffix = '+',
  duration = 2000,
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/*  Dashboard mockup SVG – decorative hero graphic                     */
/* ------------------------------------------------------------------ */
const DashboardMockup: React.FC = () => (
  <div className="relative w-full max-w-lg mx-auto">
    {/* Glassmorphism card */}
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-200/60 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 font-dubai">Career Dashboard</p>
          <p className="text-sm font-dubai-medium text-slate-900">Performance Overview</p>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-teal-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-teal-300" />
          <div className="w-2.5 h-2.5 rounded-full bg-teal-200" />
        </div>
      </div>

      {/* Mini bar chart */}
      <div className="flex items-end gap-2 h-28">
        {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm transition-all duration-700"
            style={{
              height: `${h}%`,
              background: i >= 9 ? '#0d9488' : i >= 6 ? '#14b8a6' : '#99f6e4',
            }}
          />
        ))}
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Match Score', value: '94%', icon: Target },
          { label: 'Applications', value: '12', icon: Zap },
          { label: 'Interviews', value: '5', icon: BarChart3 },
        ].map(({ label, value, icon: Icon }, i) => (
          <div key={i} className="bg-slate-50 rounded-lg p-3 text-center">
            <Icon className="w-4 h-4 text-teal-600 mx-auto mb-1" />
            <p className="text-lg font-dubai-bold text-slate-900">{value}</p>
            <p className="text-[10px] text-slate-500">{label}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Decorative floating elements */}
    <div className="absolute -top-4 -right-4 w-20 h-20 bg-teal-100/60 rounded-full blur-2xl" />
    <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-teal-50/80 rounded-full blur-3xl" />
  </div>
);

/* ================================================================== */
/*  BilingualHomePage                                                   */
/* ================================================================== */
const BilingualHomePage: React.FC = () => {
  const { i18n } = useTranslation();
  const { language: contextLanguage, isRTL, toggleLanguage } = useLanguage();
  const currentLanguage = contextLanguage;
  const [translations, setTranslations] = useState<Translation>(contextLanguage === 'ar' ? arTranslations : enTranslations);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  useEffect(() => {
    setTranslations(contextLanguage === 'ar' ? arTranslations : enTranslations);
  }, [contextLanguage]);

  // Real platform stats for the hero counters — was hardcoded 10,000/500/2,500/15,000
  // marketing figures. Fetch actual aggregate counts from the public stats endpoint. (audit INT-01)
  const [realStats, setRealStats] = useState<{
    active_users: number; partner_companies: number; expert_mentors: number; successful_placements: number;
  } | null>(null);
  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE_URL || '';
    fetch(`${base}/api/public/platform-stats`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.success && j.data) setRealStats(j.data); })
      .catch(() => { /* homepage still renders without stats */ });
  }, []);

  /* ---- data ---- */
  const personas = [
    {
      id: 'candidate',
      title: translations.personas?.jobSeeker?.title || 'Job Seeker',
      description: translations.personas?.jobSeeker?.description || 'Find your dream career with AI-powered job matching and personalized career guidance',
      icon: Users,
      color: 'bg-teal-500',
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600',
      features: [
        translations.personas?.jobSeeker?.features?.aiMatching || 'AI Job Matching',
        translations.personas?.jobSeeker?.features?.cvBuilder || 'CV Builder',
        translations.personas?.jobSeeker?.features?.careerPlanning || 'Career Planning',
        translations.personas?.jobSeeker?.features?.skillAssessment || 'Skill Assessment',
      ],
      getStarted: translations.personas?.jobSeeker?.getStarted || 'Get Started as Job Seeker',
      popular: true,
    },
    {
      id: 'recruiter',
      title: translations.personas?.recruiter?.title || 'Recruiter',
      description: translations.personas?.recruiter?.description || 'Find and attract top talent with AI-powered sourcing and candidate management tools',
      icon: Briefcase,
      color: 'bg-indigo-500',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      features: [
        translations.personas?.recruiter?.features?.talentPipeline || 'Talent Pipeline',
        translations.personas?.recruiter?.features?.candidateSourcing || 'Candidate Sourcing',
        translations.personas?.recruiter?.features?.videoInterviews || 'Video Interviews',
        translations.personas?.recruiter?.features?.offerManagement || 'Offer Management',
      ],
      getStarted: translations.personas?.recruiter?.getStarted || 'Get Started as Recruiter',
    },
    {
      id: 'employer_admin',
      title: translations.personas?.hrManager?.title || 'HR Manager',
      description: translations.personas?.hrManager?.description || 'Oversee workforce planning, compliance, and organizational development strategies',
      icon: Building2,
      color: 'bg-blue-500',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      features: [
        translations.personas?.hrManager?.features?.workforcePlanning || 'Workforce Planning',
        translations.personas?.hrManager?.features?.analyticsDashboard || 'Analytics Dashboard',
        translations.personas?.hrManager?.features?.complianceTools || 'Compliance Tools',
        translations.personas?.hrManager?.features?.emiratization || 'Emiratization Tracking',
      ],
      getStarted: translations.personas?.hrManager?.getStarted || 'Get Started as HR Manager',
    },
    {
      id: 'training_provider',
      title: translations.personas?.educator?.title || 'Educator',
      description: translations.personas?.educator?.description || 'Enhance student outcomes with curriculum management and industry integration',
      icon: GraduationCap,
      color: 'bg-purple-500',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      features: [
        translations.personas?.educator?.features?.curriculumTools || 'Curriculum Tools',
        translations.personas?.educator?.features?.studentTracking || 'Student Tracking',
        translations.personas?.educator?.features?.industryPartnerships || 'Industry Partnerships',
        translations.personas?.educator?.features?.careerGuidance || 'Career Guidance',
      ],
      getStarted: translations.personas?.educator?.getStarted || 'Get Started as Educator',
    },
    {
      id: 'mentor',
      title: translations.personas?.mentor?.title || 'Mentor',
      description: translations.personas?.mentor?.description || 'Guide the next generation of professionals with AI-powered mentorship matching',
      icon: UserCheck,
      color: 'bg-amber-500',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      features: [
        translations.personas?.mentor?.features?.smartMatching || 'Smart Matching',
        translations.personas?.mentor?.features?.progressTracking || 'Progress Tracking',
        translations.personas?.mentor?.features?.resourceLibrary || 'Resource Library',
        translations.personas?.mentor?.features?.impactAnalytics || 'Impact Analytics',
      ],
      getStarted: translations.personas?.mentor?.getStarted || 'Get Started as Mentor',
    },
    {
      id: 'assessor',
      title: translations.personas?.assessor?.title || 'Assessor',
      description: translations.personas?.assessor?.description || 'Evaluate and validate professional competencies with advanced assessment tools',
      icon: Award,
      color: 'bg-rose-500',
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-600',
      features: [
        translations.personas?.assessor?.features?.competencyValidation || 'Competency Validation',
        translations.personas?.assessor?.features?.certificationTracking || 'Certification Tracking',
        translations.personas?.assessor?.features?.qualityAssurance || 'Quality Assurance',
        translations.personas?.assessor?.features?.analytics || 'Analytics',
      ],
      getStarted: translations.personas?.assessor?.getStarted || 'Get Started as Assessor',
    },
    {
      id: 'parent',
      title: translations.personas?.parent?.title || 'Parent / Guardian',
      description: translations.personas?.parent?.description || "Monitor your children's education, activities, and development with comprehensive tracking tools",
      icon: Heart,
      color: 'bg-pink-500',
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600',
      features: [
        translations.personas?.parent?.features?.academicTracking || 'Academic Tracking',
        translations.personas?.parent?.features?.campEnrollment || 'Camp Enrollment',
        translations.personas?.parent?.features?.eventCalendar || 'Event Calendar',
        translations.personas?.parent?.features?.progressReports || 'Progress Reports',
      ],
      getStarted: translations.personas?.parent?.getStarted || 'Get Started as Parent',
    },
  ];

  const features = [
    {
      icon: Sparkles,
      title: translations.features?.aiIntelligence?.title || 'AI-Powered Intelligence',
      description: translations.features?.aiIntelligence?.description || 'Advanced AI integration for personalized career guidance and matching',
    },
    {
      icon: Shield,
      title: translations.features?.uaeSecurity?.title || 'UAE-Focused Security',
      description: translations.features?.uaeSecurity?.description || 'Secure platform exclusively for UAE Nationals with government-grade security',
    },
    {
      icon: Globe,
      title: translations.features?.culturalIntelligence?.title || 'Cultural Intelligence',
      description: translations.features?.culturalIntelligence?.description || 'Built-in understanding of UAE workplace culture and Emiratization goals',
    },
    {
      icon: TrendingUp,
      title: translations.features?.professionalGrowth?.title || 'Professional Growth',
      description: translations.features?.professionalGrowth?.description || 'Comprehensive development programs and mentorship opportunities for career advancement',
    },
  ];

  // Values come from the real /api/public/platform-stats counts (0 until loaded), not
  // hardcoded marketing numbers. (audit INT-01)
  const stats = [
    { value: realStats?.active_users ?? 0, label: translations.stats?.users?.label || 'Active Users' },
    { value: realStats?.partner_companies ?? 0, label: translations.stats?.partners?.label || 'Partner Companies' },
    { value: realStats?.expert_mentors ?? 0, label: translations.stats?.mentors?.label || 'Expert Mentors' },
    { value: realStats?.successful_placements ?? 0, label: translations.stats?.placements?.label || 'Successful Placements' },
  ];

  const testimonials = translations.testimonials?.items || [
    { quote: 'The AI-powered career matching helped me find my dream role in government technology within weeks.', name: 'Ahmed Al Maktoum', role: 'Software Engineer', company: 'Dubai Digital Authority' },
    { quote: 'As a recruiter, this platform has transformed how we find and attract Emirati talent.', name: 'Fatima Al Hashimi', role: 'HR Director', company: 'Emirates NBD' },
    { quote: 'The mentorship matching connected me with an incredible mentor who guided my transition seamlessly.', name: 'Omar Al Suwaidi', role: 'Business Analyst', company: 'Etisalat by e&' },
  ];

  /* ---- render ---- */
  return (
    <div
      className={`min-h-screen bg-[#FAFBFC] font-dubai ${isRTL ? 'rtl arabic-text' : 'ltr english-text'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Navigation */}
      <HybridGovernmentNavFixed
        showAuthButtons={true}
        onLanguageToggle={toggleLanguage}
        currentLanguage={currentLanguage}
      />

      {/* Main landmark. The skip link targets #main-content; this page did not
          render a <main> at all, so the skip link pointed at nothing (WCAG 2.4.1
          bypass-blocks) and the page had no main landmark. */}
      <main id="main-content" tabIndex={-1}>

      {/* ============================================================ */}
      {/*  HERO SECTION                                                 */}
      {/* ============================================================ */}
      <section className="relative py-20 lg:py-28 bg-gradient-to-br from-teal-50/40 via-white to-slate-50 overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute top-10 right-0 w-96 h-96 bg-teal-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-50/50 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Text column — in RTL, CSS grid auto-reverses so this goes right */}
            <div>
              {/* AI Badge */}
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-teal-100/80 text-teal-700 text-sm font-dubai-medium mb-8 border border-teal-200/50">
                <Sparkles className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {translations.hero?.poweredBy || 'Powered by Advanced AI Technology'}
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-dubai-bold text-slate-900 mb-6 leading-tight">
                {currentLanguage === 'ar' ? (
                  <>
                    تمكين المواطنين الإماراتيين لتحقيق{' '}
                    <span className="text-teal-600">التميز المهني</span>
                  </>
                ) : (
                  <>
                    Empowering UAE Nationals for{' '}
                    <span className="text-teal-600">Career Excellence</span>
                  </>
                )}
              </h1>

              {/* Subtitle */}
              <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-xl">
                {translations.hero?.subtitle ||
                  'The comprehensive AI-powered platform connecting UAE professionals, employers, educators, mentors, and assessors in one unified ecosystem for career development and growth.'}
              </p>


            </div>

            {/* Dashboard mockup — auto moves to left in RTL via grid */}
            <div className="hidden lg:block">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  STATS BAR                                                    */}
      {/* ============================================================ */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-3xl md:text-4xl font-dubai-bold text-teal-600 mb-1">
                  <AnimatedCounter target={stat.value} />
                </p>
                <p className="text-sm text-slate-500 font-dubai-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  WHY CHOOSE / FEATURES                                        */}
      {/* ============================================================ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-dubai-bold text-slate-900 mb-4">
              {translations.whyChoose?.title || 'Why Choose Emirati Human Development Platform?'}
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              {translations.whyChoose?.subtitle ||
                'Built specifically for the UAE market with advanced AI technology and cultural intelligence'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group"
              >
                <div className="w-16 h-16 bg-teal-50 group-hover:bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-colors">
                  <feature.icon className="w-8 h-8 text-teal-600" />
                </div>
                <h3 className="text-lg font-dubai-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  PROFESSIONAL PATHWAYS / PERSONA CARDS                        */}
      {/* ============================================================ */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-teal-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-dubai-bold text-slate-900 mb-4">
              {translations.pathways?.title || 'Choose Your Professional Path'}
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              {translations.pathways?.subtitle ||
                'Tailored experiences for every professional role in the UAE career ecosystem'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {personas.map((persona) => (
              <div
                key={persona.id}
                className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 relative group"
              >
                {persona.popular && (
                  <div className={`absolute -top-3 ${isRTL ? 'right-6' : 'left-6'}`}>
                    <span className="bg-teal-600 text-white px-3 py-1 rounded-full text-sm font-dubai-medium">
                      {translations.pathways?.mostPopular || 'Most Popular'}
                    </span>
                  </div>
                )}

                <div className={`w-14 h-14 ${persona.iconBg} rounded-xl flex items-center justify-center mb-6`}>
                  <persona.icon className={`w-7 h-7 ${persona.iconColor}`} />
                </div>

                <h3 className="text-xl font-dubai-bold text-slate-900 mb-3">{persona.title}</h3>
                <p className="text-slate-600 mb-6 leading-relaxed text-sm">{persona.description}</p>

                <div className="space-y-2.5 mb-8">
                  {persona.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <CheckCircle className={`w-4 h-4 text-teal-500 flex-shrink-0 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                      <span className="text-slate-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Link
                  to={`/auth?role=${persona.id}`}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 px-6 rounded-xl font-dubai-medium transition-all duration-200 flex items-center justify-center text-sm"
                >
                  {persona.getStarted}
                  <ArrowRight className={`w-4 h-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  TESTIMONIALS                                                 */}
      {/* ============================================================ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-dubai-bold text-slate-900 mb-4">
              {translations.testimonials?.title || 'Success Stories'}
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              {translations.testimonials?.subtitle ||
                'Hear from professionals who transformed their careers'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial: any, index: number) => (
              <div
                key={index}
                className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:border-slate-200 transition-all duration-300 relative"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-teal-500 fill-teal-500" />
                  ))}
                </div>

                {/* Quote */}
                <Quote className={`w-8 h-8 text-teal-200 mb-3 ${isRTL ? 'transform scale-x-[-1]' : ''}`} />
                <p className="text-slate-700 leading-relaxed mb-6 text-sm">
                  "{testimonial.quote}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                    <span className="text-teal-700 font-dubai-bold text-sm">
                      {testimonial.name?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-dubai-bold text-slate-900 text-sm">{testimonial.name}</p>
                    <p className="text-xs text-slate-500">
                      {testimonial.role} · {testimonial.company}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  CTA SECTION                                                  */}
      {/* ============================================================ */}
      <section className="py-20 bg-gradient-to-br from-teal-600 to-teal-700 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/30 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl -translate-x-1/4 translate-y-1/3 pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-dubai-bold text-white mb-6">
            {translations.cta?.title || 'Ready to Transform Your Career?'}
          </h2>
          <p className="text-lg text-teal-100 mb-10 max-w-2xl mx-auto">
            {translations.cta?.subtitle ||
              'Join thousands of UAE professionals already using the platform to advance their careers'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/auth"
              className="bg-white text-teal-700 hover:bg-teal-50 px-8 py-4 rounded-full font-dubai-medium text-lg transition-all duration-200 hover:shadow-lg flex items-center"
            >
              {translations.cta?.primaryButton || 'Create Free Account'}
              <ArrowRight className={`w-5 h-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
            </Link>
            <Link
              to="/auth"
              className="text-white border border-white/30 hover:bg-white/10 px-8 py-4 rounded-full font-dubai-medium text-lg transition-all duration-200 flex items-center"
            >
              {translations.cta?.secondaryButton || 'Explore Features'}
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FOOTER                                                       */}
      {/* ============================================================ */}
      </main>
      <footer className="bg-slate-900 text-slate-400 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Platform info */}
            <div className="md:col-span-1">
              <h3 className="text-white font-dubai-bold text-lg mb-4">
                {currentLanguage === 'ar' ? 'منصة رحلة المورد البشري الإماراتي' : 'Emirati Human Development Platform'}
              </h3>
              <p className="text-sm leading-relaxed">
                {translations.footer?.description ||
                  'The comprehensive AI-powered career development platform for UAE Nationals, backed by the Dubai Government and EHRDC.'}
              </p>
              {/* Social icons */}
              <div className="flex gap-3 mt-6">
                {['LinkedIn', 'X', 'Instagram'].map((platform) => (
                  <a
                    key={platform}
                    href="#"
                    className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-teal-600 flex items-center justify-center transition-colors"
                    aria-label={platform}
                  >
                    <span className="text-xs text-slate-400 hover:text-white font-dubai-medium">
                      {platform.charAt(0)}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            {/* Column links */}
            {['platform', 'resources', 'legal'].map((col) => (
              <div key={col}>
                <h4 className="text-white font-dubai-medium text-sm mb-4 uppercase tracking-wider">
                  {translations.footer?.columns?.[col]?.title || col}
                </h4>
                <ul className="space-y-2.5">
                  {(translations.footer?.columns?.[col]?.links || []).map((link: string, i: number) => (
                    <li key={i}>
                      <a href="#" className="text-sm hover:text-teal-400 transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs">
              {translations.footer?.copyright || '© 2025 Emirati Human Development Platform. All rights reserved.'}
            </p>
            <p className="text-xs text-teal-500">
              {translations.footer?.government || 'A Dubai Government Initiative in partnership with EHRDC'}
            </p>
          </div>
        </div>
      </footer>

      {/* Interactive Dashboard Demo */}
      <InteractiveDashboardDemo
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />
    </div>
  );
};

export default BilingualHomePage;
