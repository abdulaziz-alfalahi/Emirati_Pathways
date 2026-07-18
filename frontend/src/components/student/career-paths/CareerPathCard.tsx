
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BadgeInfo, Clock, Trash2, ArrowUpRight } from 'lucide-react';
import { UserCareerPath } from '@/types/careerPath';

export interface CareerPath {
  id: string;
  title: string;
  description: string;
  steps: {
    id: string;
    title: string;
    description: string;
    completed: boolean;
  }[];
  duration: string;
  difficulty: string;
  completionPercentage: number;
  isEnrolled: boolean;
}

interface CareerPathCardProps {
  userPath: UserCareerPath;
  onViewDetails: () => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  showEnrollButton?: boolean;
  onEnroll?: (id: string) => void;
}

const CareerPathCard: React.FC<CareerPathCardProps> = ({
  userPath,
  onViewDetails,
  onDelete,
  isDeleting,
  showEnrollButton = false,
  onEnroll
}) => {
  const title = userPath.career_path?.title || 'Career Path';
  const description = userPath.career_path?.description || '';
  const completionPercentage = userPath.completionPercentage || 0;
  const difficulty = userPath.difficulty || 'beginner';
  const duration = userPath.duration || 'Unknown';
  
  const getDifficultyColor = () => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'text-green-500';
      case 'intermediate':
        return 'text-yellow-500';
      case 'advanced':
        return 'text-red-500';
      default:
        return 'text-blue-500';
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          {!isDeleting ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onDelete(userPath.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : (
            <div className="h-8 w-8 flex items-center justify-center">
              <div className="animate-spin h-4 w-4 border-2 border-primary rounded-full border-t-transparent" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {description}
        </p>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-1" />
          </div>

          <div className="flex justify-between text-xs text-muted-foreground">
            <div className="flex items-center">
              <Clock className="me-1 h-3 w-3" />
              <span>{duration}</span>
            </div>
            <div className="flex items-center">
              <BadgeInfo className={`me-1 h-3 w-3 ${getDifficultyColor()}`} />
              <span className="capitalize">{difficulty}</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-muted/50 pt-2">
        {showEnrollButton && onEnroll ? (
          <Button
            className="w-full"
            onClick={() => onEnroll(userPath.id)}
          >
            Enroll
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="w-full text-primary"
            onClick={onViewDetails}
          >
            <span>View Details</span>
            <ArrowUpRight className="ms-1 h-3 w-3" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default CareerPathCard;
