
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gauge, Award, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AssessmentSession } from "@/types/assessments";
import { formatDate } from "@/utils/dateFormat";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

interface AssessmentsSectionProps {
  assessments: AssessmentSession[] | undefined;
}

const AssessmentsSection: React.FC<AssessmentsSectionProps> = ({ assessments }) => {
  if (!assessments || assessments.length === 0) {
    return (
      <Card className="bg-muted/40">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Gauge className="h-5 w-5 me-2" />
            Assessments
          </CardTitle>
          <CardDescription>No assessment results available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const completedAssessments = assessments.filter(
    assessment => assessment.status === "completed"
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Gauge className="h-5 w-5 me-2" />
          Assessments
        </CardTitle>
        <CardDescription>
          {completedAssessments.length} completed assessments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {completedAssessments.slice(0, 3).map((assessment) => (
          <div 
            key={assessment.id} 
            className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">
                  {assessment.assessments?.title || "Assessment"}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">
                    {assessment.assessments?.assessment_type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {assessment.completed_date 
                      ? formatDate(new Date(assessment.completed_date)) 
                      : "Date unavailable"}
                  </span>
                </div>
              </div>
              
              {assessment.score !== null && (
                <div className="flex items-center">
                  <Award className={`h-5 w-5 ${Number(assessment.score) >= 70 ? 'text-green-500' : 'text-amber-500'}`} />
                  <span className="font-semibold ms-1">{assessment.score}%</span>
                </div>
              )}
            </div>
            
            {assessment.score !== null && (
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>Score</span>
                  <span>{assessment.score}%</span>
                </div>
                <Progress value={Number(assessment.score)} className="h-2" />
              </div>
            )}
            
            {assessment.coaching_recommended && (
              <div className="mt-4 text-sm bg-muted p-2 rounded border-s-2 border-amber-500">
                <p>Coaching was recommended for this assessment</p>
              </div>
            )}
          </div>
        ))}
        
        {completedAssessments.length > 3 && (
          <div className="flex justify-end">
            <Link to="/assessments" className="text-sm text-primary hover:underline flex items-center">
              View all {completedAssessments.length} assessments
              <ArrowUpRight className="h-3 w-3 ms-1" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AssessmentsSection;
