
import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft } from 'lucide-react';

interface EvaluationHeaderProps {
  title: string;
  onBack: () => void;
  progressPercentage: number;
}

export const EvaluationHeader: React.FC<EvaluationHeaderProps> = ({
  title,
  onBack,
  progressPercentage
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">Evaluation Interface</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm text-muted-foreground">Overall Progress</p>
        <div className="flex items-center space-x-2">
          <Progress value={progressPercentage} className="w-24" />
          <span className="text-sm font-medium">{progressPercentage}%</span>
        </div>
      </div>
    </div>
  );
};
