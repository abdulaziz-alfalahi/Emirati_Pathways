
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, Building, Users, FileText } from 'lucide-react';
import { getApplicationsByUser } from '@/services/scholarshipService';
import { Application } from '@/types/scholarships';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ScholarshipsAppliedProps {
  filters: {
    providerType: string[];
    amount: [number | null, number | null];
  };
  searchQuery: string;
}

const ScholarshipsApplied: React.FC<ScholarshipsAppliedProps> = ({
  filters,
  searchQuery
}) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getApplicationsByUser(user.id);
        
        // Apply filters to applications
        let filtered = data;
        
        if (filters.providerType.length > 0) {
          filtered = filtered.filter(app => 
            app.scholarship && filters.providerType.includes(app.scholarship.provider_type)
          );
        }
        
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(app =>
            app.scholarship && (
              app.scholarship.title.toLowerCase().includes(query) ||
              app.scholarship.provider.toLowerCase().includes(query)
            )
          );
        }
        
        setApplications(filtered);
      } catch (error) {
        console.error('Error fetching applications:', error);
        toast({
          title: "Error",
          description: "Failed to fetch your applications. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [user, filters, searchQuery, toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatAmount = (amount?: number, currency?: string) => {
    if (!amount) return 'Amount not specified';
    return `${currency || 'AED'} ${amount.toLocaleString()}`;
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

  if (!user) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
          <p className="text-muted-foreground">
            Please sign in to view your scholarship applications.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Applications Found</h3>
          <p className="text-muted-foreground">
            {searchQuery || filters.providerType.length > 0
              ? 'No applications match your current filters.'
              : 'You haven\'t applied for any scholarships yet.'
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {applications.map((application) => (
        <Card key={application.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">
                  {application.scholarship?.title || 'Scholarship Title Not Available'}
                </CardTitle>
                <CardDescription className="text-base">
                  {application.scholarship?.description || 'Description not available'}
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2">
                <Badge className={getStatusColor(application.status)}>
                  {application.status.toUpperCase()}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Applied: {new Date(application.submitted_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {application.scholarship && (
              <>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="font-medium">Provider:</span> {application.scholarship.provider}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="font-medium">Amount:</span> {formatAmount(application.scholarship.amount, application.scholarship.currency)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="font-medium">Deadline:</span> {
                          application.scholarship.application_deadline
                            ? new Date(application.scholarship.application_deadline).toLocaleDateString()
                            : 'Not specified'
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="font-medium">Application ID:</span> {application.id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {application.status === 'pending' && 'Your application is being reviewed.'}
                    {application.status === 'approved' && 'Congratulations! Your application has been approved.'}
                    {application.status === 'rejected' && 'Your application was not successful this time.'}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    {application.scholarship.contact_email && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`mailto:${application.scholarship.contact_email}`}>
                          Contact Provider
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ScholarshipsApplied;
