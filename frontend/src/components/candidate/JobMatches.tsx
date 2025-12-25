import React, { useState, useEffect } from 'react';
import { restClient } from '@/utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  TrendingUp
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  matchScore: number;
  description: string;
  requirements: string[];
  benefits: string[];
  postedDate: string;
  isBookmarked?: boolean;
}

interface JobMatchesProps {
  candidateProfile?: any;
}

const JobMatches: React.FC<JobMatchesProps> = ({ candidateProfile }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high-match' | 'recent'>('all');
  const [bookmarkedJobs, setBookmarkedJobs] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadJobMatches();
  }, [candidateProfile]);

  const loadJobMatches = async () => {
    setLoading(true);
    try {
      const response = await restClient.get('/api/candidate/job-matches');

      if (response.data.success) {
        setJobs(response.data.jobs || []);
      } else {
        console.error('Failed to load job matches:', response.data.error);
        // throw new Error(response.data.error); // Fallback to mock data on error
      }
    } catch (error) {
      console.error('Error loading job matches:', error);
      // Set mock data for demonstration
      setJobs([
        {
          id: '1',
          title: 'Senior Software Engineer',
          company: 'ADNOC Digital',
          location: 'Abu Dhabi, UAE',
          type: 'full-time',
          salary: 'AED 15,000 - 20,000',
          matchScore: 95,
          description: 'Join our digital transformation team to build cutting-edge solutions for the energy sector.',
          requirements: ['React', 'Node.js', 'TypeScript', '5+ years experience'],
          benefits: ['Health Insurance', 'Annual Bonus', 'Professional Development'],
          postedDate: '2024-09-10'
        },
        {
          id: '2',
          title: 'Data Analyst',
          company: 'Emirates NBD',
          location: 'Dubai, UAE',
          type: 'full-time',
          salary: 'AED 12,000 - 16,000',
          matchScore: 87,
          description: 'Analyze financial data to drive business insights and strategic decisions.',
          requirements: ['Python', 'SQL', 'Power BI', '3+ years experience'],
          benefits: ['Banking Benefits', 'Training Programs', 'Career Growth'],
          postedDate: '2024-09-12'
        },
        {
          id: '3',
          title: 'UX Designer',
          company: 'Careem',
          location: 'Dubai, UAE',
          type: 'full-time',
          salary: 'AED 10,000 - 14,000',
          matchScore: 82,
          description: 'Design user experiences for millions of users across the MENA region.',
          requirements: ['Figma', 'User Research', 'Prototyping', '2+ years experience'],
          benefits: ['Flexible Hours', 'Stock Options', 'Learning Budget'],
          postedDate: '2024-09-11'
        },
        {
          id: '4',
          title: 'Marketing Specialist',
          company: 'Dubai Tourism',
          location: 'Dubai, UAE',
          type: 'full-time',
          salary: 'AED 8,000 - 12,000',
          matchScore: 78,
          description: 'Promote Dubai as a world-class tourism destination through digital marketing.',
          requirements: ['Digital Marketing', 'Social Media', 'Content Creation', '2+ years experience'],
          benefits: ['Government Benefits', 'Travel Opportunities', 'Training'],
          postedDate: '2024-09-09'
        },
        {
          id: '5',
          title: 'Project Manager',
          company: 'DP World',
          location: 'Dubai, UAE',
          type: 'full-time',
          salary: 'AED 18,000 - 25,000',
          matchScore: 75,
          description: 'Lead infrastructure projects for one of the world\'s largest port operators.',
          requirements: ['PMP Certification', 'Project Management', '7+ years experience'],
          benefits: ['International Exposure', 'Leadership Development', 'Bonus'],
          postedDate: '2024-09-08'
        }
      ]);
    } finally {
      setLoading(false);
    }
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
        cover_letter: 'Immediate application from Candidate Dashboard'
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
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
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

  const filteredJobs = jobs.filter(job => {
    switch (filter) {
      case 'high-match':
        return job.matchScore >= 85;
      case 'recent':
        const jobDate = new Date(job.postedDate);
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        return jobDate >= threeDaysAgo;
      default:
        return true;
    }
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
            <p className="text-muted-foreground">Finding your perfect job matches...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Job Matches</span>
              </CardTitle>
              <CardDescription>
                Jobs matched to your profile and preferences
              </CardDescription>
            </div>
            <div className="flex space-x-2">
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
                High Match
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
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold">{job.title}</h3>
                        <Badge className={getMatchScoreColor(job.matchScore)}>
                          {job.matchScore}% match
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Requirements:</h4>
                      <div className="flex flex-wrap gap-1">
                        {job.requirements.map((req, index) => {
                          const text = typeof req === 'string' ? req : (req.description || req.name || req.title || 'Requirement');
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
                          const text = typeof benefit === 'string' ? benefit : (benefit.description || benefit.name || benefit.title || 'Benefit');
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
                    >
                      Apply Now
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
              <p className="text-muted-foreground">
                Try adjusting your filters or update your profile for better matches.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JobMatches;

