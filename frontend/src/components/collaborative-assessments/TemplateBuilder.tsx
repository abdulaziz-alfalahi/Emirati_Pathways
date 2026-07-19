import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save } from 'lucide-react';
import { AssessmentTemplate, AssessmentSection, AssessmentCriterion } from '@/types/collaborativeAssessments';
import { createAssessmentTemplate, updateAssessmentTemplate } from '@/services/collaborativeAssessments/templateService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface TemplateBuilderProps {
  template?: AssessmentTemplate;
  onSave?: (template: AssessmentTemplate) => void;
  onCancel?: () => void;
}

export const TemplateBuilder: React.FC<TemplateBuilderProps> = ({
  template,
  onSave,
  onCancel
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<AssessmentTemplate>>({
    title: template?.title || '',
    description: template?.description || '',
    category: template?.category || '',
    sections: template?.sections || [],
    tags: template?.tags || [],
    estimated_duration_minutes: template?.estimated_duration_minutes || 60,
    is_public: template?.is_public || false,
    status: template?.status || 'draft'
  });

  const [currentTag, setCurrentTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const addSection = () => {
    const newSection: AssessmentSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      description: '',
      weight: 1,
      criteria: [],
      order_index: formData.sections?.length || 0
    };

    setFormData(prev => ({
      ...prev,
      sections: [...(prev.sections || []), newSection]
    }));
  };

  const updateSection = (sectionId: string, updates: Partial<AssessmentSection>) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections?.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    }));
  };

  const removeSection = (sectionId: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections?.filter(section => section.id !== sectionId)
    }));
  };

  const addCriterion = (sectionId: string) => {
    const newCriterion: AssessmentCriterion = {
      id: `criterion-${Date.now()}`,
      title: 'New Criterion',
      description: '',
      max_score: 10,
      scoring_type: 'numeric',
      is_required: true
    };

    updateSection(sectionId, {
      criteria: [
        ...(formData.sections?.find(s => s.id === sectionId)?.criteria || []),
        newCriterion
      ]
    });
  };

  const updateCriterion = (sectionId: string, criterionId: string, updates: Partial<AssessmentCriterion>) => {
    const section = formData.sections?.find(s => s.id === sectionId);
    if (!section) return;

    const updatedCriteria = section.criteria.map(criterion =>
      criterion.id === criterionId ? { ...criterion, ...updates } : criterion
    );

    updateSection(sectionId, { criteria: updatedCriteria });
  };

  const removeCriterion = (sectionId: string, criterionId: string) => {
    const section = formData.sections?.find(s => s.id === sectionId);
    if (!section) return;

    const updatedCriteria = section.criteria.filter(criterion => criterion.id !== criterionId);
    updateSection(sectionId, { criteria: updatedCriteria });
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags?.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save templates.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      let savedTemplate;
      
      if (template?.id) {
        savedTemplate = await updateAssessmentTemplate(template.id, formData as AssessmentTemplate);
      } else {
        savedTemplate = await createAssessmentTemplate({
          ...formData,
          created_by: user.id,
          scoring_criteria: {}
        } as Omit<AssessmentTemplate, 'id' | 'created_at' | 'updated_at'>);
      }

      toast({
        title: "Template saved",
        description: `Assessment template "${formData.title}" has been saved successfully.`
      });

      onSave?.(savedTemplate);
    } catch (error) {
      toast({
        title: "Error saving template",
        description: "There was an error saving the assessment template. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Template Information</CardTitle>
          <CardDescription>Basic information about your assessment template</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Assessment template title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical Skills</SelectItem>
                  <SelectItem value="soft-skills">Soft Skills</SelectItem>
                  <SelectItem value="leadership">Leadership</SelectItem>
                  <SelectItem value="performance">Performance Review</SelectItem>
                  <SelectItem value="training">Training Assessment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the purpose and scope of this assessment"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Estimated Duration (minutes)</label>
              <Input
                type="number"
                value={formData.estimated_duration_minutes}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  estimated_duration_minutes: parseInt(e.target.value) 
                }))}
                min="1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Visibility</label>
              <Select
                value={formData.is_public ? 'public' : 'private'}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  is_public: value === 'public' 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Tags</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <Button onClick={addTag} variant="outline" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags?.map(tag => (
                <Badge key={tag} variant="secondary" className="cursor-pointer">
                  {tag}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ms-1"
                    onClick={() => removeTag(tag)}
                  >
                    ×
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Assessment Sections</CardTitle>
              <CardDescription>Define the sections and criteria for evaluation</CardDescription>
            </div>
            <Button onClick={addSection} variant="outline">
              <Plus className="h-4 w-4 me-2" />
              Add Section
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {formData.sections?.map((section) => (
            <Card key={section.id} className="mb-4">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={section.title}
                      onChange={(e) => updateSection(section.id, { title: e.target.value })}
                      placeholder="Section title"
                      className="font-medium"
                    />
                    <Textarea
                      value={section.description}
                      onChange={(e) => updateSection(section.id, { description: e.target.value })}
                      placeholder="Section description"
                      rows={2}
                    />
                    <div className="flex items-center gap-4">
                      <div>
                        <label className="text-sm text-muted-foreground">Weight</label>
                        <Input
                          type="number"
                          value={section.weight}
                          onChange={(e) => updateSection(section.id, { weight: parseFloat(e.target.value) })}
                          min="0"
                          step="0.1"
                          className="w-20"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addCriterion(section.id)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeSection(section.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {section.criteria.map((criterion) => (
                  <div key={criterion.id} className="border rounded p-4 mb-3 bg-muted/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <Input
                        value={criterion.title}
                        onChange={(e) => updateCriterion(section.id, criterion.id, { title: e.target.value })}
                        placeholder="Criterion title"
                      />
                      <div className="flex gap-2">
                        <Select
                          value={criterion.scoring_type}
                          onValueChange={(value: any) => updateCriterion(section.id, criterion.id, { scoring_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="numeric">Numeric (0-N)</SelectItem>
                            <SelectItem value="rubric">Rubric Levels</SelectItem>
                            <SelectItem value="checkbox">Yes/No</SelectItem>
                            <SelectItem value="text">Text Only</SelectItem>
                          </SelectContent>
                        </Select>
                        {criterion.scoring_type === 'numeric' && (
                          <Input
                            type="number"
                            value={criterion.max_score}
                            onChange={(e) => updateCriterion(section.id, criterion.id, { max_score: parseInt(e.target.value) })}
                            placeholder="Max score"
                            className="w-24"
                          />
                        )}
                      </div>
                    </div>
                    <Textarea
                      value={criterion.description}
                      onChange={(e) => updateCriterion(section.id, criterion.id, { description: e.target.value })}
                      placeholder="Criterion description and evaluation guidelines"
                      rows={2}
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCriterion(section.id, criterion.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          <Save className="h-4 w-4 me-2" />
          {isLoading ? 'Saving...' : 'Save Template'}
        </Button>
      </div>
    </div>
  );
};
