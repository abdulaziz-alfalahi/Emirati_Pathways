import React, { useState, useEffect } from 'react'; // Force rebuild
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle,
  Filter,
  MessageSquare,
  ThumbsDown,
  ThumbsUp,
  Video,
  Users,
  TrendingUp,
  Award,
  MapPin,
  GraduationCap,
  Briefcase,
  Star,
  Eye,
  Download,
  RefreshCw,
  BookOpen,
  Search
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { jobApi, shortlistApi, restClient, type JobDescription } from '@/utils/api';
import { getDisplayName } from '@/utils/nameUtils';
import { useAuth } from '@/context/AuthContext';
// import { useMockAuth } from '@/context/MockAuthContext';
import TrainingRecommendationsDialog from './TrainingRecommendationsDialog';
import MentorRecommendationsDialog from './MentorRecommendationsDialog';
import { ShortlistManager } from './shortlist/ShortlistManager';

interface MatchingResult {
  candidate_id: string;
  candidate_name: string;
  overall_score: number;
  skills_score: number;
  experience_score: number;
  education_score: number;
  location_score: number;
  language_score: number;
  recommendation: string;
  status?: string;
  match_details: {
    skills: {
      matched: string[];
      missing: string[];
      additional: string[];
    };
    experience: {
      years: number;
      relevant: boolean;
      level: string;
    };
    education: {
      level: string;
      relevant: boolean;
      field: string;
    };
    location: {
      distance: number;
      compatible: boolean;
    };
    languages: {
      matched: string[];
      missing: string[];
    };
  };
  candidate_data: {
    personalInfo: {
      name: string;
      email: string;
      phone: string;
      location: string;
      summary: string;
    };
    experience: Array<{
      title: string;
      company: string;
      duration: string;
      description: string;
    }>;
    education: Array<{
      degree: string;
      institution: string;
      year: string;
    }>;
    skills: {
      technical: string[];
      soft: string[];
    };
    languages: string[];
    certifications: string[];
  };
  is_applicant?: boolean;
  application_date?: string;
  employment_status?: string;
}

interface AnalyticsData {
  total_matches: number;
  average_score: number;
  qualification_rate: number;
  score_distribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  top_skills: Array<{
    skill: string;
    frequency: number;
  }>;
}

