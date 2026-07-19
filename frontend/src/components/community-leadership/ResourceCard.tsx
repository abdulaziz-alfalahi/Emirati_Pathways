
import React from 'react';
import { CommunityLeadershipResource } from '@/types/communityLeadership';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, ExternalLink, Users, Globe } from 'lucide-react';
import { format } from 'date-fns';

interface ResourceCardProps {
  resource: CommunityLeadershipResource;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  const getDifficultyColor = (level?: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'training':
        return 'bg-blue-100 text-blue-800';
      case 'workshop':
        return 'bg-purple-100 text-purple-800';
      case 'opportunity':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const isDeadlineApproaching = (deadline?: string) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDeadline <= 7 && daysUntilDeadline > 0;
  };

  return (
    <Card className={`h-full transition-all hover:shadow-lg ${resource.is_featured ? 'border-ehrdc-teal/50 shadow-md' : 'hover:border-ehrdc-teal/30'}`}>
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Badge className={getTypeColor(resource.type)}>
              {resource.type}
            </Badge>
            {resource.is_featured && (
              <Badge variant="outline" className="bg-ehrdc-teal/10 text-ehrdc-teal border-ehrdc-teal/20">
                Featured
              </Badge>
            )}
          </div>
          {resource.difficulty_level && (
            <Badge className={getDifficultyColor(resource.difficulty_level)}>
              {resource.difficulty_level}
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg leading-tight">{resource.title}</CardTitle>
        {resource.provider && (
          <p className="text-sm text-gray-600">by {resource.provider}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {resource.description && (
          <p className="text-sm text-gray-700 line-clamp-3">
            {resource.description}
          </p>
        )}

        <div className="space-y-2 text-sm">
          {resource.start_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>
                {formatDate(resource.start_date)}
                {resource.end_date && ` - ${formatDate(resource.end_date)}`}
              </span>
            </div>
          )}

          {resource.duration_hours && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>{resource.duration_hours} hours</span>
            </div>
          )}

          {resource.location && (
            <div className="flex items-center gap-2">
              {resource.is_virtual ? (
                <Globe className="h-4 w-4 text-gray-400" />
              ) : (
                <MapPin className="h-4 w-4 text-gray-400" />
              )}
              <span>{resource.location}</span>
            </div>
          )}

          {resource.application_deadline && (
            <div className={`flex items-center gap-2 ${isDeadlineApproaching(resource.application_deadline) ? 'text-orange-600' : ''}`}>
              <Users className="h-4 w-4 text-gray-400" />
              <span>Apply by: {formatDate(resource.application_deadline)}</span>
              {isDeadlineApproaching(resource.application_deadline) && (
                <Badge variant="destructive" className="ms-2 text-xs">
                  Deadline Soon
                </Badge>
              )}
            </div>
          )}
        </div>

        {resource.requirements && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-700 mb-1">Requirements:</p>
            <p className="text-xs text-gray-600">{resource.requirements}</p>
          </div>
        )}

        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {resource.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {resource.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{resource.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter>
        {resource.url ? (
          <Button className="w-full" asChild>
            <a href={resource.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 me-2" />
              {resource.type === 'opportunity' ? 'Apply Now' : 'Learn More'}
            </a>
          </Button>
        ) : (
          <Button variant="outline" className="w-full" disabled>
            Details Coming Soon
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
