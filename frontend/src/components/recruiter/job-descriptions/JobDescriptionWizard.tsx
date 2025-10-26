import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Briefcase, 
  MapPin,
  DollarSign,
  Award,
  Target,
  Sparkles,
  Save,
  Send,
  Eye,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Users,
  Filter,
  TrendingUp
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

// UAE Emirates
const UAE_EMIRATES = [
  'Abu Dhabi',
  'Dubai',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah'
];

// Job types
const JOB_TYPES = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'temporary', label: 'Temporary' }
];

// Job levels
const JOB_LEVELS = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior Level' },
  { value: 'executive', label: 'Executive' },
  { value: 'manager', label: 'Manager' },
  { value: 'director', label: 'Director' }
];

// Requirement categories
const REQUIREMENT_CATEGORIES = [
  { value: 'education', label: 'Education' },
  { value: 'experience', label: 'Experience' },
  { value: 'skills', label: 'Skills' },
  { value: 'certification', label: 'Certification' },
  { value: 'language', label: 'Language' }
];

// Benefit categories
const BENEFIT_CATEGORIES = [
  { value: 'compensation', label: 'Compensation' },
  { value: 'health', label: 'Health & Wellness' },
  { value: 'time_off', label: 'Time Off' },
  { value: 'development', label: 'Professional Development' },
  { value: 'perks', label: 'Perks & Benefits' }
];

interface JDWizardProps {
  recruiterId: string;
  companyId: string;
  initialData?: any;
  initialJdId?: string;
  onComplete?: (jdId: string) => void;
  onCancel?: () => void;
}

interface JDData {
  jd_id?: string;
  basic_info: {
    title: string;
    title_arabic?: string;
    department: string;
    job_type: string;
    job_level: string;
    emirate: string;
    city: string;
    remote_option: boolean;
  };
  description: string;
  description_arabic?: string;
  requirements: Array<{
    category: string;
    description: string;
    is_required: boolean;
  }>;
  responsibilities: Array<{
    description: string;
    category: string;
  }>;
  benefits: Array<{
    category: string;
    description: string;
  }>;
  compensation: {
    salary_min?: number;
    salary_max?: number;
    salary_currency: string;
  };
}

interface MatchedCandidate {
  candidate: any;
  match_score: number;
  score_breakdown: any;
  matching_skills: string[];
  missing_skills: string[];
  strengths: string[];
  concerns: string[];
}

