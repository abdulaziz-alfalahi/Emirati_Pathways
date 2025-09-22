
import React, { useState } from 'react';
import { LegacyProject } from '@/types/legacyProject';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MapPin, Calendar, Target, Users, ExternalLink } from 'lucide-react';
import { ContributeDialog } from './ContributeDialog';

interface ProjectCardProps {
  project: LegacyProject;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const [showContributeDialog, setShowContributeDialog] = useState(false);

  const fundingProgress = project.funding_goal ? 
    (project.current_funding / project.funding_goal) * 100 : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: project.funding_currency || 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'proposal':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFocusAreaColor = (area?: string) => {
    switch (area) {
      case 'education':
        return 'bg-blue-100 text-blue-800';
      case 'environment':
        return 'bg-green-100 text-green-800';
      case 'healthcare':
        return 'bg-red-100 text-red-800';
      case 'culture':
        return 'bg-purple-100 text-purple-800';
      case 'technology':
        return 'bg-indigo-100 text-indigo-800';
      case 'community':
        return 'bg-orange-100 text-orange-800';
      case 'arts':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Card className="h-full hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-start mb-2">
            <Badge className={getStatusColor(project.project_status)}>
              {project.project_status}
            </Badge>
            {project.is_featured && (
              <Badge variant="secondary">Featured</Badge>
            )}
          </div>
          <CardTitle className="text-lg">{project.title}</CardTitle>
          {project.focus_area && (
            <Badge className={getFocusAreaColor(project.focus_area)}>
              {project.focus_area}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 line-clamp-3">
            {project.description}
          </p>

          {project.location && (
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="h-4 w-4 mr-1" />
              {project.location}
            </div>
          )}

          {project.expected_completion_date && (
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-1" />
              Target: {new Date(project.expected_completion_date).toLocaleDateString()}
            </div>
          )}

          {project.funding_goal && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Funding Progress</span>
                <span>{Math.round(fundingProgress)}%</span>
              </div>
              <Progress value={fundingProgress} className="h-2" />
              <div className="flex justify-between text-sm">
                <span>{formatCurrency(project.current_funding)} raised</span>
                <span>Goal: {formatCurrency(project.funding_goal)}</span>
              </div>
            </div>
          )}

          {project.skills_needed && project.skills_needed.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Skills Needed:</p>
              <div className="flex flex-wrap gap-1">
                {project.skills_needed.slice(0, 3).map((skill, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {project.skills_needed.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{project.skills_needed.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={() => setShowContributeDialog(true)}
              className="flex-1"
            >
              <Users className="h-4 w-4 mr-2" />
              Contribute
            </Button>
            {project.website_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={project.website_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <ContributeDialog
        project={project}
        open={showContributeDialog}
        onOpenChange={setShowContributeDialog}
      />
    </>
  );
};
