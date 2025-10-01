// src/components/cv-builder/CVUploader.tsx
import React, { useState, useRef } from 'react';
import { useCV } from '@/context/CVContext';
import { 
  CV as CVType,
  Experience as CVExperience, 
  Education as CVEducation, 
  Skill as CVSkill,
  Language as CVLanguageType,
  PersonalInfo as CVPersonalInfo
} from '@/types/cv';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { 
  Upload, 
  FileUp, 
  FileText, 
  Check, 
  AlertTriangle, 
  Sparkles,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

// Production Parser API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003';

// Enhanced interfaces matching your production parser output
interface ProductionParserContactInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

interface ProductionParserWorkExperience {
  job_title?: string;
  company?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  duration_months?: number;
  responsibilities?: string;
}

interface ProductionParserEducation {
  institution?: string;
  degree?: string;
  major?: string;
  graduation_date?: string;
  degree_level?: string;
}

interface ProductionParserCertification {
  name?: string;
  issuer?: string;
  date?: string;
}

interface ProductionParserProject {
  name?: string;
  description?: string;
  technologies?: string[];
  url?: string;
}

// Production parser response structure
interface ProductionParserResponse {
  source_file?: string;
  raw_text?: string;
  contact_info?: ProductionParserContactInfo;
  summary?: string;
  total_experience_years?: number;
  work_experience?: ProductionParserWorkExperience[];
  education?: ProductionParserEducation[];
  skills?: string[];
  certifications?: ProductionParserCertification[];
  languages?: string[];
  projects?: ProductionParserProject[];
  _raw_text_preview?: string;
  _entities_count?: number;
  _groq_model_used?: string;
  _language_detected?: string;
  _character_normalization_applied?: boolean;
  _rule_based_name_used?: boolean;
  _extraction_method?: string;
  _rule_based_name?: string;
}

interface CVUploaderProps {
  className?: string;
}

// Enhanced mapping function for production parser
const mapProductionParserToCVContext = (parsedData: ProductionParserResponse): Partial<CVType> => {
  const personal: CVPersonalInfo = {
    firstName: parsedData.contact_info?.name?.split(' ')?.[0] || '',
    lastName: parsedData.contact_info?.name?.split(' ')?.slice(1).join(' ') || '',
    email: parsedData.contact_info?.email || '',
    phone: parsedData.contact_info?.phone || '',
    city: parsedData.contact_info?.location || '',
    linkedinUrl: parsedData.contact_info?.linkedin || '',
    portfolioUrl: parsedData.contact_info?.portfolio || parsedData.contact_info?.github || '',
  };

  const professionalSummary: string = parsedData.summary || '';

  const experience: CVExperience[] = (parsedData.work_experience || []).map((exp, index) => ({
    id: `exp-${index}-${Date.now()}`,
    company: exp.company || '',
    jobTitle: exp.job_title || '',
    location: exp.location || '',
    startDate: exp.start_date || '',
    endDate: exp.end_date || '',
    isCurrentJob: !exp.end_date, // naive guess
    description: exp.responsibilities || '',
  }));

  const education: CVEducation[] = (parsedData.education || []).map((edu, index) => ({
    id: `edu-${index}-${Date.now()}`,
    institution: edu.institution || '',
    degree: edu.degree || '',
    fieldOfStudy: edu.major || '',
    location: '',
    startDate: '',
    endDate: edu.graduation_date || '',
    isCurrentlyStudying: false,
    description: '',
  }));

  const skills: CVSkill[] = (parsedData.skills || []).map((skill, index) => ({
    id: `skill-${index}-${Date.now()}`,
    name: skill,
    level: 'Intermediate',
    category: 'Technical',
  }));

  const languages: CVLanguageType[] = (parsedData.languages || []).map((lang, index) => ({
    id: `lang-${index}-${Date.now()}`,
    name: lang,
    proficiency: 'Conversational',
  }));
  
  return {
    personalInfo: personal,
    professionalSummary,
    experience,
    education,
    skills,
    languages,
    metadata: { 
      lastUpdated: new Date().toISOString(),
      parsingMethod: parsedData._extraction_method || 'production_parser',
      languageDetected: parsedData._language_detected || 'unknown',
      characterNormalizationApplied: parsedData._character_normalization_applied || false,
      ruleBasedNameUsed: parsedData._rule_based_name_used || false,
      entitiesCount: parsedData._entities_count || 0
    } as any,
  };
};

// Production parser API call
const callProductionParser = async (file: File): Promise<ProductionParserResponse> => {
  const formData = new FormData();
  formData.append('cv_file', file);

  const response = await fetch(`${API_BASE_URL}/api/cv/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Parser API error (${response.status}): ${errorText}`);
  }

  return await response.json();
};

