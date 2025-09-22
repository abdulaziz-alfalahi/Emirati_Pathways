
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, MapPin, Globe, Video, Mail, Phone } from 'lucide-react';
import { VirtualEvent, EventRegistration } from '@/types/virtualEvents';

interface EventOverviewProps {
  event: VirtualEvent;
  registration: EventRegistration | null;
}

const EventOverview: React.FC<EventOverviewProps> = ({ event, registration }) => {
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-AE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>About This Event</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {event.description || 'No description available for this event.'}
            </p>
          </CardContent>
        </Card>

        {/* Agenda */}
        {event.agenda && event.agenda.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Event Agenda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {event.agenda.map((item: any, index: number) => (
                  <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground min-w-20">
                      {item.time}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{item.title}</h4>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      )}
                      {item.speaker && (
                        <p className="text-sm text-primary mt-1">Speaker: {item.speaker}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Speakers */}
        {event.speakers && event.speakers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Featured Speakers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {event.speakers.map((speaker: any, index: number) => (
                  <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                    {speaker.avatar && (
                      <img 
                        src={speaker.avatar} 
                        alt={speaker.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium">{speaker.name}</h4>
                      <p className="text-sm text-muted-foreground">{speaker.title}</p>
                      {speaker.company && (
                        <p className="text-sm text-primary">{speaker.company}</p>
                      )}
                      {speaker.bio && (
                        <p className="text-sm text-muted-foreground mt-2">{speaker.bio}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sponsors */}
        {event.sponsors && event.sponsors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Event Sponsors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {event.sponsors.map((sponsor: any, index: number) => (
                  <div key={index} className="text-center p-4 border rounded-lg">
                    {sponsor.logo && (
                      <img 
                        src={sponsor.logo} 
                        alt={sponsor.name}
                        className="h-16 mx-auto mb-2 object-contain"
                      />
                    )}
                    <p className="text-sm font-medium">{sponsor.name}</p>
                    {sponsor.tier && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        {sponsor.tier}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Event Details */}
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Start Date</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(event.start_date)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">End Date</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(event.end_date)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Timezone</p>
                <p className="text-sm text-muted-foreground">{event.timezone}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Video className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Platform</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {event.meeting_platform}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Access</p>
                <p className="text-sm text-muted-foreground">
                  {event.is_public ? 'Public Event' : 'Private Event'}
                </p>
              </div>
            </div>

            {event.max_attendees && (
              <div className="flex items-center space-x-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Capacity</p>
                  <p className="text-sm text-muted-foreground">
                    {event.max_attendees} attendees
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registration Status */}
        {registration && (
          <Card>
            <CardHeader>
              <CardTitle>Your Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge className="capitalize">
                  {registration.status}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Registered</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(registration.registration_date).toLocaleDateString()}
                </span>
              </div>

              {registration.check_in_time && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Checked In</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(registration.check_in_time).toLocaleString()}
                  </span>
                </div>
              )}

              {registration.session_duration > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Time Spent</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.floor(registration.session_duration / 60)}h {registration.session_duration % 60}m
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EventOverview;
