
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Training } from "@/types/portfolio";
import { formatDate } from "@/utils/dateFormat";
import { Button } from "@/components/ui/button";

interface TrainingsSectionProps {
  trainings: Training[] | undefined;
  isEditable?: boolean;
  onAddTraining?: () => void;
  onEditTraining?: (training: Training) => void;
}

const TrainingsSection: React.FC<TrainingsSectionProps> = ({
  trainings,
  isEditable = false,
  onAddTraining,
  onEditTraining
}) => {
  if (!trainings || trainings.length === 0) {
    return (
      <Card className="bg-muted/40">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <GraduationCap className="h-5 w-5 me-2" />
              Training & Courses
            </CardTitle>
            <CardDescription>No training records available</CardDescription>
          </div>
          
          {isEditable && onAddTraining && (
            <Button variant="outline" size="sm" onClick={onAddTraining}>
              Add Training
            </Button>
          )}
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center">
            <GraduationCap className="h-5 w-5 me-2" />
            Training & Courses
          </CardTitle>
          <CardDescription>{trainings.length} training records</CardDescription>
        </div>
        
        {isEditable && onAddTraining && (
          <Button variant="outline" size="sm" onClick={onAddTraining}>
            Add Training
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {trainings.map((training) => (
            <div 
              key={training.id} 
              className="border rounded-lg p-4 hover:border-primary/50 transition-colors relative"
              onClick={() => isEditable && onEditTraining && onEditTraining(training)}
            >
              <div className="flex justify-between">
                <h3 className="font-medium">{training.title}</h3>
                {training.is_completed && (
                  <Badge variant="outline" className="flex items-center">
                    <CheckCircle className="h-3 w-3 me-1" />
                    Completed
                  </Badge>
                )}
              </div>
              <p className="text-sm">{training.provider}</p>
              
              <div className="text-xs text-muted-foreground mt-1">
                {formatDate(new Date(training.start_date))}
                {training.end_date && (
                  <> to {formatDate(new Date(training.end_date))}</>
                )}
              </div>
              
              {training.skills_gained && training.skills_gained.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs mb-1 font-medium">Skills gained:</div>
                  <div className="flex flex-wrap gap-1">
                    {training.skills_gained.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {isEditable && (
                <div className="absolute top-2 end-2 text-xs text-muted-foreground">
                  Click to edit
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainingsSection;
