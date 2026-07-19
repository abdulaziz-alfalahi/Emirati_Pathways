
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AssessmentTemplate } from '@/types/collaborativeAssessments';
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Copy, 
  Trash2, 
  Play, 
  Clock, 
  Users, 
  FileText,
  Star
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TemplateCardProps {
  template: AssessmentTemplate;
  onSelect?: (template: AssessmentTemplate) => void;
  onView?: (template: AssessmentTemplate) => void;
  onEdit?: (template: AssessmentTemplate) => void;
  onDuplicate?: (template: AssessmentTemplate) => void;
  onDelete?: (template: AssessmentTemplate) => void;
  onCreateAssessment?: (template: AssessmentTemplate) => void;
  selectionMode?: boolean;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onSelect,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onCreateAssessment,
  selectionMode = false
}) => {
  const statusColors = {
    draft: 'bg-yellow-100 text-yellow-800',
    published: 'bg-green-100 text-green-800',
    archived: 'bg-gray-100 text-gray-800'
  };

  const sectionCount = template.sections?.length || 0;
  const criteriaCount = template.sections?.reduce((total, section) => total + (section.criteria?.length || 0), 0) || 0;

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">
              {template.title}
            </CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {template.description || 'No description provided'}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={() => onView(template)}>
                  <Eye className="h-4 w-4 me-2" />
                  View Details
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(template)}>
                  <Edit className="h-4 w-4 me-2" />
                  Edit Template
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(template)}>
                  <Copy className="h-4 w-4 me-2" />
                  Duplicate
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(template)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 me-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 mt-2">
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
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <span>{sectionCount} sections</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            <span>{criteriaCount} criteria</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{template.estimated_duration_minutes || 0}m</span>
          </div>
        </div>

        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{template.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Created {formatDistanceToNow(new Date(template.created_at))} ago
        </div>

        <div className="flex gap-2">
          {selectionMode && onSelect ? (
            <Button onClick={() => onSelect(template)} className="flex-1">
              Select Template
            </Button>
          ) : (
            <>
              {onCreateAssessment && (
                <Button onClick={() => onCreateAssessment(template)} className="flex-1">
                  <Play className="h-4 w-4 me-2" />
                  Use Template
                </Button>
              )}
              {onView && (
                <Button variant="outline" onClick={() => onView(template)}>
                  <Eye className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
