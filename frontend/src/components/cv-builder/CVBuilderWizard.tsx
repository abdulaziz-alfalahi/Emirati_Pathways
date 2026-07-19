import React, { useState, useEffect } from 'react';
import { useCV } from '@/context/CVContext';

// Enhanced CV utilities
import { 
  calculateCompletionScore, 
  generateCVSuggestions,
  validateCVSection,
  formatCVForExport
} from '@/utils/cv-utils';

// UAE data utilities
import { 
  getCitiesByEmirate, 
  UAE_EMIRATES, 
  isValidUAEEmirate,
  UAE_INDUSTRIES,
  UAE_HIGH_DEMAND_SKILLS
} from '@/utils/uae-data';

// Enhanced validation utilities
import { 
  validateUAEPhone, 
  formatUAEPhone,
  validateEmiratesId,
  formatEmiratesId
} from '@/utils/validation';

// Type imports
import { CV, CVStep } from '@/types/cv';

// UI Components (assuming these exist in your project)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Trash2, 
  User, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Languages, 
  FolderOpen,
  Globe,
  ChevronLeft,
  ChevronRight,
  Save,
  Download,
  Eye,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Target,
  TrendingUp
} from 'lucide-react';

interface StepComponentProps {
  data: Partial<CV>;
  onChange: (section: string, data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

interface CVBuilderWizardProps {
  initialData?: Partial<CV>;
  onSave?: (data: Partial<CV>) => void;
  onExport?: (format: string) => void;
  className?: string;
  language?: string;
  isRTL?: boolean;
}

const CVBuilderWizard: React.FC<CVBuilderWizardProps> = ({ 
  initialData = {}, 
  onSave = () => {}, 
  onExport = () => {}, 
  className = '',
  language = 'en',
  isRTL = false
}) => {
  const { 
    currentCV, 
    currentStep,
    loading,
    error,
    updatePersonalInfo,
    saveCV,
    exportCV
  } = useCV();

  // Local state for wizard-specific functionality
  const [localStep, setLocalStep] = useState<CVStep>(currentStep);
  const [showPreview, setShowPreview] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [stepValidationErrors, setStepValidationErrors] = useState<Record<string, string[]>>({});
  const [completionScore, setCompletionScore] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Bilingual support
  const [displayLanguage, setDisplayLanguage] = useState(language);
  const [bilingualMode, setBilingualMode] = useState(false);

  const steps = [
    { 
      id: 'template' as CVStep, 
      title: language === 'ar' ? 'اختيار القالب' : 'Choose Template', 
      icon: Globe
    },
    { 
      id: 'personal' as CVStep, 
      title: language === 'ar' ? 'المعلومات الشخصية' : 'Personal Information', 
      icon: User
    },
    { 
      id: 'experience' as CVStep, 
      title: language === 'ar' ? 'الخبرة العملية' : 'Work Experience', 
      icon: Briefcase
    },
    { 
      id: 'education' as CVStep, 
      title: language === 'ar' ? 'التعليم' : 'Education', 
      icon: GraduationCap
    },
    { 
      id: 'skills' as CVStep, 
      title: language === 'ar' ? 'المهارات' : 'Skills', 
      icon: Award
    },
    { 
      id: 'languages' as CVStep, 
      title: language === 'ar' ? 'اللغات' : 'Languages', 
      icon: Languages
    },
    { 
      id: 'review' as CVStep, 
      title: language === 'ar' ? 'المراجعة' : 'Review & Export', 
      icon: Eye
    }
  ];

  const totalSteps = steps.length;

  // Sync local step with context step
  useEffect(() => {
    setLocalStep(currentStep);
  }, [currentStep]);

  // Calculate completion score
  useEffect(() => {
    if (currentCV) {
      const score = calculateCompletionScore(currentCV);
      setCompletionScore(score);
    }
  }, [currentCV]);

  // Generate suggestions when CV data changes
  useEffect(() => {
    if (currentCV) {
      const newSuggestions = generateCVSuggestions(currentCV);
      setSuggestions(newSuggestions);
    }
  }, [currentCV]);

  // Validate current step
  useEffect(() => {
    validateCurrentStep();
  }, [localStep, currentCV]);

  const validateCurrentStep = () => {
    if (!currentCV) return;

    const currentStepData = steps.find(step => step.id === localStep);
    if (!currentStepData) return;

    let sectionData;
    let sectionName = '';

    switch (currentStepData.id) {
      case 'personal':
        sectionData = currentCV.personalInfo;
        sectionName = 'personalInfo';
        break;
      case 'experience':
        sectionData = currentCV.experience;
        sectionName = 'experience';
        break;
      case 'education':
        sectionData = currentCV.education;
        sectionName = 'education';
        break;
      case 'skills':
        sectionData = currentCV.skills;
        sectionName = 'skills';
        break;
      default:
        return;
    }

    if (sectionData) {
      const validation = validateCVSection(sectionName, sectionData);
      if (validation && typeof validation === 'object' && 'errors' in validation) {
        setStepValidationErrors(prev => ({
          ...prev,
          [sectionName]: validation.errors ? Object.values(validation.errors) : []
        }));
      }
    }
  };

  const handleStepChange = (stepId: CVStep) => {
    const stepIndex = steps.findIndex(step => step.id === stepId);
    if (stepIndex !== -1) {
      setLocalStep(stepId);
    }
  };

  const handleNext = () => {
    const currentIndex = steps.findIndex(step => step.id === localStep);
    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1];
      handleStepChange(nextStep.id);
    }
  };

