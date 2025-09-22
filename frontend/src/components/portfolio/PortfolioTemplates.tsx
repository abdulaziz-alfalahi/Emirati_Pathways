
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Palette, 
  Layout, 
  Briefcase, 
  Camera, 
  Code, 
  Paintbrush, 
  Users,
  Star,
  Eye,
  Download
} from 'lucide-react';

const PortfolioTemplates: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const templateCategories = [
    { id: 'all', name: 'All Templates', icon: Layout },
    { id: 'creative', name: 'Creative', icon: Paintbrush },
    { id: 'business', name: 'Business', icon: Briefcase },
    { id: 'tech', name: 'Technology', icon: Code },
    { id: 'photography', name: 'Photography', icon: Camera },
    { id: 'consulting', name: 'Consulting', icon: Users }
  ];

  const portfolioTemplates = [
    {
      id: 1,
      name: 'Creative Professional',
      category: 'creative',
      description: 'Perfect for designers, artists, and creative professionals',
      preview: '/api/placeholder/300/200',
      rating: 4.9,
      downloads: 1250,
      features: ['Responsive Design', 'Gallery Showcase', 'Video Support', 'Custom Branding'],
      isPremium: false
    },
    {
      id: 2,
      name: 'Corporate Executive',
      category: 'business',
      description: 'Professional template for executives and business leaders',
      preview: '/api/placeholder/300/200',
      rating: 4.8,
      downloads: 980,
      features: ['Clean Layout', 'Timeline View', 'Achievement Highlights', 'LinkedIn Integration'],
      isPremium: true
    },
    {
      id: 3,
      name: 'Tech Innovator',
      category: 'tech',
      description: 'Modern template for developers and tech professionals',
      preview: '/api/placeholder/300/200',
      rating: 4.7,
      downloads: 1580,
      features: ['Dark Mode', 'Code Snippets', 'GitHub Integration', 'Tech Stack Display'],
      isPremium: false
    },
    {
      id: 4,
      name: 'Visual Artist',
      category: 'photography',
      description: 'Image-focused template for photographers and visual artists',
      preview: '/api/placeholder/300/200',
      rating: 4.9,
      downloads: 750,
      features: ['Full-Screen Gallery', 'Lightbox View', 'Image Optimization', 'Client Testimonials'],
      isPremium: true
    },
    {
      id: 5,
      name: 'Strategy Consultant',
      category: 'consulting',
      description: 'Professional template for consultants and advisors',
      preview: '/api/placeholder/300/200',
      rating: 4.6,
      downloads: 420,
      features: ['Case Study Format', 'Client Results', 'Service Offerings', 'Contact Forms'],
      isPremium: false
    },
    {
      id: 6,
      name: 'Minimalist Pro',
      category: 'business',
      description: 'Clean and minimal design for any profession',
      preview: '/api/placeholder/300/200',
      rating: 4.8,
      downloads: 2100,
      features: ['Minimal Design', 'Fast Loading', 'Mobile Optimized', 'Easy Customization'],
      isPremium: false
    }
  ];

  const filteredTemplates = portfolioTemplates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleUseTemplate = (templateId: number) => {
    console.log(`Using template ${templateId}`);
  };

  const handlePreviewTemplate = (templateId: number) => {
    console.log(`Previewing template ${templateId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Portfolio Templates</h2>
          <p className="text-muted-foreground">Choose from professionally designed templates</p>
        </div>
        <Button>
          <Palette className="h-4 w-4 mr-2" />
          Create Custom Template
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {templateCategories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="whitespace-nowrap"
            >
              <category.icon className="h-4 w-4 mr-2" />
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              <img
                src={template.preview}
                alt={template.name}
                className="w-full h-48 object-cover"
              />
              {template.isPremium && (
                <Badge className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-yellow-600">
                  Premium
                </Badge>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => handlePreviewTemplate(template.id)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={() => handleUseTemplate(template.id)}>
                  Use Template
                </Button>
              </div>
            </div>
            
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {template.rating}
                </div>
                <div className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  {template.downloads}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {template.features.slice(0, 3).map((feature) => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                  {template.features.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.features.length - 3} more
                    </Badge>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handlePreviewTemplate(template.id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleUseTemplate(template.id)}
                  >
                    Use Template
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Layout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No templates found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria or browse all templates
          </p>
        </div>
      )}
    </div>
  );
};

export default PortfolioTemplates;
