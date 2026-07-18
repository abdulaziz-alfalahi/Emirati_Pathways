
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Briefcase, Users, TrendingUp } from 'lucide-react';
interface RetireeResource {
  id: string;
  title: string;
  category: string;
  description: string;
  resource_url: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  image_url: string;
  is_featured: boolean;
  difficulty_level: string;
  estimated_read_time: number;
  status: string;
}

const PostCareerOptionsTab: React.FC = () => {
  const { data: resources, isLoading, error } = useQuery({
    queryKey: ['retiree-resources', 'post-career'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retiree_resources')
        .select('*')
        .in('category', ['post_career_consulting', 'post_career_volunteering', 'post_career_entrepreneurship'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as RetireeResource[];
    }
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'post_career_consulting':
        return <Briefcase className="h-5 w-5" />;
      case 'post_career_volunteering':
        return <Users className="h-5 w-5" />;
      case 'post_career_entrepreneurship':
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Briefcase className="h-5 w-5" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'post_career_consulting':
        return 'Consulting';
      case 'post_career_volunteering':
        return 'Volunteering';
      case 'post_career_entrepreneurship':
        return 'Entrepreneurship';
      default:
        return 'Other';
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
            Failed to load post-career resources. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Post-Career Opportunities</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Explore meaningful ways to continue contributing to society while leveraging your valuable experience and expertise.
        </p>
      </div>

      {resources && resources.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <Card key={resource.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(resource.category)}
                    <Badge variant="outline">
                      {getCategoryLabel(resource.category)}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-lg">{resource.title}</CardTitle>
                <CardDescription>{resource.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-4">
                  {resource.tags?.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                {resource.resource_url && (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={resource.resource_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 me-2" />
                      Learn More
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Resources Available</h3>
              <p className="text-muted-foreground">
                Post-career opportunity resources will be available soon.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PostCareerOptionsTab;