  const handlePrevious = () => {
    const currentIndex = steps.findIndex(step => step.id === localStep);
    if (currentIndex > 0) {
      const prevStep = steps[currentIndex - 1];
      handleStepChange(prevStep.id);
    }
  };

  const handleSave = async () => {
    try {
      await saveCV();
      if (onSave && currentCV) {
        await onSave(currentCV);
      }
    } catch (error) {
      console.error('Error saving CV:', error);
    }
  };

  const handleExport = async (format: string) => {
    try {
      const exportUrl = await exportCV(format as any);
      if (exportUrl) {
        window.open(exportUrl, '_blank');
      }
      await onExport(format);
    } catch (error) {
      console.error('Error exporting CV:', error);
    }
  };

  const getStepStatus = (stepId: CVStep) => {
    const currentIndex = steps.findIndex(step => step.id === localStep);
    const stepIndex = steps.findIndex(step => step.id === stepId);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const getStepIcon = (step: any, status: string) => {
    const Icon = step.icon;
    if (status === 'completed') {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    return <Icon className={`h-5 w-5 ${status === 'current' ? 'text-blue-600' : 'text-gray-400'}`} />;
  };

  // Simple step content renderer (without external step components)
  const getCurrentStepContent = () => {
    switch (localStep) {
      case 'template':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Choose Your CV Template</h2>
              <p className="text-gray-600">Select a template that best fits your industry and career level</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Template selection would go here */}
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="aspect-[3/4] bg-gray-100 rounded mb-3"></div>
                  <h3 className="font-semibold">Professional Template</h3>
                  <p className="text-sm text-gray-600">Perfect for corporate roles</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'personal':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Personal Information</h2>
              <p className="text-gray-600">Tell us about yourself</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName" 
                  placeholder="Enter your first name"
                  value={currentCV?.personalInfo?.firstName || ''}
                  onChange={(e) => updatePersonalInfo({ firstName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName" 
                  placeholder="Enter your last name"
                  value={currentCV?.personalInfo?.lastName || ''}
                  onChange={(e) => updatePersonalInfo({ lastName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  placeholder="Enter your email"
                  value={currentCV?.personalInfo?.email || ''}
                  onChange={(e) => updatePersonalInfo({ email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input 
                  id="phone" 
                  placeholder="Enter your phone number"
                  value={currentCV?.personalInfo?.phone || ''}
                  onChange={(e) => updatePersonalInfo({ phone: e.target.value })}
                />
              </div>
            </div>
          </div>
        );

      case 'experience':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Work Experience</h2>
              <p className="text-gray-600">Add your professional experience</p>
            </div>
            <div className="space-y-4">
              {currentCV?.experience?.map((exp, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{exp.jobTitle}</h3>
                    <p className="text-gray-600">{exp.company}</p>
                    <p className="text-sm text-gray-500">{exp.startDate} - {exp.endDate || 'Present'}</p>
                  </CardContent>
                </Card>
              )) || (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No experience added yet</p>
                  <Button>
                    <Plus className="h-4 w-4 me-2" />
                    Add Experience
                  </Button>
                </div>
              )}
            </div>
          </div>
        );

      case 'education':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Education</h2>
              <p className="text-gray-600">Add your educational background</p>
            </div>
            <div className="space-y-4">
              {currentCV?.education?.map((edu, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{edu.degree}</h3>
                    <p className="text-gray-600">{edu.institution}</p>
                    <p className="text-sm text-gray-500">{edu.startDate} - {edu.endDate || 'Present'}</p>
                  </CardContent>
                </Card>
              )) || (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No education added yet</p>
                  <Button>
                    <Plus className="h-4 w-4 me-2" />
                    Add Education
                  </Button>
                </div>
              )}
            </div>
          </div>
        );

      case 'skills':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Skills</h2>
              <p className="text-gray-600">Showcase your abilities</p>
            </div>
            <div className="space-y-4">
              {currentCV?.skills?.length ? (
                <div className="flex flex-wrap gap-2">
                  {currentCV.skills.map((skill, index) => (
                    <Badge key={index}>
                      {skill.name} - {skill.level}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No skills added yet</p>
                  <Button>
                    <Plus className="h-4 w-4 me-2" />
                    Add Skill
                  </Button>
                </div>
              )}
            </div>
          </div>
        );

      case 'languages':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Languages</h2>
              <p className="text-gray-600">Add languages you speak</p>
            </div>
            <div className="space-y-4">
              {currentCV?.languages?.length ? (
                <div className="space-y-2">
                  {currentCV.languages.map((lang, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{lang.name}</span>
                          <Badge>{lang.proficiency}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No languages added yet</p>
                  <Button>
                    <Plus className="h-4 w-4 me-2" />
                    Add Language
                  </Button>
                </div>
              )}
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Review Your CV</h2>
              <p className="text-gray-600">Review and export your completed CV</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">CV Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Completion Score:</span>
                    <span className="font-semibold">{completionScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sections:</span>
                    <span>{currentCV?.metadata?.completedSections || 0}/{currentCV?.metadata?.totalSections || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ATS Score:</span>
                    <span>{currentCV?.metadata?.atsScore || 0}%</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Export Options</h3>
                <div className="space-y-2">
                  <Button className="w-full" onClick={() => handleExport('pdf')}>
                    <Download className="h-4 w-4 me-2" />
                    Download PDF
                  </Button>
                  <Button className="w-full" onClick={() => handleExport('word')}>
                    <Download className="h-4 w-4 me-2" />
                    Download Word
                  </Button>
                  <Button className="w-full" onClick={() => handleExport('json')}>
                    <Download className="h-4 w-4 me-2" />
                    Download JSON
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Step not found</div>;
    }
  };

  // Check loading state properly
  if (loading && typeof loading === 'object' && loading.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Sparkles className="h-12 w-12 animate-spin mx-auto text-blue-600" />
          <h3 className="text-lg font-semibold">Building Your CV</h3>
          <p className="text-gray-600">Please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-6xl mx-auto p-6 space-y-6 ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">
          {language === 'ar' ? 'منشئ السيرة الذاتية' : 'CV Builder'}
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          {language === 'ar' 
            ? 'أنشئ سيرتك الذاتية المهنية المحسنة لسوق العمل الإماراتي'
            : 'Create your professional CV optimized for the UAE job market'
          }
        </p>
      </div>

      {/* Progress Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-blue-900">CV Progress</h3>
              <p className="text-sm text-blue-700">
                Step {steps.findIndex(step => step.id === localStep) + 1} of {totalSteps}
              </p>
            </div>
            <div className="text-end">
              <div className="text-2xl font-bold text-blue-900">{completionScore}%</div>
              <div className="text-sm text-blue-700">Complete</div>
            </div>
          </div>
          <Progress value={((steps.findIndex(step => step.id === localStep) + 1) / totalSteps) * 100} className="h-2 mb-4" />
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900">
                {currentCV?.experience?.length || 0}
              </div>
              <div className="text-xs text-gray-600">Experiences</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                {currentCV?.education?.length || 0}
              </div>
              <div className="text-xs text-gray-600">Education</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                {currentCV?.skills?.length || 0}
              </div>
              <div className="text-xs text-gray-600">Skills</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                {currentCV?.languages?.length || 0}
              </div>
              <div className="text-xs text-gray-600">Languages</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Step Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between overflow-x-auto pb-4">
            {steps.map((step, index) => {
              const status = getStepStatus(step.id);
              
              return (
                <div
                  key={step.id}
                  className={`flex items-center cursor-pointer transition-all duration-200 ${
                    status === 'current' ? 'scale-110' : ''
                  }`}
                  onClick={() => handleStepChange(step.id)}
                >
                  <div className={`flex items-center space-x-3 p-3 rounded-lg ${
                    status === 'completed' ? 'bg-green-50 text-green-700' :
                    status === 'current' ? 'bg-blue-50 text-blue-700' :
                    'bg-gray-50 text-gray-500'
                  }`}>
                    {getStepIcon(step, status)}
                    <div>
                      <div className="font-medium text-sm">{step.title}</div>
                      <div className="text-xs opacity-75">Step {index + 1}</div>
                    </div>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-2 ${
                      steps.findIndex(s => s.id === localStep) > index ? 'bg-green-300' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Suggestions Panel */}
      {suggestions.length > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Target className="h-5 w-5" />
              Suggestions to Improve Your CV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-yellow-800">
                  <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {suggestion}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Step Content */}
        <div className="lg:col-span-3">
          <Card className="min-h-[600px]">
            <CardContent className="p-6">
              {getCurrentStepContent()}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full justify-start"
                onClick={handleSave}
                disabled={loading && typeof loading === 'object' ? loading.isLoading : false}
              >
                <Save className="h-4 w-4 me-2" />
                {loading && typeof loading === 'object' && loading.isLoading ? 'Saving...' : 'Save Progress'}
              </Button>
              
              <Button 
                className="w-full justify-start"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-4 w-4 me-2" />
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
              
              {completionScore > 70 && (
                <Button 
                  className="w-full justify-start"
                  onClick={() => handleExport('pdf')}
                >
                  <Download className="h-4 w-4 me-2" />
                  Export PDF
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Language Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Language Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="bilingual-mode"
                  checked={bilingualMode}
                  onCheckedChange={setBilingualMode}
                />
                <Label htmlFor="bilingual-mode">Bilingual CV</Label>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  className={`text-sm ${displayLanguage === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                  onClick={() => setDisplayLanguage('en')}
                >
                  English
                </Button>
                <Button
                  className={`text-sm ${displayLanguage === 'ar' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                  onClick={() => setDisplayLanguage('ar')}
                >
                  العربية
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* CV Statistics */}
          {currentCV && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">CV Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completion Score</span>
                    <span className="font-semibold">{completionScore}%</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Total Sections</span>
                    <span className="font-semibold">{currentCV.metadata?.totalSections || 0}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Completed Sections</span>
                    <span className="font-semibold">{currentCV.metadata?.completedSections || 0}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>ATS Score</span>
                    <span className="font-semibold">{currentCV.metadata?.atsScore || 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <Button
              onClick={handlePrevious}
              disabled={localStep === 'template'}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="text-sm text-gray-600">
              Step {steps.findIndex(step => step.id === localStep) + 1} of {totalSteps}
            </div>
            
            <Button
              onClick={handleNext}
              disabled={localStep === 'review'}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CVBuilderWizard;

