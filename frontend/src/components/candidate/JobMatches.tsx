import React, { useState, useEffect, useCallback } from 'react';
import { restClient } from '@/utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Award
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
  const navigate = useNavigate();

  const loadJobMatches = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
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
        console.error('Failed to load job matches:', response.data.error);
      }
    } catch (error) {
      console.error('Error loading job matches:', error);
      // Set mock data for demonstration
      setJobs([
        {
          id: '1',
          title: 'Graduate Trainee - Technology',
          company: 'Emirates NBD',
          location: 'Dubai, UAE',
          type: 'full-time',
          salary: 'AED 8,000 - 12,000',
          matchScore: 85,
          matchBreakdown: {
            skills_match: 30,
            experience_match: 25,
            title_match: 15,
            location_match: 10,
            d33_alignment: 5,
            details: {
              matching_skills: ['Communication', 'Computer Skills'],
              missing_skills: [],
              recommendation: 'Great fit for fresh graduates',
              fit_assessment: 'excellent'
            }
          },
          description: 'Join our graduate trainee program to kickstart your career in banking technology.',
          requirements: ['Bachelor\'s degree', 'Fresh graduate', 'Basic computer skills'],
          benefits: ['Training program', 'Health Insurance', 'Career development'],
          postedDate: '2024-09-10',
          jobLevel: 'trainee'
        },
        {
          id: '2',
          title: 'Junior Software Developer',
          company: 'Careem',
          location: 'Dubai, UAE',
          type: 'full-time',
          salary: 'AED 10,000 - 15,000',
          matchScore: 72,
          matchBreakdown: {
            skills_match: 25,
            experience_match: 20,
            title_match: 12,
            location_match: 10,
            d33_alignment: 5
          },
          description: 'Looking for junior developers to join our engineering team.',
          requirements: ['JavaScript', 'React', '0-2 years experience'],
          benefits: ['Stock Options', 'Flexible Hours', 'Learning budget'],
          postedDate: '2024-09-12',
          jobLevel: 'junior'
        }
      ]);
      setCvLoaded(false);
      setMatchMessage('Showing sample job matches');
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
            <p className="text-muted-foreground">Analyzing your profile and finding best matches...</p>
          </div>
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
                  AI-Powered
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
            {filteredJobs.map((job) => (
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
                              <div className="text-xs text-muted-foreground">Role Match</div>
                            </div>
                            <div className="text-center p-2 bg-white rounded">
                              <div className="text-lg font-bold text-orange-600">{job.matchBreakdown.location_match || 0}/10</div>
                              <div className="text-xs text-muted-foreground">Location</div>
                            </div>
                            <div className="text-center p-2 bg-white rounded">
                              <div className="text-lg font-bold text-teal-600">{job.matchBreakdown.d33_alignment || 0}/5</div>
                              <div className="text-xs text-muted-foreground">D33 Sector</div>
                            </div>
                          </div>
                          
                          {job.matchBreakdown.details && (
                            <div className="space-y-2">
                              {job.matchBreakdown.details.matching_skills && job.matchBreakdown.details.matching_skills.length > 0 && (
                                <div>
                                  <span className="text-sm font-medium text-green-700">✓ Matching Skills: </span>
                                  <span className="text-sm">{job.matchBreakdown.details.matching_skills.join(', ')}</span>
                                </div>
                              )}
                              {job.matchBreakdown.details.missing_skills && job.matchBreakdown.details.missing_skills.length > 0 && (
                                <div>
                                  <span className="text-sm font-medium text-orange-700">○ Skills to Develop: </span>
                                  <span className="text-sm">{job.matchBreakdown.details.missing_skills.join(', ')}</span>
                                </div>
                              )}
                              {job.matchBreakdown.details.recommendation && (
                                <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                                  💡 {job.matchBreakdown.details.recommendation}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Requirements:</h4>
                      <div className="flex flex-wrap gap-1">
                        {job.requirements.map((req, index) => {
                          const text = typeof req === 'string' ? req : ((req as any).description || (req as any).name || 'Requirement');
                          return (
                            <Badge key={index} variant="outline" className="text-xs">
                              {text}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Benefits:</h4>
                      <div className="flex flex-wrap gap-1">
                        {job.benefits.map((benefit, index) => {
                          const text = typeof benefit === 'string' ? benefit : ((benefit as any).description || (benefit as any).name || 'Benefit');
                          return (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {text}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Match Score</span>
                      <span className="font-medium">{job.matchScore}%</span>
                    </div>
                    <Progress value={job.matchScore} className="h-2" />
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleApply(job.id)}
                      className="flex-1"
                      disabled={job.matchScore < 30}
                    >
                      {job.matchScore >= 70 ? 'Apply Now - Great Match!' : 
                       job.matchScore >= 50 ? 'Apply Now' : 
                       job.matchScore >= 30 ? 'Apply Anyway' : 'Not Recommended'}
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No matches found</h3>
              <p className="text-muted-foreground mb-4">
                {experienceFilter !== 'all' 
                  ? `No ${experienceFilter}-level jobs available. Try selecting "All Levels".`
                  : 'Try adjusting your filters or update your CV for better matches.'
                }
              </p>
              <Button variant="outline" onClick={() => {
                setFilter('all');
                setExperienceFilter('all');
              }}>
                Reset Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JobMatches;
