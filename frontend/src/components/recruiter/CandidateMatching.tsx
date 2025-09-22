import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  RefreshCw
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { jobApi, flaskClient, type JobDescription } from '@/utils/api';

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
  stored_data: {
    cvs: number;
    jds: number;
  };
}

const CandidateMatching = () => {
  const { toast } = useToast();
  const [selectedJob, setSelectedJob] = useState<JobDescription | null>(null);
  const [matchThreshold, setMatchThreshold] = useState(50);
  const [candidates, setCandidates] = useState<MatchingResult[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<MatchingResult | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'score' | 'skills' | 'experience' | 'education'>('score');
  const [filterBy, setFilterBy] = useState<'all' | 'excellent' | 'good' | 'fair'>('all');

  // Fetch job descriptions from Flask backend
  const { data: jobDescriptions, isLoading: isLoadingJobs } = useQuery({
    queryKey: ['jobDescriptions'],
    queryFn: async () => {
      const response = await jobApi.list();
      if (response.success) {
        return response.data || [];
      }
      throw new Error(response.error || 'Failed to fetch job descriptions');
    }
  });

  // Fetch analytics data
  const { data: analytics, refetch: refetchAnalytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      try {
        const response = await flaskClient.request<AnalyticsData>('/api/analytics', {
          method: 'GET',
        });
        return response.success ? response.data : null;
      } catch (error) {
        return null;
      }
    }
  });

  // Check for pre-selected job from localStorage (from JobDescriptionsList)
  useEffect(() => {
    const storedJob = localStorage.getItem('selectedJobForMatching');
    if (storedJob) {
      try {
        const job = JSON.parse(storedJob);
        setSelectedJob(job);
        localStorage.removeItem('selectedJobForMatching'); // Clean up
      } catch (error) {
        console.error('Error parsing stored job:', error);
      }
    }
  }, []);

  // Auto-trigger matching when job is pre-selected
  useEffect(() => {
    if (selectedJob && candidates.length === 0) {
      handleFindMatches();
    }
  }, [selectedJob]);

  // Find matching candidates
  const handleFindMatches = async () => {
    if (!selectedJob) {
      toast({
        variant: 'destructive',
        title: 'No Job Selected',
        description: 'Please select a job to find matching candidates.',
      });
      return;
    }

    setIsMatching(true);
    
    try {
      // Call Flask backend for candidate ranking
      const response = await flaskClient.request<MatchingResult[]>('/api/match/rank-candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: selectedJob.id,
          threshold: matchThreshold / 100, // Convert percentage to decimal
        }),
      });
      
      if (response.success && response.data) {
        const matchingCandidates = response.data;
        setCandidates(matchingCandidates);
        
        // Refetch analytics
        refetchAnalytics();
        
        toast({
          title: 'Candidates Found',
          description: `Found ${matchingCandidates.length} matching candidates above ${matchThreshold}% threshold.`,
        });
      } else {
        throw new Error(response.error || 'Failed to find matching candidates');
      }
    } catch (error) {
      console.error('Error finding matching candidates:', error);
      toast({
        variant: 'destructive',
        title: 'Matching Failed',
        description: error instanceof Error ? error.message : 'There was an error finding matching candidates.',
      });
    } finally {
      setIsMatching(false);
    }
  };

  // Handle candidate actions
  const handleCandidateAction = async (candidateId: string, action: 'shortlist' | 'reject' | 'message' | 'interview') => {
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
        toast({
          title: 'Candidate Shortlisted',
          description: 'The candidate has been added to your shortlist.',
        });
        break;
      case 'reject':
        toast({
          title: 'Candidate Rejected',
          description: 'The candidate has been marked as rejected.',
        });
        break;
      case 'message':
        toast({
          title: 'Message Feature',
          description: 'Messaging functionality will be implemented soon.',
        });
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
      case 'consider':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Filter and sort candidates
  const filteredAndSortedCandidates = candidates
    .filter(candidate => {
      if (filterBy === 'all') return true;
      if (filterBy === 'excellent') return candidate.overall_score >= 80;
      if (filterBy === 'good') return candidate.overall_score >= 60 && candidate.overall_score < 80;
      if (filterBy === 'fair') return candidate.overall_score >= 40 && candidate.overall_score < 60;
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
              <Select 
                value={selectedJob?.id || ''} 
                onValueChange={(value) => {
                  const job = jobDescriptions?.find(j => j.id === value);
                  setSelectedJob(job || null);
                  setCandidates([]); // Clear previous results
                }}
                disabled={isLoadingJobs}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a job..." />
                </SelectTrigger>
                <SelectContent>
                  {jobDescriptions?.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title} - {job.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            
            <div className="flex items-end">
              <Button 
                onClick={handleFindMatches} 
                disabled={!selectedJob || isMatching}
                className="w-full"
              >
                {isMatching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Finding...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Find Candidates
                  </>
                )}
              </Button>
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
                    {selectedJob.requirements.skills.length} skills required
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {selectedJob.parsing_metadata.confidence_score}% parsing confidence
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Candidates Results */}
      {candidates.length > 0 && (
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
                  <SelectItem value="all">All Candidates</SelectItem>
                  <SelectItem value="excellent">Excellent (80%+)</SelectItem>
                  <SelectItem value="good">Good (60-79%)</SelectItem>
                  <SelectItem value="fair">Fair (40-59%)</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" /> Filter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {filteredAndSortedCandidates.map((candidate) => {
                const candidateWithStatus = candidate as MatchingResult & { status?: string };
                const scoreBadge = getScoreBadge(candidate.overall_score);
                
                return (
                  <div 
                    key={candidate.candidate_id} 
                    className={`border rounded-lg p-6 ${
                      candidateWithStatus.status === 'shortlisted' 
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

                        {/* Skills */}
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            Skills Match ({candidate.match_details.skills.matched.length} matched)
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {candidate.match_details.skills.matched.slice(0, 8).map((skill, index) => (
                              <Badge key={index} variant="default" className="text-xs bg-green-100 text-green-800">
                                {skill}
                              </Badge>
                            ))}
                            {candidate.match_details.skills.matched.length > 8 && (
                              <Badge variant="outline" className="text-xs">
                                +{candidate.match_details.skills.matched.length - 8} more
                              </Badge>
                            )}
                          </div>
                          {candidate.match_details.skills.missing.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs text-muted-foreground">Missing: </span>
                              {candidate.match_details.skills.missing.slice(0, 3).map((skill, index) => (
                                <Badge key={index} variant="outline" className="text-xs ml-1 text-red-600">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Experience & Education */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">Experience</div>
                              <div className="text-muted-foreground">
                                {candidate.match_details.experience.years} years • {candidate.match_details.experience.level}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">Education</div>
                              <div className="text-muted-foreground">
                                {candidate.match_details.education.level} • {candidate.match_details.education.field}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">Location</div>
                              <div className="text-muted-foreground">
                                {candidate.candidate_data.personalInfo.location}
                                {candidate.match_details.location.distance > 0 && (
                                  <span className="ml-1">({candidate.match_details.location.distance}km)</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Scores */}
                      <div className="flex flex-col items-center justify-center lg:min-w-[200px]">
                        <div className="text-center mb-4">
                          <div className="text-3xl font-bold">{candidate.overall_score}%</div>
                          <Badge variant={scoreBadge.variant} className="mt-1">
                            {scoreBadge.label}
                          </Badge>
                        </div>
                        
                        <div className="w-full space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>Skills</span>
                            <span>{candidate.skills_score}%</span>
                          </div>
                          <Progress value={candidate.skills_score} className="h-2" />
                          
                          <div className="flex justify-between text-xs">
                            <span>Experience</span>
                            <span>{candidate.experience_score}%</span>
                          </div>
                          <Progress value={candidate.experience_score} className="h-2" />
                          
                          <div className="flex justify-between text-xs">
                            <span>Education</span>
                            <span>{candidate.education_score}%</span>
                          </div>
                          <Progress value={candidate.education_score} className="h-2" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 mt-6 justify-end border-t pt-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleViewCandidate(candidate)}
                      >
                        <Eye className="h-4 w-4 mr-1" /> View Details
                      </Button>
                      
                      {candidateWithStatus.status !== 'rejected' && (
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleCandidateAction(candidate.candidate_id, 'reject')}
                        >
                          <ThumbsDown className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      )}
                      
                      {candidateWithStatus.status !== 'shortlisted' && (
                        <Button 
                          size="sm" 
                          variant="default" 
                          onClick={() => handleCandidateAction(candidate.candidate_id, 'shortlist')}
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" /> Shortlist
                        </Button>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleCandidateAction(candidate.candidate_id, 'message')}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" /> Message
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleCandidateAction(candidate.candidate_id, 'interview')}
                      >
                        <Video className="h-4 w-4 mr-1" /> Interview
                      </Button>
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
                    <div key={index} className="border-l-2 border-gray-200 pl-4">
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
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download CV
                </Button>
                <Button onClick={() => {
                  setIsDetailOpen(false);
                  handleCandidateAction(selectedCandidate.candidate_id, 'shortlist');
                }}>
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Shortlist Candidate
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidateMatching;

