
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAdvisorById, fetchCareerAdvisorById } from '@/services/careerAdvisory/advisoryService';
import { getAdvisorSessions, fetchAdvisorySessions } from '@/services/careerAdvisory/advisorySessionService';
import { CareerAdvisor, AdvisorySession } from '@/types/careerAdvisory';
import { format } from 'date-fns';
import { Calendar, User, Briefcase } from 'lucide-react';

const AdvisorPortfolio: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [advisor, setAdvisor] = useState<CareerAdvisor | null>(null);
  const [sessions, setSessions] = useState<AdvisorySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdvisorData = async () => {
      if (!id) return;
      
      try {
        const [advisorData, sessionsData] = await Promise.all([
          getAdvisorById(id),
          getAdvisorSessions(id)
        ]);
        
        setAdvisor(advisorData);
        setSessions(sessionsData);
      } catch (error) {
        console.error('Error loading advisor data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAdvisorData();
  }, [id]);

  const completedSessions = sessions.filter(session => session.status === 'completed');

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!advisor) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <p>Advisor not found.</p>
          <Link to="/career-advisory" className="mt-4 inline-block">
            <Button>Back to Career Advisory</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const advisorName = advisor.user_profiles?.full_name || 'Career Advisor';
  const advisorInitial = (advisor.user_profiles?.full_name || 'A').substring(0, 1);
  const avatarUrl = advisor.user_profiles?.avatar_url || '';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start gap-4 pb-2">
          <Avatar className="h-16 w-16">
            <AvatarImage 
              src={avatarUrl} 
              alt={advisorName}
            />
            <AvatarFallback className="text-lg">
              {advisorInitial}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <CardTitle className="text-2xl flex items-center justify-between">
              {advisorName}
              <Badge variant="outline" className="ms-2">
                {advisor.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </CardTitle>
            <div className="flex items-center text-muted-foreground">
              <Briefcase className="h-4 w-4 me-1" />
              <span>{advisor.specialization}</span>
            </div>
            <div className="mt-1">
              <Badge variant="secondary">{completedSessions.length} Sessions Completed</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">About</h3>
              <p className="text-muted-foreground mt-1">
                {advisor.bio || 'No bio provided.'}
              </p>
            </div>
            
            <div className="flex justify-end">
              <Link to={`/career-advisory/schedule?advisor=${advisor.id}`}>
                <Button>
                  Schedule a Session
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
        </CardHeader>
        <CardContent>
          {completedSessions.length > 0 ? (
            <div className="space-y-4">
              {completedSessions.map(session => (
                <div 
                  key={session.id} 
                  className="p-3 rounded-lg border flex justify-between items-center"
                >
                  <div>
                    <h4 className="font-medium">{session.topic}</h4>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3 me-1" />
                      <span>
                        {format(new Date(session.scheduled_date), 'PPP')}
                      </span>
                    </div>
                  </div>
                  <div>
                    {session.rating && (
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`h-4 w-4 ${
                              i < session.rating! ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>No session history available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvisorPortfolio;
