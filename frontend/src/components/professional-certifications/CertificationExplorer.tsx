
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Award, Clock, DollarSign, Star, BookOpen, Building } from 'lucide-react';

export const CertificationExplorer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [timeCommitment, setTimeCommitment] = useState([1, 52]);
  const [costRange, setCostRange] = useState([0, 10000]);

  const certifications = [
    {
      id: '1',
      title: 'AWS Solutions Architect - Associate',
      provider: 'Amazon Web Services',
      industry: 'IT',
      level: 'Intermediate',
      timeCommitment: '8-12 weeks',
      cost: 1500,
      currency: 'AED',
      employerRating: 4.8,
      description: 'Design and deploy scalable, highly available systems on AWS',
      prerequisites: ['Basic AWS knowledge', 'Cloud computing fundamentals'],
      averageSalaryIncrease: '35%',
      validityPeriod: '3 years',
      recognizedByEmployers: ['Emirates NBD', 'Etisalat', 'ADNOC', 'Mubadala']
    },
    {
      id: '2',
      title: 'CFA Level 1',
      provider: 'CFA Institute',
      industry: 'Finance',
      level: 'Advanced',
      timeCommitment: '24-36 weeks',
      cost: 5000,
      currency: 'AED',
      employerRating: 4.9,
      description: 'Foundational knowledge in investment analysis and portfolio management',
      prerequisites: ['Bachelor degree', 'Professional work experience'],
      averageSalaryIncrease: '45%',
      validityPeriod: 'Lifetime',
      recognizedByEmployers: ['ADIB', 'FAB', 'EIB', 'SHUAA Capital']
    },
    {
      id: '3',
      title: 'Project Management Professional (PMP)',
      provider: 'Project Management Institute',
      industry: 'Management',
      level: 'Advanced',
      timeCommitment: '16-20 weeks',
      cost: 3500,
      currency: 'AED',
      employerRating: 4.7,
      description: 'Global standard for project management excellence',
      prerequisites: ['Project management experience', 'Bachelor degree'],
      averageSalaryIncrease: '40%',
      validityPeriod: '3 years',
      recognizedByEmployers: ['Dubai Municipality', 'RTA', 'Emaar', 'DP World']
    }
  ];

  const filteredCertifications = certifications.filter(cert => {
    const matchesSearch = cert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = selectedIndustry === 'all' || cert.industry === selectedIndustry;
    const matchesLevel = selectedLevel === 'all' || cert.level === selectedLevel;
    const matchesCost = cert.cost >= costRange[0] && cert.cost <= costRange[1];
    return matchesSearch && matchesIndustry && matchesLevel && matchesCost;
  });

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      Beginner: 'bg-green-100 text-green-800',
      Intermediate: 'bg-yellow-100 text-yellow-800',
      Advanced: 'bg-red-100 text-red-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Certification Explorer</h2>
          <p className="text-muted-foreground">Discover industry-recognized certifications to advance your career</p>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search Certifications</label>
                <Input
                  placeholder="Search by name or provider..."
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
                    <SelectItem value="IT">Information Technology</SelectItem>
                    <SelectItem value="Finance">Finance & Banking</SelectItem>
                    <SelectItem value="Management">Project Management</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Difficulty Level</label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Cost Range (AED)</label>
                <div className="px-3">
                  <Slider
                    value={costRange}
                    onValueChange={setCostRange}
                    max={10000}
                    min={0}
                    step={500}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>AED {costRange[0]}</span>
                    <span>AED {costRange[1]}</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Time Commitment (weeks)</label>
                <div className="px-3">
                  <Slider
                    value={timeCommitment}
                    onValueChange={setTimeCommitment}
                    max={52}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>{timeCommitment[0]} weeks</span>
                    <span>{timeCommitment[1]} weeks</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certifications List */}
      <div className="space-y-6">
        {filteredCertifications.map((cert) => (
          <Card key={cert.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{cert.title}</h3>
                      <p className="text-muted-foreground mb-2">{cert.provider}</p>
                      <p className="text-sm text-muted-foreground">{cert.description}</p>
                    </div>
                    <div className="flex gap-2 flex-col">
                      <Badge className={getLevelColor(cert.level)}>{cert.level}</Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">{cert.employerRating}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium mb-2 text-sm">Certification Details</h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {cert.timeCommitment}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {cert.cost} {cert.currency}
                        </div>
                        <div>Validity: {cert.validityPeriod}</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2 text-sm">Prerequisites</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {cert.prerequisites.slice(0, 2).map((prereq, index) => (
                          <li key={index}>• {prereq}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2 text-sm">Career Impact</h4>
                      <div className="text-sm text-muted-foreground">
                        <div className="text-green-600 font-medium">
                          +{cert.averageSalaryIncrease} salary increase
                        </div>
                        <div className="mt-1">Industry: {cert.industry}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium mb-2 text-sm">Recognized by UAE Employers</h4>
                    <div className="flex flex-wrap gap-2">
                      {cert.recognizedByEmployers.slice(0, 4).map((employer, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <Building className="h-3 w-3 mr-1" />
                          {employer}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 lg:w-48">
                  <Button className="w-full bg-slate-800 hover:bg-slate-700">
                    View Details
                  </Button>
                  <Button variant="outline" className="w-full">
                    Add to Roadmap
                  </Button>
                  <Button variant="outline" className="w-full">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Study Materials
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCertifications.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No certifications found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
