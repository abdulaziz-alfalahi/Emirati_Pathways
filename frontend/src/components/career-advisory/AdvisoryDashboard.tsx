
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Video } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { fetchAdvisorySessions } from '@/services/careerAdvisory';

const AdvisoryDashboard: React.FC = () => {
  const { user } = useAuth();
  
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['advisorySessions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return fetchAdvisorySessions(user.id);
    },
    enabled: !!user?.id,
  });
  
  const upcomingSessions = sessions
    .filter(session => session.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
  
  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };
  
  const renderSessionsList = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emirati-teal"></div>
        </div>
      );
    }
    
    if (upcomingSessions.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground mb-6">You have no upcoming advisory sessions</p>
          <Link to="/career-advisory/schedule">
            <Button>Schedule a Session</Button>
          </Link>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {upcomingSessions.slice(0, 3).map((session) => (
          <Card key={session.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6">
                <div className="flex justify-between items-start gap-4 mb-2">
                  <h3 className="font-medium">
                    <Link to={`/career-advisory/sessions/${session.id}`} className="hover:underline">
                      {session.topic}
                    </Link>
                  </h3>
                  {session.is_interview && (
                    <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                      Interview
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground mt-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(session.scheduled_date)}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    30-45 minutes
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/50 px-6 py-3 flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {session.is_interview 
                    ? `${session.interview_type} Interview` 
                    : 'Advisory Session'}
                </span>
                <Link to={`/career-advisory/sessions/${session.id}`}>
                  <Button size="sm" variant="outline">View Details</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {upcomingSessions.length > 3 && (
          <div className="text-center pt-2">
            <Link to="/career-advisory">
              <Button variant="link">
                View All Sessions
              </Button>
            </Link>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Upcoming Sessions</CardTitle>
          <CardDescription>
            Your scheduled advisory sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderSessionsList()}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Career Services</CardTitle>
          <CardDescription>
            Explore our career advisory services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link to="/career-advisory/schedule">
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Advisory Session
            </Button>
          </Link>
          
          <Link to="/career-advisory/interviews">
            <Button variant="outline" className="w-full justify-start">
              <Video className="mr-2 h-4 w-4" />
              Online Interviews
            </Button>
          </Link>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            Get personalized guidance from our career advisors
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdvisoryDashboard;
