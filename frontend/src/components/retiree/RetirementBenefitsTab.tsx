
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Shield, DollarSign, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DirhamSign } from '@/components/icons/DirhamSign';

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

const RetirementBenefitsTab: React.FC = () => {
  const { data: resources, isLoading, error } = useQuery({
    queryKey: ['retiree-resources', 'retirement-benefits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retiree_resources')
        .select('*')
        .in('category', ['retirement_pension', 'retirement_financial_planning', 'retirement_healthcare'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as RetireeResource[];
    }
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'retirement_pension':
        return <DirhamSign className="h-5 w-5" />;
      case 'retirement_financial_planning':
        return <DirhamSign className="h-5 w-5" />;
      case 'retirement_healthcare':
        return <Heart className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'retirement_pension':
        return 'Pension';
      case 'retirement_financial_planning':
        return 'Financial Planning';
      case 'retirement_healthcare':
        return 'Healthcare';
      default:
        return 'Benefits';
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
            Failed to load retirement benefits information. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Retirement Benefits</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Comprehensive information about pension schemes, financial planning, and healthcare benefits available to UAE retirees.
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
                      <ExternalLink className="h-4 w-4 mr-2" />
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
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Benefits Information Available</h3>
              <p className="text-muted-foreground">
                Retirement benefits information will be available soon.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RetirementBenefitsTab;