const JobDescriptionWizard: React.FC<JDWizardProps> = ({
  recruiterId,
  companyId,
  initialData,
  initialJdId,
  onComplete,
  onCancel
}) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [completionScore, setCompletionScore] = useState(0);
  const [jdData, setJDData] = useState<JDData>(() => {
    if (initialData) {
      console.log('Loading initial data:', initialData);
      console.log('Requirements from initial data:', initialData.requirements);
      return {
        jd_id: initialJdId,
        basic_info: initialData.basic_info || {
          title: '',
          department: '',
          job_type: 'full_time',
          job_level: 'mid',
          emirate: '',
          city: '',
          remote_option: false
        },
        description: initialData.description || '',
        description_arabic: initialData.description_arabic || '',
        requirements: initialData.requirements || [],
        responsibilities: initialData.responsibilities || [],
        benefits: initialData.benefits || [],
        compensation: initialData.compensation || {
          salary_currency: 'AED'
        }
      };
    }
    return {
      basic_info: {
        title: '',
        department: '',
        job_type: 'full_time',
        job_level: 'mid',
        emirate: '',
        city: '',
        remote_option: false
      },
      description: '',
      requirements: [],
      responsibilities: [],
      benefits: [],
      compensation: {
        salary_currency: 'AED'
      }
    };
  });
  
  const [loading, setLoading] = useState(false);
  const [showMatchingDialog, setShowMatchingDialog] = useState(false);
  const [employmentStatusFilter, setEmploymentStatusFilter] = useState<string>('all');
  const [matchedCandidates, setMatchedCandidates] = useState<MatchedCandidate[]>([]);
  const [matchingLoading, setMatchingLoading] = useState(false);

  const steps = [
    { id: 'basic', title: 'Basic Information', icon: Briefcase },
    { id: 'description', title: 'Job Description', icon: Target },
    { id: 'requirements', title: 'Requirements', icon: CheckCircle },
    { id: 'responsibilities', title: 'Responsibilities', icon: Award },
    { id: 'benefits', title: 'Benefits', icon: Sparkles },
    { id: 'compensation', title: 'Compensation', icon: DollarSign },
    { id: 'review', title: 'Review & Match', icon: Users }
  ];

  // Calculate completion score
  useEffect(() => {
    let score = 0;
    
    // Basic info (25 points)
    if (jdData.basic_info.title) score += 8;
    if (jdData.basic_info.department) score += 5;
    if (jdData.basic_info.emirate && jdData.basic_info.city) score += 12;
    
    // Description (20 points)
    if (jdData.description.length >= 200) score += 20;
    else if (jdData.description.length >= 100) score += 10;
    else if (jdData.description) score += 5;
    
    // Requirements (20 points)
    if (jdData.requirements.length >= 5) score += 20;
    else if (jdData.requirements.length >= 3) score += 15;
    else if (jdData.requirements.length >= 1) score += 10;
    
    // Responsibilities (20 points)
    if (jdData.responsibilities.length >= 5) score += 20;
    else if (jdData.responsibilities.length >= 3) score += 15;
    else if (jdData.responsibilities.length >= 1) score += 10;
    
    // Compensation (10 points)
    if (jdData.compensation.salary_min && jdData.compensation.salary_max) score += 10;
    else if (jdData.compensation.salary_min || jdData.compensation.salary_max) score += 5;
    
    // Benefits (5 points)
    if (jdData.benefits.length >= 3) score += 5;
    else if (jdData.benefits.length >= 1) score += 3;
    
    setCompletionScore(Math.min(score, 100));
  }, [jdData]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerateDescription = async () => {
    setLoading(true);
    try {
      // TODO: Call AI description generation API
      toast({
        title: "AI Generation",
        description: "AI description generation will be available soon",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate description",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    try {
      // Validate completion score
      if (completionScore < 60) {
        toast({
          title: "Incomplete Job Description",
          description: "Please complete at least 60% of the form before publishing",
          variant: "destructive"
        });
        return;
      }

      // TODO: Call API to save/publish JD to database
      // For now, just show success and complete
      toast({
        title: "Success",
        description: "Job description published successfully",
      });

      // Call onComplete callback
      if (onComplete && jdData.jd_id) {
        onComplete(jdData.jd_id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to publish job description",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMatchCandidates = async () => {
    setMatchingLoading(true);
    try {
      // TODO: Call match candidates API
      const response = await fetch(`/api/recruiter/jd/${jdData.jd_id}/match-candidates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employment_status_filter: employmentStatusFilter === 'all' ? null : employmentStatusFilter,
          top_n: 10
        })
      });

      if (!response.ok) {
        throw new Error('Failed to match candidates');
      }

      const result = await response.json();
      setMatchedCandidates(result.top_matches || []);
      
      toast({
        title: "Matching Complete",
        description: `Found ${result.match_count} matching candidates`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to match candidates",
        variant: "destructive"
      });
    } finally {
      setMatchingLoading(false);
    }
  };

  const renderBasicInfo = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Job Title *</Label>
        <Input
          id="title"
          value={jdData.basic_info.title}
          onChange={(e) => setJDData({
            ...jdData,
            basic_info: { ...jdData.basic_info, title: e.target.value }
          })}
          placeholder="e.g., Senior Software Engineer"
        />
      </div>

      <div>
        <Label htmlFor="department">Department *</Label>
        <Input
          id="department"
          value={jdData.basic_info.department}
          onChange={(e) => setJDData({
            ...jdData,
            basic_info: { ...jdData.basic_info, department: e.target.value }
          })}
          placeholder="e.g., Engineering"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="job_type">Job Type *</Label>
          <Select
            value={jdData.basic_info.job_type}
            onValueChange={(value) => setJDData({
              ...jdData,
              basic_info: { ...jdData.basic_info, job_type: value }
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {JOB_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="job_level">Job Level *</Label>
          <Select
            value={jdData.basic_info.job_level}
            onValueChange={(value) => setJDData({
              ...jdData,
              basic_info: { ...jdData.basic_info, job_level: value }
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {JOB_LEVELS.map(level => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="emirate">Emirate *</Label>
          <Select
            value={jdData.basic_info.emirate}
            onValueChange={(value) => setJDData({
              ...jdData,
              basic_info: { ...jdData.basic_info, emirate: value }
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select emirate" />
            </SelectTrigger>
            <SelectContent>
              {UAE_EMIRATES.map(emirate => (
                <SelectItem key={emirate} value={emirate}>
                  {emirate}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={jdData.basic_info.city}
            onChange={(e) => setJDData({
              ...jdData,
              basic_info: { ...jdData.basic_info, city: e.target.value }
            })}
            placeholder="Enter city"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="remote_option"
          checked={jdData.basic_info.remote_option}
          onCheckedChange={(checked) => setJDData({
            ...jdData,
            basic_info: { ...jdData.basic_info, remote_option: checked as boolean }
          })}
        />
        <Label htmlFor="remote_option">Remote work option available</Label>
      </div>
    </div>
  );

  const renderDescription = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label htmlFor="description">Job Description *</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateDescription}
          disabled={loading}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Generate with AI
        </Button>
      </div>
      <Textarea
        id="description"
        value={jdData.description}
        onChange={(e) => setJDData({
          ...jdData,
          description: e.target.value
        })}
        placeholder="Describe the role, responsibilities, and what makes this opportunity unique..."
        rows={10}
      />
      <div className="text-sm text-muted-foreground">
        {jdData.description.length} characters (recommended: 200+)
      </div>
    </div>
  );

  const renderRequirements = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label>Job Requirements</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setJDData({
              ...jdData,
              requirements: [...jdData.requirements, {
                category: 'skills',
                description: '',
                is_required: true
              }]
            });
          }}
        >
          Add Requirement
        </Button>
      </div>

      {jdData.requirements.length === 0 && (
        <Alert>
          <AlertDescription>
            No requirements added yet. Click "Add Requirement" to add job requirements.
          </AlertDescription>
        </Alert>
      )}

      {jdData.requirements.map((req, index) => (
        <Card key={index}>
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 gap-4">
              <Select
                value={req.category}
                onValueChange={(value) => {
                  const newReqs = [...jdData.requirements];
                  newReqs[index].category = value;
                  setJDData({ ...jdData, requirements: newReqs });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REQUIREMENT_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="col-span-2">
                <Input
                  value={req.description}
                  onChange={(e) => {
                    const newReqs = [...jdData.requirements];
                    newReqs[index].description = e.target.value;
                    setJDData({ ...jdData, requirements: newReqs });
                  }}
                  placeholder="Describe the requirement..."
                />
              </div>
            </div>

            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={req.is_required}
                  onCheckedChange={(checked) => {
                    const newReqs = [...jdData.requirements];
                    newReqs[index].is_required = checked as boolean;
                    setJDData({ ...jdData, requirements: newReqs });
                  }}
                />
                <Label className="text-sm">Required</Label>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newReqs = jdData.requirements.filter((_, i) => i !== index);
                  setJDData({ ...jdData, requirements: newReqs });
                }}
              >
                Remove
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {jdData.requirements.length === 0 && (
        <Alert>
          <AlertDescription>
            No requirements added yet. Click "Add Requirement" to start.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderResponsibilities = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label>Job Responsibilities</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setJDData({
              ...jdData,
              responsibilities: [...jdData.responsibilities, {
                description: '',
                category: 'core'
              }]
            });
          }}
        >
          Add Responsibility
        </Button>
      </div>

      {jdData.responsibilities.map((resp, index) => (
        <Card key={index}>
          <CardContent className="pt-4">
            <div className="space-y-2">
              <Textarea
                value={resp.description}
                onChange={(e) => {
                  const newResps = [...jdData.responsibilities];
                  newResps[index].description = e.target.value;
                  setJDData({ ...jdData, responsibilities: newResps });
                }}
                placeholder="Describe the responsibility..."
                rows={2}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newResps = jdData.responsibilities.filter((_, i) => i !== index);
                  setJDData({ ...jdData, responsibilities: newResps });
                }}
              >
                Remove
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {jdData.responsibilities.length === 0 && (
        <Alert>
          <AlertDescription>
            No responsibilities added yet. Click "Add Responsibility" to start.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderBenefits = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label>Employee Benefits</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setJDData({
              ...jdData,
              benefits: [...jdData.benefits, {
                category: 'compensation',
                description: ''
              }]
            });
          }}
        >
          Add Benefit
        </Button>
      </div>

      {jdData.benefits.map((benefit, index) => (
        <Card key={index}>
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 gap-4">
              <Select
                value={benefit.category}
                onValueChange={(value) => {
                  const newBenefits = [...jdData.benefits];
                  newBenefits[index].category = value;
                  setJDData({ ...jdData, benefits: newBenefits });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BENEFIT_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="col-span-2">
                <Input
                  value={benefit.description}
                  onChange={(e) => {
                    const newBenefits = [...jdData.benefits];
                    newBenefits[index].description = e.target.value;
                    setJDData({ ...jdData, benefits: newBenefits });
                  }}
                  placeholder="Describe the benefit..."
                />
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => {
                const newBenefits = jdData.benefits.filter((_, i) => i !== index);
                setJDData({ ...jdData, benefits: newBenefits });
              }}
            >
              Remove
            </Button>
          </CardContent>
        </Card>
      ))}

      {jdData.benefits.length === 0 && (
        <Alert>
          <AlertDescription>
            No benefits added yet. Click "Add Benefit" to start.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderCompensation = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="salary_min">Minimum Salary (AED)</Label>
          <Input
            id="salary_min"
            type="number"
            value={jdData.compensation.salary_min || ''}
            onChange={(e) => setJDData({
              ...jdData,
              compensation: { ...jdData.compensation, salary_min: parseFloat(e.target.value) }
            })}
            placeholder="e.g., 10000"
          />
        </div>

        <div>
          <Label htmlFor="salary_max">Maximum Salary (AED)</Label>
          <Input
            id="salary_max"
            type="number"
            value={jdData.compensation.salary_max || ''}
            onChange={(e) => setJDData({
              ...jdData,
              compensation: { ...jdData.compensation, salary_max: parseFloat(e.target.value) }
            })}
            placeholder="e.g., 15000"
          />
        </div>
      </div>

      <Alert>
        <AlertDescription>
          Providing a salary range helps attract qualified candidates and sets clear expectations.
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderReview = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Job Description Summary</span>
            <Badge variant={completionScore >= 80 ? "default" : "secondary"}>
              {completionScore}% Complete
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold">{jdData.basic_info.title}</h4>
            <p className="text-sm text-muted-foreground">
              {jdData.basic_info.department} • {jdData.basic_info.emirate}, {jdData.basic_info.city}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Requirements:</span>
              <span className="ml-2 font-semibold">{jdData.requirements.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Responsibilities:</span>
              <span className="ml-2 font-semibold">{jdData.responsibilities.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Benefits:</span>
              <span className="ml-2 font-semibold">{jdData.benefits.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            AI Candidate Matching
          </CardTitle>
          <CardDescription>
            Find the top 10 candidates matching this job description before publishing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Filter by Employment Status</Label>
            <Select value={employmentStatusFilter} onValueChange={setEmploymentStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Candidates</SelectItem>
                <SelectItem value="job_seeker">Job Seekers Only</SelectItem>
                <SelectItem value="employed">Currently Employed</SelectItem>
                <SelectItem value="open_to_opportunities">Open to Opportunities</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => {
              handleMatchCandidates();
              setShowMatchingDialog(true);
            }}
            disabled={matchingLoading || completionScore < 60}
            className="w-full"
          >
            <Filter className="h-4 w-4 mr-2" />
            {matchingLoading ? 'Matching...' : 'Find Top 10 Candidates'}
          </Button>

          {completionScore < 60 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Complete at least 60% of the job description to enable candidate matching.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span className="font-semibold">{completionScore}%</span>
            </div>
            <Progress value={completionScore} />
          </div>
        </CardContent>
      </Card>

      {/* Steps Navigation */}
      <div className="flex justify-between items-center">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className={`flex flex-col items-center cursor-pointer ${
                index === currentStep ? 'text-primary' : 'text-muted-foreground'
              }`}
              onClick={() => setCurrentStep(index)}
            >
              <div className={`rounded-full p-2 ${
                index === currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-xs mt-1 hidden md:block">{step.title}</span>
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
          <CardDescription>
            Step {currentStep + 1} of {steps.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 0 && renderBasicInfo()}
          {currentStep === 1 && renderDescription()}
          {currentStep === 2 && renderRequirements()}
          {currentStep === 3 && renderResponsibilities()}
          {currentStep === 4 && renderBenefits()}
          {currentStep === 5 && renderCompensation()}
          {currentStep === 6 && renderReview()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          
          {currentStep === steps.length - 1 ? (
            <Button onClick={handlePublish} disabled={loading}>
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Publishing...' : 'Publish Job'}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Candidate Matching Dialog */}
      <Dialog open={showMatchingDialog} onOpenChange={setShowMatchingDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Top 10 Matched Candidates</DialogTitle>
            <DialogDescription>
              AI-matched candidates based on your job description
              {employmentStatusFilter !== 'all' && ` (${employmentStatusFilter})`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {matchedCandidates.map((match, index) => (
              <Card key={index}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">
                        {match.candidate.first_name} {match.candidate.last_name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {match.candidate.current_position || 'Position not specified'}
                      </p>
                    </div>
                    <Badge variant={match.match_score >= 80 ? "default" : "secondary"}>
                      {match.match_score.toFixed(0)}% Match
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-2">
                    {match.strengths.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-green-600">Strengths:</span>
                        <ul className="text-sm list-disc list-inside">
                          {match.strengths.map((strength, i) => (
                            <li key={i}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {match.matching_skills.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Matching Skills:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {match.matching_skills.slice(0, 5).map((skill, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline">
                      View Profile
                    </Button>
                    <Button size="sm">
                      Shortlist
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {matchedCandidates.length === 0 && !matchingLoading && (
              <Alert>
                <AlertDescription>
                  No matching candidates found. Try adjusting your employment status filter.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMatchingDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobDescriptionWizard;

