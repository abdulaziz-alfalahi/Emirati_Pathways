import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  Target,
  Award,
  Briefcase,
  FileText,
  DollarSign,
  Gift
} from 'lucide-react';

interface JDScoringWidgetProps {
  score: number;
  recommendations?: string[];
  sectionsStatus?: {
    basic_info: boolean;
    description: boolean;
    requirements: boolean;
    responsibilities: boolean;
    compensation: boolean;
    benefits: boolean;
  };
  className?: string;
}

const JDScoringWidget: React.FC<JDScoringWidgetProps> = ({
  score,
  recommendations = [],
  sectionsStatus,
  className = ''
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Great';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Needs Work';
    return 'Incomplete';
  };

  const sections = [
    { 
      key: 'basic_info', 
      label: 'Basic Information', 
      icon: Briefcase,
      weight: 25 
    },
    { 
      key: 'description', 
      label: 'Job Description', 
      icon: FileText,
      weight: 20 
    },
    { 
      key: 'requirements', 
      label: 'Requirements', 
      icon: Target,
      weight: 20 
    },
    { 
      key: 'responsibilities', 
      label: 'Responsibilities', 
      icon: Award,
      weight: 20 
    },
    { 
      key: 'compensation', 
      label: 'Compensation', 
      icon: DollarSign,
      weight: 10 
    },
    { 
      key: 'benefits', 
      label: 'Benefits', 
      icon: Gift,
      weight: 5 
    }
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <TrendingUp className="h-5 w-5 me-2" />
            Completion Score
          </span>
          <Badge variant={getScoreVariant(score)} className="text-lg px-3 py-1">
            {score}%
          </Badge>
        </CardTitle>
        <CardDescription>
          {getScoreLabel(score)} - {score >= 80 ? 'Ready to publish!' : 'Keep improving your job description'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={score} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Score Breakdown */}
        {sectionsStatus && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Section Status</h4>
            <div className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                const isComplete = sectionsStatus[section.key as keyof typeof sectionsStatus];
                
                return (
                  <div 
                    key={section.key}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{section.label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        {section.weight}%
                      </span>
                      {isComplete ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-semibold text-sm">To improve your score:</p>
                <ul className="list-disc list-inside space-y-1">
                  {recommendations.slice(0, 5).map((rec, index) => (
                    <li key={index} className="text-sm">{rec}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Score Milestones */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Score Guide</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">90-100%</span>
              <span className="text-green-600 font-semibold">Excellent - Highly attractive to candidates</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">80-89%</span>
              <span className="text-green-600">Great - Ready to publish</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">60-79%</span>
              <span className="text-yellow-600">Good - Consider adding more details</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Below 60%</span>
              <span className="text-red-600">Needs improvement</span>
            </div>
          </div>
        </div>

        {/* Publishing Readiness */}
        {score >= 80 ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Your job description is ready to publish! High-quality postings attract better candidates.
            </AlertDescription>
          </Alert>
        ) : score >= 60 ? (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Your job description is acceptable but could be improved. Consider adding more details to attract top talent.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Your job description needs more information. Complete the missing sections to improve candidate attraction.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default JDScoringWidget;

