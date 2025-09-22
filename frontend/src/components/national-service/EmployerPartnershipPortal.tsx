
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, Users, Briefcase, Star, Search, CheckCircle, Award, TrendingUp } from 'lucide-react';

export const EmployerPartnershipPortal: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('all');

  const partnerEmployers = [
    {
      id: 1,
      name: 'Emirates Airlines',
      sector: 'Aviation',
      positions: 45,
      commitment: 'Hire 200 veterans annually',
      benefits: ['Fast-track recruitment', 'Leadership development', 'Global opportunities'],
      rating: 4.8,
      logo: '/api/placeholder/80/80',
      veteranEmployees: 150,
      description: 'Leading aviation company with strong veteran integration programs'
    },
    {
      id: 2,
      name: 'ADNOC',
      sector: 'Energy',
      positions: 60,
      commitment: '25% veteran hiring preference',
      benefits: ['Competitive salaries', 'Career progression', 'Skills training'],
      rating: 4.9,
      logo: '/api/placeholder/80/80',
      veteranEmployees: 220,
      description: 'Energy sector leader prioritizing veteran talent'
    },
    {
      id: 3,
      name: 'Dubai Police',
      sector: 'Security',
      positions: 100,
      commitment: 'Priority hiring for veterans',
      benefits: ['Accelerated promotion', 'Specialized training', 'Leadership roles'],
      rating: 4.7,
      logo: '/api/placeholder/80/80',
      veteranEmployees: 350,
      description: 'Public safety organization with veteran-first policies'
    }
  ];

  const employerPledges = [
    {
      pledge: 'Veteran Hiring Commitment',
      companies: 125,
      description: 'Minimum 15% veteran hiring across all positions'
    },
    {
      pledge: 'Skills-First Recruitment',
      companies: 89,
      description: 'Focus on transferable skills over traditional qualifications'
    },
    {
      pledge: 'Mentorship Programs',
      companies: 67,
      description: 'Dedicated veteran mentorship and career development'
    }
  ];

  const filteredEmployers = partnerEmployers.filter(employer => {
    const matchesSearch = employer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employer.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = filterSector === 'all' || employer.sector.toLowerCase() === filterSector.toLowerCase();
    return matchesSearch && matchesSector;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search employers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterSector} onValueChange={setFilterSector}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                <SelectItem value="aviation">Aviation</SelectItem>
                <SelectItem value="energy">Energy</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Partner Employers */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-ehrdc-teal">Veteran-Friendly Employers</h2>
        {filteredEmployers.map((employer) => (
          <Card key={employer.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Building className="h-8 w-8 text-ehrdc-teal" />
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold">{employer.name}</h3>
                      <Badge variant="outline">{employer.sector}</Badge>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{employer.rating}</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        {employer.positions} Open Positions
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{employer.description}</p>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium mb-2">Veteran Commitment:</h4>
                      <p className="text-sm text-ehrdc-teal">{employer.commitment}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Current Veterans:</h4>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{employer.veteranEmployees} employees</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Benefits:</h4>
                    <div className="flex flex-wrap gap-2">
                      {employer.benefits.map((benefit, index) => (
                        <Badge key={index} variant="outline">{benefit}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button className="bg-ehrdc-teal hover:bg-ehrdc-teal/90">
                      View Open Positions
                    </Button>
                    <Button variant="outline">
                      Company Profile
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Employer Pledges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Employer Commitments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {employerPledges.map((pledge, index) => (
              <div key={index} className="text-center p-4 border rounded-lg">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">{pledge.pledge}</h3>
                <div className="text-2xl font-bold text-ehrdc-teal mb-2">{pledge.companies}</div>
                <p className="text-sm text-gray-600">Companies Committed</p>
                <p className="text-xs text-gray-500 mt-2">{pledge.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Direct Application Portal */}
      <Card className="bg-gradient-to-r from-red-50 to-green-50">
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Veteran Direct Application Portal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              Apply directly to veteran-priority positions with our streamlined application process
            </p>
            
            <div className="grid md:grid-cols-3 gap-4 my-6">
              <div className="p-4 bg-white rounded-lg">
                <Award className="h-8 w-8 text-ehrdc-teal mx-auto mb-2" />
                <h4 className="font-semibold">Priority Review</h4>
                <p className="text-sm text-gray-600">Your application gets priority consideration</p>
              </div>
              
              <div className="p-4 bg-white rounded-lg">
                <TrendingUp className="h-8 w-8 text-ehrdc-teal mx-auto mb-2" />
                <h4 className="font-semibold">Fast-Track Process</h4>
                <p className="text-sm text-gray-600">Accelerated hiring timeline for veterans</p>
              </div>
              
              <div className="p-4 bg-white rounded-lg">
                <Users className="h-8 w-8 text-ehrdc-teal mx-auto mb-2" />
                <h4 className="font-semibold">Dedicated Support</h4>
                <p className="text-sm text-gray-600">Veteran liaisons assist with applications</p>
              </div>
            </div>
            
            <Button size="lg" className="bg-ehrdc-teal hover:bg-ehrdc-teal/90">
              Access Application Portal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
