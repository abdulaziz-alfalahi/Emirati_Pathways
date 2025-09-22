
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Save } from 'lucide-react';
import { AssessmentCriterion } from '@/types/collaborativeAssessments';
import { ScoringInterface } from './ScoringInterface';
import { CriterionCollaborators } from '../realtime/CriterionCollaborators';
import { ActivityFeedItem } from '@/services/collaborativeAssessments/realtimeCollaborationService';

interface CriterionCardProps {
  criterion: AssessmentCriterion;
  score?: number;
  comments?: string;
  onScoreChange: (score: number) => void;
  onCommentsChange: (comments: string) => void;
  onSave: () => void;
  isSubmitting: boolean;
  hasEvaluation: boolean;
  sectionId: string;
  recentActivity: ActivityFeedItem[];
}

export const CriterionCard: React.FC<CriterionCardProps> = ({
  criterion,
  score,
  comments,
  onScoreChange,
  onCommentsChange,
  onSave,
  isSubmitting,
  hasEvaluation,
  sectionId,
  recentActivity
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-lg">{criterion.title}</CardTitle>
              {criterion.is_required && (
                <Badge variant="destructive" className="text-xs">Required</Badge>
              )}
              {hasEvaluation && (
                <Badge variant="secondary" className="text-xs">Evaluated</Badge>
              )}
            </div>
            {criterion.description && (
              <CardDescription className="mt-2">{criterion.description}</CardDescription>
            )}
            
            {/* Show collaborative cursors for this criterion */}
            <CriterionCollaborators
              criterionId={criterion.id}
              sectionId={sectionId}
              recentActivity={recentActivity}
              className="mt-2"
            />
          </div>
          <div className="text-right text-sm text-muted-foreground">
            Max Score: {criterion.max_score}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScoringInterface
          criterion={criterion}
          score={score}
          onScoreChange={onScoreChange}
        />

        <div className="space-y-2">
          <Label htmlFor={`comments-${criterion.id}`}>Comments</Label>
          <Textarea
            id={`comments-${criterion.id}`}
            value={comments || ''}
            onChange={(e) => onCommentsChange(e.target.value)}
            placeholder="Add your comments, observations, or feedback..."
            rows={3}
          />
        </div>

        <div className="flex justify-end">
          <Button
            onClick={onSave}
            disabled={isSubmitting || (!score && !comments)}
            className="flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>Save Evaluation</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
