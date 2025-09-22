
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Clock, Users } from 'lucide-react';

const pathways = [
  {
    title: 'Data Science Career Path',
    description: 'Master data analysis, machine learning, and statistical modeling',
    duration: '6-12 months',
    level: 'Intermediate',
    enrolledCount: 1250,
    modules: ['Python Programming', 'Statistics', 'Machine Learning', 'Data Visualization']
  },
  {
    title: 'Digital Marketing Specialist',
    description: 'Learn SEO, social media marketing, and analytics',
    duration: '3-6 months',
    level: 'Beginner',
    enrolledCount: 2100,
    modules: ['SEO Fundamentals', 'Social Media Strategy', 'Google Analytics', 'Content Marketing']
  },
  {
    title: 'Cloud Solutions Architect',
    description: 'Design and implement cloud infrastructure solutions',
    duration: '8-15 months',
    level: 'Advanced',
    enrolledCount: 850,
    modules: ['AWS/Azure Basics', 'Infrastructure as Code', 'DevOps', 'Security']
  }
];

export const LearningPathways: React.FC = () => {
  return (
    <div className="space-y-6">
      {pathways.map((pathway, index) => (
        <Card key={index} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">{pathway.title}</h3>
              <p className="text-muted-foreground mb-3">{pathway.description}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {pathway.duration}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {pathway.enrolledCount.toLocaleString()} enrolled
                </div>
              </div>
            </div>
            <Badge variant={pathway.level === 'Advanced' ? 'default' : 'secondary'}>
              {pathway.level}
            </Badge>
          </div>
          <div className="mb-4">
            <h4 className="font-medium mb-2">Key Modules:</h4>
            <div className="flex flex-wrap gap-2">
              {pathway.modules.map((module, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {module}
                </Badge>
              ))}
            </div>
          </div>
          <Button className="w-full">
            Start Learning Path <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Card>
      ))}
    </div>
  );
};
