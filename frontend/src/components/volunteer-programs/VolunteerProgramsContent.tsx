import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { volunteerService } from '@/services/volunteerService';
import { VolunteerOpportunity, VolunteerApplication } from '@/types/volunteer';
import { 
  Heart, 
  Users, 
  Building, 
  Award, 
  MapPin, 
  Calendar, 
  Clock, 
  Search, 
  Filter, 
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface VolunteerProgramsContentProps {
  activeTab: 'opportunities' | 'history' | 'organizations';
}

export const VolunteerProgramsContent: React.FC<VolunteerProgramsContentProps> = ({ activeTab }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<VolunteerOpportunity | null>(null);
  const [applicationMessage, setApplicationMessage] = useState('');

  // Fetch volunteer opportunities
  const { data: opportunities = [], isLoading: loadingOpportunities } = useQuery({
    queryKey: ['volunteer-opportunities'],
    queryFn: volunteerService.getActiveOpportunities,
    enabled: activeTab === 'opportunities'
  });

  // Fetch user's volunteer applications
  const { data: userApplications = [], isLoading: loadingApplications } = useQuery({
    queryKey: ['volunteer-applications', user?.id],
    queryFn: () => user ? volunteerService.getUserApplications(user.id) : Promise.resolve([]),
    enabled: activeTab === 'history' && !!user
  });

  // Submit application mutation
  const submitApplicationMutation = useMutation({
    mutationFn: ({ opportunityId, userId, message }: { opportunityId: string; userId: string; message?: string }) =>
      volunteerService.submitApplication(opportunityId, userId, message),
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Your volunteer application has been submitted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['volunteer-applications'] });
      setIsApplicationDialogOpen(false);
      setApplicationMessage('');
      setSelectedOpportunity(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
      console.error('Application submission error:', error);
    }
  });

  const handleApply = (opportunity: VolunteerOpportunity) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to apply for volunteer opportunities.",
        variant: "destructive",
      });
      return;
    }
    setSelectedOpportunity(opportunity);
    setIsApplicationDialogOpen(true);
  };

  const handleSubmitApplication = () => {
    if (!selectedOpportunity || !user) return;
    
    submitApplicationMutation.mutate({
      opportunityId: selectedOpportunity.id,
      userId: user.id,
      message: applicationMessage
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
      case 'withdrawn':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
      case 'withdrawn':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'education':
        return '📚';
      case 'environment':
        return '🌱';
      case 'healthcare':
        return '🏥';
      case 'community':
        return '🤝';
      case 'sports':
        return '⚽';
      case 'arts':
        return '🎨';
      case 'technology':
        return '💻';
      default:
        return '📋';
    }
  };

  // Filter opportunities
  const filteredOpportunities = opportunities.filter(opportunity => {
    const matchesSearch = opportunity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opportunity.organization_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opportunity.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || opportunity.category === categoryFilter;
    const matchesLocation = locationFilter === 'all' || 
                           (locationFilter === 'remote' && opportunity.is_remote) ||
                           (locationFilter === 'onsite' && !opportunity.is_remote) ||
                           opportunity.location?.toLowerCase().includes(locationFilter.toLowerCase());
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  if (activeTab === 'opportunities') {
    return (
      <div className="space-y-6">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search opportunities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="environment">Environment</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="community">Community</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="arts">Arts</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="onsite">On-site</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Opportunities Grid */}
        {loadingOpportunities ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpportunities.map((opportunity) => (
              <Card key={opportunity.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg leading-tight flex items-center gap-2">
                        <span>{getCategoryIcon(opportunity.category || '')}</span>
                        {opportunity.title}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {opportunity.organization_name}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {opportunity.description}
                    </p>
                    
                    <div className="space-y-2 text-sm">
                      {opportunity.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span>{opportunity.is_remote ? 'Remote' : opportunity.location}</span>
                        </div>
                      )}
                      
                      {opportunity.start_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{new Date(opportunity.start_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      {opportunity.time_commitment && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span>{opportunity.time_commitment}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">
                        {opportunity.current_volunteers}/{opportunity.max_volunteers || '∞'} volunteers
                      </span>
                    </div>

                    {opportunity.skills_required && opportunity.skills_required.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {opportunity.skills_required.slice(0, 3).map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {opportunity.skills_required.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{opportunity.skills_required.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    <Button 
                      onClick={() => handleApply(opportunity)}
                      className="w-full"
                      disabled={!!opportunity.max_volunteers && opportunity.current_volunteers >= opportunity.max_volunteers}
                    >
                      {opportunity.max_volunteers && opportunity.current_volunteers >= opportunity.max_volunteers 
                        ? 'Full' 
                        : 'Apply Now'
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredOpportunities.length === 0 && !loadingOpportunities && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No opportunities found</h3>
              <p>Try adjusting your search terms or filters.</p>
            </div>
          </div>
        )}

        {/* Application Dialog */}
        <Dialog open={isApplicationDialogOpen} onOpenChange={setIsApplicationDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply for Volunteer Opportunity</DialogTitle>
              <DialogDescription>
                Submit your application for "{selectedOpportunity?.title}"
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="message">Application Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Tell the organization why you're interested in this opportunity..."
                  value={applicationMessage}
                  onChange={(e) => setApplicationMessage(e.target.value)}
                  rows={4}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleSubmitApplication}
                  disabled={submitApplicationMutation.isPending}
                  className="flex-1"
                >
                  {submitApplicationMutation.isPending ? 'Submitting...' : 'Submit Application'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsApplicationDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (activeTab === 'history') {
    if (!user) {
      return (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Sign in required</h3>
            <p>Please sign in to view your volunteer history.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">My Volunteer History</h3>
          <p className="text-muted-foreground">Track your volunteer applications and completed activities</p>
        </div>

        {loadingApplications ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : userApplications.length > 0 ? (
          <div className="space-y-4">
            {userApplications.map((application) => (
              <Card key={application.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg leading-tight flex items-center gap-2">
                        {application.opportunity && getCategoryIcon(application.opportunity.category || '')}
                        {application.opportunity?.title}
                      </CardTitle>
                      <CardDescription>
                        {application.opportunity?.organization_name}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(application.status)}
                      <Badge className={getStatusColor(application.status)}>
                        {application.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span>Applied: {new Date(application.applied_at).toLocaleDateString()}</span>
                    </div>
                    
                    {application.hours_completed > 0 && (
                      <div className="flex items-center gap-2">
                        <Award className="h-3 w-3 text-muted-foreground" />
                        <span>Hours completed: {application.hours_completed}</span>
                      </div>
                    )}
                    
                    {application.completion_date && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span>Completed: {new Date(application.completion_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  
                  {application.volunteer_feedback && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <h4 className="font-medium text-sm mb-1">Your Feedback:</h4>
                      <p className="text-sm text-muted-foreground">{application.volunteer_feedback}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No volunteer history yet</h3>
              <p>Start by applying for volunteer opportunities to build your history.</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'organizations') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Partner Organizations</h3>
          <p className="text-muted-foreground">Discover the organizations offering volunteer opportunities</p>
        </div>

        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
            <p>Organization profiles and partnership details will be available soon.</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
