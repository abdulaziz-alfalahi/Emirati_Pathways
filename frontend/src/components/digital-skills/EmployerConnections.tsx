
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, MapPin, Briefcase, Users } from 'lucide-react';

const employers = [
  {
    name: 'Emirates NBD',
    industry: 'Banking & Finance',
    location: 'Dubai',
    openPositions: 15,
    skillsInDemand: ['Data Science', 'AI/ML', 'Cloud Computing'],
    logo: '/lovable-uploads/emirates-nbd.jpg'
  },
  {
    name: 'Dubai Electricity & Water Authority',
    industry: 'Utilities',
    location: 'Dubai',
    openPositions: 8,
    skillsInDemand: ['IoT', 'Smart Grid Technology', 'Data Analytics'],
    logo: '/lovable-uploads/dewa.jpg'
  },
  {
    name: 'Careem',
    industry: 'Technology',
    location: 'Dubai',
    openPositions: 22,
    skillsInDemand: ['Mobile Development', 'Backend Engineering', 'DevOps'],
    logo: '/lovable-uploads/careem.jpg'
  },
  {
    name: 'Dubai Municipality',
    industry: 'Government',
    location: 'Dubai',
    openPositions: 12,
    skillsInDemand: ['Smart City Solutions', 'GIS', 'Digital Transformation'],
    logo: '/lovable-uploads/dubai-municipality.jpg'
  }
];

const upcomingEvents = [
  {
    title: 'Tech Talent Connect 2024',
    date: 'March 15, 2024',
    type: 'Virtual Career Fair',
    participants: 25
  },
  {
    title: 'Digital Skills Showcase',
    date: 'March 22, 2024',
    type: 'Portfolio Review',
    participants: 15
  },
  {
    title: 'Innovation Hub Networking',
    date: 'April 5, 2024',
    type: 'In-Person Event',
    participants: 30
  }
];

export const EmployerConnections: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Employer Partners */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Partner Companies</h3>
        <div className="grid gap-6 md:grid-cols-2">
          {employers.map((employer, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Building className="h-6 w-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{employer.name}</h4>
                  <p className="text-sm text-muted-foreground">{employer.industry}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {employer.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {employer.openPositions} open positions
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Skills in Demand:</p>
                <div className="flex flex-wrap gap-2">
                  {employer.skillsInDemand.map((skill, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Button className="w-full" size="sm">
                  View Open Positions
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  Connect with Recruiters
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Upcoming Networking Events */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Upcoming Networking Events</h3>
        <div className="space-y-4">
          {upcomingEvents.map((event, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{event.title}</h4>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>{event.date}</span>
                    <Badge variant="outline">{event.type}</Badge>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {event.participants} companies
                    </div>
                  </div>
                </div>
                <Button size="sm">
                  Register
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
