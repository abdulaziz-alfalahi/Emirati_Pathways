import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Edit3, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Users,
  Award,
  Target,
  Brain,
  Zap,
  Globe,
  ArrowRight,
  ArrowLeft,
  Plus,
  Save,
  Share2,
  Star,
  TrendingUp,
  Building2,
  GraduationCap,
  Languages,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Briefcase,
  Shield
} from 'lucide-react';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';

interface CVData {
  personalInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    nationality?: string;
    visa_status?: string;
  };
  professional_summary?: string;
  experience_years?: number;
  skills?: {
    technical?: string[];
    soft?: string[];
    languages?: string[];
  };
  experience?: Array<{
    job_title?: string;
    company?: string;
    location?: string;
    start_date?: string;
    end_date?: string;
    responsibilities?: string;
  }>;
  education?: Array<{
    degree?: string;
    institution?: string;
    graduation_year?: string;
    field?: string;
  }>;
  job_matches?: Array<{
    title?: string;
    company_type?: string;
    match_score?: number;
    alignment?: string;
    salary_range?: string;
    location?: string;
  }>;
  recommendations?: string[];
  uae_context?: {
    local_experience?: string;
    arabic_proficiency?: string;
    cultural_alignment?: number;
    government_sector_fit?: number;
    private_sector_fit?: number;
  };
}

const EnhancedCVBuilderPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'ar'>(i18n.language as 'en' | 'ar');
  const [activeStep, setActiveStep] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isRTL = currentLanguage === 'ar';

  const steps = [
    {
      id: 'upload',
      title: currentLanguage === 'en' ? 'Upload CV' : 'رفع السيرة الذاتية',
      description: currentLanguage === 'en' ? 'Upload your existing CV for AI analysis' : 'ارفع سيرتك الذاتية الحالية للتحليل بالذكاء الاصطناعي',
      icon: Upload,
      color: 'bg-blue-500'
    },
    {
      id: 'template',
      title: currentLanguage === 'en' ? 'Choose Template' : 'اختر القالب',
      description: currentLanguage === 'en' ? 'Select a D33/Talent33 aligned template' : 'اختر قالباً متوافقاً مع رؤية D33/Talent33',
      icon: FileText,
      color: 'bg-purple-500'
    },
    {
      id: 'customize',
      title: currentLanguage === 'en' ? 'Customize' : 'تخصيص',
      description: currentLanguage === 'en' ? 'Enhance and customize your CV content' : 'حسّن وخصص محتوى سيرتك الذاتية',
      icon: Edit3,
      color: 'bg-green-500'
    },
    {
      id: 'review',
      title: currentLanguage === 'en' ? 'Review & Export' : 'مراجعة وتصدير',
      description: currentLanguage === 'en' ? 'Review and export your professional CV' : 'راجع وصدّر سيرتك الذاتية المهنية',
      icon: Download,
      color: 'bg-teal-500'
    }
  ];

  const d33Templates = [
    {
      id: 'government-executive',
      name: currentLanguage === 'en' ? 'Government Executive' : 'تنفيذي حكومي',
      description: currentLanguage === 'en' ? 'Perfect for UAE government positions and leadership roles' : 'مثالي للمناصب الحكومية الإماراتية وأدوار القيادة',
      preview: '/templates/government-executive.jpg',
      features: ['D33 Aligned', 'Arabic Support', 'Leadership Focus'],
      category: 'government',
      color: 'bg-blue-600'
    },
    {
      id: 'tech-innovator',
      name: currentLanguage === 'en' ? 'Tech Innovator' : 'مبتكر تقني',
      description: currentLanguage === 'en' ? 'Designed for technology professionals in UAE\'s digital transformation' : 'مصمم للمهنيين التقنيين في التحول الرقمي الإماراتي',
      preview: '/templates/tech-innovator.jpg',
      features: ['Talent33 Focus', 'Innovation Highlight', 'Skills Matrix'],
      category: 'technology',
      color: 'bg-purple-600'
    },
    {
      id: 'business-leader',
      name: currentLanguage === 'en' ? 'Business Leader' : 'قائد أعمال',
      description: currentLanguage === 'en' ? 'For business professionals and entrepreneurs in UAE market' : 'للمهنيين في مجال الأعمال ورجال الأعمال في السوق الإماراتي',
      preview: '/templates/business-leader.jpg',
      features: ['Executive Style', 'Results Driven', 'UAE Market Focus'],
      category: 'business',
      color: 'bg-green-600'
    },
    {
      id: 'creative-professional',
      name: currentLanguage === 'en' ? 'Creative Professional' : 'محترف إبداعي',
      description: currentLanguage === 'en' ? 'Showcase creativity while maintaining UAE professional standards' : 'أظهر إبداعك مع الحفاظ على المعايير المهنية الإماراتية',
      preview: '/templates/creative-professional.jpg',
      features: ['Visual Portfolio', 'Creative Layout', 'Cultural Balance'],
      category: 'creative',
      color: 'bg-pink-600'
    }
  ];

  const handleLanguageToggle = () => {
    const newLang = currentLanguage === 'en' ? 'ar' : 'en';
    setCurrentLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      const formData = new FormData();
      formData.append('cv_file', file);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003'}/api/cv/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setCvData(result.data.analysis);
      setActiveStep(1); // Move to template selection

    } catch (error) {
      console.error('CV upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const renderUploadStep = () => (
    <div className="space-y-8">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
          isDragOver
            ? 'border-blue-500 bg-blue-50 scale-105'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-6">
          <div className="flex justify-center">
            {isUploading ? (
              <div className="relative">
                <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
            )}
          </div>

          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {currentLanguage === 'en' ? 'Upload Your CV' : 'ارفع سيرتك الذاتية'}
            </h3>
            <p className="text-gray-600 text-lg">
              {currentLanguage === 'en' 
                ? 'AI-powered analysis with UAE job market insights'
                : 'تحليل مدعوم بالذكاء الاصطناعي مع رؤى السوق الإماراتي'
              }
            </p>
          </div>

          {!isUploading && (
            <div className="space-y-4">
              <div className="flex justify-center space-x-4">
                <span className="bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium">
                  📄 PDF
                </span>
                <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                  📝 DOCX
                </span>
                <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                  📋 DOC
                </span>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                {currentLanguage === 'en' ? 'Choose File' : 'اختر الملف'}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={handleFileSelect}
                className="hidden"
              />

              <p className="text-sm text-gray-500">
                {currentLanguage === 'en' 
                  ? 'Maximum file size: 10MB • Powered by Gemini AI'
                  : 'الحد الأقصى لحجم الملف: 10 ميجابايت • مدعوم بذكاء جيميني'
                }
              </p>
            </div>
          )}

          {isUploading && (
            <div className="space-y-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-blue-600 font-medium">
                {currentLanguage === 'en' ? 'Analyzing with AI...' : 'جاري التحليل بالذكاء الاصطناعي...'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Brain className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {currentLanguage === 'en' ? 'AI-Powered Analysis' : 'تحليل مدعوم بالذكاء الاصطناعي'}
          </h3>
          <p className="text-gray-600">
            {currentLanguage === 'en' 
              ? 'Advanced Gemini AI extracts and analyzes your experience, skills, and achievements'
              : 'ذكاء جيميني المتقدم يستخرج ويحلل خبراتك ومهاراتك وإنجازاتك'
            }
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <Target className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {currentLanguage === 'en' ? 'UAE Market Focus' : 'تركيز على السوق الإماراتي'}
          </h3>
          <p className="text-gray-600">
            {currentLanguage === 'en' 
              ? 'Tailored for UAE job market with D33 and Talent33 alignment'
              : 'مصمم خصيصاً للسوق الإماراتي مع التوافق مع رؤية D33 وTalent33'
            }
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <Languages className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {currentLanguage === 'en' ? 'Bilingual Support' : 'دعم ثنائي اللغة'}
          </h3>
          <p className="text-gray-600">
            {currentLanguage === 'en' 
              ? 'Full Arabic and English support with cultural context'
              : 'دعم كامل للعربية والإنجليزية مع السياق الثقافي'
            }
          </p>
        </div>
      </div>

      {/* CV Analysis Results */}
      {cvData && (
        <div className="bg-white rounded-xl shadow-lg border p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              {currentLanguage === 'en' ? 'CV Analysis Results' : 'نتائج تحليل السيرة الذاتية'}
            </h3>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <span className="text-green-600 font-medium">
                {currentLanguage === 'en' ? 'Analysis Complete' : 'اكتمل التحليل'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Personal Info */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-600" />
                  {currentLanguage === 'en' ? 'Personal Information' : 'المعلومات الشخصية'}
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 w-20">
                      {currentLanguage === 'en' ? 'Name:' : 'الاسم:'}
                    </span>
                    <span className="text-gray-900">{cvData.personalInfo?.name}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-gray-900">{cvData.personalInfo?.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-gray-900">{cvData.personalInfo?.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-gray-900">{cvData.personalInfo?.location}</span>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-purple-600" />
                  {currentLanguage === 'en' ? 'Skills Analysis' : 'تحليل المهارات'}
                </h4>
                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">
                      {currentLanguage === 'en' ? 'Technical Skills' : 'المهارات التقنية'}
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {cvData.skills?.technical?.map((skill, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">
                      {currentLanguage === 'en' ? 'Soft Skills' : 'المهارات الشخصية'}
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {cvData.skills?.soft?.map((skill, index) => (
                        <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Matches */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                  {currentLanguage === 'en' ? 'Top Job Matches' : 'أفضل الوظائف المطابقة'}
                </h4>
                <div className="space-y-4">
                  {cvData.job_matches?.slice(0, 3).map((job, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 border">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold text-gray-900">{job.title}</h5>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">
                            {job.match_score}%
                          </div>
                          <div className="text-xs text-gray-500">Match</div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{job.company_type} • {job.location}</p>
                      <div className="flex items-center justify-between">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                          {job.alignment}
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                          {job.salary_range}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* UAE Context */}
              {cvData.uae_context && (
                <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-green-600" />
                    {currentLanguage === 'en' ? 'UAE Market Analysis' : 'تحليل السوق الإماراتي'}
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {cvData.uae_context.government_sector_fit}%
                      </div>
                      <div className="text-sm text-gray-600">
                        {currentLanguage === 'en' ? 'Government Fit' : 'ملاءمة حكومية'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {cvData.uae_context.private_sector_fit}%
                      </div>
                      <div className="text-sm text-gray-600">
                        {currentLanguage === 'en' ? 'Private Sector Fit' : 'ملاءمة القطاع الخاص'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Next Step Button */}
          {cvData && (
            <div className="text-center">
              <button
                onClick={() => setActiveStep(1)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center mx-auto"
              >
                {currentLanguage === 'en' ? 'Choose Template' : 'اختر القالب'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          )}
        </div>
      </div>
    );

  const renderTemplateStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          {currentLanguage === 'en' ? 'Choose Your Template' : 'اختر قالبك'}
        </h2>
        <p className="text-xl text-gray-600">
          {currentLanguage === 'en' 
            ? 'D33 and Talent33 aligned templates for UAE professionals'
            : 'قوالب متوافقة مع رؤية D33 وTalent33 للمهنيين الإماراتيين'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {d33Templates.map((template) => (
          <div key={template.id} className="bg-white rounded-xl shadow-lg border hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <FileText className="w-16 h-16 text-gray-400" />
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-semibold text-gray-900">{template.name}</h3>
                <div className={`w-4 h-4 rounded-full ${template.color}`}></div>
              </div>
              <p className="text-gray-600 mb-4">{template.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {template.features.map((feature, index) => (
                  <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                    {feature}
                  </span>
                ))}
              </div>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors">
                {currentLanguage === 'en' ? 'Select Template' : 'اختر هذا القالب'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`}>
      <HybridGovernmentNavFixed 
        onLanguageToggle={handleLanguageToggle}
        currentLanguage={currentLanguage}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <FileText className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {currentLanguage === 'en' 
                ? 'AI-Powered CV Builder' 
                : 'منشئ السيرة الذاتية المدعوم بالذكاء الاصطناعي'
              }
            </h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              {currentLanguage === 'en'
                ? 'Create professional CVs tailored for the UAE job market with Gemini AI analysis and D33/Talent33 alignment'
                : 'أنشئ سيراً ذاتية مهنية مصممة للسوق الإماراتي مع تحليل ذكاء جيميني والتوافق مع رؤية D33/Talent33'
              }
            </p>
            <div className="flex justify-center space-x-4">
              <div className="bg-white bg-opacity-20 px-4 py-2 rounded-full">
                <span className="font-medium">🇦🇪 UAE Focused</span>
              </div>
              <div className="bg-white bg-opacity-20 px-4 py-2 rounded-full">
                <span className="font-medium">🤖 Gemini AI</span>
              </div>
              <div className="bg-white bg-opacity-20 px-4 py-2 rounded-full">
                <span className="font-medium">🌟 D33 Aligned</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Indicator */}
      <section className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center space-x-3 ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index <= activeStep 
                      ? `${step.color} text-white` 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {index < activeStep ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className={`${index <= activeStep ? 'text-gray-900' : 'text-gray-500'}`}>
                    <div className="font-medium">{step.title}</div>
                    <div className="text-sm">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-4 ${
                    index < activeStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {activeStep === 0 && renderUploadStep()}
          {activeStep === 1 && renderTemplateStep()}
          {activeStep === 2 && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {currentLanguage === 'en' ? 'Customize Your CV' : 'خصص سيرتك الذاتية'}
              </h2>
              <p className="text-gray-600">Coming soon...</p>
            </div>
          )}
          {activeStep === 3 && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {currentLanguage === 'en' ? 'Review & Export' : 'مراجعة وتصدير'}
              </h2>
              <p className="text-gray-600">Coming soon...</p>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">10+</div>
              <div className="text-gray-600">
                {currentLanguage === 'en' ? 'Professional Templates' : 'قوالب مهنية'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">95%</div>
              <div className="text-gray-600">
                {currentLanguage === 'en' ? 'Parsing Accuracy' : 'دقة التحليل'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">2</div>
              <div className="text-gray-600">
                {currentLanguage === 'en' ? 'Languages Supported' : 'لغات مدعومة'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-600 mb-2">100%</div>
              <div className="text-gray-600">
                {currentLanguage === 'en' ? 'UAE Compliant' : 'متوافق مع الإمارات'}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EnhancedCVBuilderPage;