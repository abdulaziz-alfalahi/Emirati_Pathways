import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  Languages,
  Edit,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Target,
  Sparkles,
  FileText,
  Building2,
  Calendar,
  ExternalLink,
  Lightbulb,
  Zap,
  Globe,
  Leaf,
  Heart,
  Plane,
  Code,
  BarChart3,
  Shield,
  ArrowRight,
  Star,
  Info,
  Settings
} from 'lucide-react';
import { restClient } from '@/utils/api';
import { cvStorageService } from '@/services/cvStorageService';

/**
 * @fileoverview CVProfile Component - Unified CV-as-Profile view for candidates
 * 
 * This component displays the candidate's CV data as their profile, eliminating
 * the need for separate profile and CV management. It includes:
 * - Profile summary from CV data
 * - ATS (Applicant Tracking System) score calculation
 * - Recommendations aligned with Dubai's D33 Economic Agenda and Talent33 initiative
 * 
 * @module CVProfile
 */

/**
 * CV Data structure matching the CV Builder format
 */
interface CVData {
  id?: string;
  personalInfo?: {
    fullName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    location?: string;
    nationality?: string;
    linkedIn?: string;
    portfolio?: string;
    summary?: string;
    emiratesId?: string;
  };
  experience?: Array<{
    id?: string;
    jobTitle?: string;
    company?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    isCurrentJob?: boolean;
    description?: string;
    achievements?: string[];
  }>;
  education?: Array<{
    id?: string;
    degree?: string;
    institution?: string;
    fieldOfStudy?: string;
    graduationYear?: string;
    gpa?: string;
  }>;
  skills?: Array<{
    id?: string;
    name?: string;
    category?: string;
    level?: string;
  }> | string[];
  languages?: Array<{
    id?: string;
    language?: string;
    proficiency?: string;
  }> | string[];
  certifications?: Array<{
    id?: string;
    name?: string;
    issuer?: string;
    date?: string;
    expiryDate?: string;
    credentialId?: string;
  }> | string[];
}

/**
 * ATS Score breakdown structure
 */
interface ATSScore {
  overall: number;
  breakdown: {
    personalInfo: number;
    experience: number;
    education: number;
    skills: number;
    keywords: number;
  };
  recommendations: string[];
}

/**
 * D33 and Talent33 aligned skill recommendation
 */
interface SkillRecommendation {
  skill: string;
  category: string;
  relevance: 'high' | 'medium' | 'low';
  description: string;
  icon: React.ReactNode;
  d33Sector?: string;
}

/**
 * D33 Priority Sectors and associated skills
 * Based on Dubai Economic Agenda D33 (2023-2033)
 */
const D33_SECTORS = {
  technology: {
    name: 'Technology & Digital Economy',
    icon: <Code className="h-4 w-4" />,
    skills: ['AI/Machine Learning', 'Cloud Computing', 'Cybersecurity', 'Data Science', 'Blockchain', 'IoT', 'Software Development', 'DevOps', 'Full Stack Development', 'Mobile Development'],
    description: 'Core to D33\'s vision of making Dubai a global tech hub'
  },
  sustainability: {
    name: 'Green & Sustainable Economy',
    icon: <Leaf className="h-4 w-4" />,
    skills: ['Sustainability Management', 'Renewable Energy', 'ESG Reporting', 'Carbon Management', 'Green Building', 'Circular Economy', 'Environmental Compliance', 'Clean Technology'],
    description: 'Aligned with Dubai Green Manufacturing Plan under D33'
  },
  finance: {
    name: 'Financial Services & Fintech',
    icon: <BarChart3 className="h-4 w-4" />,
    skills: ['Financial Analysis', 'Risk Management', 'Fintech', 'Digital Banking', 'Investment Management', 'Regulatory Compliance', 'Islamic Finance', 'Wealth Management'],
    description: 'Supporting Dubai\'s position as a global financial center'
  },
  healthcare: {
    name: 'Healthcare & Life Sciences',
    icon: <Heart className="h-4 w-4" />,
    skills: ['Healthcare Management', 'Clinical Research', 'Medical Technology', 'Public Health', 'Biotechnology', 'Pharmaceutical', 'Digital Health', 'Healthcare Analytics'],
    description: 'Priority sector for Dubai Social Agenda 33'
  },
  tourism: {
    name: 'Tourism & Hospitality',
    icon: <Plane className="h-4 w-4" />,
    skills: ['Hospitality Management', 'Tourism Marketing', 'Event Management', 'Customer Experience', 'Revenue Management', 'Destination Marketing', 'Sustainable Tourism'],
    description: 'Key driver of Dubai\'s economic diversification'
  },
  trade: {
    name: 'Trade & Logistics',
    icon: <Globe className="h-4 w-4" />,
    skills: ['Supply Chain Management', 'Logistics', 'International Trade', 'Customs & Compliance', 'E-commerce', 'Procurement', 'Warehouse Management', 'Trade Finance'],
    description: 'Supporting D33\'s goal to double foreign trade volume'
  }
};

