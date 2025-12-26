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
import { CVProvider, useCV } from '@/context/CVContext';
import CVBuilderWizard from '@/components/cv-builder/CVBuilderWizard';

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
  job_matches?: Array<{
    title?: string;
    company_type?: string;
    match_score?: number;
    alignment?: string;
    salary_range?: string;
    location?: string;
  }>;
  uae_context?: {
    local_experience?: string;
    arabic_proficiency?: string;
    cultural_alignment?: number;
    government_sector_fit?: number;
    private_sector_fit?: number;
  };
}

const CVBuilderContent: React.FC = function CVBuilderContent() {
  const { t, i18n } = useTranslation();
  const { createCV, updateCV, currentCV } = useCV();
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'ar'>(i18n.language as 'en' | 'ar');
  const [activeStep, setActiveStep] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isRTL = currentLanguage === 'ar';

  const handleLanguageToggle = function() {
    const newLang = currentLanguage === 'en' ? 'ar' : 'en';
    setCurrentLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  const handleDragOver = useCallback(function(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(function(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(function(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback(function(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const autoFillCVForm = async function(analysisData: CVData) {
    try {
      if (!currentCV) {
        await createCV('modern-template', 'en');
      }

      const cvUpdates = {
        personalInfo: {
          firstName: analysisData.personalInfo?.name?.split(' ')[0] || '',
          lastName: analysisData.personalInfo?.name?.split(' ').slice(1).join(' ') || '',
          email: analysisData.personalInfo?.email || '',
          phone: analysisData.personalInfo?.phone || '',
          city: analysisData.personalInfo?.location?.split(',')[0] || '',
          country: analysisData.personalInfo?.location?.includes('UAE') ? 'UAE' : '',
          nationality: analysisData.personalInfo?.nationality || 'UAE'
        },
        professionalSummary: analysisData.professional_summary || '',
        skills: [
          ...(analysisData.skills?.technical?.map(function(skill, index) {
            return {
              id: 'tech-' + index,
              name: skill,
              level: 'Advanced',
              category: 'Technical'
            };
          }) || []),
          ...(analysisData.skills?.soft?.map(function(skill, index) {
            return {
              id: 'soft-' + index,
              name: skill,
              level: 'Advanced', 
              category: 'Soft'
            };
          }) || [])
        ]
      };

      if (currentCV?.id) {
        await updateCV(currentCV.id, cvUpdates);
        console.log('CV form auto-filled with extracted data');
      }

    } catch (error) {
      console.error('Auto-fill error:', error);
    }
  };

  const handleFileUpload = async function(file: File) {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(function() {
        setUploadProgress(function(prev) {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      const formData = new FormData();
      formData.append('cv_file', file);

      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003';
      const response = await fetch(apiUrl + '/api/cv/upload', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('access_token')
        },
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      const analysisData = result.data.analysis;
      setCvData(analysisData);
      
      await autoFillCVForm(analysisData);
      
      setActiveStep(1);

    } catch (error) {
      console.error('CV upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const getText = function(en: string, ar: string) {
    return currentLanguage === 'en' ? en : ar;
  };

  const renderHeroSection = function() {
    return (
      <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <FileText className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {getText('AI-Powered CV Builder', 'منشئ السيرة الذاتية المدعوم بالذكاء الاصطناعي')}
            </h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              {getText(
                'Create professional CVs tailored for the UAE job market with Gemini AI analysis and D33/Talent33 alignment',
                'أنشئ سيراً ذاتية مهنية مصممة للسوق الإماراتي مع تحليل ذكاء جيميني والتوافق مع رؤية D33/Talent33'
              )}
            </p>
            <div className="flex justify-center space-x-4">
              <div className="bg-white bg-opacity-20 px-4 py-2 rounded-full">
                <span className="font-medium">UAE Focused</span>
              </div>
              <div className="bg-white bg-opacity-20 px-4 py-2 rounded-full">
                <span className="font-medium">Gemini AI</span>
              </div>
              <div className="bg-white bg-opacity-20 px-4 py-2 rounded-full">
                <span className="font-medium">D33 Aligned</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderUploadArea = function() {
    const uploadClassName = 'border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ' + 
      (isDragOver ? 'border-blue-500 bg-blue-50 scale-105' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50');

    return (
      <div
        className={uploadClassName}
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
              {getText('Upload Your CV', 'ارفع سيرتك الذاتية')}
            </h3>
            <p className="text-gray-600 text-lg">
              {getText('AI-powered analysis with UAE job market insights', 'تحليل مدعوم بالذكاء الاصطناعي مع رؤى السوق الإماراتي')}
            </p>
          </div>

          {!isUploading && (
            <div className="space-y-4">
              <div className="flex justify-center space-x-4">
                <span className="bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium">PDF</span>
                <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">DOCX</span>
                <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">DOC</span>
              </div>

              <button
                onClick={function() { fileInputRef.current?.click(); }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                {getText('Choose File', 'اختر الملف')}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={handleFileSelect}
                className="hidden"
              />

              <p className="text-sm text-gray-500">
                {getText('Maximum file size: 10MB - Powered by Gemini AI', 'الحد الأقصى لحجم الملف: 10 ميجابايت - مدعوم بذكاء جيميني')}
              </p>
            </div>
          )}

          {isUploading && (
            <div className="space-y-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: uploadProgress + '%' }}
                />
              </div>
              <p className="text-blue-600 font-medium">
                {getText('Analyzing with AI...', 'جاري التحليل بالذكاء الاصطناعي...')}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCVAnalysisResults = function() {
    if (!cvData) return null;

    return (
      <div className="bg-white rounded-xl shadow-lg border p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            {getText('CV Analysis Results', 'نتائج تحليل السيرة الذاتية')}
          </h3>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <span className="text-green-600 font-medium">
              {getText('Analysis Complete', 'اكتمل التحليل')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              {getText('Personal Information', 'المعلومات الشخصية')}
            </h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="font-medium text-gray-700 w-20">{getText('Name:', 'الاسم:')}</span>
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

          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-purple-600" />
              {getText('Skills Analysis', 'تحليل المهارات')}
            </h4>
            <div className="space-y-4">
              <div>
                <h5 className="font-medium text-gray-800 mb-2">{getText('Technical Skills', 'المهارات التقنية')}</h5>
                <div className="flex flex-wrap gap-2">
                  {cvData.skills?.technical?.map(function(skill, index) {
                    return (
                      <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {skill}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 mb-2">{getText('Soft Skills', 'المهارات الشخصية')}</h5>
                <div className="flex flex-wrap gap-2">
                  {cvData.skills?.soft?.map(function(skill, index) {
                    return (
                      <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        {skill}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {cvData.job_matches && cvData.job_matches.length > 0 && (
          <div className="mt-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              {getText('Top Job Matches', 'أفضل الوظائف المطابقة')}
            </h4>
            <div className="grid gap-4">
              {cvData.job_matches.slice(0, 3).map(function(job, index) {
                return (
                  <div key={index} className="bg-white rounded-lg p-4 border">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-gray-900">{job.title}</h5>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">{job.match_score}%</div>
                        <div className="text-xs text-gray-500">Match</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{job.company_type} - {job.location}</p>
                    <div className="flex items-center justify-between">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">{job.alignment}</span>
                      <span className="text-sm font-medium text-gray-700">{job.salary_range}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {cvData.uae_context && (
          <div className="mt-8 bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-green-600" />
              {getText('UAE Market Analysis', 'تحليل السوق الإماراتي')}
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{cvData.uae_context.government_sector_fit}%</div>
                <div className="text-sm text-gray-600">{getText('Government Fit', 'ملاءمة حكومية')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{cvData.uae_context.private_sector_fit}%</div>
                <div className="text-sm text-gray-600">{getText('Private Sector Fit', 'ملاءمة القطاع الخاص')}</div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mt-8 space-y-4">
          <div className="flex justify-center space-x-4">
            <button
              onClick={function() { setActiveStep(1); }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center"
            >
              {getText('Build CV with This Data', 'أنشئ السيرة الذاتية بهذه البيانات')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
            <button
              onClick={function() { window.open('/cv-builder-wizard', '_blank'); }}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center"
            >
              {getText('Open CV Builder', 'افتح منشئ السيرة الذاتية')}
              <Edit3 className="w-5 h-5 ml-2" />
            </button>
          </div>
          <p className="text-sm text-gray-500">
            {getText(
              'Your data has been extracted and is ready to auto-fill the CV builder form',
              'تم استخراج بياناتك وهي جاهزة لملء نموذج منشئ السيرة الذاتية تلقائياً'
            )}
          </p>
        </div>
      </div>
    );
  };

  const renderFeaturesSection = function() {
    return (
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {getText('AI-Powered Analysis', 'تحليل مدعوم بالذكاء الاصطناعي')}
              </h3>
              <p className="text-gray-600">
                {getText(
                  'Advanced Gemini AI extracts and analyzes your experience, skills, and achievements',
                  'ذكاء جيميني المتقدم يستخرج ويحلل خبراتك ومهاراتك وإنجازاتك'
                )}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {getText('UAE Market Focus', 'تركيز على السوق الإماراتي')}
              </h3>
              <p className="text-gray-600">
                {getText(
                  'Tailored for UAE job market with D33 and Talent33 alignment',
                  'مصمم خصيصاً للسوق الإماراتي مع التوافق مع رؤية D33 وTalent33'
                )}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Languages className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {getText('Bilingual Support', 'دعم ثنائي اللغة')}
              </h3>
              <p className="text-gray-600">
                {getText(
                  'Full Arabic and English support with cultural context',
                  'دعم كامل للعربية والإنجليزية مع السياق الثقافي'
                )}
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderStatsSection = function() {
    return (
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">10+</div>
              <div className="text-gray-600">{getText('Professional Templates', 'قوالب مهنية')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">95%</div>
              <div className="text-gray-600">{getText('Parsing Accuracy', 'دقة التحليل')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">2</div>
              <div className="text-gray-600">{getText('Languages Supported', 'لغات مدعومة')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-600 mb-2">100%</div>
              <div className="text-gray-600">{getText('UAE Compliant', 'متوافق مع الإمارات')}</div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderStep1Content = function() {
    if (activeStep !== 1 || !cvData) return null;

    return (
      <div className="space-y-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {getText('CV Builder - Auto-filled', 'منشئ السيرة الذاتية - مملوء تلقائياً')}
          </h2>
          <p className="text-xl text-gray-600">
            {getText(
              'Your CV data has been automatically extracted and filled. Review and customize as needed.',
              'تم استخراج بيانات سيرتك الذاتية وملؤها تلقائياً. راجع وخصص حسب الحاجة.'
            )}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border p-8">
          <CVBuilderWizard />
        </div>

        <div className="flex justify-between">
          <button
            onClick={function() { setActiveStep(0); }}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {getText('Back to Upload', 'العودة للرفع')}
          </button>
          <button
            onClick={function() { setActiveStep(2); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
          >
            {getText('Preview & Export', 'معاينة وتصدير')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    );
  };

  const renderStep0Content = function() {
    if (activeStep !== 0) return null;

    return (
      <div className="space-y-8">
        {renderUploadArea()}
        {renderCVAnalysisResults()}
      </div>
    );
  };

  const containerClassName = 'min-h-screen bg-gray-50 ' + (isRTL ? 'rtl' : 'ltr');

  return (
    <div className={containerClassName}>
      <HybridGovernmentNavFixed 
        onLanguageToggle={handleLanguageToggle}
        currentLanguage={currentLanguage}
      />

      {renderHeroSection()}

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {renderStep1Content()}
          {renderStep0Content()}
        </div>
      </section>

      {renderFeaturesSection()}
      {renderStatsSection()}
    </div>
  );
};

const EnhancedCVBuilderPage: React.FC = function EnhancedCVBuilderPage() {
  return (
    <CVProvider>
      <CVBuilderContent />
    </CVProvider>
  );
};

export default EnhancedCVBuilderPage;
