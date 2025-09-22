
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  Calendar, 
  MessageSquare, 
  Star, 
  Clock, 
  CheckCircle, 
  XCircle,
  Plus,
  Video,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { mentorshipService } from '@/services/mentorshipService';
import type { MentorshipRelationship, MentorshipSession } from '@/types/mentorship';

export const MentorshipDashboard: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [relationships, setRelationships] = useState<MentorshipRelationship[]>([]);
  const [selectedRelationship, setSelectedRelationship] = useState<MentorshipRelationship | null>(null);
  const [sessions, setSessions] = useState<MentorshipSession[]>([]);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [newSession, setNewSession] = useState({
    scheduled_date: '',
    topic: '',
    duration_minutes: 60,
    video_call_url: ''
  });

  useEffect(() => {
    loadRelationships();
  }, []);

  useEffect(() => {
    if (selectedRelationship) {
      loadSessions(selectedRelationship.id);
    }
  }, [selectedRelationship]);

  const loadRelationships = async () => {
    try {
      const data = await mentorshipService.getUserRelationships();
      setRelationships(data);
      if (data.length > 0 && !selectedRelationship) {
        setSelectedRelationship(data[0]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load mentorship relationships",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async (relationshipId: string) => {
    try {
      const data = await mentorshipService.getSessionsForRelationship(relationshipId);
      setSessions(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load sessions",
        variant: "destructive"
      });
    }
  };

  const handleStatusUpdate = async (relationshipId: string, status: MentorshipRelationship['status']) => {
    try {
      await mentorshipService.updateRelationshipStatus(relationshipId, status);
      toast({
        title: "Success",
        description: `Mentorship ${status} successfully`
      });
      loadRelationships();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update mentorship status",
        variant: "destructive"
      });
    }
  };

  const handleScheduleSession = async () => {
    if (!selectedRelationship || !newSession.scheduled_date) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      await mentorshipService.scheduleSession({
        relationship_id: selectedRelationship.id,
        scheduled_date: newSession.scheduled_date,
        topic: newSession.topic,
        duration_minutes: newSession.duration_minutes,
        video_call_url: newSession.video_call_url
      });
      
      toast({
        title: "Success",
        description: "Session scheduled successfully!"
      });
      
      setShowScheduleDialog(false);
      setNewSession({
        scheduled_date: '',
        topic: '',
        duration_minutes: 60,
        video_call_url: ''
      });
      
      if (selectedRelationship) {
        loadSessions(selectedRelationship.id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule session",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSessionStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'no_show': return <XCircle className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
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
    total: relationships.length,
    active: relationships.filter(r => r.status === 'active').length,
    pending: relationships.filter(r => r.status === 'requested').length,
    completed: relationships.filter(r => r.status === 'completed').length
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8" />
          Mentorship Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your mentorship relationships and sessions
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Relationships</p>
                <p className="text-lg font-semibold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-lg font-semibold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-lg font-semibold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-lg font-semibold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {relationships.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No mentorship relationships yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start by finding a mentor or creating your mentor profile
            </p>
            <div className="flex gap-2">
              <Button>Find a Mentor</Button>
              <Button variant="outline">Become a Mentor</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Relationships List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Your Relationships</CardTitle>
                <CardDescription>
                  Click on a relationship to view details and sessions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {relationships.map(relationship => (
                  <div
                    key={relationship.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedRelationship?.id === relationship.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedRelationship(relationship)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {relationship.mentee_id.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm truncate">
                            Mentorship Relationship
                          </p>
                          <Badge className={`text-xs ${getStatusColor(relationship.status)}`}>
                            {relationship.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {relationship.goals || 'No specific goals set'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Started {new Date(relationship.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Relationship Details */}
          <div className="lg:col-span-2">
            {selectedRelationship ? (
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="sessions">Sessions</TabsTrigger>
                  <TabsTrigger value="messages">Messages</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Relationship Overview</CardTitle>
                          <CardDescription>
                            Manage this mentorship relationship
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(selectedRelationship.status)}>
                          {selectedRelationship.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h4 className="font-medium mb-2">Goals & Objectives</h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedRelationship.goals || 'No specific goals have been set for this mentorship.'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Start Date</h4>
                          <p className="text-sm text-muted-foreground">
                            {selectedRelationship.start_date 
                              ? new Date(selectedRelationship.start_date).toLocaleDateString()
                              : 'Not started yet'
                            }
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Duration</h4>
                          <p className="text-sm text-muted-foreground">
                            {selectedRelationship.end_date
                              ? `Until ${new Date(selectedRelationship.end_date).toLocaleDateString()}`
                              : 'Ongoing'
                            }
                          </p>
                        </div>
                      </div>

                      {selectedRelationship.status === 'requested' && (
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleStatusUpdate(selectedRelationship.id, 'active')}
                            className="flex-1"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Accept Request
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => handleStatusUpdate(selectedRelationship.id, 'cancelled')}
                            className="flex-1"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Decline
                          </Button>
                        </div>
                      )}

                      {selectedRelationship.status === 'active' && (
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleStatusUpdate(selectedRelationship.id, 'completed')}
                            variant="outline"
                          >
                            Mark as Completed
                          </Button>
                          <Button 
                            onClick={() => handleStatusUpdate(selectedRelationship.id, 'accepted')}
                            variant="outline"
                          >
                            Put on Hold
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="sessions">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Sessions</CardTitle>
                          <CardDescription>
                            Schedule and manage mentorship sessions
                          </CardDescription>
                        </div>
                        <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <Plus className="h-4 w-4 mr-2" />
                              Schedule Session
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Schedule New Session</DialogTitle>
                              <DialogDescription>
                                Set up a new mentorship session
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="date">Date & Time</Label>
                                <Input
                                  id="date"
                                  type="datetime-local"
                                  value={newSession.scheduled_date}
                                  onChange={(e) => setNewSession(prev => ({ ...prev, scheduled_date: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Label htmlFor="topic">Topic</Label>
                                <Input
                                  id="topic"
                                  placeholder="What will you discuss?"
                                  value={newSession.topic}
                                  onChange={(e) => setNewSession(prev => ({ ...prev, topic: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Label htmlFor="duration">Duration (minutes)</Label>
                                <Input
                                  id="duration"
                                  type="number"
                                  value={newSession.duration_minutes}
                                  onChange={(e) => setNewSession(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
                                />
                              </div>
                              <div>
                                <Label htmlFor="video-url">Video Call URL (optional)</Label>
                                <Input
                                  id="video-url"
                                  placeholder="https://zoom.us/j/..."
                                  value={newSession.video_call_url}
                                  onChange={(e) => setNewSession(prev => ({ ...prev, video_call_url: e.target.value }))}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  onClick={() => setShowScheduleDialog(false)}
                                  className="flex-1"
                                >
                                  Cancel
                                </Button>
                                <Button onClick={handleScheduleSession} className="flex-1">
                                  Schedule Session
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {sessions.length === 0 ? (
                        <div className="text-center py-8">
                          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="font-semibold mb-2">No sessions scheduled</h3>
                          <p className="text-muted-foreground mb-4">
                            Schedule your first mentorship session to get started
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {sessions.map(session => (
                            <div key={session.id} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {getSessionStatusIcon(session.status)}
                                  <h4 className="font-medium">
                                    {session.topic || 'Mentorship Session'}
                                  </h4>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {session.status}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(session.scheduled_date).toLocaleString()}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  {session.duration_minutes} minutes
                                </div>
                                {session.video_call_url && (
                                  <div className="flex items-center gap-2">
                                    <Video className="h-4 w-4" />
                                    <a 
                                      href={session.video_call_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline"
                                    >
                                      Join Video Call
                                    </a>
                                  </div>
                                )}
                              </div>
                              {session.notes && (
                                <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                                  <div className="flex items-center gap-2 mb-1">
                                    <FileText className="h-4 w-4" />
                                    <span className="font-medium">Notes</span>
                                  </div>
                                  <p>{session.notes}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="messages">
                  <Card>
                    <CardContent className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Messaging Coming Soon</h3>
                        <p className="text-muted-foreground">
                          Built-in messaging features will be available in the next update
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Select a Relationship</h3>
                    <p className="text-muted-foreground">
                      Choose a mentorship relationship from the list to view details
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
