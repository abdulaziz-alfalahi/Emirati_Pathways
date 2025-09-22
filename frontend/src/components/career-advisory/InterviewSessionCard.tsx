
import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Video, ExternalLink, Award, User } from 'lucide-react';
import { AdvisorySession } from '@/types/careerAdvisory';
import { updateSession } from '@/services/careerAdvisory/advisorySessionService';
import { useToast } from '@/components/ui/use-toast';

interface InterviewSessionCardProps {
  session: AdvisorySession;
  onStatusChange: () => void;
}

const InterviewSessionCard: React.FC<InterviewSessionCardProps> = ({
  session,
  onStatusChange,
}) => {
  const { toast } = useToast();
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };
  
  const handleCancel = useCallback(async () => {
    try {
      await updateSession(session.id, { status: 'cancelled' });
      onStatusChange();
      toast({
        title: "Interview cancelled",
        description: "Your interview has been cancelled successfully.",
      });
    } catch (error) {
      console.error('Error cancelling session:', error);
      toast({
        title: "Error",
        description: "Failed to cancel the interview.",
        variant: "destructive",
      });
    }
  }, [session.id, onStatusChange, toast]);
  
  const getStatusBadge = () => {
    const statusConfig = {
      scheduled: { className: "bg-blue-100 text-blue-800", label: "Scheduled" },
      completed: { className: "bg-green-100 text-green-800", label: "Completed" },
      cancelled: { className: "bg-red-100 text-red-800", label: "Cancelled" },
      in_progress: { className: "bg-amber-100 text-amber-800", label: "In Progress" },
    };
    
    const config = statusConfig[session.status as keyof typeof statusConfig];
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };
  
  const getInterviewTypeBadge = () => {
    if (!session.interview_type) return null;
    
    const typeConfig = {
      mock: { className: "bg-purple-100 text-purple-800", label: "Mock" },
      practice: { className: "bg-cyan-100 text-cyan-800", label: "Practice" },
      technical: { className: "bg-amber-100 text-amber-800", label: "Technical" },
      behavioral: { className: "bg-green-100 text-green-800", label: "Behavioral" },
    };
    
    const config = typeConfig[session.interview_type as keyof typeof typeConfig];
    
    return config ? (
      <Badge className={config.className} variant="outline">
        {config.label} Interview
      </Badge>
    ) : null;
  };
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
            <div className="flex flex-wrap gap-2 items-center">
              {getStatusBadge()}
              {getInterviewTypeBadge()}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {formatDate(session.scheduled_date)}
            </div>
          </div>
          
          <h3 className="text-lg font-semibold mb-2">
            {session.topic}
          </h3>
          
          {session.details && (
            <p className="text-muted-foreground mb-4 line-clamp-2">
              {session.details}
            </p>
          )}
          
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-6 text-sm">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>30-45 minutes</span>
            </div>
            
            {session.career_advisors?.user_profiles?.full_name && (
              <div className="flex items-center gap-1">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>With: {session.career_advisors.user_profiles.full_name}</span>
              </div>
            )}
            
            {session.career_advisors?.specialization && (
              <div className="flex items-center gap-1">
                <Award className="h-4 w-4 text-muted-foreground" />
                <span>{session.career_advisors.specialization}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="bg-muted/50 px-6 py-4 flex flex-wrap gap-3 justify-end">
        <Link to={`/career-advisory/sessions/${session.id}`}>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <ExternalLink className="h-4 w-4" />
            View Details
          </Button>
        </Link>
        
        {session.status === 'scheduled' && (
          <>
            <Button variant="destructive" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            
            <Link to={`/career-advisory/sessions/${session.id}`}>
              <Button size="sm" className="flex items-center gap-1">
                <Video className="h-4 w-4" />
                Prepare
              </Button>
            </Link>
          </>
        )}
        
        {session.status === 'in_progress' && session.video_call_url && (
          <Button 
            size="sm" 
            className="flex items-center gap-1"
            onClick={() => window.open(session.video_call_url!, '_blank')}
          >
            <Video className="h-4 w-4" />
            Join Interview
          </Button>
        )}
        
        {session.status === 'completed' && (
          <Link to={`/career-advisory/sessions/${session.id}`}>
            <Button variant="secondary" size="sm">
              View Feedback
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
};

export default InterviewSessionCard;
