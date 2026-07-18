
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, Users, Building } from 'lucide-react';

export const EmiratizationOpportunities: React.FC = () => {
  const opportunities = [
    {
      id: 1,
      title: 'Banking & Finance',
      target: '75%',
      current: '68%',
      positions: 1250,
      trend: 'up',
      description: 'Focus on digital banking, fintech, and investment sectors'
    },
    {
      id: 2,
      title: 'Technology & Innovation',
      target: '60%',
      current: '45%',
      positions: 980,
      trend: 'up',
      description: 'AI, cybersecurity, and digital transformation roles'
    },
    {
      id: 3,
      title: 'Healthcare',
      target: '70%',
      current: '55%',
      positions: 750,
      trend: 'up',
      description: 'Medical professionals and healthcare administration'
    },
    {
      id: 4,
      title: 'Education',
      target: '80%',
      current: '72%',
      positions: 650,
      trend: 'stable',
      description: 'Teaching, research, and educational leadership'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-ehrdc-teal" />
            Emiratization Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Explore sectors with active Emiratization initiatives and career opportunities for UAE nationals.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {opportunities.map((opportunity) => (
              <Card key={opportunity.id} className="border border-ehrdc-neutral-light">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-lg">{opportunity.title}</h3>
                    <Badge variant={opportunity.trend === 'up' ? 'default' : 'secondary'}>
                      <TrendingUp className="h-3 w-3 me-1" />
                      {opportunity.trend}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4">{opportunity.description}</p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Emiratization Target</span>
                      <span className="font-medium text-ehrdc-teal">{opportunity.target}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Current Level</span>
                      <span className="font-medium">{opportunity.current}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Open Positions</span>
                      <span className="font-medium">{opportunity.positions}</span>
                    </div>
                  </div>
                  
                  <Button className="w-full mt-4 bg-ehrdc-teal hover:bg-ehrdc-dark-teal">
                    View Opportunities
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
