
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { MessageSquare, Calendar as CalendarIcon, Clock, Video, Phone, MapPin } from 'lucide-react';

export const InterviewScheduler: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const upcomingInterviews = [
    {
      id: 1,
      company: 'Emirates NBD',
      position: 'Senior Software Engineer',
      date: '2024-01-25',
      time: '10:00 AM',
      type: 'Video Call',
      interviewer: 'Sarah Al-Mansouri',
      duration: '45 minutes',
      stage: 'Technical Round'
    },
    {
      id: 2,
      company: 'Dubai Tourism',
      position: 'Digital Marketing Manager',
      date: '2024-01-28',
      time: '2:00 PM',
      type: 'In-Person',
      interviewer: 'Ahmed Hassan',
      duration: '60 minutes',
      stage: 'Final Round'
    }
  ];

  const availableSlots = [
    { time: '9:00 AM', available: true },
    { time: '10:30 AM', available: false },
    { time: '2:00 PM', available: true },
    { time: '3:30 PM', available: true },
    { time: '4:00 PM', available: false }
  ];

  const getInterviewIcon = (type: string) => {
    switch (type) {
      case 'Video Call':
        return <Video className="h-4 w-4" />;
      case 'Phone Call':
        return <Phone className="h-4 w-4" />;
      case 'In-Person':
        return <MapPin className="h-4 w-4" />;
      default:
        return <CalendarIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upcoming Interviews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-ehrdc-teal" />
            Upcoming Interviews ({upcomingInterviews.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingInterviews.map((interview) => (
              <Card key={interview.id} className="border border-ehrdc-neutral-light">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{interview.position}</h3>
                      <p className="text-ehrdc-teal font-medium">{interview.company}</p>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getInterviewIcon(interview.type)}
                      {interview.type}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarIcon className="h-4 w-4" />
                      {new Date(interview.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {interview.time} ({interview.duration})
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {interview.stage} with {interview.interviewer}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1 bg-ehrdc-teal hover:bg-ehrdc-dark-teal">
                      Join Interview
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Reschedule
                    </Button>
                    <Button variant="outline">
                      Prepare
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Schedule New Interview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Schedule Interview</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Time Slots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {availableSlots.map((slot, index) => (
                <Button
                  key={index}
                  variant={slot.available ? "outline" : "secondary"}
                  className="w-full justify-start"
                  disabled={!slot.available}
                >
                  <Clock className="h-4 w-4 me-2" />
                  {slot.time}
                  {!slot.available && (
                    <Badge variant="secondary" className="ms-auto">
                      Booked
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
