
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Briefcase, 
  Clock, 
  Users, 
  Star, 
  Calendar,
  CheckCircle,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import { skillsMarketplaceService } from '@/services/skillsMarketplaceService';
import { useToast } from '@/hooks/use-toast';
import type { SkillOpportunity, SkillApplication, ProjectCollaboration } from '@/types/skillsMarketplace';

export const SkillsMarketplaceDashboard: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [myOpportunities, setMyOpportunities] = useState<SkillOpportunity[]>([]);
  const [myApplications, setMyApplications] = useState<SkillApplication[]>([]);
  const [myCollaborations, setMyCollaborations] = useState<ProjectCollaboration[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [opportunities, applications, collaborations] = await Promise.all([
        skillsMarketplaceService.getUserOpportunities(),
        skillsMarketplaceService.getUserApplications(),
        skillsMarketplaceService.getUserCollaborations()
      ]);

      setMyOpportunities(opportunities);
      setMyApplications(applications);
      setMyCollaborations(collaborations);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'open': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': case 'cancelled': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'accepted': case 'open': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = {
    totalOpportunities: myOpportunities.length,
    totalApplications: myApplications.length,
    activeCollaborations: myCollaborations.filter(c => c.status === 'in_progress').length,
    completedProjects: myCollaborations.filter(c => c.status === 'completed').length
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">My Opportunities</p>
                <p className="text-lg font-semibold">{stats.totalOpportunities}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Applications Sent</p>
                <p className="text-lg font-semibold">{stats.totalApplications}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Projects</p>
                <p className="text-lg font-semibold">{stats.activeCollaborations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-lg font-semibold">{stats.completedProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="opportunities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="opportunities">My Opportunities</TabsTrigger>
          <TabsTrigger value="applications">My Applications</TabsTrigger>
          <TabsTrigger value="collaborations">Active Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities">
          <Card>
            <CardHeader>
              <CardTitle>Your Posted Opportunities</CardTitle>
              <CardDescription>
                Manage the opportunities you've posted and review applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myOpportunities.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No opportunities posted yet</h3>
                  <p className="text-muted-foreground">
                    Create your first opportunity to start collaborating
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myOpportunities.map(opportunity => (
                    <div key={opportunity.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold">{opportunity.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {opportunity.description}
                          </p>
                        </div>
                        <Badge className={getStatusColor(opportunity.status)}>
                          {opportunity.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {opportunity.application_count || 0} applications
                        </div>
                        {opportunity.budget_amount && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {opportunity.budget_amount} {opportunity.budget_currency}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(opportunity.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Your Applications</CardTitle>
              <CardDescription>
                Track the status of applications you've submitted
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myApplications.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No applications yet</h3>
                  <p className="text-muted-foreground">
                    Start applying to opportunities that interest you
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myApplications.map(application => (
                    <div key={application.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold">{application.opportunity?.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {application.opportunity?.creator?.full_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(application.status)}
                          <Badge className={getStatusColor(application.status)}>
                            {application.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Applied {new Date(application.applied_at).toLocaleDateString()}
                        </div>
                        {application.proposed_budget && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            Proposed: {application.proposed_budget} AED
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collaborations">
          <Card>
            <CardHeader>
              <CardTitle>Active Collaborations</CardTitle>
              <CardDescription>
                Manage your ongoing projects and collaborations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myCollaborations.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No active collaborations</h3>
                  <p className="text-muted-foreground">
                    Your accepted applications will appear here as active projects
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myCollaborations.map(collaboration => (
                    <div key={collaboration.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold">{collaboration.opportunity?.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {collaboration.client?.full_name?.slice(0, 2)?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">
                              with {collaboration.client?.full_name}
                            </span>
                          </div>
                        </div>
                        <Badge className={getStatusColor(collaboration.status)}>
                          {collaboration.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Started {new Date(collaboration.start_date || collaboration.created_at).toLocaleDateString()}
                        </div>
                        {collaboration.agreed_budget && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            Budget: {collaboration.agreed_budget} AED
                          </div>
                        )}
                      </div>
                      {collaboration.status === 'completed' && (collaboration.client_rating || collaboration.collaborator_rating) && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center gap-4">
                            {collaboration.client_rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm">Client: {collaboration.client_rating}/5</span>
                              </div>
                            )}
                            {collaboration.collaborator_rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm">Collaborator: {collaboration.collaborator_rating}/5</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
