
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Users, Eye, Edit, Trash2 } from 'lucide-react';
import { getScholarshipsWithApplicationCounts } from '@/services/scholarshipService';
import { ScholarshipWithApplications } from '@/types/scholarships';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ScholarshipsManageProps {
  onOpenCreateDialog: () => void;
  filters: {
    providerType: string[];
    amount: [number | null, number | null];
  };
  searchQuery: string;
}

const ScholarshipsManage: React.FC<ScholarshipsManageProps> = ({
  onOpenCreateDialog,
  filters,
  searchQuery
}) => {
  const [scholarships, setScholarships] = useState<ScholarshipWithApplications[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchManagedScholarships = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getScholarshipsWithApplicationCounts(user.id);
        
        // Apply filters
        let filtered = data;
        
        if (filters.providerType.length > 0) {
          filtered = filtered.filter(s => filters.providerType.includes(s.provider_type));
        }
        
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(s =>
            s.title.toLowerCase().includes(query) ||
            s.provider.toLowerCase().includes(query)
          );
        }
        
        setScholarships(filtered);
      } catch (error) {
        console.error('Error fetching managed scholarships:', error);
        toast({
          title: "Error",
          description: "Failed to fetch your scholarships. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchManagedScholarships();
  }, [user, filters, searchQuery, toast]);

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
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
          <p className="text-muted-foreground">
            Please sign in to manage your scholarships.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (scholarships.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Scholarships Found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || filters.providerType.length > 0
              ? 'No scholarships match your current filters.'
              : 'You haven\'t created any scholarships yet.'
            }
          </p>
          <Button onClick={onOpenCreateDialog} className="ehrdc-button-primary">
            Create Your First Scholarship
          </Button>
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
              <Badge variant={scholarship.is_active ? "default" : "secondary"}>
                {scholarship.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Amount:</span> {formatAmount(scholarship.amount, scholarship.currency)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Deadline:</span> {
                      scholarship.application_deadline
                        ? new Date(scholarship.application_deadline).toLocaleDateString()
                        : 'Not specified'
                    }
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Total Applications:</span> {scholarship.applications.total}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Status Breakdown:</span>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      Pending: {scholarship.applications.pending}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Approved: {scholarship.applications.approved}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Rejected: {scholarship.applications.rejected}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Created: {new Date(scholarship.created_at).toLocaleDateString()}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View Applications
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ScholarshipsManage;
