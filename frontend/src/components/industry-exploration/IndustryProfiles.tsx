
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building, TrendingUp, Users, MapPin, Search, Filter,
  Briefcase, DollarSign, Clock, Award
} from 'lucide-react';

interface IndustryProfile {
  id: string;
  name: string;
  sector: string;
  description: string;
  marketSize: string;
  employeeCount: string;
  growth: string;
  averageSalary: string;
  topSkills: string[];
  workCulture: string;
  benefits: string[];
  location: string;
  established: string;
  opportunities: number;
}

export const IndustryProfiles: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedProfile, setSelectedProfile] = useState<IndustryProfile | null>(null);

  const industryProfiles: IndustryProfile[] = [
    {
      id: 'adnoc',
      name: 'Abu Dhabi National Oil Company (ADNOC)',
      sector: 'Oil & Gas',
      description: 'Leading integrated energy and petrochemicals group enabling a lower-carbon future.',
      marketSize: 'AED 200B+',
      employeeCount: '50K+',
      growth: '+8%',
      averageSalary: 'AED 145K',
      topSkills: ['Petroleum Engineering', 'Project Management', 'HSE', 'Digital Transformation'],
      workCulture: 'Innovation-driven with strong emphasis on safety and sustainability',
      benefits: ['Health Insurance', 'Housing Allowance', 'Education Support', 'Career Development'],
      location: 'Abu Dhabi',
      established: '1971',
      opportunities: 250
    },
    {
      id: 'emirates-nbd',
      name: 'Emirates NBD',
      sector: 'Financial Services',
      description: 'Largest banking group in the Middle East, North Africa and Turkey region.',
      marketSize: 'AED 850B',
      employeeCount: '45K+',
      growth: '+12%',
      averageSalary: 'AED 125K',
      topSkills: ['Financial Analysis', 'Risk Management', 'Digital Banking', 'Customer Relations'],
      workCulture: 'Customer-centric with focus on digital innovation and excellence',
      benefits: ['Comprehensive Insurance', 'Performance Bonuses', 'Training Programs', 'Flexible Work'],
      location: 'Dubai',
      established: '2007',
      opportunities: 180
    },
    {
      id: 'microsoft-uae',
      name: 'Microsoft UAE',
      sector: 'Technology',
      description: 'Global technology company empowering digital transformation across UAE.',
      marketSize: 'A growing sector',
      employeeCount: '2K+',
      growth: '+25%',
      averageSalary: 'AED 135K',
      topSkills: ['Cloud Computing', 'AI/ML', 'Software Development', 'Solution Architecture'],
      workCulture: 'Inclusive, diverse, and innovation-focused with growth mindset',
      benefits: ['Stock Options', 'Learning Budget', 'Wellness Programs', 'Remote Work'],
      location: 'Dubai',
      established: '1991',
      opportunities: 85
    },
    {
      id: 'cleveland-clinic',
      name: 'Cleveland Clinic Abu Dhabi',
      sector: 'Healthcare',
      description: 'Multi-specialty hospital delivering world-class healthcare in the UAE.',
      marketSize: 'AED 65B',
      employeeCount: '3K+',
      growth: '+18%',
      averageSalary: 'AED 95K',
      topSkills: ['Clinical Excellence', 'Patient Care', 'Medical Research', 'Healthcare Technology'],
      workCulture: 'Patient-first approach with commitment to medical excellence and innovation',
      benefits: ['Medical Coverage', 'Professional Development', 'Research Support', 'International Exposure'],
      location: 'Abu Dhabi',
      established: '2015',
      opportunities: 120
    },
    {
      id: 'jumeirah-group',
      name: 'Jumeirah Group',
      sector: 'Tourism & Hospitality',
      description: 'Global luxury hospitality company and a member of Dubai Holding.',
      marketSize: 'AED 45B',
      employeeCount: '15K+',
      growth: '+15%',
      averageSalary: 'AED 72K',
      topSkills: ['Hospitality Management', 'Customer Service', 'Event Planning', 'Revenue Management'],
      workCulture: 'Service excellence with emphasis on cultural diversity and guest satisfaction',
      benefits: ['Staff Accommodation', 'Meals', 'Travel Discounts', 'Career Progression'],
      location: 'Dubai',
      established: '1997',
      opportunities: 300
    },
    {
      id: 'emaar',
      name: 'Emaar Properties',
      sector: 'Real Estate',
      description: 'Global property developer and provider of premium lifestyles.',
      marketSize: 'AED 185B',
      employeeCount: '8K+',
      growth: '+10%',
      averageSalary: 'AED 88K',
      topSkills: ['Project Management', 'Construction', 'Real Estate Development', 'Sales & Marketing'],
      workCulture: 'Entrepreneurial spirit with focus on innovation and quality',
      benefits: ['Housing Support', 'Performance Incentives', 'Training', 'Health Coverage'],
      location: 'Dubai',
      established: '1997',
      opportunities: 160
    }
  ];

  const sectors = ['all', 'Oil & Gas', 'Financial Services', 'Technology', 'Healthcare', 'Tourism & Hospitality', 'Real Estate'];

  const filteredProfiles = industryProfiles.filter(profile => {
    const matchesSearch = profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         profile.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = selectedSector === 'all' || profile.sector === selectedSector;
    return matchesSearch && matchesSector;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-ehrdc-teal" />
            Company & Industry Profiles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Explore detailed profiles of leading companies across UAE's major industries.
          </p>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies or industries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ps-10"
              />
            </div>
            <Select value={selectedSector} onValueChange={setSelectedSector}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 me-2" />
                <SelectValue placeholder="Filter by sector" />
              </SelectTrigger>
              <SelectContent>
                {sectors.map(sector => (
                  <SelectItem key={sector} value={sector}>
                    {sector === 'all' ? 'All Sectors' : sector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Company Profiles Grid */}
          <div className="grid gap-6">
            {filteredProfiles.map((profile) => (
              <Card key={profile.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">{profile.name}</h3>
                          <Badge className="bg-ehrdc-teal/10 text-ehrdc-teal">
                            {profile.sector}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <TrendingUp className="h-3 w-3 me-1" />
                            {profile.growth}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-muted-foreground mb-4">{profile.description}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-ehrdc-teal" />
                          <div>
                            <p className="text-xs text-muted-foreground">Employees</p>
                            <p className="font-medium">{profile.employeeCount}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-ehrdc-teal" />
                          <div>
                            <p className="text-xs text-muted-foreground">Avg Salary</p>
                            <p className="font-medium">{profile.averageSalary}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-ehrdc-teal" />
                          <div>
                            <p className="text-xs text-muted-foreground">Location</p>
                            <p className="font-medium">{profile.location}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-ehrdc-teal" />
                          <div>
                            <p className="text-xs text-muted-foreground">Open Roles</p>
                            <p className="font-medium">{profile.opportunities}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Award className="h-4 w-4 text-ehrdc-teal" />
                          Top Skills Required
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.topSkills.map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button 
                          className="bg-ehrdc-teal hover:bg-ehrdc-dark-teal"
                          onClick={() => setSelectedProfile(profile)}
                        >
                          View Full Profile
                        </Button>
                        <Button variant="outline">
                          View Open Positions
                        </Button>
                        <Button variant="outline">
                          Connect with Employees
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProfiles.length === 0 && (
            <div className="text-center py-12">
              <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Companies Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Profile Modal/Panel */}
      {selectedProfile && (
        <Card className="border-ehrdc-teal">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">{selectedProfile.name}</h3>
              <Button
                variant="outline"
                onClick={() => setSelectedProfile(null)}
                className="text-ehrdc-teal border-ehrdc-teal"
              >
                Close
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Company Overview</h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-muted-foreground">Work Culture:</span>
                    <p className="text-sm">{selectedProfile.workCulture}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Market Size:</span>
                    <p className="text-sm font-medium">{selectedProfile.marketSize}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Established:</span>
                    <p className="text-sm font-medium">{selectedProfile.established}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Employee Benefits</h4>
                <ul className="space-y-1">
                  {selectedProfile.benefits.map((benefit, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                      <Award className="h-3 w-3 text-ehrdc-teal" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
