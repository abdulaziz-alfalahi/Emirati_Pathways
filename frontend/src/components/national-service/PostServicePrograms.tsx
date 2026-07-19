
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  GraduationCap, Building, Users, Briefcase, Calendar, 
  MapPin, Clock, Star, Filter, Search, Award 
} from 'lucide-react';

export const PostServicePrograms: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const programs = [
    {
      id: 1,
      title: 'Veteran Leadership Development Program',
      provider: 'Ministry of Human Resources',
      category: 'Leadership',
      duration: '6 months',
      format: 'Hybrid',
      location: 'Dubai/Abu Dhabi',
      startDate: '2024-07-15',
      participants: 25,
      description: 'Intensive leadership program designed specifically for military veterans transitioning to civilian leadership roles.',
      benefits: ['Executive coaching', 'Industry networking', 'Job placement assistance'],
      eligibility: 'Completed national service with leadership experience',
      applicationDeadline: '2024-06-30',
      cost: 'Free',
      rating: 4.8
    },
    {
      id: 2,
      title: 'Technology Transition Bootcamp',
      provider: 'Dubai Future Foundation',
      category: 'Technology',
      duration: '12 weeks',
      format: 'In-person',
      location: 'Dubai',
      startDate: '2024-08-01',
      participants: 30,
      description: 'Comprehensive technology training program covering cybersecurity, cloud computing, and digital transformation.',
      benefits: ['Industry certifications', 'Hands-on projects', 'Corporate partnerships'],
      eligibility: 'Basic computer skills required',
      applicationDeadline: '2024-07-15',
      cost: 'Free',
      rating: 4.9
    },
    {
      id: 3,
      title: 'Veteran Entrepreneurship Accelerator',
      provider: 'Mohammed Bin Rashid Innovation Fund',
      category: 'Entrepreneurship',
      duration: '4 months',
      format: 'Hybrid',
      location: 'Multiple Emirates',
      startDate: '2024-09-01',
      participants: 20,
      description: 'Support veterans in launching their own businesses with mentorship, funding, and market access.',
      benefits: ['Seed funding', 'Mentorship', 'Market access', 'Legal support'],
      eligibility: 'Business idea and basic plan required',
      applicationDeadline: '2024-08-15',
      cost: 'Equity-based',
      rating: 4.7
    }
  ];

  const reservedPositions = [
    {
      organization: 'Dubai Police',
      sector: 'Security & Safety',
      positions: 150,
      requirements: 'National service completion, physical fitness',
      benefits: 'Accelerated promotion track, specialized training',
      applicationProcess: 'Direct application portal'
    },
    {
      organization: 'Emirates Airlines',
      sector: 'Aviation',
      positions: 75,
      requirements: 'Language proficiency, customer service aptitude',
      benefits: 'Global travel benefits, career development',
      applicationProcess: 'Veteran recruitment program'
    },
    {
      organization: 'ADNOC',
      sector: 'Energy',
      positions: 100,
      requirements: 'Technical aptitude, safety certification',
      benefits: 'Industry-leading compensation, growth opportunities',
      applicationProcess: 'Priority consideration process'
    }
  ];

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || program.category.toLowerCase() === filterCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search programs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ps-10"
              />
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="leadership">Leadership</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="entrepreneurship">Entrepreneurship</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transition Programs */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-ehrdc-teal">Transition Assistance Programs</h2>
        {filteredPrograms.map((program) => (
          <Card key={program.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{program.title}</h3>
                  <p className="text-ehrdc-teal font-medium">{program.provider}</p>
                </div>
                <div className="text-end">
                  <Badge className="mb-2">{program.category}</Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{program.rating}</span>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 mb-4">{program.description}</p>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{program.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{program.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Starts {program.startDate}</span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium mb-2">Program Benefits:</h4>
                <div className="flex flex-wrap gap-2">
                  {program.benefits.map((benefit, index) => (
                    <Badge key={index} variant="outline">{benefit}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Cost:</span> {program.cost} | 
                  <span className="font-medium"> Deadline:</span> {program.applicationDeadline}
                </div>
                <Button className="bg-ehrdc-teal hover:bg-ehrdc-teal/90">
                  Apply Now
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reserved Positions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Reserved Positions for Veterans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reservedPositions.map((position, index) => (
              <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{position.organization}</h3>
                    <p className="text-ehrdc-teal">{position.sector}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {position.positions} Positions Available
                  </Badge>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <h4 className="font-medium mb-1">Requirements:</h4>
                    <p className="text-sm text-gray-600">{position.requirements}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Benefits:</h4>
                    <p className="text-sm text-gray-600">{position.benefits}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-ehrdc-teal">{position.applicationProcess}</span>
                  <Button size="sm" variant="outline">
                    Learn More
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Entrepreneurship Support */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Veteran Entrepreneurship Support</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-white rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <Award className="h-8 w-8 text-ehrdc-teal" />
              </div>
              <h3 className="font-semibold mb-2">Startup Funding</h3>
              <p className="text-sm text-gray-600">Special funding rates and grants for veteran entrepreneurs</p>
            </div>
            
            <div className="text-center">
              <div className="bg-white rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <Users className="h-8 w-8 text-ehrdc-teal" />
              </div>
              <h3 className="font-semibold mb-2">Mentorship Network</h3>
              <p className="text-sm text-gray-600">Connect with successful veteran entrepreneurs and business leaders</p>
            </div>
            
            <div className="text-center">
              <div className="bg-white rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <Building className="h-8 w-8 text-ehrdc-teal" />
              </div>
              <h3 className="font-semibold mb-2">Business Incubation</h3>
              <p className="text-sm text-gray-600">Access to business incubators and co-working spaces</p>
            </div>
          </div>
          
          <div className="text-center mt-6">
            <Button className="bg-ehrdc-teal hover:bg-ehrdc-teal/90">
              Explore Entrepreneurship Programs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
