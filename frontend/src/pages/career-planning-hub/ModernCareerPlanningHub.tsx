import React from 'react';
import { useTranslation } from 'react-i18next';
import { ModernCareerPageLayout } from '@/components/career/ModernCareerPageLayout';
import { Compass, Target, TrendingUp, Users, Briefcase, Award, Network, BarChart3, CheckCircle, Star, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/EnhancedLanguageContext';

const ModernCareerPlanningHubPage: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const stats = [
    { 
      value: '50+', 
      label: isRTL ? 'مسارات مهنية' : 'Career Paths', 
      icon: Compass 
    },
    { 
      value: '2,500+', 
      label: isRTL ? 'فرص وظيفية' : 'Job Opportunities', 
      icon: Briefcase 
    },
    { 
      value: '200+', 
      label: isRTL ? 'شركاء الصناعة' : 'Industry Partners', 
      icon: Users 
    },
    { 
      value: '1,000+', 
      label: isRTL ? 'قصص نجاح' : 'Success Stories', 
      icon: Award 
    }
  ];

  const careerPaths = [
    {
      title: isRTL ? 'التكنولوجيا والذكاء الاصطناعي' : 'Technology & AI',
      description: isRTL ? 'استكشف مستقبل التكنولوجيا مع الذكاء الاصطناعي وعلوم البيانات' : 'Explore the future of technology with AI and data science',
      averageSalary: isRTL ? '25,000 - 45,000 درهم' : 'AED 25,000 - 45,000',
      growthRate: '+15%',
      jobCount: '850+',
      icon: <TrendingUp className="h-8 w-8 text-blue-600" />,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: isRTL ? 'الرعاية الصحية والطب' : 'Healthcare & Medicine',
      description: isRTL ? 'ساهم في تطوير النظام الصحي الإماراتي المتقدم' : 'Contribute to UAE\'s advanced healthcare system',
      averageSalary: isRTL ? '20,000 - 40,000 درهم' : 'AED 20,000 - 40,000',
      growthRate: '+12%',
      jobCount: '650+',
      icon: <Users className="h-8 w-8 text-green-600" />,
      color: 'from-green-500 to-green-600'
    },
    {
      title: isRTL ? 'الأعمال والإدارة' : 'Business & Management',
      description: isRTL ? 'قد الشركات الإماراتية نحو النجاح والنمو المستدام' : 'Lead UAE companies towards success and sustainable growth',
      averageSalary: isRTL ? '18,000 - 35,000 درهم' : 'AED 18,000 - 35,000',
      growthRate: '+10%',
      jobCount: '750+',
      icon: <Briefcase className="h-8 w-8 text-purple-600" />,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: isRTL ? 'الهندسة والبناء' : 'Engineering & Construction',
      description: isRTL ? 'ابن مستقبل الإمارات مع مشاريع البنية التحتية الرائدة' : 'Build UAE\'s future with leading infrastructure projects',
      averageSalary: isRTL ? '22,000 - 42,000 درهم' : 'AED 22,000 - 42,000',
      growthRate: '+13%',
      jobCount: '900+',
      icon: <Target className="h-8 w-8 text-orange-600" />,
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: isRTL ? 'التعليم والتدريب' : 'Education & Training',
      description: isRTL ? 'شكل مستقبل الأجيال القادمة من خلال التعليم المتميز' : 'Shape the future of generations through excellent education',
      averageSalary: isRTL ? '15,000 - 30,000 درهم' : 'AED 15,000 - 30,000',
      growthRate: '+8%',
      jobCount: '550+',
      icon: <Award className="h-8 w-8 text-red-600" />,
      color: 'from-red-500 to-red-600'
    },
    {
      title: isRTL ? 'المالية والمصرفية' : 'Finance & Banking',
      description: isRTL ? 'كن جزءاً من القطاع المصرفي الإماراتي الرائد عالمياً' : 'Be part of UAE\'s globally leading banking sector',
      averageSalary: isRTL ? '20,000 - 38,000 درهم' : 'AED 20,000 - 38,000',
      growthRate: '+11%',
      jobCount: '700+',
      icon: <BarChart3 className="h-8 w-8 text-yellow-600" />,
      color: 'from-yellow-500 to-yellow-600'
    }
  ];

  const skillCategories = [
    {
      title: isRTL ? 'المهارات التقنية' : 'Technical Skills',
      items: isRTL ? [
        'البرمجة وتطوير البرمجيات',
        'تحليل البيانات والذكاء الاصطناعي',
        'الأمن السيبراني',
        'إدارة المشاريع التقنية',
        'التصميم الرقمي'
      ] : [
        'Programming & Software Development',
        'Data Analysis & AI',
        'Cybersecurity',
        'Technical Project Management',
        'Digital Design'
      ]
    },
    {
      title: isRTL ? 'المهارات الشخصية' : 'Soft Skills',
      items: isRTL ? [
        'القيادة والإدارة',
        'التواصل الفعال',
        'العمل الجماعي',
        'حل المشكلات',
        'التفكير النقدي'
      ] : [
        'Leadership & Management',
        'Effective Communication',
        'Teamwork',
        'Problem Solving',
        'Critical Thinking'
      ]
    },
    {
      title: isRTL ? 'المهارات اللغوية' : 'Language Skills',
      items: isRTL ? [
        'العربية (اللغة الأم)',
        'الإنجليزية المتقدمة',
        'لغات أخرى حسب التخصص',
        'التواصل متعدد الثقافات',
        'الترجمة والتفسير'
      ] : [
        'Arabic (Native)',
        'Advanced English',
        'Other Languages by Specialization',
        'Cross-cultural Communication',
        'Translation & Interpretation'
      ]
    }
  ];

  const assessmentCategories = [
    {
      title: isRTL ? 'تقييم الشخصية' : 'Personality Assessment',
      description: isRTL ? 'اكتشف نقاط قوتك الشخصية وأسلوب عملك المفضل' : 'Discover your personal strengths and preferred work style',
      progress: 85,
      icon: <Users className="h-6 w-6 text-blue-600" />
    },
    {
      title: isRTL ? 'تقييم المهارات' : 'Skills Assessment',
      description: isRTL ? 'قيم مهاراتك التقنية والمهنية الحالية' : 'Evaluate your current technical and professional skills',
      progress: 70,
      icon: <Target className="h-6 w-6 text-green-600" />
    },
    {
      title: isRTL ? 'تقييم الاهتمامات' : 'Interests Assessment',
      description: isRTL ? 'حدد المجالات التي تثير اهتمامك وشغفك' : 'Identify areas that spark your interest and passion',
      progress: 90,
      icon: <Compass className="h-6 w-6 text-purple-600" />
    },
    {
      title: isRTL ? 'تقييم القيم' : 'Values Assessment',
      description: isRTL ? 'اكتشف القيم المهنية التي تحفزك' : 'Discover the professional values that motivate you',
      progress: 75,
      icon: <Award className="h-6 w-6 text-orange-600" />
    }
  ];

  const tabs = [
    {
      id: "career-explorer",
      label: isRTL ? 'استكشاف المهن' : 'Career Explorer',
      icon: <Compass className="h-4 w-4" />,
      content: (
        <div className="space-y-8">
          <div className={`text-center ${isRTL ? 'text-right' : 'text-left'} md:text-center`}>
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Compass className="h-10 w-10 text-white" />
            </div>
            <h3 className={`text-2xl font-bold text-slate-900 mb-4 ${isRTL ? 'font-arabic' : ''}`}>
              {isRTL ? 'استكشف مسارك المهني المثالي' : 'Explore Your Ideal Career Path'}
            </h3>
            <p className={`text-lg text-slate-600 mb-8 max-w-2xl mx-auto ${isRTL ? 'font-arabic' : ''}`}>
              {isRTL ? 'اكتشف الفرص المهنية المتاحة في دولة الإمارات واختر المسار الذي يناسب مهاراتك وطموحاتك' : 'Discover career opportunities available in the UAE and choose the path that matches your skills and ambitions'}
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {careerPaths.map((path, index) => (
              <div key={index} className={`bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-slate-100 ${isRTL ? 'text-right' : 'text-left'}`}>
                <div className={`w-16 h-16 bg-gradient-to-br ${path.color} rounded-xl flex items-center justify-center mb-6 ${isRTL ? 'mr-auto' : 'ml-0'}`}>
                  {path.icon}
                </div>
                
                <h4 className={`text-xl font-bold text-slate-900 mb-3 ${isRTL ? 'font-arabic' : ''}`}>
                  {path.title}
                </h4>
                <p className={`text-slate-600 mb-6 leading-relaxed ${isRTL ? 'font-arabic' : ''}`}>
                  {path.description}
                </p>
                
                <div className="space-y-3 mb-6">
                  <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className={`text-sm font-medium text-slate-700 ${isRTL ? 'font-arabic' : ''}`}>
                      {isRTL ? 'الراتب:' : 'Salary:'}
                    </span>
                    <span className={`text-sm font-bold text-green-600 ${isRTL ? 'font-arabic' : ''}`}>
                      {path.averageSalary}
                    </span>
                  </div>
                  <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className={`text-sm font-medium text-slate-700 ${isRTL ? 'font-arabic' : ''}`}>
                      {isRTL ? 'النمو:' : 'Growth:'}
                    </span>
                    <span className="text-sm font-bold text-blue-600">{path.growthRate}</span>
                  </div>
                  <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className={`text-sm font-medium text-slate-700 ${isRTL ? 'font-arabic' : ''}`}>
                      {isRTL ? 'الوظائف المتاحة:' : 'Available Jobs:'}
                    </span>
                    <span className="text-sm font-bold text-purple-600">{path.jobCount}</span>
                  </div>
                </div>
                
                <button className={`w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center group ${isRTL ? 'flex-row-reverse font-arabic' : ''}`}>
                  {isRTL ? 'استكشف المسار' : 'Explore Path'}
                  <ArrowRight className={`w-4 h-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'} group-hover:${isRTL ? '-translate-x-1' : 'translate-x-1'} transition-transform`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: "skill-assessment",
      label: isRTL ? 'تقييم المهارات' : 'Skill Assessment',
      icon: <Target className="h-4 w-4" />,
      content: (
        <div className="space-y-8">
          <div className={`text-center ${isRTL ? 'text-right' : 'text-left'} md:text-center`}>
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Target className="h-10 w-10 text-white" />
            </div>
            <h3 className={`text-2xl font-bold text-slate-900 mb-4 ${isRTL ? 'font-arabic' : ''}`}>
              {isRTL ? 'قيم مهاراتك واكتشف إمكاناتك' : 'Assess Your Skills and Discover Your Potential'}
            </h3>
            <p className={`text-lg text-slate-600 mb-8 max-w-2xl mx-auto ${isRTL ? 'font-arabic' : ''}`}>
              {isRTL ? 'احصل على تقييم شامل لمهاراتك وشخصيتك لتحديد أفضل المسارات المهنية المناسبة لك' : 'Get a comprehensive assessment of your skills and personality to identify the best career paths for you'}
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            {assessmentCategories.map((category, index) => (
              <div key={index} className={`bg-white rounded-2xl p-6 shadow-lg border border-slate-100 ${isRTL ? 'text-right' : 'text-left'}`}>
                <div className={`flex items-center gap-4 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                    {category.icon}
                  </div>
                  <h4 className={`text-lg font-bold text-slate-900 ${isRTL ? 'font-arabic' : ''}`}>
                    {category.title}
                  </h4>
                </div>
                <p className={`text-slate-600 mb-6 ${isRTL ? 'font-arabic' : ''}`}>
                  {category.description}
                </p>
                <div className="space-y-2 mb-6">
                  <div className={`flex justify-between text-sm ${isRTL ? 'flex-row-reverse font-arabic' : ''}`}>
                    <span>{isRTL ? 'التقدم' : 'Progress'}</span>
                    <span>{category.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-teal-500 to-teal-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${category.progress}%` }}
                    ></div>
                  </div>
                </div>
                <button className={`w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-medium transition-colors ${isRTL ? 'font-arabic' : ''}`}>
                  {isRTL ? 'ابدأ التقييم' : 'Start Assessment'}
                </button>
              </div>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {skillCategories.map((category, index) => (
              <div key={index} className={`bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 ${isRTL ? 'text-right' : 'text-left'}`}>
                <h4 className={`text-lg font-bold text-slate-900 mb-4 ${isRTL ? 'font-arabic' : ''}`}>
                  {category.title}
                </h4>
                <div className="space-y-3">
                  {category.items.map((item, itemIndex) => (
                    <div key={itemIndex} className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <CheckCircle className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      <span className={`text-sm text-slate-700 ${isRTL ? 'font-arabic' : ''}`}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: "job-market",
      label: isRTL ? 'سوق العمل' : 'Job Market',
      icon: <TrendingUp className="h-4 w-4" />,
      content: (
        <div className="space-y-8">
          <div className={`text-center ${isRTL ? 'text-right' : 'text-left'} md:text-center`}>
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="h-10 w-10 text-white" />
            </div>
            <h3 className={`text-2xl font-bold text-slate-900 mb-4 ${isRTL ? 'font-arabic' : ''}`}>
              {isRTL ? 'اكتشف فرص العمل في الإمارات' : 'Discover Job Opportunities in UAE'}
            </h3>
            <p className={`text-lg text-slate-600 mb-8 max-w-2xl mx-auto ${isRTL ? 'font-arabic' : ''}`}>
              {isRTL ? 'استكشف أحدث الإحصائيات والاتجاهات في سوق العمل الإماراتي' : 'Explore the latest statistics and trends in the UAE job market'}
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white text-center">
              <div className="text-3xl font-bold mb-2">2,500+</div>
              <div className={`text-blue-100 ${isRTL ? 'font-arabic' : ''}`}>
                {isRTL ? 'وظائف رائجة' : 'Trending Jobs'}
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white text-center">
              <div className="text-3xl font-bold mb-2">1,200+</div>
              <div className={`text-green-100 ${isRTL ? 'font-arabic' : ''}`}>
                {isRTL ? 'عمل عن بُعد' : 'Remote Jobs'}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white text-center">
              <div className="text-3xl font-bold mb-2">800+</div>
              <div className={`text-purple-100 ${isRTL ? 'font-arabic' : ''}`}>
                {isRTL ? 'دوام كامل' : 'Full-time Jobs'}
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white text-center">
              <div className="text-3xl font-bold mb-2">300+</div>
              <div className={`text-orange-100 ${isRTL ? 'font-arabic' : ''}`}>
                {isRTL ? 'تدريب عملي' : 'Internships'}
              </div>
            </div>
          </div>

          <div className="text-center">
            <button className={`bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 hover:shadow-xl flex items-center mx-auto group ${isRTL ? 'flex-row-reverse font-arabic' : ''}`}>
              {isRTL ? 'استعرض الوظائف' : 'Browse Jobs'}
              <ArrowRight className={`w-5 h-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'} group-hover:${isRTL ? '-translate-x-1' : 'translate-x-1'} transition-transform`} />
            </button>
          </div>
        </div>
      )
    },
    {
      id: "networking",
      label: isRTL ? 'التواصل المهني' : 'Professional Networking',
      icon: <Network className="h-4 w-4" />,
      content: (
        <div className="space-y-8">
          <div className={`text-center ${isRTL ? 'text-right' : 'text-left'} md:text-center`}>
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Network className="h-10 w-10 text-white" />
            </div>
            <h3 className={`text-2xl font-bold text-slate-900 mb-4 ${isRTL ? 'font-arabic' : ''}`}>
              {isRTL ? 'بناء شبكة مهنية قوية' : 'Build a Strong Professional Network'}
            </h3>
            <p className={`text-lg text-slate-600 mb-8 max-w-2xl mx-auto ${isRTL ? 'font-arabic' : ''}`}>
              {isRTL ? 'تواصل مع المهنيين الإماراتيين وابن علاقات مهنية تساعدك في تطوير مسيرتك' : 'Connect with UAE professionals and build relationships that help advance your career'}
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className={`bg-white rounded-2xl p-6 shadow-lg border border-slate-100 ${isRTL ? 'text-right' : 'text-left'}`}>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h4 className={`text-xl font-bold text-slate-900 mb-3 ${isRTL ? 'font-arabic' : ''}`}>
                {isRTL ? 'الفعاليات المهنية' : 'Professional Events'}
              </h4>
              <p className={`text-slate-600 mb-6 ${isRTL ? 'font-arabic' : ''}`}>
                {isRTL ? 'احضر الفعاليات والمؤتمرات المهنية في دولة الإمارات' : 'Attend professional events and conferences in the UAE'}
              </p>
              <button className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors ${isRTL ? 'font-arabic' : ''}`}>
                {isRTL ? 'استعرض الفعاليات' : 'View Events'}
              </button>
            </div>
            
            <div className={`bg-white rounded-2xl p-6 shadow-lg border border-slate-100 ${isRTL ? 'text-right' : 'text-left'}`}>
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h4 className={`text-xl font-bold text-slate-900 mb-3 ${isRTL ? 'font-arabic' : ''}`}>
                {isRTL ? 'برامج الإرشاد' : 'Mentorship Programs'}
              </h4>
              <p className={`text-slate-600 mb-6 ${isRTL ? 'font-arabic' : ''}`}>
                {isRTL ? 'احصل على إرشاد من خبراء في مجالك المهني' : 'Get guidance from experts in your professional field'}
              </p>
              <button className={`w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors ${isRTL ? 'font-arabic' : ''}`}>
                {isRTL ? 'ابحث عن مرشد' : 'Find a Mentor'}
              </button>
            </div>
            
            <div className={`bg-white rounded-2xl p-6 shadow-lg border border-slate-100 ${isRTL ? 'text-right' : 'text-left'}`}>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Network className="h-8 w-8 text-white" />
              </div>
              <h4 className={`text-xl font-bold text-slate-900 mb-3 ${isRTL ? 'font-arabic' : ''}`}>
                {isRTL ? 'شبكة الخريجين' : 'Alumni Network'}
              </h4>
              <p className={`text-slate-600 mb-6 ${isRTL ? 'font-arabic' : ''}`}>
                {isRTL ? 'تواصل مع خريجي الجامعات الإماراتية الناجحين' : 'Connect with successful UAE university graduates'}
              </p>
              <button className={`w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors ${isRTL ? 'font-arabic' : ''}`}>
                {isRTL ? 'ابن شبكتك' : 'Build Your Network'}
              </button>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <ModernCareerPageLayout
      title={isRTL ? 'مركز التخطيط المهني' : 'Career Planning Hub'}
      description={isRTL ? 'اكتشف مسارك المهني المثالي مع أدوات التخطيط المتقدمة والإرشاد الشخصي المدعوم بالذكاء الاصطناعي' : 'Discover your ideal career path with advanced planning tools and AI-powered personal guidance'}
      heroIcon={<Compass className="h-12 w-12 text-white" />}
      primaryActionLabel={isRTL ? 'ابدأ التخطيط' : 'Start Planning'}
      primaryActionIcon={<Target className="h-4 w-4" />}
      secondaryActionLabel={isRTL ? 'مصادر التعلم' : 'Learning Resources'}
      stats={stats}
      quote={isRTL ? 'النجاح هو المكان الذي يلتقي فيه الاستعداد بالفرصة' : 'Success is where preparation meets opportunity'}
      attribution={isRTL ? 'بوبي أونسر' : 'Bobby Unser'}
      quoteIcon={<Target className="h-8 w-8 text-white" />}
      tabs={tabs}
      defaultTab="career-explorer"
      breadcrumbs={[
        { label: isRTL ? 'مسار الدخول المهني' : 'Career Entry' },
        { label: isRTL ? 'مركز التخطيط المهني' : 'Career Planning Hub' }
      ]}
    />
  );
};

export default ModernCareerPlanningHubPage;
