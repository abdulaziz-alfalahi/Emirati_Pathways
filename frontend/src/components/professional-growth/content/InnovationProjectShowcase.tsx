
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Lightbulb, Users, MessageSquare, Heart, Share2, GitBranch } from 'lucide-react';

export interface InnovationProject {
  id: string;
  title: string;
  description: string;
  category: 'technology' | 'sustainability' | 'healthcare' | 'education' | 'finance';
  status: 'ideation' | 'development' | 'testing' | 'implementation' | 'completed';
  progress: number;
  collaborators: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
  }[];
  skills: string[];
  likes: number;
  comments: number;
  shares: number;
  createdBy: {
    name: string;
    title: string;
    avatar?: string;
  };
  timeline: {
    phase: string;
    status: 'completed' | 'current' | 'upcoming';
    date: string;
  }[];
}

const categoryColors = {
  technology: 'bg-blue-100 text-blue-800',
  sustainability: 'bg-green-100 text-green-800',
  healthcare: 'bg-red-100 text-red-800',
  education: 'bg-purple-100 text-purple-800',
  finance: 'bg-yellow-100 text-yellow-800'
};

const statusColors = {
  ideation: 'bg-gray-100 text-gray-800',
  development: 'bg-blue-100 text-blue-800',
  testing: 'bg-yellow-100 text-yellow-800',
  implementation: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800'
};

export const InnovationProjectShowcase: React.FC<{ project: InnovationProject }> = ({ project }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />
            <Badge className={categoryColors[project.category]}>
              {project.category.charAt(0).toUpperCase() + project.category.slice(1)}
            </Badge>
          </div>
          <Badge className={statusColors[project.status]}>
            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </Badge>
        </div>
        
        <CardTitle className="text-lg">{project.title}</CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {project.description}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Project Progress</span>
            <span>{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>

        {/* Creator */}
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={project.createdBy.avatar} alt={project.createdBy.name} />
            <AvatarFallback>{project.createdBy.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{project.createdBy.name}</p>
            <p className="text-xs text-muted-foreground">{project.createdBy.title}</p>
          </div>
        </div>

        {/* Collaborators */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Collaborators</span>
            <span className="text-xs text-muted-foreground">
              {project.collaborators.length} members
            </span>
          </div>
          <div className="flex -space-x-2">
            {project.collaborators.slice(0, 4).map((collaborator) => (
              <Avatar key={collaborator.id} className="h-8 w-8 border-2 border-white">
                <AvatarImage src={collaborator.avatar} alt={collaborator.name} />
                <AvatarFallback>{collaborator.name[0]}</AvatarFallback>
              </Avatar>
            ))}
            {project.collaborators.length > 4 && (
              <div className="h-8 w-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium">
                +{project.collaborators.length - 4}
              </div>
            )}
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-2">
          <span className="text-sm font-medium">Required Skills</span>
          <div className="flex flex-wrap gap-1">
            {project.skills.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {project.skills.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{project.skills.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Engagement */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span>{project.likes}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{project.comments}</span>
            </div>
            <div className="flex items-center gap-1">
              <Share2 className="h-4 w-4" />
              <span>{project.shares}</span>
            </div>
          </div>
        </div>

        {/* Timeline (Expandable) */}
        {isExpanded && (
          <div className="space-y-3 border-t pt-4">
            <h4 className="font-medium">Project Timeline</h4>
            <div className="space-y-2">
              {project.timeline.map((phase, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    phase.status === 'completed' ? 'bg-green-500' :
                    phase.status === 'current' ? 'bg-blue-500' : 'bg-gray-300'
                  }`} />
                  <div className="flex-1">
                    <span className="text-sm font-medium">{phase.phase}</span>
                    <span className="text-xs text-muted-foreground ml-2">{phase.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            <GitBranch className="h-4 w-4 mr-2" />
            Collaborate
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Less' : 'More'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
