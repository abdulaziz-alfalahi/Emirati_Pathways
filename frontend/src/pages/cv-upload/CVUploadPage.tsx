import React, { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getAuthToken } from '@/utils/tokenUtils';
import { useTranslation } from 'react-i18next';
import { 
  Upload, 
  FileText, 
  Download, 
  Eye, 
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  FileCheck,
  Brain,
  Target,
  Users,
  Award,
  Sparkles
} from 'lucide-react';

interface CVFile {
  file: File;
  id: string;
  name: string;
  size: number;
  type: string;
  uploadProgress: number;
  status: 'uploading' | 'analyzing' | 'completed' | 'error';
  analysis?: CVAnalysis;
}

// Shape of the honest analysis derived ONLY from fields actually returned by
// POST /api/cv/upload (result.data = parsed CV, result.analysis.scores = backend
// completeness heuristic). Every field is optional: absent data stays absent.
interface CVAnalysis {
  personalInfo: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
  };
  experience: {
    totalYears?: number;
    currentRole?: string;
    companies: string[];
  };
  skills: {
    technical: string[];
    soft: string[];
    languages: string[];
  };
  score?: number;
}

// Raw shapes from the backend parser (backend/services/resume_parser.py)
interface ParsedSkill {
  name?: string;
  category?: string;
}

interface ParsedExperience {
  company?: string;
  position?: string;
  is_current?: boolean;
}

interface ParsedLanguage {
  language?: string;
  proficiency?: string;
}

const SECTION_UNAVAILABLE =
  'Analysis for this section is not available yet / تحليل هذا القسم غير متاح بعد';

