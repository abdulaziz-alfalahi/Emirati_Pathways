
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MessageCircle, Calendar } from 'lucide-react';

const mentors = [
  {
    name: 'Dr. Amina Hassan',
    title: 'Senior Data Scientist at Emirates NBD',
    expertise: ['Machine Learning', 'Python', 'Data Analytics'],
    rating: 4.9,
    sessions: 150,
    availability: 'Available',
    image: '/lovable-uploads/mentor1.jpg'
  },
  {
    name: 'Ahmed Al-Maktoum',
    title: 'Cloud Solutions Architect at Du',
    expertise: ['AWS', 'DevOps', 'Kubernetes'],
    rating: 4.8,
    sessions: 120,
    availability: 'Limited',
    image: '/lovable-uploads/mentor2.jpg'
  },
  {
    name: 'Sarah Johnson',
    title: 'Digital Marketing Director at Careem',
    expertise: ['Digital Marketing', 'SEO', 'Analytics'],
    rating: 4.9,
    sessions: 200,
    availability: 'Available',
    image: '/lovable-uploads/mentor3.jpg'
  }
];

export const MentorMatching: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mentors.map((mentor, index) => (
          <Card key={index} className="p-6">
            <div className="text-center mb-4">
              <Avatar className="h-20 w-20 mx-auto mb-3">
                <AvatarImage src={mentor.image} alt={mentor.name} />
                <AvatarFallback>{mentor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <h3 className="font-semibold text-lg">{mentor.name}</h3>
              <p className="text-sm text-muted-foreground">{mentor.title}</p>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{mentor.rating}</span>
                </div>
                <span>{mentor.sessions} sessions</span>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Expertise:</p>
                <div className="flex flex-wrap gap-1">
                  {mentor.expertise.map((skill, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Badge variant={mentor.availability === 'Available' ? 'default' : 'secondary'}>
                  {mentor.availability}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Button className="w-full" size="sm">
                <Calendar className="h-4 w-4 me-2" />
                Book Session
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                <MessageCircle className="h-4 w-4 me-2" />
                Send Message
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
