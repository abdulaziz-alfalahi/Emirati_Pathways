import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Users, Star, Calendar, BookOpen } from 'lucide-react';

const ResourcesSection: React.FC = () => {
  const resources = [
    {
      id: '1',
      title: 'Parent\'s Guide to School Program Selection',
      description: 'Comprehensive guide helping parents choose the right educational programs for their children.',
      type: 'PDF Guide',
      category: 'Parents',
      downloadCount: 1240,
      rating: 4.9,
      fileSize: '2.3 MB',
      pages: 24,
      lastUpdated: '2024-01-15',
      icon: FileText,
      featured: true
    },
    {
      id: '2',
      title: 'Student Application Checklist',
      description: 'Step-by-step checklist to help students prepare successful program applications.',
      type: 'Interactive Checklist',
      category: 'Students',
      downloadCount: 890,
      rating: 4.8,
      fileSize: '1.1 MB',
      pages: 8,
      lastUpdated: '2024-01-10',
      icon: BookOpen,
      featured: false
    },
    {
      id: '3',
      title: 'Financial Aid and Scholarship Guide',
      description: 'Information about available financial assistance and scholarship opportunities.',
      type: 'Resource Bundle',
      category: 'Financial',
      downloadCount: 2100,
      rating: 4.9,
      fileSize: '4.7 MB',
      pages: 32,
      lastUpdated: '2024-01-20',
      icon: Users,
      featured: true
    },
    {
      id: '4',
      title: 'Program Calendar and Important Dates',
      description: 'Annual calendar with application deadlines, program start dates, and key events.',
      type: 'Calendar',
      category: 'Planning',
      downloadCount: 1560,
      rating: 4.7,
      fileSize: '0.8 MB',
      pages: 4,
      lastUpdated: '2024-02-01',
      icon: Calendar,
      featured: false
    }
  ];

  const categories = ['All', 'Parents', 'Students', 'Financial', 'Planning'];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Parents': return 'bg-blue-100 text-blue-800';
      case 'Students': return 'bg-green-100 text-green-800';
      case 'Financial': return 'bg-purple-100 text-purple-800';
      case 'Planning': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={category === 'All' ? 'default' : 'outline'}
            size="sm"
            className={category === 'All' ? 'ehrdc-button-primary' : 'border-ehrdc-teal text-ehrdc-teal hover:bg-ehrdc-teal hover:text-white'}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Featured Resources */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-ehrdc-teal" />
          Featured Resources
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {resources.filter(resource => resource.featured).map((resource) => {
            const IconComponent = resource.icon;
            return (
              <Card key={resource.id} className="border-ehrdc-teal/20 bg-gradient-to-br from-white to-ehrdc-teal/5">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-ehrdc-teal/10 flex items-center justify-center">
                        <IconComponent className="h-6 w-6 text-ehrdc-teal" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg leading-tight">{resource.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getCategoryColor(resource.category)} variant="secondary">
                            {resource.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {resource.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {resource.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        <span>{resource.downloadCount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span>{resource.rating}</span>
                      </div>
                      <span>{resource.fileSize}</span>
                    </div>
                  </div>
                  
                  <Button className="w-full ehrdc-button-primary">
                    <Download className="h-4 w-4 mr-2" />
                    Download Resource
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* All Resources */}
      <div>
        <h3 className="text-lg font-semibold mb-4">All Resources</h3>
        <div className="grid gap-4">
          {resources.map((resource) => {
            const IconComponent = resource.icon;
            return (
              <Card key={resource.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-ehrdc-teal/10 flex items-center justify-center">
                        <IconComponent className="h-5 w-5 text-ehrdc-teal" />
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium">{resource.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {resource.description}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge className={getCategoryColor(resource.category)} variant="secondary">
                            {resource.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {resource.pages} pages • {resource.fileSize}
                          </span>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span className="text-xs text-muted-foreground">{resource.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right text-xs text-muted-foreground">
                        <div>{resource.downloadCount.toLocaleString()} downloads</div>
                        <div>Updated {new Date(resource.lastUpdated).toLocaleDateString()}</div>
                      </div>
                      <Button size="sm" className="ehrdc-button-primary">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Help Section */}
      <Card className="bg-gradient-to-r from-ehrdc-teal/5 to-ehrdc-light-teal/5 border-ehrdc-teal/20">
        <CardContent className="p-6 text-center">
          <FileText className="h-12 w-12 text-ehrdc-teal mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-ehrdc-teal mb-2">Need Additional Resources?</h3>
          <p className="text-muted-foreground mb-4">
            Can't find what you're looking for? Contact our support team for personalized guidance.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" className="border-ehrdc-teal text-ehrdc-teal hover:bg-ehrdc-teal hover:text-white">
              Contact Support
            </Button>
            <Button className="ehrdc-button-primary">
              Request Resource
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResourcesSection;
