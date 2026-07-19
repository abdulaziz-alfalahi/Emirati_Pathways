
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  Palette, 
  Code, 
  Shield, 
  GraduationCap, 
  Crown,
  Eye,
  Star,
  Search,
  Filter
} from 'lucide-react';

interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  category: 'corporate' | 'creative' | 'technical' | 'compliance_auditor' | 'academic' | 'executive';
  preview: string;
  features: string[];
  rating: number;
  popular: boolean;
}

interface ResumeTemplateSelectorProps {
  onSelectTemplate: (templateId: string) => void;
  onStartBuilding: () => void;
}

const ResumeTemplateSelector: React.FC<ResumeTemplateSelectorProps> = ({
  onSelectTemplate,
  onStartBuilding
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const templates: ResumeTemplate[] = [
    {
      id: 'corporate-classic',
      name: 'Corporate Classic',
      description: 'Perfect for banking, finance, and traditional corporate roles',
      category: 'corporate',
      preview: '/template-previews/corporate-classic.png',
      features: ['ATS Optimized', 'Clean Layout', 'Professional Typography'],
      rating: 4.8,
      popular: true
    },
    {
      id: 'creative-modern',
      name: 'Creative Modern',
      description: 'Ideal for design, marketing, and creative industry professionals',
      category: 'creative',
      preview: '/template-previews/creative-modern.png',
      features: ['Visual Elements', 'Color Customization', 'Portfolio Section'],
      rating: 4.7,
      popular: true
    },
    {
      id: 'tech-specialist',
      name: 'Tech Specialist',
      description: 'Designed for software engineers, data scientists, and IT professionals',
      category: 'technical',
      preview: '/template-previews/tech-specialist.png',
      features: ['Skills Matrix', 'Project Showcase', 'GitHub Integration'],
      rating: 4.9,
      popular: false
    },
    {
      id: 'government-formal',
      name: 'Government Formal',
      description: 'Structured format for government and public sector positions',
      category: 'compliance_auditor',
      preview: '/template-previews/government-formal.png',
      features: ['Formal Structure', 'Security Clearance Section', 'Compliance Ready'],
      rating: 4.6,
      popular: false
    },
    {
      id: 'academic-research',
      name: 'Academic Research',
      description: 'Comprehensive format for academic and research positions',
      category: 'academic',
      preview: '/template-previews/academic-research.png',
      features: ['Publications List', 'Research Experience', 'Teaching Portfolio'],
      rating: 4.8,
      popular: false
    },
    {
      id: 'executive-premium',
      name: 'Executive Premium',
      description: 'Sophisticated design for C-level and senior executive roles',
      category: 'executive',
      preview: '/template-previews/executive-premium.png',
      features: ['Executive Summary', 'Board Experience', 'Leadership Metrics'],
      rating: 4.9,
      popular: true
    }
  ];

  const categoryIcons = {
    corporate: <Building2 className="h-5 w-5" />,
    creative: <Palette className="h-5 w-5" />,
    technical: <Code className="h-5 w-5" />,
    government: <Shield className="h-5 w-5" />,
    academic: <GraduationCap className="h-5 w-5" />,
    executive: <Crown className="h-5 w-5" />
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    onSelectTemplate(templateId);
  };

  const handleStartBuilding = () => {
    if (selectedTemplate) {
      onStartBuilding();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Choose Your Professional Template
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Select from our collection of UAE job market optimized templates, each designed for specific industries and career levels
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ps-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-600" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="corporate">Corporate</SelectItem>
              <SelectItem value="creative">Creative</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value='compliance_auditor'>Government</SelectItem>
              <SelectItem value="academic">Academic</SelectItem>
              <SelectItem value="executive">Executive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card 
            key={template.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedTemplate === template.id 
                ? 'ring-2 ring-ehrdc-teal border-ehrdc-teal' 
                : 'hover:border-gray-300'
            }`}
            onClick={() => handleSelectTemplate(template.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {categoryIcons[template.category]}
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  {template.popular && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      Popular
                    </Badge>
                  )}
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 ms-1">{template.rating}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Template Preview */}
              <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <Eye className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Template Preview</p>
                </div>
              </div>
              
              {/* Description */}
              <p className="text-gray-600 text-sm">{template.description}</p>
              
              {/* Features */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-900">Key Features:</h4>
                <div className="flex flex-wrap gap-1">
                  {template.features.map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Action Button */}
              <Button 
                variant={selectedTemplate === template.id ? "default" : "outline"}
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectTemplate(template.id);
                }}
              >
                {selectedTemplate === template.id ? 'Selected' : 'Select Template'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Start Building Button */}
      {selectedTemplate && (
        <div className="text-center pt-6 border-t">
          <Button 
            size="lg" 
            onClick={handleStartBuilding}
            className="bg-ehrdc-teal hover:bg-ehrdc-teal/90"
          >
            Start Building Your Resume
          </Button>
        </div>
      )}

      {/* Template Categories Info */}
      <div className="bg-gray-50 rounded-lg p-6 mt-8">
        <h3 className="text-lg font-semibold mb-4">Template Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <Building2 className="h-5 w-5 text-gray-600 mt-1" />
            <div>
              <h4 className="font-medium text-gray-900">Corporate</h4>
              <p className="text-sm text-gray-600">Banking, finance, consulting</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Palette className="h-5 w-5 text-gray-600 mt-1" />
            <div>
              <h4 className="font-medium text-gray-900">Creative</h4>
              <p className="text-sm text-gray-600">Design, marketing, media</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Code className="h-5 w-5 text-gray-600 mt-1" />
            <div>
              <h4 className="font-medium text-gray-900">Technical</h4>
              <p className="text-sm text-gray-600">IT, engineering, development</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeTemplateSelector;
