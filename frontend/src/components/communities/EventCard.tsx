
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Video,
  UserCheck,
  UserX,
  HelpCircle
} from 'lucide-react';
import { GroupEvent, EventRsvp } from '@/types/communities';
import { CommunitiesService } from '@/services/communitiesService';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/use-toast';

interface EventCardProps {
  event: GroupEvent;
  onRsvp?: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onRsvp }) => {
  const { user } = useAuth();
  const [rsvps, setRsvps] = useState<EventRsvp[]>([]);
  const [userRsvp, setUserRsvp] = useState<EventRsvp | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadRsvps();
  }, [event.id]);

  const loadRsvps = async () => {
    try {
      const eventRsvps = await CommunitiesService.getEventRsvps(event.id);
      setRsvps(eventRsvps);
      
      const currentUserRsvp = eventRsvps.find(rsvp => rsvp.user_id === user?.id);
      setUserRsvp(currentUserRsvp || null);
    } catch (error) {
      console.error('Failed to load event RSVPs:', error);
    }
  };

  const handleRsvp = async (status: EventRsvp['status']) => {
    setIsLoading(true);
    try {
      await CommunitiesService.rsvpEvent(event.id, status);
      await loadRsvps();
      onRsvp?.();
      toast({
        title: "Success",
        description: `RSVP updated to ${status}!`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update RSVP",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAttendingCount = () => rsvps.filter(rsvp => rsvp.status === 'attending').length;
  const getMaybeCount = () => rsvps.filter(rsvp => rsvp.status === 'maybe').length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUpcoming = new Date(event.start_date) > new Date();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{event.title}</CardTitle>
            {event.description && (
              <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
            )}
          </div>
          <Badge variant={isUpcoming ? "default" : "secondary"}>
            {event.event_type}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formatDate(event.start_date)}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {formatTime(event.start_date)} - {formatTime(event.end_date)}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              {event.is_virtual ? (
                <>
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <span>Virtual Event</span>
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{event.location || 'Location TBD'}</span>
                </>
              )}
            </div>

            {event.max_attendees && (
              <div className="flex items-center space-x-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>
                  {getAttendingCount()}/{event.max_attendees} attending
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">RSVPs</div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <UserCheck className="h-4 w-4 text-green-600" />
                <span>{getAttendingCount()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <HelpCircle className="h-4 w-4 text-yellow-600" />
                <span>{getMaybeCount()}</span>
              </div>
            </div>

            {rsvps.length > 0 && (
              <div className="flex -space-x-2">
                {rsvps.slice(0, 5).map((rsvp, index) => (
                  <Avatar key={rsvp.id} className="h-6 w-6 border-2 border-background">
                    <AvatarFallback className="text-xs">
                      {(rsvp as any).profiles?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {rsvps.length > 5 && (
                  <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                    +{rsvps.length - 5}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {event.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {isUpcoming && (
          <div className="flex items-center space-x-2 pt-4 border-t">
            <Button
              variant={userRsvp?.status === 'attending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRsvp('attending')}
              disabled={isLoading}
              className="flex items-center space-x-1"
            >
              <UserCheck className="h-4 w-4" />
              <span>Attending</span>
            </Button>

            <Button
              variant={userRsvp?.status === 'maybe' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRsvp('maybe')}
              disabled={isLoading}
              className="flex items-center space-x-1"
            >
              <HelpCircle className="h-4 w-4" />
              <span>Maybe</span>
            </Button>

            <Button
              variant={userRsvp?.status === 'not_attending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRsvp('not_attending')}
              disabled={isLoading}
              className="flex items-center space-x-1"
            >
              <UserX className="h-4 w-4" />
              <span>Can't Go</span>
            </Button>
          </div>
        )}

        {event.is_virtual && event.virtual_meeting_url && userRsvp?.status === 'attending' && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(event.virtual_meeting_url, '_blank')}
              className="w-full"
            >
              <Video className="h-4 w-4 mr-2" />
              Join Virtual Event
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EventCard;
