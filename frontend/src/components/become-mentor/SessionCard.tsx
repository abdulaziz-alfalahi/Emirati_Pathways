
import React, { useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MessageSquare, Star } from 'lucide-react';
import { format } from 'date-fns';

interface SimpleSession {
  id: string;
  scheduled_date: string;
  duration_minutes: number;
  topic: string | null;
  status: string;
  notes: string | null;
  rating: number | null;
}

interface SessionCardProps {
  session: SimpleSession;
  onUpdateStatus: (sessionId: string, status: string) => void;
}

export const SessionCard: React.FC<SessionCardProps> = React.memo(({ session, onUpdateStatus }) => {
  const statusColor = useMemo(() => {
    switch (session.status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, [session.status]);

  const formattedDate = useMemo(() => 
    format(new Date(session.scheduled_date), 'PPP'),
    [session.scheduled_date]
  );

  const handleComplete = useCallback(() => {
    onUpdateStatus(session.id, 'completed');
  }, [onUpdateStatus, session.id]);

  const handleCancel = useCallback(() => {
    onUpdateStatus(session.id, 'cancelled');
  }, [onUpdateStatus, session.id]);

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{session.topic || 'Mentorship Session'}</CardTitle>
          <Badge className={statusColor}>
            {session.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <SessionMetrics 
            date={formattedDate}
            duration={session.duration_minutes}
          />
          
          {session.notes && (
            <SessionNotes notes={session.notes} />
          )}
          
          {session.rating && (
            <SessionRating rating={session.rating} />
          )}
          
          <SessionActions
            status={session.status}
            onComplete={handleComplete}
            onCancel={handleCancel}
          />
        </div>
      </CardContent>
    </Card>
  );
});

SessionCard.displayName = 'SessionCard';

interface SessionMetricsProps {
  date: string;
  duration: number;
}

const SessionMetrics: React.FC<SessionMetricsProps> = React.memo(({ date, duration }) => (
  <div className="flex items-center gap-4 text-sm text-muted-foreground">
    <div className="flex items-center gap-1">
      <Calendar className="h-4 w-4" />
      {date}
    </div>
    <div className="flex items-center gap-1">
      <Clock className="h-4 w-4" />
      {duration} minutes
    </div>
  </div>
));

SessionMetrics.displayName = 'SessionMetrics';

interface SessionNotesProps {
  notes: string;
}

const SessionNotes: React.FC<SessionNotesProps> = React.memo(({ notes }) => (
  <div className="flex items-start gap-2">
    <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
    <p className="text-sm">{notes}</p>
  </div>
));

SessionNotes.displayName = 'SessionNotes';

interface SessionRatingProps {
  rating: number;
}

const SessionRating: React.FC<SessionRatingProps> = React.memo(({ rating }) => (
  <div className="flex items-center gap-2">
    <Star className="h-4 w-4 text-yellow-500" />
    <span className="text-sm">Rating: {rating}/5</span>
  </div>
));

SessionRating.displayName = 'SessionRating';

interface SessionActionsProps {
  status: string;
  onComplete: () => void;
  onCancel: () => void;
}

const SessionActions: React.FC<SessionActionsProps> = React.memo(({ status, onComplete, onCancel }) => {
  if (status === 'scheduled') {
    return (
      <div className="flex gap-2 pt-2">
        <Button size="sm" onClick={onComplete}>
          Mark Complete
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    );
  }

  if (status === 'completed') {
    return <Button size="sm">Prepare Session</Button>;
  }

  return <Button size="sm" variant="outline">View Notes</Button>;
});

SessionActions.displayName = 'SessionActions';
