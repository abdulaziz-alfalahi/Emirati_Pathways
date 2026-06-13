import React, { useState, useEffect } from 'react';
import { X, Play, Pause, SkipForward, SkipBack, Users, BarChart3, Settings, BookOpen, UserCheck, Shield } from 'lucide-react';

interface DemoStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  dashboard: string;
}

interface InteractiveDashboardDemoProps {
  isOpen: boolean;
  onClose: () => void;
}

const demoSteps: DemoStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Emirati Pathways Demo',
    description: 'Experience how our AI-powered platform transforms career development for UAE nationals. We\'ll guide you through different user dashboards.',
    targetSelector: '.demo-container',
    position: 'top',
    dashboard: 'intro'
  },
  {
    id: 'candidate-overview',
    title: 'Candidate Dashboard Overview',
    description: 'This is Ahmed\'s dashboard - a recent engineering graduate. See how he manages his career journey with personalized recommendations.',
    targetSelector: '.dashboard-header',
    position: 'bottom',
    dashboard: 'candidate'
  },
  {
    id: 'candidate-profile',
    title: 'AI-Powered Profile',
    description: 'Our AI analyzes Ahmed\'s skills, experience, and career goals to create a comprehensive professional profile.',
    targetSelector: '.profile-section',
    position: 'right',
    dashboard: 'candidate'
  },
  {
    id: 'job-matching',
    title: 'Smart Job Matching',
    description: 'See personalized job recommendations with 95% compatibility scores based on skills, culture fit, and career trajectory.',
    targetSelector: '.job-recommendations',
    position: 'left',
    dashboard: 'candidate'
  },
  {
    id: 'hr-dashboard',
    title: 'HR Manager Dashboard',
    description: 'Now let\'s see Sara\'s perspective - an HR Manager at Emirates NBD managing talent acquisition for 50+ positions.',
    targetSelector: '.dashboard-header',
    position: 'bottom',
    dashboard: 'employer_admin'
  },
  {
    id: 'recruitment-pipeline',
    title: 'Recruitment Pipeline',
    description: 'Track candidates through the entire hiring process with automated workflows and collaborative evaluation tools.',
    targetSelector: '.pipeline-section',
    position: 'right',
    dashboard: 'employer_admin'
  },
  {
    id: 'analytics-metrics',
    title: 'Hiring Analytics',
    description: 'Comprehensive analytics ensure Emiratization compliance while providing insights to improve recruitment strategies.',
    targetSelector: '.analytics-section',
    position: 'left',
    dashboard: 'employer_admin'
  },
  {
    id: 'recruiter-tools',
    title: 'Recruiter Dashboard',
    description: 'Omar uses advanced sourcing tools to find the perfect candidates with AI-powered matching and diversity tracking.',
    targetSelector: '.dashboard-header',
    position: 'bottom',
    dashboard: 'recruiter'
  },
  {
    id: 'mentor-impact',
    title: 'Mentor Dashboard',
    description: 'Khalid tracks his mentoring impact with 89% career advancement success rate across 18 active mentees.',
    targetSelector: '.dashboard-header',
    position: 'bottom',
    dashboard: 'mentor'
  },
  {
    id: 'demo-complete',
    title: 'Demo Complete!',
    description: 'You\'ve experienced how Emirati Pathways supports D33 and Talent33 initiatives. Ready to start your journey?',
    targetSelector: '.demo-container',
    position: 'top',
    dashboard: 'complete'
  }
];

const dashboardRoutes = {
  candidate: '/candidate-dashboard',
  hr: '/hr-dashboard',
  recruiter: '/recruiter-dashboard',
  mentor: '/mentor-dashboard',
  educator: '/educator-dashboard',
  assessor: '/assessor-dashboard',
  admin: '/admin-dashboard'
};

