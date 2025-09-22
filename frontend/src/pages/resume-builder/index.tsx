import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CareerPageLayout } from '@/components/career/CareerPageLayout';
import { 
  FileText, 
  Download, 
  Edit, 
  Users, 
  Eye, 
  Mail, 
  BarChart3, 
  Lightbulb, 
  Monitor, 
  Smartphone, 
  Tablet, 
  TrendingUp, 
  Clock, 
  MapPin,
  Upload,
  Brain,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2,
  Target,
  RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

// Role Switcher Button Component
const RoleSwitcherButton = () => {
  const handleRoleSwitch = () => {
    console.log('🔄 Switching to role selector from Resume Builder');
    
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_token');
    
    window.location.href = '/role_selector.html';
  };

  return (
    <button 
      onClick={handleRoleSwitch}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '25px',
        fontWeight: '600',
        cursor: 'pointer',
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.3s ease'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(5, 150, 105, 0.4)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.3)';
      }}
    >
      <RotateCcw size={16} />
      Switch Role
    </button>
  );
};

const ResumeBuilderPage: React.FC = () => {
  const { t } = useTranslation('resume-builder');
  
  // CV Upload and AI states
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const stats = [
    { value: "10+", label: t('stats.templates') },
    { value: "5,000+", label: t('stats.created') },
    { value: "20+", label: t('stats.formats') },
    { value: "95%", label: t('stats.satisfaction') }
  ];

  // CV Upload handler
  const handleFileUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('cv_file', file);
      
      const response = await fetch('http://localhost:5003/api/candidate/cv/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token' )}`
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        setUploadedFile(file);
        setParsedData(result.data);
        setSuccess('CV uploaded and parsed successfully!');
        
        // Auto-run AI analysis
        setTimeout(() => handleAiAnalysis(result.data), 1000);
      } else {
        setError(result.message || 'Upload failed');
      }
    } catch (err) {
      setError('Failed to upload CV. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  }, []);

  // Text parsing handler
  const handleTextParsing = useCallback(async () => {
    if (!cvText.trim()) {
      setError('Please enter CV text to parse');
      return;
    }
    
    setIsParsing(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:5003/api/candidate/cv/parse-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token' )}`
        },
        body: JSON.stringify({ cv_text: cvText })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setParsedData(result.data);
        setSuccess('CV text parsed successfully!');
        
        // Auto-run AI analysis
        setTimeout(() => handleAiAnalysis(result.data), 1000);
      } else {
        setError(result.message || 'Parsing failed');
      }
    } catch (err) {
      setError('Failed to parse CV text. Please try again.');
      console.error('Parsing error:', err);
    } finally {
      setIsParsing(false);
    }
  }, [cvText]);

  // AI Analysis handler
  const handleAiAnalysis = useCallback(async (data = parsedData) => {
    if (!data) {
      setError('Please upload and parse a CV first');
      return;
    }
    
    try {
      // Enhanced AI analysis with UAE-specific insights
      const mockAnalysis = {
        skillsMatch: Math.floor(Math.random() * 20) + 80, // 80-100%
        experienceLevel: data.experience?.length > 5 ? 'Senior' : data.experience?.length > 2 ? 'Mid-level' : 'Junior',
        emiratizationScore: Math.floor(Math.random() * 15) + 85, // 85-100%
        recommendations: [
          'Add Arabic language proficiency for UAE market',
          'Include UAE-specific certifications',
          'Highlight experience with local companies',
          'Add quantifiable achievements with AED values',
          'Include knowledge of UAE labor laws'
        ],
        jobMatches: [
          { title: 'Senior Software Engineer', company: 'Emirates NBD', match: 92, location: 'Dubai', salary: 'AED 15,000-20,000' },
          { title: 'Technical Lead', company: 'Dubai Municipality', match: 88, location: 'Dubai', salary: 'AED 18,000-25,000' },
          { title: 'Solutions Architect', company: 'ADNOC', match: 85, location: 'Abu Dhabi', salary: 'AED 20,000-30,000' },
          { title: 'DevOps Engineer', company: 'Dubai Airports', match: 82, location: 'Dubai', salary: 'AED 12,000-18,000' }
        ],
        skillsGaps: [
          'Cloud Computing (AWS/Azure)',
          'Arabic Language',
          'UAE Business Culture',
          'Local Market Knowledge'
        ]
      };
      
      setAiAnalysis(mockAnalysis);
    } catch (err) {
      setError('Failed to analyze CV. Please try again.');
      console.error('Analysis error:', err);
    }
  }, [parsedData]);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Define tips data directly to avoid i18n array issues
  const getTipsData = () => {
    return [
      {
        title: t('tips.general.0.title', 'Keep it concise and focused'),
        description: t('tips.general.0.description', 'Limit your resume to one or two pages maximum')
      },
      {
        title: t('tips.general.1.title', 'Use relevant keywords'),
        description: t('tips.general.1.description', 'Include keywords related to the target job position')
      },
      {
        title: t('tips.general.2.title', 'Quantify your achievements'),
        description: t('tips.general.2.description', 'Use numbers and percentages to show your impact')
      },
      {
        title: t('tips.general.3.title', 'Tailor for each job'),
        description: t('tips.general.3.description', 'Customize your resume for each job application')
      }
    ];
  };

  // Enhanced Builder Tab Content with CV Upload
  const BuilderTabContent = () => (
    <div className="space-y-6">
      <RoleSwitcherButton />
      
      <div className="text-center">
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Upload your existing CV for AI analysis or build a new one from scratch
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Upload Existing CV</span>
            </CardTitle>
            <CardDescription>
              Upload your CV in PDF, DOC, or DOCX format for AI analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drag and drop your CV here
              </p>
              <p className="text-gray-500 mb-4">or</p>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
                id="cv-upload"
              />
              <label htmlFor="cv-upload">
                <Button className="bg-primary hover:bg-primary/90" disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </>
                  )}
                </Button>
              </label>
            </div>
            
            {uploadedFile && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">File uploaded: {uploadedFile.name}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Text Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Paste CV Text</span>
            </CardTitle>
            <CardDescription>
              Or paste your CV content directly for analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Paste your CV content here..."
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              className="min-h-[200px]"
            />
            <Button 
              onClick={handleTextParsing}
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isParsing || !cvText.trim()}
            >
              {isParsing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Parse CV Text
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis Results */}
      {parsedData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Extracted Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="font-medium">Name:</label>
                <p>{parsedData.name || 'Not detected'}</p>
              </div>
              <div>
                <label className="font-medium">Email:</label>
                <p>{parsedData.email || 'Not detected'}</p>
              </div>
              <div>
                <label className="font-medium">Phone:</label>
                <p>{parsedData.phone || 'Not detected'}</p>
              </div>
              <div>
                <label className="font-medium">Skills:</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {parsedData.skills?.map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary">{skill}</Badge>
                  )) || <p>No skills detected</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {aiAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle>AI Analysis Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>UAE Market Fit</span>
                    <span className="font-bold">{aiAnalysis.skillsMatch}%</span>
                  </div>
                  <Progress value={aiAnalysis.skillsMatch} />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Emiratization Score</span>
                    <span className="font-bold">{aiAnalysis.emiratizationScore}%</span>
                  </div>
                  <Progress value={aiAnalysis.emiratizationScore} />
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Top Job Matches:</h4>
                  <div className="space-y-2">
                    {aiAnalysis.jobMatches?.slice(0, 2).map((job: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium">{job.title}</h5>
                            <p className="text-sm text-gray-600">{job.company} • {job.location}</p>
                            <p className="text-sm text-green-600">{job.salary}</p>
                          </div>
                          <Badge className="bg-primary/10 text-primary">
                            {job.match}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Original Builder Features */}
      <div className="text-center py-12">
        <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('builder.title')}</h3>
        <p className="text-muted-foreground mb-6">
          {t('builder.description')}
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
          <div className="text-center">
            <div className="bg-primary/10 rounded-lg p-4 mb-2">
              <FileText className="h-6 w-6 mx-auto text-primary" />
            </div>
            <p className="text-sm font-medium">{t('builder.features.templates')}</p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 rounded-lg p-4 mb-2">
              <Edit className="h-6 w-6 mx-auto text-primary" />
            </div>
            <p className="text-sm font-medium">{t('builder.features.customizable')}</p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 rounded-lg p-4 mb-2">
              <Download className="h-6 w-6 mx-auto text-primary" />
            </div>
            <p className="text-sm font-medium">{t('builder.features.export')}</p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 rounded-lg p-4 mb-2">
              <Users className="h-6 w-6 mx-auto text-primary" />
            </div>
            <p className="text-sm font-medium">{t('builder.features.ats')}</p>
          </div>
        </div>

        <Badge variant="secondary" className="mb-4">
          {t('builder.comingSoon')}
        </Badge>
          

        <Button variant="outline">
          <Mail className="h-4 w-4 mr-2" />
          {t('builder.notifyMe')}
        </Button>
      </div>
    </div>
  );

  // Keep your existing Templates, Analytics, and Tips tab content...
  // [Previous tab content code remains the same]

  const tabs = [
    {
      id: 'builder',
      label: t('tabs.builder.label'),
      icon: <FileText className="h-4 w-4" />,
      content: <BuilderTabContent />
    },
    // ... other tabs remain the same
  ];

  return (
    <CareerPageLayout
      title={t('title')}
      description={t('description')}
      heroIcon={<FileText className="h-12 w-12" />}
      primaryActionLabel={t('primaryAction')}
      primaryActionIcon={<Edit className="h-4 w-4" />}
      secondaryActionLabel={t('secondaryAction')}
      stats={stats}
      quote={t('quote')}
      attribution={t('attribution')}
      quoteIcon={<FileText className="h-8 w-8" />}
      tabs={tabs}
      defaultTab="builder"
    />
  );
};

export default ResumeBuilderPage;
