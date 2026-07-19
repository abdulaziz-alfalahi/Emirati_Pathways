
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, MessageCircle, Calendar, Search, Users, Heart } from 'lucide-react';

export const MentorshipConnection: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState('all');

  const mentors = [
    {
      id: '1',
      name: 'Dr. Fatima Al-Zahra',
      field: 'Technology',
      expertise: ['AI & Machine Learning', 'Software Development', 'Data Science'],
      bio: 'Senior AI researcher with 15+ years in tech innovation and youth mentorship.',
      rating: 4.9,
      sessions: 120,
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      availability: 'Available',
      languages: ['Arabic', 'English']
    },
    {
      id: '2',
      name: 'Ahmed Al-Mansouri',
      field: 'Business',
      expertise: ['Entrepreneurship', 'Strategic Planning', 'Leadership Development'],
      bio: 'Successful entrepreneur and business mentor, founded 3 startups in the UAE.',
      rating: 4.8,
      sessions: 95,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      availability: 'Busy',
      languages: ['Arabic', 'English', 'French']
    },
    {
      id: '3',
      name: 'Mariam Al-Khouri',
      field: 'Arts',
      expertise: ['Traditional Arts', 'Digital Design', 'Cultural Preservation'],
      bio: 'Award-winning artist specializing in Emirati cultural arts and modern design.',
      rating: 4.9,
      sessions: 78,
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      availability: 'Available',
      languages: ['Arabic', 'English']
    },
    {
      id: '4',
      name: 'Omar Al-Rashid',
      field: 'Sports',
      expertise: ['Athletic Training', 'Sports Psychology', 'Team Leadership'],
      bio: 'Former Olympic athlete turned youth sports development specialist.',
      rating: 4.7,
      sessions: 156,
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      availability: 'Available',
      languages: ['Arabic', 'English']
    }
  ];

  const fields = ['Technology', 'Business', 'Arts', 'Sports', 'Healthcare', 'Education'];

  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mentor.expertise.some(exp => exp.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesField = selectedField === 'all' || mentor.field === selectedField;
    return matchesSearch && matchesField;
  });

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Busy': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-ehrdc-teal/10 to-ehrdc-light-teal/5">
        <CardContent className="p-6 text-center">
          <Users className="h-12 w-12 text-ehrdc-teal mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-ehrdc-teal mb-2">Connect with Mentors</h2>
          <p className="text-muted-foreground">Find experienced professionals to guide your journey</p>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search mentors or expertise..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ps-10"
              />
            </div>
            <Select value={selectedField} onValueChange={setSelectedField}>
              <SelectTrigger className="md:w-64">
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fields</SelectItem>
                {fields.map((field) => (
                  <SelectItem key={field} value={field}>
                    {field}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mentors Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredMentors.map((mentor) => (
          <Card key={mentor.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={mentor.image} />
                  <AvatarFallback>{mentor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{mentor.name}</h3>
                      <Badge variant="outline" className="mt-1">{mentor.field}</Badge>
                    </div>
                    <Badge className={getAvailabilityColor(mentor.availability)}>
                      {mentor.availability}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">{mentor.rating}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">{mentor.sessions} sessions</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">{mentor.bio}</p>

              <div className="space-y-3 mb-4">
                <div>
                  <div className="text-sm font-medium mb-2">Expertise</div>
                  <div className="flex flex-wrap gap-2">
                    {mentor.expertise.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium mb-2">Languages</div>
                  <div className="flex gap-2">
                    {mentor.languages.map((lang, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 ehrdc-button-primary">
                  <Heart className="h-4 w-4 me-2" />
                  Connect
                </Button>
                <Button variant="outline" size="icon">
                  <MessageCircle className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Calendar className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMentors.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No mentors found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria</p>
          </CardContent>
        </Card>
      )}

      {/* Mentorship Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-ehrdc-teal" />
            How Mentorship Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-ehrdc-teal/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-ehrdc-teal font-bold">1</span>
              </div>
              <h4 className="font-medium mb-2">Choose Your Mentor</h4>
              <p className="text-sm text-muted-foreground">Browse profiles and find the perfect match for your goals</p>
            </div>
            <div className="text-center">
              <div className="bg-ehrdc-teal/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-ehrdc-teal font-bold">2</span>
              </div>
              <h4 className="font-medium mb-2">Schedule Sessions</h4>
              <p className="text-sm text-muted-foreground">Book regular meetings and set your development goals</p>
            </div>
            <div className="text-center">
              <div className="bg-ehrdc-teal/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-ehrdc-teal font-bold">3</span>
              </div>
              <h4 className="font-medium mb-2">Grow Together</h4>
              <p className="text-sm text-muted-foreground">Learn, develop skills, and achieve your aspirations</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
