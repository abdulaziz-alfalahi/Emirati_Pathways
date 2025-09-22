
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ExternalLink, Clock, DollarSign } from 'lucide-react';

interface ProfessionalCertification {
  id: string;
  certification_name: string;
  issuing_body: string;
  industry: string;
  description: string | null;
  duration_weeks: number | null;
  cost: number | null;
  certification_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface ProfessionalCertificationsListProps {
  industry?: string;
}

export const ProfessionalCertificationsList: React.FC<ProfessionalCertificationsListProps> = ({ industry }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState(industry || 'all');
  const [selectedIssuer, setSelectedIssuer] = useState('all');

  const { data: certifications, isLoading, error } = useQuery({
    queryKey: ['professional-certifications', selectedIndustry, selectedIssuer, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('professional_certifications')
        .select('*')
        .eq('is_active', true)
        .order('certification_name');

      if (selectedIndustry && selectedIndustry !== 'all') {
        query = query.eq('industry', selectedIndustry);
      }

      if (selectedIssuer && selectedIssuer !== 'all') {
        query = query.eq('issuing_body', selectedIssuer);
      }

      if (searchTerm) {
        query = query.or(`certification_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,issuing_body.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as ProfessionalCertification[];
    }
  });

  // Get unique industries and issuers for filter options
  const industries = Array.from(new Set(certifications?.map(cert => cert.industry) || []));
  const issuers = Array.from(new Set(certifications?.map(cert => cert.issuing_body) || []));

  const getIndustryColor = (industry: string) => {
    switch (industry) {
      case 'IT': return 'bg-blue-100 text-blue-800';
      case 'Finance': return 'bg-green-100 text-green-800';
      case 'Project Management': return 'bg-purple-100 text-purple-800';
      case 'Healthcare': return 'bg-red-100 text-red-800';
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
            Failed to load certifications. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search certifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
              <SelectTrigger className="md:w-48">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {industries.map(industry => (
                  <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedIssuer} onValueChange={setSelectedIssuer}>
              <SelectTrigger className="md:w-48">
                <SelectValue placeholder="Issuing Body" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Issuers</SelectItem>
                {issuers.map(issuer => (
                  <SelectItem key={issuer} value={issuer}>{issuer}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Certifications Grid */}
      {!certifications || certifications.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No Certifications Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedIndustry !== 'all' || selectedIssuer !== 'all'
                  ? "No certifications match your current filters. Try adjusting your search criteria."
                  : "No professional certifications are currently available."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {certifications.map((certification) => (
            <Card key={certification.id} className="h-full hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">
                      {certification.certification_name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {certification.issuing_body}
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge className={getIndustryColor(certification.industry)}>
                    {certification.industry}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                {certification.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {certification.description}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  {certification.duration_weeks && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {certification.duration_weeks} weeks
                    </div>
                  )}
                  {certification.cost && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      ${certification.cost}
                    </div>
                  )}
                </div>
                
                {certification.certification_url && (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={certification.certification_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Learn More
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
