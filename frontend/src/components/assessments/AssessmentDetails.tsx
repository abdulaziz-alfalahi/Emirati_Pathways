
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAssessmentById, scheduleAssessment } from '@/services/assessmentService';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Calendar as CalendarIcon, Clock, User, BadgeCheck, CheckCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AssessmentType } from '@/types/assessments';

interface AssessmentDetailsProps {
  assessmentId: string;
}

export const AssessmentDetails: React.FC<AssessmentDetailsProps> = ({ assessmentId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [isScheduling, setIsScheduling] = useState(false);

  const { data: assessment, isLoading } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () => fetchAssessmentById(assessmentId),
  });

  const getAssessmentTypeIcon = (type: AssessmentType) => {
    switch (type) {
      case 'skills':
        return <BadgeCheck className="h-5 w-5 me-2 text-[rgb(var(--pg-primary))]" />;
      case 'behaviors':
        return <User className="h-5 w-5 me-2 text-[rgb(var(--pg-secondary))]" />;
      case 'capabilities':
        return <CheckCircle className="h-5 w-5 me-2 text-[rgb(var(--pg-accent))]" />;
      default:
        return null;
    }
  };

  const getAssessmentTypeColor = (type: AssessmentType) => {
    switch (type) {
      case 'skills':
        return 'bg-[rgb(var(--pg-primary))/10] text-[rgb(var(--pg-primary))]';
      case 'behaviors':
        return 'bg-[rgb(var(--pg-secondary))/10] text-[rgb(var(--pg-secondary))]';
      case 'capabilities':
        return 'bg-[rgb(var(--pg-accent))/10] text-[rgb(var(--pg-accent))]';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const handleSchedule = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to schedule an assessment",
        variant: "destructive"
      });
      return;
    }

    if (!date) {
      toast({
        title: "Date required",
        description: "Please select a date for your assessment",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsScheduling(true);
      await scheduleAssessment(assessmentId, user.id);
      toast({
        title: "Assessment scheduled",
        description: `Your assessment has been scheduled for ${format(date, 'PPP')}`,
      });
      setDate(undefined);
    } catch (error) {
      console.error('Error scheduling assessment:', error);
      toast({
        title: "Error",
        description: "Failed to schedule assessment. You may have already scheduled this assessment.",
        variant: "destructive"
      });
    } finally {
      setIsScheduling(false);
    }
  };

  if (isLoading || !assessment) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgb(var(--pg-primary))]"></div>
      </div>
    );
  }

  return (
    <>
      <DialogHeader className="space-y-4">
        <div className="flex items-center">
          {getAssessmentTypeIcon(assessment.assessment_type)}
          <DialogTitle className="text-xl text-[rgb(var(--pg-primary))]">{assessment.title}</DialogTitle>
        </div>
        <Badge className={getAssessmentTypeColor(assessment.assessment_type)}>
          {assessment.assessment_type.charAt(0).toUpperCase() + assessment.assessment_type.slice(1)} Assessment
        </Badge>
        <DialogDescription className="text-base">
          {assessment.description}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-[rgb(var(--pg-primary))] text-lg">Assessment Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center p-3 bg-[rgb(var(--pg-primary))/5] rounded-lg">
                <Clock className="h-5 w-5 me-3 text-[rgb(var(--pg-primary))]" />
                <span className="font-medium">Duration:</span>
                <span className="ms-2">{assessment.duration_minutes ? `${assessment.duration_minutes} minutes` : 'Duration not specified'}</span>
              </div>
              <div className="flex items-center p-3 bg-[rgb(var(--pg-secondary))/5] rounded-lg">
                <BadgeCheck className="h-5 w-5 me-3 text-[rgb(var(--pg-secondary))]" />
                <span className="font-medium">Type:</span>
                <span className="ms-2">{assessment.assessment_type.charAt(0).toUpperCase() + assessment.assessment_type.slice(1)}</span>
              </div>
              <div className="flex items-center p-3 bg-[rgb(var(--pg-accent))/5] rounded-lg">
                {assessment.price_amount ? (
                  <>
                    <span className="font-medium text-[rgb(var(--pg-accent))]">Price: {assessment.price_amount} {assessment.price_currency}</span>
                  </>
                ) : (
                  <>
                    <Badge className="bg-[rgb(var(--pg-secondary))] text-white">Free Assessment</Badge>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-[rgb(var(--pg-primary))] text-lg">Skills Evaluated</h3>
            {assessment.skills_tested && assessment.skills_tested.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {assessment.skills_tested.map((skill) => (
                  <Badge 
                    key={skill} 
                    variant="outline" 
                    className="text-xs border-[rgb(var(--pg-secondary))] text-[rgb(var(--pg-secondary))] hover:bg-[rgb(var(--pg-secondary))] hover:text-white transition-colors"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">No specific skills listed</p>
            )}
          </div>
        </div>

        <Separator className="bg-[rgb(var(--pg-primary))/20]" />

        {assessment.requirements && (
          <div className="space-y-3">
            <h3 className="font-semibold text-[rgb(var(--pg-primary))] text-lg">Requirements</h3>
            <div className="p-4 bg-[rgb(var(--pg-primary))/5] rounded-lg border-s-4 border-[rgb(var(--pg-primary))]">
              <p className="text-sm">{assessment.requirements}</p>
            </div>
          </div>
        )}

        {user && (
          <>
            <Separator className="bg-[rgb(var(--pg-primary))/20]" />
            <div className="space-y-4">
              <h3 className="font-semibold text-[rgb(var(--pg-primary))] text-lg">Schedule Assessment</h3>
              <div className="p-4 bg-[rgb(var(--pg-secondary))/5] rounded-lg space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={cn(
                          "border-[rgb(var(--pg-primary))] text-[rgb(var(--pg-primary))] hover:bg-[rgb(var(--pg-primary))] hover:text-white",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="me-2 h-4 w-4" />
                        {date ? format(date, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={(date) => date < new Date() || date > new Date(new Date().setMonth(new Date().getMonth() + 3))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Button 
                    onClick={handleSchedule} 
                    disabled={!date || isScheduling}
                    className="bg-[rgb(var(--pg-secondary))] hover:bg-[rgb(var(--pg-secondary))/90]"
                  >
                    {isScheduling ? "Scheduling..." : "Schedule Assessment"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  You can schedule your assessment up to 3 months in advance.
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <DialogFooter>
        {!user && (
          <p className="text-sm text-muted-foreground me-auto">Sign in to schedule this assessment</p>
        )}
      </DialogFooter>
    </>
  );
};