export const InteractiveDashboardDemo: React.FC<InteractiveDashboardDemoProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentDashboard, setCurrentDashboard] = useState('intro');
  const [currentLanguage, setCurrentLanguage] = useState('en');

  // Detect language from parent component or localStorage
  useEffect(() => {
    const detectedLanguage = localStorage.getItem('language') || 'en';
    setCurrentLanguage(detectedLanguage);
  }, []);

  // Demo steps with bilingual content
  const demoSteps = [
    {
      id: 1,
      title: currentLanguage === 'ar' ? "مرحباً بكم في منصة الرحلة الإماراتية" : "Welcome to Emirati Pathways",
      description: currentLanguage === 'ar' ? 
        "اكتشف المنصة المدعومة بالذكاء الاصطناعي التي تربط المهنيين الإماراتيين وأصحاب العمل والمعلمين والموجهين والمقيمين في نظام بيئي موحد لتطوير ونمو المسيرة المهنية. منصة شاملة تدعم رؤية دبي D33 ومبادرة Talent33 لبناء اقتصاد معرفي متقدم." :
        "Discover the AI-powered platform that connects UAE professionals, employers, educators, mentors, and assessors in one unified ecosystem for career development and growth.",
      dashboard: "intro"
    },
    {
      id: 2,
      title: currentLanguage === 'ar' ? "لوحة تحكم المرشح - رحلة أحمد المنصوري" : "Candidate Dashboard - Ahmed's Journey",
      description: currentLanguage === 'ar' ? 
        "تعرف على أحمد المنصوري، خريج الهندسة الطموح. شاهد كيف تقوم منصتنا المدعومة بالذكاء الاصطناعي بإنشاء ملفات مهنية شخصية، ومطابقته مع الفرص ذات الصلة، وتتبع تطوره المهني. يستفيد أحمد من أدوات بناء السيرة الذاتية المتقدمة، وتقييمات المهارات الشاملة، والتوجيه المهني المخصص لتحقيق أهدافه المهنية." :
        "Meet Ahmed Al Mansouri, an engineering graduate. See how our AI-powered platform creates personalized career profiles, matches him with relevant opportunities, and tracks his professional development.",
      dashboard: "candidate"
    },
    {
      id: 3,
      title: currentLanguage === 'ar' ? "تميز مدير الموارد البشرية - نجاح سارة سعيد" : "HR Manager Excellence - Sara's Success",
      description: currentLanguage === 'ar' ? 
        "سارة سعيد من بنك الإمارات دبي الوطني تستخدم أدوات التوظيف المتقدمة لدينا لتبسيط عمليات التوظيف، وتحليل خطوط أنابيب المرشحين، وتحقيق معدلات نجاح رائعة في التوظيف. تدير سارة 156 عملية توظيف ناجحة هذا العام مع 24 بحث نشط ومتوسط وقت ملء الوظائف 30 يوماً فقط." :
        "Sara Saeed from Emirates NBD uses our advanced recruitment tools to streamline hiring processes, analyze candidate pipelines, and achieve remarkable placement success rates.",
      dashboard: 'employer_admin'
    },
    {
      id: 4,
      title: currentLanguage === 'ar' ? "ابتكار التوظيف - تأثير عمر الراشد" : "Recruitment Innovation - Omar's Impact",
      description: currentLanguage === 'ar' ? 
        "عمر الراشد يستفيد من أدوات البحث الذكية وتحليلات التنوع لدينا لبناء خطوط مواهب قوية وتحقيق نتائج توظيف استثنائية. حقق عمر 89 عملية توظيف ناجحة هذا العام مع إدارة مجموعة مرشحين تضم 1,250 مرشح ومعدل نجاح 92%. يستخدم تقنيات الذكاء الاصطناعي المتقدمة لمطابقة المواهب مع الفرص المناسبة." :
        "Omar Al Rashid leverages our intelligent sourcing tools and diversity analytics to build strong talent pipelines and achieve exceptional recruitment outcomes.",
      dashboard: "recruiter"
    },
    {
      id: 5,
      title: currentLanguage === 'ar' ? "تميز الإرشاد - توجيه خالد وليد" : "Mentoring Excellence - Khalid's Guidance",
      description: currentLanguage === 'ar' ? 
        "خالد وليد يستخدم أدوات الإرشاد المدعومة بالذكاء الاصطناعي لتوجيه الجيل القادم من المهنيين الإماراتيين، وتتبع تقدم المتدربين، وقياس تأثيره على تطوير المسيرة المهنية. يدير خالد حالياً 18 متدرب نشط مع معدل نجاح 89% وإجمالي 156 مهني تم توجيههم بنجاح. يوفر برامج إرشاد مخصصة تتماشى مع احتياجات السوق الإماراتي." :
        "Khalid Waleed uses AI-powered mentoring tools to guide the next generation of UAE professionals, track mentee progress, and measure his impact on career development.",
      dashboard: "mentor"
    },
    {
      id: 6,
      title: currentLanguage === 'ar' ? "تأثير المنصة والنجاح المحقق" : "Platform Impact & Success",
      description: currentLanguage === 'ar' ? 
        "انضم إلى آلاف المهنيين الإماراتيين الذين حولوا مسيراتهم المهنية من خلال منصتنا. اختبر مستقبل تطوير المسيرة المهنية المتماشي مع مبادرات D33 وTalent33. منصتنا حققت 15,000+ عملية توظيف ناجحة، معدل رضا 94%، وشراكة مع 500+ شركة إماراتية رائدة. كن جزءاً من التحول الرقمي في سوق العمل الإماراتي." :
        "Join thousands of UAE professionals who have transformed their careers through our platform. Experience the future of career development aligned with D33 and Talent33 initiatives.",
      dashboard: "complete"
    }
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setIsPlaying(false);
      setCurrentDashboard('intro');
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentStep < demoSteps.length - 1) {
      interval = setInterval(() => {
        nextStep();
      }, 4000); // 4 seconds per step
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentStep]);

  const nextStep = () => {
    if (currentStep < demoSteps.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      
      // Update dashboard state for preview (but don't navigate)
      const step = demoSteps[newStep];
      if (step.dashboard !== currentDashboard) {
        setCurrentDashboard(step.dashboard);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      
      // Update dashboard state for preview (but don't navigate)
      const step = demoSteps[newStep];
      if (step.dashboard !== currentDashboard) {
        setCurrentDashboard(step.dashboard);
      }
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const currentStepData = demoSteps[currentStep];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="demo-container bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Demo Header */}
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-2">Interactive Platform Demo</h2>
              <p className="text-teal-100">Experience the power of AI-driven career development</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-teal-200 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-teal-100 mb-2">
              <span>Step {currentStep + 1} of {demoSteps.length}</span>
              <span>{Math.round(((currentStep + 1) / demoSteps.length) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-teal-700 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-300"
                style={{ width: `${((currentStep + 1) / demoSteps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Demo Content */}
        <div className="p-6">
          {/* Current Step Info */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">{currentStepData.title}</h3>
            <p className="text-gray-600 leading-relaxed">{currentStepData.description}</p>
          </div>

          {/* Dashboard Preview */}
          {currentStepData.dashboard === 'intro' && (
            <div className="text-center py-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex flex-col items-center p-4 bg-teal-50 rounded-lg">
                  <Users className="text-teal-600 mb-2" size={32} />
                  <span className="text-sm font-medium">Candidates</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-emerald-50 rounded-lg">
                  <BarChart3 className="text-emerald-600 mb-2" size={32} />
                  <span className="text-sm font-medium">HR Managers</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg">
                  <BookOpen className="text-blue-600 mb-2" size={32} />
                  <span className="text-sm font-medium">Educators</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-purple-50 rounded-lg">
                  <UserCheck className="text-purple-600 mb-2" size={32} />
                  <span className="text-sm font-medium">Mentors</span>
                </div>
              </div>
              <p className="text-gray-600">Seven specialized dashboards for the complete UAE career ecosystem</p>
            </div>
          )}

          {/* Candidate Dashboard Preview */}
          {currentStepData.dashboard === 'candidate' && (
            <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                  <Users className="text-white" size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Ahmed Al Mansouri</h4>
                  <p className="text-gray-600 text-sm">Engineering Graduate</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">95%</div>
                  <div className="text-sm text-gray-600">Job Match Score</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">12</div>
                  <div className="text-sm text-gray-600">Active Applications</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">3</div>
                  <div className="text-sm text-gray-600">Interview Invites</div>
                </div>
              </div>
            </div>
          )}

          {/* HR Dashboard Preview */}
          {currentStepData.dashboard === 'employer_admin' && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-4">
                  <BarChart3 className="text-white" size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Sara Saeed</h4>
                  <p className="text-gray-600 text-sm">HR Manager - Emirates NBD</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">156</div>
                  <div className="text-sm text-gray-600">Hires This Year</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">24</div>
                  <div className="text-sm text-gray-600">Active Searches</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">30d</div>
                  <div className="text-sm text-gray-600">Avg. Time to Fill</div>
                </div>
              </div>
            </div>
          )}

          {/* Recruiter Dashboard Preview */}
          {currentStepData.dashboard === 'recruiter' && (
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mr-4">
                  <Users className="text-white" size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Omar Al Rashid</h4>
                  <p className="text-gray-600 text-sm">Senior Recruiter</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-600">89</div>
                  <div className="text-sm text-gray-600">Placements YTD</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">1,250</div>
                  <div className="text-sm text-gray-600">Candidate Pool</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">92%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>
            </div>
          )}

          {/* Mentor Dashboard Preview */}
          {currentStepData.dashboard === 'mentor' && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mr-4">
                  <UserCheck className="text-white" size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Khalid Waleed</h4>
                  <p className="text-gray-600 text-sm">Senior Mentor</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">18</div>
                  <div className="text-sm text-gray-600">Active Mentees</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">89%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">156</div>
                  <div className="text-sm text-gray-600">Total Mentored</div>
                </div>
              </div>
            </div>
          )}

          {currentStepData.dashboard === 'complete' && (
            <div className="text-center py-8">
              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg p-8 mb-6">
                <h4 className="text-2xl font-bold text-gray-800 mb-4">Ready to Transform Your Career?</h4>
                <p className="text-gray-600 mb-6">Join thousands of UAE nationals already succeeding on our platform</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-teal-600">15,000+</div>
                    <div className="text-sm text-gray-600">Job Placements</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-emerald-600">8,000+</div>
                    <div className="text-sm text-gray-600">Mentorship Pairs</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-600">94%</div>
                    <div className="text-sm text-gray-600">User Satisfaction</div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={onClose}
                  className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-teal-700 hover:to-emerald-700 transition-all"
                >
                  Start Your Journey
                </button>
                <button
                  onClick={() => {
                    onClose();
                    window.location.href = '/candidate-dashboard';
                  }}
                  className="bg-white border-2 border-teal-600 text-teal-600 px-8 py-3 rounded-lg font-semibold hover:bg-teal-50 transition-all"
                >
                  Explore Dashboards
                </button>
              </div>
            </div>
          )}

          {/* Demo Controls */}
          <div className="flex justify-center items-center space-x-4 mt-6">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <SkipBack size={16} />
              <span>Previous</span>
            </button>

            <button
              onClick={togglePlay}
              className="flex items-center space-x-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button
              onClick={nextStep}
              disabled={currentStep === demoSteps.length - 1}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span>Next</span>
              <SkipForward size={16} />
            </button>
          </div>

          {/* Demo Tip */}
          {currentStepData.dashboard !== 'intro' && currentStepData.dashboard !== 'complete' && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-blue-800 text-sm">
                💡 <strong>Tip:</strong> This demo shows previews of each dashboard. 
                Click "Explore Dashboards" at the end to interact with the real platform.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InteractiveDashboardDemo;
