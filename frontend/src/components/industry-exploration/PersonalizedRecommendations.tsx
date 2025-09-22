
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, Users, MapPin } from 'lucide-react';

export const PersonalizedRecommendations: React.FC = () => {
  const recommendations = [
    {
      id: 1,
      industry: 'Financial Services',
      match: '95%',
      role: 'Digital Banking Specialist',
      location: 'Dubai International Financial Centre',
      skills: ['Fintech', 'Digital Transformation', 'Customer Experience'],
      growth: '+25%',
      reason: 'Matches your finance background and digital skills'
    },
    {
      id: 2,
      industry: 'Technology',
      match: '88%',
      role: 'AI Solutions Architect',
      location: 'Dubai Internet City',
      skills: ['Artificial Intelligence', 'Cloud Computing', 'System Design'],
      growth: '+35%',
      reason: 'Aligns with your technical expertise and innovation interest'
    },
    {
      id: 3,
      industry: 'Healthcare Tech',
      match: '82%',
      role: 'Digital Health Product Manager',
      location: 'Dubai Healthcare City',
      skills: ['Product Management', 'Healthcare Systems', 'Data Analytics'],
      growth: '+30%',
      reason: 'Combines your analytical skills with growing healthcare sector'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-ehrdc-teal" />
            Personalized Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Based on your skills, interests, and career goals, here are tailored industry recommendations.
          </p>
          
          <div className="space-y-6">
            {recommendations.map((rec) => (
              <Card key={rec.id} className="border border-ehrdc-neutral-light">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{rec.role}</h3>
                      <p className="text-ehrdc-teal font-medium">{rec.industry}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      {rec.match} Match
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {rec.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      Growth: {rec.growth}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Key Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {rec.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-sm italic text-muted-foreground mb-4">
                    "{rec.reason}"
                  </p>
                  
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-ehrdc-teal hover:bg-ehrdc-dark-teal">
                      Explore Industry
                    </Button>
                    <Button variant="outline" className="flex-1">
                      View Similar Roles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <Button variant="outline">
              Take Skills Assessment for Better Recommendations
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
