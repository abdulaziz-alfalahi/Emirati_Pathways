
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, ExternalLink, Star, Building, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Contributor {
  id: string;
  name: string;
  title?: string;
  organization?: string;
  bio?: string;
  avatar_url?: string;
  expertise_areas?: string[];
  content_count: number;
  is_featured: boolean;
  social_links?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
}

interface ContributorsTabProps {
  searchQuery: string;
}

export const ContributorsTab: React.FC<ContributorsTabProps> = ({ searchQuery }) => {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContributors();
  }, [searchQuery]);

  const fetchContributors = async () => {
    try {
      setLoading(true);
      
      // For now, let's create some mock data since we don't have a contributors table
      const mockContributors: Contributor[] = [
        {
          id: '1',
          name: 'Dr. Sarah Al-Mansouri',
          title: 'Director of Strategic Innovation',
          organization: 'UAE Ministry of Economy',
          bio: 'Leading expert in digital transformation and economic diversification in the UAE.',
          avatar_url: '/images/contributors/sarah.jpg',
          expertise_areas: ['Digital Economy', 'Innovation Policy', 'Economic Development'],
          content_count: 12,
          is_featured: true,
          social_links: {
            linkedin: 'https://linkedin.com/in/sarah-almansouri',
            website: 'https://uae-economy.gov.ae'
          }
        },
        {
          id: '2',
          name: 'Ahmed Hassan',
          title: 'Senior Consultant',
          organization: 'McKinsey & Company Dubai',
          bio: 'Specializes in workforce development and organizational transformation.',
          avatar_url: '/images/contributors/ahmed.jpg',
          expertise_areas: ['Human Capital', 'Digital Skills', 'Future of Work'],
          content_count: 8,
          is_featured: false,
          social_links: {
            linkedin: 'https://linkedin.com/in/ahmed-hassan'
          }
        },
        {
          id: '3',
          name: 'Dr. Mohammed Mubarak',
          title: 'Research Director',
          organization: 'Emirates Institute for Advanced Science and Technology',
          bio: 'Leading research in AI applications for career development and skills assessment.',
          avatar_url: '/images/contributors/mohammed.jpg',
          expertise_areas: ['Artificial Intelligence', 'EdTech', 'Skills Assessment'],
          content_count: 15,
          is_featured: true,
          social_links: {
            linkedin: 'https://linkedin.com/in/mohammed-mubarak',
            twitter: 'https://twitter.com/mohammed_research'
          }
        }
      ];

      // Filter by search query if provided
      let filteredContributors = mockContributors;
      if (searchQuery.trim()) {
        filteredContributors = mockContributors.filter(contributor =>
          contributor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contributor.organization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contributor.expertise_areas?.some(area => 
            area.toLowerCase().includes(searchQuery.toLowerCase())
          )
        );
      }

      setContributors(filteredContributors);
    } catch (error) {
      console.error('Error fetching contributors:', error);
    } finally {
      setLoading(false);
    }
  };

  const ContributorCard: React.FC<{ contributor: Contributor }> = ({ contributor }) => (
    <Card className={`hover:shadow-md transition-shadow ${contributor.is_featured ? 'border-yellow-200 bg-yellow-50/50' : ''}`}>
      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={contributor.avatar_url} alt={contributor.name} />
            <AvatarFallback className="text-lg bg-ehrdc-teal text-white">
              {contributor.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg leading-tight flex items-center gap-2">
                  {contributor.name}
                  {contributor.is_featured && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="mt-1">
                  {contributor.title}
                  {contributor.organization && (
                    <span className="flex items-center gap-1 mt-1">
                      <Building className="h-3 w-3" />
                      {contributor.organization}
                    </span>
                  )}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                <Award className="h-3 w-3 mr-1" />
                {contributor.content_count} contributions
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {contributor.bio && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {contributor.bio}
          </p>
        )}
        
        {contributor.expertise_areas && contributor.expertise_areas.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Expertise Areas</h4>
            <div className="flex flex-wrap gap-1">
              {contributor.expertise_areas.slice(0, 3).map((area, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {contributor.social_links && (
          <div className="flex gap-2">
            {contributor.social_links.linkedin && (
              <Button size="sm" variant="outline" asChild>
                <a
                  href={contributor.social_links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  LinkedIn
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            )}
            {contributor.social_links.website && (
              <Button size="sm" variant="outline" asChild>
                <a
                  href={contributor.social_links.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  Website
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Featured Contributors */}
      {contributors.some(contributor => contributor.is_featured) && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Featured Contributors
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {contributors
              .filter(contributor => contributor.is_featured)
              .map((contributor) => (
                <ContributorCard key={contributor.id} contributor={contributor} />
              ))}
          </div>
        </div>
      )}

      {/* All Contributors */}
      <div>
        <h3 className="text-lg font-semibold mb-4">All Contributors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contributors
            .filter(contributor => !contributor.is_featured)
            .map((contributor) => (
              <ContributorCard key={contributor.id} contributor={contributor} />
            ))}
        </div>
      </div>

      {contributors.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No contributors found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'Try adjusting your search terms.' : 'No contributors are currently available.'}
          </p>
        </div>
      )}
    </div>
  );
};
