
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, Star, TrendingUp, Award, Users } from 'lucide-react';

export const EmployerRecognition: React.FC = () => {
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const employerData = [
    {
      company: 'Emirates NBD',
      industry: 'Banking & Finance',
      logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop',
      valuedCertifications: [
        { name: 'CFA Level 1', importance: 'Critical', hiringWeight: 85 },
        { name: 'FRM', importance: 'High', hiringWeight: 75 },
        { name: 'PMP', importance: 'Moderate', hiringWeight: 60 }
      ],
      hrContact: 'careers@emiratesnbd.com',
      averageSalaryBonus: '35%',
      openPositions: 45
    },
    {
      company: 'Etisalat',
      industry: 'Telecommunications',
      logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop',
      valuedCertifications: [
        { name: 'CISSP', importance: 'Critical', hiringWeight: 90 },
        { name: 'AWS Solutions Architect', importance: 'High', hiringWeight: 80 },
        { name: 'ITIL Foundation', importance: 'High', hiringWeight: 70 }
      ],
      hrContact: 'recruitment@etisalat.ae',
      averageSalaryBonus: '40%',
      openPositions: 67
    },
    {
      company: 'ADNOC',
      industry: 'Oil & Gas',
      logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop',
      valuedCertifications: [
        { name: 'PMP', importance: 'Critical', hiringWeight: 85 },
        { name: 'Six Sigma Black Belt', importance: 'High', hiringWeight: 75 },
        { name: 'API Certifications', importance: 'High', hiringWeight: 80 }
      ],
      hrContact: 'careers@adnoc.ae',
      averageSalaryBonus: '45%',
      openPositions: 123
    },
    {
      company: 'Dubai Municipality',
      industry: 'Government',
      logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop',
      valuedCertifications: [
        { name: 'PMP', importance: 'Critical', hiringWeight: 80 },
        { name: 'LEED Green Associate', importance: 'High', hiringWeight: 70 },
        { name: 'ITIL Foundation', importance: 'Moderate', hiringWeight: 60 }
      ],
      hrContact: 'hr@dm.gov.ae',
      averageSalaryBonus: '25%',
      openPositions: 34
    }
  ];

  const certificationStats = [
    {
      certification: 'AWS Solutions Architect',
      recognizingEmployers: 156,
      averageWeight: 78,
      industryDemand: 'Very High',
      salaryImpact: '+42%'
    },
    {
      certification: 'PMP',
      recognizingEmployers: 234,
      averageWeight: 82,
      industryDemand: 'High',
      salaryImpact: '+38%'
    },
    {
      certification: 'CFA Level 1',
      recognizingEmployers: 89,
      averageWeight: 85,
      industryDemand: 'High',
      salaryImpact: '+45%'
    },
    {
      certification: 'CISSP',
      recognizingEmployers: 145,
      averageWeight: 88,
      industryDemand: 'Very High',
      salaryImpact: '+50%'
    }
  ];

  const filteredEmployers = employerData.filter(employer => {
    const matchesIndustry = selectedIndustry === 'all' || employer.industry === selectedIndustry;
    const matchesSearch = employer.company.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesIndustry && matchesSearch;
  });

  const getImportanceColor = (importance: string) => {
    const colors: Record<string, string> = {
      Critical: 'bg-red-100 text-red-800',
      High: 'bg-orange-100 text-orange-800',
      Moderate: 'bg-yellow-100 text-yellow-800'
    };
    return colors[importance] || 'bg-gray-100 text-gray-800';
  };

  const getDemandColor = (demand: string) => {
    const colors: Record<string, string> = {
      'Very High': 'bg-green-100 text-green-800',
      'High': 'bg-blue-100 text-blue-800',
      'Moderate': 'bg-yellow-100 text-yellow-800'
    };
    return colors[demand] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Employer Recognition</h2>
          <p className="text-muted-foreground">Discover which UAE employers value specific certifications</p>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search Companies</label>
              <Input
                placeholder="Search by company name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Industry</label>
              <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  <SelectItem value="Banking & Finance">Banking & Finance</SelectItem>
                  <SelectItem value="Telecommunications">Telecommunications</SelectItem>
                  <SelectItem value="Oil & Gas">Oil & Gas</SelectItem>
                  <SelectItem value="Government">Government</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full bg-slate-800 hover:bg-slate-700">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certification Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Certification Recognition Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {certificationStats.map((stat, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">{stat.certification}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Employers:</span>
                    <span className="font-medium">{stat.recognizingEmployers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Weight:</span>
                    <span className="font-medium">{stat.averageWeight}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Demand:</span>
                    <Badge className={getDemandColor(stat.industryDemand)}>
                      {stat.industryDemand}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Salary Impact:</span>
                    <span className="text-green-600 font-medium">{stat.salaryImpact}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Employer Details */}
      <div className="space-y-6">
        {filteredEmployers.map((employer, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Building className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{employer.company}</h3>
                    <p className="text-muted-foreground mb-2">{employer.industry}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {employer.openPositions} open positions
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        {employer.averageSalaryBonus} avg salary boost
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  <h4 className="font-medium mb-3">Valued Certifications</h4>
                  <div className="space-y-3">
                    {employer.valuedCertifications.map((cert, certIndex) => (
                      <div key={certIndex} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Award className="h-4 w-4 text-slate-600" />
                          <span className="font-medium">{cert.name}</span>
                          <Badge className={getImportanceColor(cert.importance)}>
                            {cert.importance}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Hiring Weight:</span>
                          <span className="font-medium">{cert.hiringWeight}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 lg:w-48">
                  <Button className="w-full bg-slate-800 hover:bg-slate-700">
                    View Jobs
                  </Button>
                  <Button variant="outline" className="w-full">
                    Contact HR
                  </Button>
                  <Button variant="outline" className="w-full">
                    Company Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Industry Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Industry Certification Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-800 mb-2">750+</div>
              <div className="text-muted-foreground">UAE Companies</div>
              <div className="text-sm text-muted-foreground">Recognize certifications</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-800 mb-2">42%</div>
              <div className="text-muted-foreground">Average Salary Increase</div>
              <div className="text-sm text-muted-foreground">With relevant certifications</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-800 mb-2">89%</div>
              <div className="text-muted-foreground">Hiring Preference</div>
              <div className="text-sm text-muted-foreground">For certified candidates</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
