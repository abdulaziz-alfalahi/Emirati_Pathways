
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Users, Search, MessageCircle, Star, Award, MapPin } from 'lucide-react';

export const AlumniNetwork: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('all');
  const [selectedField, setSelectedField] = useState('all');

  const alumni = [
    {
      id: '1',
      name: 'Dr. Fatima Al-Zahra',
      university: 'MIT',
      degree: 'PhD Computer Science',
      graduation_year: '2018',
      current_role: 'AI Research Director',
      company: 'UAE National AI Initiative',
      location: 'Abu Dhabi, UAE',
      field: 'Technology',
      achievements: ['Published 25+ research papers', 'Led 3 major AI projects', 'TEDx Speaker'],
      bio: 'Leading AI researcher focusing on Arabic language processing and machine learning applications for the UAE.',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      rating: 4.9,
      mentorship_sessions: 45,
      available: true
    },
    {
      id: '2',
      name: 'Ahmed Al-Mansouri',
      university: 'Harvard Business School',
      degree: 'MBA',
      graduation_year: '2016',
      current_role: 'Vice President, Strategy',
      company: 'Emirates NBD',
      location: 'Dubai, UAE',
      field: 'Business',
      achievements: ['Led digital transformation', 'Launched fintech initiatives', 'Board member of 2 startups'],
      bio: 'Banking executive with expertise in digital transformation and fintech innovation.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      rating: 4.8,
      mentorship_sessions: 32,
      available: true
    },
    {
      id: '3',
      name: 'Dr. Mariam Al-Khouri',
      university: 'Cambridge University',
      degree: 'MD',
      graduation_year: '2015',
      current_role: 'Pediatric Surgeon',
      company: 'Cleveland Clinic Abu Dhabi',
      location: 'Abu Dhabi, UAE',
      field: 'Medicine',
      achievements: ['Performed 500+ surgeries', 'Research in pediatric care', 'Medical mission volunteer'],
      bio: 'Renowned pediatric surgeon with focus on minimally invasive procedures and patient care.',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      rating: 4.9,
      mentorship_sessions: 28,
      available: false
    },
    {
      id: '4',
      name: 'Omar Al-Rashid',
      university: 'Stanford University',
      degree: 'MS Engineering',
      graduation_year: '2017',
      current_role: 'Founder & CEO',
      company: 'GreenTech Innovations',
      location: 'Dubai, UAE',
      field: 'Engineering',
      achievements: ['Founded 2 successful startups', 'Patent holder', 'Sustainability advocate'],
      bio: 'Entrepreneur focused on sustainable technology solutions for the Middle East region.',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      rating: 4.7,
      mentorship_sessions: 38,
      available: true
    },
    {
      id: '5',
      name: 'Layla Al-Zaabi',
      university: 'Oxford University',
      degree: 'MA International Relations',
      graduation_year: '2019',
      current_role: 'Diplomatic Attaché',
      company: 'UAE Ministry of Foreign Affairs',
      location: 'Abu Dhabi, UAE',
      field: 'Political Science',
      achievements: ['Served in 3 countries', 'Fluent in 5 languages', 'Cultural bridge builder'],
      bio: 'Diplomat specializing in Middle East relations and international cooperation.',
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face',
      rating: 4.8,
      mentorship_sessions: 22,
      available: true
    }
  ];

  const universities = ['MIT', 'Harvard Business School', 'Cambridge University', 'Stanford University', 'Oxford University'];
  const fields = ['Technology', 'Business', 'Medicine', 'Engineering', 'Political Science'];

  const filteredAlumni = alumni.filter(alumnus => {
    const matchesSearch = alumnus.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alumnus.university.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alumnus.current_role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUniversity = selectedUniversity === 'all' || alumnus.university === selectedUniversity;
    const matchesField = selectedField === 'all' || alumnus.field === selectedField;
    return matchesSearch && matchesUniversity && matchesField;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6 text-center">
          <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-blue-600 mb-2">Alumni Network</h2>
          <p className="text-muted-foreground">Connect with successful Emirati graduates from top universities worldwide</p>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search alumni by name, university, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ps-10"
                />
              </div>
            </div>
            <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
              <SelectTrigger className="md:w-64">
                <SelectValue placeholder="University" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Universities</SelectItem>
                {universities.map((uni) => (
                  <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedField} onValueChange={setSelectedField}>
              <SelectTrigger className="md:w-64">
                <SelectValue placeholder="Field" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fields</SelectItem>
                {fields.map((field) => (
                  <SelectItem key={field} value={field}>{field}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alumni Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredAlumni.map((alumnus) => (
          <Card key={alumnus.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={alumnus.image} />
                  <AvatarFallback>{alumnus.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{alumnus.name}</h3>
                      <p className="text-muted-foreground text-sm">{alumnus.current_role}</p>
                      <p className="text-muted-foreground text-sm">{alumnus.company}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={alumnus.available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {alumnus.available ? 'Available' : 'Busy'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-blue-600" />
                      <span>{alumnus.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span>{alumnus.rating}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Education</h4>
                  <Badge variant="outline">{alumnus.field}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {alumnus.degree} • {alumnus.university} • Class of {alumnus.graduation_year}
                </p>
              </div>

              <p className="text-sm text-muted-foreground mb-4">{alumnus.bio}</p>

              <div className="mb-4">
                <h4 className="font-medium mb-2 text-sm">Key Achievements</h4>
                <ul className="space-y-1">
                  {alumnus.achievements.slice(0, 2).map((achievement, index) => (
                    <li key={index} className="text-xs text-muted-foreground flex items-center gap-1">
                      <Award className="h-3 w-3 text-yellow-600" />
                      {achievement}
                    </li>
                  ))}
                  {alumnus.achievements.length > 2 && (
                    <li className="text-xs text-blue-600">+ {alumnus.achievements.length - 2} more achievements</li>
                  )}
                </ul>
              </div>

              <div className="flex items-center justify-between mb-4 text-sm">
                <span className="text-muted-foreground">
                  {alumnus.mentorship_sessions} mentorship sessions completed
                </span>
              </div>

              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={!alumnus.available}
                >
                  <MessageCircle className="h-4 w-4 me-2" />
                  Connect
                </Button>
                <Button variant="outline" size="sm">
                  View Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAlumni.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No alumni found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria</p>
          </CardContent>
        </Card>
      )}

      {/* Alumni Impact Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Network Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">250+</div>
              <p className="text-sm text-muted-foreground">Alumni worldwide</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">50+</div>
              <p className="text-sm text-muted-foreground">Universities represented</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
              <p className="text-sm text-muted-foreground">Mentorship sessions</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">85%</div>
              <p className="text-sm text-muted-foreground">Success rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
