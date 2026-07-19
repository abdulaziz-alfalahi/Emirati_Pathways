
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Building, Users, Clock } from 'lucide-react';
import { getScholarships, applyForScholarship } from '@/services/scholarshipService';
import { Scholarship } from '@/types/scholarships';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ScholarshipsListProps {
  type: 'available' | 'applied' | 'awarded';
  filters: {
    providerType: string[];
    amount: [number | null, number | null];
  };
  searchQuery: string;
  canApply?: boolean;
}

const ScholarshipsList: React.FC<ScholarshipsListProps> = ({
  type,
  filters,
  searchQuery,
  canApply = false
}) => {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchScholarships = async () => {
      try {
        setLoading(true);
        const data = await getScholarships({
          providerType: filters.providerType,
          amount: filters.amount,
          search: searchQuery
        });
        setScholarships(data);
      } catch (error) {
        console.error('Error fetching scholarships:', error);
        toast({
          title: "Error",
          description: "Failed to fetch scholarships. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchScholarships();
  }, [filters, searchQuery, toast]);

  const handleApply = async (scholarshipId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to apply for scholarships.",
        variant: "destructive"
      });
      return;
    }

    try {
      setApplying(scholarshipId);
      await applyForScholarship(scholarshipId, user.id);
      toast({
        title: "Application Submitted",
        description: "Your scholarship application has been submitted successfully!",
      });
    } catch (error) {
      console.error('Error applying for scholarship:', error);
      toast({
        title: "Application Failed",
        description: "Failed to submit your application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setApplying(null);
    }
  };

  const formatAmount = (amount?: number, currency?: string) => {
    if (!amount) return 'Amount not specified';
    return `${currency || 'AED'} ${amount.toLocaleString()}`;
  };

  const formatDeadline = (deadline?: string) => {
    if (!deadline) return 'No deadline specified';
    return new Date(deadline).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getProviderTypeColor = (type: string) => {
    switch (type) {
      case 'compliance_auditor':
        return 'bg-green-100 text-green-800';
      case 'university':
        return 'bg-blue-100 text-blue-800';
      case 'private_sector':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-20 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (scholarships.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Scholarships Found</h3>
          <p className="text-muted-foreground">
            {searchQuery || filters.providerType.length > 0
              ? 'Try adjusting your search or filter criteria.'
              : 'No scholarships are currently available.'
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {scholarships.map((scholarship) => (
        <Card key={scholarship.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">{scholarship.title}</CardTitle>
                <CardDescription className="text-base">
                  {scholarship.description}
                </CardDescription>
              </div>
              <Badge className={getProviderTypeColor(scholarship.provider_type)}>
                {scholarship.provider_type.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Provider:</span> {scholarship.provider}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Amount:</span> {formatAmount(scholarship.amount, scholarship.currency)}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Deadline:</span> {formatDeadline(scholarship.application_deadline)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Posted:</span> {new Date(scholarship.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {scholarship.requirements && scholarship.requirements.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium mb-2">Requirements:</h4>
                <ul className="list-disc ps-5 space-y-1 text-sm text-muted-foreground">
                  {scholarship.requirements.slice(0, 3).map((requirement, index) => (
                    <li key={index}>{requirement}</li>
                  ))}
                  {scholarship.requirements.length > 3 && (
                    <li className="text-primary">+ {scholarship.requirements.length - 3} more requirements</li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                {scholarship.contact_email && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${scholarship.contact_email}`}>
                      Contact Provider
                    </a>
                  </Button>
                )}
                {scholarship.website_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={scholarship.website_url} target="_blank" rel="noopener noreferrer">
                      Learn More
                    </a>
                  </Button>
                )}
              </div>
              {canApply && (
                <Button
                  onClick={() => handleApply(scholarship.id)}
                  disabled={applying === scholarship.id}
                  className="ehrdc-button-primary"
                >
                  {applying === scholarship.id ? 'Applying...' : 'Apply Now'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ScholarshipsList;
