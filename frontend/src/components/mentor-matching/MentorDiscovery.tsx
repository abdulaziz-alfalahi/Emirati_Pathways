
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star, MapPin, Briefcase, Users } from 'lucide-react';

export const MentorDiscovery: React.FC = () => {
  const mentors = [
    {
      id: 1,
      name: 'Sarah Al-Mansouri',
      title: 'Senior Data Scientist',
      company: 'Emirates NBD',
      location: 'Dubai',
      rating: 4.9,
      sessions: 156,
      expertise: ['Machine Learning', 'Career Growth', 'Technical Leadership'],
      bio: 'Passionate about helping emerging data scientists navigate their career journey.'
    },
    {
      id: 2,
      name: 'Ahmed Hassan',
      title: 'Product Manager',
      company: 'Careem',
      location: 'Dubai',
      rating: 4.8,
      sessions: 98,
      expertise: ['Product Strategy', 'Startup Culture', 'Team Management'],
      bio: 'Experienced in scaling products and building successful teams.'
    },
    {
      id: 3,
      name: 'Dr. Mohammad Mubarak',
      title: 'Software Engineering Director',
      company: 'Microsoft',
      location: 'Abu Dhabi',
      rating: 5.0,
      sessions: 203,
      expertise: ['Software Architecture', 'Leadership', 'Diversity & Inclusion'],
      bio: 'Dedicated to mentoring the next generation of tech leaders.'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-ehrdc-teal" />
            Discover Mentors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {mentors.map((mentor) => (
              <Card key={mentor.id} className="border-2 border-ehrdc-neutral-light hover:border-ehrdc-teal transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-ehrdc-teal text-white">
                        {mentor.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{mentor.name}</h3>
                      <p className="text-ehrdc-teal font-medium">{mentor.title}</p>
                      <p className="text-sm text-muted-foreground">{mentor.company}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span>{mentor.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      <span>{mentor.sessions} sessions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{mentor.location}</span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">{mentor.bio}</p>

                  <div className="mb-4">
                    <div className="text-sm font-medium mb-2">Expertise</div>
                    <div className="flex flex-wrap gap-1">
                      {mentor.expertise.map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full bg-ehrdc-teal hover:bg-ehrdc-dark-teal">
                    Connect with Mentor
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
