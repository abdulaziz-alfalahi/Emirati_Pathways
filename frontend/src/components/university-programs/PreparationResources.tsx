
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Video, FileText, Headphones, ExternalLink, Download } from 'lucide-react';

export const PreparationResources: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('test-prep');

  const testPrepResources = [
    {
      id: '1',
      title: 'SAT Practice Tests',
      type: 'Practice Material',
      format: 'PDF + Online',
      description: 'Official College Board SAT practice tests with detailed explanations',
      duration: 'Self-paced',
      level: 'All levels',
      downloads: 1250,
      rating: 4.8
    },
    {
      id: '2',
      title: 'IELTS Academic Preparation Course',
      type: 'Video Course',
      format: 'Video + Audio',
      description: 'Comprehensive IELTS preparation covering all four skills',
      duration: '20 hours',
      level: 'Intermediate to Advanced',
      downloads: 890,
      rating: 4.9
    },
    {
      id: '3',
      title: 'TOEFL Speaking Practice',
      type: 'Interactive Tool',
      format: 'Online Platform',
      description: 'AI-powered speaking practice with real-time feedback',
      duration: 'Unlimited',
      level: 'All levels',
      downloads: 654,
      rating: 4.7
    }
  ];

  const essayGuides = [
    {
      id: '1',
      title: 'Personal Statement Writing Masterclass',
      type: 'Video Guide',
      format: 'Video + Workbook',
      description: 'Step-by-step guide to writing compelling personal statements',
      duration: '3 hours',
      level: 'Beginner to Advanced',
      downloads: 2100,
      rating: 4.9
    },
    {
      id: '2',
      title: 'Common Application Essay Prompts',
      type: 'Writing Guide',
      format: 'PDF + Examples',
      description: 'Analysis of Common App prompts with successful essay examples',
      duration: 'Self-study',
      level: 'All levels',
      downloads: 1800,
      rating: 4.6
    },
    {
      id: '3',
      title: 'Scholarship Essay Templates',
      type: 'Template Pack',
      format: 'Word + PDF',
      description: 'Professional templates for scholarship application essays',
      duration: 'Quick reference',
      level: 'All levels',
      downloads: 950,
      rating: 4.4
    }
  ];

  const interviewPrep = [
    {
      id: '1',
      title: 'University Interview Simulation',
      type: 'Interactive Tool',
      format: 'Online Platform',
      description: 'Practice interviews with AI feedback and common questions',
      duration: 'Unlimited practice',
      level: 'All levels',
      downloads: 756,
      rating: 4.8
    },
    {
      id: '2',
      title: 'Interview Skills Workshop',
      type: 'Workshop Recording',
      format: 'Video + Slides',
      description: 'Professional workshop on interview techniques and strategies',
      duration: '90 minutes',
      level: 'Beginner to Intermediate',
      downloads: 432,
      rating: 4.7
    }
  ];

  const virtualTours = [
    {
      id: '1',
      title: 'Harvard University Virtual Tour',
      type: 'Virtual Reality',
      format: '360° Video',
      description: 'Immersive campus tour with student guides and facilities overview',
      duration: '45 minutes',
      university: 'Harvard University',
      featured: true
    },
    {
      id: '2',
      title: 'MIT Campus Experience',
      type: 'Interactive Tour',
      format: 'Web-based',
      description: 'Interactive campus map with lab visits and student testimonials',
      duration: '30 minutes',
      university: 'MIT',
      featured: true
    },
    {
      id: '3',
      title: 'Cambridge University Tour',
      type: 'Virtual Tour',
      format: 'Video + Audio',
      description: 'Historic college tours with academic department visits',
      duration: '60 minutes',
      university: 'University of Cambridge',
      featured: false
    }
  ];

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'Video Course':
      case 'Video Guide':
      case 'Workshop Recording':
        return <Video className="h-4 w-4" />;
      case 'Practice Material':
      case 'Writing Guide':
      case 'Template Pack':
        return <FileText className="h-4 w-4" />;
      case 'Interactive Tool':
      case 'Online Platform':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-blue-600 mb-2">University Preparation Resources</h2>
            <p className="text-muted-foreground">Everything you need to prepare for university applications and admissions</p>
          </div>
        </CardContent>
      </Card>

      {/* Resource Categories */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="test-prep">Test Prep</TabsTrigger>
          <TabsTrigger value="essays">Essay Writing</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
          <TabsTrigger value="tours">Virtual Tours</TabsTrigger>
        </TabsList>

        <TabsContent value="test-prep" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testPrepResources.map((resource) => (
              <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{resource.title}</CardTitle>
                      <Badge variant="outline" className="mt-2">
                        {getResourceIcon(resource.type)}
                        <span className="ml-1">{resource.type}</span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{resource.description}</p>
                  
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span>Format:</span>
                      <span className="font-medium">{resource.format}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-medium">{resource.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Level:</span>
                      <span className="font-medium">{resource.level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Downloads:</span>
                      <span className="font-medium">{resource.downloads.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm">
                      <span className="text-yellow-500">★</span>
                      <span className="font-medium ml-1">{resource.rating}</span>
                    </div>
                  </div>

                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <Download className="h-4 w-4 mr-2" />
                    Access Resource
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="essays" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {essayGuides.map((resource) => (
              <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{resource.title}</CardTitle>
                      <Badge variant="outline" className="mt-2">
                        {getResourceIcon(resource.type)}
                        <span className="ml-1">{resource.type}</span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{resource.description}</p>
                  
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span>Format:</span>
                      <span className="font-medium">{resource.format}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-medium">{resource.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Downloads:</span>
                      <span className="font-medium">{resource.downloads.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm">
                      <span className="text-yellow-500">★</span>
                      <span className="font-medium ml-1">{resource.rating}</span>
                    </div>
                  </div>

                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <Download className="h-4 w-4 mr-2" />
                    Download Guide
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="interviews" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {interviewPrep.map((resource) => (
              <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{resource.title}</CardTitle>
                      <Badge variant="outline" className="mt-2">
                        {getResourceIcon(resource.type)}
                        <span className="ml-1">{resource.type}</span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{resource.description}</p>
                  
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span>Format:</span>
                      <span className="font-medium">{resource.format}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-medium">{resource.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Downloads:</span>
                      <span className="font-medium">{resource.downloads.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm">
                      <span className="text-yellow-500">★</span>
                      <span className="font-medium ml-1">{resource.rating}</span>
                    </div>
                  </div>

                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Start Practice
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tours" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {virtualTours.map((tour) => (
              <Card key={tour.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{tour.title}</CardTitle>
                      <p className="text-muted-foreground text-sm">{tour.university}</p>
                      {tour.featured && (
                        <Badge className="mt-2 bg-yellow-100 text-yellow-800">Featured</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{tour.description}</p>
                  
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="font-medium">{tour.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Format:</span>
                      <span className="font-medium">{tour.format}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-medium">{tour.duration}</span>
                    </div>
                  </div>

                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <Video className="h-4 w-4 mr-2" />
                    Start Tour
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Access */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <span className="font-medium">Document Checklist</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
              <Video className="h-6 w-6 text-blue-600" />
              <span className="font-medium">Webinar Library</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
              <Headphones className="h-6 w-6 text-blue-600" />
              <span className="font-medium">Podcast Series</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <span className="font-medium">Study Guides</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
