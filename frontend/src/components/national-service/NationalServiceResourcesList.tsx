
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, FileText, Video, Download, ExternalLink } from 'lucide-react';

interface NationalServiceResource {
  id: string;
  title: string;
  description: string | null;
  category: 'overview' | 'eligibility' | 'benefits' | 'post_service';
  resource_type: 'article' | 'guide' | 'faq' | 'video' | 'document';
  content_url: string | null;
  content_markdown: string | null;
  image_url: string | null;
  tags: string[] | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface NationalServiceResourcesListProps {
  category?: string;
}

export const NationalServiceResourcesList: React.FC<NationalServiceResourcesListProps> = ({ category }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const { data: resources, isLoading, error } = useQuery({
    queryKey: ['national-service-resources', category, searchTerm, selectedType],
    queryFn: async () => {
      let query = supabase
        .from('national_service_resources')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
      
      if (selectedType !== 'all') {
        query = query.eq('resource_type', selectedType);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as NationalServiceResource[];
    }
  });

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'document': return <Download className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getResourceTypeColor = (type: string) => {
    switch (type) {
      case 'article': return 'bg-blue-100 text-blue-800';
      case 'guide': return 'bg-green-100 text-green-800';
      case 'faq': return 'bg-purple-100 text-purple-800';
      case 'video': return 'bg-red-100 text-red-800';
      case 'document': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Failed to load resources. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      {!category && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="md:w-48">
                  <SelectValue placeholder="Resource Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="article">Articles</SelectItem>
                  <SelectItem value="guide">Guides</SelectItem>
                  <SelectItem value="faq">FAQs</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resources Grid */}
      {!resources || resources.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Resources Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedType !== 'all'
                  ? "No resources match your current filters. Try adjusting your search criteria."
                  : "No national service resources are currently available."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <Card key={resource.id} className="h-full hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2 flex items-center gap-2">
                      {getResourceIcon(resource.resource_type)}
                      {resource.title}
                    </CardTitle>
                    {resource.description && (
                      <CardDescription className="mt-2 line-clamp-2">
                        {resource.description}
                      </CardDescription>
                    )}
                  </div>
                  {resource.is_featured && (
                    <Badge variant="outline" className="ml-2 text-green-600 border-green-200">
                      Featured
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge className={getResourceTypeColor(resource.resource_type)}>
                    {resource.resource_type}
                  </Badge>
                  {resource.tags && resource.tags.slice(0, 2).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              
              <CardContent>
                {resource.content_markdown && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {resource.content_markdown.split('\n')[0].replace(/^#+\s*/, '')}
                    </p>
                  </div>
                )}
                
                <div className="flex gap-2">
                  {resource.content_markdown && (
                    <Button variant="outline" size="sm" className="flex-1">
                      <FileText className="h-4 w-4 mr-2" />
                      Read More
                    </Button>
                  )}
                  {resource.content_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={resource.content_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
