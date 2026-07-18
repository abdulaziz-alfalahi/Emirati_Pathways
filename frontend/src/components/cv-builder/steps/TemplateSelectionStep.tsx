import React, { useState, useEffect } from 'react';
import { useCV } from '@/context/CVContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Briefcase,
  GraduationCap,
  Palette,
  Building,
  Code,
  Users,
  Eye,
  Check,
  Crown,
  Star,
  Zap,
  Globe,
  Heart,
  Award,
  Loader2
} from 'lucide-react';

// Local view model for templates used by this component.
// (We normalize the API response into this shape.)
interface CVTemplate {
  id: string;
  name: string;
  display_name: string;
  category: string;
  description: string;
  industry: string;
  is_premium: boolean;
  language: string;
  preview_url?: string;
  metadata: {
    best_for: string[];
    features: string[];
    target_audience: string;
    color_scheme: string;
    layout_type: string;
  };
}

interface TemplateSelectionStepProps {
  data: { template?: string };
  onChange: (data: { template: string }) => void;
  onNext: () => void;
  onBack: () => void;
}

export const TemplateSelectionStep: React.FC<TemplateSelectionStepProps> = ({
  data,
  onChange,
  onNext,
  onBack
}) => {
  const { getTemplates, loading, createCV } = useCV();

  const [templates, setTemplates] = useState<CVTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(data.template || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templateList = await getTemplates();

        // Normalize unknown/TemplateMeta-like items to our local CVTemplate shape.
        const normalized: CVTemplate[] = (templateList as any[]).map((t) => ({
          id: t.id ?? t.template_id ?? String(Math.random()),
          name: t.name ?? t.display_name ?? 'Template',
          display_name: t.display_name ?? t.name ?? 'Template',
          category: t.category ?? 'Professional',
          description: t.description ?? '',
          industry: t.industry ?? 'Corporate',
          is_premium: Boolean(t.is_premium),
          language: t.language ?? 'en',
          preview_url: t.preview_url,
          metadata: {
            best_for: t.metadata?.best_for ?? [],
            features: t.metadata?.features ?? [],
            target_audience: t.metadata?.target_audience ?? 'General',
            color_scheme: t.metadata?.color_scheme ?? 'neutral',
            layout_type: t.metadata?.layout_type ?? 'classic'
          }
        }));

        setTemplates(normalized);
      } catch (error) {
        console.error('Error loading templates:', error);
      }
    };

    if (templates.length === 0) {
      loadTemplates();
    }
  }, [templates.length, getTemplates]);

  const categories = [
    { id: 'all', name: 'All Templates', icon: Globe },
    { id: 'Professional', name: 'Professional', icon: Briefcase },
    { id: 'Government', name: 'Government', icon: Building },
    { id: 'Technology', name: 'Technology', icon: Code },
    { id: 'Healthcare', name: 'Healthcare', icon: Heart },
    { id: 'Creative', name: 'Creative', icon: Palette },
    { id: 'Executive', name: 'Executive', icon: Crown }
  ];

  const filteredTemplates =
    selectedCategory === 'all'
      ? templates
      : templates.filter((template) => template.category === selectedCategory);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    onChange({ template: templateId });
  };

  const handleNext = async () => {
    if (!selectedTemplate) {
      alert('Please select a template to continue');
      return;
    }

    try {
      // Cast the language to satisfy the CVLanguage param without changing your types.
      const lang = (templates.find((t) => t.id === selectedTemplate)?.language ?? 'en') as any;
      await createCV(selectedTemplate as any, lang);
      onNext();
    } catch (error) {
      console.error('Error creating CV:', error);
      alert('Failed to create CV. Please try again.');
    }
  };

  const getTemplateIcon = (category: string) => {
    switch (category) {
      case 'Professional':
        return Briefcase;
      case 'Government':
        return Building;
      case 'Technology':
        return Code;
      case 'Healthcare':
        return Heart;
      case 'Creative':
        return Palette;
      case 'Executive':
        return Crown;
      default:
        return Briefcase;
    }
  };

  const getIndustryColor = (industry: string) => {
    const colors: Record<string, string> = {
      Corporate: 'bg-blue-100 text-blue-800',
      Government: 'bg-green-100 text-green-800',
      Technology: 'bg-purple-100 text-purple-800',
      Healthcare: 'bg-red-100 text-red-800',
      Creative: 'bg-pink-100 text-pink-800',
      Executive: 'bg-yellow-100 text-yellow-800',
      Finance: 'bg-indigo-100 text-indigo-800',
      Education: 'bg-orange-100 text-orange-800'
    };
    return colors[industry] || 'bg-gray-100 text-gray-800';
  };

  if (loading.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading UAE CV templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Choose Your CV Template</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Select a professionally designed template optimized for the UAE job market.
          Each template is crafted to highlight your strengths and appeal to local employers.
        </p>
      </div>

      {/* Category Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter by Industry</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <TabsTrigger key={category.id} value={category.id} className="flex items-center space-x-1">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{category.name}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const Icon = getTemplateIcon(template.category);
          const isSelected = selectedTemplate === template.id;

          return (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
              }`}
              onClick={() => handleTemplateSelect(template.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-5 w-5 text-gray-600" />
                    <CardTitle className="text-lg">{template.display_name}</CardTitle>
                  </div>
                  <div className="flex items-center space-x-1">
                    {template.is_premium && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Crown className="h-3 w-3 me-1" />
                        Premium
                      </Badge>
                    )}
                    {isSelected && (
                      <Badge className="bg-green-100 text-green-800">
                        <Check className="h-3 w-3 me-1" />
                        Selected
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Template Preview */}
                <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
                  {template.preview_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={template.preview_url}
                      alt={`${template.display_name} preview`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <Icon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No preview</p>
                    </div>
                  )}

                  {/* Preview overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                    <Button
                      className="opacity-0 hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewTemplate(template.id);
                      }}
                    >
                      <Eye className="h-4 w-4 me-1" />
                      Preview
                    </Button>
                  </div>
                </div>

                {/* Template Info */}
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">{template.description}</p>

                  {/* Industry Badge */}
                  <Badge className={getIndustryColor(template.industry)}>{template.industry}</Badge>

                  {/* Best For */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Best for:</h4>
                    <div className="flex flex-wrap gap-1">
                      {template.metadata.best_for.slice(0, 3).map((item, index) => (
                        <Badge key={index} className="text-xs">
                          {item}
                        </Badge>
                      ))}
                      {template.metadata.best_for.length > 3 && (
                        <Badge className="text-xs">+{template.metadata.best_for.length - 3} more</Badge>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Features:</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {template.metadata.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <Star className="h-3 w-3 me-1 text-yellow-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Language Support */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Language: {template.language}</span>
                    <span>Layout: {template.metadata.layout_type}</span>
                  </div>
                </div>

                {/* Selection Radio */}
                <div className="pt-2 border-t">
                  <RadioGroup value={selectedTemplate} onValueChange={handleTemplateSelect}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={template.id} id={template.id} />
                      <Label htmlFor={template.id} className="text-sm font-medium">
                        Select this template
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* No templates message */}
      {filteredTemplates.length === 0 && (
        <Alert>
          <AlertDescription>
            No templates found for the selected category. Try selecting &quot;All Templates&quot; or a different
            category.
          </AlertDescription>
        </Alert>
      )}

      {/* Selected Template Summary */}
      {selectedTemplate && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Check className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="font-medium text-blue-900">
                  {templates.find((t) => t.id === selectedTemplate)?.display_name} Selected
                </h3>
                <p className="text-sm text-blue-700">
                  Perfect choice! This template is optimized for{' '}
                  {templates.find((t) => t.id === selectedTemplate)?.metadata.target_audience}.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button onClick={onBack}>Back</Button>
        <Button onClick={handleNext} disabled={!selectedTemplate || loading.isLoading} className="min-w-[120px]">
          {loading.isLoading ? (
            <>
              <Loader2 className="h-4 w-4 me-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              Continue
              <Zap className="h-4 w-4 ms-2" />
            </>
          )}
        </Button>
      </div>

      {/* Tips */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <h4 className="font-medium text-green-900 mb-2">💡 Template Selection Tips</h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>
              • <strong>Professional:</strong> Best for corporate roles and traditional industries
            </li>
            <li>
              • <strong>Government:</strong> Ideal for public sector and government positions
            </li>
            <li>
              • <strong>Technology:</strong> Perfect for IT, software, and tech startups
            </li>
            <li>
              • <strong>Creative:</strong> Great for design, marketing, and creative industries
            </li>
            <li>
              • <strong>Executive:</strong> Designed for senior leadership and C-level positions
            </li>
            <li>• All templates are optimized for ATS (Applicant Tracking Systems)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
