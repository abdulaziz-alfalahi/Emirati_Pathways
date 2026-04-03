import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  Brain,
  Target,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Award,
  GraduationCap,
  Languages,
  X
} from 'lucide-react';

import { cvService, ParsedCVData } from '@/services/cvService';

interface CVUploadProps {
  onUploadComplete?: (data: any) => void;
  onParsingComplete?: (data: any) => void;
  className?: string;
}

interface DisplayCVData {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  skills?: string[];
  experience?: Array<{
    title: string;
    company: string;
    duration: string;
    description?: string;
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  languages?: string[];
  certifications?: string[];
  scores?: {
    overall?: number;
    completeness?: number;
    detail_depth?: number;
    uae_relevance?: number;
  };
}

/**
 * Normalize the backend response schema into a flat display-friendly shape
 */
function normalizeBackendData(raw: any): DisplayCVData {
  const data = raw?.data || raw?.parsed_data || raw || {};
  const pi = data.personal_info || {};

  // Skills may be an array of objects or strings
  const rawSkills = data.skills || [];
  const skills = rawSkills.map((s: any) => (typeof s === 'string' ? s : s?.name || ''));

  // Experience
  const rawExp = data.experience || data.work_experience || [];
  const experience = rawExp.map((e: any) => ({
    title: e.position || e.title || '',
    company: e.company || e.organization || '',
    duration: e.duration || `${e.start_date || ''} - ${e.end_date || 'Present'}`,
    description: e.description || '',
  }));

  // Education
  const rawEdu = data.education || [];
  const education = rawEdu.map((e: any) => ({
    degree: e.degree || '',
    institution: e.institution || e.university || '',
    year: e.graduation_date || e.year || '',
  }));

  // Languages
  const rawLangs = data.languages || [];
  const languages = rawLangs.map((l: any) =>
    typeof l === 'string' ? l : `${l.language || ''}${l.proficiency ? ` (${l.proficiency})` : ''}`
  );

  // Certifications
  const rawCerts = data.certifications || [];
  const certifications = rawCerts.map((c: any) =>
    typeof c === 'string' ? c : c.name || ''
  );

  // Scores (from analysis)
  const analysis = raw?.analysis || {};
  const scores = analysis.scores || {};

  return {
    name: pi.full_name || pi.name || data.name || '',
    email: pi.email || data.email || '',
    phone: pi.phone || data.phone || '',
    location: pi.address || pi.location || data.location || '',
    summary: data.professional_summary || data.summary || '',
    skills: skills.filter(Boolean),
    experience,
    education,
    languages: languages.filter(Boolean),
    certifications: certifications.filter(Boolean),
    scores: Object.keys(scores).length > 0 ? scores : undefined,
  };
}

const CVUpload: React.FC<CVUploadProps> = ({
  onUploadComplete,
  onParsingComplete,
  className = ""
}) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cvText, setCvText] = useState('');
  const [parsedData, setParsedData] = useState<DisplayCVData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Simulate progress bar
  const simulateProgress = (setter: (v: number) => void, duration = 2000) =>
    new Promise<void>((resolve) => {
      let v = 0;
      const id = setInterval(() => {
        v += Math.random() * 15;
        if (v >= 100) {
          v = 100;
          setter(v);
          clearInterval(id);
          resolve();
        } else {
          setter(v);
        }
      }, duration / 10);
    });

  // Handle file upload and parsing
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setIsParsing(false);
    setUploadProgress(0);
    setError(null);
    setSuccess(null);
    setParsedData(null);
    setSelectedFile(file);

    try {
      // Upload progress simulation
      const progressPromise = simulateProgress(setUploadProgress, 2000);

      // Call actual API
      const result = await cvService.parseCVFile(file);

      await progressPromise;
      setIsUploading(false);

      if (!result.success) {
        throw new Error(result.message || 'CV parsing failed');
      }

      setIsParsing(true);
      await simulateProgress(setUploadProgress, 1000);
      setIsParsing(false);

      const normalized = normalizeBackendData(result);
      setParsedData(normalized);
      setSuccess('CV uploaded and parsed successfully!');

      if (onUploadComplete) onUploadComplete(result);
      if (onParsingComplete) onParsingComplete(normalized);

      setActiveTab('results');
    } catch (err) {
      setIsUploading(false);
      setIsParsing(false);
      setError(`Upload failed: ${(err as Error).message}`);
    }
  };

  // Handle text parsing
  const handleTextParsing = async () => {
    if (!cvText.trim()) {
      setError('Please enter CV text to parse');
      return;
    }

    setIsParsing(true);
    setError(null);
    setSuccess(null);
    setParsedData(null);

    try {
      const result = await cvService.parseCVText(cvText);

      if (!result.success) {
        throw new Error(result.message || 'CV text parsing failed');
      }

      const normalized = normalizeBackendData(result);
      setParsedData(normalized);
      setSuccess('CV text parsed successfully!');

      if (onParsingComplete) onParsingComplete(normalized);

      setActiveTab('results');
    } catch (err) {
      setError(`Parsing failed: ${(err as Error).message}`);
    } finally {
      setIsParsing(false);
    }
  };

  // Drag and drop handlers
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (['pdf', 'docx', 'doc', 'txt'].includes(ext || '')) {
        handleFileUpload(file);
      } else {
        setError('Unsupported file type. Please upload PDF, DOCX, DOC, or TXT files.');
      }
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Load sample CV for demo
  const loadSampleCV = () => {
    const sampleCV = `Ahmed Al Mansouri
Senior Software Engineer
ahmed.almansouri@email.com
+971501234567
Dubai, UAE

PROFESSIONAL SUMMARY
Experienced software engineer with 8+ years in full-stack development, specializing in React, Node.js, and cloud technologies. Proven track record in leading development teams and delivering scalable solutions for UAE enterprises.

WORK EXPERIENCE
Senior Software Engineer | Emirates Technology Solutions | 2020 - Present
- Led development of digital transformation initiatives
- Managed team of 5 developers
- Implemented microservices architecture using AWS

Software Engineer | ADNOC Digital | 2018 - 2020
- Developed web applications using React and Node.js
- Collaborated with cross-functional teams
- Optimized database performance

EDUCATION
Bachelor of Computer Science | American University of Sharjah | 2018
GPA: 3.8/4.0

SKILLS
JavaScript, TypeScript, React, Node.js, Python, AWS, Docker, MongoDB, PostgreSQL, Git, Agile

LANGUAGES
Arabic (Native), English (Fluent), French (Intermediate)

CERTIFICATIONS
AWS Certified Solutions Architect
Certified Scrum Master`;

    setCvText(sampleCV);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Status Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              <X className="h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">📄 File Upload</TabsTrigger>
          <TabsTrigger value="text">✏️ Text Input</TabsTrigger>
          <TabsTrigger value="results">📊 Results</TabsTrigger>
        </TabsList>

        {/* File Upload Tab */}
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload CV File
              </CardTitle>
              <CardDescription>
                Drag and drop your CV or click to select a file. Supports PDF, DOCX, DOC, and TXT (max 10MB).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                  transition-colors duration-200
                  ${isUploading || isParsing
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
                  }
                `}
                onClick={() => document.getElementById('cv-file-input')?.click()}
              >
                <input
                  id="cv-file-input"
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  className="hidden"
                  onChange={handleFileInput}
                />

                {isUploading || isParsing ? (
                  <div className="space-y-4">
                    <Loader2 className="h-12 w-12 mx-auto text-blue-500 animate-spin" />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {isParsing ? 'Parsing CV with AI...' : 'Uploading...'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {isParsing
                          ? 'Extracting skills, experience, and education'
                          : `Uploading ${selectedFile?.name}`}
                      </p>
                    </div>
                    <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                    <p className="text-xs text-gray-500">{Math.round(uploadProgress)}%</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="h-12 w-12 mx-auto text-gray-400" />
                    <div>
                      <p className="font-semibold text-gray-900">
                        Drop your CV here, or click to browse
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        PDF, DOCX, DOC, TXT — Max 10MB
                      </p>
                    </div>
                  </div>
                )}

                {selectedFile && !isUploading && !isParsing && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg inline-flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                    <Badge variant="secondary">
                      {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Text Input Tab */}
        <TabsContent value="text" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Paste CV Text
              </CardTitle>
              <CardDescription>
                Copy and paste your CV content for AI-powered parsing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">CV Content</label>
                  <Button
                    onClick={loadSampleCV}
                    variant="outline"
                    size="sm"
                  >
                    Load Sample CV
                  </Button>
                </div>
                <textarea
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  placeholder="Paste your CV content here or click 'Load Sample CV' to test..."
                  className="w-full h-64 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500">
                  Characters: {cvText.length} | Lines: {cvText.split('\n').length}
                </p>
              </div>

              <Button
                onClick={handleTextParsing}
                disabled={isParsing || !cvText.trim()}
                className="w-full"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Parsing CV...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Parse CV with AI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-4">
          {parsedData ? (
            <div className="space-y-4">
              {/* Success Header */}
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-green-800">CV Parsed Successfully!</h3>
                      <p className="text-green-700">Ready for profile integration</p>
                    </div>
                    {parsedData.scores?.overall !== undefined && (
                      <Badge variant="secondary" className="ml-auto text-lg px-3 py-1">
                        <Sparkles className="h-4 w-4 mr-1" />
                        Score: {parsedData.scores.overall}/100
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Score Breakdown */}
              {parsedData.scores && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Target className="h-4 w-4" />
                      CV Quality Scores
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      {parsedData.scores.completeness !== undefined && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{parsedData.scores.completeness}%</div>
                          <div className="text-xs text-gray-500">Completeness</div>
                        </div>
                      )}
                      {parsedData.scores.detail_depth !== undefined && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{parsedData.scores.detail_depth}%</div>
                          <div className="text-xs text-gray-500">Detail Depth</div>
                        </div>
                      )}
                      {parsedData.scores.uae_relevance !== undefined && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-emerald-600">{parsedData.scores.uae_relevance}%</div>
                          <div className="text-xs text-gray-500">UAE Relevance</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Parsed Data Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <User className="h-4 w-4" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {parsedData.name && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{parsedData.name}</span>
                      </div>
                    )}
                    {parsedData.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{parsedData.email}</span>
                      </div>
                    )}
                    {parsedData.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{parsedData.phone}</span>
                      </div>
                    )}
                    {parsedData.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{parsedData.location}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Professional Summary */}
                {parsedData.summary && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Briefcase className="h-4 w-4" />
                        Professional Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700">{parsedData.summary}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Skills */}
                {parsedData.skills && parsedData.skills.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Award className="h-4 w-4" />
                        Skills ({parsedData.skills.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {parsedData.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Experience */}
                {parsedData.experience && parsedData.experience.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Briefcase className="h-4 w-4" />
                        Experience ({parsedData.experience.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {parsedData.experience.map((exp, index) => (
                        <div key={index} className="border-l-2 border-blue-200 pl-3">
                          <h4 className="font-medium text-sm">{exp.title}</h4>
                          <p className="text-sm text-gray-600">{exp.company}</p>
                          <p className="text-xs text-gray-500">{exp.duration}</p>
                          {exp.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Education */}
                {parsedData.education && parsedData.education.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <GraduationCap className="h-4 w-4" />
                        Education ({parsedData.education.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {parsedData.education.map((edu, index) => (
                        <div key={index} className="border-l-2 border-green-200 pl-3">
                          <h4 className="font-medium text-sm">{edu.degree}</h4>
                          <p className="text-sm text-gray-600">{edu.institution}</p>
                          <p className="text-xs text-gray-500">{edu.year}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Languages */}
                {parsedData.languages && parsedData.languages.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Languages className="h-4 w-4" />
                        Languages
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {parsedData.languages.map((lang, index) => (
                          <Badge key={index} variant="outline">{lang}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Action Buttons */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={() => {
                        setActiveTab('upload');
                        setParsedData(null);
                        setSuccess(null);
                        setSelectedFile(null);
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Upload Another CV
                    </Button>
                    <Button
                      onClick={() => {
                        if (onParsingComplete && parsedData) {
                          onParsingComplete(parsedData);
                        }
                      }}
                      className="flex-1"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Update Profile with This Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No CV data parsed yet</p>
                  <p className="text-sm text-gray-500">Upload a file or paste text to get started</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CVUpload;
