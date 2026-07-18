
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AssessmentTemplate } from '@/types/collaborativeAssessments';
import { 
  FileText, 
  Clock, 
  Users, 
  Star, 
  Play, 
  Eye, 
  Calendar,
  Tag
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TemplateDetailsProps {
  template: AssessmentTemplate;
  open: boolean;
  onClose: () => void;
  onCreateAssessment?: (template: AssessmentTemplate) => void;
}

export const TemplateDetails: React.FC<TemplateDetailsProps> = ({
  template,
  open,
  onClose,
  onCreateAssessment
}) => {
  const statusColors = {
    draft: 'bg-yellow-100 text-yellow-800',
    published: 'bg-green-100 text-green-800',
    archived: 'bg-gray-100 text-gray-800'
  };

  const sectionCount = template.sections?.length || 0;
  const criteriaCount = template.sections?.reduce((total, section) => total + (section.criteria?.length || 0), 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{template.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Overview */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-muted-foreground">{template.description}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={statusColors[template.status]}>
                  {template.status}
                </Badge>
                <Badge variant="secondary">{template.category}</Badge>
                {template.is_public && (
                  <Badge variant="outline">
                    <Users className="h-3 w-3 me-1" />
                    Public
                  </Badge>
                )}
              </div>
            </div>
            {onCreateAssessment && (
              <Button onClick={() => onCreateAssessment(template)}>
                <Play className="h-4 w-4 me-2" />
                Use This Template
              </Button>
            )}
          </div>

          {/* Template Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">{sectionCount}</div>
                <div className="text-sm text-muted-foreground">Sections</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Star className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">{criteriaCount}</div>
                <div className="text-sm text-muted-foreground">Criteria</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">{template.estimated_duration_minutes || 0}m</div>
                <div className="text-sm text-muted-foreground">Duration</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">{formatDistanceToNow(new Date(template.created_at))}</div>
                <div className="text-sm text-muted-foreground">Created</div>
              </div>
            </div>
          </div>

          {/* Tags */}
          {template.tags && template.tags.length > 0 && (
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {template.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Sections Preview */}
          <div>
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Assessment Structure
            </h3>
            <div className="space-y-4">
              {template.sections?.map((section, index) => (
                <Card key={section.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {index + 1}. {section.title}
                      </CardTitle>
                      <Badge variant="outline">Weight: {section.weight}</Badge>
                    </div>
                    {section.description && (
                      <CardDescription>{section.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="font-medium text-sm text-muted-foreground mb-2">
                        Evaluation Criteria ({section.criteria?.length || 0})
                      </div>
                      {section.criteria?.map((criterion, criterionIndex) => (
                        <div key={criterion.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                          <div>
                            <div className="font-medium text-sm">{criterion.title}</div>
                            {criterion.description && (
                              <div className="text-xs text-muted-foreground">{criterion.description}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="outline" className="text-xs">
                              {criterion.scoring_type}
                            </Badge>
                            {criterion.scoring_type === 'numeric' && (
                              <span className="text-muted-foreground">Max: {criterion.max_score}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
