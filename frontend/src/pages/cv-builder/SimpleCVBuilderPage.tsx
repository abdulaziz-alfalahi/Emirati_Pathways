import React, { useState, useCallback, useRef } from 'react';
import { getAuthToken } from '@/utils/tokenUtils';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Upload,
  CheckCircle,
  Loader2,
  Users,
  Zap,
  TrendingUp,
  Shield,
  ArrowRight,
  Edit3,
  Brain,
  Target,
  Languages,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';

interface CVData {
  personalInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
  };
  skills?: {
    technical?: string[];
    soft?: string[];
  };
  job_matches?: Array<{
    title?: string;
    match_score?: number;
    alignment?: string;
    salary_range?: string;
  }>;
  uae_context?: {
    government_sector_fit?: number;
    private_sector_fit?: number;
  };
}

const SimpleCVBuilderPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'ar'>(i18n.language as 'en' | 'ar');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/cv/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
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

    } catch (error) {
      console.error('CV upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
              AI-Powered CV Builder
            </h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Create professional CVs tailored for the UAE job market with AI analysis
            </p>
            <div className="flex justify-center space-x-4">
              <div className="bg-white bg-opacity-20 px-4 py-2 rounded-full">
                <span className="font-medium">🇦🇪 UAE Focused</span>
              </div>
              <div className="bg-white bg-opacity-20 px-4 py-2 rounded-full">
                <span className="font-medium">🤖 AI-Powered</span>
              </div>
              <div className="bg-white bg-opacity-20 px-4 py-2 rounded-full">
                <span className="font-medium">🌟 D33 Aligned</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${isDragOver
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
                    Upload Your CV
                  </h3>
                  <p className="text-gray-600 text-lg">
                    AI-powered analysis with UAE job market insights
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
                      Choose File
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.doc"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    <p className="text-sm text-gray-500">
                      Maximum file size: 10MB • Powered by AI
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
                      Analyzing with AI...
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* CV Analysis Results */}
            {cvData && (
              <div className="bg-white rounded-xl shadow-lg border p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    CV Analysis Results
                  </h3>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <span className="text-green-600 font-medium">
                      Analysis Complete
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Personal Info */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-blue-600" />
                      Personal Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-700 w-16">Name:</span>
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
                      Skills Analysis
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <h5 className="font-medium text-gray-800 mb-2">Technical Skills</h5>
                        <div className="flex flex-wrap gap-2">
                          {cvData.skills?.technical?.map((skill, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-800 mb-2">Soft Skills</h5>
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
                {cvData.job_matches && cvData.job_matches.length > 0 && (
                  <div className="mt-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                      Top Job Matches
                    </h4>
                    <div className="grid gap-4">
                      {cvData.job_matches.slice(0, 3).map((job, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 border">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-gray-900">{job.title}</h5>
                            <div className="text-lg font-bold text-blue-600">
                              {job.match_score}%
                            </div>
                          </div>
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
                )}

                {/* UAE Context */}
                {cvData.uae_context && (
                  <div className="mt-8 bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-green-600" />
                      UAE Market Analysis
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {cvData.uae_context.government_sector_fit}%
                        </div>
                        <div className="text-sm text-gray-600">Government Fit</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {cvData.uae_context.private_sector_fit}%
                        </div>
                        <div className="text-sm text-gray-600">Private Sector Fit</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="text-center mt-8 space-y-4">
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => window.open('/cv-builder-new', '_blank')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center"
                    >
                      Build CV with This Data
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Your data has been extracted and is ready to auto-fill the CV builder form
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                AI-Powered Analysis
              </h3>
              <p className="text-gray-600">
                Advanced AI extracts and analyzes your experience, skills, and achievements
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                UAE Market Focus
              </h3>
              <p className="text-gray-600">
                Tailored for UAE job market with D33 and Talent33 alignment
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Languages className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Bilingual Support
              </h3>
              <p className="text-gray-600">
                Full Arabic and English support with cultural context
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SimpleCVBuilderPage;
