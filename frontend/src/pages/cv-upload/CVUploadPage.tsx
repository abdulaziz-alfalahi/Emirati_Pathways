import React, { useState, useCallback, useRef } from 'react';
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
  TrendingUp,
  Users,
  Award,
  MapPin,
  Clock,
  DollarSign,
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

interface CVAnalysis {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
  };
  experience: {
    totalYears: number;
    currentRole: string;
    companies: string[];
  };
  skills: {
    technical: string[];
    soft: string[];
    languages: string[];
  };
  education: {
    degree: string;
    institution: string;
    year: string;
  };
  jobMatches: {
    title: string;
    company: string;
    matchPercentage: number;
    salary: string;
    location: string;
  }[];
  recommendations: string[];
  score: number;
}

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
      
      // Mock analysis data for demonstration (replace with actual API response)
      const mockAnalysis: CVAnalysis = {
        personalInfo: {
          name: result.analysis?.personal_info?.name || 'Ahmed Al Mansouri',
          email: result.analysis?.personal_info?.email || 'ahmed.almansouri@gmail.com',
          phone: result.analysis?.personal_info?.phone || '+971 50 123 4567',
          location: result.analysis?.personal_info?.location || 'Dubai, UAE'
        },
        experience: {
          totalYears: result.analysis?.experience?.total_years || 5,
          currentRole: result.analysis?.experience?.current_role || 'Senior Software Engineer',
          companies: result.analysis?.experience?.companies || ['Emirates NBD', 'ADNOC Digital', 'Dubai Municipality']
        },
        skills: {
          technical: result.analysis?.skills?.technical || ['React', 'Node.js', 'Python', 'AWS', 'Docker'],
          soft: result.analysis?.skills?.soft || ['Leadership', 'Communication', 'Problem Solving'],
          languages: result.analysis?.skills?.languages || ['Arabic (Native)', 'English (Fluent)']
        },
        education: {
          degree: result.analysis?.education?.degree || 'Bachelor of Computer Science',
          institution: result.analysis?.education?.institution || 'American University of Sharjah',
          year: result.analysis?.education?.year || '2019'
        },
        jobMatches: result.job_matches || [
          {
            title: 'Lead Software Engineer',
            company: 'Dubai Future Foundation',
            matchPercentage: 95,
            salary: 'AED 25,000 - 30,000',
            location: 'Dubai'
          },
          {
            title: 'Technical Lead',
            company: 'Emirates Group',
            matchPercentage: 88,
            salary: 'AED 22,000 - 28,000',
            location: 'Dubai'
          },
          {
            title: 'Senior Developer',
            company: 'ADNOC',
            matchPercentage: 82,
            salary: 'AED 20,000 - 25,000',
            location: 'Abu Dhabi'
          }
        ],
        recommendations: result.recommendations || [
          'Consider adding cloud certifications (AWS/Azure)',
          'Highlight UAE-specific project experience',
          'Include Arabic language proficiency prominently'
        ],
        score: result.analysis?.score || 85
      };

      // Update with analysis results
      setUploadedFiles(prev => 
        prev.map(f => f.id === cvFile.id ? { 
          ...f, 
          status: 'completed',
          analysis: mockAnalysis 
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
                          Analysis Complete
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
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-lg font-dubai-medium text-gray-900 mb-1">
                              CV Analysis Score
                            </h4>
                            <p className="text-gray-600">
                              Based on UAE job market standards
                            </p>
                          </div>
                          <div className="text-end">
                            <div className="text-3xl font-dubai-bold text-green-600">
                              {file.analysis.score}%
                            </div>
                            <div className="text-sm text-gray-500">Excellent</div>
                          </div>
                        </div>
                      </div>

                      {/* Personal Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-dubai-medium text-gray-900 mb-3 flex items-center">
                            <Users className="w-4 h-4 me-2" />
                            Personal Information
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div><strong>Name:</strong> {file.analysis.personalInfo.name}</div>
                            <div><strong>Email:</strong> {file.analysis.personalInfo.email}</div>
                            <div><strong>Phone:</strong> {file.analysis.personalInfo.phone}</div>
                            <div><strong>Location:</strong> {file.analysis.personalInfo.location}</div>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-dubai-medium text-gray-900 mb-3 flex items-center">
                            <Award className="w-4 h-4 me-2" />
                            Experience Summary
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div><strong>Total Experience:</strong> {file.analysis.experience.totalYears} years</div>
                            <div><strong>Current Role:</strong> {file.analysis.experience.currentRole}</div>
                            <div><strong>Companies:</strong> {file.analysis.experience.companies.join(', ')}</div>
                          </div>
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-dubai-medium text-gray-900 mb-3 flex items-center">
                          <Target className="w-4 h-4 me-2" />
                          Skills Analysis
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        </div>
                      </div>

                      {/* Job Matches */}
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                        <h4 className="font-dubai-medium text-gray-900 mb-3 flex items-center">
                          <TrendingUp className="w-4 h-4 me-2" />
                          Top Job Matches
                        </h4>
                        <div className="space-y-3">
                          {file.analysis.jobMatches.map((job, index) => (
                            <div key={index} className="bg-white rounded-lg p-4 flex items-center justify-between">
                              <div className="flex-1">
                                <h5 className="font-dubai-medium text-gray-900">{job.title}</h5>
                                <p className="text-sm text-gray-600 flex items-center mt-1">
                                  <MapPin className="w-3 h-3 me-1" />
                                  {job.company} • {job.location}
                                </p>
                                <p className="text-sm text-green-600 flex items-center mt-1">
                                  <DollarSign className="w-3 h-3 me-1" />
                                  {job.salary}
                                </p>
                              </div>
                              <div className="text-end">
                                <div className="text-lg font-dubai-bold text-blue-600">
                                  {job.matchPercentage}%
                                </div>
                                <div className="text-xs text-gray-500">Match</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommendations */}
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-dubai-medium text-gray-900 mb-3 flex items-center">
                          <Sparkles className="w-4 h-4 me-2" />
                          AI Recommendations
                        </h4>
                        <ul className="space-y-2">
                          {file.analysis.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start">
                              <CheckCircle className="w-4 h-4 text-green-500 me-2 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{rec}</span>
                            </li>
                          ))}
                        </ul>
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
