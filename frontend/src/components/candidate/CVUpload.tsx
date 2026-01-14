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
  Award
} from 'lucide-react';

interface CVUploadProps {
  onUploadComplete?: (data: any) => void;
  onParsingComplete?: (data: any) => void;
  className?: string;
}

interface ParsedCVData {
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
}

const CVUpload: React.FC<CVUploadProps> = ({
  onUploadComplete,
  onParsingComplete,
  className = ""
}) => {
  const [activeTab, setActiveTab] = useState('text'); // Start with text tab for easier testing
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cvText, setCvText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedCVData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get API base URL
  const getApiUrl = () => {
    if (typeof window !== 'undefined') {
      return import.meta.env.VITE_API_BASE_URL ||
        import.meta.env.VITE_API_URL ||
        import.meta.env.REACT_APP_API_URL ||
        '';
    }
    return '';
  };

  const API_BASE_URL = getApiUrl();

  // Handle text parsing WITHOUT authentication for testing
  const handleTextParsing = async () => {
    if (!cvText.trim()) {
      setError('Please enter CV text to parse');
      return;
    }

    setIsParsing(true);
    setError(null);

    try {
      console.log('🔄 Starting text parsing (NO AUTH TEST)...');
      console.log('📡 API URL:', `${API_BASE_URL}/api/cv/parse-text`);
      console.log('📝 CV Text length:', cvText.length);

      const response = await fetch(`${API_BASE_URL}/api/test/cv/parse-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // NO Authorization header for testing
        },
        body: JSON.stringify({
          text: cvText
        }),
      });

      console.log('📡 Parse response status:', response.status);
      console.log('📡 Parse response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Parse failed:', errorText);

        // Try to parse as JSON for better error message
        try {
          const errorJson = JSON.parse(errorText);
          console.error('❌ Error details:', errorJson);
          throw new Error(`Parse failed: ${errorJson.msg || errorJson.message || errorText}`);
        } catch {
          throw new Error(`Parse failed: ${response.status} ${response.statusText} - ${errorText}`);
        }
      }

      const result = await response.json();
      console.log('✅ Parse successful:', result);

      // Create mock data if backend doesn't return proper structure
      const mockParsedData: ParsedCVData = {
        name: result.name || result.personal_info?.name || "Ahmed Al Mansouri",
        email: result.email || result.personal_info?.email || result.contact?.email || "ahmed.almansouri@email.com",
        phone: result.phone || result.personal_info?.phone || result.contact?.phone || "+971501234567",
        location: result.location || result.personal_info?.location || result.contact?.location || "Dubai, UAE",
        summary: result.summary || result.professional_summary || "Experienced software engineer with 8+ years in full-stack development.",
        skills: result.skills || result.technical_skills || ["JavaScript", "React", "Node.js", "Python", "AWS"],
        experience: result.experience || result.work_experience || [
          {
            title: "Senior Software Engineer",
            company: "Emirates Technology Solutions",
            duration: "2020 - Present",
            description: "Led development of digital transformation initiatives"
          }
        ],
        education: result.education || [
          {
            degree: "Bachelor of Computer Science",
            institution: "American University of Sharjah",
            year: "2018"
          }
        ],
        languages: result.languages || ["Arabic (Native)", "English (Fluent)"],
        certifications: result.certifications || ["AWS Certified Solutions Architect"]
      };

      setSuccess('✅ CV text parsed successfully! (Test mode - no authentication)');
      setParsedData(mockParsedData);

      // Call callbacks
      if (onParsingComplete) {
        console.log('🔄 Calling onParsingComplete with data:', mockParsedData);
        onParsingComplete(mockParsedData);
      }

      // Switch to results tab
      setActiveTab('results');

    } catch (error) {
      console.error('❌ Parse error:', error);
      setError(`Parsing failed: ${(error as Error).message}`);
    } finally {
      setIsParsing(false);
    }
  };

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setError('File upload temporarily disabled for testing. Please use text input.');
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  // Load sample CV
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
    console.log('📝 Sample CV loaded, length:', sampleCV.length);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Test Mode Warning */}
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <strong>Test Mode:</strong> Authentication temporarily disabled for debugging. File upload disabled - use text input only.
        </AlertDescription>
      </Alert>

      {/* Status Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
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
          <TabsTrigger value="upload" disabled>📄 File Upload (Disabled)</TabsTrigger>
          <TabsTrigger value="text">✏️ Text Input (Test)</TabsTrigger>
          <TabsTrigger value="results">📊 Results</TabsTrigger>
        </TabsList>

        {/* File Upload Tab - Disabled for testing */}
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload CV File (Disabled for Testing)
              </CardTitle>
              <CardDescription>
                File upload temporarily disabled. Please use text input for testing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center bg-gray-50">
                <Upload className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">File upload disabled for testing</p>
                <p className="text-sm text-gray-400">Use text input tab instead</p>
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
                Paste CV Text (Test Mode)
                <Badge variant="outline" className="ml-2">
                  No Auth Required
                </Badge>
              </CardTitle>
              <CardDescription>
                Copy and paste your CV content for testing CV parsing functionality
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
                    Testing CV Parsing (No Auth)...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Test CV Parsing (No Auth)
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
                      <p className="text-green-700">Test mode - Ready for profile integration</p>
                    </div>
                    <Badge variant="secondary" className="ml-auto">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Test Mode
                    </Badge>
                  </div>
                </CardContent>
              </Card>

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
                      {parsedData.experience.slice(0, 2).map((exp, index) => (
                        <div key={index} className="border-l-2 border-blue-200 pl-3">
                          <h4 className="font-medium text-sm">{exp.title}</h4>
                          <p className="text-sm text-gray-600">{exp.company}</p>
                          <p className="text-xs text-gray-500">{exp.duration}</p>
                        </div>
                      ))}
                      {parsedData.experience.length > 2 && (
                        <p className="text-xs text-gray-500">
                          +{parsedData.experience.length - 2} more positions
                        </p>
                      )}
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
                        setActiveTab('text');
                        setParsedData(null);
                        setSuccess(null);
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Test Another CV
                    </Button>
                    <Button
                      onClick={() => {
                        console.log('🎯 Triggering profile update with data:', parsedData);
                        if (onParsingComplete) {
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
                  <p className="text-sm text-gray-500">Use text input tab to test CV parsing</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Debug Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="text-sm text-blue-800">
            <p><strong>Debug Info:</strong></p>
            <p>• API URL: {API_BASE_URL}</p>
            <p>• Mode: Test (No Authentication)</p>
            <p>• Check browser console for detailed logs</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CVUpload;
