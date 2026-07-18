
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trash2 } from 'lucide-react';
import { UserCareerPath } from '@/types/careerPath';
import EmptyCareerPathState from './EmptyCareerPathState';

export interface CareerPathsListProps {
  userPaths: UserCareerPath[];
  onViewDetails: (path: UserCareerPath) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
  showEnrollButton?: boolean;
  onEnroll?: (pathId: string) => void;
  emptyStateMessage?: string;
  emptyStateAction?: string;
}

const CareerPathsList: React.FC<CareerPathsListProps> = ({ 
  userPaths, 
  onViewDetails, 
  onDelete, 
  deletingId, 
  showEnrollButton = false,
  onEnroll,
  emptyStateMessage,
  emptyStateAction
}) => {
  if (userPaths.length === 0) {
    return (
      <EmptyCareerPathState 
        message={emptyStateMessage || "No career paths available"}
        action={emptyStateAction || "Check back later for new career paths"} 
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {userPaths.map(path => (
        <Card key={path.id}>
          <CardHeader>
            <CardTitle className="text-lg">
              {path.career_path?.title || 'Career Path'}
            </CardTitle>
            <CardDescription>
              {path.career_path?.industry || 'Industry not specified'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {path.completionPercentage !== undefined && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{path.completionPercentage}%</span>
                </div>
                <Progress value={path.completionPercentage} />
              </div>
            )}
            
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              {path.duration && (
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <p>{path.duration}</p>
                </div>
              )}
              
              {path.difficulty && (
                <div>
                  <span className="text-muted-foreground">Level:</span>
                  <p className="capitalize">{path.difficulty}</p>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-2">
            <Button 
              variant="default" 
              className="w-full"
              onClick={() => onViewDetails(path)}
            >
              View Details
            </Button>
            
            <div className="flex w-full gap-2">
              {showEnrollButton && onEnroll && (
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => onEnroll(path.id)}
                >
                  Enroll
                </Button>
              )}
              
              {!showEnrollButton && (
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => onDelete(path.id)}
                  disabled={deletingId === path.id}
                >
                  {deletingId === path.id ? (
                    <>
                      <div className="animate-spin me-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 me-2" />
                      Remove
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default CareerPathsList;
