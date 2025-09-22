
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { CalendarDays, MapPin, Clock, Users, Filter } from 'lucide-react';

export const EventsCalendar: React.FC = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedView, setSelectedView] = useState<'calendar' | 'list'>('calendar');

  const events = [
    {
      id: '1',
      title: 'Innovation Challenge Kickoff',
      date: '2024-02-15',
      time: '10:00 AM',
      location: 'Dubai Future Foundation',
      category: 'Innovation',
      attendees: 45,
      type: 'Competition',
      description: 'Launch event for the annual youth innovation challenge'
    },
    {
      id: '2',
      title: 'Leadership Workshop Series',
      date: '2024-02-18',
      time: '2:00 PM',
      location: 'Abu Dhabi Youth Hub',
      category: 'Leadership',
      attendees: 30,
      type: 'Workshop',
      description: 'Interactive workshop on modern leadership principles'
    },
    {
      id: '3',
      title: 'Cultural Heritage Festival',
      date: '2024-02-22',
      time: '6:00 PM',
      location: 'Sharjah Heritage Area',
      category: 'Cultural',
      attendees: 120,
      type: 'Festival',
      description: 'Celebrate Emirati traditions through arts and performances'
    },
    {
      id: '4',
      title: 'Community Service Day',
      date: '2024-02-25',
      time: '8:00 AM',
      location: 'Various Locations',
      category: 'Community',
      attendees: 80,
      type: 'Service',
      description: 'City-wide volunteer activities for environmental conservation'
    }
  ];

  const upcomingEvents = events.filter(event => new Date(event.date) >= new Date()).slice(0, 3);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Innovation: 'bg-blue-100 text-blue-800',
      Leadership: 'bg-purple-100 text-purple-800',
      Cultural: 'bg-green-100 text-green-800',
      Community: 'bg-orange-100 text-orange-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-ehrdc-teal">Youth Events Calendar</h2>
            <div className="flex gap-2">
              <Button
                variant={selectedView === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedView('calendar')}
                className={selectedView === 'calendar' ? 'ehrdc-button-primary' : ''}
              >
                Calendar View
              </Button>
              <Button
                variant={selectedView === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedView('list')}
                className={selectedView === 'list' ? 'ehrdc-button-primary' : ''}
              >
                List View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar/List View */}
        <div className="lg:col-span-2">
          {selectedView === 'calendar' ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-ehrdc-teal" />
                  Event Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-ehrdc-teal" />
                    All Events
                  </span>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="p-4 rounded-lg border hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{event.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-4 w-4" />
                            {new Date(event.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {event.time}
                          </span>
                        </div>
                      </div>
                      <Badge className={getCategoryColor(event.category)}>{event.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-ehrdc-teal" />
                          {event.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-ehrdc-teal" />
                          {event.attendees} attending
                        </span>
                      </div>
                      <Button size="sm" className="ehrdc-button-primary">
                        Join Event
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Upcoming Events Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{event.title}</h4>
                    <Badge variant="outline" className="text-xs">{event.type}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {new Date(event.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {event.time}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </div>
                  </div>
                  <Button size="sm" className="w-full mt-3 text-xs ehrdc-button-primary">
                    Register
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full ehrdc-button-primary">
                Create Event
              </Button>
              <Button variant="outline" className="w-full">
                View My Events
              </Button>
              <Button variant="outline" className="w-full">
                Export Calendar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