const CVUploader: React.FC<CVUploaderProps> = ({ className }) => {
  const { updateCV, currentCV, loading } = useCV();

  // Enhanced state management
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'parsing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [parsingStats, setParsingStats] = useState<{
    method?: string;
    language?: string;
    entities?: number;
    ruleBasedName?: boolean;
  }>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Allow upload even without existing CV - we'll create one from the parsed data
    if (!currentCV?.id) {
      console.log('No existing CV found, will create new one from uploaded data');
    }

    // Enhanced file validation
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Please upload a file smaller than 10MB.');
      return;
    }

    const fileType = file.type;
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];

    if (!validTypes.includes(fileType)) {
      toast.error('Invalid file type. Please upload a PDF or Word document.');
      return;
    }

    setFileName(file.name);
    setUploading(true);
    setUploadStatus('uploading');
    setProgress(0);
    setErrorMessage('');
    setParsingStats({});

    // Enhanced progress simulation
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      currentProgress += Math.random() * 10;
      if (currentProgress <= 30) {
        setProgress(currentProgress);
      } else if (uploadStatus === 'uploading') {
        setProgress(30);
        setUploadStatus('parsing');
      } else if (uploadStatus === 'parsing' && currentProgress <= 90) {
        setProgress(currentProgress);
      } else {
        clearInterval(progressInterval);
      }
    }, 200);

    try {
      const parsedData = await callProductionParser(file);
      clearInterval(progressInterval);
      
      if (parsedData) {
        setParsingStats({
          method: parsedData._extraction_method,
          language: parsedData._language_detected,
          entities: parsedData._entities_count,
          ruleBasedName: parsedData._rule_based_name_used
        });

        const updates = mapProductionParserToCVContext(parsedData);
        await updateCV(currentCV.id, updates);
        
        setProgress(100);
        setUploading(false);
        setUploadStatus('success');
        
        toast.success('CV parsed and form filled successfully.');
      } else {
        throw new Error('No data received from parser');
      }

    } catch (error) {
      clearInterval(progressInterval);
      console.error('[CVUploader] Parsing error:', error);
      
      const errorMsg = error instanceof Error ? error.message : 'Unknown parsing error';
      setErrorMessage(errorMsg);
      setUploading(false);
      setUploadStatus('error');
      setProgress(0);
      
      toast.error(`Parsing failed: ${errorMsg}`);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const resetUpload = () => {
    setFileName(null);
    setUploadStatus('idle');
    setProgress(0);
    setErrorMessage('');
    setParsingStats({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'parsing':
        return <Sparkles className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'uploading':
        return <Clock className="h-5 w-5 text-orange-500" />;
      default:
        return <FileUp className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (uploadStatus) {
      case 'success':
        return (
          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
            <Check className="h-3 w-3 mr-1" />
            Parsed Successfully
          </Badge>
        );
    }
    return null;
  };

  return (
    <div className={className}>
      <Card className="hover:shadow-md transition-shadow border-dashed border-2">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Your CV
          </CardTitle>
          <CardDescription className="text-sm text-gray-600">
            Upload your CV to automatically fill the form with AI-powered parsing. We support PDF and Word documents with advanced Arabic text processing and intelligent data extraction for the UAE job market.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx"
            className="hidden"
            disabled={uploading || loading.isLoading}
          />
          
          {!uploading && !fileName && (
            <div className="flex items-center justify-center flex-col text-center p-6 border-2 border-dashed border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
              <Upload className="h-12 w-12 mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Drag & drop your CV here</h3>
              <p className="text-sm text-gray-500 mb-4">
                or click to browse files
              </p>
              <Button 
                onClick={handleClick} 
                disabled={loading.isLoading}
                className="gap-2"
              >
                <FileUp className="h-4 w-4" />
                Select File
              </Button>
            </div>
          )}
          
          {(uploading || fileName) && (
            <div className="space-y-4">
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{fileName}</p>
                        <p className="text-xs text-gray-500">
                          {uploadStatus === 'uploading' && 'Uploading file...'}
                          {uploadStatus === 'parsing' && 'Analyzing content with AI...'}
                          {uploadStatus === 'success' && 'Processing complete'}
                          {uploadStatus === 'error' && 'Processing failed'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge()}
                      {getStatusIcon()}
                    </div>
                  </div>
                  
                  {uploading && (
                    <div className="space-y-2">
                      <Progress value={progress} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{progress}% complete</span>
                        <span>
                          {uploadStatus === 'uploading' && 'Uploading...'}
                          {uploadStatus === 'parsing' && 'AI Processing...'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Enhanced Parsing Statistics Display */}
                  {uploadStatus === 'success' && parsingStats && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">AI Analysis Complete</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {parsingStats.method && (
                          <div>
                            <span className="text-green-700 font-medium">Method:</span>
                            <span className="text-green-600 ml-1">{parsingStats.method}</span>
                          </div>
                        )}
                        {parsingStats.language && (
                          <div>
                            <span className="text-green-700 font-medium">Language:</span>
                            <span className="text-green-600 ml-1">{parsingStats.language}</span>
                          </div>
                        )}
                        {parsingStats.entities && (
                          <div>
                            <span className="text-green-700 font-medium">Data Points:</span>
                            <span className="text-green-600 ml-1">{parsingStats.entities}</span>
                          </div>
                        )}
                        {parsingStats.ruleBasedName && (
                          <div className="col-span-2">
                            <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 text-xs">
                              Advanced Name Recognition Applied
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
                        </span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {uploadStatus === 'success' && Object.keys(parsingStats).length > 0 && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Parsing Statistics</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {parsingStats.method && (
                        <div>
                          <span className="text-gray-600">Method:</span>
                          <span className="ml-1 font-medium">{parsingStats.method}</span>
                        </div>
                      )}
                      {parsingStats.language && (
                        <div>
                          <span className="text-gray-600">Language:</span>
                          <span className="ml-1 font-medium">{parsingStats.language}</span>
                        </div>
                      )}
                      {parsingStats.entities !== undefined && (
                        <div>
                          <span className="text-gray-600">Entities:</span>
                          <span className="ml-1 font-medium">{parsingStats.entities}</span>
                        </div>
                      )}
                      {parsingStats.ruleBasedName !== undefined && (
                        <div>
                          <span className="text-gray-600">Enhanced Name:</span>
                          <span className="ml-1 font-medium">{parsingStats.ruleBasedName ? 'Yes' : 'No'}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {uploadStatus === 'error' && errorMessage && (
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800">Parsing Error</span>
                    </div>
                    <p className="text-xs text-red-700">{errorMessage}</p>
                  </CardContent>
                </Card>
              )}
              
              {!uploading && (
                <div className="flex justify-between items-center pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={resetUpload}
                    disabled={loading.isLoading}
                    className="gap-2"
                  >
                    <Upload className="h-3 w-3" />
                    Upload Another
                  </Button>
                  
                  {uploadStatus === 'success' && (
                    <Badge variant="default" className="bg-green-600 text-white">
                      Form auto-filled successfully
                    </Badge>
                  )}
                  
                  {uploadStatus === 'error' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setUploadStatus('idle')}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      Fill Manually Instead
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CVUploader;
