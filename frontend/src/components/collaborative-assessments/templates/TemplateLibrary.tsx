
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { AssessmentTemplate, AssessmentTemplateStatus } from '@/types/collaborativeAssessments';
import { 
  fetchAssessmentTemplates, 
  deleteAssessmentTemplate, 
  duplicateAssessmentTemplate 
} from '@/services/collaborativeAssessments/templateService';
import { TemplateCard } from './TemplateCard';
import { TemplateDetails } from './TemplateDetails';
import { TemplateFilters } from './TemplateFilters';
import { CreateTemplateDialog } from './CreateTemplateDialog';
import { Plus, Library, Star, Clock, Users } from 'lucide-react';

interface TemplateLibraryProps {
  onSelectTemplate?: (template: AssessmentTemplate) => void;
  onCreateAssessment?: (template: AssessmentTemplate) => void;
  selectionMode?: boolean;
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  onSelectTemplate,
  onCreateAssessment,
  selectionMode = false
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<'all' | 'my-templates' | 'favorites' | 'recent'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<AssessmentTemplate | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Fetch templates based on active tab
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['assessment-templates', activeTab, user?.id],
    queryFn: () => {
      switch (activeTab) {
        case 'my-templates':
          return fetchAssessmentTemplates(user?.id);
        case 'all':
        default:
          return fetchAssessmentTemplates();
      }
    },
    enabled: !!user
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAssessmentTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-templates'] });
      toast({
        title: "Template deleted",
        description: "Assessment template has been deleted successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete template. Please try again.",
        variant: "destructive"
      });
    }
  });

  const duplicateMutation = useMutation({
    mutationFn: ({ templateId, newTitle }: { templateId: string; newTitle: string }) =>
      duplicateAssessmentTemplate(templateId, newTitle, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-templates'] });
      toast({
        title: "Template duplicated",
        description: "Template has been duplicated successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to duplicate template. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Filter templates based on search and category
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter
  const categories = Array.from(new Set(templates.map(t => t.category)));

  const handleDuplicate = (template: AssessmentTemplate) => {
    const newTitle = `${template.title} (Copy)`;
    duplicateMutation.mutate({ templateId: template.id, newTitle });
  };

  const handleDelete = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      deleteMutation.mutate(templateId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Assessment Template Library</h1>
          <p className="text-muted-foreground">Browse, create, and manage assessment templates</p>
        </div>
        <div className="flex gap-2">
          <CreateTemplateDialog
            trigger={
              <Button>
                <Plus className="h-4 w-4 me-2" />
                Create Template
              </Button>
            }
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['assessment-templates'] });
              setShowCreateDialog(false);
            }}
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Library className="h-4 w-4" />
            All Templates
          </TabsTrigger>
          <TabsTrigger value="my-templates" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            My Templates
          </TabsTrigger>
          <TabsTrigger value="favorites" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Favorites
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TemplateFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories}
          />
        </div>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <Library className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No templates found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedCategory
                  ? "Try adjusting your search criteria"
                  : "Get started by creating your first template"
                }
              </p>
              {!searchQuery && !selectedCategory && (
                <CreateTemplateDialog
                  trigger={
                    <Button>
                      <Plus className="h-4 w-4 me-2" />
                      Create Your First Template
                    </Button>
                  }
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['assessment-templates'] });
                  }}
                />
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={selectionMode ? onSelectTemplate : undefined}
                  onView={() => setSelectedTemplate(template)}
                  onEdit={() => {/* Navigate to edit */}}
                  onDuplicate={() => handleDuplicate(template)}
                  onDelete={template.created_by === user?.id ? () => handleDelete(template.id) : undefined}
                  onCreateAssessment={onCreateAssessment}
                  selectionMode={selectionMode}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedTemplate && (
        <TemplateDetails
          template={selectedTemplate}
          open={!!selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onCreateAssessment={onCreateAssessment}
        />
      )}
    </div>
  );
};
