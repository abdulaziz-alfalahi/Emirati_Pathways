
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface PathDetailsViewProps {
  selectedPath: CareerPath;
  onBack: () => void;
}

const PathDetailsView: React.FC<PathDetailsViewProps> = ({ selectedPath, onBack }) => {
  // Function to get badge color based on difficulty
  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h3 className="text-2xl font-bold">{selectedPath.title}</h3>
        <Badge className={cn(getDifficultyColor(selectedPath.difficulty))}>
          {selectedPath.difficulty.charAt(0).toUpperCase() + selectedPath.difficulty.slice(1)}
        </Badge>
      </div>
      
      <p className="text-muted-foreground">{selectedPath.description}</p>
      
      <div>
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-lg font-semibold">Path Progress</h4>
          <span className="text-sm font-medium">
            {selectedPath.completionPercentage}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-primary h-2.5 rounded-full"
            style={{ width: `${selectedPath.completionPercentage}%` }}
          ></div>
        </div>
      </div>
      
      <div>
        <h4 className="text-lg font-semibold mb-4">Path Steps</h4>
        <div className="space-y-4">
          {selectedPath.steps.map((step, index) => (
            <div
              key={step.id}
              className="p-4 border rounded-lg bg-background"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-muted w-8 h-8 rounded-full flex items-center justify-center mr-3">
                    {index + 1}
                  </div>
                  <h5 className="font-medium">{step.title}</h5>
                </div>
                {step.completed ? (
                  <Badge className="bg-green-100 text-green-800">Completed</Badge>
                ) : (
                  <Badge variant="outline">Pending</Badge>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground pl-11">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          Estimated Duration: {selectedPath.duration}
        </span>
        <Button>Continue Path</Button>
      </div>
    </div>
  );
};

export default PathDetailsView;
