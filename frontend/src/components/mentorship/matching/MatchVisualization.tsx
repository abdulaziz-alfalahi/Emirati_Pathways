
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Users, Clock, Star, TrendingUp } from 'lucide-react';
import type { MatchSuggestion } from '@/types/mentorship';

interface MatchVisualizationProps {
  suggestion: MatchSuggestion;
  showDetailed?: boolean;
}

export const MatchVisualization: React.FC<MatchVisualizationProps> = ({ 
  suggestion, 
  showDetailed = false 
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="space-y-4">
      {/* Overall Match Score */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Overall Compatibility
          </CardTitle>
          <CardDescription>
            How well this mentor matches your preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Match Score</span>
                <span className="text-2xl font-bold text-primary">
                  {suggestion.compatibility_score}%
                </span>
              </div>
              <Progress 
                value={suggestion.compatibility_score} 
                className="h-3"
              />
            </div>
            <Badge 
              variant={suggestion.compatibility_score >= 80 ? "default" : "secondary"}
              className="text-lg px-3 py-1"
            >
              {getScoreLabel(suggestion.compatibility_score)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Match Breakdown</CardTitle>
          <CardDescription>
            Detailed analysis of compatibility factors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Expertise Match */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Skills & Expertise</span>
              <Badge variant="outline">{suggestion.expertise_match}%</Badge>
            </div>
            <Progress 
              value={suggestion.expertise_match} 
              className="h-2"
            />
            <p className="text-sm text-muted-foreground">
              Alignment between mentor's expertise and your learning goals
            </p>
          </div>

          {/* Schedule Match */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              <span className="font-medium">Schedule Compatibility</span>
              <Badge variant="outline">{suggestion.availability_match}%</Badge>
            </div>
            <Progress 
              value={suggestion.availability_match} 
              className="h-2"
            />
            <p className="text-sm text-muted-foreground">
              How well your schedules align for regular meetings
            </p>
          </div>

          {/* Experience Level */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span className="font-medium">Experience Level</span>
              <Badge variant="outline">{suggestion.experience_compatibility}%</Badge>
            </div>
            <Progress 
              value={suggestion.experience_compatibility} 
              className="h-2"
            />
            <p className="text-sm text-muted-foreground">
              Mentor's experience level matches your career stage
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Match Reasons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-green-500" />
            Why This Match Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {suggestion.match_reasons.map((reason, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                <span className="text-sm">{reason}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Skills Radar Chart Placeholder */}
      {showDetailed && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Skills Alignment</CardTitle>
            <CardDescription>
              Visual representation of skill matches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {suggestion.mentor.expertise.slice(0, 6).map((skill, index) => (
                <div key={skill} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{skill}</span>
                    <span className="text-muted-foreground">
                      {Math.floor(Math.random() * 30) + 70}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.floor(Math.random() * 30) + 70} 
                    className="h-1"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
