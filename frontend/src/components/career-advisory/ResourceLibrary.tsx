
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BookOpen, 
  TrendingUp, 
  Award, 
  Users, 
  Search,
  Filter,
  ExternalLink,
  Clock,
  Star
} from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: 'article' | 'guide' | 'case-study' | 'trend-report' | 'workshop';
  industry: string;
  readTime: number;
  rating: number;
  downloads: number;
  url: string;
  featured: boolean;
  tags: string[];
  publishedDate: string;
}

const ResourceLibrary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedIndustry, setSelectedIndustry] = useState('all');

  // Mock data - would be fetched from API
  const resources: Resource[] = [
    {
      id: '1',
      title: 'Digital Transformation in UAE Banking',
      description: 'Comprehensive guide on how the UAE banking sector is evolving with digital technologies and the career opportunities it creates.',
      category: 'guide',
      industry: 'Financial Services',
      readTime: 15,
      rating: 4.8,
      downloads: 1250,
      url: '#',
      featured: true,
      tags: ['Digital Transformation', 'Banking', 'Career Growth'],
      publishedDate: '2024-01-15'
    },
    {
      id: '2',
      title: 'Success Story: From Graduate to Tech Lead',
      description: 'Follow the journey of a UAE university graduate who became a technology leader at a major fintech company.',
      category: 'case-study',
      industry: 'Technology',
      readTime: 8,
      rating: 4.9,
      downloads: 890,
      url: '#',
      featured: true,
      tags: ['Success Story', 'Technology', 'Leadership'],
      publishedDate: '2024-01-20'
    },
    {
      id: '3',
      title: 'Healthcare Innovation Trends 2024',
      description: 'Latest trends in healthcare innovation and emerging career opportunities in the UAE healthcare sector.',
      category: 'trend-report',
      industry: 'Healthcare',
      readTime: 12,
      rating: 4.7,
      downloads: 675,
      url: '#',
      featured: false,
      tags: ['Healthcare', 'Innovation', 'Trends'],
      publishedDate: '2024-01-10'
    },
    {
      id: '4',
      title: 'Effective Networking Strategies',
      description: 'Best practices for building professional networks in the UAE business environment.',
      category: 'article',
      industry: 'General',
      readTime: 6,
      rating: 4.6,
      downloads: 1100,
      url: '#',
      featured: false,
      tags: ['Networking', 'Professional Development', 'Career Tips'],
      publishedDate: '2024-01-25'
    },
    {
      id: '5',
      title: 'Sustainability Careers Workshop',
      description: 'Interactive workshop on emerging careers in sustainability and renewable energy sectors.',
      category: 'workshop',
      industry: 'Energy',
      readTime: 45,
      rating: 4.9,
      downloads: 320,
      url: '#',
      featured: true,
      tags: ['Sustainability', 'Renewable Energy', 'Workshop'],
      publishedDate: '2024-01-30'
    }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'article': return <BookOpen className="h-4 w-4" />;
      case 'guide': return <BookOpen className="h-4 w-4" />;
      case 'case-study': return <Award className="h-4 w-4" />;
      case 'trend-report': return <TrendingUp className="h-4 w-4" />;
      case 'workshop': return <Users className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'article': return 'bg-blue-100 text-blue-800';
      case 'guide': return 'bg-green-100 text-green-800';
      case 'case-study': return 'bg-purple-100 text-purple-800';
      case 'trend-report': return 'bg-orange-100 text-orange-800';
      case 'workshop': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesIndustry = selectedIndustry === 'all' || resource.industry === selectedIndustry;
    
    return matchesSearch && matchesCategory && matchesIndustry;
  });

  const featuredResources = filteredResources.filter(resource => resource.featured);
  const regularResources = filteredResources.filter(resource => !resource.featured);

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Resource Library
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources, topics, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="article">Articles</SelectItem>
                <SelectItem value="guide">Guides</SelectItem>
                <SelectItem value="case-study">Case Studies</SelectItem>
                <SelectItem value="trend-report">Trend Reports</SelectItem>
                <SelectItem value="workshop">Workshops</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Industries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Financial Services">Financial Services</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Energy">Energy</SelectItem>
                <SelectItem value="General">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Featured Resources */}
      {featuredResources.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Featured Resources
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {featuredResources.map((resource) => (
              <Card key={resource.id} className="border-ehrdc-teal/20 shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(resource.category)}
                      <Badge variant="secondary" className={getCategoryColor(resource.category)}>
                        {resource.category.replace('-', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {resource.readTime}min
                    </div>
                  </div>
                  <CardTitle className="text-lg">{resource.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{resource.description}</p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {resource.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {resource.rating}
                      </div>
                      <span>{resource.downloads} downloads</span>
                    </div>
                    <Button size="sm" className="bg-ehrdc-teal hover:bg-ehrdc-dark-teal">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Resources */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          All Resources ({regularResources.length})
        </h3>
        <div className="grid gap-4">
          {regularResources.map((resource) => (
            <Card key={resource.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getCategoryIcon(resource.category)}
                      <Badge variant="secondary" className={getCategoryColor(resource.category)}>
                        {resource.category.replace('-', ' ')}
                      </Badge>
                      <Badge variant="outline">{resource.industry}</Badge>
                    </div>
                    <h4 className="font-semibold mb-2">{resource.title}</h4>
                    <p className="text-muted-foreground text-sm mb-3">{resource.description}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {resource.tags.slice(0, 4).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {resource.readTime}min
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {resource.rating}
                      </div>
                      <span>{resource.downloads} downloads</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {filteredResources.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Resources Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or filters to find relevant resources.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ResourceLibrary;
