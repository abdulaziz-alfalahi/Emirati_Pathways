// src/components/job-matching/JobRecommendations.tsx (Enhanced Integration)
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Briefcase, 
  MapPin, 
  Building, 
  DollarSign, 
  Clock, 
  Star,
  TrendingUp,
  Eye,
  Heart,
  Send,
  Filter,
  SortDesc
} from 'lucide-react';
import { JobMatch } from '@/types/platform';

interface JobRecommendationsProps {
  matches: JobMatch[];
  onJobAction: (jobId: string, action: 'view' | 'save' | 'apply') => void;
  loading?: boolean;
}

export function JobRecommendations({ matches, onJobAction, loading = false }: JobRecommendationsProps) {
  const [filteredMatches, setFilteredMatches] = useState<JobMatch[]>(matches);
  const [sortBy, setSortBy] = useState<'score' | 'date' | 'company'>('score');
  const [filterBy, setFilterBy] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let filtered = [...matches];

    // Apply filters
    if (filterBy !== 'all') {
      filtered = filtered.filter(match => {
        if (filterBy === 'high') return match.overall_score >= 80;
        if (filterBy === 'medium') return match.overall_score >= 60 && match.overall_score < 80;
        if (filterBy === 'low') return match.overall_score < 60;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.overall_score - a.overall_score;
        case 'date':
          return new Date(b.match_timestamp).getTime() - new Date(a.match_timestamp).getTime();
        case 'company':
          return a.company.localeCompare(b.company);
        default:
          return 0;
      }
    });

    setFilteredMatches(filtered);
  }, [matches, sortBy, filterBy]);

  const getMatchQuality = (score: number): { label: string; color: string } => {
    if (score >= 80) return { label: 'Excellent Match', color: 'text-green-600 bg-green-50 border-green-200' };
    if (score >= 60) return { label: 'Good Match', color: 'text-blue-600 bg-blue-50 border-blue-200' };
    return { label: 'Potential Match', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Job Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse border rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5" />
                <span>Job Recommendations</span>
              </CardTitle>
              <CardDescription>
                {filteredMatches.length} jobs matched to your profile
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
              </Button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="score">Sort by Match Score</option>
                <option value="date">Sort by Date</option>
                <option value="company">Sort by Company</option>
              </select>
            </div>
          </div>
          
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex space-x-4">
                <div>
                  <label className="text-sm font-medium">Match Quality:</label>
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value as any)}
                    className="ml-2 px-2 py-1 border rounded text-sm"
                  >
                    <option value="all">All Matches</option>
                    <option value="high">Excellent (80%+)</option>
                    <option value="medium">Good (60-79%)</option>
                    <option value="low">Potential (&lt;60%)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {filteredMatches.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
              <p className="text-gray-600">
                Try adjusting your filters or updating your profile to see more opportunities.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMatches.map((match) => {
                const matchQuality = getMatchQuality(match.overall_score);
                
                return (
                  <Card key={match.job_id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">
                              {match.job_title}
                            </h3>
                            <Badge className={matchQuality.color}>
                              {matchQuality.label}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
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
                              {formatDate(match.match_timestamp)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-3xl font-bold text-green-600 mb-1">
                            {match.overall_score}%
                          </div>
                          <div className="text-sm text-gray-500">Match Score</div>
                        </div>
                      </div>

                      {/* Detailed Score Breakdown */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                        {Object.entries(match.category_scores).map(([category, score]) => (
                          <div key={category} className="text-center">
                            <div className="text-sm font-medium capitalize text-gray-700 mb-1">
                              {category}
                            </div>
                            <div className="relative">
                              <Progress value={score} className="h-2 mb-1" />
                              <div className="text-xs font-medium text-gray-600">
                                {score}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Skills Match Details */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-medium text-gray-700">Skills Match</h4>
                          <span className="text-xs text-gray-500">
                            {match.match_details.skills.matched.length} of {
                              match.match_details.skills.matched.length + match.match_details.skills.missing.length
                            } required skills
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          {match.match_details.skills.matched.length > 0 && (
                            <div>
                              <div className="text-xs text-green-700 mb-1">Matched Skills:</div>
                              <div className="flex flex-wrap gap-1">
                                {match.match_details.skills.matched.slice(0, 6).map((skill, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs bg-green-50 text-green-700">
                                    {skill}
                                  </Badge>
                                ))}
                                {match.match_details.skills.matched.length > 6 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{match.match_details.skills.matched.length - 6} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {match.match_details.skills.missing.length > 0 && (
                            <div>
                              <div className="text-xs text-orange-700 mb-1">Skills to Develop:</div>
                              <div className="flex flex-wrap gap-1">
                                {match.match_details.skills.missing.slice(0, 4).map((skill, index) => (
                                  <Badge key={index} variant="outline" className="text-xs text-orange-600 border-orange-200">
                                    {skill}
                                  </Badge>
                                ))}
                                {match.match_details.skills.missing.length > 4 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{match.match_details.skills.missing.length - 4} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Recommendations */}
                      {match.recommendations && match.recommendations.length > 0 && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">Recommendations</span>
                          </div>
                          <ul className="text-sm text-blue-700 space-y-1">
                            {match.recommendations.slice(0, 2).map((rec, index) => (
                              <li key={index} className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onJobAction(match.job_id, 'view')}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onJobAction(match.job_id, 'save')}
                          >
                            <Heart className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                        </div>
                        
                        <Button 
                          size="sm"
                          onClick={() => onJobAction(match.job_id, 'apply')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Apply Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
