
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, MessageSquare, Calendar, Award } from 'lucide-react';

export const CommunityHub: React.FC = () => {
  const discussions = [
    {
      title: 'Career Transition Tips for Tech Professionals',
      author: 'Sarah Al-Mansouri',
      replies: 24,
      lastActivity: '2 hours ago',
      category: 'Career Advice'
    },
    {
      title: 'Building Leadership Skills in Remote Teams',
      author: 'Ahmed Hassan',
      replies: 18,
      lastActivity: '5 hours ago',
      category: 'Leadership'
    },
    {
      title: 'AI/ML Learning Path Recommendations',
      author: 'Fatima Al-Zahra',
      replies: 32,
      lastActivity: '1 day ago',
      category: 'Technical Skills'
    }
  ];

  const events = [
    {
      title: 'Monthly Mentorship Meetup',
      date: '2024-02-15',
      time: '6:00 PM',
      attendees: 45,
      type: 'Virtual'
    },
    {
      title: 'Career Development Workshop',
      date: '2024-02-20',
      time: '2:00 PM',
      attendees: 28,
      type: 'In-Person'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-ehrdc-teal" />
            Community Hub
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-4">Active Discussions</h3>
            <div className="space-y-3">
              {discussions.map((discussion, index) => (
                <Card key={index} className="border border-ehrdc-neutral-light">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{discussion.title}</h4>
                      <Badge variant="outline">{discussion.category}</Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {discussion.author.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span>{discussion.author}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {discussion.replies}
                        </span>
                        <span>{discussion.lastActivity}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Discussions
            </Button>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Upcoming Events</h3>
            <div className="space-y-3">
              {events.map((event, index) => (
                <Card key={index} className="border border-ehrdc-neutral-light">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{event.title}</h4>
                      <Badge variant={event.type === 'Virtual' ? 'secondary' : 'default'}>
                        {event.type}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {event.date} at {event.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {event.attendees} attending
                        </span>
                      </div>
                      <Button size="sm" variant="outline">
                        Join Event
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
