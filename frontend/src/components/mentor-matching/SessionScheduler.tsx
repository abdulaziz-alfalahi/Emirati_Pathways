
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

export const SessionScheduler: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const timeSlots = [
    { time: '9:00 AM', available: true },
    { time: '10:30 AM', available: false },
    { time: '2:00 PM', available: true },
    { time: '3:30 PM', available: true },
    { time: '5:00 PM', available: false }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-ehrdc-teal" />
            Session Scheduler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-4">Select Date</h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </div>

            <div>
              <h3 className="font-semibold mb-4">Available Time Slots</h3>
              <div className="space-y-2">
                {timeSlots.map((slot, index) => (
                  <Button
                    key={index}
                    variant={slot.available ? "outline" : "secondary"}
                    className="w-full justify-start"
                    disabled={!slot.available}
                  >
                    <Clock className="h-4 w-4 me-2" />
                    {slot.time}
                    {!slot.available && (
                      <span className="ms-auto text-xs">Booked</span>
                    )}
                  </Button>
                ))}
              </div>

              <Button className="w-full mt-4 bg-ehrdc-teal hover:bg-ehrdc-dark-teal">
                Schedule Session
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
