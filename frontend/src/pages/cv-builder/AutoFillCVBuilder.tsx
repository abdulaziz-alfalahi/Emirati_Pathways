import React, { useState, useCallback, useRef } from 'react';
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
  Save,
  Eye,
  MapPin,
  Phone,
  Mail,
  User,
  Briefcase,
  GraduationCap,
  Award
} from 'lucide-react';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';

interface CVData {
  personal_info?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    nationality?: string;
  };
  professional_summary?: string;
  skills?: {
    technical?: string[];
    soft?: string[];
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
    match_score?: number;
    alignment?: string;
    salary_range?: string;
  }>;
  uae_context?: {
    government_sector_fit?: number;
    private_sector_fit?: number;
  };
}

interface CVFormData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;
    nationality: string;
  };
  professionalSummary: string;
  technicalSkills: string[];
  softSkills: string[];
  experience: Array<{
    jobTitle: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    responsibilities: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    graduationYear: string;
    field: string;
  }>;
}

const AutoFillCVBuilder: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'ar'>(i18n.language as 'en' | 'ar');
  const [currentStep, setCurrentStep] = useState<'upload' | 'template' | 'form' | 'preview'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [formData, setFormData] = useState<CVFormData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      location: '',
      nationality: 'UAE'
    },
    professionalSummary: '',
    technicalSkills: [],
    softSkills: [],
    experience: [],
    education: []
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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

  const autoFillForm = (analysisData: CVData) => {
    console.log('🔄 Auto-filling form with analysis data:', analysisData);
    
    const nameParts = analysisData.personal_info?.name?.split(' ') || ['', ''];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const newFormData = {
      personalInfo: {
        firstName,
        lastName,
        email: analysisData.personal_info?.email || '',
        phone: analysisData.personal_info?.phone || '',
        location: analysisData.personal_info?.location || '',
        nationality: analysisData.personal_info?.nationality || 'UAE'
      },
      professionalSummary: analysisData.professional_summary || '',
      technicalSkills: analysisData.skills?.technical || [],
      softSkills: analysisData.skills?.soft || [],
      experience: analysisData.experience?.map(exp => ({
        jobTitle: exp.job_title || '',
        company: exp.company || '',
        location: exp.location || '',
        startDate: exp.start_date || '',
        endDate: exp.end_date || '',
        responsibilities: exp.responsibilities || ''
      })) || [],
      education: analysisData.education?.map(edu => ({
        degree: edu.degree || '',
        institution: edu.institution || '',
        graduationYear: edu.graduation_year || '',
        field: edu.field || ''
      })) || []
    };

    console.log('📝 Setting form data:', newFormData);
    setFormData(newFormData);
    console.log('✅ Form auto-filled with extracted CV data');
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003'}/api/cv/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          cvData: formData,
          template: 'professional'
        })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const result = await response.json();
      
      if (result.success && result.data.download_url) {
        // Download the PDF
        const downloadUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003'}${result.data.download_url}`;
        window.open(downloadUrl, '_blank');
        
        console.log('✅ CV exported and downloaded successfully');
      } else {
        throw new Error(result.message || 'Export failed');
      }

    } catch (error) {
      console.error('CV export error:', error);
      alert('Failed to export CV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

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
      console.log('📥 Received CV analysis result:', result);
      
      const analysisData = result.data.analysis;
      console.log('📊 Analysis data to auto-fill:', analysisData);
      
      setCvData(analysisData);
      
      // Auto-fill the form with extracted data
      setTimeout(() => {
        autoFillForm(analysisData);
        // Move to template selection step after auto-fill
        setCurrentStep('template');
      }, 500); // Small delay to ensure state updates

    } catch (error) {
      console.error('CV upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (field: string, value: string, section?: string) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section as keyof CVFormData],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const addSkill = (type: 'technical' | 'soft', skill: string) => {
    if (!skill.trim()) return;
    
    const skillField = type === 'technical' ? 'technicalSkills' : 'softSkills';
    setFormData(prev => ({
      ...prev,
      [skillField]: [...prev[skillField], skill.trim()]
    }));
  };

  const removeSkill = (type: 'technical' | 'soft', index: number) => {
    const skillField = type === 'technical' ? 'technicalSkills' : 'softSkills';
    setFormData(prev => ({
      ...prev,
      [skillField]: prev[skillField].filter((_, i) => i !== index)
    }));
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
                Maximum file size: 10MB • Powered by Gemini AI
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
    </div>
  );

  const renderTemplateStep = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Choose Your Template
        </h2>
        <p className="text-xl text-gray-600">
          Select a D33/Talent33 aligned template for your CV
        </p>
      </div>

      {/* Template Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          {
            id: 'government-executive',
            name: 'Government Executive',
            description: 'Perfect for UAE government positions and leadership roles',
            color: 'bg-blue-600',
            features: ['D33 Aligned', 'Leadership Focus', 'Government Style']
          },
          {
            id: 'tech-innovator', 
            name: 'Tech Innovator',
            description: 'Designed for technology professionals in UAE digital transformation',
            color: 'bg-purple-600',
            features: ['Talent33 Focus', 'Innovation Highlight', 'Tech Skills Matrix']
          },
          {
            id: 'business-leader',
            name: 'Business Leader', 
            description: 'For business professionals and entrepreneurs in UAE market',
            color: 'bg-green-600',
            features: ['Executive Style', 'Results Driven', 'UAE Market Focus']
          }
        ].map((template) => (
          <div key={template.id} className="bg-white rounded-xl shadow-lg border hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <FileText className="w-16 h-16 text-gray-400" />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{template.name}</h3>
              <p className="text-gray-600 mb-4">{template.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {template.features.map((feature, index) => (
                  <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                    {feature}
                  </span>
                ))}
              </div>
              <button 
                onClick={() => setCurrentStep('form')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Select Template
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-center">
        <button
          onClick={() => setCurrentStep('upload')}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Back to Upload
        </button>
      </div>
    </div>
  );

  const renderFormStep = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          CV Builder - Auto-filled with Your Data
        </h2>
        <p className="text-xl text-gray-600">
          Review and customize the auto-filled information from your CV
        </p>
      </div>

      {/* Personal Information Form */}
      <div className="bg-white rounded-xl shadow-lg border p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <User className="w-5 h-5 mr-2 text-blue-600" />
          Personal Information
          {/* Debug info */}
          <span className="ml-4 text-sm text-gray-500">
            (Auto-filled: {formData.personalInfo.firstName ? 'Yes' : 'No'})
          </span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <input
              type="text"
              value={formData.personalInfo.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value, 'personalInfo')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your first name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <input
              type="text"
              value={formData.personalInfo.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value, 'personalInfo')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your last name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.personalInfo.email}
              onChange={(e) => handleInputChange('email', e.target.value, 'personalInfo')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              value={formData.personalInfo.phone}
              onChange={(e) => handleInputChange('phone', e.target.value, 'personalInfo')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your phone number"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              value={formData.personalInfo.location}
              onChange={(e) => handleInputChange('location', e.target.value, 'personalInfo')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your location"
            />
          </div>
        </div>
      </div>

      {/* Professional Summary */}
      <div className="bg-white rounded-xl shadow-lg border p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Briefcase className="w-5 h-5 mr-2 text-green-600" />
          Professional Summary
        </h3>
        <textarea
          value={formData.professionalSummary}
          onChange={(e) => handleInputChange('professionalSummary', e.target.value)}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter your professional summary"
        />
      </div>

      {/* Skills */}
      <div className="bg-white rounded-xl shadow-lg border p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-purple-600" />
          Skills
          <span className="ml-4 text-sm text-gray-500">
            (Technical: {formData.technicalSkills.length}, Soft: {formData.softSkills.length})
          </span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Technical Skills */}
          <div>
            <h4 className="font-medium text-gray-800 mb-3">Technical Skills</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.technicalSkills.map((skill, index) => (
                <span 
                  key={index} 
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
                >
                  {skill}
                  <button
                    onClick={() => removeSkill('technical', index)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add technical skill and press Enter"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addSkill('technical', e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>

          {/* Soft Skills */}
          <div>
            <h4 className="font-medium text-gray-800 mb-3">Soft Skills</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.softSkills.map((skill, index) => (
                <span 
                  key={index} 
                  className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center"
                >
                  {skill}
                  <button
                    onClick={() => removeSkill('soft', index)}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add soft skill and press Enter"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addSkill('soft', e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Experience */}
      <div className="bg-white rounded-xl shadow-lg border p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Briefcase className="w-5 h-5 mr-2 text-green-600" />
          Work Experience
          <span className="ml-4 text-sm text-gray-500">
            ({formData.experience.length} positions)
          </span>
        </h3>
        <div className="space-y-6">
          {formData.experience.map((exp, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                  <input
                    type="text"
                    value={exp.jobTitle}
                    onChange={(e) => {
                      const newExperience = [...formData.experience];
                      newExperience[index].jobTitle = e.target.value;
                      setFormData(prev => ({ ...prev, experience: newExperience }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => {
                      const newExperience = [...formData.experience];
                      newExperience[index].company = e.target.value;
                      setFormData(prev => ({ ...prev, experience: newExperience }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="text"
                    value={exp.startDate}
                    onChange={(e) => {
                      const newExperience = [...formData.experience];
                      newExperience[index].startDate = e.target.value;
                      setFormData(prev => ({ ...prev, experience: newExperience }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="text"
                    value={exp.endDate}
                    onChange={(e) => {
                      const newExperience = [...formData.experience];
                      newExperience[index].endDate = e.target.value;
                      setFormData(prev => ({ ...prev, experience: newExperience }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Key Responsibilities</label>
                <textarea
                  value={exp.responsibilities}
                  onChange={(e) => {
                    const newExperience = [...formData.experience];
                    newExperience[index].responsibilities = e.target.value;
                    setFormData(prev => ({ ...prev, experience: newExperience }));
                  }}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Education */}
      <div className="bg-white rounded-xl shadow-lg border p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <GraduationCap className="w-5 h-5 mr-2 text-purple-600" />
          Education
          <span className="ml-4 text-sm text-gray-500">
            ({formData.education.length} degrees)
          </span>
        </h3>
        <div className="space-y-6">
          {formData.education.map((edu, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Degree</label>
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => {
                      const newEducation = [...formData.education];
                      newEducation[index].degree = e.target.value;
                      setFormData(prev => ({ ...prev, education: newEducation }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Institution</label>
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => {
                      const newEducation = [...formData.education];
                      newEducation[index].institution = e.target.value;
                      setFormData(prev => ({ ...prev, education: newEducation }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Field of Study</label>
                  <input
                    type="text"
                    value={edu.field}
                    onChange={(e) => {
                      const newEducation = [...formData.education];
                      newEducation[index].field = e.target.value;
                      setFormData(prev => ({ ...prev, education: newEducation }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Graduation Year</label>
                  <input
                    type="text"
                    value={edu.graduationYear}
                    onChange={(e) => {
                      const newEducation = [...formData.education];
                      newEducation[index].graduationYear = e.target.value;
                      setFormData(prev => ({ ...prev, education: newEducation }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep('upload')}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Back to Upload
        </button>
        <button
          onClick={() => setCurrentStep('preview')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
        >
          Preview CV
          <Eye className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          CV Preview
        </h2>
        <p className="text-xl text-gray-600">
          Preview your professional CV before downloading
        </p>
      </div>

      {/* CV Preview */}
      <div className="bg-white rounded-xl shadow-lg border p-8 max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center border-b pb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              {formData.personalInfo.firstName} {formData.personalInfo.lastName}
            </h1>
            <div className="flex justify-center space-x-4 mt-2 text-gray-600">
              <span className="flex items-center">
                <Mail className="w-4 h-4 mr-1" />
                {formData.personalInfo.email}
              </span>
              <span className="flex items-center">
                <Phone className="w-4 h-4 mr-1" />
                {formData.personalInfo.phone}
              </span>
              <span className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {formData.personalInfo.location}
              </span>
            </div>
          </div>

          {/* Professional Summary */}
          {formData.professionalSummary && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Professional Summary</h2>
              <p className="text-gray-700">{formData.professionalSummary}</p>
            </div>
          )}

          {/* Skills */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Skills</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Technical Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.technicalSkills.map((skill, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Soft Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.softSkills.map((skill, index) => (
                    <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Work Experience */}
          {formData.experience.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Work Experience</h2>
              <div className="space-y-4">
                {formData.experience.map((exp, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-semibold text-gray-900">{exp.jobTitle}</h3>
                    <p className="text-gray-700 font-medium">{exp.company}</p>
                    <p className="text-sm text-gray-600 mb-2">
                      {exp.startDate} - {exp.endDate} • {exp.location}
                    </p>
                    <p className="text-gray-700 text-sm">{exp.responsibilities}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {formData.education.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Education</h2>
              <div className="space-y-4">
                {formData.education.map((edu, index) => (
                  <div key={index} className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                    <p className="text-gray-700 font-medium">{edu.institution}</p>
                    <p className="text-sm text-gray-600">
                      {edu.field} • Graduated: {edu.graduationYear}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setCurrentStep('form')}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Edit CV
        </button>
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Download PDF
            </>
          )}
        </button>
      </div>
    </div>
  );

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
              Upload your CV, get AI analysis, and create a professional resume tailored for the UAE job market
            </p>
            <div className="flex justify-center space-x-4">
              <div className="bg-white bg-opacity-20 px-4 py-2 rounded-full">
                <span className="font-medium">🇦🇪 UAE Focused</span>
              </div>
              <div className="bg-white bg-opacity-20 px-4 py-2 rounded-full">
                <span className="font-medium">🤖 Gemini AI</span>
              </div>
              <div className="bg-white bg-opacity-20 px-4 py-2 rounded-full">
                <span className="font-medium">🌟 Auto-fill</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Indicator */}
      <section className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Step 1: Upload */}
            <div className={`flex items-center space-x-3 ${currentStep === 'upload' ? 'text-blue-600' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'upload' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
              }`}>
                {currentStep === 'upload' ? <Upload className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              </div>
              <span className="font-medium">Upload & Analyze</span>
            </div>
            
            <div className={`flex-1 h-px mx-4 ${currentStep !== 'upload' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            
            {/* Step 2: Template */}
            <div className={`flex items-center space-x-3 ${currentStep === 'template' ? 'text-blue-600' : currentStep === 'form' || currentStep === 'preview' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'template' ? 'bg-blue-600 text-white' : 
                currentStep === 'form' || currentStep === 'preview' ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}>
                {currentStep === 'form' || currentStep === 'preview' ? <CheckCircle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              </div>
              <span className="font-medium">Choose Template</span>
            </div>
            
            <div className={`flex-1 h-px mx-4 ${currentStep === 'form' || currentStep === 'preview' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            
            {/* Step 3: Form */}
            <div className={`flex items-center space-x-3 ${currentStep === 'form' ? 'text-blue-600' : currentStep === 'preview' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'form' ? 'bg-blue-600 text-white' : 
                currentStep === 'preview' ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}>
                {currentStep === 'preview' ? <CheckCircle className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              </div>
              <span className="font-medium">Build & Customize</span>
            </div>
            
            <div className={`flex-1 h-px mx-4 ${currentStep === 'preview' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            
            {/* Step 4: Preview */}
            <div className={`flex items-center space-x-3 ${currentStep === 'preview' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                <Eye className="w-4 h-4" />
              </div>
              <span className="font-medium">Preview & Export</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {currentStep === 'upload' && renderUploadStep()}
          {currentStep === 'template' && renderTemplateStep()}
          {currentStep === 'form' && renderFormStep()}
          {currentStep === 'preview' && renderPreviewStep()}
        </div>
      </section>
    </div>
  );
};

export default AutoFillCVBuilder;