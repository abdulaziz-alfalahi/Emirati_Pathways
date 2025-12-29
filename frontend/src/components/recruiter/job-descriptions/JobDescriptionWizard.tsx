import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import toast from 'react-hot-toast';
import { restClient } from '@/utils/api';
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
import { JobPostStrengthMeter } from '@/components/recruiter/job-wizard/JobPostStrengthMeter';
import { Wand2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// Smart Defaults Dictionary
const SMART_DEFAULTS: Record<string, any> = {
  'python': {
    description: 'We are looking for an experienced Python Developer to join our backend team. You will be responsible for building scalable APIs and optimizing database queries.',
    requirements: [
      { category: 'skills', description: 'Python', is_required: true },
      { category: 'skills', description: 'Django/Flask', is_required: true },
      { category: 'skills', description: 'SQL', is_required: true },
      { category: 'experience', description: '3+ years of backend development', is_required: true }
    ],
    responsibilities: [
      { category: 'core', description: 'Design and implement RESTful APIs' },
      { category: 'core', description: 'Optimize database performance' },
      { category: 'core', description: 'Collaborate with frontend team' }
    ],
    benefits: [
      { category: 'compensation', description: 'Competitive Salary' },
      { category: 'health', description: 'Health Insurance' },
      { category: 'time_off', description: 'Remote Work Options' }
    ]
  },
  'manager': {
    description: 'Seeking a Project Manager to lead our development teams. You will oversee project timelines, resource allocation, and stakeholder communication.',
    requirements: [
      { category: 'skills', description: 'Project Management', is_required: true },
      { category: 'skills', description: 'Agile/Scrum', is_required: true },
      { category: 'skills', description: 'Leadership', is_required: true }
    ],
    responsibilities: [
      { category: 'core', description: 'Manage project lifecycles' },
      { category: 'core', description: 'Coordinate cross-functional teams' },
      { category: 'core', description: 'Report on project status' }
    ],
    benefits: [
      { category: 'compensation', description: 'Leadership Bonus' },
      { category: 'perks', description: 'Stock Options' }
    ]
  },
  'marketing': {
    description: 'Join our marketing team to drive brand awareness and lead generation. You will manage campaigns across multiple channels.',
    requirements: [
      { category: 'skills', description: 'SEO', is_required: true },
      { category: 'skills', description: 'Content Marketing', is_required: true },
      { category: 'skills', description: 'Google Analytics', is_required: true }
    ],
    responsibilities: [
      { category: 'core', description: 'Execute marketing campaigns' },
      { category: 'core', description: 'Analyze performance metrics' },
      { category: 'core', description: 'Manage social media accounts' }
    ],
    benefits: [
      { category: 'compensation', description: 'Performance Bonuses' },
      { category: 'time_off', description: 'Flexible Hours' }
    ]
  }
};

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
  recruiterId?: string;
  companyId?: string;
  initialData?: any;
  initialJdId?: string;
  onComplete?: (jdIdOrData: string | any) => void;
  onCancel?: () => void;
  onSave?: () => Promise<void>;
  mode?: 'authenticated' | 'public';
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
  metadata?: any;
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
  onCancel,
  onSave,
  mode = 'authenticated'
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [completionScore, setCompletionScore] = useState(0);

  // Helper to normalize generic list data
  const normalizeList = (data: any) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') {
      // Try to string split if it looks like a pipe-separated list (common in this app)
      if (data.includes('|')) return data.split('|').filter(Boolean);
      return [data];
    }
    return [];
  };

  // Helper to normalize requirements data
  const normalizeRequirements = (reqs: any) => {
    if (!reqs) return [];
    if (Array.isArray(reqs)) return reqs;
    if (typeof reqs === 'string') return []; // Invalid for requirements array

    // Convert object format to array
    if (typeof reqs === 'object') {
      const normalized: any[] = [];
      const r = reqs as any;
      if (r.skills && Array.isArray(r.skills)) {
        r.skills.forEach((skill: string) => {
          normalized.push({ category: 'skills', description: skill, is_required: true });
        });
      }
      if (r.min_experience) {
        normalized.push({ category: 'experience', description: `Minimum ${r.min_experience} years of experience`, is_required: true });
      }
      if (r.education_level) {
        normalized.push({ category: 'education', description: r.education_level, is_required: true });
      }
      if (normalized.length > 0) return normalized;
    }
    return [];
  };

  const [jdData, setJDData] = useState<JDData>(() => {
    if (initialData) {
      console.log('Loading initial data:', initialData);
      console.log('Requirements from initial data:', initialData.requirements);
      return {
        jd_id: initialJdId || initialData.metadata?.jd_id || initialData.jd_id,
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
        requirements: normalizeRequirements(initialData.requirements),
        responsibilities: normalizeList(initialData.responsibilities),
        benefits: normalizeList(initialData.benefits),
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

  // Update state when initialData changes (e.g. after async load)
  useEffect(() => {
    if (initialData) {
      console.log('Updating with loaded data:', initialData);

      setJDData(prev => ({
        ...prev,
        jd_id: initialJdId || initialData.metadata?.jd_id || initialData.jd_id,
        basic_info: initialData.basic_info || prev.basic_info,
        description: initialData.description || prev.description,
        description_arabic: initialData.description_arabic || prev.description_arabic,
        requirements: normalizeRequirements(initialData.requirements),
        responsibilities: normalizeList(initialData.responsibilities),
        benefits: normalizeList(initialData.benefits),
        compensation: initialData.compensation || prev.compensation
      }));
    }
  }, [initialData, initialJdId]);


  const [searchParams] = useSearchParams();
  const urlJdId = searchParams.get('jd_id');

  // Initialize JD ID on mount
  useEffect(() => {
    const initializeJD = async () => {
      // In public mode, we just rely on initialData and don't fetch/create JDs via API
      if (mode === 'public') {
        if (initialData) {
          setJDData(prev => ({
            ...prev,
            ...initialData
          }));
        }
        return;
      }

      // Determine effective JD ID (Prop > URL > State)
      const effectiveId = initialJdId || urlJdId || jdData.jd_id;

      if (effectiveId) {
        // If we have an ID but no data (and it's different from current), fetch it
        if (!jdData.jd_id || jdData.jd_id !== effectiveId) {
          setLoading(true);
          try {
            const response = await restClient.get(`/api/recruiter/jd/${effectiveId}`);
            if (response.data && response.data.success && response.data.jd) {
              const fetchedData = response.data.jd;
              console.log('Fetched JD Data:', fetchedData);
              setJDData({
                jd_id: effectiveId,
                basic_info: fetchedData.basic_info || {
                  title: '',
                  department: '',
                  job_type: 'full_time',
                  job_level: 'mid',
                  emirate: '',
                  city: '',
                  remote_option: false
                },
                description: fetchedData.description || '',
                description_arabic: fetchedData.description_arabic || '',
                requirements: fetchedData.requirements || [],
                responsibilities: fetchedData.responsibilities || [],
                benefits: fetchedData.benefits || [],
                compensation: fetchedData.compensation || { salary_currency: 'AED' },
                metadata: fetchedData.metadata
              });
            }
          } catch (error) {
            console.error("Failed to load JD:", error);
            toast.error("Failed to load job description");
          } finally {
            setLoading(false);
          }
        }
        return;
      }

      // If no ID found anywhere, Create a new JD
      if (!initialData && !urlJdId) {
        try {
          const response = await restClient.post('/api/recruiter/jd/create', {
            recruiter_id: recruiterId,
            company_id: companyId,
            template: 'standard'
          });

          if (response.data && response.data.success && response.data.jd_id) {
            setJDData(prev => ({
              ...prev,
              jd_id: response.data.jd_id
            }));
          }
        } catch (error) {
          console.error('Failed to create JD:', error);
        }
      }
    };

    initializeJD();
  }, [recruiterId, companyId, initialJdId, initialData, urlJdId]);

  const steps = [
    { id: 'basic', title: 'Basic Information', icon: Briefcase },
    { id: 'description', title: 'Job Description', icon: Target },
    { id: 'requirements', title: 'Requirements', icon: CheckCircle },
    { id: 'responsibilities', title: 'Responsibilities', icon: Award },
    { id: 'benefits', title: 'Benefits', icon: Sparkles },
    { id: 'compensation', title: 'Compensation', icon: DollarSign },
    ...(mode === 'authenticated' ? [{ id: 'review', title: 'Review & Match', icon: Users }] : [])
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
    if (!jdData.basic_info.title) {
      toast.error("Please enter a job title first");
      return;
    }

    if (mode === 'public') {
      handleAIGenerate('description');
      return;
    }

    setLoading(true);
    try {
      // Ensure basic info is saved so JD exists in backend
      if (jdData.jd_id) {
        try {
          await restClient.put(`/api/recruiter/jd/${jdData.jd_id}/basic-info`, {
            basic_info: jdData.basic_info,
            recruiter_id: recruiterId || user?.id || 'unknown',
            company_id: companyId || (user as any)?.company_id || 'unknown'
          });
        } catch (saveError) {
          console.warn("Auto-save prior to generation failed", saveError);
        }
      }

      const response = await restClient.post(`/api/recruiter/jd/${jdData.jd_id}/generate-description`, {
        industry: 'General' // Could be made dynamic
      });

      if (response.data && response.data.success && (response.data.generated_description || response.data.description)) {
        setJDData(prev => ({
          ...prev,
          description: response.data.generated_description || response.data.description
        }));
        toast.success("Job description generated successfully");
      } else {
        throw new Error('Failed to generate description');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error("Failed to generate description. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!jdData.jd_id) {
      toast.error("JD ID is missing. Please refresh the page and try again.");
      return;
    }

    setLoading(true);
    try {
      // Prepare JD data with metadata
      const jdDataToSave = {
        ...jdData,
        metadata: {
          ...jdData.metadata,
          jd_id: jdData.jd_id,
          recruiter_id: recruiterId,
          company_id: companyId,
          status: 'draft',
          completion_score: completionScore,
          current_step: steps[currentStep].id,
          last_modified: new Date().toISOString()
        }
      };

      console.log('Saving draft with JD ID:', jdData.jd_id);

      // Save JD to database with draft status using restClient
      const response = await restClient.post(`/api/recruiter/jd/${jdData.jd_id}/save`, {
        jd_data: jdDataToSave,
        status: 'draft',
        recruiter_id: recruiterId,
        company_id: companyId
      });

      console.log('Save draft response:', response);

      const result = response.data;
      console.log('Save draft result:', result);

      // Show success toast
      toast.success(result.message || (result.success ? "Job description saved as draft successfully" : "Saved"));

      // Don't navigate away - allow user to continue editing
    } catch (error: any) {
      console.error('Save draft error:', error);
      const message = error.response?.data?.error || error.message || "Failed to save draft. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (mode === 'public') {
      // In public mode, we just pass the data back to the parent
      if (onComplete) {
        onComplete(jdData);
      }
      return;
    }

    setLoading(true);
    try {
      // Validate completion score
      if (completionScore < 60) {
        toast.error("Please complete at least 60% of the form before publishing");
        return;
      }

      // Save JD to database with published status using restClient
      const response = await restClient.post(`/api/recruiter/jd/${jdData.jd_id}/save`, {
        jd_data: jdData,
        status: 'published',
        recruiter_id: recruiterId,
        company_id: companyId
      });

      const result = response.data;

      toast.success("Job description published successfully");

      // Call onComplete callback
      if (onComplete && jdData.jd_id) {
        onComplete(jdData.jd_id);
      }
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || "Failed to publish job description";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleShortlistCandidate = async (candidateId: string, matchScore: number, matchDetails: any) => {
    try {
      const response = await restClient.post(`/api/recruiter/shortlist/add`, {
        jd_id: jdData.jd_id,
        candidate_id: candidateId,
        recruiter_id: recruiterId,
        match_score: matchScore,
        match_details: matchDetails,
        notes: `Auto-shortlisted from AI matching (${matchScore.toFixed(1)}% match)`
      });

      const result = response.data;

      if (result.success) {
        toast.success("Candidate added to shortlist");
      } else {
        toast(result.message || "Candidate already shortlisted");
      }
    } catch (error) {
      toast.error("Failed to add candidate to shortlist");
    }
  };

  const handleMatchCandidates = async () => {
    setMatchingLoading(true);
    try {
      // Call match candidates API
      const response = await restClient.post(`/api/recruiter/jd/${jdData.jd_id}/match-candidates`, {
        employment_status_filter: employmentStatusFilter === 'all' ? null : employmentStatusFilter,
        top_n: 10
      });

      const result = response.data;
      setMatchedCandidates(result.top_matches || []);

      toast.success(`Found ${result.match_count} matching candidates`);
    } catch (error) {
      toast.error("Failed to match candidates");
    } finally {
      setMatchingLoading(false);
    }
  };

  // --- Smart Features ---

  const handleSmartFill = () => {
    if (!jdData.basic_info.title) {
      toast.error('Enter a job title first');
      return;
    }
    const lowerTitle = jdData.basic_info.title.toLowerCase();
    let match = null;

    for (const key in SMART_DEFAULTS) {
      if (lowerTitle.includes(key)) {
        match = SMART_DEFAULTS[key];
        break;
      }
    }

    if (match) {
      setJDData(prev => ({
        ...prev,
        description: match.description,
        requirements: match.requirements,
        responsibilities: match.responsibilities,
        benefits: match.benefits
      }));
      toast.success('Smart Fill Applied: Fields populated based on job title.');
    } else {
      toast.error('No match found. Try "Python", "Manager", or "Marketing".');
    }
  };

  const handleAIGenerate = (field: 'description' | 'responsibilities' | 'benefits' | 'requirements') => {
    if (!jdData.basic_info.title) {
      toast.error('Enter a job title first');
      return;
    }

    // Simulate AI generation
    toast.loading('AI is generating content...', { duration: 1000 });

    setTimeout(() => {
      if (field === 'description') {
        setJDData(prev => ({
          ...prev,
          description: (prev.description || '') + (prev.description ? '\n\n' : '') + `[AI Generated] We are seeking a talented ${jdData.basic_info.title} to join our dynamic team. In this role, you will leverage your expertise to drive innovation and success.`
        }));
      } else if (field === 'responsibilities') {
        setJDData(prev => ({
          ...prev,
          responsibilities: [
            ...(Array.isArray(prev.responsibilities) ? prev.responsibilities : []),
            { category: 'core', description: `[AI] Lead key initiatives for ${jdData.basic_info.title}` },
            { category: 'core', description: `[AI] Collaborate with cross-functional teams` },
            { category: 'core', description: `[AI] Ensure high-quality deliverables` }
          ]
        }));
      } else if (field === 'benefits') {
        setJDData(prev => ({
          ...prev,
          benefits: [
            ...(Array.isArray(prev.benefits) ? prev.benefits : []),
            { category: 'compensation', description: `[AI] Competitive compensation package` },
            { category: 'development', description: `[AI] Professional growth opportunities` },
            { category: 'perks', description: `[AI] Modern work environment` }
          ]
        }));
      } else if (field === 'requirements') {
        setJDData(prev => ({
          ...prev,
          requirements: [
            ...(Array.isArray(prev.requirements) ? prev.requirements : []),
            { category: 'skills', description: `[AI] Relevant degree or equivalent experience`, is_required: true },
            { category: 'skills', description: `[AI] Strong communication skills`, is_required: true }
          ]
        }));
      }
      toast.dismiss();
      toast.success('Content Generated');
    }, 1000);
  };

  const renderBasicInfo = () => (
    <div className="space-y-4">
      <div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
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
          <Button
            variant="secondary"
            onClick={handleSmartFill}
            className="mb-0.5 bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200"
            title="Auto-fill fields based on title"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Smart Fill
          </Button>
        </div>
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
              requirements: [...(Array.isArray(jdData.requirements) ? jdData.requirements : []), {
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

      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAIGenerate('requirements')}
          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 h-6 text-xs"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          AI Generate Requirements
        </Button>
      </div>

      {(!Array.isArray(jdData.requirements) || jdData.requirements.length === 0) && (
        <Alert>
          <AlertDescription>
            No requirements added yet. Click "Add Requirement" to add job requirements.
          </AlertDescription>
        </Alert>
      )}

      {Array.isArray(jdData.requirements) && jdData.requirements.map((req, index) => (
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
              responsibilities: [...(Array.isArray(jdData.responsibilities) ? jdData.responsibilities : []), {
                description: '',
                category: 'core'
              }]
            });
          }}
        >
          Add Responsibility
        </Button>
      </div>

      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAIGenerate('responsibilities')}
          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 h-6 text-xs"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          AI Generate Responsibilities
        </Button>
      </div>

      {Array.isArray(jdData.responsibilities) && jdData.responsibilities.map((resp, index) => (
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

      {(!Array.isArray(jdData.responsibilities) || jdData.responsibilities.length === 0) && (
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
              benefits: [...(Array.isArray(jdData.benefits) ? jdData.benefits : []), {
                category: 'compensation',
                description: ''
              }]
            });
          }}
        >
          Add Benefit
        </Button>
      </div>

      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAIGenerate('benefits')}
          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 h-6 text-xs"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          AI Generate Benefits
        </Button>
      </div>

      {Array.isArray(jdData.benefits) && jdData.benefits.map((benefit, index) => (
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

      {(!Array.isArray(jdData.benefits) || jdData.benefits.length === 0) && (
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
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
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
                className={`flex flex-col items-center cursor-pointer ${index === currentStep ? 'text-primary' : 'text-muted-foreground'
                  }`}
                onClick={() => setCurrentStep(index)}
              >
                <div className={`rounded-full p-2 ${index === currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted'
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
              <>
                <Button variant="outline" onClick={handleSaveDraft} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save as Draft'}
                </Button>
                <Button onClick={handlePublish} disabled={loading || completionScore < 60}>
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? 'Publishing...' : 'Publish Job'}
                </Button>
              </>
            ) : (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar for Strength Meter */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 space-y-6">
          <JobPostStrengthMeter
            title={jdData.basic_info.title}
            description={jdData.description}
            skills={Array.isArray(jdData.requirements) ? jdData.requirements.filter(r => r.category === 'skills').map(r => r.description).join(', ') : ''}
            salaryMin={jdData.compensation.salary_min || 0}
            salaryMax={jdData.compensation.salary_max || 0}
            location={jdData.basic_info.city || ''}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• Use clear, standard job titles.</p>
              <p>• Be specific about required skills.</p>
              <p>• Include a salary range to attract more candidates.</p>
            </CardContent>
          </Card>
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
                    <Button
                      size="sm"
                      onClick={() => handleShortlistCandidate(
                        match.candidate.candidate_id,
                        match.match_score,
                        match.score_breakdown
                      )}
                    >
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

