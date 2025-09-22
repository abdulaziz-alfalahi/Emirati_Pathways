
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string;
    event_type: string;
    start_date: string;
    end_date?: string;
    location: string;
    registration_url?: string;
    image_url?: string;
    community: {
      name: string;
      logo_url?: string;
    };
  };
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const startDate = new Date(event.start_date);
  const endDate = event.end_date ? new Date(event.end_date) : null;
  
  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };
  
  const isSameDay = endDate && 
    startDate.getDate() === endDate.getDate() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear();
  
  return (
    <Card className="h-full hover:border-primary/30 transition-all">
      <CardHeader className="space-y-1">
        <div className="flex justify-between items-start">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            {event.event_type}
          </Badge>
          <div className="text-xs text-muted-foreground">
            By {event.community.name}
          </div>
        </div>
        <CardTitle className="text-lg">{event.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {event.description}
        </p>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(startDate, 'MMMM d, yyyy')}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {formatTime(startDate)}
              {endDate && (
                <>
                  {isSameDay ? ` - ${formatTime(endDate)}` : ` - ${format(endDate, 'MMMM d, yyyy')} at ${formatTime(endDate)}`}
                </>
              )}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{event.location}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        {event.registration_url ? (
          <Button className="w-full" asChild>
            <a href={event.registration_url} target="_blank" rel="noopener noreferrer">
              Register Now
            </a>
          </Button>
        ) : (
          <Button variant="outline" className="w-full">
            View Details
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
