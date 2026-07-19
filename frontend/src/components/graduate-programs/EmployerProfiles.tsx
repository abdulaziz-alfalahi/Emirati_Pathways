
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, Users, TrendingUp, Star, MapPin, Award, Target, Heart } from 'lucide-react';

export const EmployerProfiles: React.FC = () => {
  const [filterSector, setFilterSector] = useState('all');

  const employers = [
    {
      id: 1,
      name: 'Emirates Group',
      sector: 'Aviation',
      logo: '/api/placeholder/80/80',
      description: 'Leading aviation and travel services group with global operations',
      employees: '105,000+',
      locations: ['Dubai', 'Worldwide'],
      programName: 'Emirates Future Leaders Program',
      programDuration: '24 months',
      intakeSize: 25,
      rating: 4.8,
      culture: {
        values: ['Excellence', 'Innovation', 'Customer Focus', 'Teamwork'],
        workEnvironment: 'Fast-paced, international, collaborative',
        diversityScore: 92
      },
      development: {
        trainingBudget: 'AED 50,000 per graduate',
        mentorship: 'Senior executive mentors',
        rotations: ['Operations', 'Strategy', 'Customer Experience', 'International Markets'],
        certifications: ['Project Management', 'Leadership', 'Aviation Management']
      },
      careerPaths: [
        { path: 'Operations Management', timeframe: '3-5 years', progression: 'Trainee → Supervisor → Manager → Senior Manager' },
        { path: 'Strategy & Planning', timeframe: '4-6 years', progression: 'Analyst → Senior Analyst → Strategy Manager' },
        { path: 'Customer Experience', timeframe: '3-4 years', progression: 'Associate → Specialist → Manager' }
      ],
      benefits: ['Competitive salary', 'Travel benefits', 'Health insurance', 'Performance bonuses', 'Professional development']
    },
    {
      id: 2,
      name: 'ADNOC',
      sector: 'Energy',
      logo: '/api/placeholder/80/80',
      description: 'Leading energy company driving UAE\'s oil and gas industry',
      employees: '60,000+',
      locations: ['Abu Dhabi', 'UAE'],
      programName: 'ADNOC Graduate Development Program',
      programDuration: '18 months',
      intakeSize: 40,
      rating: 4.9,
      culture: {
        values: ['Safety', 'Excellence', 'Innovation', 'Respect'],
        workEnvironment: 'Technical excellence, safety-focused, innovative',
        diversityScore: 88
      },
      development: {
        trainingBudget: 'AED 75,000 per graduate',
        mentorship: 'Technical and leadership mentors',
        rotations: ['Upstream', 'Downstream', 'Petrochemicals', 'Renewable Energy'],
        certifications: ['Technical Engineering', 'HSE', 'Project Management', 'Leadership']
      },
      careerPaths: [
        { path: 'Technical Engineering', timeframe: '4-6 years', progression: 'Graduate Engineer → Engineer → Senior Engineer → Lead Engineer' },
        { path: 'Operations', timeframe: '5-7 years', progression: 'Trainee → Operator → Senior Operator → Supervisor' },
        { path: 'Business Development', timeframe: '4-5 years', progression: 'Analyst → Senior Analyst → Manager' }
      ],
      benefits: ['Excellent compensation', 'Housing allowance', 'Health benefits', 'Training budget', 'Career progression']
    },
    {
      id: 3,
      name: 'Abu Dhabi Commercial Bank',
      sector: 'Banking',
      logo: '/api/placeholder/80/80',
      description: 'Leading financial institution in the UAE and MENA region',
      employees: '6,000+',
      locations: ['Abu Dhabi', 'Dubai', 'Regional'],
      programName: 'ADCB Banking Graduate Scheme',
      programDuration: '12 months',
      intakeSize: 15,
      rating: 4.6,
      culture: {
        values: ['Integrity', 'Excellence', 'Teamwork', 'Innovation'],
        workEnvironment: 'Professional, client-focused, fast-paced',
        diversityScore: 85
      },
      development: {
        trainingBudget: 'AED 40,000 per graduate',
        mentorship: 'Senior banking professionals',
        rotations: ['Retail Banking', 'Corporate Banking', 'Investment Banking', 'Risk Management'],
        certifications: ['CFA', 'FRM', 'Banking Qualifications', 'Leadership']
      },
      careerPaths: [
        { path: 'Relationship Management', timeframe: '3-4 years', progression: 'Associate → Officer → Manager' },
        { path: 'Investment Banking', timeframe: '4-6 years', progression: 'Analyst → Associate → VP' },
        { path: 'Risk Management', timeframe: '3-5 years', progression: 'Analyst → Senior Analyst → Manager' }
      ],
      benefits: ['Competitive salary', 'Banking benefits', 'Health insurance', 'Professional qualifications', 'Bonus scheme']
    }
  ];

  const filteredEmployers = employers.filter(employer => 
    filterSector === 'all' || employer.sector.toLowerCase() === filterSector.toLowerCase()
  );

  return (
    <div className="space-y-6">
      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <span className="font-medium">Filter by Sector:</span>
            <Select value={filterSector} onValueChange={setFilterSector}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Sectors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                <SelectItem value="aviation">Aviation</SelectItem>
                <SelectItem value="energy">Energy</SelectItem>
                <SelectItem value="banking">Banking</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employer Profiles */}
      <div className="space-y-6">
        {filteredEmployers.map((employer) => (
          <Card key={employer.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-ehrdc-teal/10 rounded-lg flex items-center justify-center">
                  <Building className="h-8 w-8 text-ehrdc-teal" />
                </div>
                
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">{employer.name}</h2>
                  <Badge variant="outline" className="mb-2">{employer.sector}</Badge>
                  <p className="text-gray-600 mb-2">{employer.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {employer.employees} employees
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {employer.locations.join(', ')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {employer.rating}/5
                    </div>
                  </div>
                </div>
              </div>

              {/* Program Overview */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <Card className="border-ehrdc-teal/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-ehrdc-teal">Graduate Program</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <h3 className="font-semibold mb-2">{employer.programName}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span className="font-medium">{employer.programDuration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Annual Intake:</span>
                        <span className="font-medium">{employer.intakeSize} graduates</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Training Budget:</span>
                        <span className="font-medium text-green-600">{employer.development.trainingBudget}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-blue-600">Company Culture</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium">Core Values:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {employer.culture.values.map((value, index) => (
                            <Badge key={index} variant="outline" className="text-xs">{value}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Work Environment:</span>
                        <p className="text-sm text-gray-600 mt-1">{employer.culture.workEnvironment}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span className="text-sm">Diversity Score: {employer.culture.diversityScore}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Development & Training */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3 text-ehrdc-teal">Development Opportunities</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Program Rotations:</h4>
                    <div className="space-y-1">
                      {employer.development.rotations.map((rotation, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <TrendingUp className="h-3 w-3 text-ehrdc-teal" />
                          <span className="text-sm">{rotation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Certifications Provided:</h4>
                    <div className="space-y-1">
                      {employer.development.certifications.map((cert, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Award className="h-3 w-3 text-yellow-600" />
                          <span className="text-sm">{cert}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Career Paths */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3 text-ehrdc-teal">Career Progression Paths</h3>
                <div className="space-y-4">
                  {employer.careerPaths.map((path, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{path.path}</h4>
                        <Badge variant="outline">{path.timeframe}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{path.progression}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3 text-ehrdc-teal">Benefits & Compensation</h3>
                <div className="flex flex-wrap gap-2">
                  {employer.benefits.map((benefit, index) => (
                    <Badge key={index} variant="outline" className="bg-green-50 text-green-700">
                      {benefit}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button className="bg-ehrdc-teal hover:bg-ehrdc-teal/90">
                  <Target className="h-4 w-4 me-2" />
                  Apply to Program
                </Button>
                <Button variant="outline">
                  <Building className="h-4 w-4 me-2" />
                  Company Profile
                </Button>
                <Button variant="outline">
                  <Users className="h-4 w-4 me-2" />
                  Meet Alumni
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
