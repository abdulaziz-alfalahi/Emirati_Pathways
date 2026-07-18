
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, MessageCircle, ArrowRight } from 'lucide-react';

const mockOpportunities = [
  {
    id: '1',
    title: 'Recent Graduate Seeking Career Guidance',
    description: 'Computer Science graduate looking for guidance on entering the tech industry in Dubai.',
    skills: ['Software Development', 'Career Planning'],
    urgency: 'high',
    timeCommitment: '2-3 hours/week',
    duration: '3 months'
  },
  {
    id: '2',
    title: 'Marketing Professional Career Transition',
    description: 'Experienced marketer looking to transition into digital marketing and e-commerce.',
    skills: ['Marketing', 'Digital Strategy'],
    urgency: 'medium',
    timeCommitment: '1-2 hours/week',
    duration: '2 months'
  },
  {
    id: '3',
    title: 'Finance Student Seeking Industry Insights',
    description: 'Finance student preparing for entry into investment banking sector.',
    skills: ['Finance', 'Investment', 'Career Guidance'],
    urgency: 'low',
    timeCommitment: '1 hour/week',
    duration: '1 month'
  }
];

export const MentorshipOpportunities: React.FC = () => {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-6">
        <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Help Shape the Future</h3>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Connect with motivated individuals seeking guidance in your area of expertise. 
          Make a meaningful impact on their career journey.
        </p>
      </div>

      <div className="grid gap-4">
        {mockOpportunities.map((opportunity) => (
          <Card key={opportunity.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{opportunity.title}</CardTitle>
                <Badge className={getUrgencyColor(opportunity.urgency)}>
                  {opportunity.urgency} priority
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{opportunity.description}</p>
              
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {opportunity.skills.map((skill) => (
                    <Badge key={skill} variant="outline">{skill}</Badge>
                  ))}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {opportunity.timeCommitment}
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    {opportunity.duration}
                  </div>
                </div>
              </div>
              
              <Button className="w-full mt-4">
                Express Interest
                <ArrowRight className="h-4 w-4 ms-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center py-4">
        <Button variant="outline">Load More Opportunities</Button>
      </div>
    </div>
  );
};
