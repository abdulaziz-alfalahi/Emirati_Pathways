
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lightbulb, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import type { MatchSuggestion } from '@/types/mentorship';

interface MatchInsightsProps {
  suggestions: MatchSuggestion[];
}

export const MatchInsights: React.FC<MatchInsightsProps> = ({ suggestions }) => {
  const averageScore = suggestions.length > 0 
    ? Math.round(suggestions.reduce((sum, s) => sum + s.compatibility_score, 0) / suggestions.length)
    : 0;

  const topSkills = suggestions
    .flatMap(s => s.mentor.expertise)
    .reduce((acc, skill) => {
      acc[skill] = (acc[skill] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const mostCommonSkills = Object.entries(topSkills)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([skill, count]) => ({ skill, count }));

  const highQualityMatches = suggestions.filter(s => s.compatibility_score >= 80).length;
  const goodMatches = suggestions.filter(s => s.compatibility_score >= 60 && s.compatibility_score < 80).length;

  return (
    <div className="space-y-6">
      {/* Match Quality Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Match Quality Analysis
          </CardTitle>
          <CardDescription>
            Overview of your mentor matching results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{highQualityMatches}</div>
              <div className="text-sm text-muted-foreground">Excellent Matches</div>
              <div className="text-xs text-muted-foreground">(80%+ compatibility)</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{goodMatches}</div>
              <div className="text-sm text-muted-foreground">Good Matches</div>
              <div className="text-xs text-muted-foreground">(60-79% compatibility)</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{averageScore}%</div>
              <div className="text-sm text-muted-foreground">Average Score</div>
              <div className="text-xs text-muted-foreground">Across all matches</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Skills in Your Matches */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Popular Skills Among Your Matches
          </CardTitle>
          <CardDescription>
            Skills that appear most frequently in your mentor suggestions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mostCommonSkills.map(({ skill, count }) => (
              <div key={skill} className="flex items-center justify-between">
                <span className="font-medium">{skill}</span>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={(count / suggestions.length) * 100} 
                    className="w-24 h-2"
                  />
                  <Badge variant="outline">
                    {count}/{suggestions.length} mentors
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {averageScore >= 75 && (
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Great Profile Match</p>
                <p className="text-sm text-green-700">
                  Your preferences are well-defined and match well with available mentors. 
                  Consider reaching out to your top matches soon.
                </p>
              </div>
            </div>
          )}

          {averageScore < 50 && (
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Consider Refining Preferences</p>
                <p className="text-sm text-yellow-700">
                  Your match scores are lower than average. Try expanding your expertise areas 
                  or adjusting your availability preferences.
                </p>
              </div>
            </div>
          )}

          {highQualityMatches === 0 && suggestions.length > 0 && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">Broaden Your Search</p>
                <p className="text-sm text-blue-700">
                  No excellent matches found. Consider adding more expertise areas or 
                  adjusting your experience level preferences.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
