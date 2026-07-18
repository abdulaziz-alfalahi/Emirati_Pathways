
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Star, MapPin, Clock, MessageCircle } from 'lucide-react';

interface Mentor {
  id: string;
  name: string;
  title: string;
  company: string;
  expertise: string[];
  rating: number;
  experience: number;
  location: string;
  availability: string;
  image?: string;
  bio: string;
}

const mockMentors: Mentor[] = [
  {
    id: '1',
    name: 'Ahmed Al-Mansouri',
    title: 'Senior Software Engineer',
    company: 'Emirates NBD',
    expertise: ['Software Development', 'Leadership', 'Career Planning'],
    rating: 4.9,
    experience: 8,
    location: 'Dubai',
    availability: 'Weekends',
    bio: 'Passionate about mentoring young developers and helping them navigate their career paths in tech.'
  },
  {
    id: '2',
    name: 'Fatima Al-Zahra',
    title: 'Marketing Director',
    company: 'Dubai Tourism',
    expertise: ['Digital Marketing', 'Brand Management', 'Strategy'],
    rating: 4.8,
    experience: 10,
    location: 'Dubai',
    availability: 'Evenings',
    bio: 'Expert in digital marketing with a focus on helping professionals build their personal brand.'
  },
  {
    id: '3',
    name: 'Omar Al-Rashid',
    title: 'Financial Analyst',
    company: 'ADCB',
    expertise: ['Finance', 'Investment', 'Data Analysis'],
    rating: 4.7,
    experience: 6,
    location: 'Abu Dhabi',
    availability: 'Flexible',
    bio: 'Experienced financial professional dedicated to mentoring the next generation of finance experts.'
  }
];

export const FindMentorsTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  const filteredMentors = mockMentors.filter(mentor => {
    const matchesSearch = mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mentor.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mentor.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesExpertise = selectedExpertise === 'all' || 
                           mentor.expertise.some(skill => skill.toLowerCase().includes(selectedExpertise.toLowerCase()));
    
    const matchesLocation = selectedLocation === 'all' || 
                          mentor.location.toLowerCase() === selectedLocation.toLowerCase();

    return matchesSearch && matchesExpertise && matchesLocation;
  });

  const handleConnectRequest = (mentorId: string) => {
    console.log('Sending connection request to mentor:', mentorId);
    // TODO: Implement connection request functionality
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-[rgb(var(--pg-primary))]" />
            Find Your Perfect Mentor
          </CardTitle>
          <CardDescription>
            Search and filter mentors based on your interests and career goals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search mentors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ps-10 focus:border-[rgb(var(--pg-primary))] focus:ring-[rgb(var(--pg-primary))]"
              />
            </div>
            
            <Select value={selectedExpertise} onValueChange={setSelectedExpertise}>
              <SelectTrigger className="focus:border-[rgb(var(--pg-primary))] focus:ring-[rgb(var(--pg-primary))]">
                <SelectValue placeholder="Select expertise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Expertise</SelectItem>
                <SelectItem value="software">Software Development</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="leadership">Leadership</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="focus:border-[rgb(var(--pg-primary))] focus:ring-[rgb(var(--pg-primary))]">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="dubai">Dubai</SelectItem>
                <SelectItem value="abu dhabi">Abu Dhabi</SelectItem>
                <SelectItem value="sharjah">Sharjah</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mentors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMentors.map((mentor) => (
          <Card key={mentor.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={mentor.image} alt={mentor.name} />
                  <AvatarFallback className="bg-[rgb(var(--pg-primary))/10] text-[rgb(var(--pg-primary))]">
                    {mentor.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{mentor.name}</CardTitle>
                  <CardDescription className="text-sm">{mentor.title}</CardDescription>
                  <p className="text-sm text-muted-foreground">{mentor.company}</p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">{mentor.bio}</p>
              
              <div className="flex flex-wrap gap-1">
                {mentor.expertise.slice(0, 3).map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{mentor.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{mentor.experience}y exp</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{mentor.location}</span>
                <span>•</span>
                <span>{mentor.availability}</span>
              </div>
              
              <Button 
                onClick={() => handleConnectRequest(mentor.id)}
                className="w-full bg-[rgb(var(--pg-primary))] hover:bg-[rgb(var(--pg-primary))/90]"
              >
                <MessageCircle className="h-4 w-4 me-2" />
                Connect
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMentors.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No mentors found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or filters to find more mentors.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
