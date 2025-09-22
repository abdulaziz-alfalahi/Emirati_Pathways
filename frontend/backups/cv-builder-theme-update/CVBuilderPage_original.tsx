import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  User, 
  FileText, 
  BarChart3, 
  Bot, 
  Save, 
  Trash2, 
  Download,
  CheckCircle,
  Sparkles,
  Target,
  Server,
  Zap,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CVUploadParser from '@/components/cv-builder/CVUploadParser';
import CVBuilderWizard from '@/components/cv-builder/CVBuilderWizard';

// ✅ FIXED: Complete interface that matches all possible data variations
interface PersonalInfo {
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  address?: string;
  summary?: string;
  linkedin?: string;
  linkedIn?: string;
  website?: string;
}

interface Experience {
  id: string;
  position?: string;
  title?: string;
  company: string;
  location?: string;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  description?: string;
  responsibilities?: string[];
  isCurrentlyWorking?: boolean;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  field_of_study?: string;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  gpa?: string;
  location?: string;
}

interface Skills {
  technical: string[];
  soft: string[];
}

interface Language {
  id: string;
  language: string;
  proficiency: string;
}

interface Certification {
  id: string;
  name: string;
  issuingOrganization?: string;
  issuing_organization?: string;
  date: string;
  expirationDate?: string;
  expiration_date?: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  url?: string;
  technologies?: string[];
  startDate?: string;
  endDate?: string;
}

interface CVData {
  personalInfo?: PersonalInfo;
  experience?: Experience[];
  education?: Education[];
  skills?: Skills;
  languages?: Language[];
  certifications?: Certification[];
  projects?: Project[];
}

interface SavedCV {
  id: string;
  name: string;
  data: CVData;
  createdAt: string;
  updatedAt: string;
  source: 'api' | 'manual' | 'localStorage';
}

const CVBuilderPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('builder');
  const [cvData, setCvData] = useState<CVData>({
    personalInfo: {},
    experience: [],
    education: [],
    skills: { technical: [], soft: [] },
    languages: [],
    certifications: [],
    projects: []
  });
  const [savedCVs, setSavedCVs] = useState<SavedCV[]>([]);
  const [isDataFromAPI, setIsDataFromAPI] = useState(false);
  const [flaskApiStatus, setFlaskApiStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [lastApiCall, setLastApiCall] = useState<string | null>(null);
  const { toast } = useToast();

  // ✅ Load saved CVs from localStorage on component mount
  useEffect(() => {
    console.log('🔄 CVBuilderPage: Loading saved CVs from localStorage...');
    try {
      const saved = localStorage.getItem('savedCVs');
      if (saved) {
        const parsedSaved = JSON.parse(saved);
        setSavedCVs(parsedSaved);
        console.log(`✅ Loaded ${parsedSaved.length} saved CVs from localStorage`);
      }

      // Also check for current CV data
      const currentData = localStorage.getItem('cvBuilderData');
      if (currentData) {
        const parsedData = JSON.parse(currentData);
        console.log('📄 Found current CV data in localStorage:', parsedData);
        setCvData(parsedData);
        setIsDataFromAPI(true);
      }
    } catch (error) {
      console.error('❌ Error loading saved CVs:', error);
    }
  }, []);

  // ✅ Check Flask API status on mount
  useEffect(() => {
    checkFlaskApiStatus();
  }, []);

  const checkFlaskApiStatus = async () => {
    console.log('🔍 Checking Flask API status...');
    try {
      const response = await fetch('http://localhost:5001/health', {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Flask API is available:', data);
        setFlaskApiStatus('available');
      } else {
        console.log('❌ Flask API returned non-OK status:', response.status);
        setFlaskApiStatus('unavailable');
      }
    } catch (error) {
      console.error('❌ Flask API check failed:', error);
      setFlaskApiStatus('unavailable');
    }
  };

  // ✅ CRITICAL: Handle parsed data from CVUploadParser
  const handleParsedData = (data: CVData) => {
    console.log('🎯 CVBuilderPage: Received parsed data from CVUploadParser!');
    console.log('📊 Parsed data summary:', {
      name: data.personalInfo?.name || data.personalInfo?.fullName,
      email: data.personalInfo?.email,
      experienceCount: data.experience?.length || 0,
      educationCount: data.education?.length || 0,
      skillsCount: (data.skills?.technical?.length || 0) + (data.skills?.soft?.length || 0)
    });

    // ✅ Set the CV data state
    setCvData(data);
    setIsDataFromAPI(true);
    setLastApiCall(new Date().toISOString());

    // ✅ Save to localStorage as backup
    localStorage.setItem('cvBuilderData', JSON.stringify(data));
    console.log('💾 Saved parsed data to localStorage as backup');

    // ✅ CRITICAL: Switch to CV Builder tab automatically
    console.log('🔄 Switching to CV Builder tab...');
    setActiveTab('builder');

    // ✅ Show success message
    toast({
      title: "CV Data Loaded Successfully!",
      description: `Your CV has been parsed and loaded into the CV Builder. Welcome, ${data.personalInfo?.name || data.personalInfo?.fullName || 'User'}!`,
    });

    console.log('✅ CVBuilderPage: Data flow complete - user should now see populated CV Builder');
  };

  // ✅ Save CV with metadata
  const handleSaveCV = (data: CVData) => {
    console.log('💾 Saving CV with metadata...');
    
    const cvName = data.personalInfo?.name || data.personalInfo?.fullName || `CV_${Date.now()}`;
    const newCV: SavedCV = {
      id: `cv_${Date.now()}`,
      name: cvName,
      data: data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: isDataFromAPI ? 'api' : 'manual'
    };

    const updatedSavedCVs = [...savedCVs, newCV];
    setSavedCVs(updatedSavedCVs);
    localStorage.setItem('savedCVs', JSON.stringify(updatedSavedCVs));
    
    console.log(`✅ CV saved: ${cvName}`);
    toast({
      title: "CV Saved Successfully!",
      description: `Your CV "${cvName}" has been saved and can be accessed from the Saved CVs tab.`,
    });
  };

  // ✅ Export CV
  const handleExportCV = (data: CVData) => {
    console.log('📄 Exporting CV...');
    
    const cvName = data.personalInfo?.name || data.personalInfo?.fullName || 'CV';
    const exportData = {
      ...data,
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        source: isDataFromAPI ? 'Flask API with Groq AI' : 'Manual Entry',
        lastApiCall: lastApiCall
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${cvName}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "CV Exported Successfully!",
      description: `Your CV has been exported as "${cvName}_${new Date().toISOString().split('T')[0]}.json"`,
    });
  };

  // ✅ Load saved CV
  const handleLoadCV = (savedCV: SavedCV) => {
    console.log(`📂 Loading saved CV: ${savedCV.name}`);
    setCvData(savedCV.data);
    setIsDataFromAPI(savedCV.source === 'api');
    setActiveTab('builder');

    toast({
      title: "CV Loaded Successfully!",
      description: `CV "${savedCV.name}" has been loaded into the builder.`,
    });
  };

  // ✅ Delete saved CV
  const handleDeleteCV = (cvId: string) => {
    console.log(`🗑️ Deleting saved CV: ${cvId}`);
    const updatedSavedCVs = savedCVs.filter(cv => cv.id !== cvId);
    setSavedCVs(updatedSavedCVs);
    localStorage.setItem('savedCVs', JSON.stringify(updatedSavedCVs));

    toast({
      title: "CV Deleted",
      description: "The selected CV has been removed from your saved CVs.",
    });
  };

  // ✅ Clear current data
  const handleClearData = () => {
    console.log('🗑️ Clearing current CV data...');
    setCvData({
      personalInfo: {},
      experience: [],
      education: [],
      skills: { technical: [], soft: [] },
      languages: [],
      certifications: [],
      projects: []
    });
    setIsDataFromAPI(false);
    setLastApiCall(null);
    localStorage.removeItem('cvBuilderData');

    toast({
      title: "Data Cleared",
      description: "All CV data has been cleared. You can start fresh or upload a new CV.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CV Builder (Real Flask API Integration)</h1>
            <p className="text-gray-600 mt-2">
              Create professional CVs with AI-powered parsing and intelligent field population
            </p>
          </div>
          
          {/* Flask API Status Badge */}
          <div className="flex items-center gap-3">
            <Badge 
              variant={flaskApiStatus === 'available' ? 'default' : 'destructive'}
              className={`${
                flaskApiStatus === 'available' 
                  ? 'bg-green-100 text-green-800 border-green-300' 
                  : 'bg-red-100 text-red-800 border-red-300'
              }`}
            >
              <Server className="h-3 w-3 mr-1" />
              Flask API: {flaskApiStatus === 'available' ? 'Available' : 'Unavailable'}
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkFlaskApiStatus}
              disabled={flaskApiStatus === 'checking'}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${flaskApiStatus === 'checking' ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-ehrdc-teal" />
                <div>
                  <p className="text-sm font-medium">Saved CVs</p>
                  <p className="text-2xl font-bold">{savedCVs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-ehrdc-teal" />
                <div>
                  <p className="text-sm font-medium">Current CV</p>
                  <p className="text-2xl font-bold">
                    {cvData.personalInfo?.name || cvData.personalInfo?.fullName ? '1' : '0'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-ehrdc-teal" />
                <div>
                  <p className="text-sm font-medium">Data Source</p>
                  <p className="text-sm font-bold">
                    {isDataFromAPI ? 'Flask API' : 'Manual'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-ehrdc-teal" />
                <div>
                  <p className="text-sm font-medium">Completion</p>
                  <p className="text-2xl font-bold">
                    {cvData.personalInfo?.name ? '100' : '0'}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            CV Builder
            {isDataFromAPI && <Badge variant="secondary" className="ml-1 bg-green-100 text-green-800">API</Badge>}
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload CV
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Saved CVs ({savedCVs.length})
          </TabsTrigger>
          <TabsTrigger value="ai-assistant" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI Assistant
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* CV Builder Tab */}
        <TabsContent value="builder" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">CV Builder</h2>
              <p className="text-muted-foreground">
                {isDataFromAPI 
                  ? `Building CV for ${cvData.personalInfo?.name || cvData.personalInfo?.fullName || 'User'} (Data from Flask API)`
                  : 'Create your professional CV step by step'
                }
              </p>
            </div>
            <div className="flex gap-2">
              {cvData.personalInfo?.name && (
                <Button variant="outline" onClick={handleClearData}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Data
                </Button>
              )}
            </div>
          </div>

          {/* Data Source Indicator */}
          {isDataFromAPI && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800 mb-2">
                <Sparkles className="h-5 w-5" />
                <span className="font-semibold">CV Data Loaded from Flask API!</span>
              </div>
              <p className="text-green-700 text-sm">
                Your CV has been automatically populated with data extracted by your Flask API using Groq AI processing.
                You can review and edit all information before saving.
              </p>
              {lastApiCall && (
                <p className="text-green-600 text-xs mt-1">
                  Last API call: {new Date(lastApiCall).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* CV Builder Wizard */}
          <CVBuilderWizard
            initialData={cvData}
            onSave={handleSaveCV}
            onExport={handleExportCV}
            className="w-full"
          />
        </TabsContent>

        {/* Upload CV Tab */}
        <TabsContent value="upload" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Upload & Parse CV</h2>
            <p className="text-muted-foreground">
              Upload your CV to automatically extract information using Flask API with Groq AI processing
            </p>
          </div>

          {/* ✅ CRITICAL: CVUploadParser with proper callback */}
          <CVUploadParser 
            onParsedData={handleParsedData}
            className="w-full"
          />

          {/* Upload Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-ehrdc-teal" />
                How It Works (Real Flask API Integration)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-ehrdc-teal/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <Upload className="h-6 w-6 text-ehrdc-teal" />
                  </div>
                  <h3 className="font-semibold mb-2">1. Upload Your CV</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload PDF, Word, text, or image files up to 10MB
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-ehrdc-teal/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <Server className="h-6 w-6 text-ehrdc-teal" />
                  </div>
                  <h3 className="font-semibold mb-2">2. Flask API Processing</h3>
                  <p className="text-sm text-muted-foreground">
                    Your Flask API with Groq AI extracts all information
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-ehrdc-teal/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="h-6 w-6 text-ehrdc-teal" />
                  </div>
                  <h3 className="font-semibold mb-2">3. Auto-Populate Builder</h3>
                  <p className="text-sm text-muted-foreground">
                    CV Builder fields are automatically filled with real data
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Saved CVs Tab */}
        <TabsContent value="saved" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Saved CVs</h2>
              <p className="text-muted-foreground">
                Manage your saved CV versions and templates
              </p>
            </div>
          </div>

          {savedCVs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Saved CVs</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't saved any CVs yet. Create one using the CV Builder or upload a CV to get started.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => setActiveTab('builder')}>
                    <User className="h-4 w-4 mr-2" />
                    Go to CV Builder
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab('upload')}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CV
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedCVs.map((savedCV) => (
                <Card key={savedCV.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{savedCV.name}</CardTitle>
                      <Badge variant={savedCV.source === 'api' ? 'default' : 'secondary'}>
                        {savedCV.source === 'api' ? 'Flask API' : 'Manual'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Created: {new Date(savedCV.createdAt).toLocaleDateString()}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Email:</span>
                        <span className="text-muted-foreground">
                          {savedCV.data.personalInfo?.email || 'Not provided'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Experience:</span>
                        <span className="text-muted-foreground">
                          {savedCV.data.experience?.length || 0} entries
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Education:</span>
                        <span className="text-muted-foreground">
                          {savedCV.data.education?.length || 0} entries
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleLoadCV(savedCV)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Load
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleExportCV(savedCV.data)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteCV(savedCV.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* AI Assistant Tab */}
        <TabsContent value="ai-assistant" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2">AI Assistant</h2>
            <p className="text-muted-foreground">
              Get AI-powered suggestions and improvements for your CV
            </p>
          </div>

          <Card>
            <CardContent className="p-8 text-center">
              <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">AI Assistant Coming Soon</h3>
              <p className="text-muted-foreground">
                Advanced AI features for CV optimization and career guidance will be available soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2">CV Analytics</h2>
            <p className="text-muted-foreground">
              Insights and analytics about your CV performance
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>CV Completion Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Personal Information</span>
                      <span>{cvData.personalInfo?.name ? '100%' : '0%'}</span>
                    </div>
                    <Progress value={cvData.personalInfo?.name ? 100 : 0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Work Experience</span>
                      <span>{cvData.experience?.length ? '100%' : '0%'}</span>
                    </div>
                    <Progress value={cvData.experience?.length ? 100 : 0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Education</span>
                      <span>{cvData.education?.length ? '100%' : '0%'}</span>
                    </div>
                    <Progress value={cvData.education?.length ? 100 : 0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Skills</span>
                      <span>{(cvData.skills?.technical?.length || 0) + (cvData.skills?.soft?.length || 0) > 0 ? '100%' : '0%'}</span>
                    </div>
                    <Progress value={(cvData.skills?.technical?.length || 0) + (cvData.skills?.soft?.length || 0) > 0 ? 100 : 0} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Flask API Integration Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Status</span>
                    <Badge variant={flaskApiStatus === 'available' ? 'default' : 'destructive'}>
                      {flaskApiStatus === 'available' ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Data Source</span>
                    <Badge variant={isDataFromAPI ? 'default' : 'secondary'}>
                      {isDataFromAPI ? 'Flask API' : 'Manual'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last API Call</span>
                    <span className="text-xs text-muted-foreground">
                      {lastApiCall ? new Date(lastApiCall).toLocaleString() : 'Never'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Groq AI Processing</span>
                    <Badge variant={isDataFromAPI ? 'default' : 'secondary'}>
                      {isDataFromAPI ? 'Used' : 'Not Used'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CVBuilderPage;

