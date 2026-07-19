
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BookOpen, 
  Video, 
  FileText, 
  Download, 
  ExternalLink,
  Search,
  Filter,
  Clock,
  Users
} from 'lucide-react';

interface MentorshipResource {
  id: string;
  title: string;
  description: string;
  type: 'guide' | 'video' | 'template' | 'article';
  category: 'getting-started' | 'communication' | 'goal-setting' | 'feedback' | 'career-development';
  duration?: string;
  downloadUrl?: string;
  externalUrl?: string;
  tags: string[];
  popularity: number;
}

const mockResources: MentorshipResource[] = [
  {
    id: '1',
    title: 'Mentorship Best Practices Guide',
    description: 'Comprehensive guide covering effective mentorship strategies, communication techniques, and relationship building.',
    type: 'guide',
    category: 'getting-started',
    downloadUrl: '#',
    tags: ['Best Practices', 'Communication', 'Relationship Building'],
    popularity: 95
  },
  {
    id: '2',
    title: 'Setting SMART Goals in Mentorship',
    description: 'Learn how to establish clear, measurable objectives for mentorship relationships.',
    type: 'video',
    category: 'goal-setting',
    duration: '15 min',
    externalUrl: '#',
    tags: ['Goal Setting', 'SMART Goals', 'Planning'],
    popularity: 88
  },
  {
    id: '3',
    title: 'Monthly Check-in Template',
    description: 'Structured template for conducting regular mentorship progress reviews.',
    type: 'template',
    category: 'feedback',
    downloadUrl: '#',
    tags: ['Templates', 'Progress Tracking', 'Check-ins'],
    popularity: 92
  },
  {
    id: '4',
    title: 'Career Development Roadmap',
    description: 'Framework for creating personalized career development plans within mentorship relationships.',
    type: 'article',
    category: 'career-development',
    externalUrl: '#',
    tags: ['Career Planning', 'Professional Growth', 'Roadmap'],
    popularity: 87
  }
];

export const MentorshipResourcesTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filteredResources = mockResources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesType = selectedType === 'all' || resource.type === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'guide':
        return <BookOpen className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'template':
        return <FileText className="h-4 w-4" />;
      case 'article':
        return <FileText className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'guide':
        return 'bg-[rgb(var(--pg-primary))] text-white';
      case 'video':
        return 'bg-[rgb(var(--pg-secondary))] text-white';
      case 'template':
        return 'bg-[rgb(var(--pg-accent))] text-white';
      case 'article':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const handleResourceAction = (resource: MentorshipResource) => {
    if (resource.downloadUrl) {
      console.log('Downloading resource:', resource.title);
      // TODO: Implement download functionality
    } else if (resource.externalUrl) {
      console.log('Opening external resource:', resource.title);
      // TODO: Implement external link functionality
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[rgb(var(--pg-primary))]" />
            Mentorship Resources
          </CardTitle>
          <CardDescription>
            Access guides, templates, and tools to enhance your mentorship experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ps-10 focus:border-[rgb(var(--pg-primary))] focus:ring-[rgb(var(--pg-primary))]"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="focus:border-[rgb(var(--pg-primary))] focus:ring-[rgb(var(--pg-primary))]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="getting-started">Getting Started</SelectItem>
                <SelectItem value="communication">Communication</SelectItem>
                <SelectItem value="goal-setting">Goal Setting</SelectItem>
                <SelectItem value="feedback">Feedback</SelectItem>
                <SelectItem value="career-development">Career Development</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="focus:border-[rgb(var(--pg-primary))] focus:ring-[rgb(var(--pg-primary))]">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="guide">Guides</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="template">Templates</SelectItem>
                <SelectItem value="article">Articles</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource) => (
          <Card key={resource.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${getTypeColor(resource.type)}`}>
                    {getTypeIcon(resource.type)}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {resource.type}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>{resource.popularity}%</span>
                </div>
              </div>
              <CardTitle className="text-lg">{resource.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {resource.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {resource.duration && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{resource.duration}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-1">
                {resource.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <Button 
                onClick={() => handleResourceAction(resource)}
                className="w-full bg-[rgb(var(--pg-primary))] hover:bg-[rgb(var(--pg-primary))/90]"
              >
                {resource.downloadUrl ? (
                  <>
                    <Download className="h-4 w-4 me-2" />
                    Download
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 me-2" />
                    View
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No resources found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or filters to find more resources.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
