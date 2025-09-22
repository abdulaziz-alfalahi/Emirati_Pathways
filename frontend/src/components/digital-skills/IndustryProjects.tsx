
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, Clock, Users, Award } from 'lucide-react';

const projects = [
  {
    title: 'E-commerce Analytics Dashboard',
    company: 'Dubai Mall',
    description: 'Build a comprehensive analytics dashboard for online retail data',
    duration: '4-6 weeks',
    teamSize: '3-4 people',
    skills: ['Python', 'Data Visualization', 'SQL', 'Business Intelligence'],
    difficulty: 'Intermediate',
    participants: 24
  },
  {
    title: 'Smart City IoT System',
    company: 'Dubai Municipality',
    description: 'Develop IoT sensors and dashboard for city infrastructure monitoring',
    duration: '6-8 weeks',
    teamSize: '4-5 people',
    skills: ['IoT', 'Cloud Computing', 'Data Analytics', 'Mobile Apps'],
    difficulty: 'Advanced',
    participants: 18
  },
  {
    title: 'Digital Marketing Campaign',
    company: 'Emirates Group',
    description: 'Create and execute a comprehensive digital marketing strategy',
    duration: '3-4 weeks',
    teamSize: '2-3 people',
    skills: ['Digital Marketing', 'Analytics', 'Content Creation', 'SEO'],
    difficulty: 'Beginner',
    participants: 32
  }
];

export const IndustryProjects: React.FC = () => {
  return (
    <div className="space-y-6">
      {projects.map((project, index) => (
        <Card key={index} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
              <div className="flex items-center gap-2 mb-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{project.company}</span>
              </div>
              <p className="text-muted-foreground">{project.description}</p>
            </div>
            <Badge variant={project.difficulty === 'Advanced' ? 'default' : 'secondary'}>
              {project.difficulty}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{project.duration}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{project.teamSize}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="h-4 w-4" />
              <span>{project.participants} participants</span>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="font-medium mb-2">Required Skills:</h4>
            <div className="flex flex-wrap gap-2">
              {project.skills.map((skill, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <Button className="w-full">
            Apply for Project
          </Button>
        </Card>
      ))}
    </div>
  );
};
