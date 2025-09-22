
import React from 'react';
import { CareerPathWithStages } from '@/types/careerPath';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ArrowRight, BookOpen, Briefcase, Clock, Star, Award } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface CareerPathwayDetailsProps {
  careerPath: CareerPathWithStages;
  currentStageId?: string | null;
  onStageSelect?: (stageId: string) => void;
}

const CareerPathwayDetails: React.FC<CareerPathwayDetailsProps> = ({ 
  careerPath, 
  currentStageId,
  onStageSelect 
}) => {
  if (!careerPath || !careerPath.stages || careerPath.stages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Career Pathway Not Found</CardTitle>
          <CardDescription>
            The requested career pathway could not be found or has no stages defined.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Calculate overall progress
  const currentStageIndex = careerPath.stages.findIndex(s => s.id === currentStageId);
  const progressPercentage = currentStageIndex >= 0 
    ? Math.round((currentStageIndex / (careerPath.stages.length - 1)) * 100) 
    : 0;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold">{careerPath.title}</CardTitle>
            <CardDescription className="mt-1">{careerPath.description}</CardDescription>
            <Badge className="mt-3">{careerPath.industry}</Badge>
          </div>
          <div className="text-center bg-muted/30 p-3 rounded-lg">
            <span className="text-3xl font-bold block">{progressPercentage}%</span>
            <span className="text-xs text-muted-foreground">Complete</span>
          </div>
        </div>
        
        {/* Overall progress bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span>{progressPercentage}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="mt-4 space-y-8">
          {careerPath.stages.map((stage, index) => {
            const isCurrentStage = stage.id === currentStageId;
            const isPastStage = currentStageIndex > index;
            
            return (
              <div 
                key={stage.id} 
                className={`flex relative ${
                  index < careerPath.stages.length - 1 ? 'pb-8' : ''
                }`}
              >
                {/* Vertical timeline line */}
                {index < careerPath.stages.length - 1 && (
                  <div 
                    className={`absolute left-6 top-10 w-0.5 h-full ${
                      isPastStage ? 'bg-primary' : 'bg-gray-200'
                    }`}
                  />
                )}
                
                {/* Stage icon with animation for current stage */}
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center z-10 mr-4 transition-all duration-300 ${
                    isCurrentStage 
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 animate-pulse' 
                      : isPastStage 
                        ? 'bg-primary/20 text-primary' 
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {isPastStage ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : stage.stage_type === 'education' ? (
                    <BookOpen className="h-6 w-6" />
                  ) : (
                    <Briefcase className="h-6 w-6" />
                  )}
                </div>
                
                {/* Stage content */}
                <div className="flex-1">
                  <div 
                    className={`p-4 rounded-lg border transition-all duration-200 ${
                      isCurrentStage 
                        ? 'border-primary bg-primary/5 shadow-md' 
                        : isPastStage
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200'
                    } ${onStageSelect ? 'cursor-pointer hover:border-gray-300 hover:shadow-sm' : ''}`}
                    onClick={() => onStageSelect && onStageSelect(stage.id)}
                  >
                    <div className="flex justify-between">
                      <div className="flex items-center">
                        <h3 className="font-medium text-lg">
                          {isPastStage && <span className="text-green-600 mr-2">✓</span>}
                          {stage.title}
                        </h3>
                        {isCurrentStage && (
                          <span className="ml-2 text-xs bg-primary text-white px-2 py-1 rounded-full animate-fade-in">
                            Current
                          </span>
                        )}
                      </div>
                      <Badge variant={stage.stage_type === 'education' ? 'outline' : 'secondary'}>
                        {stage.stage_type === 'education' ? 'Education' : 'Career'}
                      </Badge>
                    </div>
                    
                    {stage.description && (
                      <p className="text-sm text-muted-foreground mt-2">{stage.description}</p>
                    )}
                    
                    <div className="mt-4 flex flex-wrap gap-4 text-sm">
                      {stage.duration && (
                        <div className="flex items-center text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{stage.duration}</span>
                        </div>
                      )}
                      
                      {stage.skills && stage.skills.length > 0 && (
                        <div className="flex items-center text-muted-foreground">
                          <Star className="h-4 w-4 mr-1" />
                          <span>{stage.skills.length} Skills</span>
                        </div>
                      )}
                    </div>
                    
                    {stage.skills && stage.skills.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground">Skills:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {stage.skills.map((skill) => (
                            <Badge key={skill} variant="outline" className="bg-blue-50">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {stage.requirements && stage.requirements.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground">Requirements:</p>
                        <ul className="list-disc list-inside text-sm mt-1">
                          {stage.requirements.map((req, idx) => (
                            <li key={idx} className="text-gray-700">{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {isCurrentStage && onStageSelect && (
                      <div className="mt-4 flex items-center justify-end">
                        <div className="text-xs text-primary mr-2">Click to update progress</div>
                        <Award className="h-4 w-4 text-primary animate-pulse" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CareerPathwayDetails;
