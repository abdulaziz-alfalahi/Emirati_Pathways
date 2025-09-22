
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAssessments } from '@/services/assessmentService';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, Calendar, User, BadgeCheck } from 'lucide-react';
import { AssessmentType } from '@/types/assessments';
import { AssessmentDetails } from './AssessmentDetails';
import { AssessmentCreate } from './AssessmentCreate';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const getAssessmentTypeColor = (type: AssessmentType) => {
  switch (type) {
    case 'skills':
      return 'bg-[rgb(var(--pg-primary))/10] text-[rgb(var(--pg-primary))]';
    case 'behaviors':
      return 'bg-[rgb(var(--pg-secondary))/10] text-[rgb(var(--pg-secondary))]';
    case 'capabilities':
      return 'bg-[rgb(var(--pg-accent))/10] text-[rgb(var(--pg-accent))]';
    default:
      return 'bg-gray-500/10 text-gray-500';
  }
};

const getAssessmentTypeIcon = (type: AssessmentType) => {
  switch (type) {
    case 'skills':
      return <BadgeCheck className="h-4 w-4 mr-1" />;
    case 'behaviors':
      return <User className="h-4 w-4 mr-1" />;
    case 'capabilities':
      return <CheckCircle className="h-4 w-4 mr-1" />;
    default:
      return null;
  }
};

export const AssessmentsList = () => {
  const { user, roles } = useAuth();
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<AssessmentType | 'all'>('all');

  const { data: assessments = [], isLoading, refetch } = useQuery({
    queryKey: ['assessments'],
    queryFn: fetchAssessments,
  });

  const isAssessmentCenter = roles.includes('assessment_center') || roles.includes('training_center');

  const handleCreateSuccess = () => {
    refetch();
    setIsCreateDialogOpen(false);
  };

  const filteredAssessments = activeFilter === 'all' 
    ? assessments 
    : assessments.filter(assessment => assessment.assessment_type === activeFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[rgb(var(--pg-primary))]">Assessment Opportunities</h2>
          <p className="text-muted-foreground">
            Browse and register for assessment opportunities to advance your professional development
          </p>
        </div>

        {isAssessmentCenter && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[rgb(var(--pg-primary))] hover:bg-[rgb(var(--pg-primary))/90]">
                Post New Assessment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <AssessmentCreate onSuccess={handleCreateSuccess} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4 bg-white border shadow-sm">
          <TabsTrigger 
            value="all" 
            onClick={() => setActiveFilter('all')}
            className="data-[state=active]:bg-[rgb(var(--pg-primary))] data-[state=active]:text-white"
          >
            All Types
          </TabsTrigger>
          <TabsTrigger 
            value="skills" 
            onClick={() => setActiveFilter('skills')}
            className="data-[state=active]:bg-[rgb(var(--pg-primary))] data-[state=active]:text-white"
          >
            Skills
          </TabsTrigger>
          <TabsTrigger 
            value="behaviors" 
            onClick={() => setActiveFilter('behaviors')}
            className="data-[state=active]:bg-[rgb(var(--pg-secondary))] data-[state=active]:text-white"
          >
            Behaviors
          </TabsTrigger>
          <TabsTrigger 
            value="capabilities" 
            onClick={() => setActiveFilter('capabilities')}
            className="data-[state=active]:bg-[rgb(var(--pg-accent))] data-[state=active]:text-white"
          >
            Capabilities
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeFilter}>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgb(var(--pg-primary))]"></div>
            </div>
          ) : filteredAssessments.length === 0 ? (
            <div className="text-center p-8 border rounded-lg bg-muted/40">
              <h3 className="text-lg font-medium">No assessments found</h3>
              <p className="text-muted-foreground mt-1">
                {activeFilter !== 'all' 
                  ? `No ${activeFilter} assessments are currently available.`
                  : 'There are no assessments currently available.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredAssessments.map((assessment) => (
                <Dialog key={assessment.id}>
                  <DialogTrigger asChild>
                    <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-[rgb(var(--pg-primary))]">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <Badge className={getAssessmentTypeColor(assessment.assessment_type)}>
                            <div className="flex items-center">
                              {getAssessmentTypeIcon(assessment.assessment_type)}
                              {assessment.assessment_type.charAt(0).toUpperCase() + assessment.assessment_type.slice(1)}
                            </div>
                          </Badge>
                        </div>
                        <CardTitle className="mt-2 text-[rgb(var(--pg-primary))]">{assessment.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {assessment.description || 'No description available'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="text-sm space-y-2">
                        {assessment.duration_minutes && (
                          <div className="flex items-center text-muted-foreground">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>{assessment.duration_minutes} minutes</span>
                          </div>
                        )}
                        {assessment.skills_tested && assessment.skills_tested.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {assessment.skills_tested.slice(0, 3).map((skill) => (
                              <Badge key={skill} variant="outline" className="text-xs border-[rgb(var(--pg-secondary))] text-[rgb(var(--pg-secondary))]">
                                {skill}
                              </Badge>
                            ))}
                            {assessment.skills_tested.length > 3 && (
                              <Badge variant="outline" className="text-xs border-[rgb(var(--pg-secondary))] text-[rgb(var(--pg-secondary))]">
                                +{assessment.skills_tested.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="pt-1">
                        <div className="w-full flex items-center justify-between text-sm text-muted-foreground">
                          <div>
                            {assessment.price_amount ? (
                              <span className="font-semibold text-[rgb(var(--pg-primary))]">{assessment.price_amount} {assessment.price_currency}</span>
                            ) : (
                              <Badge className="bg-[rgb(var(--pg-secondary))] text-white">Free</Badge>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-[rgb(var(--pg-primary))] hover:bg-[rgb(var(--pg-primary))/10]"
                            onClick={() => setSelectedAssessmentId(assessment.id)}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <AssessmentDetails assessmentId={assessment.id} />
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
