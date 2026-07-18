
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ExternalLink, Star, Tag } from 'lucide-react';

interface RetireeResource {
  id: string;
  title: string;
  description: string;
  category: string;
  resource_url: string;
  image_url?: string;
  tags: string[];
  is_featured: boolean;
  difficulty_level: string;
  estimated_read_time: number;
  status: string;
}

interface RetireeResourceCardProps {
  resource: RetireeResource;
}

const RetireeResourceCard: React.FC<RetireeResourceCardProps> = ({ resource }) => {
  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={`hover:shadow-md transition-shadow cursor-pointer ${resource.is_featured ? 'border-ehrdc-teal bg-ehrdc-teal/5' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg leading-tight flex items-center gap-2">
              {resource.title}
              {resource.is_featured && (
                <Badge variant="secondary" className="bg-ehrdc-teal text-white">
                  <Star className="h-3 w-3 me-1" />
                  Featured
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-2">
              {resource.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className={getDifficultyColor(resource.difficulty_level)}>
            {resource.difficulty_level}
          </Badge>
          {resource.tags.slice(0, 2).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              <Tag className="h-3 w-3 me-1" />
              {tag}
            </Badge>
          ))}
          {resource.tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{resource.tags.length - 2} more
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {resource.estimated_read_time} min read
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => window.open(resource.resource_url, '_blank')}
          >
            <ExternalLink className="h-4 w-4 me-2" />
            View Resource
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RetireeResourceCard;
