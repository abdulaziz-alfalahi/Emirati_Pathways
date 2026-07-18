
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, MessageCircle, Award, Download, ExternalLink } from 'lucide-react';

const resources = [
  {
    id: '1',
    title: 'Mentoring Best Practices Guide',
    description: 'Comprehensive guide covering effective mentoring techniques and communication strategies.',
    type: 'guide',
    icon: BookOpen,
    downloadUrl: '#',
    category: 'Getting Started'
  },
  {
    id: '2',
    title: 'Cultural Sensitivity in Mentoring',
    description: 'Understanding cultural nuances when mentoring in the UAE and across diverse backgrounds.',
    type: 'guide',
    icon: Users,
    downloadUrl: '#',
    category: 'Cultural Awareness'
  },
  {
    id: '3',
    title: 'Effective Communication Techniques',
    description: 'Master the art of active listening, giving feedback, and motivating your mentees.',
    type: 'video',
    icon: MessageCircle,
    downloadUrl: '#',
    category: 'Communication'
  },
  {
    id: '4',
    title: 'Goal Setting and Progress Tracking',
    description: 'Tools and frameworks for helping mentees set achievable goals and track their progress.',
    type: 'toolkit',
    icon: Award,
    downloadUrl: '#',
    category: 'Goal Setting'
  }
];

export const MentorResources: React.FC = () => {
  const getIconComponent = (IconComponent: any) => IconComponent;

  return (
    <div className="space-y-6">
      <div className="text-center py-6">
        <BookOpen className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Enhance Your Mentoring Skills</h3>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Access curated resources, guides, and tools to become a more effective mentor 
          and create meaningful impact in your mentees' lives.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {resources.map((resource) => {
          const IconComponent = getIconComponent(resource.icon);
          return (
            <Card key={resource.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <IconComponent className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{resource.category}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{resource.description}</p>
                
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1">
                    <Download className="h-4 w-4 me-2" />
                    Download
                  </Button>
                  <Button size="sm" variant="outline">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="bg-blue-50 p-6 rounded-lg">
        <h4 className="font-semibold mb-2">Need More Support?</h4>
        <p className="text-muted-foreground mb-4">
          Join our mentor community forum to connect with other mentors, share experiences, 
          and get support from experienced mentoring professionals.
        </p>
        <Button>
          <Users className="h-4 w-4 me-2" />
          Join Mentor Community
        </Button>
      </div>
    </div>
  );
};
