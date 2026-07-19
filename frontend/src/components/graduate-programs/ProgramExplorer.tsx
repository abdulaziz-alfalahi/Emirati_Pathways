
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, MapPin, Calendar, DollarSign, Star, Heart, Bookmark } from 'lucide-react';

export const ProgramExplorer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('deadline');

  const programs = [
    {
      id: 1,
      title: 'Emirates Future Leaders Program',
      company: 'Emirates Group',
      industry: 'Aviation',
      location: 'Dubai',
      duration: '24 months',
      salary: 'AED 15,000/month',
      deadline: '2024-03-15',
      rating: 4.8,
      description: 'Comprehensive leadership development program with international rotations',
      benefits: ['Housing allowance', 'Health insurance', 'Travel benefits'],
      saved: false
    },
    {
      id: 2,
      title: 'ADNOC Graduate Development Program',
      company: 'ADNOC',
      industry: 'Energy',
      location: 'Abu Dhabi',
      duration: '18 months',
      salary: 'AED 18,000/month',
      deadline: '2024-02-28',
      rating: 4.9,
      description: 'Technical and leadership development in energy sector',
      benefits: ['Performance bonus', 'Training budget', 'Career mentorship'],
      saved: true
    },
    {
      id: 3,
      title: 'ADCB Banking Graduate Scheme',
      company: 'Abu Dhabi Commercial Bank',
      industry: 'Banking',
      location: 'Abu Dhabi',
      duration: '12 months',
      salary: 'AED 12,000/month',
      deadline: '2024-04-30',
      rating: 4.6,
      description: 'Fast-track development program across all banking divisions',
      benefits: ['Banking qualifications', 'Networking events', 'Fast promotion'],
      saved: false
    }
  ];

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = industryFilter === 'all' || program.industry.toLowerCase() === industryFilter.toLowerCase();
    return matchesSearch && matchesIndustry;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search programs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ps-10"
              />
            </div>
            
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                <SelectItem value="aviation">Aviation</SelectItem>
                <SelectItem value="energy">Energy</SelectItem>
                <SelectItem value="banking">Banking</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deadline">Application Deadline</SelectItem>
                <SelectItem value="salary">Salary</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="company">Company</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <Filter className="h-4 w-4 me-2" />
              Advanced Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-ehrdc-teal">
          {filteredPrograms.length} Programs Found
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Heart className="h-4 w-4 me-1" />
            Saved ({programs.filter(p => p.saved).length})
          </Button>
          <Button variant="outline" size="sm">
            Set Alert
          </Button>
        </div>
      </div>

      {/* Program Cards */}
      <div className="space-y-4">
        {filteredPrograms.map((program) => (
          <Card key={program.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{program.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="font-medium text-ehrdc-teal">{program.company}</span>
                    <Badge variant="outline">{program.industry}</Badge>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {program.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {program.duration}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{program.description}</p>
                </div>
                
                <div className="text-end ms-6">
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{program.rating}</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Bookmark className={`h-4 w-4 ${program.saved ? 'fill-ehrdc-teal text-ehrdc-teal' : ''}`} />
                  </Button>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-4">
                <div>
                  <h4 className="font-medium mb-2">Salary & Benefits:</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-600">{program.salary}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {program.benefits.map((benefit, index) => (
                      <Badge key={index} variant="outline" className="text-xs">{benefit}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Application Deadline:</h4>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-red-500" />
                    <span className="font-medium text-red-500">{program.deadline}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">10 days remaining</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button className="bg-ehrdc-teal hover:bg-ehrdc-teal/90">
                  Apply Now
                </Button>
                <Button variant="outline">
                  Learn More
                </Button>
                <Button variant="outline">
                  Compare
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
