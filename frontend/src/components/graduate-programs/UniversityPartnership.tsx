
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  GraduationCap, Calendar, MapPin, Users, BookOpen, 
  Target, Award, TrendingUp, School, Star 
} from 'lucide-react';

export const UniversityPartnership: React.FC = () => {
  const [filterUniversity, setFilterUniversity] = useState('all');

  const universities = [
    {
      id: 1,
      name: 'United Arab Emirates University',
      shortName: 'UAEU',
      location: 'Al Ain',
      logo: '/api/placeholder/60/60',
      partnerships: 15,
      recruitmentEvents: 8,
      rating: 4.7,
      specializations: ['Engineering', 'Business', 'Medicine', 'IT'],
      upcomingEvents: [
        { type: 'Career Fair', date: '2024-03-10', companies: 25 },
        { type: 'Workshop', date: '2024-03-15', topic: 'Interview Skills' }
      ]
    },
    {
      id: 2,
      name: 'American University of Sharjah',
      shortName: 'AUS',
      location: 'Sharjah',
      logo: '/api/placeholder/60/60',
      partnerships: 12,
      recruitmentEvents: 6,
      rating: 4.8,
      specializations: ['Engineering', 'Business', 'Architecture', 'Arts'],
      upcomingEvents: [
        { type: 'Recruitment Session', date: '2024-02-28', companies: 8 },
        { type: 'Networking Event', date: '2024-03-05', topic: 'Alumni Connect' }
      ]
    },
    {
      id: 3,
      name: 'Khalifa University',
      shortName: 'KU',
      location: 'Abu Dhabi',
      logo: '/api/placeholder/60/60',
      partnerships: 18,
      recruitmentEvents: 10,
      rating: 4.9,
      specializations: ['Engineering', 'Science', 'Technology', 'Medicine'],
      upcomingEvents: [
        { type: 'STEM Career Fair', date: '2024-03-20', companies: 30 },
        { type: 'Research Showcase', date: '2024-03-25', topic: 'Innovation' }
      ]
    }
  ];

  const campusRecruitmentEvents = [
    {
      id: 1,
      title: 'Major Companies Recruitment Drive',
      university: 'UAEU',
      date: '2024-03-10',
      time: '09:00 - 16:00',
      location: 'University Main Hall',
      companies: ['Emirates', 'ADNOC', 'ADCB', 'Etisalat', 'DP World'],
      expectedAttendees: 500,
      targetMajors: ['All Majors'],
      registrationRequired: true
    },
    {
      id: 2,
      title: 'Engineering & Technology Fair',
      university: 'Khalifa University',
      date: '2024-03-20',
      time: '10:00 - 15:00',
      location: 'Engineering Building',
      companies: ['ADNOC', 'Mubadala', 'Strata', 'EDGE', 'Masdar'],
      expectedAttendees: 300,
      targetMajors: ['Engineering', 'Computer Science', 'Applied Sciences'],
      registrationRequired: true
    },
    {
      id: 3,
      title: 'Business & Finance Networking',
      university: 'AUS',
      date: '2024-02-28',
      time: '14:00 - 18:00',
      location: 'Business School',
      companies: ['ADCB', 'FAB', 'EIB', 'Mashreq', 'NBAD'],
      expectedAttendees: 200,
      targetMajors: ['Business', 'Finance', 'Economics'],
      registrationRequired: true
    }
  ];

  const preparationWorkshops = [
    {
      id: 1,
      title: 'CV Writing for Fresh Graduates',
      university: 'UAEU',
      date: '2024-03-15',
      duration: '2 hours',
      capacity: 50,
      registered: 35,
      description: 'Learn to craft compelling CVs that highlight academic achievements and potential'
    },
    {
      id: 2,
      title: 'Interview Skills Masterclass',
      university: 'KU',
      date: '2024-03-12',
      duration: '3 hours',
      capacity: 30,
      registered: 28,
      description: 'Master interview techniques specifically for graduate program applications'
    },
    {
      id: 3,
      title: 'Professional Transition Workshop',
      university: 'AUS',
      date: '2024-03-18',
      duration: '2.5 hours',
      capacity: 40,
      registered: 22,
      description: 'Navigate the transition from academic life to professional career'
    }
  ];

  const transitionSupport = [
    {
      area: 'Academic to Professional Mindset',
      description: 'Understand workplace culture and professional expectations',
      resources: ['Webinar Series', 'Mentorship Program', 'Case Studies']
    },
    {
      area: 'Skill Translation',
      description: 'Convert academic achievements into professional competencies',
      resources: ['Skills Assessment', 'Portfolio Building', 'Achievement Mapping']
    },
    {
      area: 'Network Building',
      description: 'Connect with alumni and industry professionals',
      resources: ['Alumni Database', 'Industry Events', 'Professional Associations']
    },
    {
      area: 'Interview Preparation',
      description: 'University-specific preparation for graduate interviews',
      resources: ['Mock Interviews', 'Question Banks', 'Feedback Sessions']
    }
  ];

  const filteredUniversities = universities.filter(uni => 
    filterUniversity === 'all' || uni.shortName.toLowerCase() === filterUniversity.toLowerCase()
  );

  return (
    <div className="space-y-6">
      {/* University Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <span className="font-medium">Filter by University:</span>
            <Select value={filterUniversity} onValueChange={setFilterUniversity}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="All Universities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Universities</SelectItem>
                <SelectItem value="uaeu">UAE University</SelectItem>
                <SelectItem value="aus">American University of Sharjah</SelectItem>
                <SelectItem value="ku">Khalifa University</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* University Profiles */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-ehrdc-teal">Partner Universities</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUniversities.map((university) => (
            <Card key={university.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-ehrdc-teal/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <School className="h-8 w-8 text-ehrdc-teal" />
                  </div>
                  <h3 className="font-semibold">{university.name}</h3>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{university.location}</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">{university.rating}/5</span>
                  </div>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Employer Partnerships:</span>
                    <span className="font-medium">{university.partnerships}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Annual Events:</span>
                    <span className="font-medium">{university.recruitmentEvents}</span>
                  </div>
                </div>
                
                <div className="mt-3">
                  <span className="text-sm font-medium">Specializations:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {university.specializations.map((spec, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <Button className="w-full mt-4 bg-ehrdc-teal hover:bg-ehrdc-teal/90" size="sm">
                  View Events
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Campus Recruitment Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Campus Recruitment Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campusRecruitmentEvents.map((event) => (
              <Card key={event.id} className="border-s-4 border-s-ehrdc-teal">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{event.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center gap-1">
                          <School className="h-4 w-4" />
                          {event.university}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {event.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {event.registrationRequired ? 'Registration Required' : 'Walk-in Welcome'}
                    </Badge>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="text-sm font-medium">Participating Companies:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {event.companies.slice(0, 3).map((company, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {company}
                          </Badge>
                        ))}
                        {event.companies.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{event.companies.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium">Target Majors:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {event.targetMajors.map((major, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-blue-50">
                            {major}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <Users className="h-4 w-4" />
                    <span>Expected attendance: {event.expectedAttendees} students</span>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button className="bg-ehrdc-teal hover:bg-ehrdc-teal/90" size="sm">
                      Register Now
                    </Button>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preparation Workshops */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">University Preparation Workshops</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {preparationWorkshops.map((workshop) => (
              <Card key={workshop.id} className="border-blue-200">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">{workshop.title}</h3>
                  <div className="space-y-2 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-2">
                      <School className="h-4 w-4" />
                      {workshop.university}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {workshop.date}
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {workshop.duration}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{workshop.description}</p>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Registered: {workshop.registered}/{workshop.capacity}</span>
                      <span>{Math.round((workshop.registered / workshop.capacity) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-ehrdc-teal h-1.5 rounded-full" 
                        style={{ width: `${(workshop.registered / workshop.capacity) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-blue-600 hover:bg-blue-700" size="sm">
                    Register
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Academic to Professional Transition Support */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Academic to Professional Transition Support</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {transitionSupport.map((support, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-ehrdc-teal" />
                  {support.area}
                </h3>
                <p className="text-sm text-gray-600 mb-3">{support.description}</p>
                <div className="space-y-1">
                  {support.resources.map((resource, resourceIndex) => (
                    <div key={resourceIndex} className="flex items-center gap-2">
                      <Target className="h-3 w-3 text-ehrdc-teal" />
                      <span className="text-sm">{resource}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
