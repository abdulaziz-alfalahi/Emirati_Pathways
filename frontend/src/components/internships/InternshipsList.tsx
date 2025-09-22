
import React, { useEffect, useState, useCallback } from 'react';
import { Internship } from '@/types/internships';
import { getInternshipsPaginated, applyForInternship, InternshipFilters } from '@/services/internshipService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Calendar, MapPin, Clock, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/use-pagination';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { mockInternships } from '@/services/demoData';

interface InternshipsListProps {
  filters?: InternshipFilters;
  useMockData?: boolean;
}

export const InternshipsList: React.FC<InternshipsListProps> = ({ filters, useMockData = false }) => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [applying, setApplying] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  // Use pagination hook
  const pagination = usePagination({ pageSize: 12 });
  
  // Debounce filters to reduce API calls
  const debouncedFilters = useDebouncedValue(filters, 300);

  const fetchInternships = useCallback(async () => {
    setIsLoading(true);
    try {
      if (useMockData) {
        // Use mock data for demo purposes
        setTimeout(() => {
          let filteredData = [...mockInternships];
          
          // Apply filters if provided
          if (debouncedFilters) {
            if (debouncedFilters.industry && debouncedFilters.industry.length > 0) {
              filteredData = filteredData.filter(item => 
                debouncedFilters.industry?.includes(item.industry)
              );
            }
            
            if (debouncedFilters.isPaid !== undefined) {
              filteredData = filteredData.filter(item => 
                item.is_paid === debouncedFilters.isPaid
              );
            }
            
            if (debouncedFilters.location && debouncedFilters.location.length > 0) {
              filteredData = filteredData.filter(item => 
                debouncedFilters.location?.some(loc => 
                  item.location.toLowerCase().includes(loc.toLowerCase())
                )
              );
            }
            
            if (debouncedFilters.search) {
              const searchLower = debouncedFilters.search.toLowerCase();
              filteredData = filteredData.filter(item => 
                item.title.toLowerCase().includes(searchLower) ||
                item.company.toLowerCase().includes(searchLower) ||
                item.description.toLowerCase().includes(searchLower)
              );
            }
          }
          
          // Apply pagination
          const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
          const endIndex = startIndex + pagination.pageSize;
          const paginatedData = filteredData.slice(startIndex, endIndex);
          
          setInternships(paginatedData);
          setTotalCount(filteredData.length);
          setIsLoading(false);
        }, 800); // Simulate network delay
      } else {
        // Use real API data with pagination
        const result = await getInternshipsPaginated({
          page: pagination.currentPage,
          pageSize: pagination.pageSize,
          filters: debouncedFilters
        });
        setInternships(result.internships);
        setTotalCount(result.totalCount);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching internships:', error);
      toast({
        title: "Error",
        description: "Failed to load internships. Please try again later.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  }, [pagination.currentPage, pagination.pageSize, debouncedFilters, toast, useMockData]);

  // Reset to first page when filters change
  useEffect(() => {
    pagination.setCurrentPage(1);
  }, [debouncedFilters]);

  useEffect(() => {
    fetchInternships();
  }, [fetchInternships]);

  const handleApply = async (internshipId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to apply for internships",
        variant: "destructive"
      });
      return;
    }

    setApplying(internshipId);
    try {
      if (useMockData) {
        // Simulate API call for demo purposes
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({
          title: "Application submitted",
          description: "Your application has been submitted successfully."
        });
      } else {
        await applyForInternship(internshipId, user.id);
        toast({
          title: "Application submitted",
          description: "Your application has been submitted successfully."
        });
      }
    } catch (error) {
      console.error('Error applying for internship:', error);
      toast({
        title: "Application failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setApplying(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader>
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-24" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (internships.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No internships found</CardTitle>
          <CardDescription>
            There are no internships matching your criteria. Try adjusting your filters.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Internships List */}
      <div className="space-y-4">
        {internships.map((internship) => (
          <Card key={internship.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg md:text-xl">{internship.title}</CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    <span className="font-medium">{internship.company}</span>
                  </CardDescription>
                </div>
                {internship.is_paid && (
                  <Badge className="bg-green-600">
                    <CreditCard className="h-3 w-3 mr-1" />
                    Paid
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{internship.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  {internship.location}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  {internship.start_date && internship.end_date ? 
                    `${new Date(internship.start_date).toLocaleDateString()} - ${new Date(internship.end_date).toLocaleDateString()}` : 
                    'Dates flexible'
                  }
                </div>
                <div className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                  {internship.department || internship.industry}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                  Deadline: {new Date(internship.application_deadline).toLocaleDateString()}
                  {new Date(internship.application_deadline) > new Date() ? 
                    ` (${formatDistanceToNow(new Date(internship.application_deadline), { addSuffix: true })})` : 
                    ' (Closed)'
                  }
                </div>
              </div>
              
              {internship.skills_required && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-1">
                    {internship.skills_required.slice(0, isMobile ? 2 : 4).map((skill, index) => (
                      <Badge key={index} variant="outline" className="bg-gray-100">
                        {skill}
                      </Badge>
                    ))}
                    {internship.skills_required.length > (isMobile ? 2 : 4) && (
                      <Badge variant="outline" className="bg-gray-100">
                        +{internship.skills_required.length - (isMobile ? 2 : 4)} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {}}
                className="text-xs md:text-sm"
              >
                View Details
              </Button>
              <Button
                size="sm"
                onClick={() => handleApply(internship.id)}
                className="text-xs md:text-sm"
                disabled={
                  applying === internship.id || 
                  new Date(internship.application_deadline) < new Date()
                }
              >
                {applying === internship.id ? "Applying..." : 
                 new Date(internship.application_deadline) < new Date() ? "Closed" : "Apply"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalCount > pagination.pageSize && (
        <div className="flex justify-center">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.getTotalPages(totalCount)}
            onPageChange={pagination.setCurrentPage}
            hasNextPage={pagination.hasNextPage(totalCount)}
            hasPreviousPage={pagination.hasPreviousPage()}
          />
        </div>
      )}

      {/* Results info */}
      <div className="text-center text-sm text-muted-foreground">
        Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to{' '}
        {Math.min(pagination.currentPage * pagination.pageSize, totalCount)} of{' '}
        {totalCount} internship{totalCount !== 1 ? 's' : ''}
      </div>
    </div>
  );
};
