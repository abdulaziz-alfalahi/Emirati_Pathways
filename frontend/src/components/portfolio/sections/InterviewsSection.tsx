import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, ArrowUpRight, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdvisorySession } from "@/types/careerAdvisory";
import { formatDate } from "@/utils/dateFormat";
import { Link } from "react-router-dom";

interface InterviewsSectionProps {
  interviews: AdvisorySession[] | undefined;
}

const InterviewsSection: React.FC<InterviewsSectionProps> = ({ interviews }) => {
  if (!interviews || interviews.length === 0) {
    return (
      <Card className="bg-muted/40">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Video className="h-5 w-5 me-2" />
            Interview Outcomes
          </CardTitle>
          <CardDescription>No interview data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const completedInterviews = interviews.filter(
    interview => interview.status === "completed"
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Video className="h-5 w-5 me-2" />
          Interview Outcomes
        </CardTitle>
        <CardDescription>
          {completedInterviews.length} completed interviews
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {interviews.slice(0, 3).map((interview) => (
          <div 
            key={interview.id} 
            className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{interview.topic}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={
                    interview.status === 'completed' ? 'default' : 'outline'
                  }>
                    {interview.interview_type || "General"} Interview
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(new Date(interview.scheduled_date))}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center">
                {getStatusIcon(interview.status)}
                <span className="text-xs ms-1 capitalize">{interview.status}</span>
              </div>
            </div>
            
            {interview.feedback && interview.status === "completed" && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-1">Feedback</h4>
                <p className="text-xs text-muted-foreground line-clamp-2">{interview.feedback}</p>
              </div>
            )}
            
            {interview.rating !== null && interview.status === "completed" && (
              <div className="mt-2 flex">
                <span className="text-xs font-medium me-2">Rating:</span>
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span 
                      key={i} 
                      className={`h-3 w-3 rounded-full mx-0.5 ${i < interview.rating! ? 'bg-primary' : 'bg-muted'}`} 
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {interviews.length > 3 && (
          <div className="flex justify-end">
            <Link to="/career-advisory/interviews" className="text-sm text-primary hover:underline flex items-center">
              View all {interviews.length} interviews
              <ArrowUpRight className="h-3 w-3 ms-1" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InterviewsSection;
