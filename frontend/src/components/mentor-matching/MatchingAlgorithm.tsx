
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Brain, Users } from 'lucide-react';

export const MatchingAlgorithm: React.FC = () => {
  const matchFactors = [
    { factor: 'Career Goals Alignment', weight: 95, description: 'How well mentor\'s experience matches your goals' },
    { factor: 'Industry Experience', weight: 88, description: 'Relevant industry background and insights' },
    { factor: 'Communication Style', weight: 82, description: 'Compatible mentoring and learning preferences' },
    { factor: 'Availability Match', weight: 79, description: 'Scheduling compatibility and time zones' },
    { factor: 'Skill Development Focus', weight: 85, description: 'Alignment on specific skills to develop' }
  ];

  const topMatches = [
    { name: 'Sarah Al-Mansouri', score: 96, compatibility: 'Excellent' },
    { name: 'Ahmed Hassan', score: 89, compatibility: 'Very Good' },
    { name: 'Fatima Al-Zahra', score: 84, compatibility: 'Good' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-ehrdc-teal" />
            AI-Powered Matching Algorithm
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-4">Matching Factors & Weights</h3>
            <div className="space-y-4">
              {matchFactors.map((factor, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{factor.factor}</span>
                    <span className="text-sm font-semibold">{factor.weight}%</span>
                  </div>
                  <Progress value={factor.weight} className="h-2" />
                  <p className="text-xs text-muted-foreground">{factor.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Your Top Matches</h3>
            <div className="space-y-3">
              {topMatches.map((match, index) => (
                <Card key={index} className="border border-ehrdc-neutral-light">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{match.name}</h4>
                        <Badge variant={match.compatibility === 'Excellent' ? 'default' : 
                                     match.compatibility === 'Very Good' ? 'secondary' : 'outline'}>
                          {match.compatibility} Match
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-ehrdc-teal">{match.score}%</div>
                        <div className="text-xs text-muted-foreground">Compatibility</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
