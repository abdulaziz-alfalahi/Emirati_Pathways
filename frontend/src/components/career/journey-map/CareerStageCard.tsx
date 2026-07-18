
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, ArrowRight, Target, X } from 'lucide-react';
import { PersonalGoal, GoalTemplate, assignGoalToStage, createGoalFromTemplate } from '@/services/personalGoalsService';

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

interface CareerStageCardProps {
  stage: CareerStage;
  isLast: boolean;
  assignedGoals?: PersonalGoal[];
  onGoalAssigned?: (stageId: string, goalId: string) => void;
  onGoalRemoved?: (stageId: string, goalId: string) => void;
}

const CareerStageCard: React.FC<CareerStageCardProps> = ({ 
  stage, 
  isLast, 
  assignedGoals = [],
  onGoalAssigned,
  onGoalRemoved
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const getStageIcon = (stage: CareerStage) => {
    const IconComponent = stage.icon;
    let colorClass = 'text-gray-400';
    
    if (stage.completed) colorClass = 'text-green-600';
    else if (stage.current) colorClass = 'text-blue-600';
    else if (stage.recommended) colorClass = 'text-orange-600';
    
    return <IconComponent className={`h-6 w-6 ${colorClass}`} />;
  };

  const getStageStatus = (stage: CareerStage) => {
    if (stage.completed) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (stage.current) return <Circle className="h-4 w-4 text-blue-600 fill-current" />;
    return <Circle className="h-4 w-4 text-gray-400" />;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'education': return 'bg-blue-100 text-blue-800';
      case 'career': return 'bg-green-100 text-green-800';
      case 'personal': return 'bg-purple-100 text-purple-800';
      case 'retirement': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const { goal, isTemplate } = data;

      if (isTemplate) {
        // Create new goal from template and assign to stage
        const newGoal = await createGoalFromTemplate(goal as GoalTemplate);
        await assignGoalToStage(newGoal.id, stage.id);
        onGoalAssigned?.(stage.id, newGoal.id);
      } else {
        // Assign existing goal to stage
        await assignGoalToStage(goal.id, stage.id);
        onGoalAssigned?.(stage.id, goal.id);
      }
    } catch (error) {
      console.error('Error handling goal drop:', error);
    }
  };

  const handleRemoveGoal = async (goalId: string) => {
    try {
      await assignGoalToStage(goalId, ''); // Remove assignment
      onGoalRemoved?.(stage.id, goalId);
    } catch (error) {
      console.error('Error removing goal:', error);
    }
  };

  return (
    <div className="relative">
      {!isLast && (
        <div className="absolute start-6 top-12 h-16 w-0.5 bg-gray-200" />
      )}
      
      <div 
        className={`flex gap-4 ${isDragOver ? 'bg-blue-50 rounded-lg p-2' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-200 bg-white">
            {getStageIcon(stage)}
          </div>
          {getStageStatus(stage)}
        </div>
        
        <div className="flex-1 pb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold">{stage.title}</h3>
                <Badge variant="secondary" className={getCategoryColor(stage.category)}>
                  {stage.category}
                </Badge>
                {stage.current && (
                  <Badge variant="default">Current</Badge>
                )}
                {stage.recommended && (
                  <Badge variant="outline" className="border-orange-500 text-orange-600">
                    Recommended
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mb-2">{stage.description}</p>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>Age: {stage.ageRange}</span>
                {stage.duration && <span>Duration: {stage.duration}</span>}
              </div>
            </div>
          </div>

          {/* Assigned Goals */}
          {assignedGoals.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Personal Goals ({assignedGoals.length})
              </h4>
              <div className="space-y-2">
                {assignedGoals.map(goal => (
                  <div key={goal.id} className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                    <div className="flex-1">
                      <span className="font-medium">{goal.title}</span>
                      <p className="text-xs text-muted-foreground">{goal.description}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveGoal(goal.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drop Zone Indicator */}
          {isDragOver && (
            <div className="mt-4 p-4 border-2 border-dashed border-blue-400 bg-blue-50 rounded-lg text-center">
              <Target className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-blue-600 font-medium">Drop goal here to assign to this stage</p>
            </div>
          )}
          
          {(stage.requirements || stage.benefits) && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {stage.requirements && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Requirements</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {stage.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <div className="h-1 w-1 bg-gray-400 rounded-full" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {stage.benefits && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Benefits</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {stage.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <div className="h-1 w-1 bg-green-500 rounded-full" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {stage.recommended && (
            <div className="mt-4">
              <Button size="sm" className="flex items-center gap-2">
                Start Planning
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CareerStageCard;
