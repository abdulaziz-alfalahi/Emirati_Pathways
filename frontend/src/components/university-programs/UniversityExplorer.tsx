
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Star, Award, Users, Globe, Filter } from 'lucide-react';

export const UniversityExplorer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedField, setSelectedField] = useState('all');
  const [selectedView, setSelectedView] = useState<'map' | 'grid'>('grid');
  const [compareList, setCompareList] = useState<string[]>([]);

  const universities = [
    {
      id: '1',
      name: 'American University of Sharjah',
      location: 'Sharjah, UAE',
      type: 'Local',
      ranking: 'Top 500 Global',
      programs: 26,
      scholarships: true,
      image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&h=250&fit=crop',
      description: 'Leading American-style university in the region',
      acceptance_rate: '75%',
      tuition: 'AED 75,000/year'
    },
    {
      id: '2',
      name: 'University of Cambridge',
      location: 'Cambridge, UK',
      type: 'International',
      ranking: 'Top 10 Global',
      programs: 150,
      scholarships: true,
      image: 'https://images.unsplash.com/photo-1520637836862-4d197d17c648?w=400&h=250&fit=crop',
      description: 'World-renowned research university',
      acceptance_rate: '21%',
      tuition: '£22,227/year'
    },
    {
      id: '3',
      name: 'MIT',
      location: 'Massachusetts, USA',
      type: 'International',
      ranking: 'Top 5 Global',
      programs: 45,
      scholarships: true,
      image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=250&fit=crop',
      description: 'Leading technology and research institution',
      acceptance_rate: '7%',
      tuition: '$55,450/year'
    },
    {
      id: '4',
      name: 'UAE University',
      location: 'Al Ain, UAE',
      type: 'Local',
      ranking: 'Top 500 Global',
      programs: 58,
      scholarships: true,
      image: 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=400&h=250&fit=crop',
      description: 'Premier national university of the UAE',
      acceptance_rate: '65%',
      tuition: 'AED 45,000/year'
    }
  ];

  const toggleCompare = (universityId: string) => {
    if (compareList.includes(universityId)) {
      setCompareList(compareList.filter(id => id !== universityId));
    } else if (compareList.length < 3) {
      setCompareList([...compareList, universityId]);
    }
  };

  const filteredUniversities = universities.filter(uni => {
    const matchesSearch = uni.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = selectedLocation === 'all' || 
      (selectedLocation === 'local' && uni.type === 'Local') ||
      (selectedLocation === 'international' && uni.type === 'International');
    const matchesField = selectedField === 'all'; // Add field filtering logic
    return matchesSearch && matchesLocation && matchesField;
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-blue-600 mb-2">University Explorer</h2>
              <p className="text-muted-foreground">Discover universities and compare your options</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedView === 'map' ? 'default' : 'outline'}
                onClick={() => setSelectedView('map')}
                className={selectedView === 'map' ? 'bg-blue-600' : ''}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Map View
              </Button>
              <Button
                variant={selectedView === 'grid' ? 'default' : 'outline'}
                onClick={() => setSelectedView('grid')}
                className={selectedView === 'grid' ? 'bg-blue-600' : ''}
              >
                <Filter className="h-4 w-4 mr-2" />
                Grid View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search universities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="md:w-48">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="local">UAE Universities</SelectItem>
                <SelectItem value="international">International</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedField} onValueChange={setSelectedField}>
              <SelectTrigger className="md:w-48">
                <SelectValue placeholder="Field of Study" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fields</SelectItem>
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="medicine">Medicine</SelectItem>
                <SelectItem value="arts">Arts & Humanities</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Compare Bar */}
      {compareList.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-medium">Compare ({compareList.length}/3):</span>
                <div className="flex gap-2">
                  {compareList.map(id => {
                    const uni = universities.find(u => u.id === id);
                    return uni ? (
                      <Badge key={id} variant="secondary">
                        {uni.name}
                        <button
                          onClick={() => toggleCompare(id)}
                          className="ml-2 hover:text-red-600"
                        >
                          ×
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Compare Universities
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Universities Display */}
      <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as 'map' | 'grid')}>
        <TabsContent value="map">
          <Card>
            <CardContent className="p-6">
              <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Interactive map coming soon</p>
                  <p className="text-sm text-gray-500">University locations will be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grid">
          <div className="grid md:grid-cols-2 gap-6">
            {filteredUniversities.map((university) => (
              <Card key={university.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={university.image}
                    alt={university.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge className={university.type === 'Local' ? 'bg-green-600' : 'bg-blue-600'}>
                      {university.type}
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    {university.scholarships && (
                      <Badge className="bg-yellow-600">
                        <Award className="h-3 w-3 mr-1" />
                        Scholarships
                      </Badge>
                    )}
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{university.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{university.description}</p>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        {university.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        {university.ranking}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-blue-600" />
                        {university.programs} Programs
                      </span>
                      <span className="text-muted-foreground">
                        Acceptance: {university.acceptance_rate}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Tuition: </span>
                      <span className="text-blue-600">{university.tuition}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleCompare(university.id)}
                      disabled={!compareList.includes(university.id) && compareList.length >= 3}
                      className={compareList.includes(university.id) ? 'bg-blue-50 border-blue-200' : ''}
                    >
                      {compareList.includes(university.id) ? 'Remove' : 'Compare'}
                    </Button>
                    <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
