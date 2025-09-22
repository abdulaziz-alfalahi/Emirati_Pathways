
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, CheckCircle } from 'lucide-react';

export const NegotiationGuidance: React.FC = () => {
  const negotiationTips = [
    {
      phase: 'Research',
      tips: ['Know your market value', 'Research company salary ranges', 'Gather industry benchmarks'],
      priority: 'high'
    },
    {
      phase: 'Preparation',
      tips: ['Document your achievements', 'Prepare specific examples', 'Set your target range'],
      priority: 'high'
    },
    {
      phase: 'Negotiation',
      tips: ['Start with total compensation', 'Be flexible on benefits', 'Consider timing'],
      priority: 'medium'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-ehrdc-teal" />
          Salary Negotiation Guidance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {negotiationTips.map((phase, index) => (
          <Card key={index} className="border border-ehrdc-neutral-light">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">{phase.phase}</h3>
                <Badge variant={phase.priority === 'high' ? 'destructive' : 'secondary'}>
                  {phase.priority === 'high' ? 'High Priority' : 'Medium Priority'}
                </Badge>
              </div>
              <ul className="space-y-2">
                {phase.tips.map((tip, tipIndex) => (
                  <li key={tipIndex} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
        
        <Button className="w-full bg-ehrdc-teal hover:bg-ehrdc-dark-teal">
          Download Negotiation Checklist
        </Button>
      </CardContent>
    </Card>
  );
};
