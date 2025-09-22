
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AssessmentCriterion } from '@/types/collaborativeAssessments';

interface ScoringInterfaceProps {
  criterion: AssessmentCriterion;
  score?: number;
  onScoreChange: (score: number) => void;
}

export const ScoringInterface: React.FC<ScoringInterfaceProps> = ({
  criterion,
  score,
  onScoreChange
}) => {
  if (criterion.scoring_type === 'numeric') {
    return (
      <div className="space-y-2">
        <Label htmlFor={`score-${criterion.id}`}>
          Score (0-{criterion.max_score})
        </Label>
        <Input
          id={`score-${criterion.id}`}
          type="number"
          min="0"
          max={criterion.max_score}
          value={score || ''}
          onChange={(e) => onScoreChange(Number(e.target.value))}
          placeholder="Enter score"
        />
      </div>
    );
  }

  if (criterion.scoring_type === 'rubric' && criterion.rubric_levels) {
    return (
      <div className="space-y-3">
        <Label>Select Score</Label>
        <RadioGroup
          value={score?.toString() || ''}
          onValueChange={(value) => onScoreChange(Number(value))}
        >
          {criterion.rubric_levels.map((level) => (
            <div key={level.score} className="flex items-start space-x-3 p-3 border rounded-lg">
              <RadioGroupItem value={level.score.toString()} id={`rubric-${criterion.id}-${level.score}`} className="mt-1" />
              <div className="flex-1">
                <Label htmlFor={`rubric-${criterion.id}-${level.score}`} className="font-medium">
                  {level.score} - {level.label}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">{level.description}</p>
              </div>
            </div>
          ))}
        </RadioGroup>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>This criterion doesn't support scoring</Label>
      <p className="text-sm text-muted-foreground">Only comments are available for this criterion.</p>
    </div>
  );
};
