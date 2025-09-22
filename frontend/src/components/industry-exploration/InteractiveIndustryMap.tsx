
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building, TrendingUp, Users, MapPin, 
  Zap, Droplets, Plane, Truck, GraduationCap,
  Stethoscope, Home, DollarSign, Heart
} from 'lucide-react';

interface Industry {
  id: string;
  name: string;
  icon: React.ReactNode;
  growth: string;
  jobs: string;
  averageSalary: string;
  description: string;
  keyCompanies: string[];
  topRoles: string[];
  emiratizationTarget: string;
  size: 'large' | 'medium' | 'small';
}

export const InteractiveIndustryMap: React.FC = () => {
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);

  const industries: Industry[] = [
    {
      id: 'oil-gas',
      name: 'Oil & Gas',
      icon: <Droplets className="h-6 w-6" />,
      growth: '+8%',
      jobs: '180K',
      averageSalary: 'AED 120K',
      description: 'Leading energy sector driving UAE economy with focus on sustainability and innovation.',
      keyCompanies: ['ADNOC', 'Emirates National Oil Company', 'Dragon Oil'],
      topRoles: ['Petroleum Engineer', 'Project Manager', 'HSE Specialist'],
      emiratizationTarget: '75%',
      size: 'large'
    },
    {
      id: 'technology',
      name: 'Technology & Innovation',
      icon: <Zap className="h-6 w-6" />,
      growth: '+25%',
      jobs: '150K',
      averageSalary: 'AED 95K',
      description: 'Rapidly growing sector encompassing AI, fintech, and digital transformation.',
      keyCompanies: ['Microsoft UAE', 'Google MENA', 'Careem', 'Noon'],
      topRoles: ['Software Engineer', 'Data Scientist', 'Product Manager'],
      emiratizationTarget: '60%',
      size: 'large'
    },
    {
      id: 'financial-services',
      name: 'Financial Services',
      icon: <DollarSign className="h-6 w-6" />,
      growth: '+12%',
      jobs: '95K',
      averageSalary: 'AED 110K',
      description: 'Banking, insurance, and fintech services supporting regional business hub.',
      keyCompanies: ['Emirates NBD', 'First Abu Dhabi Bank', 'Dubai Islamic Bank'],
      topRoles: ['Investment Analyst', 'Risk Manager', 'Relationship Manager'],
      emiratizationTarget: '80%',
      size: 'medium'
    },
    {
      id: 'healthcare',
      name: 'Healthcare & Life Sciences',
      icon: <Stethoscope className="h-6 w-6" />,
      growth: '+18%',
      jobs: '120K',
      averageSalary: 'AED 85K',
      description: 'Expanding healthcare sector with focus on medical tourism and research.',
      keyCompanies: ['Cleveland Clinic Abu Dhabi', 'Mediclinic', 'NMC Healthcare'],
      topRoles: ['Medical Doctor', 'Nurse Specialist', 'Healthcare Administrator'],
      emiratizationTarget: '70%',
      size: 'medium'
    },
    {
      id: 'tourism-hospitality',
      name: 'Tourism & Hospitality',
      icon: <Heart className="h-6 w-6" />,
      growth: '+15%',
      jobs: '200K',
      averageSalary: 'AED 65K',
      description: 'Vibrant sector welcoming millions of visitors annually to UAE.',
      keyCompanies: ['Emirates Group', 'Jumeirah Group', 'Rotana Hotels'],
      topRoles: ['Hotel Manager', 'Tourism Specialist', 'Event Coordinator'],
      emiratizationTarget: '65%',
      size: 'large'
    },
    {
      id: 'real-estate',
      name: 'Real Estate & Construction',
      icon: <Home className="h-6 w-6" />,
      growth: '+10%',
      jobs: '160K',
      averageSalary: 'AED 78K',
      description: 'Dynamic construction and property development sector.',
      keyCompanies: ['Emaar Properties', 'DAMAC', 'Aldar Properties'],
      topRoles: ['Project Manager', 'Civil Engineer', 'Real Estate Agent'],
      emiratizationTarget: '70%',
      size: 'large'
    },
    {
      id: 'aerospace',
      name: 'Aerospace & Defense',
      icon: <Plane className="h-6 w-6" />,
      growth: '+14%',
      jobs: '45K',
      averageSalary: 'AED 105K',
      description: 'Advanced aerospace manufacturing and defense technologies.',
      keyCompanies: ['Strata Manufacturing', 'Edge Group', 'Emirates Aviation University'],
      topRoles: ['Aerospace Engineer', 'Quality Assurance', 'Manufacturing Specialist'],
      emiratizationTarget: '65%',
      size: 'small'
    },
    {
      id: 'logistics',
      name: 'Logistics & Transportation',
      icon: <Truck className="h-6 w-6" />,
      growth: '+13%',
      jobs: '140K',
      averageSalary: 'AED 72K',
      description: 'Critical supply chain and transportation hub connecting global markets.',
      keyCompanies: ['DP World', 'Aramex', 'Emirates SkyCargo'],
      topRoles: ['Supply Chain Manager', 'Logistics Coordinator', 'Fleet Manager'],
      emiratizationTarget: '60%',
      size: 'medium'
    },
    {
      id: 'education',
      name: 'Education',
      icon: <GraduationCap className="h-6 w-6" />,
      growth: '+16%',
      jobs: '85K',
      averageSalary: 'AED 68K',
      description: 'Growing education sector with focus on innovation and excellence.',
      keyCompanies: ['ADEK', 'KHDA', 'American University of Sharjah'],
      topRoles: ['Teacher', 'Education Administrator', 'Curriculum Developer'],
      emiratizationTarget: '85%',
      size: 'medium'
    }
  ];

  const getSizeClass = (size: string) => {
    switch (size) {
      case 'large': return 'md:col-span-2 md:row-span-2';
      case 'medium': return 'md:col-span-2';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-ehrdc-teal" />
            UAE Industry Landscape
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Explore the diverse industries driving UAE's economic growth. Click on any industry to learn more about opportunities, requirements, and career paths.
          </p>
          
          {/* Interactive Industry Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {industries.map((industry) => (
              <Card 
                key={industry.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 ${
                  selectedIndustry?.id === industry.id 
                    ? 'border-ehrdc-teal bg-ehrdc-teal/5' 
                    : 'border-ehrdc-neutral-light hover:border-ehrdc-teal/50'
                } ${getSizeClass(industry.size)}`}
                onClick={() => setSelectedIndustry(industry)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-ehrdc-teal/10 rounded-lg text-ehrdc-teal">
                      {industry.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm leading-tight">{industry.name}</h3>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Growth</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {industry.growth}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Jobs</span>
                      <span className="font-medium">{industry.jobs}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Avg Salary</span>
                      <span className="font-medium text-green-600">{industry.averageSalary}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Industry Details Panel */}
          {selectedIndustry && (
            <Card className="border-ehrdc-teal">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-ehrdc-teal/10 rounded-lg text-ehrdc-teal">
                      {selectedIndustry.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{selectedIndustry.name}</h3>
                      <Badge className="bg-ehrdc-teal text-white mt-1">
                        Emiratization: {selectedIndustry.emiratizationTarget}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedIndustry(null)}
                    className="text-ehrdc-teal border-ehrdc-teal"
                  >
                    Close
                  </Button>
                </div>
                
                <p className="text-muted-foreground mb-6">{selectedIndustry.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Building className="h-4 w-4 text-ehrdc-teal" />
                      Key Companies
                    </h4>
                    <ul className="space-y-1">
                      {selectedIndustry.keyCompanies.map((company, index) => (
                        <li key={index} className="text-sm text-muted-foreground">• {company}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4 text-ehrdc-teal" />
                      Top Roles
                    </h4>
                    <ul className="space-y-1">
                      {selectedIndustry.topRoles.map((role, index) => (
                        <li key={index} className="text-sm text-muted-foreground">• {role}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Quick Stats</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Growth Rate</span>
                        <span className="font-medium text-green-600">{selectedIndustry.growth}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Available Jobs</span>
                        <span className="font-medium">{selectedIndustry.jobs}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Average Salary</span>
                        <span className="font-medium">{selectedIndustry.averageSalary}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <Button className="bg-ehrdc-teal hover:bg-ehrdc-dark-teal">
                    View Career Paths
                  </Button>
                  <Button variant="outline">
                    Find Jobs
                  </Button>
                  <Button variant="outline">
                    Connect with Professionals
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
