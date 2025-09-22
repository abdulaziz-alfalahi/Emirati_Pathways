
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Users, MapPin, Calendar } from 'lucide-react';

interface CommunityCardProps {
  community: {
    id: string;
    name: string;
    description: string;
    community_type: string;
    industry_focus: string[];
    size: string;
    location_type: string;
    physical_location?: string;
    benefits?: string[];
    website_url?: string;
    logo_url?: string;
    featured: boolean;
  };
  featured?: boolean;
}

export const CommunityCard: React.FC<CommunityCardProps> = ({ 
  community,
  featured = false
}) => {
  return (
    <Card className={`h-full transition-all ${featured ? 'border-primary/50 shadow-md hover:shadow-lg' : 'hover:border-primary/30'}`}>
      <CardHeader className="space-y-1">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            {community.logo_url ? (
              <div className="h-10 w-10 rounded-full overflow-hidden bg-muted">
                <img 
                  src={community.logo_url} 
                  alt={community.name} 
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
            )}
            <div>
              <CardTitle className="text-lg">{community.name}</CardTitle>
              <CardDescription className="text-sm">{community.community_type}</CardDescription>
            </div>
          </div>
          {featured && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Featured
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {community.description}
        </p>
        
        <div className="flex flex-wrap gap-1">
          {community.industry_focus.slice(0, 3).map((industry, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {industry}
            </Badge>
          ))}
          {community.industry_focus.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{community.industry_focus.length - 3} more
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{community.size}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{community.location_type}</span>
          </div>
        </div>
        
        {featured && community.benefits && (
          <div className="mt-2">
            <p className="text-xs font-medium mb-1">Benefits:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {community.benefits.slice(0, 3).map((benefit, i) => (
                <li key={i} className="flex items-start">
                  <span className="mr-1">•</span> {benefit}
                </li>
              ))}
              {community.benefits.length > 3 && (
                <li className="text-xs text-muted-foreground">+ {community.benefits.length - 3} more</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="w-full flex justify-between">
          <Button variant="outline" size="sm">
            View Details
          </Button>
          {community.website_url && (
            <Button variant="ghost" size="sm" className="text-primary" asChild>
              <a href={community.website_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                Visit
              </a>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
