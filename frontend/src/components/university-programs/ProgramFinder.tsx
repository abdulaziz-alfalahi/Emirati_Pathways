
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Clock, Globe, Award, Search, Filter } from 'lucide-react';

export const ProgramFinder: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedField, setSelectedField] = useState('all');
  const [selectedDuration, setSelectedDuration] = useState('all');

  const programs = [
    {
      id: '1',
      title: 'Computer Science (Bachelor)',
      university: 'American University of Sharjah',
      level: 'Undergraduate',
      field: 'Technology',
      duration: '4 years',
      language: 'English',
      admission_requirements: ['High School Diploma', 'SAT/ACT', 'English Proficiency'],
      career_outcomes: ['Software Engineer', 'Data Scientist', 'Product Manager'],
      tuition: 'AED 75,000/year',
      scholarships: true,
      exchange_available: true
    },
    {
      id: '2',
      title: 'MBA in Innovation Management',
      university: 'MIT Sloan',
      level: 'Graduate',
      field: 'Business',
      duration: '2 years',
      language: 'English',
      admission_requirements: ['Bachelor Degree', 'GMAT/GRE', 'Work Experience', 'English Proficiency'],
      career_outcomes: ['Innovation Manager', 'Strategy Consultant', 'Entrepreneur'],
      tuition: '$112,000/year',
      scholarships: true,
      exchange_available: false
    },
    {
      id: '3',
      title: 'Biomedical Engineering Research',
      university: 'University of Cambridge',
      level: 'Research',
      field: 'Engineering',
      duration: '3-4 years',
      language: 'English',
      admission_requirements: ['Master Degree', 'Research Proposal', 'English Proficiency'],
      career_outcomes: ['Research Scientist', 'Medical Device Engineer', 'Academic Professor'],
      tuition: '£22,227/year',
      scholarships: true,
      exchange_available: true
    },
    {
      id: '4',
      title: 'International Business Exchange',
      university: 'Multiple Universities',
      level: 'Exchange',
      field: 'Business',
      duration: '1 semester',
      language: 'Multiple',
      admission_requirements: ['Current Enrollment', 'GPA 3.0+', 'Language Proficiency'],
      career_outcomes: ['Global Perspective', 'Network Building', 'Cultural Intelligence'],
      tuition: 'Varies',
      scholarships: true,
      exchange_available: true
    }
  ];

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.university.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || program.level === selectedLevel;
    const matchesField = selectedField === 'all' || program.field === selectedField;
    const matchesDuration = selectedDuration === 'all' || 
      (selectedDuration === 'short' && program.duration.includes('semester')) ||
      (selectedDuration === 'medium' && (program.duration.includes('2') || program.duration.includes('3'))) ||
      (selectedDuration === 'long' && program.duration.includes('4'));
    return matchesSearch && matchesLevel && matchesField && matchesDuration;
  });

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      Undergraduate: 'bg-green-100 text-green-800',
      Graduate: 'bg-blue-100 text-blue-800',
      Research: 'bg-purple-100 text-purple-800',
      Exchange: 'bg-orange-100 text-orange-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-blue-600 mb-2">Program Finder</h2>
          <p className="text-muted-foreground">Discover academic programs that match your interests and goals</p>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search programs or universities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Program Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                <SelectItem value="Graduate">Graduate</SelectItem>
                <SelectItem value="Research">Research</SelectItem>
                <SelectItem value="Exchange">Exchange</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedField} onValueChange={setSelectedField}>
              <SelectTrigger>
                <SelectValue placeholder="Field of Study" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fields</SelectItem>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Business">Business</SelectItem>
                <SelectItem value="Engineering">Engineering</SelectItem>
                <SelectItem value="Medicine">Medicine</SelectItem>
                <SelectItem value="Arts">Arts & Humanities</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedDuration} onValueChange={setSelectedDuration}>
              <SelectTrigger>
                <SelectValue placeholder="Duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Durations</SelectItem>
                <SelectItem value="short">Short Term (1 semester)</SelectItem>
                <SelectItem value="medium">Medium (2-3 years)</SelectItem>
                <SelectItem value="long">Long Term (4+ years)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Programs List */}
      <div className="space-y-6">
        {filteredPrograms.map((program) => (
          <Card key={program.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{program.title}</h3>
                      <p className="text-muted-foreground">{program.university}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getLevelColor(program.level)}>{program.level}</Badge>
                      {program.scholarships && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Award className="h-3 w-3 mr-1" />
                          Scholarships
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium mb-2 text-sm">Program Details</h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {program.duration}
                        </div>
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {program.language}
                        </div>
                        <div>Field: {program.field}</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2 text-sm">Admission Requirements</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {program.admission_requirements.slice(0, 3).map((req, index) => (
                          <li key={index}>• {req}</li>
                        ))}
                        {program.admission_requirements.length > 3 && (
                          <li className="text-blue-600">+ {program.admission_requirements.length - 3} more</li>
                        )}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2 text-sm">Career Outcomes</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {program.career_outcomes.slice(0, 3).map((outcome, index) => (
                          <li key={index}>• {outcome}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-medium">Tuition: </span>
                      <span className="text-blue-600">{program.tuition}</span>
                    </div>
                    <div className="flex gap-2">
                      {program.exchange_available && (
                        <Badge variant="outline">Exchange Available</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 lg:w-48">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    View Program
                  </Button>
                  <Button variant="outline" className="w-full">
                    Save Program
                  </Button>
                  <Button variant="outline" className="w-full">
                    Apply Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPrograms.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No programs found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
