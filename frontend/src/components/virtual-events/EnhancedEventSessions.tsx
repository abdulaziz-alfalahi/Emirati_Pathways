
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Users, Video, Play, MessageSquare } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { VirtualEventsService } from '@/services/virtualEventsService';
import { EventSession } from '@/types/virtualEvents';
import SessionChat from './SessionChat';
import InteractiveQA from './InteractiveQA';
import BreakoutRooms from './BreakoutRooms';
import AttendeeMatching from './AttendeeMatching';

interface EnhancedEventSessionsProps {
  eventId: string;
}

const EnhancedEventSessions: React.FC<EnhancedEventSessionsProps> = ({ eventId }) => {
  const [sessions, setSessions] = useState<EventSession[]>([]);
  const [activeSession, setActiveSession] = useState<EventSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, [eventId]);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const data = await VirtualEventsService.getEventSessions(eventId);
      setSessions(data);
      
      // Set the first live session as active, or the first session if none are live
      const liveSession = data.find(s => s.start_time <= new Date().toISOString() && s.end_time >= new Date().toISOString());
      setActiveSession(liveSession || data[0] || null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load event sessions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterForSession = async (sessionId: string) => {
    try {
      await VirtualEventsService.registerForSession(sessionId);
      toast({
        title: "Success",
        description: "Successfully registered for session!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to register for session",
        variant: "destructive",
      });
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-AE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isSessionLive = (session: EventSession) => {
    const now = new Date();
    const start = new Date(session.start_time);
    const end = new Date(session.end_time);
    return now >= start && now <= end;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Interactive Sessions</h2>
        <Badge variant="secondary">{sessions.length} Sessions</Badge>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No sessions scheduled</h3>
          <p className="text-muted-foreground">
            Event sessions will appear here when they are scheduled.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sessions List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Sessions Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sessions.map((session) => (
                  <div 
                    key={session.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      activeSession?.id === session.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setActiveSession(session)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{session.title}</h4>
                      {isSessionLive(session) && (
                        <Badge className="bg-red-500 text-white animate-pulse text-xs">
                          LIVE
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 me-1" />
                        {formatDateTime(session.start_time)}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-3 w-3 me-1" />
                        {session.current_attendees} attendees
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Session Details and Interactive Features */}
          <div className="lg:col-span-2">
            {activeSession ? (
              <div className="space-y-6">
                {/* Session Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {activeSession.title}
                          {isSessionLive(activeSession) && (
                            <Badge className="bg-red-500 text-white animate-pulse">
                              LIVE
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {activeSession.description}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDateTime(activeSession.start_time)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {Math.round((new Date(activeSession.end_time).getTime() - new Date(activeSession.start_time).getTime()) / (1000 * 60))} min
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{activeSession.current_attendees} attendees</span>
                      </div>
                    </div>

                    <div className="flex space-x-2 mt-4">
                      <Button 
                        onClick={() => handleRegisterForSession(activeSession.id)}
                      >
                        Register for Session
                      </Button>
                      
                      {activeSession.meeting_url && (
                        <Button variant="outline">
                          <Video className="h-4 w-4 me-2" />
                          Join Meeting
                        </Button>
                      )}
                      
                      {activeSession.recording_url && (
                        <Button variant="outline">
                          <Play className="h-4 w-4 me-2" />
                          Watch Recording
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                </Card>

                {/* Interactive Features Tabs */}
                <Tabs defaultValue="chat" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="chat">
                      <MessageSquare className="h-4 w-4 me-2" />
                      Chat
                    </TabsTrigger>
                    <TabsTrigger value="qa">Q&A</TabsTrigger>
                    <TabsTrigger value="breakout">Breakout</TabsTrigger>
                    <TabsTrigger value="networking">Network</TabsTrigger>
                  </TabsList>

                  <TabsContent value="chat" className="h-96">
                    <SessionChat 
                      sessionId={activeSession.id} 
                      eventId={eventId} 
                    />
                  </TabsContent>

                  <TabsContent value="qa" className="h-96">
                    <InteractiveQA 
                      sessionId={activeSession.id} 
                      eventId={eventId}
                      isModerator={false}
                    />
                  </TabsContent>

                  <TabsContent value="breakout" className="h-96 overflow-y-auto">
                    <BreakoutRooms 
                      sessionId={activeSession.id} 
                      eventId={eventId} 
                    />
                  </TabsContent>

                  <TabsContent value="networking" className="h-96 overflow-y-auto">
                    <AttendeeMatching eventId={eventId} />
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select a Session</h3>
                  <p className="text-muted-foreground">
                    Choose a session from the left to view details and interact with other attendees.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedEventSessions;
