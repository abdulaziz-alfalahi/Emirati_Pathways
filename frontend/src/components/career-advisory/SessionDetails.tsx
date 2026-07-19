
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { getSessions, updateSession, createVideoCallLink } from '@/services/careerAdvisory/advisorySessionService';
import { AdvisorySession } from '@/types/careerAdvisory';
import { format } from 'date-fns';
import { Calendar, Clock, User, Video, FileText } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const SessionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<AdvisorySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const [startingCall, setStartingCall] = useState(false);

  useEffect(() => {
    const loadSessionData = async () => {
      if (!id || !user) return;
      
      try {
        const sessions = await getSessions(user.id);
        const sessionData = sessions.find(s => s.id === id);
        
        if (sessionData) {
          setSession(sessionData);
          setNotes(sessionData.notes || '');
          setFeedback(sessionData.feedback || '');
        }
      } catch (error) {
        console.error('Error loading session data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load session details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadSessionData();
  }, [id, user, toast]);

  const handleStartVideoCall = async () => {
    if (!session || !id) return;
    
    setStartingCall(true);
    
    try {
      const videoCallUrl = await createVideoCallLink(id);
      setSession(prev => prev ? { ...prev, video_call_url: videoCallUrl } : null);
      
      toast({
        title: 'Success',
        description: 'Video call initiated',
      });
      
      // In a real application, you would redirect to the video call URL
      window.open(videoCallUrl, '_blank');
      
    } catch (error) {
      console.error('Error starting video call:', error);
      toast({
        title: 'Error',
        description: 'Failed to start video call',
        variant: 'destructive',
      });
    } finally {
      setStartingCall(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!session || !id) return;
    
    setSaving(true);
    
    try {
      const updatedSession = await updateSession(id, {
        notes,
      });
      
      setSession(updatedSession);
      
      toast({
        title: 'Success',
        description: 'Session notes saved',
      });
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notes',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!session || !id) return;
    
    setSaving(true);
    
    try {
      const updatedSession = await updateSession(id, {
        feedback,
        status: 'completed'
      });
      
      setSession(updatedSession);
      
      toast({
        title: 'Success',
        description: 'Feedback submitted and session marked as completed',
      });
      
      // Redirect back to advisory page after successful submission
      navigate('/career-advisory');
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit feedback',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <p>Session not found or you don't have access to this session.</p>
          <Link to="/career-advisory" className="mt-4 inline-block">
            <Button>Back to Career Advisory</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const isAdvisor = user?.id === session.career_advisors?.user_id;
  const isUpcoming = session.status === 'scheduled';
  const isActive = session.status === 'scheduled'; // Changed from 'in_progress' to match existing status options
  const isCompleted = session.status === 'completed';

  // Advisor name and avatar
  const advisorName = session.career_advisors?.user_profiles?.full_name || 'Advisor';
  const advisorInitial = (session.career_advisors?.user_profiles?.full_name || 'A').substring(0, 1);
  const advisorAvatar = session.career_advisors?.user_profiles?.avatar_url || '';

  // Candidate name and avatar
  const candidateName = session.candidate_profiles?.full_name || 'Candidate';
  const candidateInitial = (session.candidate_profiles?.full_name || 'C').substring(0, 1);
  const candidateAvatar = session.candidate_profiles?.avatar_url || '';

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">{session.topic}</CardTitle>
            <Badge className={
              isUpcoming ? 'bg-blue-100 text-blue-800' :
              isActive ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }>
              {session.status === 'scheduled' ? 'Scheduled' : 
               session.status === 'completed' ? 'Completed' : 
               'Cancelled'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Date</div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 me-2 text-muted-foreground" />
                {format(new Date(session.scheduled_date), 'PPP')}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Time</div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 me-2 text-muted-foreground" />
                {format(new Date(session.scheduled_date), 'h:mm a')}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="text-sm text-muted-foreground mb-2">
              {isAdvisor ? 'Candidate' : 'Career Advisor'}
            </div>
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage 
                  src={isAdvisor ? candidateAvatar : advisorAvatar}
                  alt={isAdvisor ? candidateName : advisorName}
                />
                <AvatarFallback>
                  {isAdvisor ? candidateInitial : advisorInitial}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">
                  {isAdvisor ? candidateName : advisorName}
                </div>
                {!isAdvisor && session.career_advisors && (
                  <div className="text-sm text-muted-foreground">
                    {session.career_advisors.specialization}
                  </div>
                )}
              </div>
            </div>
          </div>

          {session.details && (
            <div className="pt-2 border-t">
              <div className="text-sm text-muted-foreground mb-2">Session Details</div>
              <p className="text-sm">{session.details}</p>
            </div>
          )}

          {session.video_call_url && (
            <Button className="w-full" onClick={() => window.open(session.video_call_url!, '_blank')}>
              <Video className="me-2 h-4 w-4" />
              Join Video Call
            </Button>
          )}
          
          {isUpcoming && !session.video_call_url && (
            <Button 
              className="w-full" 
              onClick={handleStartVideoCall}
              disabled={startingCall}
            >
              <Video className="me-2 h-4 w-4" />
              {startingCall ? 'Starting Video Call...' : 'Start Video Call'}
            </Button>
          )}
          
          {isAdvisor && (
            <div className="pt-2 border-t">
              <div className="text-sm text-muted-foreground mb-2">Session Notes</div>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add your notes about this session"
                rows={4}
              />
              <Button 
                className="mt-2" 
                variant="outline" 
                onClick={handleSaveNotes}
                disabled={saving}
              >
                Save Notes
              </Button>
            </div>
          )}
          
          {isActive && !isAdvisor && (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full">Complete Session & Submit Feedback</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Session Feedback</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="feedback">Share your feedback about this session</Label>
                    <Textarea
                      id="feedback"
                      value={feedback}
                      onChange={e => setFeedback(e.target.value)}
                      placeholder="How was your experience? Was the advice helpful?"
                      rows={4}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleSubmitFeedback}
                    disabled={saving}
                  >
                    {saving ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          
          {isCompleted && session.feedback && !isAdvisor && (
            <div className="pt-2 border-t">
              <div className="text-sm text-muted-foreground mb-2">Your Feedback</div>
              <p className="text-sm italic">{session.feedback}</p>
            </div>
          )}
          
          {isCompleted && session.notes && isAdvisor && (
            <div className="pt-2 border-t">
              <div className="text-sm text-muted-foreground mb-2">Your Notes</div>
              <p className="text-sm">{session.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Link to="/career-advisory">
          <Button variant="outline">Back to Career Advisory</Button>
        </Link>
        
        {isCompleted && (
          <Button variant="outline" onClick={() => navigate('/career-advisory/schedule')}>
            Schedule Another Session
          </Button>
        )}
      </div>
    </div>
  );
};

export default SessionDetails;
