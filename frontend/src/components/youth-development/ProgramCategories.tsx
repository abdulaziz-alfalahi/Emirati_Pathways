import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown, Lightbulb, Palette, Heart, Users, Search, MapPin, Clock } from 'lucide-react';
import { YouthProgramsList } from './YouthProgramsList';

export const ProgramCategories: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { 
      id: 'leadership', 
      name: 'Leadership & Civic Engagement', 
      icon: Crown, 
      color: 'bg-purple-100 text-purple-800',
      description: 'Develop leadership skills and civic responsibility'
    },
    { 
      id: 'innovation', 
      name: 'Innovation & Entrepreneurship', 
      icon: Lightbulb, 
      color: 'bg-blue-100 text-blue-800',
      description: 'Foster creativity and business acumen'
    },
    { 
      id: 'arts', 
      name: 'Arts & Cultural Heritage', 
      icon: Palette, 
      color: 'bg-green-100 text-green-800',
      description: 'Explore Emirati culture and artistic expression'
    },
    { 
      id: 'wellness', 
      name: 'Sports & Wellness', 
      icon: Heart, 
      color: 'bg-red-100 text-red-800',
      description: 'Promote physical and mental wellbeing'
    },
    { 
      id: 'community', 
      name: 'Volunteering & Community Service', 
      icon: Users, 
      color: 'bg-orange-100 text-orange-800',
      description: 'Give back and make a positive impact'
    }
  ];

  const programs = [
    {
      id: '1',
      title: 'Young Leaders Council',
      category: 'leadership',
      description: 'Develop leadership skills through real government projects and community initiatives.',
      duration: '6 months',
      location: 'Dubai, UAE',
      ageRange: '16-21',
      spots: 25,
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=250&fit=crop'
    },
    {
      id: '2',
      title: 'Tech Innovation Lab',
      category: 'innovation',
      description: 'Build cutting-edge tech solutions for real-world problems using AI and emerging technologies.',
      duration: '4 months',
      location: 'Abu Dhabi, UAE',
      ageRange: '15-21',
      spots: 30,
      image: 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=400&h=250&fit=crop'
    },
    {
      id: '3',
      title: 'Traditional Arts Mastery',
      category: 'arts',
      description: 'Learn traditional Emirati arts including calligraphy, pottery, and textile weaving.',
      duration: '3 months',
      location: 'Sharjah, UAE',
      ageRange: '13-18',
      spots: 20,
      image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=250&fit=crop'
    },
    {
      id: '4',
      title: 'Athletic Excellence Program',
      category: 'wellness',
      description: 'Professional sports training with nutrition and mental wellness coaching.',
      duration: '8 months',
      location: 'Various UAE locations',
      ageRange: '14-21',
      spots: 40,
      image: 'https://images.unsplash.com/photo-1500673922987-e212871fec22?w=400&h=250&fit=crop'
    },
    {
      id: '5',
      title: 'Community Impact Initiative',
      category: 'community',
      description: 'Lead community service projects that address local social and environmental challenges.',
      duration: '5 months',
      location: 'All Emirates',
      ageRange: '15-21',
      spots: 35,
      image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=250&fit=crop'
    }
  ];

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || program.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <Tabs defaultValue="featured" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="featured">Featured Programs</TabsTrigger>
          <TabsTrigger value="all-programs">All Programs</TabsTrigger>
        </TabsList>

        <TabsContent value="featured" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search programs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="md:w-64">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Category Overview */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Card key={category.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className={`inline-flex p-4 rounded-full ${category.color} mb-4`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{category.description}</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className="border-ehrdc-teal text-ehrdc-teal hover:bg-ehrdc-teal hover:text-white"
                    >
                      Explore Programs
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Featured Programs Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrograms.map((program) => {
              const category = categories.find(cat => cat.id === program.category);
              return (
                <Card key={program.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={program.image}
                      alt={program.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className={category?.color}>{category?.name}</Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-2">{program.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{program.description}</p>
                    
                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-ehrdc-teal" />
                        <span>{program.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-ehrdc-teal" />
                        <span>{program.location}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Ages {program.ageRange}</span>
                        <span className="text-muted-foreground">{program.spots} spots available</span>
                      </div>
                    </div>
                    
                    <Button className="w-full ehrdc-button-primary">
                      Learn More & Apply
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredPrograms.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No programs found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all-programs">
          <YouthProgramsList />
        </TabsContent>
      </Tabs>
    </div>
  );
};
