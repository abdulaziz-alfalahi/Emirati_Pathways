
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Download, ExternalLink, FileText, Play, Search, Video, Headphones } from 'lucide-react';

export const ResourceLibrary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  const resources = [
    {
      id: '1',
      title: 'Leadership Skills for Young Emiratis',
      type: 'guide',
      category: 'leadership',
      description: 'Comprehensive guide to developing leadership skills in cultural context.',
      downloadUrl: '/resources/leadership-guide.pdf',
      readTime: '15 min',
      downloads: 1250,
      rating: 4.8
    },
    {
      id: '2',
      title: 'Introduction to Entrepreneurship',
      type: 'video',
      category: 'innovation',
      description: 'Video series covering basics of starting a business in the UAE.',
      videoUrl: 'https://example.com/entrepreneur-video',
      duration: '45 min',
      views: 3200,
      rating: 4.9
    },
    {
      id: '3',
      title: 'Traditional Arts Workshop Recording',
      type: 'video',
      category: 'cultural',
      description: 'Learn traditional Emirati calligraphy techniques step by step.',
      videoUrl: 'https://example.com/calligraphy-workshop',
      duration: '1h 20min',
      views: 890,
      rating: 4.7
    },
    {
      id: '4',
      title: 'Community Service Planning Toolkit',
      type: 'toolkit',
      category: 'community',
      description: 'Tools and templates for organizing community service projects.',
      downloadUrl: '/resources/community-toolkit.zip',
      fileSize: '5.2 MB',
      downloads: 650,
      rating: 4.6
    },
    {
      id: '5',
      title: 'Digital Innovation Podcast Series',
      type: 'audio',
      category: 'innovation',
      description: 'Interviews with young UAE innovators and tech entrepreneurs.',
      audioUrl: 'https://example.com/innovation-podcast',
      episodes: 12,
      totalDuration: '6 hours',
      rating: 4.8
    }
  ];

  const categories = [
    { value: 'leadership', label: 'Leadership' },
    { value: 'innovation', label: 'Innovation' },
    { value: 'cultural', label: 'Cultural Heritage' },
    { value: 'community', label: 'Community Service' },
    { value: 'skills', label: 'Life Skills' }
  ];

  const resourceTypes = [
    { value: 'guide', label: 'Guides & Articles' },
    { value: 'video', label: 'Videos' },
    { value: 'audio', label: 'Podcasts & Audio' },
    { value: 'toolkit', label: 'Toolkits & Templates' },
    { value: 'webinar', label: 'Webinars' }
  ];

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesType = selectedType === 'all' || resource.type === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-5 w-5" />;
      case 'audio': return <Headphones className="h-5 w-5" />;
      case 'guide': return <BookOpen className="h-5 w-5" />;
      case 'toolkit': return <FileText className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-red-100 text-red-800';
      case 'audio': return 'bg-purple-100 text-purple-800';
      case 'guide': return 'bg-blue-100 text-blue-800';
      case 'toolkit': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Resources</TabsTrigger>
          <TabsTrigger value="guides">Guides</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>
          <TabsTrigger value="toolkits">Toolkits</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search resources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="ps-10"
                  />
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="lg:w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="lg:w-48">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {resourceTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Resources Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((resource) => (
              <Card key={resource.id} className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 mb-2">
                      {getResourceIcon(resource.type)}
                      <Badge className={getTypeColor(resource.type)}>
                        {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{resource.title}</CardTitle>
                  <CardDescription className="line-clamp-3">{resource.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3 mb-4 text-sm text-muted-foreground">
                    {resource.readTime && (
                      <div>Read time: {resource.readTime}</div>
                    )}
                    {resource.duration && (
                      <div>Duration: {resource.duration}</div>
                    )}
                    {resource.fileSize && (
                      <div>File size: {resource.fileSize}</div>
                    )}
                    {resource.episodes && (
                      <div>{resource.episodes} episodes • {resource.totalDuration}</div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span>{resource.rating}</span>
                      </div>
                      <div>
                        {resource.downloads && `${resource.downloads} downloads`}
                        {resource.views && `${resource.views} views`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {resource.type === 'video' && (
                      <Button size="sm" className="flex-1">
                        <Play className="h-4 w-4 me-2" />
                        Watch
                      </Button>
                    )}
                    {resource.type === 'audio' && (
                      <Button size="sm" className="flex-1">
                        <Play className="h-4 w-4 me-2" />
                        Listen
                      </Button>
                    )}
                    {(resource.type === 'guide' || resource.type === 'toolkit') && (
                      <>
                        <Button size="sm" variant="outline" className="flex-1">
                          <ExternalLink className="h-4 w-4 me-2" />
                          View
                        </Button>
                        <Button size="sm" className="flex-1">
                          <Download className="h-4 w-4 me-2" />
                          Download
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredResources.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No resources found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Individual type tabs would filter the same resources by type */}
        <TabsContent value="guides">
          <div className="text-center p-8">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Guides & Articles</h3>
            <p className="text-muted-foreground">Comprehensive guides and articles for youth development</p>
          </div>
        </TabsContent>

        <TabsContent value="videos">
          <div className="text-center p-8">
            <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Video Resources</h3>
            <p className="text-muted-foreground">Educational videos and workshop recordings</p>
          </div>
        </TabsContent>

        <TabsContent value="audio">
          <div className="text-center p-8">
            <Headphones className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Audio Resources</h3>
            <p className="text-muted-foreground">Podcasts and audio content for learning on the go</p>
          </div>
        </TabsContent>

        <TabsContent value="toolkits">
          <div className="text-center p-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Toolkits & Templates</h3>
            <p className="text-muted-foreground">Practical tools and templates for youth programs</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
