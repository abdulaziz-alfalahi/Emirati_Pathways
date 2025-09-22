
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Video, Clock, Users, Search, Calendar as CalendarIcon, CheckCircle } from 'lucide-react';

export const UniversityRepresentatives: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const representatives = [
    {
      id: '1',
      name: 'Sarah Johnson',
      title: 'Director of International Admissions',
      university: 'MIT',
      region: 'North America',
      specialization: 'STEM Programs',
      languages: ['English', 'Arabic'],
      availability: [
        { date: '2024-02-15', time: '10:00 AM', duration: 30 },
        { date: '2024-02-16', time: '2:00 PM', duration: 30 },
        { date: '2024-02-18', time: '11:00 AM', duration: 30 }
      ],
      bio: 'Sarah has 10+ years of experience in international admissions and specializes in helping Middle Eastern students.',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      rating: 4.9,
      sessions_completed: 120,
      response_time: '< 24 hours'
    },
    {
      id: '2',
      name: 'Dr. James Mitchell',
      title: 'Associate Dean, Graduate Admissions',
      university: 'Harvard Business School',
      region: 'North America',
      specialization: 'Business Programs',
      languages: ['English'],
      availability: [
        { date: '2024-02-14', time: '3:00 PM', duration: 45 },
        { date: '2024-02-17', time: '9:00 AM', duration: 45 },
        { date: '2024-02-19', time: '1:00 PM', duration: 45 }
      ],
      bio: 'Former McKinsey consultant turned educator, James helps students navigate business school applications.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      rating: 4.8,
      sessions_completed: 85,
      response_time: '< 12 hours'
    },
    {
      id: '3',
      name: 'Prof. Emma Thompson',
      title: 'International Liaison Officer',
      university: 'University of Cambridge',
      region: 'Europe',
      specialization: 'Research Programs',
      languages: ['English', 'French'],
      availability: [
        { date: '2024-02-15', time: '8:00 AM', duration: 30 },
        { date: '2024-02-16', time: '4:00 PM', duration: 30 },
        { date: '2024-02-20', time: '10:00 AM', duration: 30 }
      ],
      bio: 'Research-focused educator with expertise in guiding students through PhD and research opportunities.',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      rating: 4.9,
      sessions_completed: 95,
      response_time: '< 24 hours'
    },
    {
      id: '4',
      name: 'Dr. Ahmed Al-Hassan',
      title: 'Regional Representative - Middle East',
      university: 'Stanford University',
      region: 'North America',
      specialization: 'Engineering & Technology',
      languages: ['English', 'Arabic'],
      availability: [
        { date: '2024-02-14', time: '6:00 PM', duration: 30 },
        { date: '2024-02-17', time: '7:00 PM', duration: 30 },
        { date: '2024-02-19', time: '5:00 PM', duration: 30 }
      ],
      bio: 'UAE national and Stanford alumnus, Ahmed specializes in helping regional students with engineering applications.',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      rating: 4.9,
      sessions_completed: 150,
      response_time: '< 6 hours'
    }
  ];

  const upcomingSessions = [
    {
      id: '1',
      student_name: 'You',
      representative: 'Sarah Johnson',
      university: 'MIT',
      date: '2024-02-15',
      time: '10:00 AM',
      duration: 30,
      status: 'confirmed',
      meeting_link: 'https://zoom.us/j/123456789'
    }
  ];

  const universities = ['MIT', 'Harvard Business School', 'University of Cambridge', 'Stanford University'];
  const regions = ['North America', 'Europe', 'Asia-Pacific', 'Middle East'];

  const filteredRepresentatives = representatives.filter(rep => {
    const matchesSearch = rep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rep.university.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rep.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUniversity = selectedUniversity === 'all' || rep.university === selectedUniversity;
    const matchesRegion = selectedRegion === 'all' || rep.region === selectedRegion;
    return matchesSearch && matchesUniversity && matchesRegion;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
        <CardContent className="p-6 text-center">
          <Video className="h-12 w-12 text-purple-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-purple-600 mb-2">University Representatives</h2>
          <p className="text-muted-foreground">Schedule virtual meetings with admissions officers from top universities</p>
        </CardContent>
      </Card>

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Your Upcoming Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 bg-white rounded-lg">
                <div>
                  <h4 className="font-medium">{session.representative} - {session.university}</h4>
                  <p className="text-sm text-muted-foreground">
                    {session.date} at {session.time} ({session.duration} minutes)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(session.status)}>
                    {session.status}
                  </Badge>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <Video className="h-4 w-4 mr-2" />
                    Join Meeting
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search representatives by name, university, or specialization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
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
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="md:w-48">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {regions.map((region) => (
                  <SelectItem key={region} value={region}>{region}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Representatives Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredRepresentatives.map((rep) => (
          <Card key={rep.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={rep.image} />
                  <AvatarFallback>{rep.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{rep.name}</h3>
                  <p className="text-muted-foreground text-sm">{rep.title}</p>
                  <p className="text-blue-600 font-medium">{rep.university}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{rep.specialization}</Badge>
                    <Badge variant="outline">{rep.region}</Badge>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">{rep.bio}</p>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Languages:</span>
                  <p className="font-medium">{rep.languages.join(', ')}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Response time:</span>
                  <p className="font-medium">{rep.response_time}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Sessions completed:</span>
                  <p className="font-medium">{rep.sessions_completed}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Rating:</span>
                  <p className="font-medium flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    {rep.rating}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium mb-2 text-sm">Available Time Slots</h4>
                <div className="grid grid-cols-1 gap-2">
                  {rep.availability.slice(0, 3).map((slot, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                      <span className="flex items-center gap-2">
                        <CalendarIcon className="h-3 w-3 text-blue-600" />
                        {slot.date} at {slot.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {slot.duration}min
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button className="flex-1 bg-purple-600 hover:bg-purple-700">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Schedule Meeting
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Button variant="outline">
                  View Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Meeting Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Meeting Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Before Your Meeting</h4>
              <ul className="space-y-2 text-sm">
                <li>• Research the university and specific programs</li>
                <li>• Prepare specific questions about admissions</li>
                <li>• Have your academic transcripts ready</li>
                <li>• Test your video call setup</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">During Your Meeting</h4>
              <ul className="space-y-2 text-sm">
                <li>• Be punctual and professional</li>
                <li>• Take notes during the conversation</li>
                <li>• Ask about application deadlines and requirements</li>
                <li>• Inquire about scholarship opportunities</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
