
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Award, ExternalLink, Calendar, Users, DollarSign, Search } from 'lucide-react';

export const ScholarshipHub: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');

  const scholarships = [
    {
      id: '1',
      title: 'Mohammed bin Rashid Al Maktoum Scholarship',
      provider: 'UAE Government',
      type: 'Full Funding',
      level: 'Undergraduate & Graduate',
      amount: 'Full tuition + living expenses',
      deadline: 'March 31, 2025',
      eligibility: ['UAE National', 'GPA 3.5+', 'Leadership Experience'],
      description: 'Comprehensive scholarship for outstanding Emirati students pursuing higher education globally.',
      success_stories: 12,
      available_spots: 50,
      fields: ['All fields'],
      application_link: '#'
    },
    {
      id: '2',
      title: 'ADEK Excellence Scholarship',
      provider: 'Abu Dhabi Department of Education',
      type: 'Partial Funding',
      level: 'Undergraduate',
      amount: 'Up to AED 200,000',
      deadline: 'April 15, 2025',
      eligibility: ['Abu Dhabi Resident', 'Academic Excellence', 'Community Service'],
      description: 'Supporting top students from Abu Dhabi in pursuing undergraduate degrees.',
      success_stories: 8,
      available_spots: 100,
      fields: ['STEM', 'Medicine', 'Engineering'],
      application_link: '#'
    },
    {
      id: '3',
      title: 'Fulbright UAE Scholarship',
      provider: 'US-UAE Partnership',
      type: 'Full Funding',
      level: 'Graduate',
      amount: 'Full tuition + stipend',
      deadline: 'May 1, 2025',
      eligibility: ['UAE National', 'Bachelor Degree', 'English Proficiency'],
      description: 'Prestigious scholarship for graduate studies in the United States.',
      success_stories: 25,
      available_spots: 15,
      fields: ['All fields'],
      application_link: '#'
    },
    {
      id: '4',
      title: 'GEMS Education Foundation',
      provider: 'GEMS Education',
      type: 'Merit-based',
      level: 'Undergraduate',
      amount: 'AED 50,000 - 150,000',
      deadline: 'February 28, 2025',
      eligibility: ['Financial Need', 'Academic Merit', 'UAE Resident'],
      description: 'Supporting deserving students with financial assistance for university education.',
      success_stories: 15,
      available_spots: 75,
      fields: ['Business', 'Technology', 'Healthcare'],
      application_link: '#'
    }
  ];

  const successStories = [
    {
      id: '1',
      name: 'Fatima Al-Zahra',
      scholarship: 'Mohammed bin Rashid Al Maktoum Scholarship',
      university: 'MIT',
      degree: 'Computer Science',
      year: '2023',
      achievement: 'Founded a successful AI startup',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face'
    },
    {
      id: '2',
      name: 'Ahmed Al-Mansouri',
      scholarship: 'Fulbright UAE Scholarship',
      university: 'Harvard Business School',
      degree: 'MBA',
      year: '2022',
      achievement: 'VP of Strategy at major UAE bank',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
    },
    {
      id: '3',
      name: 'Mariam Al-Khouri',
      scholarship: 'ADEK Excellence Scholarship',
      university: 'Cambridge University',
      degree: 'Medicine',
      year: '2021',
      achievement: 'Leading pediatric researcher',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face'
    }
  ];

  const filteredScholarships = scholarships.filter(scholarship => {
    const matchesSearch = scholarship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scholarship.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || scholarship.type === selectedType;
    const matchesLevel = selectedLevel === 'all' || scholarship.level.includes(selectedLevel);
    return matchesSearch && matchesType && matchesLevel;
  });

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Full Funding': 'bg-green-100 text-green-800',
      'Partial Funding': 'bg-blue-100 text-blue-800',
      'Merit-based': 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Award className="h-12 w-12 text-yellow-600" />
            <div>
              <h2 className="text-2xl font-bold text-yellow-800 mb-2">Scholarship Hub</h2>
              <p className="text-yellow-700">Discover funding opportunities for your education journey</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search scholarships..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ps-10"
                />
              </div>
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="md:w-48">
                <SelectValue placeholder="Funding Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Full Funding">Full Funding</SelectItem>
                <SelectItem value="Partial Funding">Partial Funding</SelectItem>
                <SelectItem value="Merit-based">Merit-based</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="md:w-48">
                <SelectValue placeholder="Education Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                <SelectItem value="Graduate">Graduate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Scholarships List */}
      <div className="grid lg:grid-cols-2 gap-6">
        {filteredScholarships.map((scholarship) => (
          <Card key={scholarship.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{scholarship.title}</CardTitle>
                  <p className="text-muted-foreground">{scholarship.provider}</p>
                </div>
                <Badge className={getTypeColor(scholarship.type)}>
                  {scholarship.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{scholarship.description}</p>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    Amount:
                  </span>
                  <span className="font-medium">{scholarship.amount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    Deadline:
                  </span>
                  <span className="font-medium">{scholarship.deadline}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-purple-600" />
                    Available Spots:
                  </span>
                  <span className="font-medium">{scholarship.available_spots}</span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium mb-2 text-sm">Eligibility Requirements</h4>
                <ul className="space-y-1">
                  {scholarship.eligibility.map((req, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      • {req}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-medium mb-2 text-sm">Eligible Fields</h4>
                <div className="flex flex-wrap gap-1">
                  {scholarship.fields.map((field, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">
                  {scholarship.success_stories} success stories
                </span>
                <Button size="sm" variant="outline">
                  View Stories
                </Button>
              </div>

              <Button className="w-full bg-yellow-600 hover:bg-yellow-700">
                <ExternalLink className="h-4 w-4 me-2" />
                Apply Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Success Stories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Success Stories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {successStories.map((story) => (
              <div key={story.id} className="text-center">
                <img
                  src={story.image}
                  alt={story.name}
                  className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                />
                <h4 className="font-semibold mb-1">{story.name}</h4>
                <p className="text-sm text-muted-foreground mb-2">{story.degree} • {story.university}</p>
                <Badge variant="outline" className="mb-2 text-xs">
                  {story.scholarship}
                </Badge>
                <p className="text-sm text-blue-600">{story.achievement}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Application Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Application Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Before You Apply</h4>
              <ul className="space-y-2 text-sm">
                <li>• Research scholarship requirements thoroughly</li>
                <li>• Start preparing documents early</li>
                <li>• Get transcripts and certificates attested</li>
                <li>• Request recommendation letters in advance</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Application Best Practices</h4>
              <ul className="space-y-2 text-sm">
                <li>• Write compelling personal statements</li>
                <li>• Highlight leadership and community service</li>
                <li>• Demonstrate financial need if applicable</li>
                <li>• Submit applications before deadlines</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
