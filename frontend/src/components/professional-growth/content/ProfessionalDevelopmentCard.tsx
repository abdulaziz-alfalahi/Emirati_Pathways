
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, Users, Award, Target, CheckCircle } from 'lucide-react';

export interface ProfessionalDevelopmentCard {
  title: string;
  description: string;
  category: 'skills' | 'leadership' | 'innovation' | 'networking' | 'certification';
  progress?: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  prerequisites?: string[];
  outcomes: string[];
  actionButton: {
    text: string;
    action: () => void;
  };
}

const categoryConfig = {
  skills: {
    color: 'bg-blue-100 text-blue-800',
    icon: Target
  },
  leadership: {
    color: 'bg-purple-100 text-purple-800',
    icon: Users
  },
  innovation: {
    color: 'bg-green-100 text-green-800',
    icon: Award
  },
  networking: {
    color: 'bg-orange-100 text-orange-800',
    icon: Users
  },
  certification: {
    color: 'bg-red-100 text-red-800',
    icon: Award
  }
};

const difficultyConfig = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800'
};

export const ProfessionalDevelopmentCard: React.FC<ProfessionalDevelopmentCard> = ({
  title,
  description,
  category,
  progress,
  difficulty,
  duration,
  prerequisites,
  outcomes,
  actionButton
}) => {
  const CategoryIcon = categoryConfig[category].icon;

  return (
    <Card className="h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <CategoryIcon className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />
            <Badge className={categoryConfig[category].color}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Badge>
          </div>
          <Badge className={difficultyConfig[difficulty]}>
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </Badge>
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {progress !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{duration}</span>
        </div>

        {prerequisites && prerequisites.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Prerequisites:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              {prerequisites.map((prereq, index) => (
                <li key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3" />
                  {prereq}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Learning Outcomes:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            {outcomes.slice(0, 3).map((outcome, index) => (
              <li key={index} className="flex items-center gap-2">
                <Target className="h-3 w-3" />
                {outcome}
              </li>
            ))}
            {outcomes.length > 3 && (
              <li className="text-xs italic">+{outcomes.length - 3} more outcomes</li>
            )}
          </ul>
        </div>

        <Button 
          onClick={actionButton.action}
          className="w-full mt-4"
        >
          {actionButton.text}
        </Button>
      </CardContent>
    </Card>
  );
};
