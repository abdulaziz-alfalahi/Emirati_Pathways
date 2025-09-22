
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Flame, Lightbulb, Rocket } from 'lucide-react';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
}

const mockRecommendations: Recommendation[] = [
  {
    id: '1',
    title: 'Enhance Communication Skills',
    description: 'Participate in workshops to improve verbal and written communication.',
    priority: 'high',
    action: 'Enroll in a communication workshop'
  },
  {
    id: '2',
    title: 'Develop Leadership Abilities',
    description: 'Take on leadership roles in team projects to gain practical experience.',
    priority: 'medium',
    action: 'Volunteer to lead a project team'
  },
  {
    id: '3',
    title: 'Improve Technical Proficiency',
    description: 'Complete online courses to enhance your technical skills.',
    priority: 'low',
    action: 'Sign up for a relevant online course'
  }
];

export const CoachingRecommendations: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Coaching Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockRecommendations.map((recommendation) => (
          <div key={recommendation.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold">{recommendation.title}</h3>
              <Badge variant={
                recommendation.priority === 'high' ? 'destructive' :
                recommendation.priority === 'medium' ? 'default' : 'secondary'
              }>
                {recommendation.priority}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{recommendation.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm">Action: {recommendation.action}</span>
              <button className="text-blue-500 hover:underline">Take Action</button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