const CVUploadPage: React.FC = () => {
  const { t } = useTranslation();
  const [uploadedFiles, setUploadedFiles] = useState<CVFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    handleFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  }, []);

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter(file => {
      const isValidType = file.type === 'application/pdf' || 
                         file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                         file.type === 'application/msword';
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValidType && isValidSize;
    });

    for (const file of validFiles) {
      const cvFile: CVFile = {
        file,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadProgress: 0,
        status: 'uploading'
      };

      setUploadedFiles(prev => [...prev, cvFile]);
      await uploadAndAnalyzeCV(cvFile);
    }
  };

  const uploadAndAnalyzeCV = async (cvFile: CVFile) => {
    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setUploadedFiles(prev => 
          prev.map(f => f.id === cvFile.id ? { ...f, uploadProgress: progress } : f)
        );
      }

      // Update status to analyzing
      setUploadedFiles(prev => 
        prev.map(f => f.id === cvFile.id ? { ...f, status: 'analyzing' } : f)
      );

      // Call backend API for CV analysis
      const formData = new FormData();
      formData.append('cv_file', cvFile.file);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/cv/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      // Honest mapping: use ONLY fields actually returned by the backend.
      // result.data is the parsed CV; result.analysis.scores is the backend
      // completeness heuristic. No invented fallbacks anywhere.
      const parsed = result?.data;
      const personalInfo = parsed?.personal_info;
      const parsedSkills: ParsedSkill[] = Array.isArray(parsed?.skills) ? parsed.skills : [];
      const parsedExperience: ParsedExperience[] = Array.isArray(parsed?.experience) ? parsed.experience : [];
      const parsedLanguages: ParsedLanguage[] = Array.isArray(parsed?.languages) ? parsed.languages : [];

      const hasParsedData = Boolean(
        (personalInfo && (personalInfo.full_name || personalInfo.email || personalInfo.phone || personalInfo.location)) ||
        parsedSkills.length > 0 ||
        parsedExperience.length > 0
      );

      let analysis: CVAnalysis | undefined;
      if (hasParsedData) {
        const skillNamesByCategory = (predicate: (category: string) => boolean) =>
          parsedSkills
            .filter(s => predicate((s.category || '').toLowerCase()))
            .map(s => s.name)
            .filter((name): name is string => Boolean(name));

        analysis = {
          personalInfo: {
            name: personalInfo?.full_name || undefined,
            email: personalInfo?.email || undefined,
            phone: personalInfo?.phone || undefined,
            location: personalInfo?.location || undefined
          },
          experience: {
            totalYears: typeof parsed?.total_experience_years === 'number' ? parsed.total_experience_years : undefined,
            currentRole: parsedExperience.find(e => e.is_current)?.position || undefined,
            companies: parsedExperience
              .map(e => e.company)
              .filter((company): company is string => Boolean(company))
          },
          skills: {
            technical: skillNamesByCategory(c => c !== 'soft' && c !== 'language'),
            soft: skillNamesByCategory(c => c === 'soft'),
            languages: [
              ...skillNamesByCategory(c => c === 'language'),
              ...parsedLanguages
                .filter(l => Boolean(l.language))
                .map(l => (l.proficiency ? `${l.language} (${l.proficiency})` : l.language as string))
            ]
          },
          score: typeof result?.analysis?.scores?.overall === 'number' ? result.analysis.scores.overall : undefined
        };
      }

      // Update with analysis results (analysis stays undefined when the
      // backend returned no usable parsed data — the UI shows an honest
      // upload-only success state in that case).
      setUploadedFiles(prev =>
        prev.map(f => f.id === cvFile.id ? {
          ...f,
          status: 'completed',
          analysis
        } : f)
      );

    } catch (error) {
      console.error('CV upload/analysis error:', error);
      setUploadedFiles(prev => 
        prev.map(f => f.id === cvFile.id ? { ...f, status: 'error' } : f)
      );
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 font-dubai-regular">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-dubai-bold text-gray-900 mb-2">
                📄 CV Upload & Analysis
              </h1>
              <p className="text-gray-600">
                Upload your CV for AI-powered analysis and job matching
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-dubai-medium">
                🇦🇪 UAE Nationals Only
              </div>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-dubai-medium">
                <Sparkles className="w-4 h-4 inline me-1" />
                AI-Powered
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Upload Area */}
          <div className="mb-8">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                isDragOver
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-dubai-medium text-gray-900 mb-2">
                Upload Your CV
              </h3>
              <p className="text-gray-600 mb-4">
                Drag and drop your CV here, or click to browse
              </p>
              <div className="flex justify-center space-x-4 mb-4">
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                  📄 PDF
                </span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  📝 DOCX
                </span>
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                  📋 DOC
                </span>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-dubai-medium transition-colors duration-200"
              >
                Choose Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.doc"
                onChange={handleFileSelect}
                className="hidden"
              />
              <p className="text-sm text-gray-500 mt-3">
                Maximum file size: 10MB per file
              </p>
            </div>
          </div>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-6">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="bg-white rounded-lg shadow-sm border p-6">
                  {/* File Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-8 h-8 text-blue-600" />
                      <div>
                        <h3 className="font-dubai-medium text-gray-900">{file.name}</h3>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.size)} • {file.type.includes('pdf') ? 'PDF' : 'Word Document'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {file.status === 'uploading' && (
                        <div className="flex items-center text-blue-600">
                          <Loader2 className="w-4 h-4 animate-spin me-2" />
                          Uploading {file.uploadProgress}%
                        </div>
                      )}
                      {file.status === 'analyzing' && (
                        <div className="flex items-center text-purple-600">
                          <Brain className="w-4 h-4 animate-pulse me-2" />
                          Analyzing...
                        </div>
                      )}
                      {file.status === 'completed' && (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 me-2" />
                          {file.analysis ? 'Analysis Complete' : 'Upload Complete'}
                        </div>
                      )}
                      {file.status === 'error' && (
                        <div className="flex items-center text-red-600">
                          <AlertCircle className="w-4 h-4 me-2" />
                          Upload Failed
                        </div>
                      )}
                      <button
                        onClick={() => removeFile(file.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Upload Progress */}
                  {file.status === 'uploading' && (
                    <div className="mb-4">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${file.uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Analysis Results */}
                  {file.status === 'completed' && file.analysis && (
                    <div className="space-y-6">
                      {/* CV Score */}
                      {typeof file.analysis.score === 'number' && (
                        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-lg font-dubai-medium text-gray-900 mb-1">
                                CV Parsing Score
                              </h4>
                              <p className="text-gray-600">
                                Automated score based on the completeness of the information parsed from your CV
                              </p>
                            </div>
                            <div className="text-end">
                              <div className="text-3xl font-dubai-bold text-green-600">
                                {file.analysis.score}%
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Personal Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-dubai-medium text-gray-900 mb-3 flex items-center">
                            <Users className="w-4 h-4 me-2" />
                            Personal Information
                          </h4>
                          {(file.analysis.personalInfo.name || file.analysis.personalInfo.email ||
                            file.analysis.personalInfo.phone || file.analysis.personalInfo.location) ? (
                            <div className="space-y-2 text-sm">
                              {file.analysis.personalInfo.name && (
                                <div><strong>Name:</strong> {file.analysis.personalInfo.name}</div>
                              )}
                              {file.analysis.personalInfo.email && (
                                <div><strong>Email:</strong> {file.analysis.personalInfo.email}</div>
                              )}
                              {file.analysis.personalInfo.phone && (
                                <div><strong>Phone:</strong> {file.analysis.personalInfo.phone}</div>
                              )}
                              {file.analysis.personalInfo.location && (
                                <div><strong>Location:</strong> {file.analysis.personalInfo.location}</div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">{SECTION_UNAVAILABLE}</p>
                          )}
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-dubai-medium text-gray-900 mb-3 flex items-center">
                            <Award className="w-4 h-4 me-2" />
                            Experience Summary
                          </h4>
                          {(typeof file.analysis.experience.totalYears === 'number' ||
                            file.analysis.experience.currentRole ||
                            file.analysis.experience.companies.length > 0) ? (
                            <div className="space-y-2 text-sm">
                              {typeof file.analysis.experience.totalYears === 'number' && (
                                <div><strong>Total Experience:</strong> {file.analysis.experience.totalYears} years</div>
                              )}
                              {file.analysis.experience.currentRole && (
                                <div><strong>Current Role:</strong> {file.analysis.experience.currentRole}</div>
                              )}
                              {file.analysis.experience.companies.length > 0 && (
                                <div><strong>Companies:</strong> {file.analysis.experience.companies.join(', ')}</div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">{SECTION_UNAVAILABLE}</p>
                          )}
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-dubai-medium text-gray-900 mb-3 flex items-center">
                          <Target className="w-4 h-4 me-2" />
                          Skills Analysis
                        </h4>
                        {(file.analysis.skills.technical.length > 0 ||
                          file.analysis.skills.soft.length > 0 ||
                          file.analysis.skills.languages.length > 0) ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {file.analysis.skills.technical.length > 0 && (
                              <div>
                                <h5 className="font-dubai-medium text-gray-800 mb-2">Technical Skills</h5>
                                <div className="flex flex-wrap gap-1">
                                  {file.analysis.skills.technical.map((skill, index) => (
                                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {file.analysis.skills.soft.length > 0 && (
                              <div>
                                <h5 className="font-dubai-medium text-gray-800 mb-2">Soft Skills</h5>
                                <div className="flex flex-wrap gap-1">
                                  {file.analysis.skills.soft.map((skill, index) => (
                                    <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {file.analysis.skills.languages.length > 0 && (
                              <div>
                                <h5 className="font-dubai-medium text-gray-800 mb-2">Languages</h5>
                                <div className="flex flex-wrap gap-1">
                                  {file.analysis.skills.languages.map((lang, index) => (
                                    <span key={index} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                                      {lang}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">{SECTION_UNAVAILABLE}</p>
                        )}
                      </div>

                      {/* Continue to profile */}
                      <div className="flex justify-end">
                        <Link
                          to="/candidate/profile"
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-dubai-medium transition-colors duration-200"
                        >
                          Continue to Profile / المتابعة إلى الملف الشخصي
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Uploaded, but no analysis available */}
                  {file.status === 'completed' && !file.analysis && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-600 me-3 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-800">
                            CV uploaded successfully. Automatic analysis is not available for this file /
                            {' '}تم رفع السيرة الذاتية بنجاح. التحليل التلقائي غير متاح لهذا الملف
                          </p>
                          <Link
                            to="/candidate/profile"
                            className="inline-block mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-dubai-medium transition-colors duration-200"
                          >
                            Continue to Profile / المتابعة إلى الملف الشخصي
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {uploadedFiles.length === 0 && (
            <div className="text-center py-12">
              <FileCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-dubai-medium text-gray-900 mb-2">
                No CVs uploaded yet
              </h3>
              <p className="text-gray-600">
                Upload your CV to get started with AI-powered analysis and job matching
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CVUploadPage;
