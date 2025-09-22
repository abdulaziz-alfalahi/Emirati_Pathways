
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Video, User, Star, MessageCircle } from 'lucide-react';

export const MockInterviewScheduling: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const advisors = [
    {
      id: 1,
      name: 'Dr. Sarah Al-Mansoori',
      title: 'Senior HR Director',
      company: 'Emirates Group',
      rating: 4.9,
      sessions: 150,
      specialties: ['Behavioral Interviews', 'Leadership Assessment'],
      avatar: '/api/placeholder/64/64',
      nextAvailable: '2024-02-15'
    },
    {
      id: 2,
      name: 'Ahmed Hassan',
      title: 'Technical Lead',
      company: 'ADNOC Digital',
      rating: 4.8,
      sessions: 89,
      specialties: ['Technical Interviews', 'System Design'],
      avatar: '/api/placeholder/64/64',
      nextAvailable: '2024-02-16'
    },
    {
      id: 3,
      name: 'Fatima Al-Zahra',
      title: 'Banking Operations Manager',
      company: 'First Abu Dhabi Bank',
      rating: 4.9,
      sessions: 120,
      specialties: ['Finance Interviews', 'Case Studies'],
      avatar: '/api/placeholder/64/64',
      nextAvailable: '2024-02-17'
    }
  ];

  const peerMatches = [
    {
      id: 1,
      name: 'Khalid Al-Rashid',
      field: 'Engineering',
      level: 'Mid-level',
      rating: 4.7,
      mutualPractice: 12,
      nextAvailable: 'Today'
    },
    {
      id: 2,
      name: 'Noura Bin Saeed',
      field: 'Marketing',
      level: 'Senior',
      rating: 4.8,
      mutualPractice: 8,
      nextAvailable: 'Tomorrow'
    }
  ];

  const upcomingSessions = [
    {
      date: '2024-02-15',
      time: '14:00',
      type: 'Mock Interview',
      advisor: 'Dr. Sarah Al-Mansoori',
      format: 'Video Call'
    },
    {
      date: '2024-02-17',
      time: '10:30',
      type: 'Peer Practice',
      advisor: 'Khalid Al-Rashid',
      format: 'Video Call'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Upcoming Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Your Upcoming Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingSessions.length > 0 ? (
            <div className="space-y-4">
              {upcomingSessions.map((session, index) => (
                <div key={index} className="flex justify-between items-center p-4 border rounded-lg bg-blue-50">
                  <div>
                    <h3 className="font-semibold">{session.type}</h3>
                    <p className="text-sm text-gray-600">with {session.advisor}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {session.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {session.time}
                      </div>
                      <div className="flex items-center gap-1">
                        <Video className="h-4 w-4" />
                        {session.format}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Reschedule</Button>
                    <Button size="sm" className="bg-ehrdc-teal hover:bg-ehrdc-teal/90">Join</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No upcoming sessions scheduled</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Career Advisors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Book with Career Advisors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {advisors.map((advisor) => (
              <div key={advisor.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{advisor.name}</h3>
                      <p className="text-ehrdc-teal font-medium">{advisor.title}</p>
                      <p className="text-sm text-gray-600">{advisor.company}</p>
                      
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{advisor.rating}</span>
                        </div>
                        <span className="text-sm text-gray-600">{advisor.sessions} sessions</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {advisor.specialties.map((specialty, index) => (
                          <Badge key={index} variant="outline" className="text-xs">{specialty}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-2">Next available: {advisor.nextAvailable}</p>
                    <Button className="bg-ehrdc-teal hover:bg-ehrdc-teal/90">
                      Book Session
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Peer Practice */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Peer Practice Matching</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {peerMatches.map((peer) => (
              <div key={peer.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{peer.name}</h3>
                    <p className="text-sm text-gray-600">{peer.field} • {peer.level}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{peer.rating}</span>
                      </div>
                      <span className="text-sm text-gray-600">{peer.mutualPractice} mutual practices</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-2">Available: {peer.nextAvailable}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Message
                      </Button>
                      <Button size="sm" className="bg-ehrdc-teal hover:bg-ehrdc-teal/90">
                        Practice Together
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Industry Expert Network */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Industry Expert Volunteer Network</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="bg-blue-50 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <User className="h-10 w-10 text-ehrdc-teal" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Connect with Industry Leaders</h3>
            <p className="text-gray-600 mb-4">Get insights from senior professionals volunteering their time to help Emirati job seekers</p>
            <Button className="bg-ehrdc-teal hover:bg-ehrdc-teal/90">
              Request Expert Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
