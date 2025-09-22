// Enhanced Job Matching Components with Real API Integration
// These components replace the mock data implementations with real API calls

// src/components/job-matching/JobMatchingDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Target, 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Star, 
  Clock, 
  Building, 
  Users,
  TrendingUp,
  Eye,
  Heart,
  Send,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { JobMatch, UserProfile, ApiResponse } from '@/types/platform';
import { matchingApi, handleApiError } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

interface MatchingStats {
  totalMatches: number;
  newThisWeek: number;
  profileCompleteness: number;
  matchAccuracy: number;
  applicationsSubmitted: number;
  interviewsScheduled: number;
}

interface DashboardInsight {
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  actionUrl?: string;
}

export function JobMatchingDashboard() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [stats, setStats] = useState<MatchingStats | null>(null);
  const [insights, setInsights] = useState<DashboardInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    if (!user?.id) return;

    try {
      setError(null);
      
      // Fetch job matches for the user
      const matchResponse = await matchingApi.findJobsForCandidate(user.id, {
        limit: 10,
        threshold: 60
      });

      if (matchResponse.success && matchResponse.data) {
        setMatches(matchResponse.data);
      }

      // Calculate stats from matches and user data
      const calculatedStats: MatchingStats = {
        totalMatches: matchResponse.data?.length || 0,
        newThisWeek: matchResponse.data?.filter(match => {
          const matchDate = new Date(match.match_timestamp);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return matchDate > weekAgo;
        }).length || 0,
        profileCompleteness: calculateProfileCompleteness(),
        matchAccuracy: calculateAverageMatchScore(matchResponse.data || []),
        applicationsSubmitted: 0, // This would come from application tracking
        interviewsScheduled: 0 // This would come from interview tracking
      };

      setStats(calculatedStats);

      // Generate insights based on data
      const generatedInsights = generateInsights(calculatedStats, matchResponse.data || []);
      setInsights(generatedInsights);

    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateProfileCompleteness = (): number => {
    // This would calculate based on user's CV data
    // For now, return a placeholder
    return 85;
  };

  const calculateAverageMatchScore = (matches: JobMatch[]): number => {
    if (matches.length === 0) return 0;
    const totalScore = matches.reduce((sum, match) => sum + match.overall_score, 0);
    return Math.round(totalScore / matches.length);
  };

  const generateInsights = (stats: MatchingStats, matches: JobMatch[]): DashboardInsight[] => {
    const insights: DashboardInsight[] = [];

    if (stats.profileCompleteness < 90) {
      insights.push({
        title: 'Profile Optimization',
        description: `Complete your profile to increase match accuracy by ${100 - stats.profileCompleteness}%`,
        action: 'Update Profile',
        priority: 'high',
        actionUrl: '/cv-builder'
      });
    }

    if (matches.length > 0) {
      const topSkills = extractTopMissingSkills(matches);
      if (topSkills.length > 0) {
        insights.push({
          title: 'Skill Development',
          description: `Learning ${topSkills.slice(0, 2).join(' and ')} could improve your match scores`,
          action: 'Explore Courses',
          priority: 'medium'
        });
      }
    }

    if (stats.newThisWeek === 0) {
      insights.push({
        title: 'New Opportunities',
        description: 'No new matches this week. Consider updating your preferences or skills',
        action: 'Refresh Matches',
        priority: 'low'
      });
    }

    return insights;
  };

  const extractTopMissingSkills = (matches: JobMatch[]): string[] => {
    const missingSkills: Record<string, number> = {};
    
    matches.forEach(match => {
      match.match_details.skills.missing.forEach(skill => {
        missingSkills[skill] = (missingSkills[skill] || 0) + 1;
      });
    });

    return Object.entries(missingSkills)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([skill]) => skill);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  const handleJobAction = async (jobId: string, action: 'view' | 'save' | 'apply') => {
    try {
      switch (action) {
        case 'view':
          // Navigate to job details
          window.open(`/jobs/${jobId}`, '_blank');
          break;
        case 'save':
          // Save job to favorites
          console.log(`Saving job ${jobId}`);
          break;
        case 'apply':
          // Start application process
          console.log(`Applying to job ${jobId}`);
          break;
      }
    } catch (err) {
      console.error(`Error performing ${action} on job ${jobId}:`, err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Job Matching Dashboard</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="flex justify-between items-center">
            <span>Failed to load dashboard data: {error}</span>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Job Matching Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Discover opportunities tailored to your profile
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Matches</p>
                <p className="text-3xl font-bold text-blue-600">{stats?.totalMatches || 0}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                {stats?.newThisWeek || 0} new this week
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Profile Completeness</p>
                <p className="text-3xl font-bold text-green-600">{stats?.profileCompleteness || 0}%</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2">
              <Progress value={stats?.profileCompleteness || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Match Accuracy</p>
                <p className="text-3xl font-bold text-purple-600">{stats?.matchAccuracy || 0}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                Based on {matches.length} matches
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Applications</p>
                <p className="text-3xl font-bold text-orange-600">{stats?.applicationsSubmitted || 0}</p>
              </div>
              <Send className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                {stats?.interviewsScheduled || 0} interviews scheduled
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span>Personalized Insights</span>
            </CardTitle>
            <CardDescription>
              Recommendations to improve your job matching results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border ${
                    insight.priority === 'high' ? 'border-red-200 bg-red-50' :
                    insight.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                    'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{insight.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={insight.priority === 'high' ? 'destructive' : 
                                insight.priority === 'medium' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {insight.priority} priority
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => insight.actionUrl && window.open(insight.actionUrl, '_blank')}
                      >
                        {insight.action}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Matches */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Top Job Matches</CardTitle>
              <CardDescription>
                Jobs that best match your profile and preferences
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => window.open('/jobs', '_blank')}>
              View All Matches
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
              <p className="text-gray-600 mb-4">
                Complete your profile to start receiving job recommendations
              </p>
              <Button onClick={() => window.open('/cv-builder', '_blank')}>
                Complete Profile
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.slice(0, 5).map((match) => (
                <div 
                  key={match.job_id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {match.job_title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center">
                          <Building className="h-4 w-4 mr-1" />
                          {match.company}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {match.location}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(match.match_timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {match.overall_score}%
                      </div>
                      <div className="text-xs text-gray-500">Match Score</div>
                    </div>
                  </div>

                  {/* Match Details */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
                    <div className="text-center">
                      <div className="text-sm font-medium">Skills</div>
                      <div className="text-lg font-bold text-blue-600">
                        {match.category_scores.skills}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">Experience</div>
                      <div className="text-lg font-bold text-purple-600">
                        {match.category_scores.experience}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">Education</div>
                      <div className="text-lg font-bold text-orange-600">
                        {match.category_scores.education}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">Location</div>
                      <div className="text-lg font-bold text-green-600">
                        {match.category_scores.location}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">Languages</div>
                      <div className="text-lg font-bold text-red-600">
                        {match.category_scores.languages}%
                      </div>
                    </div>
                  </div>

                  {/* Matched Skills */}
                  {match.match_details.skills.matched.length > 0 && (
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">Matched Skills:</div>
                      <div className="flex flex-wrap gap-1">
                        {match.match_details.skills.matched.slice(0, 5).map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {match.match_details.skills.matched.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{match.match_details.skills.matched.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleJobAction(match.job_id, 'view')}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleJobAction(match.job_id, 'save')}
                    >
                      <Heart className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleJobAction(match.job_id, 'apply')}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Apply Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

