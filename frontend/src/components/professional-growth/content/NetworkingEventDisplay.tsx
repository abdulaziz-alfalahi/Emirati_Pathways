
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Clock, Star, CheckCircle } from 'lucide-react';

export interface NetworkingEvent {
  id: string;
  title: string;
  description: string;
  type: 'conference' | 'workshop' | 'meetup' | 'webinar' | 'panel';
  date: string;
  time: string;
  location: {
    venue: string;
    address: string;
    isVirtual: boolean;
  };
  capacity: number;
  registered: number;
  price: number;
  currency: string;
  industry: string[];
  skills: string[];
  speakers: {
    id: string;
    name: string;
    title: string;
    company: string;
    avatar?: string;
  }[];
  rating?: number;
  attendeeLevel: 'beginner' | 'intermediate' | 'advanced' | 'all';
  registrationStatus: 'open' | 'full' | 'closed' | 'registered';
}

const typeColors = {
  conference: 'bg-blue-100 text-blue-800',
  workshop: 'bg-green-100 text-green-800',
  meetup: 'bg-purple-100 text-purple-800',
  webinar: 'bg-yellow-100 text-yellow-800',
  panel: 'bg-red-100 text-red-800'
};

const levelColors = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800',
  all: 'bg-gray-100 text-gray-800'
};

export const NetworkingEventDisplay: React.FC<{ event: NetworkingEvent }> = ({ event }) => {
  const registrationPercentage = (event.registered / event.capacity) * 100;
  
  const getRegistrationButtonText = () => {
    switch (event.registrationStatus) {
      case 'registered': return 'Registered';
      case 'full': return 'Event Full';
      case 'closed': return 'Registration Closed';
      default: return event.price > 0 ? `Register (${event.currency} ${event.price})` : 'Register Free';
    }
  };

  const isRegistrationDisabled = ['full', 'closed', 'registered'].includes(event.registrationStatus);

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge className={typeColors[event.type]}>
              {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
            </Badge>
            <Badge className={levelColors[event.attendeeLevel]}>
              {event.attendeeLevel === 'all' ? 'All Levels' : event.attendeeLevel.charAt(0).toUpperCase() + event.attendeeLevel.slice(1)}
            </Badge>
          </div>
          {event.rating && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{event.rating}</span>
            </div>
          )}
        </div>
        
        <CardTitle className="text-lg">{event.title}</CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {event.description}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Date, Time, Location */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-[rgb(var(--pg-secondary))]" />
            <span>{event.date}</span>
            <Clock className="h-4 w-4 text-[rgb(var(--pg-secondary))] ml-2" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-[rgb(var(--pg-secondary))]" />
            {event.location.isVirtual ? (
              <span className="text-green-600">Virtual Event</span>
            ) : (
              <span>{event.location.venue}</span>
            )}
          </div>
        </div>

        {/* Registration Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Attendees</span>
            </div>
            <span className="font-medium">
              {event.registered}/{event.capacity}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-[rgb(var(--pg-secondary))] h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(registrationPercentage, 100)}%` }}
            />
          </div>
          {registrationPercentage >= 90 && (
            <p className="text-xs text-orange-600 font-medium">
              Almost full! Only {event.capacity - event.registered} spots left
            </p>
          )}
        </div>

        {/* Industries */}
        <div className="space-y-2">
          <span className="text-sm font-medium">Industries</span>
          <div className="flex flex-wrap gap-1">
            {event.industry.slice(0, 3).map((industry) => (
              <Badge key={industry} variant="outline" className="text-xs">
                {industry}
              </Badge>
            ))}
            {event.industry.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{event.industry.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-2">
          <span className="text-sm font-medium">Skills Focus</span>
          <div className="flex flex-wrap gap-1">
            {event.skills.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {event.skills.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{event.skills.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Speakers */}
        {event.speakers.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Featured Speakers</span>
            <div className="space-y-2">
              {event.speakers.slice(0, 2).map((speaker) => (
                <div key={speaker.id} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                    {speaker.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{speaker.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {speaker.title} at {speaker.company}
                    </p>
                  </div>
                </div>
              ))}
              {event.speakers.length > 2 && (
                <p className="text-xs text-muted-foreground">
                  +{event.speakers.length - 2} more speakers
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            className="flex-1"
            disabled={isRegistrationDisabled}
            variant={event.registrationStatus === 'registered' ? 'outline' : 'default'}
          >
            {event.registrationStatus === 'registered' && (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            {getRegistrationButtonText()}
          </Button>
          <Button variant="outline" size="default">
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
