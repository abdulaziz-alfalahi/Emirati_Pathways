
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Star, MessageCircle, TrendingUp, Award, Users, Calendar } from 'lucide-react';

export const AlumniInsights: React.FC = () => {
  const [filterProgram, setFilterProgram] = useState('all');

  const alumni = [
    {
      id: 1,
      name: 'Sarah Al-Mansoori',
      currentRole: 'Senior Manager, Strategy',
      company: 'Emirates Group',
      program: 'Emirates Future Leaders Program',
      graduationYear: 2022,
      avatar: '/api/placeholder/80/80',
      story: 'The graduate program gave me exposure to different departments and helped me find my passion in strategic planning.',
      videoAvailable: true,
      keyTips: ['Network actively during rotations', 'Seek feedback constantly', 'Take on challenging projects'],
      careerProgression: [
        { role: 'Graduate Trainee', year: 2020 },
        { role: 'Junior Analyst', year: 2021 },
        { role: 'Business Analyst', year: 2022 },
        { role: 'Senior Manager', year: 2023 }
      ]
    },
    {
      id: 2,
      name: 'Ahmed Al-Rashid',
      currentRole: 'Technical Lead',
      company: 'ADNOC',
      program: 'ADNOC Graduate Development Program',
      graduationYear: 2021,
      avatar: '/api/placeholder/80/80',
      story: 'The technical training and mentorship I received shaped my engineering career and leadership skills.',
      videoAvailable: false,
      keyTips: ['Master the technical fundamentals', 'Build relationships with mentors', 'Contribute to innovation projects'],
      careerProgression: [
        { role: 'Graduate Engineer', year: 2019 },
        { role: 'Process Engineer', year: 2020 },
        { role: 'Senior Engineer', year: 2022 },
        { role: 'Technical Lead', year: 2024 }
      ]
    },
    {
      id: 3,
      name: 'Fatima Al-Zahra',
      currentRole: 'Investment Banking Associate',
      company: 'ADCB',
      program: 'ADCB Banking Graduate Scheme',
      graduationYear: 2023,
      avatar: '/api/placeholder/80/80',
      story: 'The program provided comprehensive exposure to all banking functions, helping me specialize in investment banking.',
      videoAvailable: true,
      keyTips: ['Excel in analytical skills', 'Understand market dynamics', 'Build client relationship skills'],
      careerProgression: [
        { role: 'Graduate Trainee', year: 2021 },
        { role: 'Banking Analyst', year: 2022 },
        { role: 'Associate', year: 2023 }
      ]
    }
  ];

  const successMetrics = [
    { metric: 'Average Salary Increase', value: '45%', description: 'Within 2 years of program completion' },
    { metric: 'Promotion Rate', value: '78%', description: 'Promoted within 18 months' },
    { metric: 'Job Satisfaction', value: '4.6/5', description: 'Overall program satisfaction rating' },
    { metric: 'Network Value', value: '85%', description: 'Still connected with program alumni' }
  ];

  const dayInLife = {
    name: 'Current Graduate - Omar Al-Mahmoud',
    program: 'Etisalat Technology Graduate Program',
    currentRotation: 'Digital Innovation Department',
    schedule: [
      { time: '8:00 AM', activity: 'Team standup meeting', type: 'meeting' },
      { time: '9:00 AM', activity: 'Technical training session - Cloud Architecture', type: 'training' },
      { time: '11:00 AM', activity: 'Project work - Mobile app development', type: 'project' },
      { time: '1:00 PM', activity: 'Lunch with mentor', type: 'mentorship' },
      { time: '2:30 PM', activity: 'Cross-department collaboration meeting', type: 'meeting' },
      { time: '4:00 PM', activity: 'Innovation workshop participation', type: 'workshop' },
      { time: '5:30 PM', activity: 'Graduate cohort networking session', type: 'networking' }
    ]
  };

  const filteredAlumni = alumni.filter(alum => 
    filterProgram === 'all' || alum.program.toLowerCase().includes(filterProgram.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Success Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {successMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-ehrdc-teal mb-1">{metric.value}</div>
              <div className="font-medium text-sm mb-1">{metric.metric}</div>
              <div className="text-xs text-gray-600">{metric.description}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <span className="font-medium">Filter by Program:</span>
            <Select value={filterProgram} onValueChange={setFilterProgram}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="All Programs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                <SelectItem value="emirates">Emirates Future Leaders</SelectItem>
                <SelectItem value="adnoc">ADNOC Graduate Development</SelectItem>
                <SelectItem value="adcb">ADCB Banking Graduate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alumni Profiles */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-ehrdc-teal">Alumni Success Stories</h2>
        
        {filteredAlumni.map((alum) => (
          <Card key={alum.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-ehrdc-teal/10 rounded-full flex items-center justify-center">
                  <Users className="h-8 w-8 text-ehrdc-teal" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{alum.name}</h3>
                  <p className="text-ehrdc-teal font-medium">{alum.currentRole}</p>
                  <p className="text-sm text-gray-600">{alum.company}</p>
                  <Badge variant="outline" className="mt-1">{alum.program}</Badge>
                </div>
                
                <div className="text-end">
                  <div className="text-sm text-gray-600">Graduated: {alum.graduationYear}</div>
                  {alum.videoAvailable && (
                    <Button size="sm" variant="outline" className="mt-2">
                      <Play className="h-4 w-4 me-1" />
                      Watch Video
                    </Button>
                  )}
                </div>
              </div>
              
              <blockquote className="text-gray-700 italic mb-4 ps-4 border-s-4 border-ehrdc-teal">
                "{alum.story}"
              </blockquote>
              
              <div className="grid md:grid-cols-2 gap-6 mb-4">
                <div>
                  <h4 className="font-medium mb-2">Career Progression:</h4>
                  <div className="space-y-2">
                    {alum.careerProgression.map((step, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-ehrdc-teal rounded-full"></div>
                        <span className="text-sm">{step.role}</span>
                        <span className="text-xs text-gray-500">({step.year})</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Key Tips for Success:</h4>
                  <div className="space-y-1">
                    {alum.keyTips.map((tip, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  <MessageCircle className="h-4 w-4 me-1" />
                  Connect
                </Button>
                <Button variant="outline" size="sm">
                  <Award className="h-4 w-4 me-1" />
                  Full Story
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Day in the Life */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Day in the Life: Current Graduate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h3 className="font-semibold text-lg">{dayInLife.name}</h3>
            <p className="text-ehrdc-teal">{dayInLife.program}</p>
            <p className="text-sm text-gray-600">Current Rotation: {dayInLife.currentRotation}</p>
          </div>
          
          <div className="space-y-3">
            {dayInLife.schedule.map((item, index) => (
              <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="text-sm font-medium text-ehrdc-teal w-16">
                  {item.time}
                </div>
                <div className="flex-1">
                  <span className="text-sm">{item.activity}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {item.type}
                </Badge>
              </div>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <Button className="bg-ehrdc-teal hover:bg-ehrdc-teal/90">
              <Play className="h-4 w-4 me-2" />
              Watch Full Day Video
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
