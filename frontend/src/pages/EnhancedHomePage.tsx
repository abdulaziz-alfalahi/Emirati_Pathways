import React from 'react';
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
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';
import EnhancedHybridGovernmentNav from '@/components/layout/EnhancedHybridGovernmentNav';

const EnhancedHomePage: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const personas = [
    {
      id: 'candidate',
      title: t('persona_job_seeker'),
      description: t('persona_job_seeker_desc'),
      icon: Users,
      color: 'bg-blue-500',
      features: [
        t('feature_ai_job_matching'),
        t('feature_cv_builder'),
        t('feature_career_planning'),
        t('feature_skill_assessment')
      ],
      popular: true
    },
    {
      id: 'recruiter',
      title: t('persona_hr_recruiter'),
      description: t('persona_hr_recruiter_desc'),
      icon: Building2,
      color: 'bg-green-500',
      features: [
        t('feature_talent_pipeline'),
        t('feature_video_interviews'),
        t('feature_analytics_dashboard'),
        t('feature_compliance_tools')
      ]
    },
    {
      id: 'training_provider',
      title: t('persona_educator'),
      description: t('persona_educator_desc'),
      icon: GraduationCap,
      color: 'bg-purple-500',
      features: [
        t('feature_curriculum_tools'),
        t('feature_student_tracking'),
        t('feature_industry_partnerships'),
        t('feature_career_guidance')
      ]
    },
    {
      id: 'mentor',
      title: t('persona_mentor'),
      description: t('persona_mentor_desc'),
      icon: UserCheck,
      color: 'bg-orange-500',
      features: [
        t('feature_smart_matching'),
        t('feature_progress_tracking'),
        t('feature_resource_library'),
        t('feature_impact_analytics')
      ]
    },
    {
      id: 'assessor',
      title: t('persona_assessor'),
      description: t('persona_assessor_desc'),
      icon: Award,
      color: 'bg-red-500',
      features: [
        t('feature_competency_validation'),
        t('feature_certification_tracking'),
        t('feature_quality_assurance'),
        t('feature_analytics')
      ]
    }
  ];

  const platformFeatures = [
    {
      icon: Sparkles,
      title: t('feature_ai_intelligence'),
      description: t('feature_ai_intelligence_desc')
    },
    {
      icon: Shield,
      title: t('feature_uae_security'),
      description: t('feature_uae_security_desc')
    },
    {
      icon: Globe,
      title: t('feature_cultural_intelligence'),
      description: t('feature_cultural_intelligence_desc')
    },
    {
      icon: TrendingUp,
      title: t('feature_career_excellence'),
      description: t('feature_career_excellence_desc')
    }
  ];

  const testimonials = [
    {
      name: 'أحمد المنصوري',
      nameEn: 'Ahmed Al Mansouri',
      role: 'مهندس برمجيات',
      roleEn: 'Software Engineer',
      company: 'بلدية دبي',
      companyEn: 'Dubai Municipality',
      content: 'ساعدتني مطابقة الوظائف المدعومة بالذكاء الاصطناعي في العثور على الدور المثالي الذي يتماشى مع أهدافي المهنية ورؤية دولة الإمارات.',
      contentEn: 'The AI-powered job matching helped me find the perfect role that aligns with my career goals and UAE vision.',
      rating: 5
    },
    {
      name: 'فاطمة الزهراء',
      nameEn: 'Fatima Al Zahra',
      role: 'مديرة الموارد البشرية',
      roleEn: 'HR Director',
      company: 'أدنوك',
      companyEn: 'ADNOC',
      content: 'أصبحت عملية التوظيف لدينا أكثر كفاءة بنسبة 60% مع التحليلات المتقدمة ومطابقة المرشحين.',
      contentEn: 'Our recruitment process became 60% more efficient with the advanced analytics and candidate matching.',
      rating: 5
    },
    {
      name: 'د. محمد الراشد',
      nameEn: 'Dr. Mohammed Al Rashid',
      role: 'أخصائي تعليم',
      roleEn: 'Education Specialist',
      company: 'وزارة التربية والتعليم',
      companyEn: 'Ministry of Education',
      content: 'تربط المنصة بشكل مثالي بين احتياجات التعليم والصناعة.',
      contentEn: 'The platform bridges the gap between education and industry needs perfectly.',
      rating: 5
    }
  ];

  const stats = [
    { number: '10,000+', label: t('stats_professionals') },
    { number: '500+', label: t('stats_companies') },
    { number: '95%', label: t('stats_success_rate') },
    { number: '50+', label: t('stats_government_entities') }
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Navigation */}
      <EnhancedHybridGovernmentNav showAuthButtons={true} />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center text-start md:text-center`}>
            <div className={`inline-flex items-center px-4 py-2 bg-teal-100 text-teal-800 rounded-full text-sm font-medium mb-8 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
              <Sparkles className={`w-4 h-4 me-2`} />
              {t('hero_ai_badge')}
            </div>
            
            <h1 className={`text-4xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight ${isRTL ? 'font-arabic' : ''}`}>
              {t('hero_title')}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">
                {isRTL ? ' للتميز المهني' : ' Career Excellence'}
              </span>
            </h1>
            
            <p className={`text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed ${isRTL ? 'font-arabic' : ''}`}>
              {t('hero_description')}
            </p>
            
            <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
              <Link 
                to="/auth" 
                className={`bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 hover:shadow-xl hover:scale-105 flex items-center group ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {t('hero_start_journey')}
                <ArrowRight className={`w-5 h-5 ms-2 rtl:rotate-180 group-hover:${isRTL ? '-translate-x-1' : 'translate-x-1'} transition-transform`} />
              </Link>
              
              <button className={`flex items-center text-slate-600 hover:text-slate-900 font-medium transition-colors ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                <Play className={`w-5 h-5 me-2`} />
                {t('hero_watch_demo')}
              </button>
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-teal-400/20 to-emerald-400/20 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 text-start md:text-center`}>
            <h2 className={`text-3xl lg:text-4xl font-bold text-slate-900 mb-4 ${isRTL ? 'font-arabic' : ''}`}>
              {t('features_title')}
            </h2>
            <p className={`text-xl text-slate-600 max-w-2xl mx-auto ${isRTL ? 'font-arabic' : ''}`}>
              {t('features_subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {platformFeatures.map((feature, index) => (
              <div key={index} className={`text-center group text-start md:text-center`}>
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className={`text-xl font-semibold text-slate-900 mb-3 ${isRTL ? 'font-arabic' : ''}`}>
                  {feature.title}
                </h3>
                <p className={`text-slate-600 leading-relaxed ${isRTL ? 'font-arabic' : ''}`}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Personas Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 text-start md:text-center`}>
            <h2 className={`text-3xl lg:text-4xl font-bold text-slate-900 mb-4 ${isRTL ? 'font-arabic' : ''}`}>
              {t('personas_title')}
            </h2>
            <p className={`text-xl text-slate-600 max-w-2xl mx-auto ${isRTL ? 'font-arabic' : ''}`}>
              {t('personas_subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {personas.map((persona) => (
              <div key={persona.id} className={`bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 relative group text-start`}>
                {persona.popular && (
                  <div className={`absolute -top-3 start-6 bg-gradient-to-r from-orange-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium`}>
                    {t('persona_most_popular')}
                  </div>
                )}
                
                <div className={`w-14 h-14 ${persona.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200 ${isRTL ? 'ms-auto' : 'ms-0'}`}>
                  <persona.icon className="w-7 h-7 text-white" />
                </div>
                
                <h3 className={`text-2xl font-bold text-slate-900 mb-3 ${isRTL ? 'font-arabic' : ''}`}>
                  {persona.title}
                </h3>
                <p className={`text-slate-600 mb-6 leading-relaxed ${isRTL ? 'font-arabic' : ''}`}>
                  {persona.description}
                </p>
                
                <div className="space-y-2 mb-8">
                  {persona.features.map((feature, index) => (
                    <div key={index} className={`flex items-center text-sm text-slate-600 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                      <CheckCircle className={`w-4 h-4 text-green-500 me-2 flex-shrink-0`} />
                      <span className={isRTL ? 'font-arabic' : ''}>{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Link 
                  to="/auth" 
                  className={`w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center group ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <span className={isRTL ? 'font-arabic' : ''}>
                    {t('persona_get_started')} {persona.title}
                  </span>
                  <ArrowRight className={`w-4 h-4 ms-2 rtl:rotate-180 group-hover:${isRTL ? '-translate-x-1' : 'translate-x-1'} transition-transform`} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 text-start md:text-center`}>
            <h2 className={`text-3xl lg:text-4xl font-bold text-white mb-4 ${isRTL ? 'font-arabic' : ''}`}>
              {t('stats_title')}
            </h2>
            <p className={`text-xl text-slate-300 max-w-2xl mx-auto ${isRTL ? 'font-arabic' : ''}`}>
              {t('stats_subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className={`text-center text-start md:text-center`}>
                <div className={`text-4xl lg:text-5xl font-bold text-white mb-2 ${isRTL ? 'font-arabic' : ''}`}>
                  {stat.number}
                </div>
                <div className={`text-slate-300 text-lg ${isRTL ? 'font-arabic' : ''}`}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 text-start md:text-center`}>
            <h2 className={`text-3xl lg:text-4xl font-bold text-slate-900 mb-4 ${isRTL ? 'font-arabic' : ''}`}>
              {t('testimonials_title')}
            </h2>
            <p className={`text-xl text-slate-600 max-w-2xl mx-auto ${isRTL ? 'font-arabic' : ''}`}>
              {t('testimonials_subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className={`bg-slate-50 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300 text-start`}>
                <div className={`flex items-center mb-4 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <p className={`text-slate-700 mb-6 leading-relaxed italic ${isRTL ? 'font-arabic' : ''}`}>
                  "{isRTL ? testimonial.content : testimonial.contentEn}"
                </p>
                
                <div className="text-start">
                  <div className={`font-semibold text-slate-900 ${isRTL ? 'font-arabic' : ''}`}>
                    {isRTL ? testimonial.name : testimonial.nameEn}
                  </div>
                  <div className={`text-slate-600 ${isRTL ? 'font-arabic' : ''}`}>
                    {isRTL ? testimonial.role : testimonial.roleEn}
                  </div>
                  <div className={`text-slate-500 text-sm ${isRTL ? 'font-arabic' : ''}`}>
                    {isRTL ? testimonial.company : testimonial.companyEn}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-emerald-600">
        <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-start md:text-center`}>
          <h2 className={`text-3xl lg:text-4xl font-bold text-white mb-6 ${isRTL ? 'font-arabic' : ''}`}>
            {t('cta_title')}
          </h2>
          <p className={`text-xl text-teal-100 mb-10 leading-relaxed ${isRTL ? 'font-arabic' : ''}`}>
            {t('cta_subtitle')}
          </p>
          
          <div className={`flex flex-col sm:flex-row gap-4 justify-center ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
            <Link 
              to="/auth" 
              className={`bg-white hover:bg-slate-50 text-teal-600 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 hover:shadow-xl flex items-center justify-center group ${isRTL ? 'flex-row-reverse font-arabic' : ''}`}
            >
              {t('cta_start_today')}
              <ArrowRight className={`w-5 h-5 ms-2 rtl:rotate-180 group-hover:${isRTL ? '-translate-x-1' : 'translate-x-1'} transition-transform`} />
            </Link>
          </div>
          
          <div className={`mt-8 text-teal-100 text-sm ${isRTL ? 'font-arabic' : ''}`}>
            <Shield className={`w-4 h-4 inline me-2`} />
            {t('cta_security_note')}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`grid md:grid-cols-4 gap-8 text-start`}>
            <div className="col-span-2">
              <div className={`flex items-center space-x-4 ${isRTL ? 'space-x-reverse flex-row-reverse' : ''} mb-4`}>
                <img 
                  src="/dubai-gov-logo.jpg" 
                  alt={t('government_of_dubai')} 
                  className="h-12 w-auto opacity-90"
                />
                <div className="w-px h-10 bg-slate-600"></div>
                <img 
                  src="/ehrdc-logo.png" 
                  alt={t('ehrdc_logo')} 
                  className="h-10 w-auto opacity-90"
                />
              </div>
              <div className="ms-0">
                <h3 className={`text-xl font-bold ${isRTL ? 'font-arabic' : ''}`}>
                  {t('platform_title')}
                </h3>
                <p className={`text-slate-400 text-sm ${isRTL ? 'font-arabic' : ''}`}>
                  {t('platform_subtitle')}
                </p>
              </div>
              <p className={`text-slate-400 leading-relaxed max-w-md ${isRTL ? 'font-arabic' : ''}`}>
                {t('footer_platform_desc')}
              </p>
            </div>
            
            <div>
              <h4 className={`font-semibold mb-4 ${isRTL ? 'font-arabic' : ''}`}>
                {t('footer_platform')}
              </h4>
              <ul className={`space-y-2 text-slate-400 ${isRTL ? 'font-arabic' : ''}`}>
                <li><Link to="/auth" className="hover:text-white transition-colors">{t('footer_job_seekers')}</Link></li>
                <li><Link to="/auth" className="hover:text-white transition-colors">{t('footer_hr_recruiters')}</Link></li>
                <li><Link to="/auth" className="hover:text-white transition-colors">{t('footer_educators')}</Link></li>
                <li><Link to="/auth" className="hover:text-white transition-colors">{t('footer_mentors')}</Link></li>
                <li><Link to="/auth" className="hover:text-white transition-colors">{t('footer_assessors')}</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className={`font-semibold mb-4 ${isRTL ? 'font-arabic' : ''}`}>
                {t('footer_support')}
              </h4>
              <ul className={`space-y-2 text-slate-400 ${isRTL ? 'font-arabic' : ''}`}>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer_help_center')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer_contact_us')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer_privacy_policy')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer_terms_of_service')}</a></li>
              </ul>
            </div>
          </div>
          
          <div className={`mt-8 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-start ${isRTL ? 'md:flex-row-reverse' : ''} md:text-center`}>
            <p className={`text-slate-400 text-sm ${isRTL ? 'font-arabic' : ''}`}>
              {t('footer_copyright')}
            </p>
            <p className={`text-slate-400 text-sm mt-2 md:mt-0 ${isRTL ? 'font-arabic' : ''}`}>
              {t('footer_location')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EnhancedHomePage;