const CandidateMatching = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Use AuthContext instead of MockAuth
  const { toast } = useToast();
  const [selectedJob, setSelectedJob] = useState<JobDescription | null>(null);
  const [matchThreshold, setMatchThreshold] = useState(20);
  const [candidates, setCandidates] = useState<MatchingResult[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [sortBy, setSortBy] = useState('score');
  const [filterBy, setFilterBy] = useState('all');
  const [selectedCandidate, setSelectedCandidate] = useState<MatchingResult | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'matching' | 'shortlist'>('matching');
  const [isDownloadingCV, setIsDownloadingCV] = useState(false);

  const handleDownloadCV = async (candidateId: string, candidateName: string) => {
    if (!candidateId) {
      toast({
        title: "Error",
        description: "No candidate ID found",
        variant: "destructive"
      });
      return;
    }

    setIsDownloadingCV(true);
    toast({
      title: "Downloading CV",
      description: "Generating CV PDF, please wait..."
    });

    try {
      const response = await restClient.get(`/api/cv/user/${candidateId}/export/pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cv_${candidateName || candidateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast({
        title: "Success",
        description: "CV downloaded successfully"
      });
    } catch (error) {
      console.error("Failed to download CV:", error);
      toast({
        title: "Error",
        description: "Failed to download CV",
        variant: "destructive"
      });
    } finally {
      setIsDownloadingCV(false);
    }
  };

  // G22/G23: Stealth Headhunter state
  const [includePassiveTalent, setIncludePassiveTalent] = useState(false);
  const [employmentStatusFilter, setEmploymentStatusFilter] = useState('all');
  const [headhuntDialogOpen, setHeadhuntDialogOpen] = useState(false);
  const [headhuntCandidate, setHeadhuntCandidate] = useState<MatchingResult | null>(null);

  // Advanced filter state
  const [filterExperience, setFilterExperience] = useState('any');
  const [filterEducation, setFilterEducation] = useState('any');
  const [filterAvailability, setFilterAvailability] = useState('any');
  const [appliedFilters, setAppliedFilters] = useState({ experience: 'any', education: 'any', availability: 'any' });

  // New state for Training and Mentorship Dialogs
  const [isTrainingDialogOpen, setIsTrainingDialogOpen] = useState(false);
  const [selectedCandidateForTraining, setSelectedCandidateForTraining] = useState<MatchingResult | null>(null);
  const [isMentorshipDialogOpen, setIsMentorshipDialogOpen] = useState(false);
  const [selectedCandidateForMentorship, setSelectedCandidateForMentorship] = useState<MatchingResult | null>(null);

  // Debugging unique IDs
  useEffect(() => {
    if (candidates.length > 0) {
      const ids = candidates.map(c => c.candidate_id);
      const uniqueIds = new Set(ids);
      console.log('Unique IDs:', uniqueIds.size);
    }
  }, [candidates]);

  // Fetch job descriptions from Flask backend
  const { data: jobDescriptions, isLoading: isLoadingJobs } = useQuery({
    queryKey: ['jobDescriptions'],
    queryFn: async () => {
      const response = await jobApi.list();
      if (response.success && response.data) {
        // Handle the nested structure from /api/recruiter/jd/list
        return response.data.job_descriptions || [];
      }
      throw new Error(response.error || 'Failed to fetch job descriptions');
    }
  });

  // Fetch analytics data
  const { data: analytics, refetch: refetchAnalytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      try {
        const response = await restClient.get('/api/recruiter/analytics'); // Assuming this exists or keep failing gracefully
        return response.data?.success ? response.data.data : null;
      } catch (error) {
        return null;
      }
    }
  });

  // Check for stored job from "Find Candidates" navigation
  useEffect(() => {
    const storedJob = localStorage.getItem('selectedJobForMatching');
    const viewMode = localStorage.getItem('candidateViewMode');

    console.log('useEffect - Initializing from storage:', { storedJobPresent: !!storedJob, viewMode });

    if (storedJob) {
      try {
        const job = JSON.parse(storedJob);
        setSelectedJob(job);

        // Set filter based on view mode
        if (viewMode === 'applicants') {
          console.log('Setting filter to APPLICANTS based on storage');
          setFilterBy('applicants');
        } else {
          setFilterBy('all');
        }

        // Auto-trigger search
        handleFindMatches(job);

        // Clear it so it doesn't persist if they navigate away and back manually
        localStorage.removeItem('selectedJobForMatching');
        localStorage.removeItem('candidateViewMode');
      } catch (e) {
        console.error('Failed to parse stored job', e);
      }
    }
  }, []);

  // Find matching candidates
  const handleFindMatches = async (jobOverride?: JobDescription) => {
    const jobToUse = jobOverride || selectedJob;

    console.log('handleFindMatches - jobToUse:', jobToUse);

    if (!jobToUse) {
      toast({
        variant: 'destructive',
        title: 'No Job Selected',
        description: 'Please select a job to find matching candidates.',
      });
      return;
    }

    setIsMatching(true);

    try {
      // Call backend for candidate matching
      // jd_id is either id or jd_id depending on where the job object came from
      const jdId = jobToUse.jd_id || jobToUse.id;
      console.log('handleFindMatches - extracted jdId:', jdId);

      // G22/G23: Pass employment status filter when passive talent is enabled
      const statusFilter = includePassiveTalent ? employmentStatusFilter : null;
      const response = await restClient.post(`/api/recruiter/jd/${jdId}/match-candidates`, {
        employment_status_filter: statusFilter,
        top_n: 20
      });

      if (response.data && response.data.top_matches) {
        // Map response to MatchingResult format
        const matchingCandidates: MatchingResult[] = response.data.top_matches.map((match: any) => ({
          candidate_id: match.candidate.candidate_id || match.candidate.user_id,
          candidate_name: getDisplayName(match.candidate, `Candidate ${match.candidate.candidate_id}`),
          overall_score: Math.round(match.match_score || 0),
          skills_score: Math.round(match.score_breakdown?.skills || 0),
          experience_score: Math.round(match.score_breakdown?.experience || 0),
          education_score: Math.round(match.score_breakdown?.education || 0),
          location_score: Math.round(match.score_breakdown?.location || 0),
          language_score: 0, // Not currently in breakdown
          recommendation: (match.match_score || 0) >= 80 ? 'Highly Recommended' : (match.match_score || 0) >= 60 ? 'Recommended' : (match.match_score || 0) >= 40 ? 'Good Fit' : (match.match_score || 0) >= 25 ? 'Weak Match' : 'Poor Match',
          match_details: {
            skills: {
              matched: match.matching_skills || [],
              missing: match.missing_skills || [],
              additional: []
            },
            experience: {
              years: match.candidate.experience_years || 0,
              relevant: true,
              level: match.candidate.job_level || 'Mid'
            },
            education: {
              level: match.candidate.education_level || 'Bachelor',
              relevant: true,
              field: match.candidate.education_field || 'Computer Science'
            },
            location: {
              distance: 0,
              compatible: true
            },
            languages: {
              matched: ['English', 'Arabic'],
              missing: []
            }
          },
          candidate_data: {
            personalInfo: {
              name: getDisplayName(match.candidate, `Candidate ${match.candidate.candidate_id}`),
              email: match.candidate.email,
              phone: match.candidate.phone,
              location: match.candidate.emirate || 'Dubai',
              summary: match.candidate.summary || ''
            },
            experience: match.candidate.experience || [],
            education: match.candidate.education || [],
            skills: {
              technical: match.candidate.skills || [],
              soft: []
            },
            languages: match.candidate.languages || [],
            certifications: match.candidate.certifications || []
          },
          status: match.candidate.status, // preserve status if available
          is_applicant: match.is_applicant || match.candidate.is_applicant, // Check both levels for safety
          application_date: match.application_date || match.candidate.application_date,
          employment_status: match.candidate.employment_status || 'candidate'
        }));

        // Fetch existing shortlist status
        try {
          console.log('Fetching shortlist status for JD:', jdId);
          const shortlistResponse = await shortlistApi.get(jdId);
          console.log('Shortlist API Response:', shortlistResponse);

          const responseData = shortlistResponse.data as any;

          if (shortlistResponse.success && responseData && Array.isArray(responseData.shortlist)) {
            const shortlistMap = new Map(responseData.shortlist.map((item: any) => [item.candidate_id, item.status]));
            console.log('Shortlist Map created:', shortlistMap.size, 'entries');

            // Merge status
            matchingCandidates.forEach(candidate => {
              if (shortlistMap.has(candidate.candidate_id)) {
                candidate.status = shortlistMap.get(candidate.candidate_id) as string;
              }
            });
          }
        } catch (error) {
          console.error('Failed to fetch shortlist status:', error);
        }

        // Store ALL candidates, filtering happens in render
        setCandidates(matchingCandidates);

        const aboveThreshold = matchingCandidates.filter(c => c.overall_score >= matchThreshold).length;

        toast({
          title: 'Candidates Found',
          description: `Found ${aboveThreshold} matching candidate${aboveThreshold !== 1 ? 's' : ''} (${matchingCandidates.length} total reviewed).`,
        });
      } else {
        throw new Error('Failed to find matching candidates');
      }
    } catch (error: any) {
      console.error('Error finding matching candidates:', error);
      console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      toast({
        variant: 'destructive',
        title: 'Matching Failed',
        description: error.message || 'There was an error finding matching candidates.',
      });
    } finally {
      setIsMatching(false);
    }
  };

  // Handle candidate actions
  const handleCandidateAction = async (candidateId: string, action: 'shortlist' | 'reject' | 'message' | 'interview') => {
    console.log('handleCandidateAction triggered:', { candidateId, action, user }); // DEBUG LOG

    // Update local state
    setCandidates(prev =>
      prev.map(candidate => {
        if (candidate.candidate_id === candidateId) {
          return {
            ...candidate,
            status: action === 'shortlist' ? 'shortlisted' : action === 'reject' ? 'rejected' : candidate.status
          } as MatchingResult & { status?: string };
        }
        return candidate;
      })
    );

    // Handle different actions
    switch (action) {
      case 'shortlist':
        if (selectedJob && user) {
          try {
            const candidate = candidates.find(c => c.candidate_id === candidateId);
            await shortlistApi.add({
              jd_id: selectedJob.jd_id || selectedJob.id,
              candidate_id: candidateId,
              recruiter_id: user.id.toString(),
              match_score: candidate?.overall_score,
              match_details: candidate?.match_details,
              notes: 'Shortlisted from candidate matching'
            });

            toast({
              title: 'Candidate Shortlisted',
              description: 'The candidate has been added to your shortlist.',
            });
          } catch (error) {
            console.error('Failed to shortlist candidate:', error);
            toast({
              variant: 'destructive',
              title: 'Error',
              description: 'Failed to save shortlist status.',
            });
            // Revert local state if needed, but for now we keep it optimistic
          }
        } else {
          toast({
            title: 'Candidate Shortlisted',
            description: 'The candidate has been added to your shortlist (Local only - login required to save).',
          });
        }
        break;
      case 'reject':
        toast({
          title: 'Candidate Rejected',
          description: 'The candidate has been marked as rejected.',
        });
        break;
      case 'message':
        if (user) {
          try {
            const response = await restClient.post('/api/communication/conversations', {
              participants: [String(user.id), candidateId],
              title: selectedJob?.title || 'Recruiter Chat',
              job_id: selectedJob?.jd_id || selectedJob?.id,
              sender_role: 'recruiter'
            });
            if (response.data && response.data.success) {
              console.log('Conversation created response:', response.data);
              // Backend returns data directly, not wrapped in 'conversation'
              const conversationId = response.data.data.id || response.data.data.conversation?.id;

              if (!conversationId) {
                throw new Error('Conversation ID missing in response');
              }

              toast({
                title: 'Conversation Started',
                description: 'Redirecting to messages...',
              });
              navigate(`/recruiter?tab=messages&conversationId=${conversationId}`);
            } else {
              throw new Error('Failed to create conversation');
            }
          } catch (error) {
            console.error('Failed to start conversation:', error);
            toast({
              variant: 'destructive',
              title: 'Error',
              description: 'Failed to start conversation.',
            });
          }
        }
        break;
      case 'interview':
        toast({
          title: 'Interview Scheduling',
          description: 'Interview scheduling will be implemented soon.',
        });
        break;
    }
  };

  // View candidate details
  const handleViewCandidate = (candidate: MatchingResult) => {
    setSelectedCandidate(candidate);
    setIsDetailOpen(true);
  };

  // Get score color and badge
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { variant: 'default' as const, label: 'Excellent' };
    if (score >= 60) return { variant: 'secondary' as const, label: 'Good' };
    return { variant: 'outline' as const, label: 'Fair' };
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation.toLowerCase()) {
      case 'highly recommended':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'recommended':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'good fit':
        return 'text-teal-600 bg-teal-50 border-teal-200';
      case 'weak match':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'poor match':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Filter and sort candidates
  const filteredAndSortedCandidates = candidates
    .filter(candidate => {
      // DEBUG LOGGING - FIXED ACCESSORS
      const cName = (candidate.candidate_name || '').toLowerCase();
      if (cName.includes('khalid')) {
        console.log('Checking Khalid:', {
          filterBy,
          isApplicant: candidate.is_applicant,
          score: candidate.overall_score,
          threshold: matchThreshold,
          passApplicants: filterBy === 'applicants' && candidate.is_applicant === true,
          passThreshold: candidate.overall_score >= matchThreshold
        });
      }

      // 1. First apply View Mode / Filter By logic
      if (filterBy === 'applicants') {
        // If viewing applicants, MUST be an applicant. Ignore threshold.
        return (candidate as any).is_applicant === true;
      }

      // 2. For other modes, apply Threshold (bypass threshold check for actual applicants)
      if (!candidate.is_applicant && candidate.overall_score < matchThreshold) return false;

      // 3. Apply Quality Filters (reject if outside selected range, but don't return true early)
      if (filterBy === 'excellent' && candidate.overall_score < 80) return false;
      if (filterBy === 'good' && (candidate.overall_score < 60 || candidate.overall_score >= 80)) return false;
      if (filterBy === 'fair' && (candidate.overall_score < 40 || candidate.overall_score >= 60)) return false;

      // 4. Apply Advanced Filters (Experience, Education)
      if (appliedFilters.experience !== 'any') {
        const expYears = candidate.match_details?.experience?.years || 0;
        switch (appliedFilters.experience) {
          case '0-2': if (expYears > 2) return false; break;
          case '3-5': if (expYears < 3 || expYears > 5) return false; break;
          case '5-10': if (expYears < 5 || expYears > 10) return false; break;
          case '10+': if (expYears < 10) return false; break;
        }
      }
      if (appliedFilters.education !== 'any') {
        const eduLevels: Record<string, number> = { 'high_school': 1, 'diploma': 2, 'bachelor': 3, 'master': 4, 'phd': 5 };
        const candEdu = (candidate.match_details?.education?.level || '').toLowerCase().replace("'s", "").replace("bachelor's degree", "bachelor");
        const candLevel = eduLevels[candEdu] || 0;
        const reqLevel = eduLevels[appliedFilters.education] || 0;
        if (candLevel < reqLevel) return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.overall_score - a.overall_score;
        case 'skills':
          return b.skills_score - a.skills_score;
        case 'experience':
          return b.experience_score - a.experience_score;
        case 'education':
          return b.education_score - a.education_score;
        default:
          return b.overall_score - a.overall_score;
      }
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Candidate Matching</h2>
        <p className="text-muted-foreground">Find the best candidates for your job openings using AI-powered matching</p>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{analytics.total_matches}</div>
                  <div className="text-xs text-muted-foreground">Total Matches</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{analytics.average_score.toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">Avg Score</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">{analytics.qualification_rate.toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">Qualification Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold">{analytics.stored_data.cvs}</div>
                  <div className="text-xs text-muted-foreground">CVs Processed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Match Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Match Settings</CardTitle>
          <CardDescription>Select a job and configure matching parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Job Description</label>
              <div className="flex gap-2">
                <Select
                  value={selectedJob?.jd_id || selectedJob?.id || ''}
                  onValueChange={(value) => {
                    const job = jobDescriptions?.find(j => (j.jd_id || j.id) === value);
                    setSelectedJob(job || null);
                  }}
                >
                  <SelectTrigger className="w-[300px] bg-white">
                    <SelectValue placeholder="Select a job description" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobDescriptions?.map((job) => (
                      <SelectItem key={job.jd_id || job.id} value={job.jd_id || job.id}>
                        {job.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Minimum Match Score: {matchThreshold}%</label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={matchThreshold}
                onChange={(e) => setMatchThreshold(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">Overall Score</SelectItem>
                  <SelectItem value="skills">Skills Match</SelectItem>
                  <SelectItem value="experience">Experience</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button
                onClick={() => handleFindMatches()}
                disabled={!selectedJob || isMatching}
                className="flex-1"
              >
                {isMatching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white me-2"></div>
                    Finding...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 me-2" />
                    Find Candidates
                  </>
                )}
              </Button>

              {selectedJob && (
                <Button
                  variant={viewMode === 'shortlist' ? 'default' : 'outline'}
                  onClick={() => setViewMode(viewMode === 'shortlist' ? 'matching' : 'shortlist')}
                  className={viewMode === 'shortlist' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  {viewMode === 'shortlist' ? (
                    <>
                      <Users className="h-4 w-4 me-2" />
                      Back to Matching
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 me-2" />
                      View Shortlist
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* G22/G23: Stealth Headhunter — Passive Talent Controls */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <Switch
                  checked={includePassiveTalent}
                  onCheckedChange={(checked) => {
                    setIncludePassiveTalent(checked);
                    if (!checked) setEmploymentStatusFilter('all');
                  }}
                />
                <div>
                  <label className="text-sm font-medium">Include Passive Talent</label>
                  <p className="text-xs text-muted-foreground">Search employed candidates open to opportunities</p>
                </div>
              </div>

              {includePassiveTalent && (
                <div className="space-y-1">
                  <label className="text-sm font-medium">Employment Status</label>
                  <Select value={employmentStatusFilter} onValueChange={setEmploymentStatusFilter}>
                    <SelectTrigger className="w-[200px] bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Candidates</SelectItem>
                      <SelectItem value='candidate'>Active Job Seeker</SelectItem>
                      <SelectItem value="employed_open">Open to Opportunities</SelectItem>
                      <SelectItem value="passive">All Passive Talent</SelectItem>
                      <SelectItem value="freelancer">Freelancer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Job Info */}
      {selectedJob && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">{selectedJob.title}</h3>
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  {selectedJob.company} • {selectedJob.location} • {selectedJob.employment_type}
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {Array.isArray(selectedJob.requirements)
                      ? selectedJob.requirements.filter((r: any) => r.category === 'skills').length
                      : (selectedJob.requirements?.skills?.length || 0)} skills required
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {selectedJob.parsing_metadata?.confidence_score || selectedJob.metadata?.parsing_metadata?.confidence_score || 0}% parsing confidence
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shortlist View */}
      {viewMode === 'shortlist' && selectedJob && (
        <div className="bg-white rounded-lg border shadow-sm">
          <ShortlistManager jdId={selectedJob.jd_id || selectedJob.id} />
        </div>
      )}

      {/* Candidates Results (Matching View) */}
      {viewMode === 'matching' && !isMatching && candidates.length === 0 && selectedJob && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Matching Candidates Found</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              We couldn't find any candidates matching the criteria above {matchThreshold}%.
              Try lowering the match threshold or adjusting your job description requirements.
            </p>
            <Button variant="outline" onClick={() => setMatchThreshold(0)}>
              Search with 0% Threshold
            </Button>
          </CardContent>
        </Card>
      )}

      {viewMode === 'matching' && candidates.length > 0 && (
        <Card>
          <CardHeader className="flex-row justify-between items-center">
            <div>
              <CardTitle>Matching Candidates</CardTitle>
              <CardDescription>
                {filteredAndSortedCandidates.length} of {candidates.length} candidates shown
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="applicants">Applicants Only</SelectItem>
                  <SelectItem value="all">All Candidates</SelectItem>
                  <SelectItem value="excellent">Excellent (80%+)</SelectItem>
                  <SelectItem value="good">Good (60-79%)</SelectItem>
                  <SelectItem value="fair">Fair (40-59%)</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => setIsFilterOpen(!isFilterOpen)}>
                <Filter className="h-4 w-4 me-1" /> Filter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isFilterOpen && (
              <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Years of Experience</label>
                    <Select value={filterExperience} onValueChange={setFilterExperience}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="0-2">0-2 years</SelectItem>
                        <SelectItem value="3-5">3-5 years</SelectItem>
                        <SelectItem value="5-10">5-10 years</SelectItem>
                        <SelectItem value="10+">10+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Education Level</label>
                    <Select value={filterEducation} onValueChange={setFilterEducation}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="bachelor">Bachelor's</SelectItem>
                        <SelectItem value="master">Master's</SelectItem>
                        <SelectItem value="phd">PhD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Availability</label>
                    <Select value={filterAvailability} onValueChange={setFilterAvailability}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="1-month">1 Month Notice</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button size="sm" variant="outline" className="me-2" onClick={() => {
                    setFilterExperience('any');
                    setFilterEducation('any');
                    setFilterAvailability('any');
                    setAppliedFilters({ experience: 'any', education: 'any', availability: 'any' });
                  }}>Reset</Button>
                  <Button size="sm" className="bg-teal-600 text-white hover:bg-teal-700" onClick={() => {
                    setAppliedFilters({ experience: filterExperience, education: filterEducation, availability: filterAvailability });
                  }}>Apply Filters</Button>
                </div>
              </div>
            )}
            <div className="space-y-6">
              {filteredAndSortedCandidates.map((candidate) => {
                const candidateWithStatus = candidate as MatchingResult & { status?: string };
                const scoreBadge = getScoreBadge(candidate.overall_score);

                return (
                  <div
                    key={candidate.candidate_id}
                    className={`border rounded-lg p-6 ${candidateWithStatus.status === 'shortlisted'
                      ? 'border-green-200 bg-green-50 dark:bg-green-950/20'
                      : candidateWithStatus.status === 'rejected'
                        ? 'border-red-200 bg-red-50 dark:bg-red-950/20'
                        : 'border-gray-200'
                      }`}
                  >
                    <div className="flex flex-col lg:flex-row justify-between gap-6">
                      {/* Candidate Info */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            {/* Selection Checkbox */}
                            <input
                              type="checkbox"
                              className="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                              onChange={(e) => {
                                // Handle bulk selection logic here
                              }}
                            />
                            {/* Applicant Badge */}
                            {(candidate as any).is_applicant && (
                              <Badge className="bg-purple-600 text-white hover:bg-purple-700">
                                <Briefcase className="h-3 w-3 me-1" />
                                APPLICANT
                              </Badge>
                            )}
                            {/* G22/G23: Employment status badge for passive talent */}
                            {!candidate.is_applicant && candidate.employment_status && candidate.employment_status !== 'candidate' && (
                              <Badge className={candidate.employment_status === 'employed_open'
                                ? 'bg-amber-500 text-white hover:bg-amber-600'
                                : candidate.employment_status === 'freelancer'
                                  ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                                  : 'bg-slate-400 text-white hover:bg-slate-500'
                              }>
                                {candidate.employment_status === 'employed_open' ? 'Open to Opportunities'
                                  : candidate.employment_status === 'freelancer' ? 'Freelancer'
                                  : candidate.employment_status === 'employed_not_looking' ? 'Not Looking'
                                  : candidate.employment_status}
                              </Badge>
                            )}

                            <div>
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold text-lg">{candidate.candidate_name}</h3>
                                {candidateWithStatus.status === 'shortlisted' && (
                                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                    Shortlisted
                                  </Badge>
                                )}
                                {candidateWithStatus.status === 'rejected' && (
                                  <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                                    Rejected
                                  </Badge>
                                )}
                              </div>
                              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium border mt-2 ${getRecommendationColor(candidate.recommendation)}`}>
                                {candidate.recommendation}
                              </div>
                            </div>
                          </div>

                          {/* Match Score Ring */}
                          <div className="relative h-16 w-16 flex items-center justify-center">
                            <svg className="h-full w-full transform -rotate-90">
                              <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="transparent"
                                className="text-slate-100"
                              />
                              <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="transparent"
                                strokeDasharray={175.9}
                                strokeDashoffset={175.9 - (175.9 * candidate.overall_score) / 100}
                                className={candidate.overall_score >= 80 ? "text-green-500" : candidate.overall_score >= 60 ? "text-yellow-500" : "text-orange-500"}
                              />
                            </svg>
                            <span className="absolute text-sm font-bold">{candidate.overall_score}%</span>
                          </div>
                        </div>

                        {/* Skills */}
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2 text-sm text-slate-500">
                            <Star className="h-4 w-4" />
                            Top Skills
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {candidate.match_details.skills.matched.slice(0, 5).map((skill, index) => (
                              <Badge key={index} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                                {skill}
                              </Badge>
                            ))}
                            {candidate.match_details.skills.matched.length > 5 && (
                              <span className="text-xs text-slate-500 self-center">
                                +{candidate.match_details.skills.matched.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Experience & Education */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-4 pt-4 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-600">{candidate.match_details.experience.years} years exp.</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-600">{candidate.match_details.education.level}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-600">{candidate.candidate_data.personalInfo.location}</span>
                          </div>
                          {candidate.match_details.location.distance != null && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-blue-500" />
                              <span className="text-blue-600 font-medium">Residence is {candidate.match_details.location.distance} km away</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions Column (replacing old Scores column) */}
                      <div className="flex flex-col gap-2 justify-center lg:w-48 lg:border-s lg:ps-6">
                        <Button
                          className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                          onClick={() => handleCandidateAction(candidate.candidate_id, 'shortlist')}
                        >
                          <CheckCircle className="h-4 w-4 me-2" /> Shortlist
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handleViewCandidate(candidate)}
                        >
                          <Eye className="h-4 w-4 me-2" /> Quick View
                        </Button>
                        {/* G22/G23: Headhunt button for passive talent */}
                        {candidate.employment_status && candidate.employment_status !== 'candidate' && !candidate.is_applicant ? (
                          <Button
                            variant="outline"
                            className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                            onClick={() => {
                              setHeadhuntCandidate(candidate);
                              handleCandidateAction(candidate.candidate_id, 'message');
                            }}
                          >
                            <Search className="h-4 w-4 me-2" /> Headhunt
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            className="w-full text-slate-500 hover:text-slate-700"
                            onClick={() => handleCandidateAction(candidate.candidate_id, 'message')}
                          >
                            <MessageSquare className="h-4 w-4 me-2" /> Message
                          </Button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}


      {/* Candidate Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Candidate Details</DialogTitle>
            <DialogDescription>
              Complete candidate profile and matching analysis
            </DialogDescription>
          </DialogHeader>

          {selectedCandidate && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="font-semibold mb-3">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Name:</span> {selectedCandidate.candidate_data.personalInfo.name}</div>
                  <div><span className="font-medium">Email:</span> {selectedCandidate.candidate_data.personalInfo.email}</div>
                  <div><span className="font-medium">Phone:</span> {selectedCandidate.candidate_data.personalInfo.phone}</div>
                  <div><span className="font-medium">Location:</span> {selectedCandidate.candidate_data.personalInfo.location}</div>
                </div>
                {selectedCandidate.candidate_data.personalInfo.summary && (
                  <div className="mt-3">
                    <span className="font-medium">Summary:</span>
                    <p className="text-sm mt-1">{selectedCandidate.candidate_data.personalInfo.summary}</p>
                  </div>
                )}
              </div>

              {/* Experience */}
              <div>
                <h3 className="font-semibold mb-3">Experience ({selectedCandidate.candidate_data.experience.length})</h3>
                <div className="space-y-3">
                  {selectedCandidate.candidate_data.experience.map((exp, index) => (
                    <div key={index} className="border-s-2 border-gray-200 ps-4">
                      <div className="font-medium">{exp.title}</div>
                      <div className="text-sm text-muted-foreground">{exp.company} • {exp.duration}</div>
                      <div className="text-sm mt-1">{exp.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div>
                <h3 className="font-semibold mb-3">Education ({selectedCandidate.candidate_data.education.length})</h3>
                <div className="space-y-2">
                  {selectedCandidate.candidate_data.education.map((edu, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">{edu.degree}</span> - {edu.institution} ({edu.year})
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div>
                <h3 className="font-semibold mb-3">Skills</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">Technical Skills ({selectedCandidate.candidate_data.skills.technical.length})</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedCandidate.candidate_data.skills.technical.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Soft Skills ({selectedCandidate.candidate_data.skills.soft.length})</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedCandidate.candidate_data.skills.soft.map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Languages & Certifications */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Languages ({selectedCandidate.candidate_data.languages.length})</h3>
                  <div className="flex flex-wrap gap-1">
                    {selectedCandidate.candidate_data.languages.map((lang, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Certifications ({selectedCandidate.candidate_data.certifications.length})</h3>
                  <div className="space-y-1">
                    {selectedCandidate.candidate_data.certifications.map((cert, index) => (
                      <div key={index} className="text-sm">{cert}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Matching Analysis */}
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-3">Matching Analysis</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Score Breakdown</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Overall Score:</span>
                        <span className="font-medium">{selectedCandidate.overall_score}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Skills:</span>
                        <span>{selectedCandidate.skills_score}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Experience:</span>
                        <span>{selectedCandidate.experience_score}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Education:</span>
                        <span>{selectedCandidate.education_score}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Location:</span>
                        <span>{selectedCandidate.location_score}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Recommendation</h4>
                    <div className={`p-3 rounded-lg border ${getRecommendationColor(selectedCandidate.recommendation)}`}>
                      <div className="font-medium">{selectedCandidate.recommendation}</div>
                      <div className="text-sm mt-1">
                        Based on comprehensive analysis of skills, experience, and qualifications
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                  Close
                </Button>
                 <Button 
                   variant="outline"
                   onClick={() => handleDownloadCV(selectedCandidate.candidate_id, selectedCandidate.candidate_name)}
                   disabled={isDownloadingCV}
                 >
                   <Download className="h-4 w-4 me-2" />
                   {isDownloadingCV ? "Downloading..." : "Download CV"}
                 </Button>
                <Button onClick={() => {
                  setIsDetailOpen(false);
                  handleCandidateAction(selectedCandidate.candidate_id, 'shortlist');
                }}>
                  <ThumbsUp className="h-4 w-4 me-2" />
                  Shortlist Candidate
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Training Recommendations Dialog */}
      {
        selectedCandidateForTraining && (
          <TrainingRecommendationsDialog
            isOpen={isTrainingDialogOpen}
            onClose={() => setIsTrainingDialogOpen(false)}
            candidateName={selectedCandidateForTraining.candidate_name}
            missingSkills={selectedCandidateForTraining.match_details.skills.missing}
          />
        )
      }
      {/* Mentorship Recommendations Dialog */}
      {
        selectedCandidateForMentorship && (
          <MentorRecommendationsDialog
            isOpen={isMentorshipDialogOpen}
            onClose={() => setIsMentorshipDialogOpen(false)}
            candidateName={selectedCandidateForMentorship.candidate_name}
            candidateId={selectedCandidateForMentorship.candidate_id}
            candidateData={selectedCandidateForMentorship.candidate_data}
            missingSkills={selectedCandidateForMentorship.match_details.skills.missing}
          />
        )
      }
    </div >
  );
};

export default CandidateMatching;
