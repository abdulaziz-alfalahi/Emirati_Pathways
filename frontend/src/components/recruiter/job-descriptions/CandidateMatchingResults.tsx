import React, { useState } from 'react';
import { getDisplayName } from '@/utils/nameUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Star,
  MapPin,
  Briefcase,
  Mail,
  Phone,
  ExternalLink,
  UserPlus,
  Eye,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

interface MatchedCandidate {
  candidate: {
    candidate_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    emirate?: string;
    nationality?: string;
    is_uae_national?: boolean;
    education_level?: string;
    experience_years?: number;
    current_position?: string;
    current_company?: string;
    employment_status?: string;
    skills?: string[];
    cv_url?: string;
    linkedin_url?: string;
  };
  match_score: number;
  score_breakdown: {
    skills?: number;
    experience?: number;
    education?: number;
    location?: number;
    uae_national?: number;
  };
  matching_skills: string[];
  missing_skills: string[];
  strengths: string[];
  concerns: string[];
}

interface CandidateMatchingResultsProps {
  candidates: MatchedCandidate[];
  employmentStatusFilter: string;
  onFilterChange: (filter: string) => void;
  onRefresh: () => void;
  onShortlist: (candidateId: string) => void;
  onViewProfile: (candidateId: string) => void;
  loading?: boolean;
  className?: string;
}

const CandidateMatchingResults: React.FC<CandidateMatchingResultsProps> = ({
  candidates,
  employmentStatusFilter,
  onFilterChange,
  onRefresh,
  onShortlist,
  onViewProfile,
  loading = false,
  className = ''
}) => {
  const [sortBy, setSortBy] = useState<'score' | 'experience' | 'location'>('score');

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'outline';
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatEmploymentStatus = (status?: string) => {
    if (!status) return 'Unknown';
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const sortedCandidates = [...candidates].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return b.match_score - a.match_score;
      case 'experience':
        return (b.candidate.experience_years || 0) - (a.candidate.experience_years || 0);
      case 'location':
        return (a.candidate.emirate || '').localeCompare(b.candidate.emirate || '');
      default:
        return 0;
    }
  });

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Matched Candidates
              </CardTitle>
              <CardDescription>
                {candidates.length} candidates found matching your job description
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Employment Status Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">
                Employment Status
              </label>
              <Select value={employmentStatusFilter} onValueChange={onFilterChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Candidates</SelectItem>
                  <SelectItem value='candidate'>Job Seekers Only</SelectItem>
                  <SelectItem value="employed">Currently Employed</SelectItem>
                  <SelectItem value="open_to_opportunities">Open to Opportunities</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">
                Sort By
              </label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">Match Score</SelectItem>
                  <SelectItem value="experience">Experience</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Candidates List */}
      {loading ? (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Finding matching candidates...</p>
            </div>
          </CardContent>
        </Card>
      ) : sortedCandidates.length === 0 ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No matching candidates found. Try adjusting your employment status filter or refining your job description.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {sortedCandidates.map((match, index) => (
            <Card key={match.candidate.candidate_id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Candidate Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${getDisplayName(match.candidate)}`} />
                          <AvatarFallback>
                            {getInitials(match.candidate.first_name, match.candidate.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {getDisplayName(match.candidate)}
                            {match.candidate.is_uae_national && (
                              <Badge variant="outline" className="ml-2">
                                UAE National
                              </Badge>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {match.candidate.current_position || 'Position not specified'}
                            {match.candidate.current_company && ` at ${match.candidate.current_company}`}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {match.candidate.experience_years && (
                              <Badge variant="secondary" className="text-xs">
                                <Briefcase className="h-3 w-3 mr-1" />
                                {match.candidate.experience_years} years exp.
                              </Badge>
                            )}
                            {match.candidate.emirate && (
                              <Badge variant="secondary" className="text-xs">
                                <MapPin className="h-3 w-3 mr-1" />
                                {match.candidate.emirate}
                              </Badge>
                            )}
                            {match.candidate.employment_status && (
                              <Badge variant="outline" className="text-xs">
                                {formatEmploymentStatus(match.candidate.employment_status)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Match Score Badge */}
                      <div className="text-center">
                        <Badge 
                          variant={getScoreVariant(match.match_score)}
                          className="text-lg px-3 py-1"
                        >
                          <Star className="h-4 w-4 mr-1" />
                          {match.match_score.toFixed(0)}%
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">Match Score</p>
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    {match.score_breakdown && Object.keys(match.score_breakdown).length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Score Breakdown</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {Object.entries(match.score_breakdown).map(([key, value]) => (
                            <div key={key} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="capitalize">{key.replace('_', ' ')}</span>
                                <span className={getScoreColor(value)}>{value}%</span>
                              </div>
                              <Progress value={value} className="h-1" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Strengths */}
                    {match.strengths.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-green-600 mb-2 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Strengths
                        </h4>
                        <ul className="space-y-1">
                          {match.strengths.slice(0, 3).map((strength, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start">
                              <span className="mr-2">•</span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Matching Skills */}
                    {match.matching_skills.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Matching Skills</h4>
                        <div className="flex flex-wrap gap-1">
                          {match.matching_skills.slice(0, 8).map((skill, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {match.matching_skills.length > 8 && (
                            <Badge variant="outline" className="text-xs">
                              +{match.matching_skills.length - 8} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Concerns */}
                    {match.concerns.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-yellow-600 mb-2 flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Considerations
                        </h4>
                        <ul className="space-y-1">
                          {match.concerns.slice(0, 2).map((concern, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start">
                              <span className="mr-2">•</span>
                              <span>{concern}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <Separator className="md:hidden" />
                  <div className="flex md:flex-col gap-2 justify-end">
                    <Button
                      size="sm"
                      onClick={() => onViewProfile(match.candidate.candidate_id)}
                      variant="outline"
                      className="flex-1 md:flex-none"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Profile
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onShortlist(match.candidate.candidate_id)}
                      className="flex-1 md:flex-none"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Shortlist
                    </Button>
                    {match.candidate.cv_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="flex-1 md:flex-none"
                      >
                        <a href={match.candidate.cv_url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" />
                          CV
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {sortedCandidates.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">
                  {sortedCandidates.length}
                </p>
                <p className="text-xs text-muted-foreground">Total Matches</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {sortedCandidates.filter(c => c.match_score >= 80).length}
                </p>
                <p className="text-xs text-muted-foreground">Excellent Matches</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {(sortedCandidates.reduce((sum, c) => sum + c.match_score, 0) / sortedCandidates.length).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">Avg. Match Score</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {sortedCandidates.filter(c => c.candidate.is_uae_national).length}
                </p>
                <p className="text-xs text-muted-foreground">UAE Nationals</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CandidateMatchingResults;

