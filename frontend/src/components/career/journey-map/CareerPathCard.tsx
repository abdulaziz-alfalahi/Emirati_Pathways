
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { MapPin } from 'lucide-react';
import CareerStageCard from './CareerStageCard';
import { PersonalGoal } from '@/services/personalGoalsService';

interface CareerStage {
  id: string;
  title: string;
  description: string;
  category: 'education' | 'career' | 'personal' | 'retirement';
  ageRange: string;
  completed: boolean;
  current: boolean;
  recommended: boolean;
  icon: React.ComponentType<any>;
  requirements?: string[];
  benefits?: string[];
  duration?: string;
}

interface CareerPath {
  id: string;
  title: string;
  industry: string;
  stages: CareerStage[];
  totalProgress: number;
}

interface CareerPathCardProps {
  path: CareerPath;
  selectedCategory: string;
  userGoals?: PersonalGoal[];
  onGoalAssigned?: (stageId: string, goalId: string) => void;
  onGoalRemoved?: (stageId: string, goalId: string) => void;
}

const CareerPathCard: React.FC<CareerPathCardProps> = ({ 
  path, 
  selectedCategory, 
  userGoals = [],
  onGoalAssigned,
  onGoalRemoved
}) => {
  const filteredStages = path.stages.filter(stage => 
    selectedCategory === 'all' || stage.category === selectedCategory
  );

  const getStageGoals = (stageId: string) => {
    return userGoals.filter(goal => goal.associatedStageId === stageId);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {path.title}
            </CardTitle>
            <p className="text-muted-foreground">{path.industry} Industry</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground mb-1">Overall Progress</div>
            <div className="flex items-center gap-2">
              <Progress value={path.totalProgress} className="w-24" />
              <span className="text-sm font-medium">{path.totalProgress}%</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {filteredStages.map((stage, index) => (
            <CareerStageCard 
              key={stage.id} 
              stage={stage} 
              isLast={index === filteredStages.length - 1}
              assignedGoals={getStageGoals(stage.id)}
              onGoalAssigned={onGoalAssigned}
              onGoalRemoved={onGoalRemoved}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CareerPathCard;
