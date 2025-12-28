import React, { useState, useEffect, useCallback } from 'react';
import { restClient } from '@/utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Star,
  Heart,
  ExternalLink,
  Filter,
  Search,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  FileText,
  Sparkles,
  GraduationCap,
  Target,
  Award,
  XCircle,
  WifiOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MatchBreakdown {
  skills_match?: number;
  experience_match?: number;
  title_match?: number;
  location_match?: number;
  d33_alignment?: number;
  details?: {
    matching_skills?: string[];
    missing_skills?: string[];
    recommendation?: string;
    fit_assessment?: string;
    ai_analyzed?: boolean;
    ai_model?: string;
  };
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  matchScore: number;
  matchBreakdown?: MatchBreakdown;
  description: string;
  requirements: string[];
  benefits: string[];
  postedDate: string;
  isBookmarked?: boolean;
  candidateLevel?: string;
  jobLevel?: string;
  fitAssessment?: string;
}

interface JobMatchesProps {
  candidateProfile?: any;
}

const EXPERIENCE_LEVELS = [
  { value: 'all', label: 'All Levels', icon: '📋' },
  { value: 'trainee', label: 'Trainee/Intern', icon: '🎓' },
  { value: 'junior', label: 'Junior (0-2 yrs)', icon: '🌱' },
  { value: 'mid', label: 'Mid-Level (2-5 yrs)', icon: '💼' },
  { value: 'senior', label: 'Senior (5+ yrs)', icon: '⭐' },
];

