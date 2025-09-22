import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, Heart, MapPin, BookOpen, Plane, Camera, Coffee, Star, ExternalLink } from 'lucide-react';

export const RetireeCommunityTab: React.FC = () => {
  const communityGroups = [
    {
      id: 'heritage-keepers',
      name: 'UAE Heritage Keepers',
      description: 'Preserving and sharing Emirati culture and traditions',
      members: 245,
      category: 'Cultural',
      icon: <Heart className="h-5 w-5" />,
      meetingDay: 'Every Wednesday',
      featured: true
    },
    {
      id: 'senior-entrepreneurs',
      name: 'Senior Entrepreneurs Circle',
      description: 'Supporting post-retirement business ventures and consulting',
      members: 180,
      category: 'Business',
      icon: <Users className="h-5 w-5" />,
      meetingDay: 'Bi-weekly Fridays'
    },
    {
      id: 'wellness-warriors',
      name: 'Wellness Warriors 60+',
      description: 'Health, fitness, and wellness activities for active seniors',
      members: 320,
      category: 'Health',
      icon: <Heart className="h-5 w-5" />,
      meetingDay: 'Daily activities'
    },
    {
      id: 'travel-companions',
      name: 'Golden Years Travel Club',
      description: 'Organized travel and exploration experiences',
      members: 156,
      category: 'Travel',
      icon: <Plane className="h-5 w-5" />,
      meetingDay: 'Monthly planning'
    }
  ];

  const upcomingEvents = [
    {
      title: 'Traditional Crafts Workshop',
      date: 'Tomorrow, 2:00 PM',
      location: 'Dubai Heritage Village',
      type: 'Workshop',
      attendees: 25
    },
    {
      title: 'Investment Planning Seminar',
      date: 'Thursday, 10:00 AM',
      location: 'ADCB Center',
      type: 'Seminar',
      attendees: 45
    },
    {
      title: 'Community Garden Project',
      date: 'Saturday, 8:00 AM',
      location: 'Al Barsha Park',
      type: 'Volunteer',
      attendees: 18
    },
    {
      title: 'Photography Walk - Old Dubai',
      date: 'Sunday, 6:00 AM',
      location: 'Al Fahidi District',
      type: 'Activity',
      attendees: 22
    }
  ];

  const lifestylePrograms = [
    {
      title: 'Lifelong Learning Academy',
      description: 'Courses in history, technology, languages, and arts',
      icon: <BookOpen className="h-5 w-5" />,
      participants: '500+'
    },
    {
      title: 'Mentorship Exchange',
      description: 'Share your expertise with younger generations',
      icon: <Users className="h-5 w-5" />,
      participants: '200+'
    },
    {
      title: 'Cultural Ambassador Program',
      description: 'Represent UAE culture in international exchanges',
      icon: <Heart className="h-5 w-5" />,
      participants: '75+'
    },
    {
      title: 'Digital Literacy Support',
      description: 'Help others navigate modern technology',
      icon: <Users className="h-5 w-5" />,
      participants: '150+'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Community & Lifestyle</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Stay connected, active, and engaged with a vibrant community of fellow retirees sharing experiences, knowledge, and new adventures.
        </p>
      </div>

      {/* Community Groups */}
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Community Groups
        </h3>
        <div className="grid gap-6 md:grid-cols-2">
          {communityGroups.map((group) => (
            <Card key={group.id} className={`hover:shadow-md transition-shadow ${group.featured ? 'border-yellow-200 bg-yellow-50/50' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {group.icon}
                    <Badge variant="outline">{group.category}</Badge>
                    {group.featured && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg">{group.name}</CardTitle>
                <CardDescription>{group.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{group.members} members</span>
                    <span>{group.meetingDay}</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Join Group
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Events
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {upcomingEvents.map((event, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{event.title}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {event.type}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {event.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {event.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {event.attendees} attendees
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Register
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Lifestyle Programs */}
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Lifestyle Programs
        </h3>
        <div className="grid gap-6 md:grid-cols-2">
          {lifestylePrograms.map((program, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {program.icon}
                  {program.title}
                </CardTitle>
                <CardDescription>{program.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    {program.participants} active participants
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Learn More
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Community Impact */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-green-600" />
            Community Impact
          </CardTitle>
          <CardDescription>
            Your continued contribution to UAE society
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">2,500+</div>
                <div className="text-sm text-muted-foreground">Youth Mentored</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">150+</div>
                <div className="text-sm text-muted-foreground">Community Projects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">10,000+</div>
                <div className="text-sm text-muted-foreground">Volunteer Hours</div>
              </div>
            </div>
            <Button className="w-full">
              <Heart className="h-4 w-4 mr-2" />
              Join a Community Initiative
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
