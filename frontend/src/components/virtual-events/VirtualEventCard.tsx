
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, MapPin, Video, Globe } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { VirtualEventsService } from '@/services/virtualEventsService';
import { VirtualEvent } from '@/types/virtualEvents';

interface VirtualEventCardProps {
  event: VirtualEvent;
  onRegistered?: () => void;
}

const getEventTypeColor = (type: string) => {
  const colors = {
    career_fair: 'bg-blue-100 text-blue-800',
    job_expo: 'bg-green-100 text-green-800',
    networking_event: 'bg-purple-100 text-purple-800',
    workshop: 'bg-orange-100 text-orange-800',
    webinar: 'bg-indigo-100 text-indigo-800',
    conference: 'bg-red-100 text-red-800'
  };
  return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const getStatusColor = (status: string) => {
  const colors = {
    draft: 'bg-gray-100 text-gray-800',
    published: 'bg-green-100 text-green-800',
    live: 'bg-red-100 text-red-800 animate-pulse',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-yellow-100 text-yellow-800'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const VirtualEventCard: React.FC<VirtualEventCardProps> = ({ event, onRegistered }) => {
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = async () => {
    try {
      setIsRegistering(true);
      await VirtualEventsService.registerForEvent(event.id);
      toast({
        title: "Success",
        description: "You've successfully registered for the event!",
      });
      onRegistered?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to register for event",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-AE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUpcoming = new Date(event.start_date) > new Date();
  const isLive = event.status === 'live';

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      {event.cover_image_url && (
        <div className="relative h-48 overflow-hidden rounded-t-lg">
          <img 
            src={event.cover_image_url} 
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <Badge className={getStatusColor(event.status)}>
              {event.status}
            </Badge>
            {isLive && (
              <Badge className="bg-red-500 text-white animate-pulse">
                <Video className="h-3 w-3 mr-1" />
                LIVE
              </Badge>
            )}
          </div>
        </div>
      )}

      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="line-clamp-2">{event.title}</CardTitle>
            <CardDescription className="line-clamp-2 mt-2">
              {event.description}
            </CardDescription>
          </div>
          <div className="ml-4">
            {event.is_public ? (
              <Globe className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Users className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge className={getEventTypeColor(event.event_type)}>
              {event.event_type.replace('_', ' ')}
            </Badge>
            <Badge variant="outline">
              {event.meeting_platform}
            </Badge>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(event.start_date)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>{formatTime(event.start_date)} - {formatTime(event.end_date)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>{event.timezone}</span>
            </div>
          </div>

          {event.speakers && event.speakers.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">Speakers:</p>
              <div className="flex flex-wrap gap-1">
                {event.speakers.slice(0, 3).map((speaker: any, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {speaker.name}
                  </Badge>
                ))}
                {event.speakers.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{event.speakers.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {event.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
              {event.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{event.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}
          
          <div className="flex space-x-2 pt-2">
            <Link to={`/virtual-events/${event.id}`} className="flex-1">
              <Button variant="outline" className="w-full">
                View Details
              </Button>
            </Link>
            {isUpcoming && event.status === 'published' && (
              <Button 
                onClick={handleRegister}
                disabled={isRegistering}
                className="flex-1"
              >
                {isRegistering ? 'Registering...' : 'Register'}
              </Button>
            )}
            {isLive && (
              <Link to={`/virtual-events/${event.id}/live`} className="flex-1">
                <Button className="w-full bg-red-500 hover:bg-red-600">
                  <Video className="h-4 w-4 mr-2" />
                  Join Live
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VirtualEventCard;
