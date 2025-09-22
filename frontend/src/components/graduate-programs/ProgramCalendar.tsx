
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, Bell, ExternalLink } from 'lucide-react';

export const ProgramCalendar: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState('february');

  const events = [
    {
      id: 1,
      title: 'Emirates Graduate Program Info Session',
      type: 'Information Session',
      date: '2024-02-15',
      time: '18:00 - 19:30',
      location: 'Emirates Headquarters, Dubai',
      virtual: false,
      capacity: 50,
      registered: 23,
      description: 'Learn about the 24-month leadership development program'
    },
    {
      id: 2,
      title: 'ADNOC Virtual Recruitment Event',
      type: 'Recruitment',
      date: '2024-02-20',
      time: '14:00 - 16:00',
      location: 'Virtual Event',
      virtual: true,
      capacity: 200,
      registered: 145,
      description: 'Meet recruiters and learn about technical graduate opportunities'
    },
    {
      id: 3,
      title: 'Banking Sector Graduate Fair',
      type: 'Job Fair',
      date: '2024-02-25',
      time: '10:00 - 17:00',
      location: 'Dubai World Trade Centre',
      virtual: false,
      capacity: 500,
      registered: 387,
      description: 'Major banks presenting their graduate programs'
    },
    {
      id: 4,
      title: 'Interview Skills Workshop',
      type: 'Workshop',
      date: '2024-02-28',
      time: '16:00 - 18:00',
      location: 'EHRDC Training Center',
      virtual: false,
      capacity: 30,
      registered: 28,
      description: 'Master interview techniques for graduate program applications'
    }
  ];

  const deadlines = [
    {
      program: 'ADNOC Graduate Development Program',
      company: 'ADNOC',
      deadline: '2024-02-28',
      daysRemaining: 8
    },
    {
      program: 'Emirates Future Leaders Program',
      company: 'Emirates Group',
      deadline: '2024-03-15',
      daysRemaining: 23
    },
    {
      program: 'Dubai Health Authority Graduate Scheme',
      company: 'DHA',
      deadline: '2024-03-31',
      daysRemaining: 39
    }
  ];

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'Information Session': return 'bg-blue-100 text-blue-800';
      case 'Recruitment': return 'bg-green-100 text-green-800';
      case 'Job Fair': return 'bg-purple-100 text-purple-800';
      case 'Workshop': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 text-ehrdc-teal mx-auto mb-2" />
            <div className="text-lg font-semibold">4</div>
            <div className="text-sm text-gray-600">Upcoming Events</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <div className="text-lg font-semibold">3</div>
            <div className="text-sm text-gray-600">Application Deadlines</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Bell className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-lg font-semibold">2</div>
            <div className="text-sm text-gray-600">Reminders Set</div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Application Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Upcoming Application Deadlines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deadlines.map((deadline, index) => (
              <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">{deadline.program}</h3>
                  <p className="text-sm text-ehrdc-teal">{deadline.company}</p>
                  <p className="text-sm text-gray-600">Deadline: {deadline.deadline}</p>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${
                    deadline.daysRemaining <= 7 ? 'text-red-600' : 
                    deadline.daysRemaining <= 14 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {deadline.daysRemaining} days
                  </div>
                  <p className="text-sm text-gray-600">remaining</p>
                  <Button size="sm" className="mt-2 bg-ehrdc-teal hover:bg-ehrdc-teal/90">
                    <Bell className="h-4 w-4 mr-1" />
                    Set Reminder
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Upcoming Events & Information Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{event.title}</h3>
                    <Badge className={getEventTypeColor(event.type)}>
                      {event.type}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{event.date}</div>
                    <div className="text-sm text-gray-600">{event.time}</div>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-3">{event.description}</p>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{event.location}</span>
                      {event.virtual && (
                        <Badge variant="outline" className="ml-2">Virtual</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{event.time}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>{event.registered}/{event.capacity} registered</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-ehrdc-teal h-2 rounded-full" 
                        style={{ width: `${(event.registered / event.capacity) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button className="bg-ehrdc-teal hover:bg-ehrdc-teal/90">
                    Register Now
                  </Button>
                  <Button variant="outline">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    More Details
                  </Button>
                  <Button variant="outline">
                    <Bell className="h-4 w-4 mr-1" />
                    Set Reminder
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly View Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Event Calendar View</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-16 w-16 text-ehrdc-teal mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Full Calendar View</h3>
            <p className="text-gray-600 mb-4">View all events, deadlines, and important dates in a monthly calendar format</p>
            <Button className="bg-ehrdc-teal hover:bg-ehrdc-teal/90">
              Open Calendar View
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