const JobMatches: React.FC<JobMatchesProps> = ({ candidateProfile }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'high-match' | 'recent'>('all');
  const [experienceFilter, setExperienceFilter] = useState<string>('all');
  const [bookmarkedJobs, setBookmarkedJobs] = useState<Set<string>>(new Set());
  const [cvLoaded, setCvLoaded] = useState(false);
  const [aiMatching, setAiMatching] = useState(false);
  const [candidateLevel, setCandidateLevel] = useState<string>('');
  const [matchMessage, setMatchMessage] = useState('');
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  
  // Error states
  const [error, setError] = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number>(30);
  const [cvRequired, setCvRequired] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  
  const navigate = useNavigate();

  // Countdown timer for retry
  useEffect(() => {
    if (retryCountdown !== null && retryCountdown > 0) {
      const timer = setTimeout(() => {
        setRetryCountdown(retryCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (retryCountdown === 0) {
      // Auto-retry when countdown reaches 0
      setRetryCountdown(null);
      loadJobMatches(true);
    }
  }, [retryCountdown]);

  const loadJobMatches = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    // Reset error states
    setError(null);
    setServiceUnavailable(false);
    setCvRequired(false);
    
    try {
      const response = await restClient.get('/api/candidate/job-matches', {
        params: {
          use_ai: 'true',
          filter_by_level: experienceFilter === 'all' ? 'false' : 'true'
        }
      });

      if (response.data.success) {
        setJobs(response.data.jobs || []);
        setCvLoaded(response.data.cv_loaded || false);
        setAiMatching(response.data.ai_matching || false);
        setCandidateLevel(response.data.candidate_level || '');
        setMatchMessage(response.data.message || '');
      } else {
        // Handle specific error types
        if (response.data.service_unavailable) {
          setServiceUnavailable(true);
          setRetryAfter(response.data.retry_after || 30);
          setError(response.data.error || 'AI matching service is not available. Please try again later.');
        } else if (response.data.cv_required) {
          setCvRequired(true);
          setError(response.data.error || 'Please upload your CV first to get personalized job matches.');
        } else {
          setError(response.data.error || 'Failed to load job matches');
        }
      }
    } catch (err: any) {
      console.error('Error loading job matches:', err);
      
      // Check if it's a 503 Service Unavailable error
      if (err.response?.status === 503) {
        setServiceUnavailable(true);
        setRetryAfter(err.response?.data?.retry_after || 30);
        setError(err.response?.data?.error || 'AI matching service is not available. Please try again later.');
      } else if (err.response?.status === 400 && err.response?.data?.cv_required) {
        setCvRequired(true);
        setError(err.response?.data?.error || 'Please upload your CV first to get personalized job matches.');
      } else {
        setError('Failed to connect to the matching service. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [experienceFilter]);

  useEffect(() => {
    loadJobMatches();
  }, [loadJobMatches, candidateProfile]);

  const handleRefresh = () => {
    loadJobMatches(true);
  };

  const handleRetryWithCountdown = () => {
    setRetryCountdown(retryAfter);
  };

  const handleBookmark = (jobId: string) => {
    setBookmarkedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const handleApply = async (jobId: string) => {
    try {
      const response = await restClient.post('/api/jobs/apply', {
        job_id: jobId,
        cover_letter: 'Application from Candidate Dashboard'
      });

      if (response.data.success) {
        alert('Application submitted successfully!');
      } else {
        alert(response.data.message || 'Application failed');
      }
    } catch (error) {
      console.error('Error applying to job:', error);
      alert('Failed to submit application. Please try again.');
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getFitBadge = (fit: string | undefined) => {
    switch (fit) {
      case 'excellent':
        return <Badge className="bg-green-100 text-green-800">Excellent Fit</Badge>;
      case 'good':
        return <Badge className="bg-blue-100 text-blue-800">Good Fit</Badge>;
      case 'moderate':
        return <Badge className="bg-yellow-100 text-yellow-800">Moderate Fit</Badge>;
      case 'poor':
        return <Badge className="bg-orange-100 text-orange-800">Below Average</Badge>;
      case 'not_suitable':
        return <Badge className="bg-red-100 text-red-800">Not Recommended</Badge>;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'full-time': return 'bg-green-100 text-green-800';
      case 'part-time': return 'bg-blue-100 text-blue-800';
      case 'contract': return 'bg-purple-100 text-purple-800';
      case 'internship': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelBadge = (level: string | undefined) => {
    const levelConfig: Record<string, { color: string; label: string }> = {
      'trainee': { color: 'bg-purple-100 text-purple-800', label: 'Trainee/Intern' },
      'junior': { color: 'bg-blue-100 text-blue-800', label: 'Junior' },
      'mid': { color: 'bg-green-100 text-green-800', label: 'Mid-Level' },
      'senior': { color: 'bg-orange-100 text-orange-800', label: 'Senior' },
      'executive': { color: 'bg-red-100 text-red-800', label: 'Executive' }
    };
    
    const config = levelConfig[level || ''] || { color: 'bg-gray-100 text-gray-800', label: level || 'Unknown' };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const filteredJobs = jobs.filter(job => {
    // Apply match score filter
    let passesScoreFilter = true;
    switch (filter) {
      case 'high-match':
        passesScoreFilter = job.matchScore >= 70;
        break;
      case 'recent':
        const jobDate = new Date(job.postedDate);
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        passesScoreFilter = jobDate >= threeDaysAgo;
        break;
    }
    
    // Apply experience level filter
    let passesLevelFilter = true;
    if (experienceFilter !== 'all') {
      passesLevelFilter = job.jobLevel === experienceFilter;
    }
    
    return passesScoreFilter && passesLevelFilter;
  }).sort((a, b) => b.matchScore - a.matchScore);

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Job Matches</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Analyzing your profile with AI and finding best matches...</p>
            <p className="text-sm text-muted-foreground mt-2">This may take a moment...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Service Unavailable Error State
  if (serviceUnavailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Job Matches</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200 bg-red-50">
            <WifiOff className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-red-800">AI Matching Service Unavailable</AlertTitle>
            <AlertDescription className="text-red-700">
              <p className="mt-2">{error}</p>
              <p className="mt-2 text-sm">
                The AI-powered job matching service is temporarily unavailable. 
                This could be due to high demand or maintenance.
              </p>
              <div className="mt-4 flex items-center gap-4">
                {retryCountdown !== null ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    <span className="text-sm">Retrying in {retryCountdown} seconds...</span>
                  </div>
                ) : (
                  <>
                    <Button 
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      Try Again Now
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleRetryWithCountdown}
                      className="border-red-300 text-red-700 hover:bg-red-100"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Auto-retry in {retryAfter}s
                    </Button>
                  </>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // CV Required Error State
  if (cvRequired) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Job Matches</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-amber-200 bg-amber-50">
            <FileText className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-amber-800">CV Required for AI Matching</AlertTitle>
            <AlertDescription className="text-amber-700">
              <p className="mt-2">{error}</p>
              <p className="mt-2 text-sm">
                To get accurate, AI-powered job matches based on your skills and experience, 
                please upload your CV first.
              </p>
              <div className="mt-4">
                <Button 
                  onClick={() => navigate('/cv-builder')}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Upload or Create CV
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // General Error State
  if (error && !serviceUnavailable && !cvRequired) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Job Matches</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-red-800">Error Loading Job Matches</AlertTitle>
            <AlertDescription className="text-red-700">
              <p className="mt-2">{error}</p>
              <div className="mt-4">
                <Button 
                  onClick={handleRefresh}
                  disabled={refreshing}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Try Again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* CV Status Alert */}
      {!cvLoaded && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 flex justify-between items-center">
            <span>
              <strong>Upload your CV for personalized matches!</strong> Job scores are currently generic.
            </span>
            <Button 
              size="sm" 
              variant="outline"
              className="ml-4 border-amber-300 hover:bg-amber-100"
              onClick={() => navigate('/cv-builder')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Upload CV
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {cvLoaded && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>CV Loaded!</strong> {matchMessage}
                {candidateLevel && (
                  <span className="ml-2">
                    Your level: <Badge variant="outline" className="ml-1">{candidateLevel}</Badge>
                  </span>
                )}
              </div>
              {aiMatching && (
                <Badge className="bg-purple-100 text-purple-800">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI-Powered (Gemini)
                </Badge>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Job Matches</span>
                  {aiMatching && <Sparkles className="h-4 w-4 text-purple-500" />}
                </CardTitle>
                <CardDescription>
                  {cvLoaded 
                    ? `Showing ${filteredJobs.length} jobs matched to your profile`
                    : 'Upload CV for personalized AI-powered matching'
                  }
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-1"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </Button>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              {/* Experience Level Filter */}
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Level:</span>
                <div className="flex space-x-1">
                  {EXPERIENCE_LEVELS.map(level => (
                    <Button
                      key={level.value}
                      variant={experienceFilter === level.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setExperienceFilter(level.value)}
                      className="text-xs"
                    >
                      {level.icon} {level.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Match Score Filter */}
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filter:</span>
                <div className="flex space-x-1">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={filter === 'high-match' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('high-match')}
                  >
                    High Match (70%+)
                  </Button>
                  <Button
                    variant={filter === 'recent' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('recent')}
                  >
                    Recent
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No jobs found matching your filters.</p>
                <p className="text-sm mt-2">Try adjusting your experience level or filter settings.</p>
              </div>
            ) : (
              filteredJobs.map((job) => (
                <Card key={job.id} className={`border-l-4 ${job.matchScore >= 70 ? 'border-l-green-500' : job.matchScore >= 50 ? 'border-l-blue-500' : 'border-l-gray-300'}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center flex-wrap gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{job.title}</h3>
                          <Badge className={getMatchScoreColor(job.matchScore)}>
                            {job.matchScore}% match
                          </Badge>
                          {job.jobLevel && getLevelBadge(job.jobLevel)}
                          {job.fitAssessment && getFitBadge(job.fitAssessment)}
                        </div>
                        <div className="flex items-center flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center space-x-1">
                            <Briefcase className="h-4 w-4" />
                            <span>{job.company}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{job.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4" />
                            <span>{job.salary}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{new Date(job.postedDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Badge className={getTypeColor(job.type)}>
                          {job.type.replace('-', ' ')}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBookmark(job.id)}
                        className={bookmarkedJobs.has(job.id) ? 'text-red-500' : 'text-gray-400'}
                      >
                        <Heart className={`h-4 w-4 ${bookmarkedJobs.has(job.id) ? 'fill-current' : ''}`} />
                      </Button>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">{job.description}</p>

                    {/* Match Breakdown (Expandable) */}
                    {job.matchBreakdown && cvLoaded && (
                      <div className="mb-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                          className="text-sm text-blue-600 p-0 h-auto"
                        >
                          {expandedJob === job.id ? '▼ Hide' : '▶ Show'} Match Analysis
                        </Button>
                        
                        {expandedJob === job.id && (
                          <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-3">
                            <h4 className="font-medium flex items-center gap-2">
                              <Award className="h-4 w-4" />
                              Match Breakdown
                              {job.matchBreakdown.details?.ai_analyzed && (
                                <Badge className="bg-purple-100 text-purple-800 text-xs">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  AI Analyzed
                                </Badge>
                              )}
                            </h4>
                            
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                              <div className="text-center p-2 bg-white rounded">
                                <div className="text-lg font-bold text-blue-600">{job.matchBreakdown.skills_match || 0}/40</div>
                                <div className="text-xs text-muted-foreground">Skills</div>
                              </div>
                              <div className="text-center p-2 bg-white rounded">
                                <div className="text-lg font-bold text-green-600">{job.matchBreakdown.experience_match || 0}/25</div>
                                <div className="text-xs text-muted-foreground">Experience</div>
                              </div>
                              <div className="text-center p-2 bg-white rounded">
                                <div className="text-lg font-bold text-purple-600">{job.matchBreakdown.title_match || 0}/20</div>
                                <div className="text-xs text-muted-foreground">Title</div>
                              </div>
                              <div className="text-center p-2 bg-white rounded">
                                <div className="text-lg font-bold text-orange-600">{job.matchBreakdown.location_match || 0}/10</div>
                                <div className="text-xs text-muted-foreground">Location</div>
                              </div>
                              <div className="text-center p-2 bg-white rounded">
                                <div className="text-lg font-bold text-teal-600">{job.matchBreakdown.d33_alignment || 0}/5</div>
                                <div className="text-xs text-muted-foreground">D33</div>
                              </div>
                            </div>
                            
                            {job.matchBreakdown.details && (
                              <div className="space-y-2 mt-3">
                                {job.matchBreakdown.details.matching_skills && job.matchBreakdown.details.matching_skills.length > 0 && (
                                  <div>
                                    <span className="text-sm font-medium text-green-700">Matching Skills: </span>
                                    <span className="text-sm text-green-600">
                                      {job.matchBreakdown.details.matching_skills.join(', ')}
                                    </span>
                                  </div>
                                )}
                                {job.matchBreakdown.details.missing_skills && job.matchBreakdown.details.missing_skills.length > 0 && (
                                  <div>
                                    <span className="text-sm font-medium text-amber-700">Skills to Develop: </span>
                                    <span className="text-sm text-amber-600">
                                      {job.matchBreakdown.details.missing_skills.join(', ')}
                                    </span>
                                  </div>
                                )}
                                {job.matchBreakdown.details.recommendation && (
                                  <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                                    <strong>AI Recommendation:</strong> {job.matchBreakdown.details.recommendation}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Requirements */}
                    {job.requirements && job.requirements.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Requirements:</h4>
                        <div className="flex flex-wrap gap-2">
                          {job.requirements.slice(0, 5).map((req, index) => {
                            // Handle both string and object formats
                            const reqText = typeof req === 'string' 
                              ? req 
                              : (req as any)?.description || (req as any)?.category || 'Requirement';
                            return (
                              <Badge key={index} variant="outline" className="text-xs">
                                {reqText}
                              </Badge>
                            );
                          })}
                          {job.requirements.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{job.requirements.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end space-x-2 pt-4 border-t">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button size="sm" onClick={() => handleApply(job.id)}>
                        Apply Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobMatches;
