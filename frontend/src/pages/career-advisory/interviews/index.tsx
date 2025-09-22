
import React, { useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { CalendarPlus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchAdvisorySessions } from '@/services/careerAdvisory/advisorySessionService';
import { AdvisorySession } from '@/types/careerAdvisory';
import InterviewSessionCard from '@/components/career-advisory/InterviewSessionCard';

const InterviewsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user's interview sessions with useCallback to prevent unnecessary refetching
  const fetchSessions = useCallback(async () => {
    if (!user?.id) return [];
    const allSessions = await fetchAdvisorySessions(user.id);
    // Filter only interview sessions
    return allSessions.filter(session => session.is_interview === true);
  }, [user?.id]);

  // Use the stable callback in useQuery
  const { data: sessions, isLoading, error, refetch } = useQuery({
    queryKey: ['interviewSessions', user?.id],
    queryFn: fetchSessions,
    enabled: !!user?.id,
  });

  // Filter sessions by status
  const getSessionsByStatus = (status: string) => {
    return sessions?.filter(session => session.status === status) || [];
  };

  const upcomingSessions = getSessionsByStatus("scheduled");
  const completedSessions = getSessionsByStatus("completed");
  const cancelledSessions = getSessionsByStatus("cancelled");
  const inProgressSessions = getSessionsByStatus("in_progress");

  // Show error toast only once when error occurs
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load interview sessions",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const renderSessionsList = (sessionsList: AdvisorySession[]) => {
    if (sessionsList.length === 0) {
      return (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No interview sessions found</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 mt-4">
        {sessionsList.map((session) => (
          <InterviewSessionCard 
            key={session.id} 
            session={session}
            onStatusChange={refetch} 
          />
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Online Interviews</h1>
          <Link to="/career-advisory/interviews/schedule">
            <Button className="flex items-center gap-2">
              <CalendarPlus className="h-4 w-4" />
              Schedule Interview
            </Button>
          </Link>
        </div>

        <div className="mb-6">
          <p className="text-muted-foreground">
            Practice your interview skills with our professional career advisors. 
            Schedule mock interviews, technical assessments, or behavioral interviews 
            to help you prepare for your next job opportunity.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emirati-teal"></div>
          </div>
        ) : (
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="inProgress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming">
              {renderSessionsList(upcomingSessions)}
            </TabsContent>
            
            <TabsContent value="inProgress">
              {renderSessionsList(inProgressSessions)}
            </TabsContent>
            
            <TabsContent value="completed">
              {renderSessionsList(completedSessions)}
            </TabsContent>
            
            <TabsContent value="cancelled">
              {renderSessionsList(cancelledSessions)}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
};

export default InterviewsPage;