/**
 * Talent33 Priority Skills
 * Based on Dubai's Talent 2033 workforce development initiative
 */
const TALENT33_SKILLS = {
  leadership: ['Strategic Leadership', 'Change Management', 'Team Building', 'Decision Making', 'Executive Communication'],
  digital: ['Digital Transformation', 'Data Analytics', 'Automation', 'Digital Marketing', 'UX/UI Design'],
  future: ['Critical Thinking', 'Problem Solving', 'Adaptability', 'Creativity', 'Emotional Intelligence', 'Cross-cultural Communication'],
  technical: ['Project Management', 'Agile/Scrum', 'Business Analysis', 'Quality Assurance', 'Process Improvement']
};

/**
 * CVProfile Component
 * 
 * Displays candidate's CV data as their unified profile with ATS scoring
 * and recommendations aligned with D33 and Talent33 initiatives.
 * 
 * @example
 * ```tsx
 * <CVProfile />
 * ```
 */
const CVProfile: React.FC = () => {
  const navigate = useNavigate();
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [loading, setLoading] = useState(true);
  const [atsScore, setAtsScore] = useState<ATSScore | null>(null);
  const [skillRecommendations, setSkillRecommendations] = useState<SkillRecommendation[]>([]);
  const [activeRecommendationTab, setActiveRecommendationTab] = useState('all');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    loadCVData();
    loadProfilePhoto();
  }, []);

  const loadProfilePhoto = async () => {
    try {
      const response = await restClient.get('/api/auth/profile');
      if (response.data.success && response.data.data.profile_photo_url) {
        setProfilePhotoUrl(response.data.data.profile_photo_url);
      }
    } catch (err) {
      console.error("Failed to fetch profile photo", err);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) return;

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/profile/candidate/photo', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setProfilePhotoUrl(data.data.photo_url);
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  useEffect(() => {
    if (cvData) {
      calculateATSScore(cvData);
      generateSkillRecommendations(cvData);
    }
  }, [cvData]);

  /**
   * Load CV data from the backend using cvStorageService
   * First checks for lastCvId in localStorage, then tries to list CVs
   */
  const loadCVData = async () => {
    try {
      setLoading(true);

      // Method 1: Try to load using lastCvId from localStorage (set by CV Builder)
      const lastCvId = localStorage.getItem('lastCvId');
      if (lastCvId) {
        const result = await cvStorageService.getCV(lastCvId);
        if (result.success && result.data) {
          // Transform the data to match our CVData interface
          const transformedData = transformCVData(result.data);
          setCvData(transformedData);
          setLoading(false);
          return;
        }
      }

      // Method 2: List all CVs and get the most recent one
      const listResult = await cvStorageService.listCVs();
      if (listResult.success && listResult.data && listResult.data.length > 0) {
        // Sort by updated_at to get the most recent
        const sortedCVs = [...listResult.data].sort((a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        const latestCV = sortedCVs[0];

        // Save the CV ID to localStorage so CVBuilder can pick it up
        if (latestCV.id) {
          localStorage.setItem('lastCvId', latestCV.id);
        }

        // Load the full CV data
        const cvResult = await cvStorageService.getCV(latestCV.id);
        if (cvResult.success && cvResult.data) {
          const transformedData = transformCVData(cvResult.data);
          setCvData(transformedData);
          setLoading(false);
          return;
        }
      }

      // Method 3: Try the generic CV data endpoint
      try {
        const response = await restClient.get('/api/cv/data');
        if (response.data.success && response.data.data) {
          setCvData(response.data.data);
          setLoading(false);
          return;
        }
      } catch (apiError) {
        console.log('Generic CV API not available');
      }

      // No CV found
      setCvData(null);
    } catch (error) {
      console.error('Error loading CV data:', error);
      setCvData(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Transform CV data from storage format to our component's format
   */
  const transformCVData = (data: any): CVData => {
    // Handle both camelCase and snake_case field names
    const personalInfo = data.personalInfo || data.personal_info || {};
    const experience = data.experience || data.work_experience || [];
    const education = data.education || [];
    const skills = data.skills || data.technicalSkills || data.technical_skills || [];
    const softSkills = data.softSkills || data.soft_skills || [];
    const languages = data.languages || [];
    const certifications = data.certifications || [];
    const professionalSummary = data.professionalSummary || data.professional_summary || personalInfo.summary || '';

    // Combine technical and soft skills
    let allSkills: any[] = [];

    if (Array.isArray(skills)) {
      allSkills = skills.map((s: any) => typeof s === 'string' ? { name: s, category: 'technical' } : s);
    }

    if (Array.isArray(softSkills)) {
      allSkills = [...allSkills, ...softSkills.map((s: any) => typeof s === 'string' ? { name: s, category: 'soft' } : s)];
    }

    return {
      id: data.id,
      personalInfo: {
        fullName: personalInfo.fullName || personalInfo.full_name ||
          `${personalInfo.firstName || personalInfo.first_name || ''} ${personalInfo.lastName || personalInfo.last_name || ''}`.trim() || undefined,
        firstName: personalInfo.firstName || personalInfo.first_name,
        lastName: personalInfo.lastName || personalInfo.last_name,
        email: personalInfo.email,
        phone: personalInfo.phone,
        location: personalInfo.location,
        nationality: personalInfo.nationality,
        linkedIn: personalInfo.linkedIn || personalInfo.linkedin,
        portfolio: personalInfo.portfolio || personalInfo.website,
        summary: professionalSummary || personalInfo.summary,
        emiratesId: personalInfo.emiratesId || personalInfo.emirates_id,
      },
      experience: experience.map((exp: any) => ({
        id: exp.id,
        jobTitle: exp.jobTitle || exp.job_title || exp.title,
        company: exp.company,
        location: exp.location,
        startDate: exp.startDate || exp.start_date,
        endDate: exp.endDate || exp.end_date,
        isCurrentJob: exp.isCurrentJob || exp.is_current_job || exp.current,
        description: exp.description || exp.responsibilities,
        achievements: exp.achievements || [],
      })),
      education: education.map((edu: any) => ({
        id: edu.id,
        degree: edu.degree,
        institution: edu.institution || edu.school,
        fieldOfStudy: edu.fieldOfStudy || edu.field_of_study || edu.field,
        graduationYear: edu.graduationYear || edu.graduation_year || edu.year,
        gpa: edu.gpa,
      })),
      skills: allSkills,
      languages: languages.map((lang: any) => ({
        id: lang.id,
        language: lang.language || lang.name,
        proficiency: lang.proficiency || lang.level,
      })),
      certifications: certifications.map((cert: any) => ({
        id: cert.id,
        name: cert.name || cert.title,
        issuer: cert.issuer || cert.organization,
        date: cert.date || cert.issueDate || cert.issue_date,
        expiryDate: cert.expiryDate || cert.expiry_date,
      })),
    };
  };

  /**
   * Calculate ATS (Applicant Tracking System) score based on CV completeness and quality
   */
  const calculateATSScore = (data: CVData) => {
    const breakdown = {
      personalInfo: 0,
      experience: 0,
      education: 0,
      skills: 0,
      keywords: 0
    };
    const recommendations: string[] = [];

    // Personal Info Score (20 points max)
    const personalInfo = data.personalInfo || {};
    const fullName = personalInfo.fullName || `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim();
    if (fullName) breakdown.personalInfo += 4;
    else recommendations.push('Add your full name to your profile');

    if (personalInfo.email) breakdown.personalInfo += 4;
    else recommendations.push('Add your email address for recruiter contact');

    if (personalInfo.phone) breakdown.personalInfo += 3;
    else recommendations.push('Add your phone number');

    if (personalInfo.location) breakdown.personalInfo += 3;
    else recommendations.push('Add your location to improve local job matches');

    if (personalInfo.summary && personalInfo.summary.length > 50) breakdown.personalInfo += 4;
    else recommendations.push('Add a professional summary (at least 50 characters) to stand out');

    if (personalInfo.linkedIn) breakdown.personalInfo += 2;
    else recommendations.push('Add your LinkedIn profile URL');

    // Experience Score (30 points max)
    const experience = data.experience || [];
    if (experience.length > 0) {
      breakdown.experience += 10;

      // Check for detailed descriptions
      const hasDescriptions = experience.some(exp => exp.description && exp.description.length > 100);
      if (hasDescriptions) breakdown.experience += 10;
      else recommendations.push('Add detailed descriptions to your work experience (100+ characters)');

      // Check for achievements
      const hasAchievements = experience.some(exp => exp.achievements && exp.achievements.length > 0);
      if (hasAchievements) breakdown.experience += 10;
      else recommendations.push('Add quantifiable achievements to your experience (e.g., "Increased sales by 25%")');
    } else {
      recommendations.push('Add your work experience to significantly improve your ATS score');
    }

    // Education Score (15 points max)
    const education = data.education || [];
    if (education.length > 0) {
      breakdown.education += 10;

      const hasDetails = education.some(edu => edu.fieldOfStudy || edu.gpa);
      if (hasDetails) breakdown.education += 5;
      else recommendations.push('Add field of study and GPA to your education');
    } else {
      recommendations.push('Add your educational background');
    }

    // Skills Score (20 points max)
    const skills = data.skills || [];
    const skillCount = Array.isArray(skills) ? skills.length : 0;

    if (skillCount >= 10) breakdown.skills = 20;
    else if (skillCount >= 5) breakdown.skills = 15;
    else if (skillCount >= 3) breakdown.skills = 10;
    else if (skillCount > 0) breakdown.skills = 5;

    if (skillCount < 5) {
      recommendations.push('Add more skills (aim for at least 10) to match more job requirements');
    }

    // Keywords Score (15 points max) - Check for D33/Talent33 aligned skills
    let keywordMatches = 0;
    const allD33Skills = Object.values(D33_SECTORS).flatMap(sector => sector.skills);
    const allTalent33Skills = Object.values(TALENT33_SKILLS).flat();
    const prioritySkills = [...new Set([...allD33Skills, ...allTalent33Skills])];

    const userSkillNames = skills.map((s: any) =>
      typeof s === 'string' ? s.toLowerCase() : (s.name || '').toLowerCase()
    );

    prioritySkills.forEach(skill => {
      if (userSkillNames.some(us => us.includes(skill.toLowerCase()) || skill.toLowerCase().includes(us))) {
        keywordMatches++;
      }
    });

    if (keywordMatches >= 5) breakdown.keywords = 15;
    else if (keywordMatches >= 3) breakdown.keywords = 10;
    else if (keywordMatches >= 1) breakdown.keywords = 5;

    if (keywordMatches < 3) {
      recommendations.push('Add skills aligned with D33 priority sectors (Technology, Sustainability, Finance)');
    }

    const overall = breakdown.personalInfo + breakdown.experience + breakdown.education + breakdown.skills + breakdown.keywords;

    setAtsScore({ overall, breakdown, recommendations });
  };

  /**
   * Generate skill recommendations based on D33 and Talent33 initiatives
   */
  const generateSkillRecommendations = (data: CVData) => {
    const recommendations: SkillRecommendation[] = [];

    const userSkills = (data.skills || []).map((s: any) =>
      typeof s === 'string' ? s.toLowerCase() : (s.name || '').toLowerCase()
    );

    // Check each D33 sector
    Object.entries(D33_SECTORS).forEach(([key, sector]) => {
      sector.skills.forEach(skill => {
        const hasSkill = userSkills.some(us =>
          us.includes(skill.toLowerCase()) || skill.toLowerCase().includes(us)
        );

        if (!hasSkill) {
          recommendations.push({
            skill,
            category: 'D33 Priority',
            relevance: key === 'technology' || key === 'sustainability' ? 'high' : 'medium',
            description: sector.description,
            icon: sector.icon,
            d33Sector: sector.name
          });
        }
      });
    });

    // Check Talent33 skills
    Object.entries(TALENT33_SKILLS).forEach(([category, skills]) => {
      skills.forEach(skill => {
        const hasSkill = userSkills.some(us =>
          us.includes(skill.toLowerCase()) || skill.toLowerCase().includes(us)
        );

        if (!hasSkill) {
          recommendations.push({
            skill,
            category: 'Talent33',
            relevance: category === 'digital' || category === 'future' ? 'high' : 'medium',
            description: `Part of Dubai's Talent 2033 ${category} skills initiative`,
            icon: category === 'leadership' ? <Star className="h-4 w-4" /> :
              category === 'digital' ? <Zap className="h-4 w-4" /> :
                category === 'future' ? <Lightbulb className="h-4 w-4" /> :
                  <Shield className="h-4 w-4" />
          });
        }
      });
    });

    // Sort by relevance and limit
    const sorted = recommendations.sort((a, b) => {
      const relevanceOrder = { high: 0, medium: 1, low: 2 };
      return relevanceOrder[a.relevance] - relevanceOrder[b.relevance];
    });

    setSkillRecommendations(sorted.slice(0, 20));
  };

  /**
   * Get color class based on ATS score
   */
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  /**
   * Get progress bar color based on score
   */
  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  /**
   * Format date string
   */
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  /**
   * Get skill name from skill object or string
   */
  const getSkillName = (skill: any): string => {
    if (typeof skill === 'string') return skill;
    return skill.name || skill.skill || '';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!cvData || !cvData.personalInfo) {
    return (
      <Card className="border-teal-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-teal-600" />
            Create Your Professional Profile
          </CardTitle>
          <CardDescription>
            Build your CV to create your professional profile. Your CV serves as your complete profile on the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 border-teal-200 bg-teal-50">
            <Sparkles className="h-4 w-4 text-teal-600" />
            <AlertTitle>One Profile, One CV</AlertTitle>
            <AlertDescription>
              Your CV is your profile. Build it once and use it everywhere - for job applications, recruiter visibility, and AI-powered job matching.
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => navigate('/cv-builder')}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Edit className="h-4 w-4 mr-2" />
            Build Your CV Now
          </Button>
        </CardContent>
      </Card>
    );
  }

  const personalInfo = cvData.personalInfo;
  const fullName = personalInfo.fullName || `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim() || 'Your Name';
  const experience = cvData.experience || [];
  const education = cvData.education || [];
  const skills = cvData.skills || [];
  const languages = cvData.languages || [];
  const certifications = cvData.certifications || [];

  return (
    <div className="space-y-6">
      {/* ATS Score Card */}
      {atsScore && (
        <Card className="border-teal-200 bg-gradient-to-br from-white to-teal-50/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-teal-600" />
                  ATS Compatibility Score
                </CardTitle>
                <CardDescription>
                  How well your profile matches Applicant Tracking System requirements
                </CardDescription>
              </div>
              <div className={`text-4xl font-bold ${getScoreColor(atsScore.overall)}`}>
                {atsScore.overall}%
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Overall Progress */}
              <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full ${getProgressColor(atsScore.overall)} transition-all duration-500`}
                  style={{ width: `${atsScore.overall}%` }}
                />
              </div>

              {/* Score Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                {Object.entries(atsScore.breakdown).map(([key, value]) => {
                  const maxScores: Record<string, number> = {
                    personalInfo: 20,
                    experience: 30,
                    education: 15,
                    skills: 20,
                    keywords: 15
                  };
                  const labels: Record<string, string> = {
                    personalInfo: 'Personal Info',
                    experience: 'Experience',
                    education: 'Education',
                    skills: 'Skills',
                    keywords: 'D33 Keywords'
                  };
                  const percentage = Math.round((value / maxScores[key]) * 100);

                  return (
                    <div key={key} className="text-center p-3 bg-white rounded-lg border">
                      <div className={`text-lg font-semibold ${getScoreColor(percentage)}`}>
                        {value}/{maxScores[key]}
                      </div>
                      <div className="text-xs text-gray-500">{labels[key]}</div>
                    </div>
                  );
                })}
              </div>

              {/* Top Recommendations */}
              {atsScore.recommendations.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    Quick Improvements
                  </h4>
                  <div className="space-y-2">
                    {atsScore.recommendations.slice(0, 3).map((rec, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
                        <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => navigate('/cv-builder')}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Improve Your CV
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Header Card */}
      <Card className="border-teal-200">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="relative group w-20 h-20 rounded-full overflow-hidden border-2 border-teal-100 bg-teal-100 flex items-center justify-center cursor-pointer"
                onClick={() => document.getElementById('cv-profile-photo-upload')?.click()}>
                {profilePhotoUrl ? (
                  <img
                    src={profilePhotoUrl || ''}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-teal-600" />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingPhoto ? (
                    <span className="text-white text-xs">...</span>
                  ) : (
                    <Edit className="h-6 w-6 text-white" />
                  )}
                </div>
                <input
                  type="file"
                  id="cv-profile-photo-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{fullName}</h2>
                {experience[0]?.jobTitle && (
                  <p className="text-lg text-gray-600">{experience[0].jobTitle}</p>
                )}
                {experience[0]?.company && (
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {experience[0].company}
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={() => navigate('/cv-builder')}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit CV Content
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/profile')}
              className="ml-2"
            >
              <Settings className="h-4 w-4 mr-2" />
              Profile Settings
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {personalInfo.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4 text-teal-600" />
                <span>{personalInfo.email}</span>
              </div>
            )}
            {personalInfo.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4 text-teal-600" />
                <span>{personalInfo.phone}</span>
              </div>
            )}
            {personalInfo.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-teal-600" />
                <span>{personalInfo.location}</span>
              </div>
            )}
            {personalInfo.linkedIn && (
              <a
                href={personalInfo.linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-teal-600 hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                <span>LinkedIn Profile</span>
              </a>
            )}
          </div>

          {/* Professional Summary */}
          {personalInfo.summary && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Professional Summary</h3>
              <p className="text-gray-600">{personalInfo.summary}</p>
            </div>
          )}

          <Separator className="my-6" />

          {/* Experience Section */}
          {experience.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-teal-600" />
                Work Experience
              </h3>
              <div className="space-y-4">
                {experience.slice(0, 3).map((exp, index) => (
                  <div key={exp.id || index} className="border-l-2 border-teal-200 pl-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{exp.jobTitle}</h4>
                        <p className="text-sm text-gray-600">{exp.company}</p>
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(exp.startDate)} - {exp.isCurrentJob ? 'Present' : formatDate(exp.endDate)}
                      </div>
                    </div>
                    {exp.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{exp.description}</p>
                    )}
                  </div>
                ))}
                {experience.length > 3 && (
                  <Button variant="link" onClick={() => navigate('/cv-builder')} className="text-teal-600 p-0">
                    View all {experience.length} positions <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Education Section */}
          {education.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-teal-600" />
                Education
              </h3>
              <div className="space-y-3">
                {education.map((edu, index) => (
                  <div key={edu.id || index} className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{edu.degree}</h4>
                      <p className="text-sm text-gray-600">{edu.institution}</p>
                      {edu.fieldOfStudy && (
                        <p className="text-sm text-gray-500">{edu.fieldOfStudy}</p>
                      )}
                    </div>
                    {edu.graduationYear && (
                      <span className="text-sm text-gray-500">{edu.graduationYear}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills Section */}
          {skills.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-teal-600" />
                Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="bg-teal-50 text-teal-700 border-teal-200">
                    {getSkillName(skill)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Languages & Certifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {languages.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Languages className="h-5 w-5 text-teal-600" />
                  Languages
                </h3>
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang, index) => (
                    <Badge key={index} variant="outline">
                      {typeof lang === 'string' ? lang : `${lang.language} (${lang.proficiency})`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {certifications.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Award className="h-5 w-5 text-teal-600" />
                  Certifications
                </h3>
                <div className="space-y-2">
                  {certifications.slice(0, 3).map((cert, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">
                        {typeof cert === 'string' ? cert : cert.name}
                      </span>
                      {typeof cert !== 'string' && cert.issuer && (
                        <span className="text-gray-500"> - {cert.issuer}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* D33 & Talent33 Skill Recommendations */}
      {skillRecommendations.length > 0 && (
        <Card className="border-blue-200 bg-gradient-to-br from-white to-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Skill Recommendations for UAE Job Market
            </CardTitle>
            <CardDescription>
              Aligned with Dubai's D33 Economic Agenda and Talent 2033 initiative
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4 border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle>Why These Skills?</AlertTitle>
              <AlertDescription>
                <strong>D33 Economic Agenda</strong> aims to double Dubai's economy by 2033, focusing on technology, sustainability, and trade.
                <strong> Talent 2033</strong> is developing future-ready workforce skills. Adding these skills can improve your job matches by up to 40%.
              </AlertDescription>
            </Alert>

            <Tabs value={activeRecommendationTab} onValueChange={setActiveRecommendationTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Recommendations</TabsTrigger>
                <TabsTrigger value="d33">D33 Priority</TabsTrigger>
                <TabsTrigger value="talent33">Talent33</TabsTrigger>
                <TabsTrigger value="high">High Impact</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-3">
                {skillRecommendations.slice(0, 10).map((rec, index) => (
                  <SkillRecommendationCard key={index} recommendation={rec} />
                ))}
              </TabsContent>

              <TabsContent value="d33" className="space-y-3">
                {skillRecommendations
                  .filter(r => r.category === 'D33 Priority')
                  .slice(0, 10)
                  .map((rec, index) => (
                    <SkillRecommendationCard key={index} recommendation={rec} />
                  ))}
              </TabsContent>

              <TabsContent value="talent33" className="space-y-3">
                {skillRecommendations
                  .filter(r => r.category === 'Talent33')
                  .slice(0, 10)
                  .map((rec, index) => (
                    <SkillRecommendationCard key={index} recommendation={rec} />
                  ))}
              </TabsContent>

              <TabsContent value="high" className="space-y-3">
                {skillRecommendations
                  .filter(r => r.relevance === 'high')
                  .slice(0, 10)
                  .map((rec, index) => (
                    <SkillRecommendationCard key={index} recommendation={rec} />
                  ))}
              </TabsContent>
            </Tabs>

            <div className="mt-4 pt-4 border-t">
              <Button
                onClick={() => navigate('/cv-builder')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Add Skills to Your CV
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/**
 * Individual skill recommendation card component
 */
const SkillRecommendationCard: React.FC<{ recommendation: SkillRecommendation }> = ({ recommendation }) => {
  const relevanceColors = {
    high: 'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-gray-100 text-gray-700 border-gray-200'
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow">
      <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
        {recommendation.icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{recommendation.skill}</span>
          <Badge variant="outline" className={relevanceColors[recommendation.relevance]}>
            {recommendation.relevance === 'high' ? 'High Impact' :
              recommendation.relevance === 'medium' ? 'Recommended' : 'Nice to Have'}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mt-1">{recommendation.description}</p>
        {recommendation.d33Sector && (
          <p className="text-xs text-blue-600 mt-1">D33 Sector: {recommendation.d33Sector}</p>
        )}
      </div>
    </div>
  );
};

export default CVProfile;
